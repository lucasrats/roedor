import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Tournament } from '../../../models/tournament';
import { Participant } from '../../../models/participant';
import { User } from '../../../models/user';
import { Card } from '../../../models/card';
import { GLOBAL } from '../../../services/global';
import { MainComponent } from '../main/main.component';
import { UserService } from '../../../services/user.service';
import { TournamentService } from '../../../services/tournament.service';

@Component({
	selector: 'packs',
	templateUrl: './packs.component.html',
	providers: [UserService, TournamentService]
})

export class PacksComponent implements OnInit{
	public title: string;
	public env: string;
	public user: User;
  public participant: Participant;
	public status: string;
	public identity;
	public token;
	public url;
	public packs;
	public basics;
	public common;
	public rare;
	public epic;
	public legendary;

	public common_name;
	public rare_name;
	public epic_name;
	public legendary_name;

	public json_card_set;
	public total_cards_in_set;
	public json_cards_pool;
	public json_cards_pool_to_send
	public actualPack;

	public cards_shown;


	constructor(
		private _http: HttpClient,
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
    private _parentComponent: MainComponent,
    public _tournamentService: TournamentService
	){
		this.title = 'Perfil';
		this.env = GLOBAL.env;
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
		this.packs = this._tournamentService.packs;
		this.basics = [];
		this.common = [];
		this.rare = [];
		this.epic = [];
		this.legendary = [];
		this.common_name = [];
		this.rare_name = [];
		this.epic_name = [];
		this.legendary_name = [];
		//CUIDADO CON EL HTTP Y HTTPS
		if(this.env == 'DE'){
			this.json_card_set = 'http://localhost:4200/assets/sobres/data/cards.collectible_es_ES.json';
		}
		else{
			this.json_card_set = 'https://roedor.net/assets/sobres/data/cards.collectible_es_ES.json';
		}
		this.total_cards_in_set = [];
		this.actualPack = [];
    this.json_cards_pool = [];
		this.json_cards_pool_to_send = [];
	}

	ngOnInit(){

    this.getParticipant();
    //console.log(this._tournamentService.packs);

		//this.json_cards_pool = JSON.parse('[{"dbfId": 2539, "id": "AT_001", "name": "Lanza de llamas",	"quantity": 1}, {"dbfId": 2541, "id": "AT_002", "name": "Efigie", "quantity": 2}]');

		var url_pack = '{{site.uri.public}}/torneo/p/{{tournament.id}}';

		$("body").on("click", ".cardPack", function() {
		  $(this).addClass("aberto");
		  $(this).removeClass("fechado");
		});


/*
		var sort_by = function(field, reverse, primer){

		   var key = primer ?
		       function(x) {return primer(x[field])} :
		       function(x) {return x[field]};

		   reverse = !reverse ? 1 : -1;

		   return function (a:<Number>, b) {
		       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
		     }
		}
*/

	}

	openPack(){
		this.cards_shown = 0;
		$(".cardPack").show();
		$('#newPack').prop( "disabled", true );
		this.buildCardArrays();
		this._tournamentService.packs--;
	}

