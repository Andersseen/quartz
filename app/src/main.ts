import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), provideRouter(routes)],
}).catch((err) => console.error(err));
