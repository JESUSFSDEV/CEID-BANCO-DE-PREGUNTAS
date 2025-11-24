const db = require('../config/db');
const fs = require('fs');
const path = require('path');


async function disponibilidadRecurso(t19_id) {
  const query = `
    SELECT 1
    FROM t19_recursos
    WHERE t19_id = ?
      AND t19_estado = 1
      AND (
            (t19_apertura IS NULL AND NOW() <= t19_cierre)
            OR (t19_apertura IS NOT NULL AND NOW() BETWEEN t19_apertura AND t19_cierre)
          )
    LIMIT 1;
  `;

  const results = await queryAsync(query, [t19_id]);
  return results.length > 0;
}



exports.getAllDataAulaVirtual = async (req, res) => {
  try {
    var query;
    const t5_id = req.query.t5_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t19_recursos 
      INNER JOIN t8_clases ON t8_clases_t8_id = t8_id
      INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
      WHERE t5_cursos_t5_id = ${t5_id} 
      ORDER BY t19_fecha ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT 
          t19_recursos.*,
          t8_clases.*,
          t7_modulos.*,
          CASE 
              WHEN t19_estado = 1 
                  AND (
                      (t19_apertura IS NULL AND NOW() <= t19_cierre)
                      OR (t19_apertura IS NOT NULL AND NOW() BETWEEN t19_apertura AND t19_cierre)
                  )
              THEN 1 ELSE 0 
          END AS estado
      FROM t19_recursos
      INNER JOIN t8_clases ON t8_clases_t8_id = t8_id
      INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
      WHERE t5_cursos_t5_id = ${t5_id}
      ORDER BY t19_fecha ASC;
      `; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.postDataAulaVirtual = async (req, res) => {
  try {
    // Verificación de autenticación
    if (!req.t6_id) {
      throw new Error("Acceso denegado.");
    }

    // Obtener datos del cuerpo de la solicitud
    const { 
      t19_tipo, 
      t19_titulo, 
      t19_descripcion,
      t19_apertura,
      t19_cierre,
      t19_estado, 
      t19_material,
      t19_n_max,
      t19_n_peso,
      t8_clases_t8_id 
    } = JSON.parse(req.body.data);

    // Validación de campos obligatorios
    if (t19_tipo==null || !t19_titulo || (t19_tipo == 1 ? false : t19_estado==null) || !t8_clases_t8_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    let t19_url = null;
    if (!req.file && t19_tipo == 1 && t19_material == 1) {
      throw new Error("No se adjunto ningun archivo.");
    }else if(t19_tipo == 1 && t19_material == 1){
      t19_url = req.file.filename;
    }else if(t19_tipo == 1 && t19_material == 0){
      t19_url = JSON.parse(req.body.data).t19_url || null;
    }

    if(t19_tipo == 2 && req.file){
      t19_url = req.file.filename;
    }
    if(t19_tipo == 3 && req.file){
      t19_url = req.file.filename;
    }

    // Valores por defecto para campos opcionales
    let estado = (isNaN(parseFloat(t19_estado)) || !isFinite(t19_estado)) ? 0 : t19_estado;
    const calificacion = t19_tipo === 1 ? 0 : 1;
    const material = (isNaN(parseFloat(t19_material)) || !isFinite(t19_material)) ? 0 : t19_material;
    const nMax = (isNaN(parseFloat(t19_n_max)) || !isFinite(t19_n_max)) ? null : t19_n_max;
    const nPeso = (isNaN(parseFloat(t19_n_peso)) || !isFinite(t19_n_peso)) ? null : t19_n_peso;

    if(t19_tipo==1){
      estado = 1;
    }

    // Inserción en la base de datos
    const results = await queryAsync(
      `INSERT INTO t19_recursos (
        t19_tipo, 
        t19_titulo, 
        t19_url, 
        t19_descripcion, 
        t19_fecha, 
        t19_apertura, 
        t19_cierre, 
        t19_estado,
        t19_calificacion,
        t19_material,
        t19_n_max,
        t19_n_peso,
        t8_clases_t8_id
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t19_tipo,
        t19_titulo, 
        t19_url || "",
        t19_descripcion || "",
        t19_apertura || null,
        t19_cierre || null,
        estado,
        calificacion,
        material,
        nMax,
        nPeso,
        t8_clases_t8_id
      ]
    );


    if(t19_tipo===2){
      const alumnos = await queryAsync(
        `SELECT * FROM t8_clases A
        INNER JOIN t7_modulos B ON A.t7_modulos_t7_id = B.t7_id
        INNER JOIN t5_cursos C ON B.t5_cursos_t5_id = C.t5_id
        INNER JOIN t11_miscursos D ON C.t5_id = D.t5_cursos_t5_id
        INNER JOIN t38_notas E ON D.t11_id = E.t11_miscursos_t11_id
        WHERE A.t8_id = ? AND C.t5_tipo = 2;`,
        [t8_clases_t8_id]
      );
      for(let i = 0; i < alumnos.length; i++) {
        await queryAsync(
          `INSERT INTO t39_notas_detalles (t39_nota, t19_recursos_t19_id, t38_notas_t38_id, t39_unq) VALUES (0, ?, ?, ?);`,
          [results.insertId, alumnos[i].t38_id, results.insertId + '_' + alumnos[i].t38_id]
        );
      }
    }

    if(t19_tipo===3){
      const alumnos = await queryAsync(
        `SELECT * FROM t8_clases A
        INNER JOIN t7_modulos B ON A.t7_modulos_t7_id = B.t7_id
        INNER JOIN t5_cursos C ON B.t5_cursos_t5_id = C.t5_id
        INNER JOIN t11_miscursos D ON C.t5_id = D.t5_cursos_t5_id
        INNER JOIN t38_notas E ON D.t11_id = E.t11_miscursos_t11_id
        WHERE A.t8_id = ? AND C.t5_tipo = 2;`,
        [t8_clases_t8_id]
      );
      for(let i = 0; i < alumnos.length; i++) {
        await queryAsync(
          `INSERT INTO t39_notas_detalles (t39_nota, t19_recursos_t19_id, t38_notas_t38_id, t39_unq) VALUES (0, ?, ?, ?);`,
          [results.insertId, alumnos[i].t38_id, results.insertId + '_' + alumnos[i].t38_id]
        );
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    if (req.file?.filename) {
      fs.unlinkSync(path.join(__dirname, '../uploads/aula-virtual/', req.file.filename));
    }
    return res.status(400).send(error.message);
  }
};

exports.putDataAulaVirtual = async (req, res) => {
  try {
    // Verificación de autenticación
    if (!req.t6_id) {
      throw new Error("Acceso denegado.");
    }

    // Obtener ID del recurso a actualizar
    const t19_id = req.params.id;

    // Obtener datos del cuerpo de la solicitud
    const { 
      t19_tipo, 
      t19_titulo,  
      t19_descripcion,
      t19_apertura,
      t19_cierre,
      t19_estado, 
      t19_material,
      t19_n_max,
      t19_n_peso,
      t19_url_old,
      t8_clases_t8_id 
    } = JSON.parse(req.body.data);

    // Validación de campos obligatorios
    if (t19_tipo==null || !t19_titulo || t19_estado==null || !t8_clases_t8_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    let t19_url = null;
    if (!req.file && t19_tipo == 1 && t19_material == 1) {
      if(t19_url_old == 1){
        throw new Error("No se adjunto ningun archivo.");
      }
    }else if(t19_tipo == 1 && t19_material == 1){
      t19_url = req.file.filename;
    }else if(t19_tipo == 1 && t19_material == 0){
      t19_url = JSON.parse(req.body.data).t19_url || null;
    }

    if(t19_tipo == 2 && req.file){
      t19_url = req.file.filename;
    }
    if(t19_tipo == 3 && req.file){
      t19_url = req.file.filename;
    }

    // Valores por defecto para campos opcionales
    const estado = (isNaN(parseFloat(t19_estado)) || !isFinite(t19_estado)) ? 0 : t19_estado;
    const calificacion = t19_tipo === 1 ? 0 : 1;
    const material = (isNaN(parseFloat(t19_material)) || !isFinite(t19_material)) ? 0 : t19_material;
    const nMax = (isNaN(parseFloat(t19_n_max)) || !isFinite(t19_n_max)) ? null : t19_n_max;
    const nPeso = (isNaN(parseFloat(t19_n_peso)) || !isFinite(t19_n_peso)) ? null : t19_n_peso;

    const currentData = await queryAsync('SELECT t19_url FROM t19_recursos WHERE t19_id = ?', [t19_id]);

    // Actualización en la base de datos
    let results;
    if(t19_url_old==1 || (t19_tipo == 1 && t19_material == 0)){
      results = await queryAsync(
        `UPDATE t19_recursos SET
          t19_titulo = ?, 
          t19_url = ?, 
          t19_descripcion = ?,
          t19_fecha = NOW(),
          t19_apertura = ?, 
          t19_cierre = ?, 
          t19_estado = ?,
          t19_calificacion = ?,
          t19_material = ?,
          t19_n_max = ?,
          t19_n_peso = ?,
          t8_clases_t8_id = ?
        WHERE t19_id = ?`,
        [
          t19_titulo, 
          t19_url || "",
          t19_descripcion || "",
          t19_apertura || null,
          t19_cierre || null,
          estado,
          calificacion,
          material,
          nMax,
          nPeso,
          t8_clases_t8_id,
          t19_id
        ]
      );
    }else{
      results = await queryAsync(
        `UPDATE t19_recursos SET
          t19_titulo = ?,  
          t19_descripcion = ?,
          t19_apertura = ?, 
          t19_cierre = ?, 
          t19_estado = ?,
          t19_calificacion = ?,
          t19_material = ?,
          t19_n_max = ?,
          t19_n_peso = ?,
          t8_clases_t8_id = ?
        WHERE t19_id = ?`,
        [
          t19_titulo, 
          t19_descripcion || "",
          t19_apertura || null,
          t19_cierre || null,
          estado,
          calificacion,
          material,
          nMax,
          nPeso,
          t8_clases_t8_id,
          t19_id
        ]
      );
    }
    

    if((results.changedRows > 0 && t19_url_old) || (t19_tipo == 1 && t19_material == 0)) {
      // Si se ha subido un nuevo archivo, eliminar el antiguo
      if (currentData.length > 0 && currentData[0].t19_url) {
        const imgPath = path.join(__dirname, '../uploads/aula-virtual/', currentData[0].t19_url);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath); // Eliminar el archivo antiguo
        }
      } else {
        console.log('Archivo no encontrado.');
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putDataConfAulaVirtual = async (req, res) => {
  try {
    // Verificación de autenticación
    if (!req.t6_id) {
      throw new Error("Acceso denegado.");
    }

    // Obtener ID del recurso a actualizar
    const t19_id = req.params.id;

    // Obtener datos del cuerpo de la solicitud
    const { 
      t19_apertura,
      t19_cierre,
      t19_estado, 
      t19_n_max,
      t19_n_peso 
    } = JSON.parse(req.body.data);

    // Validación de campos obligatorios
    if (t19_n_max==null || t19_n_peso==null || t19_estado==null || !t19_cierre==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    if(t19_n_peso<0 || t19_n_peso>100){
      throw new Error("El peso de la nota debe estar entre 0 y 100.");
    }

    // Actualización en la base de datos
    let results = await queryAsync(
        `UPDATE t19_recursos SET
          t19_apertura = ?, 
          t19_cierre = ?, 
          t19_estado = ?,
          t19_n_max = ?,
          t19_n_peso = ?
        WHERE t19_id = ?`,
        [
          t19_apertura || null,
          t19_cierre || null,
          t19_estado,
          t19_n_max,
          t19_n_peso,
          t19_id
        ]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.deleteDataAulaVirtual = async (req, res) => {
  const t19_id = req.params.id;
  try {

    if(!req.t6_id){
      throw new Error("Acceso denegado.");
    }

    // Obtener datos actuales del recurso
    const currentData = await queryAsync('SELECT t19_url FROM t19_recursos WHERE t19_id = ?', [t19_id]);
    if (currentData.length === 0) {
      throw new Error("Recurso no encontrado");
    }
    
    // Eliminar archivo de imagen si existe
    if (currentData[0].t19_url) {
      const imgPath = path.join(__dirname, '../uploads/aula-virtual/', currentData[0].t19_url);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }


    if (!isNaN(parseFloat(t19_id)) && isFinite(t19_id)) {
      const results0 = await queryAsync('DELETE FROM t39_notas_detalles WHERE t19_recursos_t19_id = ?', [t19_id]);
      const results = await queryAsync('DELETE FROM t19_recursos WHERE t19_id = ?', [t19_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


exports.getForosAulaVirtual = async (req, res) => {
  try {
    var query;
    const t19_id = req.query.t19_id;
    if(req.t2_id){
      query = `SELECT A.*, E.*, F.* FROM t41_foros A
          INNER JOIN t19_recursos B ON A.t19_recursos_t19_id = B.t19_id
          LEFT JOIN t11_miscursos C ON A.t11_miscursos_t11_id = C.t11_id
          LEFT JOIN t2_alumnos D ON C.t2_alumnos_t2_id = D.t2_id
          LEFT JOIN t3_perfiles E ON D.t2_id = E.t2_alumnos_t2_id
          LEFT JOIN t6_mentores F ON F.t6_id = A.t6_mentores_t6_id
          WHERE A.t19_recursos_t19_id = ${t19_id} ORDER BY A.t41_fecha DESC;`;
    }else if(req.t6_id){
      query = `SELECT A.*, E.*, F.* FROM t41_foros A
          INNER JOIN t19_recursos B ON A.t19_recursos_t19_id = B.t19_id
          LEFT JOIN t11_miscursos C ON A.t11_miscursos_t11_id = C.t11_id
          LEFT JOIN t2_alumnos D ON C.t2_alumnos_t2_id = D.t2_id
          LEFT JOIN t3_perfiles E ON D.t2_id = E.t2_alumnos_t2_id
          LEFT JOIN t6_mentores F ON F.t6_id = A.t6_mentores_t6_id
          WHERE A.t19_recursos_t19_id = ${t19_id} ORDER BY A.t41_fecha DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.postForosAulaVirtual = async (req, res) => {
  try {
    const { t41_respuesta, t19_id } = JSON.parse(req.body.data);

    if(t41_respuesta==null || t41_respuesta.trim().length === 0 || t19_id==null){
      throw new Error("Revisa los campos obligatorios.");
    }

    let query;
    let params = [];
    let results;

    if(req.t2_id){
      if(!await disponibilidadRecurso(t19_id)){
        throw new Error("El foro se encuentra cerrado.");
      }

      const t11_id = await queryAsync(`SELECT t11_id, t38_id FROM t11_miscursos A
          INNER JOIN t5_cursos C ON A.t5_cursos_t5_id = C.t5_id
          INNER JOIN t7_modulos D ON C.t5_id = D.t5_cursos_t5_id
          INNER JOIN t8_clases E ON D.t7_id = E.t7_modulos_t7_id
          INNER JOIN t19_recursos F ON E.t8_id = F.t8_clases_t8_id
          INNER JOIN t38_notas G ON G.t11_miscursos_t11_id = A.t11_id
          WHERE A.t2_alumnos_t2_id = ${req.t2_id} AND F.t19_id = ${t19_id}`);

      query = `INSERT INTO t41_foros (t41_respuesta, t41_fecha, t19_recursos_t19_id, t11_miscursos_t11_id) 
      VALUES (?, NOW(), ?, ?)`;
      params = [t41_respuesta, t19_id, t11_id[0].t11_id];
      results = await queryAsync(query, params);
      if(results.affectedRows > 0){
        await queryAsync(`UPDATE t39_notas_detalles SET t39_estado = 1 WHERE t39_estado = 0 AND t19_recursos_t19_id = ${t19_id} AND t38_notas_t38_id = ${t11_id[0].t38_id}`);
      }
    }else if(req.t6_id){
      query = `INSERT INTO t41_foros (t41_respuesta, t41_fecha, t19_recursos_t19_id, t6_mentores_t6_id) 
      VALUES (?, NOW(), ?, ?)`;
      params = [t41_respuesta, t19_id, req.t6_id];
      results = await queryAsync(query, params);
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).send(error.message);
  }
};
exports.deleteForosAulaVirtual = async (req, res) => {
  try {
    const t41_id = req.params.id;
    const { t19_recursos_t19_id } = JSON.parse(req.body.data);

    if(t41_id==null){
      throw new Error("Revisa los campos obligatorios.");
    }

    let query;
    let results;
    let results2;
 
    if(req.t2_id){
      if(!await disponibilidadRecurso(t19_recursos_t19_id)){
        throw new Error("El foro se encuentra cerrado.");
      }
      query = `
          DELETE A
          FROM t41_foros A
          INNER JOIN t11_miscursos B ON B.t11_id = A.t11_miscursos_t11_id
          WHERE B.t2_alumnos_t2_id = ${req.t2_id}
            AND A.t41_id = ${t41_id};
        `;
      results = await queryAsync(query);
      if(results.affectedRows > 0){
        results2 = await queryAsync(`SELECT t41_id FROM t41_foros INNER JOIN t11_miscursos ON t11_miscursos.t11_id = t41_foros.t11_miscursos_t11_id WHERE t19_recursos_t19_id = ${t19_recursos_t19_id} AND t2_alumnos_t2_id = ${req.t2_id}`);
        if(results2.length == 0){
          await queryAsync(`UPDATE t39_notas_detalles INNER JOIN t38_notas ON t38_notas.t38_id = t39_notas_detalles.t38_notas_t38_id INNER JOIN t11_miscursos ON t11_miscursos.t11_id = t38_notas.t11_miscursos_t11_id SET t39_estado = 0 WHERE t19_recursos_t19_id = ${t19_recursos_t19_id} AND t2_alumnos_t2_id = ${req.t2_id};`);
        }
      }
    }else if(req.t6_id){
      query = `
          DELETE A
          FROM t41_foros A
          INNER JOIN t6_mentores B ON B.t6_id = A.t6_mentores_t6_id
          WHERE B.t6_id = ${req.t6_id}
            AND A.t41_id = ${t41_id};
        `;
      results = await queryAsync(query);
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).send(error.message);
  }
};


exports.getNotasDetalleAulaVirtual = async (req, res) => {
  try {

    var query;
    const t19_id = req.query.t19_id;

    if(req.t2_id){
      query = `SELECT A.*, E.* FROM t39_notas_detalles A
          INNER JOIN t38_notas B ON A.t38_notas_t38_id = B.t38_id
          INNER JOIN t11_miscursos C ON B.t11_miscursos_t11_id = C.t11_id
          INNER JOIN t2_alumnos D ON C.t2_alumnos_t2_id = D.t2_id
          INNER JOIN t3_perfiles E ON D.t2_id = E.t2_alumnos_t2_id
          WHERE t19_recursos_t19_id = ${t19_id} AND D.t2_id = ${req.t2_id} ORDER BY t3_apellidos ASC, t3_nombres ASC;`;
    }else if(req.t6_id){
      query = `SELECT A.*, E.* FROM t39_notas_detalles A
          INNER JOIN t38_notas B ON A.t38_notas_t38_id = B.t38_id
          INNER JOIN t11_miscursos C ON B.t11_miscursos_t11_id = C.t11_id
          INNER JOIN t2_alumnos D ON C.t2_alumnos_t2_id = D.t2_id
          INNER JOIN t3_perfiles E ON D.t2_id = E.t2_alumnos_t2_id
          WHERE t19_recursos_t19_id = ${t19_id} ORDER BY t3_apellidos ASC, t3_nombres ASC;`;
    }
    

    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.putNotasDetalleAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id){
      throw new Error("Acceso denegado.");
    }

    var results;
    const notas_detalle = JSON.parse(req.body.data);

    if(await disponibilidadRecurso(notas_detalle[0].t19_recursos_t19_id)){
      throw new Error("No se puede calificar mientras el recurso esté abierto.");
    }   

    for (const nota of notas_detalle) {
      if (
        nota.t39_nota==null ||
        isNaN(parseFloat(nota.t39_nota)) ||
        !isFinite(nota.t39_nota)
      ) {
        throw new Error("Revise los campos obligatorios.");
      }

      results = await queryAsync(
        `UPDATE t39_notas_detalles SET t39_nota = ?, t39_estado = 2 WHERE t39_id = ? AND t39_estado != 0;`,
        [nota.t39_nota, nota.t39_id]
      );
    }
    

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).send(error.message);
  }
};



/* ENTREGAR TAREA DE ALUMNO */
exports.putEntregasAulaVirtual = async (req, res) => {
  try {
    // Verificación de autenticación
    if (!req.t2_id) {
      throw new Error("Acceso denegado.");
    }

    // Obtener datos del cuerpo de la solicitud
    const t19_recursos_t19_id = req.params.id;

    // Validación de campos obligatorios
    if (t19_recursos_t19_id == null || !req.file) {
      throw new Error("Revise los campos obligatorios.");
    }

    if(!await disponibilidadRecurso(t19_recursos_t19_id)){
        throw new Error("El foro se encuentra cerrado.");
    }

    let t39_url = null;
    if(req.file){
      t39_url = req.file.filename;
    }

    const alumno = await queryAsync(
      `SELECT * FROM t38_notas A
      INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id
      INNER JOIN t39_notas_detalles C ON A.t38_id = C.t38_notas_t38_id
      WHERE B.t2_alumnos_t2_id = ? AND C.t19_recursos_t19_id = ?;`,
      [req.t2_id, t19_recursos_t19_id]
    );


    // Obtener datos actuales del recurso
    const currentData = await queryAsync('SELECT t39_url FROM t39_notas_detalles WHERE t19_recursos_t19_id = ? AND t38_notas_t38_id = ?', [t19_recursos_t19_id, alumno[0].t38_id]);
    if (currentData.length === 0) {
      throw new Error("Recurso no encontrado");
    }
    // Eliminar archivo de imagen si existe
    if (currentData[0].t39_url) {
      const imgPath = path.join(__dirname, '../uploads/aula-virtual/entregas', currentData[0].t39_url);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }



    let results;
    results = await queryAsync(
      `UPDATE t39_notas_detalles 
       SET t39_estado = 1, t39_url = ? 
       WHERE t19_recursos_t19_id = ? AND t38_notas_t38_id = ?`,
      [
        t39_url || "",
        t19_recursos_t19_id,
        alumno[0].t38_id
      ]
    );

    //console.log(t19_recursos_t19_id, alumno[0].t38_id);
    
    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    if (req.file?.filename) {
      fs.unlinkSync(path.join(__dirname, '../uploads/aula-virtual/entregas/', req.file.filename));
    }
    return res.status(400).send(error.message);
  }
};




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
