import './app/demo-styles.scss';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app.component';
import { appConfig } from './app/app.config';
import './styles.scss';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
