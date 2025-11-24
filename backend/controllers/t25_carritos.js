const db = require('../config/db');


exports.getAllData = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t6_mentores ORDER BY t6_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT A.*, B.*, C.*, E.*, D.t24_id FROM t25_carritos A
      LEFT JOIN t5_cursos B ON A.t5_cursos_t5_id = B.t5_id 
      LEFT JOIN t28_proyectos C ON A.t28_proyectos_t28_id = C.t28_id
      LEFT JOIN t24_favoritos D ON (D.t5_cursos_t5_id = B.t5_id OR D.t28_proyectos_t28_id = C.t28_id) AND D.t2_alumnos_t2_id = ${req.t2_id}
      LEFT JOIN t6_mentores E ON B.t6_mentores_t6_id = E.t6_id 
      WHERE A.t2_alumnos_t2_id = ${req.t2_id};`;
    }

    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.getDataFilter = async (req, res) => {
  const t5_id = req.query.t5_id;    
  const t28_id = req.query.t28_id;
  try {
    let results;
    if(t5_id != null){
      results = await queryAsync(`SELECT * FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`); 
    }else if(t28_id != null){
      results = await queryAsync(`SELECT * FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyectos_t28_id = ${t28_id};`);
    }
    
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t5_id = req.params.id;    
  try {
    let results;
    results = await queryAsync(`SELECT * FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`); 
    
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {

    const { t5_id, t28_id } = JSON.parse(req.body.data);
    if (t5_id==null && t28_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }



    let results;
    if (t5_id != null) {
      const results1 = await queryAsync(`SELECT COUNT(*) AS existencia FROM t11_miscursos WHERE t5_cursos_t5_id = ${t5_id} AND t2_alumnos_t2_id = ${req.t2_id};`);
      if(results1[0].existencia>0){
        throw new Error("Ya posees este curso.");
      }
      const results0 = await queryAsync(`SELECT COUNT(*) AS carritos FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`);
      if(results0[0].carritos>0){
        results = await queryAsync(`DELETE FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`);
      }else{
        results = await queryAsync('INSERT INTO t25_carritos (t2_alumnos_t2_id, t5_cursos_t5_id, t25_unq) VALUES (?, ?, ?)',[req.t2_id, t5_id, req.t2_id + '_C_' + t5_id]);
      }
    }else if (t28_id != null) {
      const results0 = await queryAsync(`SELECT COUNT(*) AS carritos FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyectos_t28_id = ${t28_id};`);
      if(results0[0].carritos>0){
        results = await queryAsync(`DELETE FROM t25_carritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyectos_t28_id = ${t28_id};`);
      }else{
        results = await queryAsync('INSERT INTO t25_carritos (t2_alumnos_t2_id, t28_proyectos_t28_id, t25_unq) VALUES (?, ?, ?)',[req.t2_id, t28_id, req.t2_id + '_P_' + t28_id]);
      }
    }
    
    
    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};


exports.deleteData = async (req, res) => {
  const t25_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t25_id)) && isFinite(t25_id)) {
      const results = await queryAsync('DELETE FROM t25_carritos WHERE t25_id = ?', [t25_id]);
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