	buildCardArrays() {

		var image_prefix = "https:\/\/art.hearthstonejson.com\/v1\/render\/latest\/enUS\/256x\/";
		//var image_prefix = "http:\/\/media.services.zam.com\/v1\/media\/byName\/hs\/cards\/enus\/";
		var image_postfix = ".png";

		var image_tiles = "https://art.hearthstonejson.com/v1/tiles/CS2_084.png";
		//Get five new card rolls
		var rolls = this.getCardDistribution();
		var jsonCards;

		//If the card arrays aren't already filled...
		if (!this.common.length) {

		this._http.get<any>(this.json_card_set).subscribe(
			data => {
				data.forEach(card => {
					//de cara al envío de decks, tenemos que separar las básicas
					if(card.rarity == 'FREE' && card.type != 'HERO'){
						this.basics.push({'name': card.name, 'dbfId': card.dbfId, 'rarity': card.rarity});
					}
					//Ensure only expert cards from packs are added to each array
					if (card.collectible == true) {
						if (card.rarity == 'COMMON') {
							this.common.push({'url': image_prefix + card.id + image_postfix, 'cost': card.cost, 'dbfId': card.dbfId, 'rarity': card.rarity});
							this.common_name.push(card.name);

							for(var x=0; x<2; x++)
							{
								this.total_cards_in_set.push([card.name, card.rarity, card.cost, card.dbfId, card.rarity]);
							}

							//alert(image_prefix + cards.id);
						}
						else if (card.rarity == 'RARE') {
							this.rare.push({'url': image_prefix + card.id + image_postfix, 'cost': card.cost, 'dbfId': card.dbfId, 'rarity': card.rarity});
							this.rare_name.push(card.name);

							for(var x=0; x<2; x++)
							{
								this.total_cards_in_set.push([card.name, card.rarity, card.cost, card.dbfId, card.rarity]);
							}
						}
						else if (card.rarity == 'EPIC') {
							this.epic.push({'url': image_prefix + card.id + image_postfix, 'cost': card.cost, 'dbfId': card.dbfId, 'rarity': card.rarity});
							this.epic_name.push(card.name);

							for(var x=0; x<2; x++)
							{
								this.total_cards_in_set.push([card.name, card.rarity, card.cost, card.dbfId, card.rarity]);
							}
						}
						else if (card.rarity == 'LEGENDARY') {
							this.legendary.push({'url': image_prefix + card.id + image_postfix, 'cost': card.cost, 'dbfId': card.dbfId, 'rarity': card.rarity});
							this.legendary_name.push(card.name);

							this.total_cards_in_set.push([card.name, card.rarity, card.cost, card.dbfId, card.rarity]);
						}
					}
				});
				//console.log(this.total_cards_in_set);
				//Pass all this data to getCards which will determine quality and build the image URLs
				//console.log(this.basics);
				this.getCards(rolls, this.common, this.rare, this.epic, this.legendary);

			},
			err => {
				console.log(err);
			}
		);

					/*
				}
			});
*/
			//Otherwise, just proceed to getCards with the new rolls
		} else {
			this.getCards(rolls, this.common, this.rare, this.epic, this.legendary)
		}
	}

	getCardDistribution() {

		//Initialize rolls array and set a flag for 'special' (rare or better) cards
		var rolls = [],
			special;

		//Loop to get 5 random integers between 1 and 100
		for (var i = 0; i < 5; i++) {
			rolls[i] = this.getRandomInt(1, 100);
			if (rolls[i] > 74) {
				special = true;
			}

			// Kludge to guarantee a rare that is also outside the range of epic or legendary
			if (i == 4 && !special) {
				rolls[i] += 100;
			}
		}

		//Randomizes the roll order so the fifth card isn't usually the best
		return this.shuffle(rolls);
	}

