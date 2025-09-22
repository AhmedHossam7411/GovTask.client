import { Component, inject, NgModule } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest } from './LoginReq.model';
import { RouterModule } from '@angular/router';

function passwordRules(control: AbstractControl)
{
  const value = control.value || '';
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const hasUpperCase = /[A-Z]/.test(value);

  if (!hasNumber || !hasSymbol || !hasUpperCase) {
    return { passwordRules: true };
  }

  return null;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule,RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class login {
  private httpClient = inject(HttpClient);
  private apiUrl='https://localhost:7285';
   errorMessage: string = '';
  form = new FormGroup({
    email : new FormControl('',{
      validators: [Validators.required, Validators.email,],
    }),
    password : new FormControl('',{
      validators: [passwordRules,Validators.required, Validators.minLength(6),],
    }),
  });
   get emailIsInvalid(){
    return this.form.controls.email.invalid 
    && this.form.controls.email.touched
    && this.form.controls.email.dirty;
  }
   get passwordIsInvalid(){
    return this.form.controls.password.invalid 
    && this.form.controls.password.touched
    && this.form.controls.password.dirty;
  }
  onSubmit() {
     if (this.form.invalid) {
    this.form.markAllAsTouched(); 
    return;
  }
  const formValue: LoginRequest = this.form.value as LoginRequest;

  this.login(formValue).subscribe({
    next: (res) => {
      console.log('login success:', res); 
    },
    error: (err) => {
      this.errorMessage = 'Email or Password not found' 
      console.error('login failed:', err)
    }
    });
}
 login(data: LoginRequest): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/api/Auth/login`, data);
  }
}