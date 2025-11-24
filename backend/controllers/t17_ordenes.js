const db = require('../config/db');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t17_estado = req.query.t17_estado;
    
    var results;
    if (index.trim() != "" && index!="null") {
      console.log(index)
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t17_ordenes LEFT JOIN t18_ordenes_detalle ON t17_id = t17_ordenes_t17_id WHERE t17_estado = ${t17_estado} AND t17_id LIKE '%${index}%' ORDER BY t17_id DESC;`);
    } else {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t17_ordenes LEFT JOIN t18_ordenes_detalle ON t17_id = t17_ordenes_t17_id WHERE t17_estado = ${t17_estado};`);
    }

    var pages = 0;
    if (results[0].filas > 0) {
      pages = Math.ceil(results[0].filas / pages_size);
    }

    var json_resp = [];
    if (pages == 0) {
      json_resp.push(
        {
          'pagina': 1,
          'size': 0,
          'offset': 0,
          'rows': results[0].filas
        }
      );
    } else {
      for (let i = 0; i < pages; i++) {
        let size;
        if (i + 1 == pages && results[0].filas % pages_size != 0) {
          size = results[0].filas % pages_size;
        } else {
          size = pages_size;
        }
        json_resp.push(
          {
            'pagina': i + 1,
            'size': size,
            'offset': i * pages_size,
            'rows': results[0].filas
          }
        );
      }
    }

    return res.status(200).json(json_resp);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    var query;
    const t17_estado = req.query.t17_estado;

    if (req.query.size && req.query.offset) {
      query = `SELECT *, DATE_FORMAT(t17_fecha, '%Y-%m-%d') AS t17_fecha, COUNT(t18_id) AS t18_ordenes_detalle FROM t17_ordenes A 
      INNER JOIN t2_alumnos B ON A.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t3_perfiles C ON C.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t18_ordenes_detalle D ON A.t17_id = D.t17_ordenes_t17_id 
      WHERE t17_estado = ${t17_estado} GROUP BY t17_id ORDER BY t17_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT *, DATE_FORMAT(t17_fecha, '%Y-%m-%d') AS t17_fecha, COUNT(t18_id) AS t18_ordenes_detalle FROM t17_ordenes A 
      INNER JOIN t2_alumnos B ON A.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t3_perfiles C ON C.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t18_ordenes_detalle D ON A.t17_id = D.t17_ordenes_t17_id 
      WHERE t17_estado = ${t17_estado} GROUP BY t17_id ORDER BY t17_id DESC`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t17_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT *, DATE_FORMAT(t17_fecha, '%Y-%m-%d') AS t17_fecha, COUNT(t18_id) AS t18_ordenes_detalle FROM t17_ordenes A 
      INNER JOIN t2_alumnos B ON A.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t3_perfiles C ON C.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t18_ordenes_detalle D ON A.t17_id = D.t17_ordenes_t17_id 
      WHERE t17_id = ? GROUP BY t17_id`, [t17_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const t17_estado = req.query.t17_estado;
    if (req.query.size && req.query.offset) {
      query = `SELECT *, DATE_FORMAT(t17_fecha, '%Y-%m-%d') AS t17_fecha, COUNT(t18_id) AS t18_ordenes_detalle FROM t17_ordenes A
      INNER JOIN t2_alumnos B ON A.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t3_perfiles C ON C.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t18_ordenes_detalle D ON A.t17_id = D.t17_ordenes_t17_id 
      WHERE t17_estado = ${t17_estado} AND t17_id LIKE '%${req.query.index}%' GROUP BY t17_id ORDER BY t17_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT *, DATE_FORMAT(t17_fecha, '%Y-%m-%d') AS t17_fecha, COUNT(t18_id) AS t18_ordenes_detalle FROM t17_ordenes A
      INNER JOIN t2_alumnos B ON A.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t3_perfiles C ON C.t2_alumnos_t2_id = B.t2_id 
      LEFT JOIN t18_ordenes_detalle D ON A.t17_id = D.t17_ordenes_t17_id 
      WHERE t17_estado = ${t17_estado} AND t17_id LIKE '%${req.query.index}%' GROUP BY t17_id ORDER BY t17_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataDetalles = async (req, res) => {
  const t17_id = req.query.t17_id;
  try {
    const results = await queryAsync(`SELECT * FROM t18_ordenes_detalle 
      WHERE t17_ordenes_t17_id = ?;`, [t17_id]);

    var results0 = [];
    for(let i = 0; i < results.length; i++){
      if(results[i].t5_cursos_t5_id){
        results0[i] = JSON.parse(results[i].t18_curso);
        results0[i].t28_id = null;
      }else if(results[i].t28_proyectos_t28_id){
        results0[i] = JSON.parse(results[i].t18_proyecto);
        results0[i].t5_id = null;
      }
    }

    return res.status(200).json(results0);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    console.log(req.body.data)
    const { t17_id, t17_monto } = JSON.parse(req.body.data);
    if (t17_id==null || t17_monto==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t17_ordenes (t17_id, t17_fecha, t17_monto, t17_estado) VALUES (?, NOW(), ?, 1)',
      [t17_id, t17_monto]
    );

    

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t17_id = req.params.id;
    const { t17_fecha, t17_monto, t17_estado } = JSON.parse(req.body.data);
    if (!t17_fecha || t17_monto==null || t17_estado==null) {
      throw new Error("Revise los campos obligatorios.");
    }


    if(t17_estado==0){
      const results0 = await queryAsync(`SELECT * FROM t18_ordenes_detalle INNER JOIN t17_ordenes ON t17_ordenes_t17_id = t17_id WHERE t17_ordenes_t17_id = ${t17_id};`);
      for(let i = 0; i < results0.length; i++){
        if(results0[i].t5_cursos_t5_id){
          const results1 = await queryAsync(`SELECT * FROM t11_miscursos WHERE t5_cursos_t5_id = ${results0[i].t5_cursos_t5_id} AND t2_alumnos_t2_id = ${results0[i].t2_alumnos_t2_id};`);
          await queryAsync(
            `UPDATE t11_miscursos SET t11_estado = 0 WHERE t11_id = ${results1[0].t11_id};`,
          );
        }else if(results0[i].t28_proyectos_t28_id){
          const results1 = await queryAsync(`SELECT * FROM t29_misproyectos WHERE t28_proyectos_t28_id = ${results0[i].t28_proyectos_t28_id} AND t2_alumnos_t2_id = ${results0[i].t2_alumnos_t2_id};`);
          await queryAsync(
            `UPDATE t29_misproyectos SET t29_estado = 0 WHERE t29_id = ${results1[0].t29_id};`,
          );
        }
      }
      await queryAsync(
        `DELETE FROM t16_movimientos WHERE t17_ordenes_t17_id = ${t17_id};`,
      );
    }
    if(t17_estado==1){
      const results0 = await queryAsync(`SELECT * FROM t18_ordenes_detalle INNER JOIN t17_ordenes ON t17_ordenes_t17_id = t17_id LEFT JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t17_ordenes_t17_id = ${t17_id};`);
      for(let i = 0; i < results0.length; i++){
        if(results0[i].t5_cursos_t5_id){
          const results1 = await queryAsync(`SELECT * FROM t11_miscursos WHERE t5_cursos_t5_id = ${results0[i].t5_cursos_t5_id} AND t2_alumnos_t2_id = ${results0[i].t2_alumnos_t2_id};`);
          if(results1.length==0){
            const miscursos = await queryAsync(
              `INSERT INTO t11_miscursos (t11_fecha, t11_estado, t5_cursos_t5_id, t2_alumnos_t2_id, t11_unq) VALUES (NOW(), 1, ?, ?, ?);`,
              [results0[i].t5_cursos_t5_id, results0[i].t2_alumnos_t2_id, results0[i].t5_cursos_t5_id+'_'+results0[i].t2_alumnos_t2_id]
            );
            if(results0[i].t5_tipo==2){
              await queryAsync(
                `INSERT INTO t38_notas (t38_nota, t38_estado, t11_miscursos_t11_id) VALUES (0, 0, ?);`,
                [miscursos.insertId]
              );
              await queryAsync(
                `INSERT INTO t36_asistencias (t36_asistencia, t36_estado, t11_miscursos_t11_id) VALUES (0, 0, ?);`,
                [miscursos.insertId]
              );
            }
          }else{
            await queryAsync(
              `UPDATE t11_miscursos SET t11_estado = 1 WHERE t11_id = ${results1[0].t11_id};`,
            );
          }
        }else if(results0[i].t28_proyectos_t28_id){
          const results1 = await queryAsync(`SELECT * FROM t29_misproyectos WHERE t28_proyectos_t28_id = ${results0[i].t28_proyectos_t28_id} AND t2_alumnos_t2_id = ${results0[i].t2_alumnos_t2_id};`);
          if(results1.length==0){
            await queryAsync(
              `INSERT INTO t29_misproyectos (t29_fecha, t29_estado, t28_proyectos_t28_id, t2_alumnos_t2_id, t29_unq) VALUES (NOW(), 1, ?, ?, ?);`,
              [results0[i].t28_proyectos_t28_id, results0[i].t2_alumnos_t2_id, results0[i].t28_proyectos_t28_id+'_'+results0[i].t2_alumnos_t2_id]
            );
          }else{
            await queryAsync(
              `UPDATE t29_misproyectos SET t29_estado = 1 WHERE t29_id = ${results1[0].t29_id};`,
            );
          }
        }


        
      }
      await queryAsync(
            `INSERT INTO t16_movimientos (t16_concepto,t16_monto,t16_fecha,t17_ordenes_t17_id) VALUES ('COMPRA DE CURSOS',?,NOW(), ?);`,
            [t17_monto, t17_id]
      );
    }
    if(t17_estado==2){
      const results0 = await queryAsync(`SELECT * FROM t18_ordenes_detalle INNER JOIN t17_ordenes ON t17_ordenes_t17_id = t17_id WHERE t17_ordenes_t17_id = ${t17_id};`);
      for(let i = 0; i < results0.length; i++){
        if(results0[i].t5_cursos_t5_id){
          const results1 = await queryAsync(`SELECT * FROM t11_miscursos WHERE t5_cursos_t5_id = ${results0[i].t5_cursos_t5_id} AND t2_alumnos_t2_id = ${results0[i].t2_alumnos_t2_id};`);
          if(results1.length>0){
            await queryAsync(
              `UPDATE t11_miscursos SET t11_estado = 0 WHERE t11_id = ${results1[0].t11_id};`,
            );
          }
        }else if(results0[i].t28_proyectos_t28_id){
          const results1 = await queryAsync(`SELECT * FROM t29_misproyectos WHERE t28_proyectos_t28_id = ${results0[i].t28_proyectos_t28_id} AND t2_alumnos_t2_id = ${results0[i].t2_alumnos_t2_id};`);
          if(results1.length>0){
            await queryAsync(
              `UPDATE t29_misproyectos SET t29_estado = 0 WHERE t29_id = ${results1[0].t29_id};`,
            );
          }
        }
      }
      await queryAsync(
        `DELETE FROM t16_movimientos WHERE t17_ordenes_t17_id = ${t17_id};`,
      );
    }
    
  
    const results = await queryAsync(
      'UPDATE t17_ordenes SET t17_fecha = ?, t17_monto = ?, t17_estado = ? WHERE t17_id = ?',
      [t17_fecha, t17_monto, t17_estado, t17_id]
    );


    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t12_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t12_id)) && isFinite(t12_id)) {
      const results = await queryAsync('DELETE FROM t12_examenes WHERE t12_id = ?', [t12_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


/*INTRANET*/


exports.postDataIntranet = async (req, res) => {
  try {
    const { t17_operacion } = JSON.parse(req.body.data);
    if (t17_operacion==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    
    const results0 = await queryAsync(`SELECT * FROM t25_carritos A
      INNER JOIN t2_alumnos D ON D.t2_id = A.t2_alumnos_t2_id
      INNER JOIN t3_perfiles E ON E.t2_alumnos_t2_id = D.t2_id
      LEFT JOIN t5_cursos B ON A.t5_cursos_t5_id = B.t5_id 
      LEFT JOIN t28_proyectos C ON A.t28_proyectos_t28_id = C.t28_id
      WHERE A.t2_alumnos_t2_id = ${req.t2_id};`);

    if (results0.length == 0) {
      throw new Error("No hay cursos o proyectos en el carrito.");
    }

    if(results0[0].t3_nombres==null || results0[0].t3_apellidos==null || results0[0].t3_celular==null){
      throw new Error("Complete la información de su perfil de contacto antes de realizar una orden de compra.");
    }


    var t17_monto = 0;
    for(let i = 0; i < results0.length; i++){
      if(results0[i].t5_cursos_t5_id){
        t17_monto += results0[i].t5_precio;
      }else if(results0[i].t28_proyectos_t28_id){
        t17_monto += results0[i].t28_precio;
      }
    }

    // Verificar si el archivo fue subido
    let t17_url = null;
    if (req.file) {
      t17_url = req.file.filename; // Obtener el nombre del archivo subido
    }else{
      t17_url = "";
    }

    const results1 = await queryAsync(
      `INSERT INTO t17_ordenes (t17_fecha, t17_operacion, t17_url, t17_monto, t17_estado, t2_alumnos_t2_id) VALUES (NOW(), ?, ?, ?, 0, ?);`,
      [t17_operacion, t17_url, t17_monto, req.t2_id]
    );
    
    for(let j = 0; j < results0.length; j++){
      if(results0[j].t5_cursos_t5_id){
        results0[j].t18_curso = {
          t5_id: results0[j].t5_id,
          t5_tipo: results0[j].t5_tipo,
          t5_certificacion: results0[j].t5_certificacion,
          t5_codigo: results0[j].t5_codigo,
          t5_curso: results0[j].t5_curso,
          t5_fecha: results0[j].t5_fecha,
          t5_dificultad: results0[j].t5_dificultad,
          t5_precio: results0[j].t5_precio,
          t5_estado: results0[j].t5_estado,
        };
        await queryAsync(
          `INSERT INTO t18_ordenes_detalle (t18_curso, t5_cursos_t5_id, t17_ordenes_t17_id) VALUES (?, ?, ?);`,
          [JSON.stringify(results0[j].t18_curso),  results0[j].t5_id, results1.insertId]
        );
      }else if(results0[j].t28_proyectos_t28_id){
        results0[j].t18_proyecto = {
          t28_id: results0[j].t28_id,
          t28_proyecto: results0[j].t28_proyecto,
          t28_precio: results0[j].t28_precio,
          t28_estado: results0[j].t28_estado,
        };
        await queryAsync(
          `INSERT INTO t18_ordenes_detalle (t18_proyecto, t28_proyectos_t28_id, t17_ordenes_t17_id) VALUES (?, ?, ?);`,
          [JSON.stringify(results0[j].t18_proyecto),  results0[j].t28_id, results1.insertId]
        );
      }
      
    }

    if(results1.serverStatus==2){
      await queryAsync(
        `DELETE FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id};`);

      await queryAsync(
          `INSERT INTO t22_notificaciones (t22_notificacion, t22_fecha, t22_prioridad, t22_estado) VALUES (?, NOW(), 3, 0)`,
          ['Nueva orden de compra pendiente.']
      );
    }

    return res.status(200).json(results1);
  } catch (error) {
    console.log(error.message);
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
