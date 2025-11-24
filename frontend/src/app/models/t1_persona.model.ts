export class Persona {
  t1_id: number | null;
  t1_email: string;
  t1_celular: string | null;
  t1_nombres: string;
  t1_apellidos: string;
  t1_estado: number | null;
  t1_password: string | null;

  constructor() {
    this.t1_id = null;
    this.t1_email = '';
    this.t1_celular = null;
    this.t1_nombres = '';
    this.t1_apellidos = '';
    this.t1_estado = null;
    this.t1_password = null;
  }
}