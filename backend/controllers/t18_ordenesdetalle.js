const db = require('../config/db');



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
    const results = await queryAsync(`SELECT * FROM t18_ordenes_detalle WHERE t17_ordenes_t17_id = ?;`, [t17_id]);

    var results0 = [];
    for(let i = 0; i < results.length; i++){
      results0[i] = JSON.parse(results[i].t18_curso);
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

    const results0 = await queryAsync(`SELECT * FROM t25_carritos INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t2_alumnos_t2_id = ${req.t2_id};`);
    var t17_monto = 0;
    for(let i = 0; i < results0.length; i++){
      t17_monto += results0[i].t5_precio;
      console.log(results0[i].t5_precio);
    }

    // Verificar si el archivo fue subido
    let t17_url = null;
    if (req.file) {
      t17_url = req.file.filename; // Obtener el nombre del archivo subido
    }

    const results1 = await queryAsync(
      `INSERT INTO t17_ordenes (t17_fecha, t17_operacion, t17_url, t17_monto, t17_estado, t2_alumnos_t2_id) VALUES (NOW(), ?, ?, ?, 0, ?);`,
      [t17_operacion, t17_url, t17_monto, req.t2_id]
    );
    
    for(let j = 0; j < results0.length; j++){
      await queryAsync(
        `INSERT INTO t18_ordenes_detalle (t18_curso, t5_cursos_t5_id, t17_ordenes_t17_id) VALUES (?, ?, ?);`,
        [JSON.stringify(results0[j]),  results0[j].t5_id, results1.insertId]
      );
    }

    if(results1.serverStatus==2){
      await queryAsync(
        `DELETE FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id};`);
    }

    return res.status(200).json(results1);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.getDataIntranet = async (req, res) => {
  const t5_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT * FROM t18_ordenes_detalle INNER JOIN t17_ordenes ON t17_ordenes_t17_id = t17_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id} ORDER BY t17_fecha DESC LIMIT 1;`);
    if(results.length>0){
      return res.status(200).json(results[0]);
    }else{
      return res.status(200).json({t18_id:null});
    }
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
