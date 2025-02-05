import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appRouterProviders } from './app/app.routes'; // Import the routing providers

bootstrapApplication(AppComponent, {
  providers: [
    appRouterProviders // Provide routing configuration
  ]
}).catch(err => console.error(err));
