import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/header";
import { register } from "./register/register";
import { login } from "./login/login";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, register, login],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('govTask');
}
