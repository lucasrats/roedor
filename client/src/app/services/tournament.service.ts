import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Tournament } from '../models/tournament';
import { Participant } from '../models/Participant';
import { GLOBAL } from './global';

@Injectable()
export class TournamentService{
	public url:string;
	public identity;
	public token;
	public stats;
	public participants: Participant[];
	public bo;
	public packs;

	constructor(public _http: HttpClient){
		this.url = GLOBAL.url;
	}

  getTournaments(token, page): Observable<any>{
		//let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.get(this.url + 'tournaments/' + page , {headers: headers});
	}

	getTournament(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.get(this.url + 'tournament/' + id , {headers: headers});
	}

	getIsJoined(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url + 'tournament/' + id + '/joined', {headers: headers});
	}

	getParticipants(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.get(this.url + 'tournament/' + id + '/participants', {headers: headers});
	}

	getParticipant(token, tournament, user): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url + 'tournament/' + tournament + '/participant/' + user, {headers: headers});
	}

	joinTournament(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/join/' + id, null, {headers: headers});
	}

	unjoinTournament(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.delete(this.url + 'tournament/unjoin/' + id, {headers: headers});
	}

	addChatTournament(token, id, text): Observable<any>{
		let params = JSON.parse('{\"chat\": \"' + text + '\"}');
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/addchat/' + id, params, {headers: headers});
	}

	getMatches(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.get(this.url + 'tournament/' + id + '/matches', {headers: headers});
	}

	getStandings(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this._http.get(this.url + 'tournament/' + id + '/standings', {headers: headers});
	}

	getIsAdminTournament(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url + 'tournament/' + id + '/isadmin', {headers: headers});
	}

	startTournament(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/start/' + id, null, {headers: headers});
	}

	nextRound(token, id): Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/nextround/' + id, null, {headers: headers});
	}

	createTournament(token, tournament: Tournament): Observable<any>{
		let params = JSON.stringify(tournament);
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/create', params, {headers: headers});
	}

	addDeckTournament(token, id, name, code): Observable<any>{
		let params = JSON.parse('{\"name\": \"' + name + '\", \"code\": \"' + code + '\"}');
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/' + id + '/participant/newDeck', params, {headers: headers});
	}

	addPackTournament(token, id, pack): Observable<any>{
		//let params = JSON.parse('{\"pool\": \"' + pool + '\"}');
		//let params = JSON.stringify(pool);
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url + 'tournament/' + id + '/participant/newPack', pack, {headers: headers});
	}

}
