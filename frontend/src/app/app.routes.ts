import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AdminComponent } from './admin/admin.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminPersonasComponent } from './admin/admin-personas/admin-personas.component';
import { adminGuard } from './guards/admin.guard';
import { AdminRolesComponent } from './admin/admin-roles/admin-roles.component';
import { loginGuard } from './guards/login.guard';
import { AdminBalotariosComponent } from './admin/admin-balotarios/admin-balotarios.component';
import { AdminIdiomasComponent } from './admin/admin-idiomas/admin-idiomas.component';
import { AdminTokensComponent } from './admin/admin-tokens/admin-tokens.component';
import { AdminBancoComponent } from './admin/admin-banco/admin-banco.component';

export const routes: Routes = [

    // Ruta raíz redirige a login
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },

    // Rutas de autenticación
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard]
    },


     // Rutas del admin (protegidas)
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [adminGuard],
        children: [
            {
                path: '',
                component: AdminDashboardComponent
            },
            {
                path: 'personas',
                component: AdminPersonasComponent
            },
            {
                path: 'roles',
                component: AdminRolesComponent
            },
            {
                path: 'idiomas',
                component: AdminIdiomasComponent
            },
            {
                path: 'banco',
                component: AdminBancoComponent
            },
            {
                path: 'balotarios',
                component: AdminBalotariosComponent
            },
            {
                path: 'tokens',
                component: AdminTokensComponent
            },

            

        ]
    },


];
