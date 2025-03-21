import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChannelSelectorComponent } from './channel-selector/channel-selector.component';
import { UserAuthComponent } from './user-auth/user-auth.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ChannelAreaComponent } from './channel-area/channel-area.component';



const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: UserAuthComponent },
  { path: 'channels', component: ChannelSelectorComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'channel-selector', component: ChannelSelectorComponent },
  { path: 'channel-area/:id', component: ChannelAreaComponent }, // Dynamic channel ID
  { path: '', redirectTo: '/channel-selector', pathMatch: 'full' } // Default route

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
