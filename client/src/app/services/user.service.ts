import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { User } from '../models/user';
import { Notification } from '../models/notification';
import { GLOBAL } from './global';

@Injectable()
export class UserService{
	public url:string;
	public identity;
	public token;
	public stats;

	constructor(public _http: HttpClient){
		this.url = GLOBAL.url;
	}

	register(user: User): Observable<any>{
		//convertimos el objeto javascript a un json en string
		let params = JSON.stringify(user);
		//con Nodejs, el backend recibe json
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.post(this.url + 'register', params, {headers: headers});
	}

	signUp(user, gettoken = null): Observable<any>{

		if(gettoken != null){
			user.gettoken = gettoken;
		}

		let params = JSON.stringify(user);
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.post(this.url + 'login', params, {headers: headers});
	}

	getIdentity(){
		let identity = JSON.parse(localStorage.getItem('identity'));

		if(identity != "undefined"){
			this.identity = identity;
		}else{
			this.identity = null;
		}

		return this.identity;
	}

	getToken(){
		let token = JSON.parse(localStorage.getItem('token'));

		if(token != "undefined"){
			this.token = token;
		}else{
			this.token = null;
		}

		return this.token;
	}

	getStats(){
		let stats = JSON.parse(localStorage.getItem('stats'));

		if(stats != 'undefined'){
			this.stats = stats;
		}else{
			this.stats = null;
		}

		return this.stats;
	}

	getCounters(userId = null): Observable<any>{
		// pasamos ya el token del usuario
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		if(userId != null){
			return this._http.get(this.url + 'counters/' + userId, {headers:headers});
		}else{
			return this._http.get(this.url + 'counters/', {headers:headers});
		}
	}

	updateUser(user: User): Observable<any>{
		let params = JSON.stringify(user);
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		return this._http.put(this.url + 'update-user/' + user._id, params, {headers: headers});
	}

	getUsers(page = null): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		return this._http.get(this.url + 'users/' + page, {headers: headers});
	}

	getUser(id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		return this._http.get(this.url + 'user/' + id, {headers: headers});
	}

	getNotifications(): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		return this._http.get(this.url + 'notifications', {headers: headers});
	}

	setViewedNotification(id): Observable<any>{
		let params = JSON.parse('{\"id\": \"' + id + '\"}');

		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		return this._http.post(this.url + 'set-viewed-notification', params, {headers: headers});
	}

	registerDevice(serial): Observable<any>{
		let params = JSON.parse('{\"serial\": \"' + serial + '\"}');
		//con Nodejs, el backend recibe json
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', this.getToken());

		return this._http.post(this.url + 'register-device', params, {headers: headers});
	}

}
