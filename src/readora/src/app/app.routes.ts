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
import { BuscadorComponent } from './feature/buscador/buscador.component';
import { DetalleUsuarioComponent } from './feature/usuario/detalle-usuario/detalle-usuario.component';
import { BibliotecaPersonalComponent } from './feature/biblioteca/biblioteca-personal/biblioteca-personal.component';
import { DetalleLibroComponent } from './feature/libro/detalle-libro/detalle-libro.component';
import { DetalleAutorComponent } from './feature/autor/detalle-autor/detalle-autor.component';
import { CreditsComponent } from './credits/credits.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'register', // Cambiado de 'api/v1/register'
    component: RegisterComponent,
  },
  {
    path: 'login', // Cambiado de 'api/v1/authenticate'
    component: AutenticacionComponent,
  },
  {
    path: 'perfil',
    component: DetalleUsuarioComponent,
    canActivate: [autenticacionGuard]
  },
  {
    path: 'buscador',
    component: BuscadorComponent,
    canActivate: [autenticacionGuard]
  },
  {
    path: 'biblioteca',
    component: BibliotecaPersonalComponent,
    canActivate: [autenticacionGuard]
  },
  {
    path: 'libros/:id',
    component: DetalleLibroComponent,
    canActivate: [autenticacionGuard]
  },
  {
    path: 'autores/:id',
    component: DetalleAutorComponent,
    canActivate: [autenticacionGuard]
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
    path: 'credits',
    component: CreditsComponent,
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
