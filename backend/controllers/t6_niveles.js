const { json } = require('express');
const { db } = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t5_id = (req.query.t5_id) || null;
    
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t6_niveles WHERE t6_nivel LIKE '%${index}%' AND t5_idiomas_t5_id = ? ORDER BY t6_id DESC;`, [t5_id]);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t6_niveles WHERE t5_idiomas_t5_id = ?;', [t5_id]);
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
    const t6_nivel = (req.query.index) || null;
    const t5_id = (req.query.t5_id) || null;
  
    let query = 'SELECT * FROM t6_niveles WHERE t5_idiomas_t5_id = ?';
    let params = [t5_id];
    
    // Aplicar filtros si existen
    if (t6_nivel && t6_nivel.trim() !== '') {
      query += ' AND (t6_nivel LIKE ?)';
      const searchTerm = `%${t6_nivel.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t6_id DESC';

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
  const t6_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t6_niveles WHERE t6_id = ?', [t6_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    const { t6_nivel, t5_id } = JSON.parse(req.body.data);
    if (!t6_nivel || t5_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t6_niveles (t6_nivel, t5_idiomas_t5_id) VALUES (?, ?)',
      [t6_nivel, t5_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t6_id = req.params.id;
    const { t6_nivel, t5_id } = JSON.parse(req.body.data);
    if (!t6_nivel || t5_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t6_niveles SET t6_nivel = ?, t5_idiomas_t5_id = ? WHERE t6_id = ?',
      [t6_nivel, t5_id, t6_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t6_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t6_id)) && isFinite(t6_id)) {
      const results = await queryAsync('DELETE FROM t6_niveles WHERE t6_id = ?', [t6_id]);
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