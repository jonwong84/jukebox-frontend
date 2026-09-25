import { Component, signal } from '@angular/core';
import { ArtistsList } from './artists-list/artists-list';

@Component({
  selector: 'app-root',
  imports: [ArtistsList],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('jukebox-frontend');
}
