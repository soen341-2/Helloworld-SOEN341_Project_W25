import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAuthComponent } from './user-auth.component';
import { FormsModule } from '@angular/forms';

describe('UserAuthComponent', () => {
  let component: UserAuthComponent;
  let fixture: ComponentFixture<UserAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserAuthComponent],
      imports: [FormsModule],
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
