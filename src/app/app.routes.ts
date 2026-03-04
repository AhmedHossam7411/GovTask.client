import { Routes } from '@angular/router';
import { RegisterComponent } from './register/registerComponent';
import { LoginComponent } from './login/loginComponent';
import { DepartmentContainerComponent } from './department-container-component/department-container-component';
import { AuthGuard } from './auth-guard';
import { TasksContainer } from './tasks-container/tasks-container';
import { DocumentContainerComponent } from './document-container-component/document-container-component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  {path: 'departments',component: DepartmentContainerComponent, canActivate: [AuthGuard]},
  {path: 'tasks',component: TasksContainer, canActivate: [AuthGuard]},
  {path: 'documents',component: DocumentContainerComponent, canActivate: [AuthGuard]},
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];