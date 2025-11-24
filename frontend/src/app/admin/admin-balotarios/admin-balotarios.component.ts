import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona } from '../../models/t1_persona.model';
import { PersonasService } from '../../services/personas.service';
import { environment } from './../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

declare var $: any;

@Component({
  selector: 'app-admin-balotarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-balotarios.component.html',
  styleUrl: './admin-balotarios.component.css'
})
export class AdminBalotariosComponent {

  public env = environment;
  
  usuarios: Persona[] = [];
  usuario: Persona = new Persona();
  usuario_find: Persona = new Persona();

  // Control de botones y estados
  btn: boolean = true;
  ready: boolean = false;
  searchTerm: string = '';
    
  // Paginación
  pages: any[] = [{}];
  pageActive: number = 1;
  pageSize: number = 20;

  // Usuario logueado
  login_user: any;
  
  constructor(
    private auth: AuthService,
    private service: PersonasService,
    private toastr: ToastrService
  ){
    this.usuario_find = new Persona();
    this.login_user = this.auth.login_user;
  }
  
  ngOnInit(): void {
    this.paginar();
  }

  paginar(){
    this.ready = false;
    this.usuario_find.t1_email = this.searchTerm;
    this.service.getPages(this.pageSize, this.usuario_find).subscribe(
      res => {
        if (res.length < this.pageActive) {
          if (this.searchTerm.trim() === "") {
            this.pageActive = res.length;
          } else {
            this.pageActive = 1;
          }
        }
        this.pages = res;
        this.getData(this.pageActive);
      },
      err => {
        console.error(err);
        this.ready = true;
        this.toastr.error('Error al cargar las páginas', 'Error');
      }
    );   
  }

  getData(page: number) {
    this.ready = false;
    this.pageActive = page;
    try {
        this.service.getDataFilter(this.pages[page - 1], this.usuario_find).subscribe(
          res => {
            console.log('Usuarios cargados:', res);
            this.usuarios = res;
            this.ready = true;
          },
          err => {
            console.error(err);
            this.ready = true;
            this.toastr.error('Error al cargar usuarios', 'Error');
          }
        );
    } catch (error) {
        console.error(error);
        this.pageActive -= 1;
        if (this.pageActive > 0) {
          this.service.getDataFilter(this.pages[this.pageActive - 1], this.usuario_find).subscribe(
            res => {
              this.usuarios = res;
              this.ready = true;
            },
            err => {
              console.error(err);
              this.ready = true;
              this.toastr.error('Error al cargar usuarios', 'Error');
            }
          );
        } else {
          this.ready = true;
        }
    }
    

  }

  closeForm(): void {
    $('#modalAdd').modal('hide');
    this.usuario = new Persona();
  }

  closeConfirm(): void {
    $('#modalEliminar').modal('hide');
    this.usuario = new Persona();
  }

  resetForm(): void {
    this.usuario = new Persona();
  }

  edit(usuario: Persona): void {
    this.usuario = {...usuario};
  }

  submit(): void {
    this.btn = false;
    if (this.usuario.t1_id==null) {
      // Crear nuevo usuario
      this.service.postData(this.usuario)
        .subscribe(
          (response) => {
            this.btn = true;
            this.toastr.success('Elemento creado exitosamente', 'Éxito');
            this.closeForm();
            this.paginar();
          },
          (error) => {
            this.btn = true;
            console.error('Error al crear elemento:', error);
            this.toastr.error('No se pudo crear el elemento', 'Error');
          }
        );
    } else {
      // Actualizar usuario existente
      this.service.putData(this.usuario)
        .subscribe(
          (response) => {
            this.btn = true;
            this.toastr.success('Elemento actualizado exitosamente', 'Éxito');
            this.closeForm();
            this.paginar();
          },
          (error) => {
            this.btn = true;
            console.error('Error al actualizar elemento:', error);
            this.toastr.error('No se pudo actualizar el elemento', 'Error');
          }
        );
    }
  }


  eliminar(usuario: any): void {
    if (usuario.t1_id) {
      this.btn = true;
      this.usuario = {...usuario};
    } else {
      this.btn = false;
      this.service.deleteData(this.usuario)
        .subscribe(
          (response) => {
            this.btn = true;
            this.toastr.success('Usuario eliminado exitosamente', 'Éxito');
            this.paginar();
            this.closeConfirm();
          },
          (error) => {
            console.error('Error al eliminar usuario:', error);
            this.btn = true;
            this.toastr.error('No se pudo eliminar el usuario', 'Error');
          }
        );
    }
  }

}
