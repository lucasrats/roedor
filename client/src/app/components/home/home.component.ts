import { Component, OnInit } from '@angular/core';
import { User } from '../../models/user';
import { Match } from '../../models/match';
import { UserService } from '../../services/user.service';
import { MatchService } from '../../services/match.service';
import * as io from 'socket.io-client';
import { GLOBAL } from '../../services/global';

@Component({
	selector: 'home',
	templateUrl: './home.component.html',
	providers: [UserService, MatchService]
})

export class HomeComponent implements OnInit{
	public title:string;
	public env: string;
	public user: User;
	public identity;
	public token;
	public matches: Match[];

	constructor(
		private _userService: UserService,
		private _matchService: MatchService
	){
		this.title = 'Bienvenido a NGSocial';
		this.env = GLOBAL.env;
		this.user = this._userService.getIdentity();
		this.identity = this.user;
		this.token = this._userService.getToken();
	}

	ngOnInit(){
		//console.log('home.component cargado OK');
		if(this.env == 'DE'){
			const socket = io('http://localhost:3800');
		}
		else{
			const socket = io('https://roedor.net');
		}

		if(this.identity){
			this.getMatches();
		}
	}

  getMatches(){
		this._matchService.getMatches(this.token).subscribe(
			response => {
				if(response.matches){
					this.matches = response.matches;
				}
			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);

			}
		);
	}

	checkStatusScore(match){
		if(match.status >= 4){
			if(match.homeScore > match.awayScore){
				if(match.home == this.identity._id){
					return "table-success";
				}
				else{
					return "table-danger";
				}
			}
			else{
				if(match.home == this.identity._id){
					return "table-danger";
				}
				else{
					return "table-success";
				}
			}
		}
		else{
			return "";
		}
	}
}
