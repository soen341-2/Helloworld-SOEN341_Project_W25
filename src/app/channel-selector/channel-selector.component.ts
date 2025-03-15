import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Channel } from '../models/channel';
import { activeChannel } from '../models/active-channel';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import { getFirestore, setDoc, doc, collection, getDocs, deleteDoc, onSnapshot, getDoc, updateDoc, collectionData,addDoc} from '@angular/fire/firestore';
import { getAuth, onAuthStateChanged, signOut, User, UserProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import * as firestore from '@angular/fire/firestore';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, switchMap } from 'rxjs/operators';
import { ChatMessage } from '../models/chat-message';

import 'emoji-picker-element';



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
  currentUsername: string = "";
  searchText: string = ''; 
  usernames$: Observable<string[]> = new Observable<string[]>();
  filteredUsernames$: Observable<string[]> = new Observable<string[]>();
  selectedUser: string | null = null;
  selectedUsername: string | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = "";
  activeConversations: { username: string }[] = []; 

  showEmojiPickerDirect: boolean = false;
  
  @ViewChild('emojiPickerContainer', { static: false })
  emojiPickerContainer!: ElementRef;

  //sarah part
  searchControl=new FormControl;
  constructor(private router: Router) {}

  async ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.isAdmin = userData['isAdmin'] || false;
          this.currentUsername = userData['username'] || [];
          this.assignedChannels = userData['assignedChannels'] || [];
          this.activeConversations = userData['activeConversations'] || [];
          this.showChannels();
        }
        
      }
    });
  
    
    this.usernames$ = this.getAllUsernames();
    this.filteredUsernames$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      switchMap(searchTerm =>
        this.usernames$.pipe(
          map(usernames =>
            usernames.filter(username => username.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        )
      )
    );
  }

  toggleEmojiPickerDirect(event: MouseEvent): void {
    event.stopPropagation();
    this.showEmojiPickerDirect = !this.showEmojiPickerDirect;
  }

  
  addEmojiDirect(event: any): void {
    this.newMessage += event.detail.unicode;
  }

  getAllUsernames(): Observable<string[]> {
    const ref = collection(db, 'users');
    return collectionData(ref).pipe(
      map(users => users.map(user => (user as { username?: string }).username || ''))
    );
  }
  async selectUser(username: string) {
    console.log("Choosing user:", username);
    this.selectedUsername = username;
   
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    let userId: string | null = null;
    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData['username'] === username) {
            userId = doc.id; 
        }
    });

    if (!userId) {
        console.error("Error loading user!");
        return;
    }

    this.selectedUser = userId;
    console.log("Selected User ID:", userId);

    const chatId = this.getChatId(this.currentUser!.uid, userId);
    const chatRef = doc(db, "channels", chatId);
    const chatSnap = await getDoc(chatRef);
      
    if (!chatSnap.exists()){
      await setDoc(chatRef, {
        title: `Private chat: ${this.currentUser!.uid} & ${userId}`,
        isPrivate: true,
        allowedUsers: [this.currentUser!.uid, userId]
      });
    }

    this.loadMessages(userId);
    
    if (!this.activeConversations.some(convo => convo.username === username)) {
        this.activeConversations.push({ username });
    }
}
  loadMessages(userId: string) {
    console.log("load messages", userId);
    const chatId = this.getChatId(this.currentUser!.uid, userId);
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const messagesQuery = firestore.query(
      messagesRef,
      firestore.orderBy("timestamp", "asc") // Trie chronologiquement
    );

    onSnapshot(messagesQuery, (snapshot) => {
      this.messages = snapshot.docs
      .map(doc => doc.data() as ChatMessage)
      .filter(msg => 
        msg.senderId === this.currentUser!.uid || msg.receiverId === this.currentUser!.uid
      );
      console.log("load messages :", this.messages);
    });
  }
  getChatId(user1: string, user2: string): string {
    return [user1, user2].sort().join("_"); 
    
  }
  selectActiveConversation(username: string) {
    console.log("conversation with", username);
    this.selectedUser = username;
    this.selectedUsername = username;
    this.loadMessages(username);
  }

  async mergeChats(user1: string, user2: string) {
    const correctChatId = this.getChatId(user1, user2);
    const wrongChatId = `${user2}_${user1}`;

    if (correctChatId === wrongChatId) return;

    console.log(`Fusion de ${wrongChatId} → ${correctChatId}`);

    const wrongMessagesRef = collection(db, `chats/${wrongChatId}/messages`);
    const correctMessagesRef = collection(db, `chats/${correctChatId}/messages`);

    const messagesSnapshot = await getDocs(wrongMessagesRef);

    messagesSnapshot.forEach(async (msgDoc) => {
      await setDoc(doc(correctMessagesRef, msgDoc.id), msgDoc.data());
    });

    await deleteDoc(doc(db, "chats", wrongChatId));
    console.log(`Chat ${wrongChatId} supprimé après fusion.`);
  }
  sendMessage() {
    if (!this.newMessage.trim()) return;

    const chatId = this.getChatId(this.currentUser!.uid!, this.selectedUser!);
    const messagesRef = collection(db, `chats/${chatId}/messages`);

    const newChatMessage: ChatMessage = {
      senderId: this.currentUser!.uid!,
      receiverId: this.selectedUser!,
      message: this.newMessage,
      timestamp: Date.now(),
    };

    addDoc((messagesRef), newChatMessage)
      .then(() => {
        console.log("Message sent !",this.selectUser);
        this.newMessage = "";
      })
      .catch(error => console.error("Error:", error));
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
        id: uuidv4(),
        isPrivate: false,
        allowedUsers: []
      };
      
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
        this.channels = allChannels.filter((channel: Channel) => 
            !channel.isPrivate || (Array.isArray(channel.allowedUsers) && channel.allowedUsers.includes(this.currentUser?.uid ?? ""))
        );
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

selectChannel(channelIndex: number): void {
  this.currentChannel = this.channels[channelIndex];
  this.router.navigate(['/channel-area', this.currentChannel.id]);  // Navigate to chat
}

}