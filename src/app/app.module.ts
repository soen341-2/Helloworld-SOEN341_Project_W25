import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment.development';
import { ChannelSelectorComponent } from './channel-selector/channel-selector.component';
import { ChannelAreaComponent } from './channel-area/channel-area.component';
import { UserAuthComponent } from './user-auth/user-auth.component';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
//sarah add
import { MatFormFieldModule} from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';



@NgModule({
  declarations: [
    AppComponent,
    ChannelSelectorComponent,
    ChannelAreaComponent,
    UserAuthComponent,
    AdminDashboardComponent,
    

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    //sarah add
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule
  ],
  
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor() {
    console.log("Firebase Apps:", getApps());
  }

 }
