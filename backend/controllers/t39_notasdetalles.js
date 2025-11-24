const db = require('../config/db');
const fs = require('fs');
const path = require('path');

/*
exports.getDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id){
      throw new Error("Acceso denegado.");
    }

    var query;
    const t8_id = req.query.t8_id;

    const t37_asistencias_detalles_old = await queryAsync(`
                SELECT * FROM t8_clases B 
                INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
                INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id
                INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id 
                INNER JOIN t36_asistencias G ON G.t11_miscursos_t11_id = F.t11_id
                LEFT JOIN t37_asistencias_detalles H ON H.t8_clases_t8_id = B.t8_id AND H.t36_asistencias_t36_id = G.t36_id
                WHERE B.t8_id = ? AND D.t6_mentores_t6_id = ? ORDER BY t8_id ASC;
              `, [t8_id, req.t6_id]);


    for (let data of t37_asistencias_detalles_old) {
      if (data.t37_id) {
        // Si ya existe un registro, no hacer nada
        continue;
      } else {
        // Si no existe, insertar un nuevo registro
        await queryAsync(`
          INSERT INTO t37_asistencias_detalles (t8_clases_t8_id, t36_asistencias_t36_id, t37_estado, t37_unq)
          VALUES (?, ?, ?, ?)
        `, [data.t8_id, data.t36_id, 2, data.t8_id + '_' + data.t36_id]);
      }
    }

    query = `SELECT * FROM t37_asistencias_detalles A
          INNER JOIN t8_clases B ON A.t8_clases_t8_id = B.t8_id
          INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
          INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id

          INNER JOIN t36_asistencias E ON A.t36_asistencias_t36_id = E.t36_id
          INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id AND F.t11_id = E.t11_miscursos_t11_id
          INNER JOIN t2_alumnos G ON F.t2_alumnos_t2_id = G.t2_id
          INNER JOIN t3_perfiles H ON G.t2_id = H.t2_alumnos_t2_id

          WHERE B.t8_id = ${t8_id} AND D.t6_mentores_t6_id = ${req.t6_id} ORDER BY H.t3_apellidos ASC, H.t3_nombres ASC;`;

    const results = await queryAsync(query);

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
*/

