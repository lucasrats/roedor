import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Tournament } from '../../models/tournament';
import { GLOBAL } from '../../services/global';
import { UserService } from '../../services/user.service';
import { TournamentService } from '../../services/tournament.service';

@Component({
	selector: 'tournaments',
	templateUrl: './tournaments.component.html',
	providers: [UserService, TournamentService]
})

export class TournamentsComponent implements OnInit{
	public title: string;
	public identity;
	public token;
	public url: string;
	public status: string;
	public page;
	public total;
	public pages;
	public itemsPerPage;
	public participantsSigned;
	public tournaments: Tournament[];
	@Input() user: string;

	constructor(

		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
		private _tournamentService: TournamentService
	){
		this.title = 'Torneos';
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
		this.page = 1;
	}

	ngOnInit(){
		this.getTournaments();
	}

	getTournaments(adding = false){
		this._tournamentService.getTournaments(this.token, this.page).subscribe(
			response => {
				console.log(response);
				if(response.tournaments){
					this.total = response.total_items;
					this.pages = response.pages;
					this.itemsPerPage = response.itemsPerPage;

					if(!adding){
						this.tournaments = response.tournaments;
					}else{
						var arrayA = this.tournaments;
						var arrayB = response.tournaments;
						this.tournaments = arrayA.concat(arrayB);

						//scroll automático con jquery
						$('html, body').animate({ scrollTop: $('html').prop('scrollHeight')}, 500);
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

	public noMore = false;
	viewMore(){

		this.page += 1;

		if(this.page == this.pages){
			this.noMore = true;
		}

		this.getTournaments(true);
	}
}
