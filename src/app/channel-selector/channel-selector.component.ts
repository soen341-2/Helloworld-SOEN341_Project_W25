import { Component } from '@angular/core';
import { Channel } from '../models/channel';
import { activeChannel } from '../models/active-channel';


@Component({
  selector: 'app-channel-selector',
  standalone: false,
  
  templateUrl: './channel-selector.component.html',
  styleUrl: './channel-selector.component.css'
})
export class ChannelSelectorComponent {

  newChannelTitle : string = "";

  currentChannel: activeChannel = {
    id: 0,
    title: ""
  }
  
  channels: Channel[] = []

  addChannel(){
    if(this.newChannelTitle.trim().length > 0){
      let newChannel: Channel = {
        id: Date.now(),
        title: this.newChannelTitle
      }
      
      this.channels.push(newChannel);

      this.newChannelTitle="";

    }else
    alert("Channels Must Have a Name")
  }

  deleteChannel(index: number){
    this.channels.splice(index,1);
  }

  selectChannel(index: number){
    this.currentChannel.id = this.channels[index].id;
    this.currentChannel.title = this.channels[index].title;
  }

}
