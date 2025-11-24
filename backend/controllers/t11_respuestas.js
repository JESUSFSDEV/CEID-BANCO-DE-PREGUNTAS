const { json } = require('express');
const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t10_id = (req.query.t10_id) || null;
    
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t11_respuestas WHERE t11_respuesta LIKE '%${index}%' AND t10_preguntas_t10_id = ? ORDER BY t10_id DESC;`, [t10_id]);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t11_respuestas WHERE t10_preguntas_t10_id = ?;', [t10_id]);
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
    const t11_respuesta = (req.query.index) || null;
    const t10_id = (req.query.t10_id) || null;
  
    let query = 'SELECT * FROM t11_respuestas WHERE t10_preguntas_t10_id = ?';
    let params = [t10_id];
    
    // Aplicar filtros si existen
    if (t11_respuesta && t11_respuesta.trim() !== '') {
      query += ' AND (t11_respuesta LIKE ?)';
      const searchTerm = `%${t11_respuesta.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t10_id DESC';

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
  const t11_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t11_respuestas WHERE t11_id = ?', [t11_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    const { t11_respuestas, t11_estado, t10_preguntas_t10_id } = JSON.parse(req.body.data);
    if (!t11_respuestas || t11_estado==null|| t10_preguntas_t10_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t11_respuestas (t11_respuestas, t11_estado, t10_preguntas_t10_id) VALUES (?, 1, ?)',
      [t11_respuestas, t10_preguntas_t10_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t11_id = req.params.id;
    const { t11_respuestas, t11_estado, t10_preguntas_t10_id } = JSON.parse(req.body.data);
    if (!t11_respuestas || t11_estado==null|| t10_preguntas_t10_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t11_respuestas SET t11_respuestas = ?, t11_estado = ?, t10_preguntas_t10_id = ? WHERE t11_id = ?',
      [t11_respuestas, t11_estado, t10_preguntas_t10_id, t11_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t11_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t11_id)) && isFinite(t11_id)) {
      const results = await queryAsync('DELETE FROM t11_respuestas WHERE t11_id = ?', [t11_id]);
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