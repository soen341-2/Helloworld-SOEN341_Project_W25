import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

//alexia add
import { Firestore, doc, docData, collection, addDoc, serverTimestamp, query, orderBy, deleteDoc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';


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


  constructor(private route: ActivatedRoute,private firestore: Firestore, private auth: Auth, private router: Router) {}

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
      } else {
        this.channelName = 'Unknown Channel';
      }
    });

    
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
        isAdmin: userDoc.isAdmin || false };
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
          .then(() => {
            this.newMessage = '';
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
