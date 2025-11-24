export class Accesos {
  t3_id: number | null;
  t3_estado: number;

  t1_id: number | null;
  t1_email: string;
  t1_celular: string | null;
  t1_nombres: string;
  t1_apellidos: string;
  t1_estado: number | null;
  t1_password: string | null;

  t2_id: number | null;
  t2_rol: string;
  t2_panel: number;

  constructor() {
    this.t3_id = null;
    this.t3_estado = 1;

    this.t1_id = null;
    this.t1_email = '';
    this.t1_celular = null;
    this.t1_nombres = '';
    this.t1_apellidos = '';
    this.t1_estado = null;
    this.t1_password = null;

    this.t2_id = null;
    this.t2_rol = '';
    this.t2_panel = 1;
  }
}