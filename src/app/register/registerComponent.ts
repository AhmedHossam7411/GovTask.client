import { Component, inject} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterRequest } from './register-Request.model';
import { Router, RouterModule } from '@angular/router';
import { passwordRules } from '../shared/Custom-validators';
import { Auth } from '../services/auth-service';


@Component({
  selector: 'app-register',
  imports: [CommonModule,ReactiveFormsModule,RouterModule],
  templateUrl: './registerComponent.html',
  styleUrl: './registerComponent.css'
})

export class RegisterComponent {
  private auth = inject(Auth);
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
  const registerData = this.form.value as RegisterRequest;

    this.auth.register(registerData).subscribe({
    next: (res) => { 
      console.log('Registered successfully:', res);
      localStorage.setItem('authToken', res.token);
      this.router.navigate(['/login']);
    },
    error: (err) => console.error('Registration failed:', err)
   });
 }
 
 
}