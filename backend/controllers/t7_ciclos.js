const { json } = require('express');
const { db } = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t6_id = (req.query.t6_id) || null;
    
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t7_ciclos WHERE t7_ciclo LIKE '%${index}%' AND t6_niveles_t6_id = ? ORDER BY t7_id DESC;`, [t6_id]);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t7_ciclos WHERE t6_niveles_t6_id = ?;', [t6_id]);
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
    const t7_ciclo = (req.query.index) || null;
    const t6_id = (req.query.t6_id) || null;
  
    let query = 'SELECT * FROM t7_ciclos WHERE t6_niveles_t6_id = ?';
    let params = [t6_id];
    
    // Aplicar filtros si existen
    if (t7_ciclo && t7_ciclo.trim() !== '') {
      query += ' AND (t7_ciclo LIKE ?)';
      const searchTerm = `%${t7_ciclo.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t7_id DESC';

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
  const t7_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t7_ciclos WHERE t7_id = ?', [t7_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    console.log(req.body.data);
    const { t7_ciclo, t6_id } = JSON.parse(req.body.data);
    if (!t7_ciclo || t6_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t7_ciclos (t7_ciclo, t6_niveles_t6_id) VALUES (?, ?)',
      [t7_ciclo, t6_id]
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
    const { t7_ciclo, t6_id } = JSON.parse(req.body.data);
    if (!t7_ciclo || t6_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t7_ciclos SET t7_ciclo = ?, t6_niveles_t6_id = ? WHERE t7_id = ?',
      [t7_ciclo, t6_id, t7_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t7_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t7_id)) && isFinite(t7_id)) {
      const results = await queryAsync('DELETE FROM t7_ciclos WHERE t7_id = ?', [t7_id]);
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