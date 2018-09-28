// Módulos
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MomentModule } from 'angular2-moment';

// Rutas
import { TournamentRoutingModule } from './tournament-routing.module';

// Componentes
import { MainComponent } from './components/main/main.component';
import { DetailComponent } from './components/detail/detail.component';
import { RulesComponent } from './components/rules/rules.component';
import { BracketComponent } from './components/bracket/bracket.component';
import { MatchComponent } from './components/match/match.component';
import { DecksComponent } from './components/decks/decks.component';
import { PacksComponent } from './components/packs/packs.component';

// Servicios
import { UserService } from '.././services/user.service';
import { TournamentService } from '.././services/tournament.service';
import { MatchService } from '.././services/match.service';
import { UserGuard } from '.././services/user.guard';

@NgModule({
	declarations: [
		MainComponent,
		DetailComponent,
		RulesComponent,
		BracketComponent,
		MatchComponent,
		DecksComponent,
		PacksComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		TournamentRoutingModule,
		MomentModule
	],
	exports: [
		MainComponent,
		DetailComponent,
		RulesComponent,
		BracketComponent,
		MatchComponent,
		DecksComponent,
		PacksComponent
	],
	providers: [
		UserService,
		TournamentService,
		MatchService,
		UserGuard
	]
})

export class TournamentModule{}
