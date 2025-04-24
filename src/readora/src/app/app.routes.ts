import { Routes } from '@angular/router';
import { RegisterComponent } from './feature/register/register.component';
import { HomeComponent } from './layout/home/home.component';
import { AutenticacionComponent } from './feature/autenticacion/autenticacion.component';
import { autenticacionGuard } from './core/guard/autenticacion.guard';
import { adminGuard } from './core/guard/admin.guard';
import { ForbiddenComponent } from './feature/forbidden/forbidden.component';
import { Error404Component } from './feature/error404/error404.component';
import { PanelAdministradorComponent } from './feature/panel-administrador/panel-administrador.component';
import { AdminUsuariosComponent } from './feature/panel-administrador/admin-usuarios/admin-usuarios.component';
import { AdminLibrosComponent } from './feature/panel-administrador/admin-libros/admin-libros.component';
import { AdminAutoresComponent } from './feature/panel-administrador/admin-autores/admin-autores.component';
import { AdminRolesComponent } from './feature/panel-administrador/admin-roles/admin-roles.component';
import { AdminUsuarioLibrosComponent } from './feature/panel-administrador/admin-usuario-libros/admin-usuario-libros.component';

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
    path: 'panel-administrador',
    component: PanelAdministradorComponent,
    canActivate: [autenticacionGuard, adminGuard],
    children: [
      { 
        path: '', 
        redirectTo: 'usuarios', 
        pathMatch: 'full' 
      },
      { 
        path: 'usuarios', 
        component: AdminUsuariosComponent 
      },
      { 
        path: 'libros', 
        component: AdminLibrosComponent 
      },
      { 
        path: 'autores', 
        component: AdminAutoresComponent 
      },
      { 
        path: 'roles', 
        component: AdminRolesComponent 
      },
      { 
        path: 'usuario-libros', 
        component: AdminUsuarioLibrosComponent 
      }
    ]
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
