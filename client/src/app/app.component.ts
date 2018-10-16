import { Component, OnInit, DoCheck } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from './services/user.service';
import { PushNotificationsService } from 'ng-push';
import { GLOBAL } from './services/global';
import { Notification } from './models/notification';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [UserService]
})
export class AppComponent implements OnInit, DoCheck {
  public title: string;
  public status: string;
  public identity;
  public url: string;
  public notifications: Notification [];
  public notificationCount: number;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
  	private _userService: UserService
  ){
  	this.title = 'ROEDOR.NET';
    this.url = GLOBAL.url;
  }

  ngOnInit(){
  	this.identity = this._userService.getIdentity();

    if(this.identity){
      console.log("Logged 1");
      var OneSignal = (<any>window).OneSignal || [];
      OneSignal.push(["init", {
        appId: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
        autoRegister: false,
        notifyButton: {
          enable: false /* Set to false to hide */
        },
        welcomeNotification: {
          "title": "Notificaciones activadas",
          "message": "Gracias por suscribirte!",
          // "url": "" /* Leave commented for the notification to not open a window on Chrome and Firefox (on Safari, it opens to your webpage) */
        },
        promptOptions: {
          /* actionMessage limited to 90 characters */
          actionMessage: "Queremos informarte de nuevos chats en partidos, retos y avisos.",
          /* acceptButtonText limited to 15 characters */
          acceptButtonText: "PERMITIR",
          /* cancelButtonText limited to 15 characters */
          cancelButtonText: "NO GRACIAS"
        }
      }]);
      OneSignal.push(function() {
        console.log("Logged 2 - prompthttp");
        OneSignal.showHttpPrompt();
      });
      OneSignal.push(() => {
        // Occurs when the user's subscription changes to a new value.
        OneSignal.on('subscriptionChange', (isSubscribed) => {
          console.log("Logged 3 - suscrito? " + isSubscribed);
          //console.log("The user's subscription state is now:", isSubscribed);
          //TODO redundante??
          if(isSubscribed == true){
            OneSignal.getUserId((userId) => {
              console.log("Logged 4 - deviceId - " + userId);
              this._userService.registerDevice(userId).subscribe(
                response => {
                  console.log("Logged 5");
                  console.log(response);
          				if(response.device){
          					this.status = 'OK';
          				}
          				else{
          					this.status = 'error';
          				}
          			},
          			error => {
                  console.log("Logged 6 - error");
          				var errorMessage = <any>error;
          				//console.log(errorMessage);
          				if(errorMessage != null){
          					this.status = 'error';
                    console.log("Logged 7 - " + this.status);
          				}
          			}
          		);
            });
          }
          else{
            console.log("Push notifications no están habilitadas aún.");
          }
        });
      });

      //notificaciones
      this._userService.getNotifications().subscribe(
  			response => {
  				if(response.notifications){
  					this.notifications = response.notifications;
            this.notificationCount = response.total;
  				}
  				else{
  					this.status = 'error';
  				}
  			},
  			error => {
  				var errorMessage = <any>error;
  				//console.log(errorMessage);
  				if(errorMessage != null){
  					this.status = 'error';
  				}
  			}
  		);
    }

  }

  //ngDoCheck ocurre cada vez que hay un cambio
  ngDoCheck(){
  	this.identity = this._userService.getIdentity();
  }

  readNotif(id_notif){

    this._userService.setViewedNotification(id_notif).subscribe(
      response => {
				if(response.notification){
					this.status = 'OK';
				}
				else{
					this.status = 'error';
				}
			},
			error => {
				var errorMessage = <any>error;
				//console.log(errorMessage);
				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);

  }

  setStatus1Notifications(){

    this.notifications.forEach((notification) => {
      notification.status = 1;
      //notification.save();
    });
    this.notificationCount = 0;
  }

  logout(){
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }

}
