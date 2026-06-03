import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, TranslatePipe, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public key: string = '';
  public password: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    public i18n: I18nService,
  ) {}

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
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        Swal.fire({
          icon: 'success',
          title: 'Conectado',
          text: 'Entrando al panel de LinkBox...',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => this.router.navigateByUrl(returnUrl));
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: err.error.message || 'Credenciales incorrectas o dispositivo inactivo.',
          confirmButtonColor: '#d33',
          background: '#fff',
          color: '#000',
        });
      },
    });
  }
}