	//Function for getting a random number between 'min' and 'max'
	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	//Function for randomizing the order of items in an array
	shuffle(o) {
		for (var j, x, i = o.length; i; j = parseInt((Math.random() * i).toString()), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	}


	//Function to do a string replacement on a portion of the image URL to show a golden card instead
	goldenUpgrade(idText, find, replace) {
		var replaceString = idText;
		for (var i = 0; i < find.length; i++) {
			replaceString = replaceString.replace(find[i], replace[i]);
		}
		return replaceString;
	}

	//Function to determine the cards themselves and whether they are gold
	getCards(rolls, common, rare, epic, legendary) {
		var normal = ['/medium/', '.png'],
			golden = ['/animated/', '_premium.gif'],
			quality = [],
			cards = [];

		//Loop through all five card rolls
		for (var i = 0; i < rolls.length; i++) {
			var tempCard;

			//If the card's roll is in the range of 1-74 (74% chance), it's a common
			if (rolls[i] < 75) {

				//Get the appropriate image URL from the common array
				var common_index = Math.floor(Math.random() * common.length);
				tempCard =  common[common_index];
				//tempCard = common[Math.floor(Math.random() * common.length)];
				/*
				for(var x=0; x< this.total_cards_in_set.length; x++)
				{
					if(this.total_cards_in_set[x].name == this.common_name[common_index])
					{
						this.total_cards_in_set.splice(x,1);
						break;
					}
				}
				*/
				//Do a roll to determine if the common is golden (supposedly 1/50 cards, 1/10 packs, or 2% overall)
				//If you get 3.7 commons per pack, and 10 packs is 37 commons, then 1 out of 37 should be golden (i.e. ~2.7% of commons are golden)
        /*
				if (this.getRandomInt(1, 37) == 37) {
					quality[i] = 'golden_common',
					cards[i] = this.goldenUpgrade(tempCard, normal, golden);
				} else {
					quality[i] = 'common';
					cards[i] = tempCard;
				}
        */
        quality[i] = 'common';
        cards[i] = tempCard;
			}

			//If the card's roll is in the range of 75-95 (21% chance), it's a rare
			//If the card's roll is greater than 100, it's also a rare due to the guarantee
			if ((rolls[i] > 74 && rolls[i] < 96) || rolls[i] > 100) {
				var rare_index = Math.floor(Math.random() * rare.length);
				tempCard = rare[rare_index];
				//tempCard = rare[Math.floor(Math.random() * rare.length)];
				/*
				for(var x=0; x< this.total_cards_in_set.length; x++)
				{
					if(this.total_cards_in_set[x].name == this.rare_name[rare_index])
					{
						this.total_cards_in_set.splice(x,1);
						break;
					}
				}
				*/
				//Do a roll to determine if the rare is golden (supposedly 1/100 cards, 1/20 packs, or 1% overall)
				//If you get roughly 1.1 rares per pack, and 20 packs is 22 rares, then 1 out of 22 should be golden (i.e. ~4.55% of rares are golden)
				//But then there's the 'rare guarantee,'' which skews this, so I'm arbitrarily lowering chances by ~25%... sigh...
        /*
				if (this.getRandomInt(1, 28) == 28) {
					quality[i] = 'golden_rare',
					cards[i] = this.goldenUpgrade(tempCard, normal, golden);
				} else {
					quality[i] = 'rare';
					cards[i] = tempCard;
				}
        */
        quality[i] = 'rare';
        cards[i] = tempCard;
			}

			//If the card's roll is in the range of 96-99 (4% chance), it's an epic
			if (rolls[i] > 95 && rolls[i] < 100) {
				var epic_index = Math.floor(Math.random() * epic.length);
				tempCard = epic[epic_index];
				//tempCard = epic[Math.floor(Math.random() * epic.length)];
				/*
				for(var x=0; x<this.total_cards_in_set.length; x++)
				{
					if(this.total_cards_in_set[x].name == this.epic_name[epic_index])
					{
						this.total_cards_in_set.splice(x,1);
						break;
					}
				}
				*/
				//Do a roll to determine if the epic is golden (supposedly 1/400 cards, 1/80 packs, or 0.25% overall)
				//If you get roughly 0.2 epics per pack, and 80 packs is 16 epics, then 1/16 should be golden (i.e. ~6.25% of epics are golden)
        /*
				if (this.getRandomInt(1, 16) == 16) {
					quality[i] = 'golden_epic',
					cards[i] = this.goldenUpgrade(tempCard, normal, golden);
				} else {
					quality[i] = 'epic';
					cards[i] = tempCard;
				}
        */
        quality[i] = 'epic';
        cards[i] = tempCard;
			}

			//If the card's roll is a perfect 100 (1% chance), it's a legendary
			if (rolls[i] == 100) {
				var legendary_index = Math.floor(Math.random() * legendary.length);
				tempCard = legendary[legendary_index];
				//tempCard = legendary[Math.floor(Math.random() * legendary.length)];
				/*
				for(var x=0; x<this.total_cards_in_set.length; x++)
				{
					if(this.total_cards_in_set[x].name == this.legendary_name[legendary_index])
					{
						this.total_cards_in_set.splice(x,1);
						break;
					}
				}
				*/
				//Do a roll to determine if the legendary is golden (supposedly 1/2000 cards, 1/400 packs, or 0.05% overall)
				//If you get roughly 0.05 legendaries per pack, and 400 packs is 20 legendaries, then 1/20 should be golden (i.e. ~5% of legendaries are golden)
        /*
				if (this.getRandomInt(1, 20) == 20) {
					quality[i] = 'golden_legendary',
					cards[i] = this.goldenUpgrade(tempCard, normal, golden);
				} else {
					quality[i] = 'legendary';
					cards[i] = tempCard;
				}
        */
        quality[i] = 'legendary';
        cards[i] = tempCard;
			}

		};

		//Send these results to the drawCards function, which will place the respective cards on the DOM
		this.drawCards(quality, cards);
	}

	drawCards(quality, cards) {

		var arr_pack = [];
		this.json_cards_pool_to_send = JSON.parse(JSON.stringify(this.json_cards_pool));

	  //for (let i = 0; i < cards.length; i++) {
		cards.forEach(card => {

			//var cardCut = cards[i].url.substring(cards[i].url.lastIndexOf("/") + 1, cards[i].url.lastIndexOf("."));
			var cardCut = card.url.substring(card.url.lastIndexOf("/") + 1, card.url.lastIndexOf("."));
			arr_pack.push(cardCut);

			var found = false;

			this.json_cards_pool_to_send.forEach(cardPool => {
				if(cardPool.id == cardCut){
					cardPool.quantity++;
					found = true;
				}
			});

			if(found == false){
				this.json_cards_pool_to_send.push({'id': cardCut, 'quantity': 1, 'cost': card.cost, 'dbfId': card.dbfId, 'rarity': card.rarity});
			}
		});
		this.json_cards_pool_to_send.sort((a, b) => parseInt(a.cost) - parseInt(b.cost));
		//mandamos las cartas al json de la BD
		this._tournamentService.addPackTournament(this.token, this._parentComponent.tournamentId, this.json_cards_pool_to_send).subscribe(
			response => {
				if(response.poolUpdated){
					//console.log(response.deck);
					//this.json_cards_pool = response.poolUpdated;
				}
			},
			error => {
				var errorMessage = <any>error;
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);

		this.actualPack = JSON.parse(JSON.stringify(arr_pack));

		//For each element with the 'card' class, replace its front-facing image with one of the new URLs
		$(".front", ".pack").each(function(i, card){
			$(card).css("background-image", "url(" + cards[i].url + ")");
			$(card).parent().attr("class", "cardPack fechado");
			//necesito poner la rareza en el class para el brillo???
			$(card).parent().addClass(quality[i]);
	  });

		this.cardInteraction(quality);

	}

	clickCard(){
		this.cards_shown++;

		if(this.cards_shown > 4){
			this.json_cards_pool = JSON.parse(JSON.stringify(this.json_cards_pool_to_send));
		}

	}

	find_in_object(my_object, my_criteria){

	  return my_object.filter(function(obj) {
	    return Object.keys(my_criteria).every(function(c) {
	      return obj[c] == my_criteria[c];
	    });
	  });

	}

	cardInteraction(quality) {

		//This variable will count the number of cards that have been clicked/shown each pack
		var cards_shown = 0;

		//For each card...
		$('.cardPack').each(function(i) {

			//Start by clearing this card's flags
			this.turned = false, this.clicked = false;

			//Get this particular card's rarity
			var card_rarity;
			if (quality[i].indexOf('common') != -1)
				card_rarity = 'common';
			if (quality[i].indexOf('rare') != -1)
				card_rarity = 'rare';
			if (quality[i].indexOf('epic') != -1)
				card_rarity = 'epic';
			if (quality[i].indexOf('legendary') != -1)
				card_rarity = 'legendary';

			//When a card is clicked...
			$(this).unbind('mousedown').mousedown(function(e) {

				//Set some flags for the element to prevent subsequent clicks and sound plays
				this.turned = true, this.clicked;
				if (this.turned && !this.clicked) {

					//Flag that the element has been clicked, and increment cards_shown
					this.clicked = true, cards_shown++;

					$(this).removeClass(quality[i]);

					//If all five cards have been revealed...
					if (cards_shown > 4) {
						$('#newPack').prop( "disabled", false );
					}

					//Determine which side of the card the user clicked on
					var cardX = e.pageX - $(this).offset().left;
					if (cardX < 116) {
						//Have it turn from the left
						var backDir = '-180deg',
							frontDir = '0deg';
					} else {
						//Have it turn from the right
						var backDir	= '180deg',
							frontDir = '360deg';
					}

					//Turn the card around
					$('div.back', this).css({
						'transform': 'perspective(1000px) rotateY('+backDir+')',
						'-webkit-transform': 'perspective(1000px) rotateY('+backDir+')',
						//'-webkit-filter': 'drop-shadow(0 0 3px white)',
						'transition': 'transform 800ms ease-in-out 300ms',
						'-webkit-transition': '-webkit-transform 800ms ease-in-out 300ms'
						//'-webkit-transition': '-webkit-filter 1667ms 333ms'
					});
					$('div.front', this).css({
						'transform': 'perspective(1000px) rotateY('+frontDir+')',
						'-webkit-transform': 'perspective(1000px) rotateY('+frontDir+')',
						//'-webkit-filter': 'drop-shadow(0 0 0 white)',
						'transition': 'transform 800ms ease-in-out 300ms',
						'-webkit-transition': '-webkit-transform 800ms ease-in-out 300ms'
						//'-webkit-transition': '-webkit-filter 333ms 1667ms'
					});
					$('.card_glow', this).css({
						'box-shadow': 'none',
						'transition': 'box-shadow 600ms',
						'-webkit-transition': 'box-shadow 600ms'
					});

				}

			});

		});

	}

  getParticipant(){
		this._tournamentService.getParticipant(this.token, this._parentComponent.tournamentId, this.identity._id).subscribe(
			response => {
				if(response.participant){
					this.participant = response.participant;
          this._tournamentService.packs = this.participant.packs;
          if(this.participant.cards_pool){
            this.json_cards_pool = JSON.parse(this.participant.cards_pool);
          }
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
