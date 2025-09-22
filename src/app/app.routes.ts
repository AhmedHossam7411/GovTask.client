import { Routes } from '@angular/router';
import { register } from './register/register';
import { login } from './login/login';

export const routes: Routes = [
  { path: 'register', component: register },
  { path: 'login', component: login },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];