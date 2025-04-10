import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Channel } from '../models/channel';
import { activeChannel } from '../models/active-channel';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  collectionData,
  addDoc,
} from '@angular/fire/firestore';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import * as firestore from '@angular/fire/firestore';
import { Timestamp } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, switchMap } from 'rxjs/operators';
import { ChatMessage } from '../models/chat-message';
import { Notification } from '../models/notification';
import 'emoji-picker-element';
import { ChangeDetectorRef } from '@angular/core';

const app = initializeApp(environment.firebaseConfig);
const db = getFirestore(app);

@Component({
  selector: 'app-channel-selector',
  standalone: false,

  templateUrl: './channel-selector.component.html',
  styleUrl: './channel-selector.component.css',
})
export class ChannelSelectorComponent implements OnInit {
  private inactivityTimer: any;
  private INACTIVITY_DELAY = 30000;

  currentUser: User | null = null;
  assignedChannels: string[] = [];
  isAdmin = false;
  currentUsername = '';
  searchText = '';
  usernames$: Observable<string[]> = new Observable<string[]>();
  filteredUsernames$: Observable<string[]> = new Observable<string[]>();
  selectedUser: string | null = null;
  selectedUsername: string | null = null;
  messages: ChatMessage[] = [];
  replyingToMessage: ChatMessage | null = null;
  newMessage = '';
  activeConversations: { username: string }[] = [];
  currentUserStatus = 'offline';
  selectedUserStatus = 'offline';
  selectedUserLastSeen: Date | null = null;
  channelUsersMap = new Map<
    string,
    { id: string; username: string; status: string; lastSeen?: Date }[]
  >();
  isDarkMode = false;
  showNotificationPanel = false;

  // Default background color (can be any valid hex color)
  chatBackgroundColors: Record<string, string> = {};

  newChannelPrivacy = false;
  pendingInvites: {
    id: any;
    username: any;
    channelId: string;
    channelTitle: string;
  }[] = [];

  showEmojiPickerDirect = false;

  @ViewChild('emojiPickerContainer', { static: false })
  emojiPickerContainer!: ElementRef;


  //sarah part
  searchControl = new FormControl();
  constructor(private router: Router, private cdRef: ChangeDetectorRef) {}

