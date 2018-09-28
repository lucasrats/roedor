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
  	private _userService: UserService,
    private _pushNotifications: PushNotificationsService
  ){
  	this.title = 'ROEDOR.NET';
    this.url = GLOBAL.url;
  }

  ngOnInit(){
  	this.identity = this._userService.getIdentity();

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

    this._pushNotifications.requestPermission();

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

  notifPrueba(){
    this._pushNotifications.create('Test', {body: 'something'}).subscribe(
        res => console.log(res),
        err => console.log(err)
    )
  }
}
