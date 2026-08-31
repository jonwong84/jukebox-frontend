import { TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await ɵresolveComponentResources(async (url) => {
      if (url.includes('app.html')) {
        return '<h1>Hello, jukebox-frontend</h1><router-outlet></router-outlet>';
      }
      return '';
    });

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, jukebox-frontend');
  });
});
