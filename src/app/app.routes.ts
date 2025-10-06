import { Routes } from '@angular/router';
import { RegisterComponent } from './register/registerComponent';
import { LoginComponent } from './login/loginComponent';
import { DepartmentComponent } from './department-component/department-component';
import { DepartmentContainerComponent } from './department-container-component/department-container-component';
import { AuthGuard } from './auth-guard';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  {path: 'departments',component: DepartmentContainerComponent, canActivate: [AuthGuard]},
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];