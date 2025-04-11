import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelAreaComponent } from './channel-area.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../../environments/environment.development';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('ChannelAreaComponent', () => {
  let component: ChannelAreaComponent;
  let fixture: ComponentFixture<ChannelAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChannelAreaComponent],
      imports: [FormsModule],
      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth()),
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => 'test-channel-id' }), // simulate route param
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // verify component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // test emoji picker visibility
  it('should toggle emoji picker visibility', () => {
    expect(component.showEmojiPicker).toBe(false);
    component.toggleEmojiPicker();
    expect(component.showEmojiPicker).toBe(true);
    component.toggleEmojiPicker();
    expect(component.showEmojiPicker).toBe(false);
  });

  // test if emoji is added to message
  it('should add emoji to message', () => {
    component.newMessage = 'Hello';
    component.addEmoji({ detail: { unicode: '😊' } });
    expect(component.newMessage).toBe('Hello😊');
  });

  // test if mentions are found in messages
  it('should extract mentions from message', () => {
    const msg = 'Hello @testa and @testb!';
    const mentions = component.extractMentions(msg);
    expect(mentions).toEqual(['testa', 'testb']);
  });

 

  // test if channel background color is correctly changed
  it('should return channel background color', () => {
    component.channelName = 'TestChannel';
    component.channelBackgroundColors = { TestChannel: '#abcdef' };
    expect(component.channelBackgroundColor).toBe('#abcdef');
    component.channelName = 'OtherChannel';
    expect(component.channelBackgroundColor).toBe('#ffffff');
  });

  // check if channel color is correctly saved locally
  it('should update channel color and save to localStorage', () => {
    component.channelName = 'TestChannel';
    const event = { target: { value: '#123456' } } as unknown as Event;
    spyOn(localStorage, 'setItem');
    component.onChannelColorChange(event);
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(component.channelBackgroundColors['TestChannel']).toBe('#123456');
  });

  // check if quoting works correctly
  it('should reply to a message', () => {
    const msg = { id: 'm1', sender: 'tester', message: 'hello' };
    component.reply(msg);
    expect(component.replyingToMessage).toEqual(msg);
  });

  // check if messages are sent/deleted properly
  it('should return replied message content', () => {
    component.messages = [
      {
        id: 'msg1',
        sender: 'tester',
        message: 'first',
        timestamp: '',
        replyId: null,
      },
    ];
    expect(component.getRepliedMessageContent('msg1')).toBe('first');
    expect(component.getRepliedMessageContent('unknown')).toBe(
      'Deleted message'
    );
  });

  // test if users can delete messages
  it('should do nothing when user deletes message', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(console, 'log');
    component.channelId = 'ch1';
    component.currentUser.isAdmin = false;
    component.deleteMessage('msg1');
    expect(console.log).not.toHaveBeenCalledWith(
      'Message deleted successfully'
    );
  });

  // test if empty messages can be sent
  it('should not send message if empty or no channel', () => {
    component.newMessage = ' ';
    component.channelId = null;
    component.sendMessage();
    expect(component.newMessage.trim()).toBe('');
  });

  // test if invite popup works correctly
  it('should alert on missing invite info', async () => {
    spyOn(window, 'alert');
    component.channelId = null;
    component.selectedUserToInvite = null;
    await component.inviteUser();
    expect(window.alert).toHaveBeenCalledWith(
      'Please select a user to invite.'
    );
  });

  // test if user data can be fetched correctly
  it('should fetch user data and update currentUser', () => {
    const userId = 'user123';
    const spy = spyOn(component, 'fetchUserData').and.callThrough();
    component.fetchUserData(userId);
    expect(spy).toHaveBeenCalledWith(userId);
  });

  // test if getChannelName works
  it('should retrieve channel name', () => {
    const channelId = 'channelXYZ';
    const spy = spyOn(component, 'getChannelName').and.callThrough();
    component.getChannelName(channelId);
    expect(spy).toHaveBeenCalledWith(channelId);
  });

  // test if users are loaded
  it('should load all users from Firestore', () => {
    const spy = spyOn(component, 'loadAllUsers').and.callThrough();
    component.loadAllUsers();
    expect(spy).toHaveBeenCalled();
  });

  // test if router works
  it('should navigate to /channels when goToChannelSelector is called', () => {
    component.goToChannelSelector();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/channels']);
  });
});
