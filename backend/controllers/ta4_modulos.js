const { json } = require('express');
const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM ta4_modulos WHERE t2_roles_t2_id = ? ORDER BY ta4_id DESC;`, [req.query.t2_id]);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM ta4_modulos WHERE t2_roles_t2_id = ?;', [req.query.t2_id]);
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

exports.getDataFilter = async (req, res) => {
  try {
    const size = parseInt(req.query.size);
    const offset = parseInt(req.query.offset);
    //const t3_estado = (req.query.index) || null;
    const t2_id = (req.query.t2_id) || null;
  
    let query = 'SELECT * FROM ta4_modulos WHERE t2_roles_t2_id = ?';
    let params = [t2_id];
    
    // Aplicar filtros si existen
    /*
    if (t3_estado && t3_estado.trim() !== '') {
      query += ' AND (t3_estado LIKE ?)';
      const searchTerm = `%${t3_estado.trim()}%`;
      params.push(searchTerm);
    }
    */

    query += ' ORDER BY ta4_id DESC';

    if(size!=null && offset!=null) {
      query += ' LIMIT ? OFFSET ?';
      params.push(size, offset);
    }

    const results = await queryAsync(query, params);
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error en getDataFilter:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const ta4_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM ta4_modulos WHERE ta4_id = ?', [ta4_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    const { ta4_lectura, ta4_crear, ta4_modificar, ta4_eliminar, t4_modulos_t4_id, t2_roles_t2_id } = JSON.parse(req.body.data);
    if (ta4_lectura==null || ta4_crear==null || ta4_modificar==null || ta4_eliminar==null || !t4_modulos_t4_id || !t2_roles_t2_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO ta4_modulos (ta4_lectura, ta4_crear, ta4_modificar, ta4_eliminar, t4_modulos_t4_id, t2_roles_t2_id) VALUES (?, ?, ?, ?, ?, ?)',
      [ta4_lectura, ta4_crear, ta4_modificar, ta4_eliminar, t4_modulos_t4_id, t2_roles_t2_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const ta4_id = req.params.id;
    const { ta4_lectura, ta4_crear, ta4_modificar, ta4_eliminar, t4_modulos_t4_id, t2_roles_t2_id } = JSON.parse(req.body.data);
    if (ta4_lectura==null || ta4_crear==null || ta4_modificar==null || ta4_eliminar==null || !t4_modulos_t4_id || !t2_roles_t2_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE ta4_modulos SET ta4_lectura = ?, ta4_crear = ?, ta4_modificar = ?, ta4_eliminar = ?, t4_modulos_t4_id = ?, t2_roles_t2_id = ? WHERE ta4_id = ?',
      [ta4_lectura, ta4_crear, ta4_modificar, ta4_eliminar, t4_modulos_t4_id, t2_roles_t2_id, ta4_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const ta4_id = req.params.id;
  try {
    if (!isNaN(parseFloat(ta4_id)) && isFinite(ta4_id)) {
      const results = await queryAsync('DELETE FROM ta4_modulos WHERE ta4_id = ?', [ta4_id]);
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