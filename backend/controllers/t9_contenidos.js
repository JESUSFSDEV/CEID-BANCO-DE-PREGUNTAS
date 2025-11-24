const { json } = require('express');
const { db } = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t8_id = (req.query.t8_id) || null;
    
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t9_contenidos WHERE t9_contenido LIKE '%${index}%' AND t8_unidades_t8_id = ? ORDER BY t8_id DESC;`, [t8_id]);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t9_contenidos WHERE t8_unidades_t8_id = ?;', [t8_id]);
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
    const t9_contenido = (req.query.index) || null;
    const t8_id = (req.query.t8_id) || null;
  
    let query = 'SELECT * FROM t9_contenidos WHERE t8_unidades_t8_id = ?';
    let params = [t8_id];
    
    // Aplicar filtros si existen
    if (t9_contenido && t9_contenido.trim() !== '') {
      query += ' AND (t9_contenido LIKE ?)';
      const searchTerm = `%${t9_contenido.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t8_id DESC';

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
  const t9_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t9_contenidos WHERE t9_id = ?', [t9_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    const { t9_contenido, t8_unidades_t8_id } = JSON.parse(req.body.data);
    if (!t9_contenido || t8_unidades_t8_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t9_contenidos (t9_contenido, t8_unidades_t8_id) VALUES (?, ?)',
      [t9_contenido, t8_unidades_t8_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t9_id = req.params.id;
    const { t9_contenido, t8_unidades_t8_id } = JSON.parse(req.body.data);
    if (!t9_contenido || t8_unidades_t8_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t9_contenidos SET t9_contenido = ?, t8_unidades_t8_id = ? WHERE t9_id = ?',
      [t9_contenido, t8_unidades_t8_id, t9_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t9_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t9_id)) && isFinite(t9_id)) {
      const results = await queryAsync('DELETE FROM t9_contenidos WHERE t9_id = ?', [t9_id]);
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