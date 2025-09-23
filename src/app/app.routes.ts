import { Routes } from '@angular/router';
import { RegisterComponent } from './register/registerComponent';
import { LoginComponent } from './login/loginComponent';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];