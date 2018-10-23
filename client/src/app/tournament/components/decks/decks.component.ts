import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { encode, decode } from "deckstrings";
import { Tournament } from '../../../models/tournament';
import { GLOBAL } from '../../../services/global';
import { TournamentService } from '../../../services/tournament.service';
import { UserService } from '../../../services/user.service';
import { MainComponent } from '../main/main.component';

@Component({
	selector: 'decks',
	templateUrl: './decks.component.html',
	providers: [TournamentService, UserService]
})

export class DecksComponent implements OnInit{
	public title: string;
	public token;
	public identity;
	public url: string;
	public status: string;
	public tournament: Tournament;
	public decks;
	public total_cards_in_set;
	public deckName;
	public deckCode;
	public deckByCode;

	constructor(
		private _http: HttpClient,
		private _route: ActivatedRoute,
		private _router: Router,
		private _tournamentService: TournamentService,
		private _userService: UserService,
		private _parentComponent: MainComponent
	){
		this.url = GLOBAL.url;
		this.token = this._userService.getToken();
		this.identity = this._userService.getIdentity();
		this.decks = [];
		this.total_cards_in_set = [];
		this.deckName = "";
		this.deckCode = "";
		this.deckByCode = [];
	}

	ngOnInit(){
		this.getTournament();
		this.getCards();
	}

	getDeckByCode(texto){
		this.deckByCode = [];
		var myRegex = texto.replace(/^#.*\n?/gm, '');
		var decoded;
		this.status = '';

		try {
    	decoded = decode(myRegex);

			decoded.cards.forEach(card => {
				let secondElement = this.total_cards_in_set.find(function(item){
					return item.dbFid == card[0];
				});

				if(secondElement != null){
					card.id = secondElement.id;
					card.name = secondElement.name;
					card.cost = secondElement.cost;
					card.rarity = secondElement.rarity;
				}
			});
			//console.log(decoded);
			decoded.cards.sort(this.compareValues("cost"));
			this.deckByCode = decoded;
		}
		catch(err) {
		    this.status = 'error';
		}

	}

	getCards(){
			let json_card_set = 'http://localhost:4200/assets/sobres/data/cards.collectible.json';

			this._http.get<any>(json_card_set).subscribe(
				data => {
					data.forEach(card => {
						//Ensure only expert cards from packs are added to each array
						if (card.collectible == true) {
							this.total_cards_in_set.push({dbFid: card.dbfId, id: card.id, name: card.name, cost: card.cost, rarity: card.rarity.toLowerCase()});
						}
					});

					this._tournamentService.getParticipant(this.token, this._parentComponent.tournamentId, this.identity._id).subscribe(
						response => {
							if(response.participant){
								//console.log(response.participant);
								this.decks = JSON.parse(response.participant.decks);

								this.decks.forEach(deckST => {
									deckST.deck = decode(deckST.code);
								});
								//console.log(this.decks);

								this.decks.forEach(deck => {
									deck.deck.cards.forEach(card => {
										let secondElement = this.total_cards_in_set.find(function(item){
											return item.dbFid == card[0];
										});

										if(secondElement != null){
											card.id = secondElement.id;
											card.name = secondElement.name;
											card.cost = secondElement.cost;
											card.rarity = secondElement.rarity;
										}
									});
									deck.deck.cards.sort(this.compareValues("cost"));
								});

							}
						},
						error => {
							var errorMessage = <any>error;
							if(errorMessage != null){
								this.status = 'error';
							}
						}
					);

				},
				err => {
					console.log(err);
				}
			);
	}

	// function for dynamic sorting
	compareValues(key, order='asc') {
	  return function(a, b) {
	    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
	      // property doesn't exist on either object
	        return 0;
	    }

	    const varA = (typeof a[key] === 'string') ?
	      a[key].toUpperCase() : a[key];
	    const varB = (typeof b[key] === 'string') ?
	      b[key].toUpperCase() : b[key];

	    let comparison = 0;
	    if (varA > varB) {
	      comparison = 1;
	    } else if (varA < varB) {
	      comparison = -1;
	    }
	    return (
	      (order == 'desc') ? (comparison * -1) : comparison
	    );
	  };
	}

	/**
	 * Function to sort alphabetically an array of objects by some specific key.
	 *
	 */
	dynamicSort(property) {
	    var sortOrder = 1;

	    if(property[0] === "-") {
	        sortOrder = -1;
	        property = property.substr(1);
	    }

	    return function (a,b) {
	        if(sortOrder == -1){
	            return b[property].localeCompare(a[property]);
	        }else{
	            return a[property].localeCompare(b[property]);
	        }
	    }
	}

	getTournament(){
		this._tournamentService.getTournament(this.token, this._parentComponent.tournamentId).subscribe(
			response => {
				if(response.tournament){
				      this.tournament = response.tournament;
				}
				else{
				      this.status = 'error';
				}
			},
			error => {
				var errorMessage = <any>error;

				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

	onSubmitDeck(form, event){
		//let textchat = (document.getElementById("textChat") as HTMLTextAreaElement).value;
		let name = (<HTMLInputElement>document.getElementById("name")).value;
		let deckCode = (<HTMLInputElement>document.getElementById("code")).value.replace(/^#.*\n?/gm, '');
		//quitamos el retorno de línea restante
		deckCode = deckCode.replace(/\n?/gm, '');
		if (deckCode.indexOf('/') > 0) {
		  deckCode = deckCode.replace('/', '\\/');
		}

		this._tournamentService.addDeckTournament(this.token, this._parentComponent.tournamentId, name, deckCode).subscribe(
			response => {
				if(response.deck){
					//console.log(response.deck);
					this.decks.push({name: response.deck.name, code: response.deck.code});
					form.reset();
					this.deckByCode = [];
					//conseguimos los participantes actuales del torneos
					this._parentComponent.getParticipants();
				}
			},
			error => {
				var errorMessage = <any>error;
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

}
