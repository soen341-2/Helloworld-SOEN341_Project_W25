import { Component } from '@angular/core';
import { Channel } from '../models/channel';
import { activeChannel } from '../models/active-channel';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import { getFirestore, setDoc, doc, collection, getDocs, deleteDoc, onSnapshot } from '@angular/fire/firestore';

const app = initializeApp(environment.firebaseConfig);
const db=getFirestore(app);

@Component({
  selector: 'app-channel-selector',
  standalone: false,
  
  templateUrl: './channel-selector.component.html',
  styleUrl: './channel-selector.component.css'
})
export class ChannelSelectorComponent {

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
        id: Date.now().toString()
      }
      
      const channelRef = doc(db,"channels",newChannel.id);
      setDoc(channelRef, newChannel)

      this.newChannelTitle="";

    }else
    alert("Channels Must Have a Name")
  }

  showChannels() {

    const channelRef = collection(db, "channels");

    const unsub = onSnapshot(channelRef, (snapshot) => {
      this.channels = snapshot.docs.map(doc => ({
        ...doc.data() as Channel
      }));
    }, (error) => {
      console.error('Error listening to channels:', error);
    });

  }

  ngOnInit() {

   this.showChannels();
  
  }

  deleteChannel(index: number){
    const channelRef = doc(db, "channels", this.channels[index].id);
    deleteDoc(channelRef);
    
  }

  selectChannel(index: number){
    this.currentChannel.title = this.channels[index].title;
  }

}