import { Routes } from '@angular/router';
import { RegisterComponent } from './feature/register/register.component';
import { HomeComponent } from './layout/home/home.component';
import { AutenticacionComponent } from './feature/autenticacion/autenticacion.component';
import { LibrosComponent } from './components/libros/libros.component';
import { autenticacionGuard } from './core/guard/autenticacion.guard';
import { ForbiddenComponent } from './feature/forbidden/forbidden.component';
import { Error404Component } from './feature/error404/error404.component';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { RoleComponent } from './components/role/role.component';
import { AutorComponent } from './components/autor/autor.component';
import { UsuarioLibroComponent } from './components/usuario-libro/usuario-libro.component';
import { PanelAdministradorComponent } from './feature/panel-administrador/panel-administrador.component';

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
    path: 'api/usuarios',
    component: UsuarioComponent,
    canActivate: [autenticacionGuard],
  },
  {
    path: 'api/roles',
    component: RoleComponent,
    canActivate: [autenticacionGuard],
  },
  {
    path: 'api/autores',
    component: AutorComponent,
    canActivate: [autenticacionGuard],
  },
  {
    path: 'api/usuario-libros',
    component: UsuarioLibroComponent,
    canActivate: [autenticacionGuard],
  },
  {
    path: 'panel-administrador',
    component: PanelAdministradorComponent,
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
