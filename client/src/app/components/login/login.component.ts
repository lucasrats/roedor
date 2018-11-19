import {Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

@Component({
	selector: 'login',
	templateUrl: './login.component.html',
	providers: [UserService]
})

export class LoginComponent implements OnInit{

	public title: string;
	public user: User;
	public status: string;
	public identity;
	public token;
	public reboot: boolean;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService
	){
		this.title = 'Identifícate';
		this.user = new User("","","","","","","ROLE_USER","", "", "");
		this.reboot = false;
	}

	ngOnInit(){
		console.log('Componente de login cargado...');
	}

	onSubmit(){
		//loguear al usuario y conseguir los datos
		this._userService.signUp(this.user).subscribe(
			response => {
				this.identity = response.user;
				if(!this.identity || !this.identity._id){
					this.status = 'error';
				}else{
					//persistir datos del usuario en local storage
					localStorage.setItem('identity', JSON.stringify(this.identity));

					//conseguir token usuario
					this.getToken();
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

	getToken(){
		this._userService.signUp(this.user, 'true').subscribe(
			response => {
				this.token = response.token;
				if(this.token.length <= 0){
					this.status = 'error';
				}else{
					//persistir datos del usuario
					localStorage.setItem('token', JSON.stringify(this.token));
					//conseguir contadores/stats del usuario
					this.getCounters();
					//this._router.navigate(['/']);
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

	getCounters(){
		this._userService.getCounters().subscribe(
			response => {
				localStorage.setItem('stats', JSON.stringify(response));
				this.status = 'success';
				this._router.navigate(['/']);
				//if(response.following.length <= 0)
			},
			error => {
				console.log(<any>error);
			}
		)
	}

	onSubmitReboot(){

		this._userService.sendTokenReboot(this.user.email).subscribe(
			response => {
					this.status = 'success';
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
