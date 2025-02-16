import { Component, OnInit } from '@angular/core';
import { Channel } from '../models/channel';
import { activeChannel } from '../models/active-channel';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import { getFirestore, setDoc, doc, collection, getDocs, deleteDoc, onSnapshot, getDoc, updateDoc } from '@angular/fire/firestore';
import { getAuth, onAuthStateChanged, signOut, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

const app = initializeApp(environment.firebaseConfig);
const db=getFirestore(app);

@Component({
  selector: 'app-channel-selector',
  standalone: false,
  
  templateUrl: './channel-selector.component.html',
  styleUrl: './channel-selector.component.css'
})

export class ChannelSelectorComponent implements OnInit {
  currentUser: User | null = null;
  assignedChannels: string[] = [];
  isAdmin: boolean = false;

  constructor(private router: Router) {}

  async ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.isAdmin = userData['isAdmin'] || false;
          this.assignedChannels = userData['assignedChannels'] || [];
          this.showChannels();
        }
      }
    });
  }

  goToAdminDashboard() {
    this.router.navigate(['/admin-dashboard']);
  }
  
  
  logOut() {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error("Error logging out:", error);
      });
  }

  newChannelTitle : string = "";

  currentChannel: activeChannel = {
    id: "0",
    title: ""
  }
  
  
  channels: Channel[] = []



  addChannel(){
    if(this.newChannelTitle.trim().length > 0){
      let newChannel: Channel = {
        title: this.newChannelTitle,
        id: uuidv4()
      }
      
      const channelRef = doc(db,"channels",newChannel.id);
      setDoc(channelRef, newChannel)

      this.newChannelTitle="";

    }else
    alert("Channels Must Have a Name")
  }

  showChannels() {
    const channelRef = collection(db, "channels");

    onSnapshot(channelRef, (snapshot) => {
      let allChannels = snapshot.docs.map(doc => ({
        ...doc.data() as Channel
      }));

      if (!this.isAdmin) {
        this.channels = allChannels.filter(channel => this.assignedChannels.includes(channel.id));
      } else {
        this.channels = allChannels;
      }
    }, (error) => {
      console.error('Error fetching channels:', error);
    });
  }


  async deleteChannel(index: number) {
    const channelId = this.channels[index].id;
    const channelRef = doc(db, "channels", channelId);

    try {
        console.log(`Deleting channel ${channelId}...`);
        await deleteDoc(channelRef);
        console.log("Channel deleted successfully!");

        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const batchUpdates = usersSnapshot.docs.map(async (userDoc) => {
            const userRef = doc(db, "users", userDoc.id);
            const userData = userDoc.data();

            if (userData['assignedChannels']?.includes(channelId)) {
                const updatedChannels = userData['assignedChannels'].filter((id: string) => id !== channelId);
                await updateDoc(userRef, { assignedChannels: updatedChannels });

                console.log(`Removed channel ${channelId} from user ${userDoc.id}`);
            }
        });

        await Promise.all(batchUpdates);
        console.log("All affected users updated!");

    } catch (error) {
        console.error("Error deleting channel:", error);
    }
}


  selectChannel(index: number){
    this.currentChannel.title = this.channels[index].title;
  }

}