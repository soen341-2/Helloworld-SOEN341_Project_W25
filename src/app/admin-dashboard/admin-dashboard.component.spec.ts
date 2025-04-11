import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth()),
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // verify component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // test getSelectedValue method
  it('should extract selected value from event', () => {
    const mockEvent = { target: { value: 'test-value' } } as unknown as Event;
    expect(component.getSelectedValue(mockEvent)).toBe('test-value');
  });

  // test getChannelName method
  it('should return channel title or default', () => {
    component.channels = [
      { id: 'ch1', title: 'Channel One', isPrivate: true, isDM: false },
    ];
    expect(component.getChannelName('ch1')).toBe('Channel One');
    expect(component.getChannelName('unknown')).toBe('Unknown Channel');
  });

  // test logOut method
  it('should navigate to /login after logout', async () => {
    spyOn(component['auth'], 'signOut').and.returnValue(Promise.resolve());
    const router = TestBed.inject(Router);
    await component.logOut();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // test if non-admin can assign users to channels
  it('should alert if user tries to assign user to channel', async () => {
    spyOn(window, 'alert');
    component.currentUser = { isAdmin: false, isSuperAdmin: false };
    await component.assignUserToChannel('user1', 'channel1');
    expect(window.alert).toHaveBeenCalledWith(
      'Only Admins or SuperAdmins can assign users to channels!'
    );
  });

  // test if user can toggle a user's channel assignment
  it('should alert if user tries to toggle channel assignment of other users', async () => {
    spyOn(window, 'alert');
    component.currentUser = { isAdmin: false, isSuperAdmin: false };
    await component.toggleUserChannel('user1', 'channel1');
    expect(window.alert).toHaveBeenCalledWith(
      'Only Admins or SuperAdmins can manage channels!'
    );
  });

  // test if user/admin can set others to admin
  it('should alert if non-superadmin tries to promote a user', async () => {
    spyOn(window, 'alert');
    component.currentUser = { isSuperAdmin: false };
    await component.makeAdmin('user2');
    expect(window.alert).toHaveBeenCalledWith(
      'Only SuperAdmins can assign admins!'
    );
  });

  // test if user/admin can set others to user
  it('should alert if non-superadmin tries to demote a user', async () => {
    spyOn(window, 'alert');
    component.currentUser = { isSuperAdmin: false };
    await component.removeAdmin('user2');
    expect(window.alert).toHaveBeenCalledWith(
      'Only SuperAdmins can remove admins!'
    );
  });
});
