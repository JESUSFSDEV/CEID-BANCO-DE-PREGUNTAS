const db = require('../config/db');


exports.getPages = async (req, res) => {
  try {
    const pageSize = Number(req.query.size);
    
    const results = await queryAsync(`SELECT COUNT(*) AS filas FROM t24_favoritos WHERE t2_alumnos_t2_id = ?;`, [req.t2_id]);
    
    const totalRows = results[0].filas;
    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    
    const pagesArray = [];
    
    for (let i = 0; i < totalPages; i++) {
      let size;
      if (i + 1 === totalPages && totalRows % pageSize !== 0) {
        size = totalRows % pageSize;
      } else {
        size = pageSize;
      }
      
      pagesArray.push({
        pagina: i + 1,
        size: size,
        offset: i * pageSize,
        rows: totalRows
      });
    }
    
    return res.status(200).json(pagesArray);
  } catch (error) {
    console.error('Error en getPages:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT A.*, B.*, C.*, D.*, E.t25_id
      FROM t24_favoritos A
      LEFT JOIN t5_cursos B ON A.t5_cursos_t5_id = B.t5_id
      LEFT JOIN t28_proyectos C ON A.t28_proyectos_t28_id = C.t28_id
      LEFT JOIN t6_mentores D ON B.t6_mentores_t6_id = D.t6_id
      LEFT JOIN t25_carritos E ON (E.t5_cursos_t5_id = B.t5_id OR E.t28_proyectos_t28_id = C.t28_id) AND E.t2_alumnos_t2_id = ${req.t2_id}
      WHERE A.t2_alumnos_t2_id = ${req.t2_id}
      ORDER BY t6_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT A.*, B.*, C.*, D.*, E.t25_id
      FROM t24_favoritos A
      LEFT JOIN t5_cursos B ON A.t5_cursos_t5_id = B.t5_id
      LEFT JOIN t28_proyectos C ON A.t28_proyectos_t28_id = C.t28_id
      LEFT JOIN t6_mentores D ON B.t6_mentores_t6_id = D.t6_id
      LEFT JOIN t25_carritos E ON (E.t5_cursos_t5_id = B.t5_id OR E.t28_proyectos_t28_id = C.t28_id) AND E.t2_alumnos_t2_id = ${req.t2_id}
      WHERE A.t2_alumnos_t2_id = ${req.t2_id};`;
    }

    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.getData = async (req, res) => {
  const t5_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT * FROM t24_favoritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`);
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
      const results0 = await queryAsync(`SELECT COUNT(*) AS carritos FROM t24_favoritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`);
      if(results0[0].carritos>0){
        results = await queryAsync(`DELETE FROM t24_favoritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_cursos_t5_id = ${t5_id};`);
      }else{
        results = await queryAsync('INSERT INTO t24_favoritos (t2_alumnos_t2_id, t5_cursos_t5_id) VALUES (?, ?)',[req.t2_id, t5_id]);
      }
    }else if (t28_id != null) {
      const results0 = await queryAsync(`SELECT COUNT(*) AS carritos FROM t24_favoritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyectos_t28_id = ${t28_id};`);
      if(results0[0].carritos>0){
        results = await queryAsync(`DELETE FROM t24_favoritos WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyectos_t28_id = ${t28_id};`);
      }else{
        results = await queryAsync('INSERT INTO t24_favoritos (t2_alumnos_t2_id, t28_proyectos_t28_id) VALUES (?, ?)',[req.t2_id, t28_id]);
      }
    }
    
    return res.status(200).json(results);
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