exports.getAllDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id && !req.t2_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    let query;
    let t39_notasdetalles_old;
    let results2;
    const t5_id = req.query.t5_id;

    
    if(req.t6_id){
      t39_notasdetalles_old = await queryAsync(`
                SELECT A.*, G.*, H.* FROM t19_recursos A 
				        INNER JOIN t8_clases B ON A.t8_clases_t8_id = B.t8_id
                INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
                INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id
                INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id
                INNER JOIN t38_notas G ON G.t11_miscursos_t11_id = F.t11_id
                LEFT JOIN t39_notas_detalles H ON H.t19_recursos_t19_id = A.t19_id AND H.t38_notas_t38_id = G.t38_id
                WHERE A.t19_tipo > 1 AND D.t5_id = ? AND (D.t6_mentores_t6_id = ? OR D.t6_mentores_t6_id_t = ?) 
                ORDER BY t7_id ASC, t8_id ASC, t19_id ASC;
              `, [t5_id, req.t6_id, req.t6_id]);

      for (let data of t39_notasdetalles_old) {
        if (data.t39_id) {
          // Si ya existe un registro, no hacer nada
          continue;
        } else {
          // Si no existe, insertar un nuevo registro
          await queryAsync(`
            INSERT INTO t39_notas_detalles (t19_recursos_t19_id, t38_notas_t38_id, t39_estado, t39_nota, t39_unq)
            VALUES (?, ?, ?, ?, ?)
          `, [data.t19_id, data.t38_id, 0, 0, data.t19_id + '_' + data.t38_id]);
        }
      }


      results2 = await queryAsync(`
                SELECT 
                  A.*, 
                  Z.*, 
                  SUM(t39_nota*t19_n_peso/t19_n_max)*0.2 AS t38_nota,
                  CASE 
                    WHEN SUM(t39_nota*t19_n_peso/t19_n_max)*0.2 >= 10.5 THEN 1 
                    ELSE 0 
                  END AS t38_estado
                  
                FROM t39_notas_detalles A
                INNER JOIN t19_recursos Z ON A.t19_recursos_t19_id = Z.t19_id
                INNER JOIN t8_clases B ON Z.t8_clases_t8_id = B.t8_id
                INNER JOIN t38_notas C ON A.t38_notas_t38_id = C.t38_id
                INNER JOIN t11_miscursos D ON C.t11_miscursos_t11_id = D.t11_id 
                INNER JOIN t5_cursos E ON D.t5_cursos_t5_id = E.t5_id
                WHERE E.t5_id = ?
                  AND Z.t19_tipo > 1 
                  AND B.t8_estado != 2 
                  AND (E.t6_mentores_t6_id = ? OR E.t6_mentores_t6_id_t = ?)
                GROUP BY A.t38_notas_t38_id
                ORDER BY B.t8_id ASC;
      `, [t5_id, req.t6_id, req.t6_id]);

      for (let i = 0; i < results2.length; i++) {
        await queryAsync(`
                UPDATE t38_notas 
                SET t38_nota = ?, t38_estado = ? 
                WHERE t38_id = ?
        `, [results2[i].t38_nota, results2[i].t38_estado, results2[i].t38_notas_t38_id]);
      }
    

      query = `SELECT * FROM t39_notas_detalles A
		      INNER JOIN t19_recursos Z ON A.t19_recursos_t19_id = Z.t19_id
          INNER JOIN t8_clases B ON Z.t8_clases_t8_id = B.t8_id
          INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
          INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id

          INNER JOIN t38_notas E ON A.t38_notas_t38_id = E.t38_id
          INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id AND F.t11_id = E.t11_miscursos_t11_id
          INNER JOIN t2_alumnos G ON F.t2_alumnos_t2_id = G.t2_id
          INNER JOIN t3_perfiles H ON G.t2_id = H.t2_alumnos_t2_id

          WHERE Z.t19_tipo > 1 AND B.t8_estado != 2 AND D.t5_id = ${t5_id} AND (D.t6_mentores_t6_id = ${req.t6_id} OR D.t6_mentores_t6_id_t = ${req.t6_id}) 
          ORDER BY H.t3_apellidos ASC, H.t3_nombres ASC, B.t8_fecha ASC;`;

    }else if(req.t2_id){

      t39_notasdetalles_old = await queryAsync(`
                SELECT A.*, G.*, H.* FROM t19_recursos A 
				        INNER JOIN t8_clases B ON A.t8_clases_t8_id = B.t8_id
                INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
                INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id
                INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id
                INNER JOIN t38_notas G ON G.t11_miscursos_t11_id = F.t11_id
                LEFT JOIN t39_notas_detalles H ON H.t19_recursos_t19_id = A.t19_id AND H.t38_notas_t38_id = G.t38_id
                WHERE A.t19_tipo > 1 AND D.t5_id = ? AND F.t2_alumnos_t2_id = ? 
                ORDER BY t7_id ASC, t8_id ASC, t19_id ASC;
              `, [t5_id, req.t2_id]);

      for (let data of t39_notasdetalles_old) {
        if (data.t39_id) {
          // Si ya existe un registro, no hacer nada
          continue;
        } else {
          // Si no existe, insertar un nuevo registro
          await queryAsync(`
            INSERT INTO t39_notas_detalles (t19_recursos_t19_id, t38_notas_t38_id, t39_estado, t39_nota, t39_unq)
            VALUES (?, ?, ?, ?, ?)
          `, [data.t19_id, data.t38_id, 0, 0, data.t19_id + '_' + data.t38_id]);
        }
      }

      query = `SELECT * FROM t39_notas_detalles A
		      INNER JOIN t19_recursos Z ON A.t19_recursos_t19_id = Z.t19_id
          INNER JOIN t8_clases B ON Z.t8_clases_t8_id = B.t8_id
          INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
          INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id

          INNER JOIN t38_notas E ON A.t38_notas_t38_id = E.t38_id
          INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id AND F.t11_id = E.t11_miscursos_t11_id
          INNER JOIN t2_alumnos G ON F.t2_alumnos_t2_id = G.t2_id
          INNER JOIN t3_perfiles H ON G.t2_id = H.t2_alumnos_t2_id

          WHERE Z.t19_tipo > 1 AND B.t8_estado != 2 AND D.t5_id = ${t5_id} AND F.t2_alumnos_t2_id = ${req.t2_id}
          ORDER BY H.t3_apellidos ASC, H.t3_nombres ASC, B.t8_fecha ASC;`;

    }else if(req.t1_id){
      t39_notasdetalles_old = await queryAsync(`
                SELECT A.*, G.*, H.* FROM t19_recursos A 
				        INNER JOIN t8_clases B ON A.t8_clases_t8_id = B.t8_id
                INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
                INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id
                INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id
                INNER JOIN t38_notas G ON G.t11_miscursos_t11_id = F.t11_id
                LEFT JOIN t39_notas_detalles H ON H.t19_recursos_t19_id = A.t19_id AND H.t38_notas_t38_id = G.t38_id
                WHERE A.t19_tipo > 1 AND D.t5_id = ?  
                ORDER BY t7_id ASC, t8_id ASC, t19_id ASC;
              `, [t5_id]);

      for (let data of t39_notasdetalles_old) {
        if (data.t39_id) {
          // Si ya existe un registro, no hacer nada
          continue;
        } else {
          // Si no existe, insertar un nuevo registro
          await queryAsync(`
            INSERT INTO t39_notas_detalles (t19_recursos_t19_id, t38_notas_t38_id, t39_estado, t39_nota, t39_unq)
            VALUES (?, ?, ?, ?, ?)
          `, [data.t19_id, data.t38_id, 0, 0, data.t19_id + '_' + data.t38_id]);
        }
      }


      results2 = await queryAsync(`
                SELECT 
                  A.*, 
                  Z.*, 
                  SUM(t39_nota*t19_n_peso/t19_n_max)*0.2 AS t38_nota,
                  CASE 
                    WHEN SUM(t39_nota*t19_n_peso/t19_n_max)*0.2 >= 10.5 THEN 1 
                    ELSE 0 
                  END AS t38_estado
                  
                FROM t39_notas_detalles A
                INNER JOIN t19_recursos Z ON A.t19_recursos_t19_id = Z.t19_id
                INNER JOIN t8_clases B ON Z.t8_clases_t8_id = B.t8_id
                INNER JOIN t38_notas C ON A.t38_notas_t38_id = C.t38_id
                INNER JOIN t11_miscursos D ON C.t11_miscursos_t11_id = D.t11_id 
                INNER JOIN t5_cursos E ON D.t5_cursos_t5_id = E.t5_id
                WHERE E.t5_id = ?
                  AND Z.t19_tipo > 1 
                  AND B.t8_estado != 2 
                GROUP BY A.t38_notas_t38_id
                ORDER BY B.t8_id ASC;
      `, [t5_id]);

      for (let i = 0; i < results2.length; i++) {
        await queryAsync(`
                UPDATE t38_notas 
                SET t38_nota = ?, t38_estado = ? 
                WHERE t38_id = ?
        `, [results2[i].t38_nota, results2[i].t38_estado, results2[i].t38_notas_t38_id]);
      }
    

      query = `SELECT * FROM t39_notas_detalles A
		      INNER JOIN t19_recursos Z ON A.t19_recursos_t19_id = Z.t19_id
          INNER JOIN t8_clases B ON Z.t8_clases_t8_id = B.t8_id
          INNER JOIN t7_modulos C ON B.t7_modulos_t7_id = C.t7_id
          INNER JOIN t5_cursos D ON C.t5_cursos_t5_id = D.t5_id

          INNER JOIN t38_notas E ON A.t38_notas_t38_id = E.t38_id
          INNER JOIN t11_miscursos F ON F.t5_cursos_t5_id = D.t5_id AND F.t11_id = E.t11_miscursos_t11_id
          INNER JOIN t2_alumnos G ON F.t2_alumnos_t2_id = G.t2_id
          INNER JOIN t3_perfiles H ON G.t2_id = H.t2_alumnos_t2_id

          WHERE Z.t19_tipo > 1 AND B.t8_estado != 2 AND D.t5_id = ${t5_id}  
          ORDER BY H.t3_apellidos ASC, H.t3_nombres ASC, B.t8_fecha ASC;`;
    }

    
    const results = await queryAsync(query);

    // Paso 1: Filtrar duplicados por t11_id
    const results0 = [];
    const seenIds = new Set();

    for (const r of results) {
      if (!seenIds.has(r.t11_id)) {
        seenIds.add(r.t11_id);
        results0.push({
          t11_id: r.t11_id,
          t3_apellidos: r.t3_apellidos,
          t3_nombres: r.t3_nombres,
          t38_nota: r.t38_nota,
          t38_estado: r.t38_estado,
        });
      }
    }

    // Paso 2: Agrupar recursos por t11_id
    const results1 = results0.map(persona => {
      const recursos = results
        .filter(r => r.t11_id === persona.t11_id)
        .map(r => ({
          t19_titulo: r.t19_titulo,
          t19_n_max: r.t19_n_max,
          t19_n_peso: r.t19_n_peso,
          t8_clase: r.t8_clase,
          t7_modulo: r.t7_modulo,
          t39_nota: r.t39_nota,
          t39_estado: r.t39_estado,
        }));

    //const t38_notas = recursos.filter(c => c.t19_tipo > 1).length;

      return {
        ...persona,
        t19_recursos: recursos,
        //t38_notas
      };
    });


    return res.status(200).json(results1);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


