import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransmissorComponent } from './transmissor.component';

describe('TransmissorComponent', () => {
  let component: TransmissorComponent;
  let fixture: ComponentFixture<TransmissorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransmissorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransmissorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
