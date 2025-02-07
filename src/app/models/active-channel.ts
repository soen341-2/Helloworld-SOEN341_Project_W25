
import { Component, OnInit, Input } from '@angular/core';
import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

interface Channel {
    id: string;
    name: string;
}

@Component({
  selector: 'app-user-channels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-channels.component.html',
  styleUrls: ['./user-channels.component.css'],
})
export class UserChannelsComponent implements OnInit {
    @Input() userId: string = '';
    userChannels$: Observable<Channel[]>;

    constructor(private firestore: Firestore) {
      const channelsCollection = collection(this.firestore, 'channels');
      this.userChannels$ = collectionData(channelsCollection, { idField: 'id' }) as Observable<Channel[]>;
  }

    ngOnInit() {
        if (this.userId) {
            const userChannelsCollection = collection(this.firestore, 'users');
            const userQuery = query(userChannelsCollection, where('id', '==', this.userId));
            this.userChannels$ = collectionData(userQuery).pipe(
                map((users: any[]) => users.map(user => ({ id: user.channelId, name: user.channelId })))
            );
        }
    }
}
