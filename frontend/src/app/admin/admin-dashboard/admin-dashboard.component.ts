import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { environment } from './../../../environments/environment';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  
  public env = environment;

  user_login: any;

  currentDate: string = '';
  currentTime: string = '';
  isLoading: boolean = true;

  stats = {
    totalPreguntas: 0,
    preguntasActivas: 0,
    balotarios: 0,
    usuarios: 0
  };

  recentActivities = [
    {
      icon: '✅',
      type: 'success',
      description: 'Nueva pregunta agregada al banco de Ingles Básico',
      time: 'Hace 5 minutos'
    },
    {
      icon: '👤',
      type: 'info',
      description: 'Nuevo usuario registrado en el sistema',
      time: 'Hace 15 minutos'
    },
    {
      icon: '📝',
      type: 'warning',
      description: 'Balotario de Ingles Intermedio generado',
      time: 'Hace 1 hora'
    },
    {
      icon: '🔍',
      type: 'primary',
      description: 'Aprobación de pregunta de Ingles Avanzado completada',
      time: 'Hace 2 horas'
    }
  ];

  constructor(private auth: AuthService) {
    this.user_login = this.auth.login_user;
  }

  ngOnInit(): void {
    this.updateDateTime();
    this.loadStatistics();
    
    // Actualizar la hora cada segundo
    setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  updateDateTime(): void {
    const now = new Date();
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    this.currentDate = `${dayName}, ${day} ${month} ${year}`;
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const period = now.getHours() >= 12 ? 'p. m.' : 'a. m.';
    
    this.currentTime = `${hours}:${minutes}:${seconds} ${period}`;
  }

  loadStatistics(): void {
    // Simular carga de datos
    setTimeout(() => {
      this.stats = {
        totalPreguntas: 1247,
        preguntasActivas: 6,
        balotarios: 45,
        usuarios: 128
      };
      this.isLoading = false;
    }, 1500);
  }

}
