import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './headerComponent.html',
  styleUrl: './headerComponent.css'
})
export class Header {
  protected title = 'Task Management System';
  imgSrc = signal("assets/logo.jpg")
}
