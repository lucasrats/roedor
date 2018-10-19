import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';
import { GLOBAL } from '../../services/global';

@Component({
	selector: 'home',
	templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit{
	public title:string;
	public env: string;

	constructor(){
		this.title = 'Bienvenido a NGSocial'
		this.env = GLOBAL.env;
	}

	ngOnInit(){
		//console.log('home.component cargado OK');
		if(this.env == 'DE'){
			const socket = io('http://localhost:3800');
		}
		else{
			const socket = io('https://roedor.net');
		}
	}
}
