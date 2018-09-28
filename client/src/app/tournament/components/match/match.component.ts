import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Tournament } from '../../../models/tournament';
import { Participant } from '../../../models/participant';
import { Match } from '../../../models/match';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { TournamentService } from '../../../services/tournament.service';
import { MatchService } from '../../../services/match.service';
import { MainComponent } from '../main/main.component';
import { AppComponent	} from '../../../app.component';
import * as io from 'socket.io-client';

@Component({
	selector: 'match',
	templateUrl: './match.component.html',
	providers: [UserService, TournamentService, MatchService]
})

export class MatchComponent implements OnInit{
	public title: string;
	public env: string;
	public identity;
	public token;
	public url: string;
	public status: string;
	public match: Match;
  public matchId: string;
	public chatHistory;
	public socket;
	public ws: boolean;
	public classes;
	public countClasses;
	public countBans;
	public opponentClasses;
	private homeClassesFinal;
	private awayClassesFinal;

	constructor(

		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
		private _tournamentService: TournamentService,
    private _matchService: MatchService,
    private _parentComponent: MainComponent,
		private _appComponent: AppComponent
	){
		this.title = 'Partido';
		this.env = GLOBAL.env;
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
		this.ws = true;
		this.classes = [{"name":"brujo"},
	     							{"name":"cazador"},
	     							{"name":"chaman"},
	     							{"name":"druida"},
										{"name":"guerrero"},
										{"name":"mago"},
										{"name":"paladin"},
										{"name":"picaro"},
										{"name":"sacerdote"}
									];
		this.classes.forEach(item => {
      item['checked']=false;
    });
		this.countClasses = 0;
		this.countBans = 0;
		this.opponentClasses = [];
		this.homeClassesFinal = [];
		this.awayClassesFinal = [];
		this.chatHistory = [];
	}

