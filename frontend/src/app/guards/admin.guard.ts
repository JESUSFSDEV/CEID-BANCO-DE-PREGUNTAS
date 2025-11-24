import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const user = await authService.validarLoginPromiseAdministrativo();
    
    if (user && user.t1_id && user.t2_id && user.t3_id) {
      // Usuario válido, permitir acceso
      return true;
    } else {
      // Usuario no válido, redirigir al login
      authService.removeToken();
      router.navigate(['/login']);
      return false;
    }
  } catch (error) {
    // Error en la validación, redirigir al login
    console.error('Error en validación del guard:', error);
    authService.removeToken();
    router.navigate(['/login']);
    return false;
  }
};

