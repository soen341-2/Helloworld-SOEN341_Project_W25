import { Component, OnInit } from '@angular/core';
import { Firestore, collection, doc, updateDoc, getDocs, getDoc, getFirestore } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { onSnapshot } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import { Channel } from '../models/channel';

const app = initializeApp(environment.firebaseConfig);
const db=getFirestore(app);

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  channels: any[] = [];
  currentUser: any = null;

  constructor(private firestore: Firestore, private auth: Auth, private router: Router) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log("User signed in:", user.email);
        this.getCurrentUser();
      } else {
        console.log("No user signed in.");
        this.currentUser = null;
      }
    });
  }
  
  async ngOnInit() {
    console.log("Checking Firebase authentication state...");
  
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (user) {
        console.log("Authenticated user:", user.email);
        await this.getCurrentUser();
        this.listenToUserStatuses(); 
      } else {
        console.log("No authenticated user detected.");
        this.router.navigate(['/login']);
      }
    });
  }

  /*finding an already existing channel*/
  getChannelName(channelId: string): string {
    const channel = this.channels.find(ch => ch.id === channelId);
    return channel ? channel.title : "Unknown Channel";
  }
  
  /*changing to the page to the channel selector page*/
  goToChannelSelector() {
    this.router.navigate(['/channels']);
  }
  
  /*logout of current account and goes back to login/sign up page*/
  logOut() {
    this.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error("Error logging out:", error);
    });
  }
  
  /*getting selected option value from a dropdown change event */
  getSelectedValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  /*loading the current user, with user information*/
  async loadUsers() {
    if (!this.currentUser) {
      return;
    }
  
    console.log("Fetching users...");
    const usersRef = collection(this.firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);
  
    this.users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        email: userData['email'] || 'Unknown',
        username: userData['username'] || 'Unknown',
        isAdmin: userData['isAdmin'] || false,
        isSuperAdmin: userData['isSuperAdmin'] || false,
        assignedChannels: userData['assignedChannels'] || [],
        status: userData['status'] || 'offline',  
        lastSeen: userData['lastSeen'] ? new Date(userData['lastSeen'].seconds * 1000) : null
      };
    }).filter(user => user.id !== this.currentUser.id);
  
    console.log("Users loaded with status and lastSeen:", this.users);
  }

  /* using firebase, getting the user status + the last time they were active*/
  listenToUserStatuses() {
    const usersRef = collection(this.firestore, "users");
  
    onSnapshot(usersRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const updatedUser = this.users.find((u) => u.id === docSnap.id);
        if (updatedUser) {
          updatedUser.status = docSnap.data()['status'] || 'offline';
          updatedUser.lastSeen = docSnap.data()['lastSeen']
            ? new Date(docSnap.data()['lastSeen'].seconds * 1000)
            : null;
        }
      });
      console.log("User statuses updated in real-time.");
    });
  }

//getting the information from the firestore
  async loadChannels() {
    const channelRef = collection(db, "channels");
    
        onSnapshot(channelRef, (snapshot) => {
            this.channels = snapshot.docs.map(doc => {
                const channelData = doc.data() as Channel;
                return {
                    ...channelData,  
                    id: channelData.id ?? doc.id  
                };
            }).filter((channel: Channel) => (channel.isPrivate && !channel.isDM));
            
        }, (error) => {
            console.error('Error fetching channels:', error);
        });
  }

  async getCurrentUser() {
    if (!this.auth.currentUser) {
      console.log("No authenticated user detected.");
      return;
    }

    console.log("Fetching current user:", this.auth.currentUser.email);
  
    const userRef = doc(this.firestore, 'users', this.auth.currentUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      this.currentUser = { id: this.auth.currentUser.uid, ...userSnapshot.data() };
      console.log("Firestore User Data:", this.currentUser);
      
      await this.loadUsers();
      await this.loadChannels();

    } 
    else {
      console.log("Firestore user document not found.");
    }
  }

  //access to certain channels can only be given by the admin
  async assignUserToChannel(userId: string, channelId: string) {
    
    //checking for rights
    if (!this.currentUser?.isAdmin && !this.currentUser?.isSuperAdmin) {
      alert("Only Admins or SuperAdmins can assign users to channels!");
      return;
    }

    if (!channelId) {
      alert("Please select a channel before assigning.");
      return;
    }

    try {
      console.log(`Assigning user ${userId} to channel ${channelId}...`);
      
      //firestore
      const userRef = doc(this.firestore, 'users', userId);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        let userData = userSnapshot.data();
        let updatedChannels = userData['assignedChannels'] || [];

        //add channel if user not assigned
        if (!updatedChannels.includes(channelId)) {
          updatedChannels.push(channelId);
          await updateDoc(userRef, { assignedChannels: updatedChannels });
          console.log("User assigned to channel!");
        } else {
          alert("User is already assigned to this channel!");
        }
      }
    } 
    catch (error) {
      console.error("Error assigning user to channel:", error);
    }
  }
//only for admins -- assigning user to channel
  async toggleUserChannel(userId: string, channelId: string) {
    if (!this.currentUser?.isAdmin && !this.currentUser?.isSuperAdmin) {
      alert("Only Admins or SuperAdmins can manage channels!");
      return;
    }
    if (!channelId) {
      alert("Please select a channel before proceeding.");
      return;
    }

    try {
      console.log(`Toggling user ${userId} for channel ${channelId}...`);
      
      //from firestore
      const userRef = doc(this.firestore, 'users', userId);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        let userData = userSnapshot.data();
        let updatedChannels = userData['assignedChannels'] || [];

        if (updatedChannels.includes(channelId)) {
          updatedChannels = updatedChannels.filter((ch: string) => ch !== channelId);
          console.log("User deassigned from channel!");
        } 
        else {
          updatedChannels.push(channelId);
          console.log("User assigned to channel!");
        }
        await updateDoc(userRef, { assignedChannels: updatedChannels });
        await this.loadUsers();
      }
    } 
    catch (error) {
      console.error("Error toggling user channel:", error);
    }
  }

  //admins can assign other admins
  async makeAdmin(userId: string) {
    if (!this.currentUser?.isSuperAdmin) {
        alert("Only SuperAdmins can assign admins!");
        return;
    }
    try {
        console.log(`Making ${userId} an admin...`);
        const userRef = doc(this.firestore, 'users', userId);
        await updateDoc(userRef, { isAdmin: true });

        const channelsRef = collection(this.firestore, 'channels');
        const channelsSnapshot = await getDocs(channelsRef);
        const allChannelIds = channelsSnapshot.docs.map(doc => doc.id);

        await updateDoc(userRef, { assignedChannels: allChannelIds });

        console.log("User is now an admin!");
        await this.loadUsers();
    } 
    catch (error) {
        console.error("Error making user admin:", error);
    }
}

  async removeAdmin(userId: string) {
    if (!this.currentUser?.isSuperAdmin) {
      alert("Only SuperAdmins can remove admins!");
      return;
    }
    try {
      console.log(`Removing ${userId} as admin...`);
      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, { isAdmin: false });
      console.log("User is no longer an admin!");
      await this.loadUsers();
    } 
    catch (error) {
      console.error("Error removing admin:", error);
    }
  }
}