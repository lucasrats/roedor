import { Component, OnInit, DoCheck } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Participant } from '../../../models/participant';
import { Tournament } from '../../../models/tournament';
import { TournamentService } from '../../../services/tournament.service';
import { UserService } from '../../../services/user.service';

@Component({
	selector: 'main',
	templateUrl: './main.component.html',
	providers: [UserService, TournamentService]
})
export class MainComponent implements OnInit{

	public tournamentId;
	public token;
	public identity;
	//public participant: boolean;
	public participant: Participant;
	public manageTournament: boolean;
	public status: string;
	public tournament: Tournament;
	public matchesLeftNextRound: number;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
		public _tournamentService: TournamentService

	){
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.matchesLeftNextRound = 0;
		//this.tournament = new Tournament();
	}

	ngOnInit(){

		//console.log('main11.component cargado');
		this.actualTournament();
		this.getTournament();
		//comprobamos si está apuntado al torneo
		//this.isParticipant();
		this.getParticipant();

		this.isAdminTournament();

		//conseguimos los participantes actuales del torneos
		this.getParticipants();

	}

	getParticipants(){
		this._tournamentService.getParticipants(this.token, this.tournamentId).subscribe(
			response => {
				if(response.participants){
					this._tournamentService.participants = response.participants;
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

	getParticipant(){
		this._tournamentService.getParticipant(this.token, this.tournamentId, this.identity._id).subscribe(
			response => {
				if(response.participant){
					this.participant = response.participant;
					this._tournamentService.packs = this.participant.packs;
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

	getTournament(){
		this._tournamentService.getTournament(this.token, this.tournamentId).subscribe(
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

	actualTournament(){
		this._route.params.subscribe(params => {
			let tournamentId;
			if(!params['id']){
				tournamentId = '';
			}
			else{
				tournamentId = params['id'];
			}

			this.tournamentId = tournamentId;

		});
	}

	isParticipant(){
		this._tournamentService.getIsJoined(this.token, this.tournamentId).subscribe(
			response => {
				if(response.joined == true){
						//this.participant = true;
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

	joinTournament(){

		this._tournamentService.joinTournament(this.token, this.tournamentId).subscribe(
			response => {
				if(response.participant){
					this.status = 'success';
					this.participant = response.participant;
					//this.refresh();
					this.getParticipants();
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

	unjoinTournament(){
		this._tournamentService.unjoinTournament(this.token, this.tournamentId).subscribe(
			response => {
				if(response.participant){
					this.status = 'success';
					this.participant = null;
					//actualizamos el participants
					this.getParticipants();
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

	isAdminTournament(){
		this._tournamentService.getIsAdminTournament(this.token, this.tournamentId).subscribe(
			response => {
				if(response.isAdminTournament == true){
					this.manageTournament = true;
					//solo admin torneo, comprobamos si quedan partidos por disputarse de la ronda activa, para desactivar el botón de Siguiente Ronda
					this.getMatchesLeft();
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

	startTournament(){
		this._tournamentService.startTournament(this.token, this.tournamentId).subscribe(
			response => {
				if(response){
				      this.status = 'success';
							this.tournament.active = true;
							//this.actualRound = 1;
							//TODO debería llevarte a /bracket sin click?
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

	nextRound(){
		this._tournamentService.nextRound(this.token, this.tournamentId).subscribe(
			response => {
				if(response){
				      this.status = 'success';
							//this.actualRound = response.round;
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

	getMatchesLeft(){
		if(this.manageTournament){
			this._tournamentService.getMatches(this.token, this.tournamentId).subscribe(
				response => {
					if(response.matches){
						response.matches.map(row => {
							if(row.status < 4){
								this.matchesLeftNextRound++;
							}
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
		}
	}

}
