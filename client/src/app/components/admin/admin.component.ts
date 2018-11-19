import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import * as io from 'socket.io-client';

@Component({
	selector: 'admin',
	templateUrl: './admin.component.html'
})

export class AdminComponent implements OnInit{
	public title:string;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router
	){
		this.title = 'Bienvenido al panel admin'
	}

	ngOnInit(){
		console.log('admin.component cargado OK');
	}
}
