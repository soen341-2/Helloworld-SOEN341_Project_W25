import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { onSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-channel-management',
  standalone: false,
  templateUrl: './channel-management.component.html',
  styleUrls: ['./channel-management.component.css'],
})
export class ChannelManagementComponent implements OnInit {
  enterChannel(arg0: any) {
    throw new Error('Method not implemented.');
  }
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm = '';

  channels: any[] = [];
  currentUser: any = null;
  joinRequests: any[] = [];
  newPublicChannelTitle = '';
  newPrivateChannelTitle = '';
  invitedUsers = '';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userRef = doc(this.firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          this.currentUser = {
            id: userSnap.id, // Set document ID as user ID
            ...userSnap.data(),
          };
          console.log('Current User:', this.currentUser);
        }
        this.loadChannels();
        this.loadJoinRequests();
      } else {
        this.currentUser = null;
      }
    });
  }

  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();
    await this.loadJoinRequests();
  }

  //loads users from firestore
  async loadUsers() {
    const usersRef = collection(this.firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);
    this.users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('Users from Firestore:', this.users); // Debugging log
  }

  //load channels from firestore
  async loadChannels() {
    const channelsRef = collection(this.firestore, 'channels');
    const channelsSnapshot = await getDocs(channelsRef);
    this.channels = channelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  //load join requests from firestore
  async loadJoinRequests() {
    const joinRequestsRef = collection(this.firestore, 'joinRequests');
    const requestsSnapshot = await getDocs(joinRequestsRef);
    this.joinRequests = requestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  //creates a public channel where all users are welcome
  async createPublicChannel(title: string) {
    if (!this.currentUser?.isAdmin) return;

    const channelRef = doc(
      this.firestore,
      'channels',
      title.replace(/\s+/g, '-').toLowerCase()
    );
    await setDoc(channelRef, {
      title: title,
      isPrivate: false,
      allowedUsers: [],
    });
    await this.loadChannels();
  }

  //creates a private channel where assigned users are welcome
  async createPrivateChannel(title: string, invitedUsers: string[]) {
    if (!this.currentUser) return;

    const channelRef = doc(
      this.firestore,
      'channels',
      title.replace(/\s+/g, '-').toLowerCase()
    );
    await setDoc(channelRef, {
      title: title,
      isPrivate: true,
      allowedUsers: invitedUsers,
    });
    await this.loadChannels();
  }

  //requests to join a channel
  async requestToJoin(channelId: string) {
    if (!this.currentUser) return;

    const requestRef = doc(
      this.firestore,
      'joinRequests',
      `${this.currentUser.id}_${channelId}`
    );
    await setDoc(requestRef, {
      userId: this.currentUser.id,
      channelId: channelId,
      status: 'pending',
    });
  }

  //allows user to leave channel
  async leaveChannel(channelId: string) {
    if (!this.currentUser) return;

    const channelRef = doc(this.firestore, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (channelSnap.exists()) {
      let allowedUsers = channelSnap.data()['allowedUsers'] || [];
      allowedUsers = allowedUsers.filter(
        (userId: any) => userId !== this.currentUser.id
      );
      await updateDoc(channelRef, { allowedUsers });
      await this.loadChannels();
    }
  }

  //accepts a join channel request
  async acceptJoinRequest(
    requestId: string,
    userId: string,
    channelId: string
  ) {
    const requestRef = doc(this.firestore, 'joinRequests', requestId);
    await updateDoc(requestRef, { status: 'accepted' });

    const channelRef = doc(this.firestore, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (channelSnap.exists()) {
      const allowedUsers = channelSnap.data()['allowedUsers'] || [];
      if (!allowedUsers.includes(userId)) {
        allowedUsers.push(userId);
        await updateDoc(channelRef, { allowedUsers });
      }
    }
  }

  //declines a join channel request
  async declineJoinRequest(requestId: string) {
    const requestRef = doc(this.firestore, 'joinRequests', requestId);
    await updateDoc(requestRef, { status: 'declined' });
  }

  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [];
      return;
    }

    console.log('Searching for:', this.searchTerm); // Debugging log
    console.log('All Users Before Filter:', this.users); // Debugging log

    this.filteredUsers = this.users.filter((user) =>
      user?.username?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    console.log('Filtered Users:', this.filteredUsers); // Debugging log
  }
}
