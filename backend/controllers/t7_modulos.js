const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t5_id = req.query.t5_id;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t7_modulos WHERE t5_cursos_t5_id = ${t5_id} AND t7_modulo LIKE '%${index}%'ORDER BY t7_id ASC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t7_modulos WHERE t5_cursos_t5_id = ${t5_id} ORDER BY t7_id ASC;`);
    }
    
    var pages = 0;
    if(results[0].filas>0){
      pages = Math.ceil(results[0].filas / pages_size); 
    }

    var json_resp = [];
    if(pages==0){
      json_resp.push( 
        {
          'pagina': 1,
          'size': 0,
          'offset': 0,
          'rows': results[0].filas
        }
      );
    }else{
        for(let i = 0; i < pages; i++){
          let size;
          if(i + 1 == pages && results[0].filas%pages_size!=0){
            size = results[0].filas%pages_size;
          }else{
            size = pages_size;
          }
          json_resp.push(
            {  
              'pagina': i+1,
              'size': size,
              'offset': i*pages_size,
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
    const t5_id = req.query.t5_id;
    if(req.query.size && req.query.offset){
      query = `SELECT A.*, B.*, C.* FROM t7_modulos A
      LEFT JOIN t12_examenes B ON A.t7_id = B.t7_modulos_t7_id 
      LEFT JOIN t14_calificaciones C ON A.t7_id = C.t7_modulos_t7_id AND C.t14_estado = 2
      WHERE A.t5_cursos_t5_id = ${t5_id} GROUP BY A.t7_id ORDER BY A.t7_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT A.*, B.*, C.* FROM t7_modulos A
      LEFT JOIN t12_examenes B ON A.t7_id = B.t7_modulos_t7_id 
      LEFT JOIN t14_calificaciones C ON A.t7_id = C.t7_modulos_t7_id AND C.t14_estado = 2
      WHERE A.t5_cursos_t5_id = ${t5_id} GROUP BY A.t7_id ORDER BY A.t7_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t7_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t7_modulos WHERE t7_id = ?', [t7_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const t5_id = req.query.t5_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t7_modulos WHERE t5_cursos_t5_id = ${t5_id} AND t7_modulo LIKE '%${req.query.index}%' ORDER BY t7_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t7_modulos WHERE t5_cursos_t5_id = ${t5_id} AND t7_modulo LIKE '%${index}%' ORDER BY t7_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t7_modulo, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (!t7_modulo || !t5_cursos_t5_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t7_modulos (t7_modulo, t5_cursos_t5_id) VALUES (?, ?)',
      [t7_modulo, t5_cursos_t5_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t7_id = req.params.id;
    const { t7_modulo } = JSON.parse(req.body.data);
    if (!t7_modulo) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t7_modulos SET t7_modulo = ? WHERE t7_id = ?',
      [t7_modulo, t7_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t7_id = req.params.id;
  console.log(t7_id)
  try {
    if (!isNaN(parseFloat(t7_id)) && isFinite(t7_id)) {
      const results = await queryAsync('DELETE FROM t7_modulos WHERE t7_id = ?', [t7_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};



exports.getAllDataIntranetFree = async (req, res) => {
  try {
    var query;
    const t5_id = req.query.t5_id;
    query = `SELECT A.* FROM t7_modulos A
	    INNER JOIN t5_cursos E ON A.t5_cursos_t5_id = E.t5_id 
      WHERE A.t5_cursos_t5_id = ${t5_id} GROUP BY A.t7_id ORDER BY A.t7_id ASC;`; 

    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllDataIntranet = async (req, res) => {
  try {
    var query;
    const t5_id = req.query.t5_id;
    query = `SELECT A.*, B.*, C.* FROM t7_modulos A
	    INNER JOIN t5_cursos E ON A.t5_cursos_t5_id = E.t5_id 
	    INNER JOIN t11_miscursos D ON D.t5_cursos_t5_id = E.t5_id 
      LEFT JOIN t12_examenes B ON A.t7_id = B.t7_modulos_t7_id  AND B.t12_estado = 1 
      LEFT JOIN t14_calificaciones C ON A.t7_id = C.t7_modulos_t7_id AND D.t11_id = C.t11_miscursos_t11_id  AND C.t14_estado = 2
      WHERE A.t5_cursos_t5_id = ${t5_id} AND D.t2_alumnos_t2_id = ${req.t2_id} GROUP BY A.t7_id ORDER BY A.t7_id ASC;`; 

    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};




exports.getAllDataAulaVirtual = async (req, res) => {
  try {
    var query;
    const t5_id = req.query.t5_id;
    query = `SELECT A.*, E.* FROM t7_modulos A
	    INNER JOIN t5_cursos E ON A.t5_cursos_t5_id = E.t5_id 
      WHERE A.t5_cursos_t5_id = ${t5_id} GROUP BY A.t7_id ORDER BY A.t7_id ASC;`; 

    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    const { t7_modulo, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (!t7_modulo || !t5_cursos_t5_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t7_modulos (t7_modulo, t5_cursos_t5_id) VALUES (?, ?)',
      [t7_modulo, t5_cursos_t5_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    const t7_id = req.params.id;
    const { t7_modulo } = JSON.parse(req.body.data);
    if (!t7_modulo) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t7_modulos SET t7_modulo = ? WHERE t7_id = ?',
      [t7_modulo, t7_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteDataAulaVirtual = async (req, res) => {
  const t7_id = req.params.id;
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    if (!isNaN(parseFloat(t7_id)) && isFinite(t7_id)) {
      const results = await queryAsync('DELETE FROM t7_modulos WHERE t7_id = ?', [t7_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
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





