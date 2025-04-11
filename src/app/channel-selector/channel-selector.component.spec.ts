import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelSelectorComponent } from './channel-selector.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

describe('ChannelSelectorComponent', () => {
  let component: ChannelSelectorComponent;
  let fixture: ComponentFixture<ChannelSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChannelSelectorComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
      ],
      providers: [
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // test component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // test if emoji picker is properly toggled
  it('should toggle emoji picker visibility', () => {
    const mockEvent = new MouseEvent('click');
    component.showEmojiPickerDirect = false;
    component.toggleEmojiPickerDirect(mockEvent);
    expect(component.showEmojiPickerDirect).toBeTrue();
  });

  // test if emoji is added to message
  it('should add emoji to newMessage', () => {
    component.newMessage = 'Hello';
    component.addEmojiDirect({ detail: { unicode: '😊' } });
    expect(component.newMessage).toBe('Hello😊');
  });

  // test if background color is correctly set to default value
  it('should return default chat background if not customized', () => {
    component.selectedUsername = 'Test';
    expect(component.chatBackgroundColor).toBe('#ffffff');
  });

  // test if mentions are correctly extracted from message
  it('should extract mentioned usernames from message', () => {
    const mentions = component.getMentions(
      'Hey @testuser @bob, check this out!'
    );
    expect(mentions).toEqual(['testuser', 'bob']);
  });

  // test if background colour can be properly set
  it('should return the correct chat background if set', () => {
    component.selectedUsername = 'Marco';
    component.chatBackgroundColors = { Marco: '#123456' };
    expect(component.chatBackgroundColor).toBe('#123456');
  });

  // test if background color is saved locally
  it('should save background colors to localStorage', () => {
    spyOn(localStorage, 'setItem');
    component.chatBackgroundColors = { John: '#abcdef' };
    component.saveBackgroundColors();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'dmBgColors',
      JSON.stringify({ John: '#abcdef' })
    );
  });

  // test if quoting works
  it('should reply to a message', () => {
    const msg = {
      id: '1',
      senderId: 'user1',
      receiverId: 'user2',
      message: 'Hello',
      timestamp: 0,
      replyId: '',
      mentions: [],
    };
    component.reply(msg);
    expect(component.replyingToMessage).toEqual(msg);
  });

  // test if getMessagebyId works
  it('should return the message by ID', () => {
    const message = {
      id: 'msg1',
      senderId: 'u1',
      receiverId: 'u2',
      message: 'test',
      timestamp: 0,
      replyId: '',
      mentions: [],
    };
    component.messages = [message];
    expect(component.getMessageById('msg1')).toEqual(message);
  });

  // test if unknown message id is handled correctly
  it('should return undefined for unknown message ID', () => {
    component.messages = [];
    expect(component.getMessageById('unknown')).toBeUndefined();
  });

  // test if dark mode is toggled properly
  it('should toggle dark mode and update localStorage', () => {
    spyOn(localStorage, 'setItem');
    component.isDarkMode = false;
    component.toggleDarkMode();
    expect(component.isDarkMode).toBeTrue();
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'enabled');
  });

  // test if dark mode is disabled properly
  it('should disable dark mode and update localStorage', () => {
    spyOn(localStorage, 'setItem');
    component.isDarkMode = true;
    component.toggleDarkMode();
    expect(component.isDarkMode).toBeFalse();
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'disabled');
  });
});
