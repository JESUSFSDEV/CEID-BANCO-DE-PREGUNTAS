const { json } = require('express');
const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t1_usuarios WHERE t1_nombres LIKE '%${index}%'ORDER BY t1_id DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t1_usuarios;');
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
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t1_usuarios ORDER BY t1_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t1_usuarios ORDER BY t1_id DESC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t1_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t1_usuarios WHERE t1_id = ?', [t1_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t1_usuarios WHERE t1_nombres LIKE '%${req.query.index}%' ORDER BY t1_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t1_usuarios WHERE t1_nombres LIKE '%${index}%' ORDER BY t1_id DESC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t1_documento, t1_privilegios, t1_cargo, t1_accesos, t1_email, t1_nombres, t1_user, t1_password, t1_estado } = JSON.parse(req.body.data);
    if (!t1_documento || !t1_privilegios || !t1_nombres || !t1_email || !t1_user || !t1_password || !t1_estado) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t1_usuarios (t1_documento, t1_privilegios, t1_cargo, t1_accesos, t1_email, t1_nombres, t1_user, t1_password, t1_estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [t1_documento, t1_privilegios, t1_cargo, t1_accesos, t1_email, t1_nombres, t1_user, t1_password, t1_estado]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t1_id = req.params.id;
    const { t1_documento, t1_privilegios, t1_cargo, t1_accesos, t1_email, t1_nombres, t1_user, t1_password, t1_estado } = JSON.parse(req.body.data);
    if (!t1_documento || !t1_privilegios || !t1_nombres || !t1_email || !t1_user || !t1_password || !t1_estado) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t1_usuarios SET t1_documento = ?, t1_privilegios = ?, t1_cargo = ?, t1_accesos = ?, t1_email = ?, t1_nombres = ?, t1_user = ?, t1_password = ?, t1_estado = ? WHERE t1_id = ?',
      [t1_documento, t1_privilegios, t1_cargo, t1_accesos, t1_email, t1_nombres, t1_user, t1_password, t1_estado, t1_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t1_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t1_id)) && isFinite(t1_id)) {
      const results = await queryAsync('DELETE FROM t1_usuarios WHERE t1_id = ?', [t1_id]);
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