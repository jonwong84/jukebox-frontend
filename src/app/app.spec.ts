import { TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await ɵresolveComponentResources(async (url) => {
      if (url.includes('app.html')) {
        return '<app-artists-list />';
      }
      if (url.includes('artists-list.html')) {
        return '<div class="artists-container"><h2>Artists</h2></div>';
      }
      return '';
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the artists list component', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-artists-list')).toBeTruthy();
  });
});