  async ngOnInit() {
    const auth = getAuth();
    const savedColors = localStorage.getItem('dmBgColors');
    if (savedColors) {
      this.chatBackgroundColors = JSON.parse(savedColors);
    }
    // Add this to your existing ngOnInit method
    const darkModePreference = localStorage.getItem('darkMode');
    if (darkModePreference === 'enabled') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        console.log('Logged-in User:', this.currentUser);
        console.log('Current User UID:', this.currentUser.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        this.listenToNotifications();

        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.isAdmin = !!userData['isAdmin'] || false;
          this.currentUsername = userData['username'] || [];
          this.assignedChannels = userData['assignedChannels'] || [];
          this.activeConversations = userData['activeConversations'] || [];
          this.currentUserStatus = userData['status'] || 'offline';
          this.listenToUserStatus();
          await this.updateUserStatus('online');
          this.startInactivityTimer();
          if (!this.isAdmin) {
            this.loadPendingInvites();
          }

          /* if (this.isAdmin) {
            await this.createDefaultChannelsIfMissing();
          }*/
        }
        this.showChannels();
      }
    });

    this.usernames$ = this.getAllUsernames();
    this.filteredUsernames$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      switchMap((searchTerm) =>
        this.usernames$.pipe(
          map((usernames) =>
            usernames.filter((username) =>
              username.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
        )
      )
    );
  }

  async updateUserStatus(status: string) {
    if (this.currentUser) {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, { status: status, lastSeen: new Date() });
    }
  }
  startInactivityTimer() {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.updateUserStatus('away');
    }, this.INACTIVITY_DELAY);
  }

  @HostListener('mousemove')
  @HostListener('keydown')
  @HostListener('click')
  resetInactivityTimer() {
    if (this.currentUserStatus !== 'online') {
      this.updateUserStatus('online');
    }
    this.startInactivityTimer();
  }
  async selectUser(username: string) {
    console.log('Choosing user:', username);
    this.selectedUsername = username;

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let userId: string | null = null;
    let userStatus = 'offline';
    let userLastSeen: Date | null = null;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData['username'] === username) {
        userId = doc.id;
        userStatus = userData['status'] || 'offline';
        userLastSeen = userData['lastSeen']
          ? new Date(userData['lastSeen'])
          : null;
      }
    });

    if (!userId) {
      console.error('Error loading user!');
      return;
    }

    this.selectedUser = userId;
    this.selectedUserStatus = userStatus;
    this.selectedUserLastSeen = userLastSeen;
    this.listenToSelectedUserStatus();
    console.log(
      'Selected User ID:',
      userId,
      'Status:',
      this.selectedUserStatus
    );

    const chatId = this.getChatId(this.currentUser!.uid, userId);
    const chatRef = doc(db, 'channels', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        title: `Private chat: ${this.currentUser!.uid} & ${userId}`,
        isPrivate: true,
        isDM: true,
        allowedUsers: [this.currentUser!.uid, userId],
      });
    }

    this.loadMessages(userId);

    if (
      !this.activeConversations.some((convo) => convo.username === username)
    ) {
      this.activeConversations.push({ username });
    }
  }
  listenToSelectedUserStatus() {
    if (!this.selectedUser) return;

    const userRef = doc(db, 'users', this.selectedUser);
    onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.selectedUserStatus = userData['status'] || 'offline';
        this.selectedUserLastSeen =
          userData['lastSeen'] && userData['lastSeen'].seconds
            ? new Date(userData['lastSeen'].seconds * 1000)
            : null;
      }
    });
  }

  reply(message: ChatMessage) {
    this.replyingToMessage = message;
  }

  //ADDED RN
  onColorChange(event: Event): void {
    const newColor = (event.target as HTMLInputElement).value;

    if (this.selectedUsername) {
      this.chatBackgroundColors[this.selectedUsername] = newColor;
      localStorage.setItem(
        'dmBgColors',
        JSON.stringify(this.chatBackgroundColors)
      );
    }
  }

  get chatBackgroundColor(): string {
    return this.selectedUsername &&
      this.chatBackgroundColors[this.selectedUsername]
      ? this.chatBackgroundColors[this.selectedUsername]
      : '#ffffff'; // default
  }

  saveBackgroundColors(): void {
    localStorage.setItem(
      'dmBgColors',
      JSON.stringify(this.chatBackgroundColors)
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
      map((users) =>
        users.map((user) => (user as { username?: string }).username || '')
      )
    );
  }

  getMessageById(id: string): ChatMessage | undefined {
    return this.messages.find((msg) => msg.id === id);
  }

  loadMessages(userId: string) {
    console.log('load messages', userId);
    const chatId = this.getChatId(this.currentUser!.uid, userId);
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const messagesQuery = firestore.query(
      messagesRef,
      firestore.orderBy('timestamp', 'asc')
    );

    onSnapshot(messagesQuery, (snapshot) => {
      this.messages = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as ChatMessage),
        }))
        .filter(
          (msg) =>
            msg.senderId === this.currentUser!.uid ||
            msg.receiverId === this.currentUser!.uid
        );
      console.log('load messages :', this.messages);
      this.cdRef.detectChanges();
    });
  }
  getChatId(user1: string, user2: string): string {
    return [user1, user2].sort().join('_');
  }
  selectActiveConversation(username: string) {
    console.log('conversation with', username);
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
    const correctMessagesRef = collection(
      db,
      `chats/${correctChatId}/messages`
    );

    const messagesSnapshot = await getDocs(wrongMessagesRef);

    messagesSnapshot.forEach(async (msgDoc) => {
      await setDoc(doc(correctMessagesRef, msgDoc.id), msgDoc.data());
    });

    await deleteDoc(doc(db, 'chats', wrongChatId));
    console.log(`Chat ${wrongChatId} supprimé après fusion.`);
  }
  sendMessage() {
    if (!this.newMessage.trim()) return;

    const chatId = this.getChatId(this.currentUser!.uid!, this.selectedUser!);
    const messagesRef = collection(db, `chats/${chatId}/messages`);

    const mentionedUsernames = this.getMentions(this.newMessage);

    const newChatMessage: ChatMessage = {
      senderId: this.currentUser!.uid!,
      receiverId: this.selectedUser!,
      message: this.newMessage,
      timestamp: Date.now(),
      replyId: this.replyingToMessage ? this.replyingToMessage.id : '',
      mentions: mentionedUsernames,
    };

    addDoc(messagesRef, newChatMessage)
      .then(async () => {
        this.newMessage = '';
        this.replyingToMessage = null;

        this.cdRef.detectChanges();

        if (!this.isDMConversation()) {
          for (const mentionedUsername of mentionedUsernames) {
            await this.sendMentionNotification(
              mentionedUsername,
              newChatMessage
            );
          }
        }
      })
      .catch((error) => console.error('Error:', error));
    this.cdRef.detectChanges();
  }

  goToAdminDashboard() {
    this.router.navigate(['/admin-dashboard']);
  }

  async sendMentionNotification(username: string, message: ChatMessage) {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    let targetUserId = null;

    snapshot.forEach((doc) => {
      if (doc.data()['username'] === username) {
        targetUserId = doc.id;
      }
    });

    if (!targetUserId) return;

    const notifRef = collection(db, `users/${targetUserId}/notifications`);
    await addDoc(notifRef, {
      from: this.currentUsername,
      message: message.message,
      timestamp: Timestamp.now(),
      read: false,
      chatId: this.getChatId(this.currentUser!.uid, targetUserId),
      channelTitle: this.currentChannel.id,
    });
  }

  isDMConversation(): boolean {
    const chatId = this.getChatId(this.currentUser!.uid, this.selectedUser!);
    return this.channels.every((channel) => channel.id !== chatId);
  }

  async logOut() {
    if (!this.currentUser) return;

    const userRef = doc(db, 'users', this.currentUser.uid);
    try {
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: Timestamp.now(),
      });

      const auth = getAuth();
      await signOut(auth);

      console.log('User logged out successfully.');

      this.currentUser = null;
      this.isAdmin = false;
      this.currentUsername = 'Guest';
      this.currentUserStatus = 'offline';
      this.cdRef.detectChanges();

      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  @HostListener('window:beforeunload', ['$event'])
  async handleBeforeUnload(event: Event) {
    if (this.currentUser) {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: new Date(),
      });
    }
  }

  newChannelTitle = '';

  currentChannel: activeChannel = {
    id: '0',
    title: '',
  };

  channels: Channel[] = [];

  async addChannel() {
    if (this.newChannelTitle.trim().length === 0) {
      alert('Channels must have a name');
      return;
    }

    //Users can only create private channels, Admins can choose
    const isPrivate = this.isAdmin ? this.newChannelPrivacy : true;

    const newChannel: Channel = {
      title: this.newChannelTitle,
      id: uuidv4(),
      isPrivate: isPrivate, //Users can ONLY create private channels
      allowedUsers: [this.currentUser!.uid], // Ensure creator is added
      creatorId: this.currentUser!.uid,
    };

    console.log('Creating Channel:', newChannel);

    try {
      const channelRef = doc(db, 'channels', newChannel.id);
      await setDoc(channelRef, newChannel);

      console.log(
        `Channel created: ${newChannel.title} (Private: ${newChannel.isPrivate})`
      );
      console.log(`Allowed Users: `, newChannel.allowedUsers);

      this.newChannelTitle = '';
      this.newChannelPrivacy = false;
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  }
  getChatBoxStyle(): any {
    const bgColor = this.chatBackgroundColor;
    if (bgColor !== '#ffffff') {
      return { 'background-color': bgColor };
    }

    if (this.isDarkMode) {
      return { 'background-color': 'rgba(0, 0, 0, 0.65)' };
    }

    return { 'background-color': '#ffffff' };
  }

  showChannels() {
    const channelRef = collection(db, 'channels');

    onSnapshot(
      channelRef,
      (snapshot) => {
        this.channels = snapshot.docs
          .map((doc) => {
            const channelData = doc.data() as Channel;
            return {
              ...channelData,
              id: channelData.id ?? doc.id,
              isAccessible:
                !channelData.isPrivate ||
                this.isAdmin ||
                (Array.isArray(channelData.allowedUsers) &&
                  channelData.allowedUsers.includes(
                    this.currentUser?.uid ?? ''
                  )),
            };
          })
          .filter((channel: Channel & { isAccessible: boolean }) => {
            return !channel.isDM;
          });
      },
      (error) => {
        console.error('Error fetching channels:', error);
      }
    );
  }

  getChannelNameFromId(channelId: string): string | null {
    const channel = this.channels.find((c) => c.id === channelId);
    return channel ? channel.title : null;
  }

  async deleteChannel(index: number) {
    const channelId = this.channels[index].id;
    const channelRef = doc(db, 'channels', channelId);

    try {
      console.log(`Deleting channel ${channelId}...`);
      await deleteDoc(channelRef);
      console.log('Channel deleted successfully!');

      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const batchUpdates = usersSnapshot.docs.map(async (userDoc) => {
        const userRef = doc(db, 'users', userDoc.id);
        const userData = userDoc.data();

        if (userData['assignedChannels']?.includes(channelId)) {
          const updatedChannels = userData['assignedChannels'].filter(
            (id: string) => id !== channelId
          );
          await updateDoc(userRef, { assignedChannels: updatedChannels });

          console.log(`Removed channel ${channelId} from user ${userDoc.id}`);
        }
      });

      await Promise.all(batchUpdates);
      console.log('All affected users updated!');
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  }

  async selectChannel(channelIndex: number): Promise<void> {
    this.currentChannel = this.channels[channelIndex];
    // Fetch latest channel data from Firestore
    const channelRef = doc(db, 'channels', this.currentChannel.id);
    const channelSnap = await getDoc(channelRef);

    if (channelSnap.exists()) {
      const channelData = channelSnap.data() as Channel;

      // If channel is private, check if the current user is allowed
      if (
        channelData.isPrivate &&
        !this.isAdmin &&
        (!channelData.allowedUsers ||
          !channelData.allowedUsers.includes(this.currentUser!.uid))
      ) {
        alert("You don't have permission to access this private channel.");
        return;
      }
    } else {
      console.error('Channel not found!');
      return;
    }

    try {
      this.router.navigate(['/channel-area', this.currentChannel.id]);
    } catch (error) {
      console.error('Error selecting channel:', error);
    }
  }
  loadPendingInvites(): void {
    if (!this.currentUser) return;

    const channelsRef = collection(db, 'channels');

    onSnapshot(channelsRef, (snapshot) => {
      // Clear previous pending invites to avoid duplications
      this.pendingInvites = [];

      // Get only channels where current user is in pendingInvites but NOT the creator
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();

        if (
          Array.isArray(data['pendingInvites']) &&
          data['pendingInvites'].includes(this.currentUser!.uid) &&
          data['creatorId'] !== this.currentUser!.uid
        ) {
          // Add to pendingInvites array with just the properties in your type definition
          this.pendingInvites.push({
            id: docSnap.id,
            channelId: docSnap.id,
            channelTitle: data['title'],
            username: this.currentUsername || 'Unknown',
          });
        }
      });

      console.log(
        'Pending invites (only for current user):',
        this.currentUser?.uid,
        this.pendingInvites
      );
    });
  }

  async acceptInvite(channelId: string) {
    if (!this.currentUser) return;

    const channelRef = doc(db, `channels/${channelId}`);
    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) {
      console.error('Channel not found!');
      return;
    }

    try {
      const channelData = channelSnap.data();
      const updatedAllowedUsers = [
        ...(channelData['allowedUsers'] || []),
        this.currentUser.uid,
      ];
      const updatedPendingInvites = (
        channelData['pendingInvites'] || []
      ).filter((uid: string) => uid !== this.currentUser!.uid);

      await updateDoc(channelRef, {
        allowedUsers: updatedAllowedUsers,
        pendingInvites: updatedPendingInvites,
      });

      console.log(
        `User ${this.currentUser.uid} has joined channel ${channelId}`
      );
      this.pendingInvites = this.pendingInvites.filter(
        (invite) => invite.channelId !== channelId
      );
      this.loadPendingInvites();
      alert('You have joined the channel!');
    } catch (error) {
      console.error('Error accepting invite:', error);
    }
  }
  async declineInvite(channelId: string) {
    if (!this.currentUser?.uid) {
      // Vérifie si l'utilisateur est connecté
      console.error('No user logged in.');
      return;
    }

    const channelRef = doc(db, `channels/${channelId}`);
    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) {
      console.error('Channel not found!');
      return;
    }

    try {
      const channelData = channelSnap.data();
      const updatedPendingInvites = (
        channelData['pendingInvites'] || []
      ).filter((uid: string) => uid !== this.currentUser!.uid);

      await updateDoc(channelRef, {
        pendingInvites: updatedPendingInvites,
      });

      console.log(
        `User ${this.currentUser.uid} has declined invitation to channel ${channelId}`
      );
      this.pendingInvites = this.pendingInvites.filter(
        (invite) => invite.channelId !== channelId
      );
      this.loadPendingInvites();
      alert('You declined the invitation.');
    } catch (error) {
      console.error('Error declining invite:', error);
    }
  }
  async leaveChannel(channelId: string) {
    if (!this.currentUser?.uid) {
      console.error('No user logged in.');

      return;
    }

    const channelRef = doc(db, `channels/${channelId}`);

    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) {
      console.error('Channel not found!');

      return;
    }

    try {
      const channelData = channelSnap.data();

      const channelCreator = channelData['creatorId'];

      if (channelCreator === this.currentUser.uid) {
        // If user is the creator, delete the entire channel

        // First, notify all channel members that the channel is being deleted

        const allowedUsers = channelData['allowedUsers'] || [];

        for (const userId of allowedUsers) {
          if (userId !== this.currentUser.uid) {
            // You could implement a notification system here

            console.log(`Notifying user ${userId} about channel deletion`);

            // Optional: Add the notification to a notifications collection

            // await addDoc(collection(db, "notifications"), {

            //   userId: userId,

            //   message: `Channel "${channelData['title']}" has been deleted by the creator`,

            //   timestamp: Timestamp.now(),

            //   read: false

            // });
          }
        }

        // Delete the channel document

        await deleteDoc(channelRef);

        console.log(`Channel ${channelId} deleted because creator left.`);

        // Remove the channel from all users' assignedChannels lists

        const usersRef = collection(db, 'users');

        const usersSnapshot = await getDocs(usersRef);

        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();

          const userAssignedChannels = userData['assignedChannels'] || [];

          if (userAssignedChannels.includes(channelId)) {
            const userRef = doc(db, 'users', userDoc.id);

            const updatedAssignedChannels = userAssignedChannels.filter(
              (id: string) => id !== channelId
            );

            return updateDoc(userRef, {
              assignedChannels: updatedAssignedChannels,
            });
          }

          return Promise.resolve();
        });

        await Promise.all(updatePromises);

        console.log('All users updated after channel deletion');

        // Also delete all channel messages if you have them in a subcollection

        // This depends on your data structure

        const messagesRef = collection(db, `channels/${channelId}/messages`);

        const messagesSnapshot = await getDocs(messagesRef);

        const deleteMessagePromises = messagesSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );

        await Promise.all(deleteMessagePromises);
      } else {
        // If user is not the creator, just remove them from the channel

        const updatedAllowedUsers = (channelData['allowedUsers'] || []).filter(
          (uid: string) => uid !== this.currentUser!.uid
        );

        await updateDoc(channelRef, {
          allowedUsers: updatedAllowedUsers,
        });

        console.log(
          `User ${this.currentUser.uid} has left channel ${channelId}`
        );
      }

      // Update local channels list

      this.channels = this.channels.filter(
        (channel) => channel.id !== channelId
      );

      console.log('Updated channel list after leaving:', this.channels);

      // Navigate to channels list

      this.router.navigate(['/channels']);
    } catch (error) {
      console.error('Error leaving channel:', error);
    }

    this.showChannels();
  }
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;

    // Apply dark mode to document body
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'disabled');
    }
    // Fix text colors in dark mode
    this.updateDarkModeTextColors();
  }

  // Add this new method to update text colors in dark mode
  updateDarkModeTextColors() {
    setTimeout(() => {
      // Target all headers in dm-header
      const dmHeaders = document.querySelectorAll(
        '.dm-header h4, .dm-header h5'
      );

      dmHeaders.forEach((header) => {
        if (this.isDarkMode) {
          (header as HTMLElement).style.color = '#FFFFFF';
        } else {
          (header as HTMLElement).style.color = '#333333';
        }
      });

      // Force change detection
      this.cdRef.detectChanges();
    }, 0);
  }

  listenToUserStatus() {
    if (!this.currentUser) return;

    const userRef = doc(db, 'users', this.currentUser.uid);
    onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.currentUserStatus = userData['status'] || 'offline';
        console.log(
          'User status updated in real-time:',
          this.currentUserStatus
        );

        if (this.currentUserStatus === 'offline') {
          this.router.navigate(['/login']);
        }
      }
    });
  }
  unreadNotifications: any[] = [];

  listenToNotifications() {
    if (!this.currentUser) return;

    const notifRef = collection(
      db,
      `users/${this.currentUser.uid}/notifications`
    );

    onSnapshot(notifRef, (snapshot) => {
      this.unreadNotifications = snapshot.docs
        .map((doc) => {
          const data = doc.data() as Notification;
          return { id: doc.id, ...data };
        })
        .filter((notif) => !notif.read);

      console.log('All unread notifications:', this.unreadNotifications);
      const channelNotifs = this.unreadNotifications.filter(
        (n) => n.isFromChannel === true
      );
      console.log('Channel notifications:', channelNotifs);
    });
  }

  markAllNotificationsAsRead() {
    const notifRef = collection(
      db,
      `users/${this.currentUser!.uid}/notifications`
    );
    this.unreadNotifications.forEach(async (notif) => {
      const notifDoc = doc(notifRef, notif.id);
      await updateDoc(notifDoc, { read: true });
    });
  }

  openNotifications() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  getMentions(message: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }
  async deleteNotification(notifId: string) {
    const notifRef = doc(
      db,
      `users/${this.currentUser!.uid}/notifications/${notifId}`
    );
    try {
      await deleteDoc(notifRef);
      this.unreadNotifications = this.unreadNotifications.filter(
        (n) => n.id !== notifId
      );
      console.log(`Notification ${notifId} supprimée.`);
    } catch (error) {
      console.error('Erreur suppression notification :', error);
    }
  }
  handleNotificationClick(notification: Notification) {
    if (notification.isFromChannel && notification.channelId) {
      this.router.navigate(['/channel-area', notification.channelId]);
    } else if (notification.chatId) {
      const userIds = notification.chatId.split('_');
      const otherUserId =
        userIds[0] === this.currentUser!.uid ? userIds[1] : userIds[0];
      this.findUsernameById(otherUserId).then((username) => {
        if (username) {
          this.selectUser(username);
        }
      });
    }

    const notifRef = doc(
      db,
      `users/${this.currentUser!.uid}/notifications/${notification.id}`
    );
    updateDoc(notifRef, { read: true });
  }

  async findUsernameById(userId: string): Promise<string | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data()['username'] || null;
    }
    return null;
  }


  

  async requestToJoin(channel: Channel) {
    if (!this.currentUser) return;

    const channelRef = doc(db, 'channels', channel.id);
    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) {
      console.error('Channel not found!');
      return;
    }

    const channelData = channelSnap.data();

    if (channelData['joinRequests']?.includes(this.currentUser.uid)) {
      alert("You've already requested to join this channel.");
      return;
    }

    try {
      const updatedJoinRequests = [
        ...(channelData['joinRequests'] || []),
        this.currentUser.uid,
      ];
      await updateDoc(channelRef, { joinRequests: updatedJoinRequests });

      const adminId = channelData['creatorId'];
      const notifRef = collection(db, `users/${adminId}/notifications`);
      await addDoc(notifRef, {
        from: this.currentUsername,
        message: `${this.currentUsername} requested to join ${channelData['title']}`,
        timestamp: Timestamp.now(),
        read: false,
        isFromChannel: true,
        channelId: channel.id,
      });

      alert('Your request to join has been sent.');
    } catch (err) {
      console.error('Error handling join request:', err);
    }
  }
  async acceptJoinRequest(channelId: string, requesterUsername: string) {
    if (!this.currentUser) return;

    const channelRef = doc(db, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) return;

    const channelData = channelSnap.data();
    const requesterId = await this.getUserIdByUsername(requesterUsername);
    if (!requesterId) return;

    const updatedAllowedUsers = [
      ...(channelData['allowedUsers'] || []),
      requesterId,
    ];
    const updatedJoinRequests = (channelData['joinRequests'] || []).filter(
      (id: string) => id !== requesterId
    );

    await updateDoc(channelRef, {
      allowedUsers: updatedAllowedUsers,
      joinRequests: updatedJoinRequests,
    });

    // Optional: send a notification to the user
    const notifRef = collection(db, `users/${requesterId}/notifications`);
    await addDoc(notifRef, {
      from: this.currentUsername,
      message: `You have been accepted into ${channelData['title']}`,
      timestamp: Timestamp.now(),
      read: false,
      isFromChannel: true,
      channelId: channelId,
    });

    this.deleteNotificationByChannel(channelId, requesterUsername);
  }

  async denyJoinRequest(channelId: string, requesterUsername: string) {
    if (!this.currentUser) return;

    const channelRef = doc(db, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) return;

    const channelData = channelSnap.data();
    const requesterId = await this.getUserIdByUsername(requesterUsername);
    if (!requesterId) return;

    const updatedJoinRequests = (channelData['joinRequests'] || []).filter(
      (id: string) => id !== requesterId
    );

    await updateDoc(channelRef, {
      joinRequests: updatedJoinRequests,
    });

    // Optional: send a notification to the user
    const notifRef = collection(db, `users/${requesterId}/notifications`);
    await addDoc(notifRef, {
      from: this.currentUsername,
      message: `Your request to join ${channelData['title']} was denied.`,
      timestamp: Timestamp.now(),
      read: false,
      isFromChannel: true,
      channelId: channelId,
    });

    this.deleteNotificationByChannel(channelId, requesterUsername);
  }
  async getUserIdByUsername(username: string): Promise<string | null> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    for (const docSnap of snapshot.docs) {
      if (docSnap.data()['username'] === username) {
        return docSnap.id;
      }
    }
    return null;
  }
  deleteNotificationByChannel(channelId: string, username: string) {
    const notifToDelete = this.unreadNotifications.find(
      (n) => n.channelId === channelId && n.from === username
    );
    if (notifToDelete) {
      this.deleteNotification(notifToDelete.id);
    }
  }
  isChannelCreator(channelId: string): boolean {
    const channel = this.channels.find((c) => c.id === channelId);
    return channel?.creatorId === this.currentUser?.uid;
  }
}
