import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAuthComponent } from './user-auth.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('UserAuthComponent', () => {
  let component: UserAuthComponent;
  let fixture: ComponentFixture<UserAuthComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [UserAuthComponent],
      imports: [FormsModule],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  //creating test component 
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  //empty fields for sign up -> fail (something is missing)
  it('should not sign up with empty fields', async () => {
    spyOn(window, 'alert');
    component.email = '';
    component.password = '';
    await component.signUp();
    expect(window.alert).toHaveBeenCalledWith(
      'Email, username and password are required'
    );
  });

  //empty fields for login -> fail (something is missing)
  it('should not log in with empty fields', async () => {
    spyOn(window, 'alert');
    component.email = '';
    component.password = '';
    await component.logIn();
    expect(window.alert).toHaveBeenCalledWith(
      'Email and password are required'
    );
  });
});
