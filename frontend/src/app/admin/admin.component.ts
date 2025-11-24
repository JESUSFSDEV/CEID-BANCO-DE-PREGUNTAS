import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './../services/auth.service';
import { Accesos } from "./../models/t3_acceso.model";

import { environment } from './../../environments/environment';

declare var $: any;


@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {

  menuMin: boolean = false;
  menuActive: number = 0;
  usuario: Accesos = new Accesos();
  
  // Exponer environment para el template
  public env = environment;

  constructor(private router: Router, private auth: AuthService) { 
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.valRouteActive(event.url);
      }
    });
    this.valRouteActive(this.router.url);
    this.usuario = this.auth.login_user;
  }

  ngOnInit(): void {
    // Auto-colapsar en pantallas pequeñas
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (window.innerWidth < 992) {
      this.menuMin = true;
      $("#main-content").css("margin-left", "0px");
    }else{
      this.menuMin = false;
      $("#main-content").css("margin-left", "240px");
    }
  }

  valRouteActive(route: string) {
    const routes: { [key: string]: number } = {
      '/admin': 1,
      '/admin/personas': 2,
      '/admin/roles': 3,
      '/admin/idiomas': 4,
      '/admin/banco': 5,
      '/admin/balotarios': 6,
      '/admin/tokens': 7,
    };
    this.menuActive = routes[route] || 0;
  }

  toggleSidebar() {
    console.log("Toggle sidebar", this.menuMin);
    this.menuMin = !this.menuMin;
    
    // En móvil, agregar/quitar clase al sidebar
    if (window.innerWidth < 992) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.toggle('show');
      }
    }else{
      if(this.menuMin){
        $("#main-content").css("margin-left", "70px");
      }else{
        $("#main-content").css("margin-left", "240px");
      }
    }
  }

  logout() {
    this.auth.logout();
  }

}
