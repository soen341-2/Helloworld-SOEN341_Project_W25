import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelManagementComponent } from './channel-management.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, Firestore, collection, doc, getDoc } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../../environments/environment.development';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { setDoc} from '@angular/fire/firestore';

describe('ChannelManagementComponent', () => {
  let component: ChannelManagementComponent;
  let fixture: ComponentFixture<ChannelManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChannelManagementComponent],
      imports: [FormsModule],
      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth()),
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // verify component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // test if filtered users is set to empty if search is empty
  it('should clear filtered users if search term is empty', () => {
    component.users = [{ username: 'testuser' }];
    component.searchTerm = '   ';
    component.filterUsers();
    expect(component.filteredUsers).toEqual([]);
  });

  // test if users are correctly searchable (case-insensitive)
  it('should filter users by username (case-insensitive)', () => {
    component.users = [
      { username: 'marco' },
      { username: 'bob' },
      { username: 'test' }
    ];
    component.searchTerm = 'BO';
    component.filterUsers();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].username).toBe('bob');
  });

  // test if users can make make private channels
  it('should not allow non-admin to create public channel', async () => {
    component.currentUser = { isAdmin: false };
    const spy = spyOn(component, 'loadChannels');
    await component.createPublicChannel('General');
    expect(spy).not.toHaveBeenCalled();
  });

  // test if users who are not logged in can create channels
  it('should skip creating private channel if user not logged in', async () => {
    component.currentUser = null;
    const spy = spyOn(component, 'loadChannels');
    await component.createPrivateChannel('TestChannel', ['user1']);
    expect(spy).not.toHaveBeenCalled();
  });

  // test if non-logged in users can receive join requests
  it('should skip join request if user not logged in', async () => {
    component.currentUser = null;
    const spy = spyOn(component, 'loadJoinRequests');
    await component.requestToJoin('channel123');
    expect(spy).not.toHaveBeenCalled();
  });

  // test if non-logged in users can leave channels
  it('should skip leave channel if user not logged in', async () => {
    component.currentUser = null;
    const spy = spyOn(component, 'loadChannels');
    await component.leaveChannel('channel123');
    expect(spy).not.toHaveBeenCalled();
  });

  // test if admin can create public channels
  it('should allow admin to create public channel', async () => {
    component.currentUser = { uid: 'user123', isAdmin: true };
    const spy = spyOn(component, 'loadChannels');
    await component.createPublicChannel('NewPublicChannel');
    expect(spy).toHaveBeenCalled();
  });
  

  // ngOnInit should call loadUsers, loadChannels, loadJoinRequests
it('should call loadUsers, loadChannels, and loadJoinRequests on ngOnInit', async () => {
  const usersSpy = spyOn(component, 'loadUsers').and.callThrough();
  const channelsSpy = spyOn(component, 'loadChannels').and.callThrough();
  const requestsSpy = spyOn(component, 'loadJoinRequests').and.callThrough();

  await component.ngOnInit();

  expect(usersSpy).toHaveBeenCalled();
  expect(channelsSpy).toHaveBeenCalled();
  expect(requestsSpy).toHaveBeenCalled();
});

// loadUsers should populate users array
it('should load users from Firestore', async () => {
  const firestore = TestBed.inject(Firestore);
  const usersCollection = collection(firestore, 'users');
  await setDoc(doc(usersCollection, 'testuser'), { username: 'marco' });

  await component.loadUsers();
  const loaded = component.users.find(user => user.username === 'marco');
  expect(loaded).toBeTruthy();
});

// loadChannels should populate channels array
it('should load channels from Firestore', async () => {
  const firestore = TestBed.inject(Firestore);
  const channelsCollection = collection(firestore, 'channels');
  await setDoc(doc(channelsCollection, 'general'), { title: 'General', isPrivate: false });

  await component.loadChannels();
  const found = component.channels.find(ch => ch.title === 'General');
  expect(found).toBeTruthy();
});

// loadJoinRequests should populate joinRequests array
it('should load join requests from Firestore', async () => {
  const firestore = TestBed.inject(Firestore);
  const joinCollection = collection(firestore, 'joinRequests');
  await setDoc(doc(joinCollection, 'user123_channel123'), { userId: 'user123', channelId: 'channel123', status: 'pending' });

  await component.loadJoinRequests();
  const found = component.joinRequests.find(req => req.channelId === 'channel123');
  expect(found).toBeTruthy();
});

// test accepting a join request
it('should accept join request and add user to channel', async () => {
  const firestore = TestBed.inject(Firestore);
  const requestRef = doc(firestore, 'joinRequests/request123');
  const channelRef = doc(firestore, 'channels/channel123');

  await setDoc(requestRef, {
    userId: 'user123',
    channelId: 'channel123',
    status: 'pending'
  });

  await setDoc(channelRef, {
    title: 'Secret',
    isPrivate: true,
    allowedUsers: []
  });

  await component.acceptJoinRequest('request123', 'user123', 'channel123');

  const updatedRequest = await getDoc(requestRef);
  const updatedChannel = await getDoc(channelRef);

  expect(updatedRequest.data()?.['status']).toBe('accepted');
  expect(updatedChannel.data()?.['allowedUsers']).toContain('user123');
});

// test declining a join request
it('should decline join request', async () => {
  const firestore = TestBed.inject(Firestore);
  const requestRef = doc(firestore, 'joinRequests/requestToDecline');
  await setDoc(requestRef, {
    userId: 'user123',
    channelId: 'channel123',
    status: 'pending'
  });

  await component.declineJoinRequest('requestToDecline');
  const updated = await getDoc(requestRef);

  expect(updated.data()?.['status']).toBe('declined');
});

});
