import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Tournament } from '../../../models/tournament';
import { Participant } from '../../../models/participant';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { TournamentService } from '../../../services/tournament.service';
import { MainComponent } from '../main/main.component';
import * as io from 'socket.io-client';

@Component({
	selector: 'detail',
	templateUrl: './detail.component.html',
	providers: [UserService, TournamentService]
})

export class DetailComponent implements OnInit{
	public title: string;
	public env: string;
	public identity;
	public token;
	public url: string;
	public status: string;
	public tournament: Tournament;
	public chatHistory;
	public socket;
	public ws: boolean;

	constructor(

		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
		private _tournamentService: TournamentService,
    public _parentComponent: MainComponent
	){
		this.title = 'Torneo';
		this.env = GLOBAL.env;
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
		this.ws = true;
	}

	ngOnInit(){
		var room = this._parentComponent.tournamentId;
		//console.log('detail.component cargado');
    //console.log('asdasd11 ' + this.tournamentIdFromParent);
    this.getTournament();


		if(this.ws){
			//inicializamos el websocket para el chat
			console.log("|" + this.env + "|");
			if(this.env == 'DE'){
				this.socket = io('http://localhost:3800');
			}
			else{
				this.socket = io('https://roedor.net');
			}
			//var socket = io('http://localhost:3800/tournamentHS');
			this.socket.on('connectToRoom',function(room) {
	       console.log(room);
	    });
			this.socket.on('new-chat', (chat) => {
				 this.chatHistory.push(chat.chat);
				 $('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);
	    });
		}

		$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);

	}

	getTournament(){
		this._tournamentService.getTournament(this.token, this._parentComponent.tournamentId).subscribe(
			response => {
				if(response.tournament){
				      this.tournament = response.tournament;
							if(this.tournament.chat){
								this.chatHistory = JSON.parse(this.tournament.chat);
							}
							else{
								this.chatHistory = [{user: "Roedor.net", text: "Bienvenido al chat del torneo. No te cortes y habla con el resto de gente.", date: this.tournament.start_date}];
							}
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

	onSubmit(form, event){
		let textchat = (document.getElementById("textChat") as HTMLTextAreaElement).value;
		this._tournamentService.addChatTournament(this.token, this._parentComponent.tournamentId, textchat).subscribe(
			response => {
				if(response.chat){
					this.socket.emit('new-chat', response.chat);
					this.chatHistory.push(response.chat);
					$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);
					//scroll automático con jquery
					//console.log(response.chat);
					//this._router.navigate(['/tournament/' + this._parentComponent.tournamentId + '/lobby']);
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
