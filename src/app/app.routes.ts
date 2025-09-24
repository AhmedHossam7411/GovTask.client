import { Routes } from '@angular/router';
import { RegisterComponent } from './register/registerComponent';
import { LoginComponent } from './login/loginComponent';
import { DepartmentComponent } from './department-component/department-component';
import { DepartmentContainerComponent } from './department-container-component/department-container-component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  {path: 'departments',component: DepartmentContainerComponent},
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];