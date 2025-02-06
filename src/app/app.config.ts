import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(withEventReplay()), provideFirebaseApp(() => initializeApp({ projectId: "soen341-login", appId: "1:161449613416:web:04932a9c6b6cea0f6643dd", storageBucket: "soen341-login.firebasestorage.app", apiKey: "AIzaSyAlTf3yC19fy2ncvyDE0ZoW5ypHQD752sY", authDomain: "soen341-login.firebaseapp.com", messagingSenderId: "161449613416" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
