const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t10_id = req.query.t10_id;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t20_labels WHERE t10_certificados_conf_t10_id = ${t10_id} AND t20_tipo LIKE '%${index}%'ORDER BY t20_id ASC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t20_labels WHERE t10_certificados_conf_t10_id = ${t10_id} ORDER BY t20_id ASC;`);
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
    const t10_id = req.query.t10_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t20_labels WHERE t10_certificados_conf_t10_id = ${t10_id} ORDER BY t20_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t20_labels WHERE t10_certificados_conf_t10_id = ${t10_id} ORDER BY t20_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t20_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t20_labels WHERE t20_id = ?', [t20_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const t10_id = req.query.t10_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t20_labels WHERE t10_certificados_conf_t10_id = ${t10_id} AND t20_tipo LIKE '%${req.query.index}%' ORDER BY t20_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t20_labels WHERE t10_certificados_conf_t10_id = ${t10_id} AND t20_tipo LIKE '%${index}%' ORDER BY t20_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t20_hoja, t20_tipo, t20_text, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t10_certificados_conf_t10_id } = JSON.parse(req.body.data);
    if (t20_hoja==null || !t20_tipo || t20_x==null || t20_y==null || !t10_certificados_conf_t10_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    var results;
    // Verificar si el archivo fue subido
    let t20_img = null;
    if (req.file) {
      t20_img = req.file.filename; // Obtener el nombre del archivo subido
      results = await queryAsync(
        'INSERT INTO t20_labels (t20_hoja, t20_tipo, t20_text, t20_img, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t10_certificados_conf_t10_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t20_hoja, t20_tipo, t20_text, t20_img, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t10_certificados_conf_t10_id]
      );
    }else{
      results = await queryAsync(
        'INSERT INTO t20_labels (t20_hoja, t20_tipo, t20_text, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t10_certificados_conf_t10_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t20_hoja, t20_tipo, t20_text, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t10_certificados_conf_t10_id]
      );
    }   

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t20_id = req.params.id;
    const { t20_hoja, t20_tipo, t20_text, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y } = JSON.parse(req.body.data);
    if (t20_hoja==null || !t20_tipo || t20_x==null || t20_y==null) {
      throw new Error("Revise los campos obligatorios.");
    }


    var results;
    // Verificar si el archivo fue subido
    let t20_img = null;
    if (req.file) {
      const results0 = await queryAsync(`SELECT * FROM t20_labels WHERE t20_id = ?`, [t20_id]);
      if(results0[0].t20_img){
        const filePath = path.join(__dirname, '../uploads/labels', results0[0].t20_img);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              //throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      t20_img = req.file.filename; // Obtener el nombre del archivo subido
      results = await queryAsync(
        'UPDATE t20_labels SET t20_hoja = ?, t20_tipo = ?, t20_text = ?, t20_img = ?, t20_color = ?, t20_fontsize = ?, t20_w = ?, t20_h = ?, t20_x = ?, t20_y = ? WHERE t20_id = ?',
        [t20_hoja, t20_tipo, t20_text, t20_img, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t20_id]
      );
    }else{
      results = await queryAsync(
        'UPDATE t20_labels SET t20_hoja = ?, t20_tipo = ?, t20_text = ?, t20_color = ?, t20_fontsize = ?, t20_w = ?, t20_h = ?, t20_x = ?, t20_y = ? WHERE t20_id = ?',
        [t20_hoja, t20_tipo, t20_text, t20_color, t20_fontsize, t20_w, t20_h, t20_x, t20_y, t20_id]
      );
    }   

    return res.status(200).json(results);

  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t20_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t20_id)) && isFinite(t20_id)) {
      const results0 = await queryAsync(`SELECT * FROM t20_labels WHERE t20_id = ?`, [t20_id]);
      if(results0[0].t20_img){
        const filePath = path.join(__dirname, '../uploads/labels', results0[0].t20_img);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              //throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      const results = await queryAsync('DELETE FROM t20_labels WHERE t20_id = ?', [t20_id]);
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





