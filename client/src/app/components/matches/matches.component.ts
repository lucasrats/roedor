import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { Match } from '../../models/match';
import { UserService } from '../../services/user.service';
import { MatchService } from '../../services/match.service';
import { GLOBAL } from '../../services/global';

@Component({
	selector: 'matches',
	templateUrl: './matches.component.html',
	providers: [UserService, MatchService]
})

export class MatchesComponent implements OnInit{
	public title: string;
	public url: string;
	public identity;
	public token;
	public page;
	public next_page;
	public prev_page;
	public status: string;
	public total;
	public pages;
	public matches: Match[];

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService:  UserService,
		private _matchService: MatchService
	){
		this.title = 'Mis partidos';
		this.identity = this._userService.getIdentity();
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
	}

  ngOnInit(){
		this.actualPage();
	}

	actualPage(){
		this._route.params.subscribe(params => {

			//paginación
			let page;
			if(!params['page']){
				page = 1;
			}
			else{
				page = +params['page'];
			}

			this.page = page;

			if(!page){
				page = 1;
			}else{
				this.next_page = page + 1;
				this.prev_page = page - 1;

				if(this.prev_page <= 0){
					this.prev_page = 1;
				}
			}

			//devolver listado de partidos del jugador
			this.getMatches(page);
		});
	}

  getMatches(page){
		this._matchService.getMatches(this.token, page).subscribe(
			response => {
				if(!response.matches){
					this.status = 'error';
				}else{
					this.total = response.total;
					this.matches = response.matches;
					this.pages = response.pages;
					if(page > this.pages){
						this._router.navigate(['/mis-partidos']);
					}
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
