import { Component, OnInit } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, deleteDoc, collectionData, DocumentData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
    id: string;
    name: string;
}

interface Channel {
    id: string;
    name: string;
}

interface UserChannel {
    userId: string;
    channelId: string;
}

@Component({
  selector: 'app-assign',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './assign.component.html',
  styleUrls: ['./assign.component.css'],
})
export class AssignComponent implements OnInit {
    users$: Observable<(User & { channelId?: string })[]>;  
    channels$: Observable<Channel[]>; 
    selectedUser: string = '';
    selectedChannel: string = '';
    channelsMap: { [key: string]: string } = {}; 
    userChannels$: Observable<Channel[]>; 
    currentUser = 'user1'; //change after with login

    constructor(private firestore: Firestore) {
        const usersCollection = collection(this.firestore, 'users');
        const channelsCollection = collection(this.firestore, 'channels');
        const userChannelsCollection = collection(this.firestore, 'user_channels');

       
        this.channels$ = collectionData(channelsCollection, { idField: 'id' }).pipe(
            map((channels: DocumentData[]) => {
                return channels.map(channel => ({
                    id: channel['id'],
                    name: channel['name'] ?? 'Unknown'
                }));
            })
        );

       
        this.channels$.subscribe(channels => {
            this.channelsMap = {};
            channels.forEach(channel => {
                this.channelsMap[channel.id] = channel.name;
            });
        });

        
        this.users$ = collectionData(usersCollection, { idField: 'id' }).pipe(
            map((users: DocumentData[]) => {
                return users.map(user => ({
                    id: user['id'],
                    name: user['name'],
                    channelId: user['channelId'] ?? null 
                }));
            })
        );

        
        this.userChannels$ = collectionData(userChannelsCollection, { idField: 'id' }).pipe(
            map((userChannels: DocumentData[]) => {
                return userChannels
                    .filter(uc => uc['userId'] === this.currentUser)
                    .map(uc => ({
                        id: uc['channelId'],
                        name: this.channelsMap[uc['channelId']] ?? 'Unknown'
                    }));
            })
        );
    }

    ngOnInit() {}

    async assignUserToChannel() {
        if (!this.selectedUser || !this.selectedChannel) {
            alert('choose a user.');
            return;
        }

        const userChannelsCollection = collection(this.firestore, 'user_channels');
        const existingQuery = query(userChannelsCollection, where('userId', '==', this.selectedUser));

        try {
            const existingDocs = await getDocs(existingQuery);
            existingDocs.forEach(async (docSnap) => {
                await deleteDoc(docSnap.ref);
            });

            await addDoc(userChannelsCollection, {
                userId: this.selectedUser,
                channelId: this.selectedChannel
            });

            alert('assign successfully !');
        } catch (error) {
            console.error("Error:", error);
            alert("fail");
        }
    }

    async unassignUser(userId: string) {
        const userChannelsCollection = collection(this.firestore, 'user_channels');
        const userChannelQuery = query(userChannelsCollection, where('userId', '==', userId));

        try {
            const userChannelDocs = await getDocs(userChannelQuery);
            userChannelDocs.forEach(async (docSnap) => {
                await deleteDoc(docSnap.ref);
            });

            alert('user assign successfully !');
        } catch (error) {
            console.error("error:", error);
            alert("fail");
        }
    }
}