	ngOnInit(){
		var room = this.matchId;
    this.actualMatch();
    this.getMatch();

		if(this.ws){
			//inicializamos el websocket para el chat
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

			this.socket.on('opponent-confirm', () => {
				 if(this.identity._id == this.match.home._id){
					 this.match.awayAccept = true;
				 }
				 else{
					 this.match.homeAccept = true;
				 }
				 //si el contrincante confirma el segundo, habrá que cambiar el status también
				 if(this.match.homeAccept && this.match.awayAccept){
					 this.getMatch();
				 }
	    });

			this.socket.on('opponent-classes', () => {
				 if(this.match.status == 2){
					 this.getMatch();
				 }
	    });

			this.socket.on('opponent-bans', () => {
				 if(this.match.status == 3){
					 this.getMatch();
				 }
	    });

			this.socket.on('new-notification', (type_notification) => {
				console.log("Me llega una " + type_notification);
				this._appComponent.notificationCount = 1;
				this._appComponent.notifications.push();
	    });

		}

		$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);

	}

  getMatch(){
		this._matchService.getMatch(this.token, this.matchId).subscribe(
			response => {
				if(response.match){
							let metadata = <any>{};

				      this.match = response.match;
							if(this.match.chat){
								this.chatHistory = JSON.parse(this.match.chat);
							}

							if(this.match.metadata){
								metadata = JSON.parse(this.match.metadata);
							}
							//console.log(this.match.metadata);
							//según sea home o away, tildamos los checks
							if(this.match.status >= 3){
								//pillamos las clases finales de cada uno
								for (var key in metadata.homeClassesFinal) {
										this.homeClassesFinal.push(metadata.homeClassesFinal[key]);
								}
								for (var key in metadata.awayClassesFinal) {
										this.awayClassesFinal.push(metadata.awayClassesFinal[key]);
								}

							}else if(this.identity._id == this.match.home._id){

								//home
								if(metadata.homeClasses && !metadata.homeClassesBan){
									this.classes.forEach(item => {
										if(Object.values(metadata.homeClasses).includes(item.name)){
							      	item['checked']=true;
											this.countClasses++;
										}
										//$('input[ng-reflect-name^=' + item.name + ']').prop('disabled', true);
							    });
									if(metadata.awayClasses){
										for (var key in metadata.awayClasses) {
										    this.opponentClasses.push({"name": metadata.awayClasses[key], "checked": false});
										}
									}
								}
							}else{

								//away
								if(metadata.awayClasses && !metadata.awayClassesBan){
									this.classes.forEach(item => {
										if(Object.values(metadata.awayClasses).includes(item.name)){
							      	item['checked']=true;
											this.countClasses++;
										}
										//$('input[ng-reflect-name^=' + item.name + ']').prop('disabled', true);
							    });
									if(metadata.homeClasses){
										for (var key in metadata.homeClasses) {
										    this.opponentClasses.push({"name": metadata.homeClasses[key], "checked": false});
										}
									}
								}
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

	confirmMatch(){
		this._matchService.confirmMatch(this.token, this.matchId).subscribe(
			response => {
				if(response){
							this.match = response.match;
							//lanzar el OK al ws del partido
							this.socket.emit('opponent-confirm');
							this._matchService.addChatMatch(this.token, this.matchId, 'El usuario ' + this.identity.nick + ' ha aceptado el partido.', true).subscribe(
								response => {
									if(response.chat){
										this.status = 'success';
										this.socket.emit('new-chat', response.chat);
										this.chatHistory.push(response.chat);
										$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);

										//si somos el segundo en aceptar el partido, recargamos
					 				 if(this.match.homeAccept && this.match.awayAccept){
					 					 this.getMatch();
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

  actualMatch(){
		this._route.params.subscribe(params => {
			let matchId;
			if(!params['match']){
				matchId = '';
			}
			else{
				matchId = params['match'];
			}

			this.matchId = matchId;

		});
	}

	changed(){
		this.countClasses = 0;
    this.classes.forEach(item => {
      if(item.checked){
        this.countClasses++;
      }
    });
		//desactivamos los checks si ha seleccionado ya suficientes
		if(this.countClasses == this.match.tournament.bo){
			$('#submitClasses').prop('disabled', false);
			this.classes.forEach(item => {
	      if(!item.checked){
	        $('input[ng-reflect-name^=' + item.name + ']').prop('disabled', true);
	      }
	    });
		}
		else{
			this.classes.forEach(item => {
	    	$('input[ng-reflect-name^=' + item.name + ']').prop('disabled', false);
	    });
		}
  }

	bansChanged(){
		this.countBans = 0;
    this.opponentClasses.forEach(item => {
      if(item.checked){
        this.countBans++;
      }
    });
		//desactivamos los checks si ha seleccionado ya suficientes
		if(this.countBans == this.match.tournament.bans){
			$('#submitClasses').prop('disabled', false);
			this.classes.forEach(item => {
	      if(!item.checked){
	        $('input[ng-reflect-name^=' + item.name + ']').prop('disabled', true);
	      }
	    });
		}
		else{
			this.classes.forEach(item => {
	    	$('input[ng-reflect-name^=' + item.name + ']').prop('disabled', false);
	    });
		}
  }

	onSubmit(form, event){
		let textchat = (document.getElementById("textChat") as HTMLTextAreaElement).value;
		this._matchService.addChatMatch(this.token, this.matchId, textchat).subscribe(
			response => {
				if(response.chat){
					this.socket.emit('new-chat', response.chat);
					this.chatHistory.push(response.chat);
					$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);
					//scroll automático con jquery
					//console.log(response.chat);
					//this._router.navigate(['/tournament/' + this._parentComponent.tournamentId + '/lobby']);

					//notificamos al adversario por si está en línea
					this.socket.emit('new-notification', 'new_chat_match');
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

	sendClasses(){

		let classesSelect = {};

		//this.classes.forEach(item => {
		this.classes.forEach(function(item, i){
			if(item.checked){
					classesSelect[i] = item.name;
			}
		});
		//console.log(classesSelect);
		this._matchService.classesSelect(this.token, this.matchId, classesSelect).subscribe(
			response => {
				if(response){
					this.match = response.match;

					//deshabilitamos todo y escondemos botón
					this.classes.forEach(item => {
			    	$('input[ng-reflect-name^=' + item.name + ']').prop('disabled', true);
						$('#submitClasses').hide();
			    });

					this.socket.emit('opponent-classes');
					this.getMatch();

					this._matchService.addChatMatch(this.token, this.matchId, 'El usuario ' + this.identity.nick + ' ha seleccionado sus clases', true).subscribe(
						response => {
							if(response.chat){
								this.status = 'success';
								this.socket.emit('new-chat', response.chat);
								this.chatHistory.push(response.chat);
								$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);
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
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

	sendBans(){

		let classesBans = {};

		this.opponentClasses.forEach(function(item, i){
			if(item.checked){
					classesBans[i] = item.name;
			}
		});
		this._matchService.classesBan(this.token, this.matchId, classesBans).subscribe(
			response => {
				if(response){
					this.match = response.match;

/*
					if(this.identity._id == this.match.home._id){
						this.opponentClasses = JSON.parse(this.match.metadata.awayClassesBan);
						this.opponentClasses.forEach(item => {
				      item['checked']=false;
				    });
					}else{
						this.opponentClasses = JSON.parse(this.match.metadata.homeClassesBan);
						this.opponentClasses.forEach(item => {
				      item['checked']=false;
				    });
					}
*/
					//deshabilitamos todo y escondemos botón

					this.socket.emit('opponent-bans');
					this.getMatch();

					this._matchService.addChatMatch(this.token, this.matchId, 'El usuario ' + this.identity.nick + ' ha baneado las clases del oponente', true).subscribe(
						response => {
							if(response.chat){
								this.status = 'success';
								this.socket.emit('new-chat', response.chat);
								this.chatHistory.push(response.chat);
								$('.msg-wrap').scrollTop($('.msg-wrap')[0].scrollHeight);
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
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}

	sendResult(){
		//console.log(this.match);
		this._matchService.sendResult(this.token, this.matchId, this.match).subscribe(
			response => {
				if(!response.match){
					this.status = 'error';
				}else{
					this.match.status = response.match.status;
					this._matchService.addChatMatch(this.token, this.matchId, 'El usuario ' + this.identity.nick + ' ha enviado el resultado de ' + this.match.homeScore + " - " + this.match.awayScore, true).subscribe(
						response => {
							if(response.chat){
								this.status = 'success';
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

}
