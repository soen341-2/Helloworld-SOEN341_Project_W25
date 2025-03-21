import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { onSnapshot } from '@angular/fire/firestore';
import { Firestore, doc, docData, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc, getDoc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth, getAuth, signOut } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import 'emoji-picker-element';

@Component({
  selector: 'app-channel-area',
  standalone: false,
  templateUrl: './channel-area.component.html',
  styleUrl: './channel-area.component.css'
})
export class ChannelAreaComponent implements OnInit {
  channelId: string | null = null;
  channelName: string = '';
  messages: { id: string; sender: string; message: string; timestamp: string }[] = [];
  newMessage: string = '';
  channels: any;
  currentChannel: any;
  messageService: any;
  channelUsers: { id: string; username: string; status: string; lastSeen?: Date }[] = [];
  users$: Observable<any[]> = new Observable();
  selectedUserToInvite: string | null = null;
  allowedUsers: string[] = [];
  currentUser: { uid: string; username: string; isAdmin: boolean } = {
    uid: '',
    username: 'Unknown User',
    isAdmin: false
  };

  showEmojiPicker: boolean = false;
  pendingInvites: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid ?? '',
          username: user.displayName ?? 'Unknown User',
          isAdmin: false
        };
        console.log("User logged in:", this.currentUser.uid);
      } else {
        console.log("No user found, waiting for auth...");
      }
    });

    this.route.paramMap.subscribe(params => {
      this.channelId = params.get('id');
      if (this.channelId) {
        setTimeout(() => {
          this.getChannelName(this.channelId!);
          this.loadChannelUsers();
          this.loadMessages();
          this.getChannelData();
          this.loadAllUsers();
        }, 300);
      } else {
        this.channelName = 'Unknown Channel';
      }
    });
  }

  loadChannelUsers(): void {
    if (!this.channelId) return;

    const channelRef = doc(this.firestore, `channels/${this.channelId}`);
    docData(channelRef).subscribe(async (channelDoc: any) => {
      if (channelDoc && channelDoc.allowedUsers) {
        const allowedUsers = channelDoc.allowedUsers;
        const usersRef = collection(this.firestore, "users");

        onSnapshot(usersRef, (snapshot) => {
          this.channelUsers = snapshot.docs
            .map(docSnap => {
              const userData = docSnap.data();
              if (allowedUsers.includes(docSnap.id)) {
                return {
                  id: docSnap.id,
                  username: userData['username'] || 'Unknown',
                  status: userData['status'] || 'offline',
                  lastSeen: userData['lastSeen']?.seconds
                    ? new Date(userData['lastSeen'].seconds * 1000)
                    : undefined
                };
              }
              return null;
            })
            .filter(user => user !== null) as { id: string; username: string; status: string; lastSeen?: Date }[];

          console.log("Updated channelUsers:", JSON.stringify(this.channelUsers, null, 2));
        });
      }
    });
  }

  getUserStatusEmoji(username: string): string {
    const user = this.channelUsers.find(u => u.username === username);
    console.log("Checking status for:", username, "Found:", user?.status);

    if (!user) return '🔴';

    switch (user.status) {
      case 'online':
        return '🟢';
      case 'away':
        return '🟠';
      case 'offline':
      default:
        return '🔴';
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any): void {
    this.newMessage += event.detail.unicode;
  }

  fetchUserData(userId: string): void {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    docData(userDocRef).subscribe((userDoc: any) => {
      console.log('Fetched userDoc:', userDoc);
      if (userDoc) {
        this.currentUser = {
          uid: userId,
          username: userDoc.username || 'Unknown User',
          isAdmin: userDoc.isAdmin || false 
      };
      } else {
        this.currentUser = { uid: userId, username: 'Unknown User', isAdmin: false };
      }
    });
  }

  getChannelName(channelId: string): void {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    docData(channelRef).subscribe((channelDoc: any) => {
      if (channelDoc && channelDoc.title) {
        this.channelName = channelDoc.title;
      } else {
        this.channelName = 'Unknown Channel';
      }
    });
  }

  getChannelData(): void {
    if (!this.channelId) return;
    const channelRef = doc(this.firestore, `channels/${this.channelId}`);
    docData(channelRef).subscribe((channelDoc: any) => {
      if (channelDoc) {
        this.channelName = channelDoc.title;
        this.allowedUsers = channelDoc.allowedUsers || [];
      }
    });
  }

  loadMessages(): void {
    if (!this.channelId) return;

    const channelRef = doc(this.firestore, `channels/${this.channelId}`);
    docData(channelRef).subscribe((channelDoc: any) => {
      if (!this.currentUser?.uid) {
        console.error("User ID not loaded yet! Retrying...");
        return;
      }

      console.log("Firestore Channel Data:", channelDoc);
      console.log(" Allowed Users from Firestore:", channelDoc?.allowedUsers);
      console.log("Current User UID:", this.currentUser.uid);

      if (channelDoc?.isPrivate && !channelDoc.allowedUsers.includes(this.currentUser.uid)) {
        alert("You don't have permission to access this conversation.");
        this.router.navigate(['/channels']);
        return;
      }

      const messagesRef = collection(this.firestore, `channels/${this.channelId}/messages`);
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

      collectionData(messagesQuery, { idField: 'id' }).subscribe(async (msgs: any[]) => {
        const updatedMessages = await Promise.all(msgs.map(async (m) => {
          const userRef = doc(this.firestore, `users/${m.sender}`);
          const userSnap = await getDoc(userRef);
          const username = userSnap.exists() ? userSnap.data()['username'] : "Unknown User";
     
          return {
            id: m.id,
            sender: username,  
            message: m.message,
            timestamp: m.timestamp?.toDate() ?? null
          };
        }));
     
        this.messages = updatedMessages;
      });
    });
  }

  loadAllUsers(): void {
    const usersRef = collection(this.firestore, "users");
    this.users$ = collectionData(usersRef, { idField: 'id' });
  }

  sendMessage(): void {
    if (this.newMessage.trim() !== '' && this.channelId) {
      const messagesRef = collection(this.firestore, `channels/${this.channelId}/messages`);

      const message = {
        sender: this.currentUser?.uid || 'Unknown User',  
        message: this.newMessage,
        timestamp: serverTimestamp()
      };

      addDoc(messagesRef, message)
        .then(async () => {
          this.newMessage = '';
          if (this.currentUser?.uid) {
            const userRef = doc(this.firestore, `users/${this.currentUser.uid}`);
            await updateDoc(userRef, {
              status: 'online',
              lastSeen: new Date()
            });
          }
        })
        .catch(error => {
          console.error("Error sending message: ", error);
        });
    }
  }

  deleteMessage(messageId: string): void {
    if (!this.channelId || !this.currentUser.isAdmin)
      return;
    const messageRef = doc(this.firestore, `channels/${this.channelId}/messages/${messageId}`);

    if (confirm("Are you sure you want to delete this message?")) {
      deleteDoc(messageRef).then(() => {
        console.log("Message deleted successfully");
      })
        .catch(error => {
          console.error("Error deleting message: ", error);
        });
    }
  }

  goToChannelSelector() {
    this.router.navigate(['/channels']);
  }

  async logOut() {
    try {
      if (this.currentUser.uid) {
        const userRef = doc(this.firestore, `users/${this.currentUser.uid}`);
        await updateDoc(userRef, { status: 'offline', lastSeen: new Date() });
      }

      const auth = getAuth();
      await signOut(auth);

      console.log("User logged out successfully.");

      this.currentUser = { uid: '', username: 'Guest', isAdmin: false };
      this.router.navigate(['/login']);

    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
  async inviteUser() {
    if (!this.channelId || !this.selectedUserToInvite) {
      alert("Please select a user to invite.");
      return;
    }
   
    const channelRef = doc(this.firestore, `channels/${this.channelId}`);
   
    try {
      await updateDoc(channelRef, {
        pendingInvites: Array.from(new Set([...this.allowedUsers, this.selectedUserToInvite]))
      });
   
      alert("Invitation sent! Waiting for user approval.");
      this.selectedUserToInvite = null;
    } catch (error) {
      console.error("Error sending invite:", error);
    }
  }
  loadInvitations(): void {
    const channelsRef = collection(this.firestore, 'channels');
    onSnapshot(channelsRef, (snapshot) => {
      const invitedChannels = snapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        return data['pendingInvites']?.includes(this.currentUser.uid);
      });
   
      console.log("User invited to channels:", invitedChannels);
    });
  }

  async acceptInvite(channelId: string) {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    const channelSnap = await docData(channelRef).toPromise();
    if (!channelSnap) return;
   
    const updatedAllowed = [...(channelSnap['allowedUsers'] || []), this.currentUser.uid];
    const updatedPending = (channelSnap['pendingInvites'] || []).filter((id: string) => id !== this.currentUser.uid);
   
    await updateDoc(channelRef, {
      allowedUsers: updatedAllowed,
      pendingInvites: updatedPending
    });
   
    alert("You have joined the channel!");
  }

  async declineInvite(channelId: string) {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    const channelSnap = await docData(channelRef).toPromise();
   
    if (!channelSnap) return;
   
    const updatedPending = (channelSnap['pendingInvites'] || []).filter((id: string) => id !== this.currentUser.uid);
   
    await updateDoc(channelRef, {
      pendingInvites: updatedPending
    });
   
    alert("You declined the invitation.");
  }
  
}
