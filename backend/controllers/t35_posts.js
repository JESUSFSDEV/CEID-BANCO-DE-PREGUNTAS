const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t5_id = req.query.t5_id;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t35_posts 
        WHERE t5_cursos_t5_id = ${t5_id} AND t35_post LIKE '%${index}%'ORDER BY t35_id DESC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t35_posts 
        WHERE t5_cursos_t5_id = ${t5_id} ORDER BY t35_id DESC;`);
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
      query = `SELECT * FROM t35_posts 
      LEFT JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      LEFT JOIN t1_usuarios ON t1_usuarios_t1_id = t1_id
      WHERE t5_cursos_t5_id = ${t5_id} ORDER BY t35_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t35_posts 
      LEFT JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      LEFT JOIN t1_usuarios ON t1_usuarios_t1_id = t1_id
      WHERE t5_cursos_t5_id = ${t5_id} ORDER BY t35_id DESC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t35_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT * FROM t35_posts 
      LEFT JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      LEFT JOIN t1_usuarios ON t1_usuarios_t1_id = t1_id
      WHERE t35_id = ?`, [t35_id]);
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
      query = `SELECT * FROM t35_posts 
      LEFT JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      LEFT JOIN t1_usuarios ON t1_usuarios_t1_id = t1_id
      WHERE t5_cursos_t5_id = ${t5_id} AND t35_post LIKE '%${req.query.index}%' ORDER BY t35_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t35_posts 
      LEFT JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      LEFT JOIN t1_usuarios ON t1_usuarios_t1_id = t1_id
      WHERE t5_cursos_t5_id = ${t5_id} AND t35_post LIKE '%${index}%' ORDER BY t35_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }
    
    const { t35_post, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (t35_post==null || t35_post.trim()=='' || !t5_cursos_t5_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    const results = await queryAsync(
      'INSERT INTO t35_posts (t35_post, t35_fecha, t5_cursos_t5_id, t6_mentores_t6_id, t1_usuarios_t1_id) VALUES (?, NOW(), ?, ?, ?)',
      [t35_post, t5_cursos_t5_id, req.t6_id || null, req.t1_id || null]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t35_id = req.params.id;

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    const { t35_post, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (t35_post==null || t35_post.trim()=='' || !t5_cursos_t5_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    const results = await queryAsync(
      'UPDATE t35_posts SET t35_post = ?, t35_fecha = NOW() WHERE t35_id = ?',
      [t35_post, t35_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t35_id = req.params.id;
  try {
    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    if (!isNaN(parseFloat(t35_id)) && isFinite(t35_id)) {
      const results = await queryAsync('DELETE FROM t35_posts WHERE t35_id = ?', [t35_id]);
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
