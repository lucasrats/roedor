import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Tournament } from '../../../models/tournament';
import { GLOBAL } from '../../../services/global';
import { TournamentService } from '../../../services/tournament.service';
import { UserService } from '../../../services/user.service';
import { MainComponent } from '../main/main.component';

@Component({
	selector: 'rules',
	templateUrl: './rules.component.html',
	providers: [TournamentService, UserService]
})

export class RulesComponent implements OnInit{
	public title: string;
	public token;
	public url: string;
	public status: string;
  public tournamentId;
	public tournament: Tournament;

	constructor(

		private _route: ActivatedRoute,
		private _router: Router,
		private _tournamentService: TournamentService,
		private _userService: UserService,
		private _parentComponent: MainComponent
	){
		this.url = GLOBAL.url;
		this.token = this._userService.getToken();
		//this.tournament = new Tournament();
	}

	ngOnInit(){
		//console.log('rules.component cargado');
		this.getTournament();
	}

	getTournament(){
		this._tournamentService.getTournament(this.token, this._parentComponent.tournamentId).subscribe(
			response => {
				console.log(response);
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

}
