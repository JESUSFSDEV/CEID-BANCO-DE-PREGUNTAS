const { json } = require('express');
const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t9_id = (req.query.t9_id) || null;
    
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t10_preguntas WHERE t10_pregunta LIKE '%${index}%' AND t9_contenidos_t9_id = ? ORDER BY t9_id DESC;`, [t9_id]);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t10_preguntas WHERE t9_contenidos_t9_id = ?;', [t9_id]);
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
    const t10_pregunta = (req.query.index) || null;
    const t9_id = (req.query.t9_id) || null;
  
    let query = 'SELECT * FROM t10_preguntas WHERE t9_contenidos_t9_id = ?';
    let params = [t9_id];
    
    // Aplicar filtros si existen
    if (t10_pregunta && t10_pregunta.trim() !== '') {
      query += ' AND (t10_pregunta LIKE ?)';
      const searchTerm = `%${t10_pregunta.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t9_id DESC';

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
    const results = await queryAsync('SELECT * FROM t10_preguntas WHERE t9_id = ?', [t9_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    const { t10_pregunta, t9_contenidos_t9_id } = JSON.parse(req.body.data);
    if (!t10_pregunta || t9_contenidos_t9_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t10_preguntas (t10_pregunta, t10_estado, t9_contenidos_t9_id) VALUES (?, 1,?)',
      [t10_pregunta, t9_contenidos_t9_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t10_id = req.params.id;
    const { t10_pregunta, t9_contenidos_t9_id } = JSON.parse(req.body.data);
    if (!t10_pregunta || t9_contenidos_t9_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t10_preguntas SET t10_pregunta = ?, t9_contenidos_t9_id = ? WHERE t10_id = ?',
      [t10_pregunta, t9_contenidos_t9_id, t10_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t10_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t10_id)) && isFinite(t10_id)) {
      const results = await queryAsync('DELETE FROM t10_preguntas WHERE t10_id = ?', [t10_id]);
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