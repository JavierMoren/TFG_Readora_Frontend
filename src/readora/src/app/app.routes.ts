import { Routes } from '@angular/router';
import { RegisterComponent } from './feature/register/register.component';
import { HomeComponent } from './layout/home/home.component';
import { AutenticacionComponent } from './feature/autenticacion/autenticacion.component';
import { LibrosComponent } from './feature/libros/libros.component';
import { autenticacionGuard } from './core/guard/autenticacion.guard';
import { ForbiddenComponent } from './feature/forbidden/forbidden.component';
import { Error404Component } from './feature/error404/error404.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'api/v1/register',
    component: RegisterComponent,
  },
  {
    path: 'api/v1/authenticate',
    component: AutenticacionComponent,
  },
  {
    path: 'api/libros',
    component: LibrosComponent,
    canActivate: [autenticacionGuard],
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent,
  },
  {
    path: '**',
    component: Error404Component,
  }
];
