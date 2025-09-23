import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './headerComponent.html',
  styleUrl: './headerComponent.css'
})
export class Header {
  protected title = 'Government Task Management';
  imgSrc = signal("assets/logo.jpg")
}
