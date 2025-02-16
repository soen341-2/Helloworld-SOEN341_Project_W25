import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelAreaComponent } from './channel-area.component';

describe('ChannelAreaComponent', () => {
  let component: ChannelAreaComponent;
  let fixture: ComponentFixture<ChannelAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChannelAreaComponent]
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
