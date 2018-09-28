import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// components
import { MainComponent } from './components/main/main.component';
import { DetailComponent } from './components/detail/detail.component';
import { RulesComponent } from './components/rules/rules.component';
import { BracketComponent } from './components/bracket/bracket.component';
import { MatchComponent } from './components/match/match.component';
import { DecksComponent } from './components/decks/decks.component';
import { PacksComponent } from './components/packs/packs.component';

import { UserGuard } from '.././services/user.guard';

const tournamentRoutes: Routes = [
	{
		path: 'tournament/:id',
		component: MainComponent,
		children: [
			{ path: '', redirectTo: 'lobby', pathMatch: 'full' },
			{ path: 'lobby', component: DetailComponent },
			{ path: 'rules', component: RulesComponent },
			{ path: 'bracket', component: BracketComponent },
			{ path: 'match/:match', component: MatchComponent },
			{ path: 'decks', component: DecksComponent },
			{ path: 'packs', component: PacksComponent }
		]
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(tournamentRoutes)
	],
	exports: [
		RouterModule
	]
})

export class TournamentRoutingModule{}
