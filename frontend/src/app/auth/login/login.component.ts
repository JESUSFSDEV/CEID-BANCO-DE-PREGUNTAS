import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { Accesos } from "./../../models/t3_acceso.model";
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Rol } from '../../models/t2_rol.model';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  selectedUserType: string = 'alumno';
  showPassword: boolean = false;
  isLoading: boolean = false;
  currentYear: number = new Date().getFullYear();

  login_user: Accesos = new Accesos();

  btn: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private service: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  onSubmit(): void {
    if (this.loginForm.valid && this.selectedUserType) {
      this.isLoading = true;
      this.btn = false;
      this.service.login(this.login_user).subscribe(
        (res) => {
          console.log(res)
          this.service.removeToken();
          this.toastr.success('Usuario Correcto.','Aviso');
          localStorage.setItem('access_token', res.token);
          this.btn = true;
          this.isLoading = false;
          setTimeout(()=>{
            this.router.navigate(['/admin']);
          },300);
        },
        (err) => {
          console.log(err);
          this.btn = true;
          this.isLoading = false;
          this.toastr.error(err.error.error,'Aviso');
        }
      );
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Por favor completa todos los campos requeridos', 'Formulario incompleto');
    }
  }


  selectUserType(userType: number): void {
    this.login_user.t2_panel = userType;
  }



  private processLogin(loginData: any): void {
    // Aquí irá la lógica real de autenticación
    console.log('Datos de login:', loginData);
    
    try {
      // Simulación de diferentes rutas según el tipo de usuario
      switch (loginData.userType) {
        case 'administrativo':
          this.toastr.success('Bienvenido al panel administrativo', 'Login exitoso');
          this.router.navigate(['/admin']);
          break;
        case 'docente':
          this.toastr.success('Bienvenido al panel docente', 'Login exitoso');
          this.router.navigate(['/docente']);
          break;
        case 'alumno':
          this.toastr.success('Bienvenido al campus virtual', 'Login exitoso');
          this.router.navigate(['/alumno']);
          break;
        default:
          this.toastr.error('Tipo de usuario no válido', 'Error');
      }

      // Guardar datos de sesión si "recordar" está marcado
      if (loginData.rememberMe) {
        localStorage.setItem('rememberLogin', 'true');
        localStorage.setItem('userType', loginData.userType);
        localStorage.setItem('userEmail', loginData.email);
      }

    } catch (error) {
      this.toastr.error('Credenciales incorrectas. Verifica tu email y contraseña.', 'Error de autenticación');
    } finally {
      this.isLoading = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  forgotPassword(): void {
    this.toastr.info('Redirigiendo a recuperación de contraseña...', 'Recuperar Contraseña');
    // Aquí puedes navegar a la página de recuperación de contraseña
    // this.router.navigate(['/auth/forgot-password']);
  }

  needHelp(): void {
    this.toastr.info('Contacta al área de soporte técnico para obtener ayuda', 'Soporte Técnico');
    // Aquí puedes mostrar información de contacto o abrir un modal de ayuda
  }

  // Métodos para mejorar la UX
  onUserTypeChange(): void {
    // Cambiar placeholder del email según el tipo de usuario
    const emailControl = this.loginForm.get('email');
    if (emailControl) {
      switch (this.selectedUserType) {
        case 'administrativo':
          emailControl.setValue('');
          break;
        case 'docente':
          emailControl.setValue('');
          break;
        case 'alumno':
          emailControl.setValue('');
          break;
      }
    }
  }

}
