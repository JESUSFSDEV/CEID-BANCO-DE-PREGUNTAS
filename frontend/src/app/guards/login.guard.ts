import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const user = await authService.validarLoginPromise();
    
    if (user && user.t1_id && user.t2_id && user.t3_id) {
      router.navigate(['/admin']);
      return false;
    } else {
      // Usuario no válido, redirigir al login
      authService.removeToken();
      return true;
    }
  } catch (error) {
    // Error en la validación, redirigir al login
    console.error('Error en validación del guard:', error);
    authService.removeToken();
    return true;
  }
};

