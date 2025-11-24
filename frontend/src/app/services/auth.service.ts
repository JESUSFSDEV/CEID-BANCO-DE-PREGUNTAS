import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { Accesos } from "./../models/t3_acceso.model";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public login_user: Accesos = new Accesos();

  constructor(private router:Router, private http:HttpClient) { }

  logout(){
    this.removeToken();
    window.location.href = '/login';
  }

  getToken(){
    return <string>localStorage.getItem('access_token');
  }

  removeToken(){
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
  }



  login(usuario: Accesos): Observable<any>{
    const form_data = new FormData();
    form_data.append('data',JSON.stringify(usuario));
    return this.http.post<any>(environment.apiUrl+'/login', form_data);
  }



  validarLoginPromise(){
    return new Promise<any>( (resultado) => {
      this.validarLogin().subscribe(
        res => {
          //console.log(res);
          if(res?.t1_id){
            this.login_user = res;
          }else{
            resultado({});
          }
          resultado(res);
        },
        err => {
          resultado({});
        }
      )
    });
  }

  validarLogin(){
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.post<any>(environment.apiUrl+'/token',{},{headers: headers});
  }



  validarLoginPromiseAdministrativo(){
    return new Promise<any>( (resultado) => {
      this.validarLoginAdministrativo().subscribe(
        res => {
          console.log(res);
          if(res?.t1_id){
            this.login_user = res;
          }else{
            resultado({});
          }
          resultado(res);
        },
        err => {
          resultado({});
        }
      )
    });
  }

  validarLoginAdministrativo(){
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.post<any>(environment.apiUrl+'/tokenAdministrativo',{},{headers: headers});
  }


}