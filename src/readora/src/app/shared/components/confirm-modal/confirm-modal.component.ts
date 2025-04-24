import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent {
  @Input() title: string = '¿Estás seguro?';
  @Input() message: string = 'Esta acción no se puede deshacer';
  @Input() confirmButtonText: string = 'Confirmar';
  @Input() cancelButtonText: string = 'Cancelar';
  @Input() confirmButtonClass: string = 'btn-danger';
  @Input() visible: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.onCancel();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event) {
    // Verifica si el clic fue fuera del modal
    if (
      this.visible && 
      this.elementRef.nativeElement.querySelector('.modal-content') && 
      !this.elementRef.nativeElement.querySelector('.modal-content').contains(event.target)
    ) {
      this.onCancel();
    }
  }

  onConfirm() {
    this.confirm.emit();
    this.visible = false;
  }

  onCancel() {
    this.cancel.emit();
    this.visible = false;
    this.close.emit();
  }
}