import { Routes } from '@angular/router';
import { registerComponent } from './register/registerComponent';
import { loginComponent } from './login/loginComponent';

export const routes: Routes = [
  { path: 'register', component: registerComponent },
  { path: 'login', component: loginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];