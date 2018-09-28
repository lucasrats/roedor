import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Tournament } from '../../../models/tournament';
import { Participant } from '../../../models/participant';
import { Match } from '../../../models/match';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { TournamentService } from '../../../services/tournament.service';
import { MatchService } from '../../../services/match.service';
import { MainComponent } from '../main/main.component';

@Component({
	selector: 'bracket',
	templateUrl: './bracket.component.html',
	providers: [UserService, TournamentService, MatchService]
})

export class BracketComponent implements OnInit{
	public title: string;
	public identity;
	public token;
	public url: string;
  public status;
	public tournament: Tournament;
	public matches: Match[];
	public participants;
	public isBeingModified;
	public data: Match;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
		private _tournamentService: TournamentService,
		private _matchService: MatchService,
    private _parentComponent: MainComponent

	){
		this.title = 'Resultados';
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
		this.isBeingModified = false;
		//this.tournament = new Tournament();
	}

	ngOnInit(){
    this.getTournament();
		this.getMatches();
		this.getStandings();
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
				console.log(errorMessage);
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

	getMatches(){
		this._tournamentService.getMatches(this.token, this._parentComponent.tournamentId).subscribe(
			response => {
				if(response.matches){
					console.log(response.matches);
				      this.matches = response.matches;
							this.matches.map(row => {
				        row.isEditable = false;
				      });
				}
				else{
				      this.status = 'error';
				}
			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

	getStandings(){
		this._tournamentService.getStandings(this.token, this._parentComponent.tournamentId).subscribe(
			response => {
				if(response.standings){
				      this.participants = response.standings;
				}
				else{
				      this.status = 'error';
				}
			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

	editRow(row) {
		this.matches.map(row => {
			row.isEditable = false;
		});
		this.matches[row].isEditable = true;
		//copiamos por valor
		this.data = JSON.parse(JSON.stringify(this.matches[row]));
  }

	saveRow(row){
		this.matches[row].status = 4;
		//persistimos los cambios
		this._matchService.sendResult(this.token, this.data._id, this.data).subscribe(
			response => {
				if(!response.match){
					this.status = 'error';
				}else{
					this.matches[row].homeScore = response.match.homeScore;
					this.matches[row].awayScore = response.match.awayScore;
					this.matches[row].status = response.match.status;
					this._matchService.addChatMatch(this.token, this.matches[row]._id, 'El administrador ' + this.identity.nick + ' ha enviado el resultado de ' + this.data.homeScore + " - " + this.data.awayScore, true).subscribe(
						response => {
							if(response.chat){
								this.status = 'success';
								this.matches[row].isEditable = false;
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
			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);

				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
  }

	cancelRow(row) {
		this.data = null;
		this.matches[row].isEditable = false;
  }

}
