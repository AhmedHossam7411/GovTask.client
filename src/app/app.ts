import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/headerComponent";
import { registerComponent } from "./register/registerComponent";
import { loginComponent } from "./login/loginComponent";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, registerComponent, loginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('govTask');
}
