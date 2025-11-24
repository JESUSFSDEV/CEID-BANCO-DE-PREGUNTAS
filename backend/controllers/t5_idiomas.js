const { json } = require('express');
const { db } = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t5_idiomas WHERE t5_idioma LIKE '%${index}%'ORDER BY t5_id DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t5_idiomas;');
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
    const t5_idioma = (req.query.index) || null;
  
    let query = 'SELECT * FROM t5_idiomas WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (t5_idioma && t5_idioma.trim() !== '') {
      query += ' AND (t5_idioma LIKE ?)';
      const searchTerm = `%${t5_idioma.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t5_id DESC';

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
  const t5_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t5_idiomas WHERE t5_id = ?', [t5_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.postData = async (req, res) => {
  try {
    const { t5_idioma, t5_estado } = JSON.parse(req.body.data);
    if (!t5_idioma || t5_estado==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t5_idiomas (t5_idioma, t5_estado) VALUES (?, ?)',
      [t5_idioma, t5_estado]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t5_id = req.params.id;
    const { t5_idioma, t5_estado } = JSON.parse(req.body.data);
    if (!t5_idioma || t5_estado==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t5_idiomas SET t5_idioma = ?, t5_estado = ? WHERE t5_id = ?',
      [t5_idioma, t5_estado, t5_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t5_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t5_id)) && isFinite(t5_id)) {
      const results = await queryAsync('DELETE FROM t5_idiomas WHERE t5_id = ?', [t5_id]);
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