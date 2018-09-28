import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// components
import { MainComponent } from './components/main/main.component';
import { AddComponent } from './components/add/add.component';
import { ReceivedComponent } from './components/received/received.component';
import { SentComponent } from './components/sent/sent.component';

import { UserGuard } from '.././services/user.guard';

const messagesRoutes: Routes = [
	{
		path: 'mensajes', 
		component: MainComponent, 
		children: [
			{ path: '', redirectTo: 'recibidos', pathMatch: 'full' },
			{ path: 'enviar', component: AddComponent, canActivate:[UserGuard] },
			{ path: 'recibidos', component: ReceivedComponent, canActivate:[UserGuard] },
			{ path: 'recibidos/:page', component: ReceivedComponent, canActivate:[UserGuard] },
			{ path: 'enviados', component: SentComponent, canActivate:[UserGuard] },
			{ path: 'enviados/:page', component: SentComponent, canActivate:[UserGuard] },
		]
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(messagesRoutes)
	],
	exports: [
		RouterModule
	]
})

export class MessagesRoutingModule{}