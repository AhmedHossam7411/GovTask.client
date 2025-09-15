import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/header";
import { Register } from "./register/register";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Register],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('govTask');
}
