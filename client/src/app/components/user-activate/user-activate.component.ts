import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { GLOBAL } from '../../services/global';

@Component({
	selector: 'user-activate',
	templateUrl: './user-activate.component.html',
	providers: [UserService]
})

export class UserActivateComponent implements OnInit{
	public title: string;
	public status: string;
	public url: string;

  public email: string;
  public token: string;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService
	){
		this.title = 'Confirmar registro de usuario';
		this.url = GLOBAL.url;

	}

	ngOnInit(){
    this._route.queryParams.subscribe(params => {
      this.email = params.email;
      this.token = params.token;
    });

	}

  onSubmit(){

		this._userService.activateUserRegistration(this.email, this.token).subscribe(
			response => {
				if(!response.user){
					this.status = 'error';
				}else{
					this.status = 'success';
					//TODO esconder formulario y eso??
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
