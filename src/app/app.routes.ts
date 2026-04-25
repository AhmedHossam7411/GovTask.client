import { Routes } from '@angular/router';
import { RegisterComponent } from './register/registerComponent';
import { LoginComponent } from './login/loginComponent';
import { DepartmentContainerComponent } from './department-container-component/department-container-component';
import { AuthGuard } from './shared/guards/auth-guard';
import { TasksContainer } from './tasks-container/tasks-container';
import { DocumentContainerComponent } from './document-container-component/document-container-component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { SecurityChallengeComponent } from './security-challenge/security-challenge.component';
import { SecurityChallengeGuard } from './shared/guards/security-challenge.guard';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'challenge', component: SecurityChallengeComponent, canActivate: [AuthGuard] },
  {path: 'departments',component: DepartmentContainerComponent, canActivate: [SecurityChallengeGuard, AuthGuard]},
  {path: 'tasks',component: TasksContainer, canActivate: [SecurityChallengeGuard, AuthGuard]},
  {path: 'documents',component: DocumentContainerComponent, canActivate: [SecurityChallengeGuard, AuthGuard]},
  {path: 'admin',component: AdminDashboardComponent, canActivate: [SecurityChallengeGuard, AuthGuard]},
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];