import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';

@Component({
	selector: 'admin',
	templateUrl: './admin.component.html'
})

export class AdminComponent implements OnInit{
	public title:string;

	constructor(){
		this.title = 'Bienvenido al panel admin'
	}

	ngOnInit(){
		console.log('admin.component cargado OK');
	}
}
