import { Component, inject, NgModule } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from './registerReq.model';
import { Router, RouterModule } from '@angular/router';



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
  selector: 'app-register',
  imports: [CommonModule,ReactiveFormsModule,RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class register {
  private httpClient = inject(HttpClient);
  private apiUrl='https://localhost:7285';
  private router = inject(Router);

  form = new FormGroup({
    email : new FormControl('',{
      validators: [Validators.required, Validators.email,],
    }),
    password : new FormControl('',{
      validators: [passwordRules,Validators.required, Validators.minLength(6),],
    }),
    userName : new FormControl('',{
      validators: [Validators.required, Validators.minLength(6),Validators.maxLength(15)],
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
  get userNameIsInvalid(){
    return this.form.controls.userName.invalid 
    && this.form.controls.userName.touched
    && this.form.controls.userName.dirty;
  }
  onSubmit() {
     if (this.form.invalid) {
    this.form.markAllAsTouched(); 
    return;
  }
  const formValue: RegisterRequest = this.form.value as RegisterRequest;

  this.register(formValue).subscribe({
    next: (res) => {
      console.log('Registered successfully:', res);
      window.location.reload(); 
    },
    error: (err) => console.error('Registration failed:', err)
  });
}
 register(data: RegisterRequest): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/api/Auth/register`, data);
  }
}