import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators,} from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class register {
  form = new FormGroup({
    email : new FormControl('',{
      validators: [Validators.required, Validators.email,],
    }),
    password : new FormControl('',{
      validators: [Validators.required, Validators.minLength(6),],
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
  onSubmit() 
  {
    console.log(this.form);
  }
  
}