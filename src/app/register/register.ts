import { Component, inject, NgModule } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';


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
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class register {
  private httpClient = inject(HttpClient);
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
  onSubmit() 
  {
    console.log(this.form);
  }
  
}