import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Persona } from '../models/t1_persona.model';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonasService {

  constructor(private http: HttpClient) { }

  getToken(): string {
    return <string>localStorage.getItem('access_token');
  }

  // Método para crear headers con el token
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
  }

  // Métodos para paginación
  getPages(pageSize: number, usuario: any): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    params = params.append('index', usuario.t1_email);
    params = params.append('size', pageSize);
    return this.http.get<any>(`${environment.apiUrl}/usuarios/paginar`, { headers, params });
  }

  getDataId(usuario: Persona): Observable<Persona> {
    const headers = this.getHeaders();
    return this.http.get<Persona>(`${environment.apiUrl}/usuarios/${usuario.t1_id}`, { headers });
  }

  getDataFilter(page: any, filtro: Persona): Observable<Persona[]> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    params = params.append('index', filtro.t1_email);
    if(page!=0){
      params = params.append('size', page.size);
      params = params.append('offset', page.offset);
    }
    return this.http.get<Persona[]>(`${environment.apiUrl}/usuarios`, { headers, params });
  }

  postData(demostracion: Persona): Observable<any> {
    const headers = this.getHeaders();
    const formData = new FormData();
    formData.append('data', JSON.stringify(demostracion));
    return this.http.post<any>(`${environment.apiUrl}/usuarios`, formData, { headers });
  }

  putData(usuario: Persona): Observable<any> {
    const headers = this.getHeaders();
    const formData = new FormData();
    formData.append('data', JSON.stringify(usuario));
    return this.http.put<any>(`${environment.apiUrl}/usuarios/${usuario.t1_id}`, formData, { headers });
  }

  deleteData(usuario: Persona): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(`${environment.apiUrl}/usuarios/${usuario.t1_id}`, { headers });
  }

}
