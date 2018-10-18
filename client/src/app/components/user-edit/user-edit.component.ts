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
	public isSubscribed: boolean;

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
		//console.log('user-edit.component se ha cargado!!');
		this.getDevicesUser();

		var OneSignal = (<any>window).OneSignal || [];
		var buttonSelector = "#suscribeButton";
/*
		OneSignal.push(["getNotificationPermission", function(permission) {
	    console.log("Site Notification Permission:", permission);
			if(permission == 'granted'){
				this.isSubscribed = true;
			}
			else{
				this.isSubscribed = false;
			}
	    // (Output) Site Notification Permission: default
		}]);
*/
		OneSignal.push(() => {
        // If we're on an unsupported browser, do nothing
        if (!OneSignal.isPushNotificationsSupported()) {
            return;
        }
        updateMangeWebPushSubscriptionButton(buttonSelector);
        OneSignal.on("subscriptionChange", function(isSubscribed) {
            /* If the user's subscription state changes during the page's session, update the button text */
            updateMangeWebPushSubscriptionButton(buttonSelector);
        });
    });

		function onManageWebPushSubscriptionButtonClicked(event) {
	      getSubscriptionState().then(function(state) {
	          if (state.isPushEnabled) {
	              /* Subscribed, opt them out */
	              OneSignal.setSubscription(false);
	          } else {
	              if (state.isOptedOut) {
	                  /* Opted out, opt them back in */
	                  OneSignal.setSubscription(true);
	              } else {
	                  /* Unsubscribed, subscribe them */
	                  OneSignal.registerForPushNotifications();
	              }
	          }
	      });
	      event.preventDefault();
	  }

		function updateMangeWebPushSubscriptionButton(buttonSelector) {
	      var hideWhenSubscribed = false;
	      var subscribeText = "Subscribe to Notifications";
	      var unsubscribeText = "Unsubscribe from Notifications";

	      getSubscriptionState().then(function(state) {
	          var buttonText = !state.isPushEnabled || state.isOptedOut ? subscribeText : unsubscribeText;

	          var element = document.querySelector(buttonSelector);
	          if (element === null) {
	              return;
	          }

	          element.removeEventListener('click', onManageWebPushSubscriptionButtonClicked);
	          element.addEventListener('click', onManageWebPushSubscriptionButtonClicked);
	          element.textContent = buttonText;

	          if (state.hideWhenSubscribed && state.isPushEnabled) {
	              element.style.display = "none";
	          } else {
	              element.style.display = "";
	          }
	      });
	  }

		function getSubscriptionState() {
	      return Promise.all([
	        OneSignal.isPushNotificationsEnabled(),
	        OneSignal.isOptedOut()
	      ]).then(function(result) {
	          var isPushEnabled = result[0];
	          var isOptedOut = result[1];

	          return {
	              isPushEnabled: isPushEnabled,
	              isOptedOut: isOptedOut,
								hideWhenSubscribed: null
	          };
	      });
	  }
	}







	clickSubscribe(){
		var OneSignal = (<any>window).OneSignal || [];
		OneSignal.push(function() {
			console.log("Mostramos prompt");
			OneSignal.registerForPushNotifications(); // shows native browser prompt
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
