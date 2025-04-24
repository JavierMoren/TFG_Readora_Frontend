import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirm event when onConfirm is called', () => {
    spyOn(component.confirm, 'emit');
    component.onConfirm();
    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel event when onCancel is called', () => {
    spyOn(component.cancel, 'emit');
    spyOn(component.close, 'emit');
    component.onCancel();
    expect(component.cancel.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set visible to false after confirming', () => {
    component.visible = true;
    component.onConfirm();
    expect(component.visible).toBeFalse();
  });

  it('should set visible to false after canceling', () => {
    component.visible = true;
    component.onCancel();
    expect(component.visible).toBeFalse();
  });
});