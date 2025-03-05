import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelAreaComponent } from './channel-area.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';


describe('ChannelAreaComponent', () => {
  let component: ChannelAreaComponent;
  let fixture: ComponentFixture<ChannelAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChannelAreaComponent],
      imports: [FormsModule],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { paramMap: of(convertToParamMap({ id: 'test-channel' })) }
        },
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth())
      ]
      
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
