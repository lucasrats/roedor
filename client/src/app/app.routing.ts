import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Componentes
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UsersComponent } from './components/users/users.component';
import { UserActivateComponent } from './components/user-activate/user-activate.component';
import { RecoveryPassComponent } from './components/recovery-pass/recovery-pass.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FollowingComponent } from './components/following/following.component';
import { FollowersComponent } from './components/followers/followers.component';
import { TournamentsComponent } from './components/tournaments/tournaments.component';
import { CreateTournamentComponent } from './components/createTournament/createTournament.component';
import { AdminComponent } from './components/admin/admin.component';
import { MatchesComponent } from './components/matches/matches.component';

import { UserGuard } from './services/user.guard';
import { AdminGuard } from './services/admin.guard';

const appRoutes: Routes = [
	{path: '', component: HomeComponent},
	{path: 'home', component: HomeComponent},
	{path: 'login', component: LoginComponent},
	{path: 'registro', component: RegisterComponent},
	{path: 'user-activate', component: UserActivateComponent},
	{path: 'password-recovery', component: RecoveryPassComponent},
	{path: 'mis-datos', component: UserEditComponent, canActivate:[UserGuard]},
	{path: 'mis-partidos', component: MatchesComponent, canActivate:[UserGuard]},
	{path: 'gente', component: UsersComponent, canActivate:[UserGuard]},
	{path: 'gente/:page', component: UsersComponent, canActivate:[UserGuard]},
	{path: 'timeline', component: TimelineComponent, canActivate:[UserGuard]},
	{path: 'perfil/:id', component: ProfileComponent, canActivate:[UserGuard]},
	{path: 'siguiendo/:id/:page', component: FollowingComponent, canActivate:[UserGuard]},
	{path: 'seguidores/:id/:page', component: FollowersComponent, canActivate:[UserGuard]},
	{path: 'tournaments', component: TournamentsComponent},
	{path: 'crear-torneo', component: CreateTournamentComponent, canActivate:[UserGuard]},
	//rutas ADMIN
	{path: 'admin', component: AdminComponent, canActivate:[AdminGuard]},
	//ruta 404
	{path: '**', component: HomeComponent}

];

export const appRoutingProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
