import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { EditorModule } from '@tinymce/tinymce-angular';
import { Tournament } from '../../models/tournament';
import { TournamentService } from '../../services/tournament.service';
import { UserService } from '../../services/user.service';

@Component({
	selector: 'createTournament',
	templateUrl: './createTournament.component.html',
	providers: [TournamentService, UserService]
})

export class CreateTournamentComponent implements OnInit{

  public identity;
	public title: string;
	public tournament: Tournament;
  public token;
	public status: string;
  public typesTournament;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
    private _tournamentService: TournamentService

	){
    this.identity = this._userService.getIdentity();
    this.token = this._userService.getToken();
		this.title = 'Crear torneo';
		this.tournament = new Tournament("", "", "", this.identity._id, "", 0, "", "", false, 0, 0, 0, false, 0, "", "", 0);
		this.typesTournament = [
		    {
		        value : 'swiss',
		        desc : 'Rondas Suizo'
		    },
		    {
		        value : 'ko',
		        desc : 'Torneo KO'
		    }
		];
	}

	ngOnInit(){
	}

	onSubmit(form){
		this._tournamentService.createTournament(this.token, this.tournament).subscribe(
			response => {
				if(response.tournament && response.tournament._id){
					this.status = 'success';
					form.reset();
				}else{
					this.status = 'error';
				}
			},
			error => {
				console.log(<any>error);
			}
		);
	}
}
