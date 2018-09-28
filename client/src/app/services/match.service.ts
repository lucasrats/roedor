import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Match } from '../models/match';
import { GLOBAL } from './global';

@Injectable()
export class MatchService{
	public url:string;
	public identity;
	public token;

	constructor(public _http: HttpClient){
		this.url = GLOBAL.url;
	}

	getMatches(token, page = null): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url + 'matches/' + page, {headers: headers});
	}

  getMatch(token, matchId): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url + 'match/' + matchId , {headers: headers});
	}

	addChatMatch(token, id, text, system = false): Observable<any>{
		let params = JSON.parse('{\"chat\": \"' + text + '\", \"system\": ' + system + '}');
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'match/addchat/' + id, params, {headers: headers});
	}

	confirmMatch(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'match/confirm/' + id, null, {headers: headers});
	}

	classesSelect(token, matchId, classes): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'match/classes-select/' + matchId, classes, {headers: headers});
	}

	classesBan(token, matchId, classes): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'match/classes-ban/' + matchId, classes, {headers: headers});
	}

	sendResult(token, matchId, match): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
		let params = JSON.stringify(match);

		return this._http.post(this.url + 'match/sendresult/' + matchId, params, {headers: headers});
	}

}