/*
exports.putDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id){
      throw new Error("Acceso denegado.");
    }

    let results;
    let results1;
    const t8_id = req.params.id;
    const t37_asistencias_detalles = JSON.parse(req.body.data);

    for (let data of t37_asistencias_detalles) {
      results = await queryAsync(`
          UPDATE t37_asistencias_detalles 
          SET t37_estado = ?
          WHERE t37_id = ?
        `, [data.t37_estado, data.t37_id]);

      if (results.affectedRows) {
          const results0 = await queryAsync(`
                SELECT 
                  A.*, 
                  E.t5_asistencia, 
                  COUNT(CASE WHEN A.t37_estado = 1 THEN 1 END)*100/COUNT(t8_id) AS t36_asistencia,
                  CASE 
                    WHEN COUNT(CASE WHEN A.t37_estado = 1 THEN 1 END)*100/COUNT(t8_id) >= E.t5_asistencia THEN 1 
                    ELSE 0 
                  END AS t36_estado
                FROM t37_asistencias_detalles A
                INNER JOIN t8_clases B ON A.t8_clases_t8_id = B.t8_id
                INNER JOIN t36_asistencias C ON A.t36_asistencias_t36_id = C.t36_id
                INNER JOIN t11_miscursos D ON C.t11_miscursos_t11_id = D.t11_id 
                INNER JOIN t5_cursos E ON D.t5_cursos_t5_id = E.t5_id
                WHERE A.t36_asistencias_t36_id = ? 
                  AND B.t8_estado != 2 
                  AND E.t6_mentores_t6_id = ?
                GROUP BY A.t36_asistencias_t36_id
                ORDER BY B.t8_id ASC;
          `, [data.t36_id, req.t6_id]);

          if (results0.length > 0) {
            results1 = await queryAsync(`
              UPDATE t36_asistencias 
              SET t36_asistencia = ?, t36_estado = ?
              WHERE t36_id = ?
            `, [results0[0].t36_asistencia, results0[0].t36_estado, data.t36_id]);
          }

      }
    }

    return res.status(200).json(results1);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
*/





// Función auxiliar para realizar consultas a la base de datos con async/await
function queryAsync(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
