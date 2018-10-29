import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { GLOBAL } from '../../services/global';

@Component({
	selector: 'recovery-pass',
	templateUrl: './recovery-pass.component.html',
	providers: [UserService]
})

export class RecoveryPassComponent implements OnInit{
	public title: string;
	public status: string;
	public url: string;

  public user: User;

  /*
  public token: string;
  public password: string;
  */

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService
	){
		this.title = 'Restablecer contraseña';
		this.url = GLOBAL.url;
    this.user = new User("","","","","","","ROLE_USER","", "");
	}

	ngOnInit(){
    this._route.queryParams.subscribe(params => {
      this.user.token = params.token;
    });

	}

  onSubmit(form){

		this._userService.newPasswordByToken(this.user.password, this.user.token).subscribe(
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
