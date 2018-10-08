import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { Device } from '../../models/device';
import { UserService } from '../../services/user.service';
import { UploadService } from '../../services/upload.service';
import { GLOBAL } from '../../services/global';

@Component({
	selector: 'user-edit',
	templateUrl: './user-edit.component.html',
	providers: [UserService, UploadService]
})

export class UserEditComponent implements OnInit{
	public title: string;
	public user: User;
	public identity;
	public token;
	public status: string;
	public url: string;
	public devices: Device[];
	public OneSignal;

	public filesToUpload: Array<File>;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _userService: UserService,
		private _uploadService: UploadService
	){
		this.title = 'Actualizar mis datos';
		this.user = this._userService.getIdentity();
		this.identity = this.user;
		this.token = this._userService.getToken();
		this.url = GLOBAL.url;
	}

	ngOnInit(){
		//console.log(this.user);
		//console.log('user-edit.component se ha cargado!!');
		this.getDevicesUser();
		this.OneSignal = this.OneSignal || [];

	}

	clickSubscribe(){
		this.OneSignal.push(function() {
			console.log("Mostramos prompt");
			this.OneSignal.registerForPushNotifications(); // shows native browser prompt
    });
	}

	onSubmit(){
		//console.log(this.user);
		this._userService.updateUser(this.user).subscribe(
			response => {
				if(!response.user){
					this.status = 'error';
				}else{
					this.status = 'success';
					localStorage.setItem('identity', JSON.stringify(response.user));
					this.identity = response.user;
					// subida imagen usuario
					this._uploadService.makeFileRequest(this.url + 'upload-image-user/' + this.user._id, [], this.filesToUpload, this.token, 'image').then((result: any) => {
						//console.log(result);
						this.user.image = result.user.image;
						localStorage.setItem('identity', JSON.stringify(this.user));
					});
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

	fileChangeEvent(fileInput: any){
		this.filesToUpload = <Array<File>> fileInput.target.files;
		console.log(this.filesToUpload);
	}

	getDevicesUser(){
		this._userService.getDevices().subscribe(
			response => {
				if(!response.devices){
					this.status = 'error';
				}
				else{
					this.devices = response.devices;
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
