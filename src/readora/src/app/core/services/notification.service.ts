import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';

// Interfaces para los tipos de notificaciones
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ConfirmOptions {
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  focusCancel?: boolean;
}

export interface AlertOptions {
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  confirmButtonColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  // Toast notifications (non-blocking)
  success(title: string, options?: ToastOptions): void {
    toast.success(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action || {
        label: 'Cerrar',
        onClick: () => toast.dismiss()
      }
    });
  }

  error(title: string, options?: ToastOptions): void {
    toast.error(title, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action || {
        label: 'Cerrar',
        onClick: () => toast.dismiss()
      }
    });
  }

  warning(title: string, options?: ToastOptions): void {
    toast.warning(title, {
      description: options?.description,
      duration: options?.duration || 4500,
      action: options?.action || {
        label: 'Cerrar',
        onClick: () => toast.dismiss()
      }
    });
  }

  info(title: string, options?: ToastOptions): void {
    toast.info(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action || {
        label: 'Cerrar',
        onClick: () => toast.dismiss()
      }
    });
  }

  // SweetAlert2 methods (blocking)
  async confirm(options: ConfirmOptions = {}): Promise<boolean> {
    const result = await Swal.fire({
      title: options.title || '¿Estás seguro?',
      text: options.text || 'Esta acción no se puede deshacer',
      icon: options.icon || 'question',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Confirmar',
      cancelButtonText: options.cancelButtonText || 'Cancelar',
      confirmButtonColor: options.confirmButtonColor || '#3085d6',
      cancelButtonColor: options.cancelButtonColor || '#d33',
      focusCancel: options.focusCancel || false,
      customClass: {
        popup: 'swal-theme-compatible'
      }
    });

    return result.isConfirmed;
  }

  async alert(options: AlertOptions = {}): Promise<void> {
    await Swal.fire({
      title: options.title || 'Atención',
      text: options.text || '',
      icon: options.icon || 'info',
      confirmButtonText: options.confirmButtonText || 'Aceptar',
      confirmButtonColor: options.confirmButtonColor || '#3085d6',
      customClass: {
        popup: 'swal-theme-compatible'
      }
    });
  }

  // Método para crear notificaciones con input (útil para solicitar datos al usuario)
  async prompt(title: string, inputLabel: string, placeholder: string = ''): Promise<string | null> {
    const result = await Swal.fire({
      title: title,
      input: 'text',
      inputLabel: inputLabel,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un valor';
        }
        return null;
      },
      customClass: {
        popup: 'swal-theme-compatible'
      }
    });

    return result.value || null;
  }
}
