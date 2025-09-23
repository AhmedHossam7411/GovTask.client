import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/headerComponent";
import { RegisterComponent } from "./register/registerComponent";
import { LoginComponent } from "./login/loginComponent";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, RegisterComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('govTask');
}
