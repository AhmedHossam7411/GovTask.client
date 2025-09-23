import { Component, inject, NgModule } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginRequest } from './Login-request.model';
import { RouterModule } from '@angular/router';
import { passwordRules } from '../shared/Custom-validators';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule,RouterModule],
  templateUrl: './loginComponent.html',
  styleUrl: './loginComponent.css'
})

export class loginComponent {

  private auth = inject(Auth);

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
  const loginData = this.form.value as LoginRequest;

    this.auth.login(loginData).subscribe({
    next: (res) => {
      console.log('login success:', res); 
    },
    error: (err) => {
      this.errorMessage = 'Email or Password not found' 
      console.error('login failed:', err)
    }
    });
}

}