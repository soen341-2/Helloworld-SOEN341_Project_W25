import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { onSnapshot,QuerySnapshot, QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';

//alexia add
import { Firestore, doc, docData, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
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
  messages: { id:string; sender: string; message: string; timestamp: string }[] = [];
  newMessage: string = '';
  channels: any;
  currentChannel: any;
  messageService: any;
  currentUser: { uid?: string; username?: string; isAdmin?:boolean } = {};
  channelUsers: { id: string; username: string; status: string; lastSeen?: Date }[] = [];

  showEmojiPicker: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore, 
    private auth: Auth, 
    private router: Router
  ) {}

  ngOnInit(): void {

    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.fetchUserData(user.uid);
      }
    });

    this.route.paramMap.subscribe(params => {
      this.channelId = params.get('id');
      if (this.channelId) {
        this.getChannelName(this.channelId);
        this.loadMessages();
        this.loadChannelUsers(); 
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
  
  
  //alexia add

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any): void {
    this.newMessage += event.detail.unicode;
  }


  //alexia add 
  fetchUserData(userId: string): void {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    docData(userDocRef).subscribe((userDoc: any) => {
      console.log('Fetched userDoc:', userDoc); // For debugging
      if (userDoc) {
        this.currentUser = { 
          uid: userId, 
          username: userDoc.username || 'Unknown User',
        isAdmin: userDoc.isAdmin || false 
      };
      } else {
        this.currentUser = { uid: userId, username: 'Unknown User', isAdmin:false };
      }
    });
  }

  //alexia add
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

  loadMessages(): void {
    if (!this.channelId) return;
    
    const channelRef = doc(this.firestore, `channels/${this.channelId}`);

    docData(channelRef).subscribe((channelDoc: any) => {
        if (channelDoc?.isPrivate && !channelDoc.allowedUsers.includes(this.currentUser?.uid)) {
            alert("You don't have permission to access this conversation.");
            this.router.navigate(['/channels']);
            return;
        }

        // If user has access, fetch messages
        const messagesRef = collection(this.firestore, `channels/${this.channelId}/messages`);
        const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

        collectionData(messagesQuery, { idField: 'id' }).subscribe((msgs: any) => {
            this.messages = msgs.map((m: any) => ({
                id: m.id, 
                sender: m.sender,
                message: m.message,
                timestamp: m.timestamp?.toDate() ?? null
            }));
        });
    });
}


sendMessage(): void {
  if (this.newMessage.trim() !== '' && this.channelId) {
    const messagesRef = collection(this.firestore, `channels/${this.channelId}/messages`);
    
    const message = {
      sender: this.currentUser?.username ?? 'Me', 
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


          deleteMessage(messageId:string):void{
            if(!this.channelId || !this.currentUser.isAdmin) 
              return; 
            const messageRef = doc(this.firestore, `channels/${this.channelId}/messages/${messageId}`);

            if(confirm("Are you sure you want to delete this message?")){
              deleteDoc(messageRef).then(()=>{
                console.log("Message deleted successfully");
              })
              .catch(error=>{
                console.error("Error deleting message: ",error);
              });
            }

          }

          goToChannelSelector() {
            this.router.navigate(['/channels']);
          }

          logOut() {
            this.auth.signOut().then(() => {
              this.router.navigate(['/login']);
            }).catch(error => {
              console.error("Error logging out:", error);
            });
          }

        }
