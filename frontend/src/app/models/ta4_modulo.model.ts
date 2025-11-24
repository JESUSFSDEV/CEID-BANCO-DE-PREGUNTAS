import { Rol } from "./t2_rol.model";
import { Modulo } from "./t4_modulo.model";

export class ModuloAccesos {
  ta4_id: number | null;
  ta4_lectura: number;
  ta4_crear: number;
  ta4_modificar: number;
  ta4_eliminar: number;

  t2_roles?: Rol;
  t4_modulos?: Modulo;

  constructor() {
    this.ta4_id = null;
    this.ta4_lectura = 0;
    this.ta4_crear = 0;
    this.ta4_modificar = 0;
    this.ta4_eliminar = 0;
  }
}