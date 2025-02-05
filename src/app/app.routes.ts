import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login/login.component'; // Import the LoginComponent

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect root to login
  { path: 'login', component: LoginComponent }          // Define the login route
];

export const appRouterProviders = [
  provideRouter(routes) // Provide the routing configuration
];
