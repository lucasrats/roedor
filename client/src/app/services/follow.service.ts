import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';
import { Follow } from '../models/follow';

@Injectable()
export class FollowService{
	public url:string;

	constructor(
		private _http: HttpClient
	){
		this.url = GLOBAL.url;
	}

	addFollow(token, follow): Observable<any>{
		let params = JSON.stringify(follow);
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'follow', params, {headers: headers});
	}

	deleteFollow(token, user_id): Observable<any>{

		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.delete(this.url + 'unfollow/' + user_id, {headers: headers});
	}

	getFollowing(token, user_id = null, page = 1): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		var url = this.url + 'following';
		if(user_id != null){
				url = this.url + 'following/' + user_id + '/' + page;
		}

		return this._http.get(url, {headers: headers});
	}

	getFollowers(token, user_id = null, page = 1): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		var url = this.url + 'followers';
		if(user_id != null){
				url = this.url + 'followers/' + user_id + '/' + page;
		}

		return this._http.get(url, {headers: headers});
	}

	getMyFollows(token): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url + 'get-my-followers', {headers: headers});
	}
}