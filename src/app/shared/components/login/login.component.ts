import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService: AuthService;
  public key: string = '';
  public password: string = '';

  constructor(authService: AuthService) {
    this.authService = authService;
  }
  onLogin() {
    if (!this.key || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, ingresa la Key y la Password del dispositivo.',
        confirmButtonColor: '#000',
      });
      return;
    }

    this.authService.login(this.key, this.password).subscribe({
      next: (res) => {
        // Opcional: Una alerta de éxito rápida antes de redirigir
        Swal.fire({
          icon: 'success',
          title: 'Conectado',
          text: 'Entrando al panel de LinkBox...',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text:
            err.error.message ||
            'Credenciales incorrectas o dispositivo inactivo.',
          confirmButtonColor: '#d33',
          background: '#fff',
          color: '#000',
        });
      },
    });
  }
}
