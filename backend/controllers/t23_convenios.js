const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t23_convenios WHERE t23_institucion LIKE '%${index}%'ORDER BY t23_id DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t23_convenios;');
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
      query = `SELECT * FROM t23_convenios ORDER BY t23_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t23_convenios ORDER BY t23_id DESC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t23_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t23_convenios WHERE t23_id = ?', [t23_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t23_convenios WHERE t23_institucion LIKE '%${req.query.index}%' ORDER BY t23_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t23_convenios WHERE t23_institucion LIKE '%${index}%' ORDER BY t23_id DESC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t23_institucion } = JSON.parse(req.body.data);
    if (!t23_institucion) {
      throw new Error("Revise los campos obligatorios.");
    }

    // Verificar si el archivo fue subido
    let t23_url = null;
    if (req.file) {
      t23_url = req.file.filename; // Obtener el nombre del archivo subido
    }

    const results = await queryAsync(
      'INSERT INTO t23_convenios (t23_institucion, t23_url) VALUES (?, ?)',
      [t23_institucion, t23_url]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t23_id = req.params.id;
    const { t23_institucion } = JSON.parse(req.body.data);
    if (!t23_institucion ) {
      throw new Error("Revise los campos obligatorios.");
    }

    var results;
    // Verificar si el archivo fue subido
    let t23_url = null;
    if (req.file) {
      const results0 = await queryAsync(`SELECT * FROM t23_convenios WHERE t23_id = ?`, [t23_id]);
      if(results0[0].t23_url){
        const filePath = path.join(__dirname, '../uploads/convenios', results0[0].t23_url);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      
      if(req.file.originalname==="delete.fdc"){
        const folderPath = path.join(__dirname, '../uploads/convenios');
        fs.readdir(folderPath, (err, files) => {
          const filesToDelete = files.filter(file => path.extname(file).toLowerCase() === ".fdc");
          filesToDelete.forEach(file => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                //console.error(`Error al eliminar el archivo ${file}:`, err);
              } else {
                //console.log(`Archivo ${file} eliminado correctamente.`);
              }
            });
          });
        });
        results = await queryAsync(
          'UPDATE t23_convenios SET t23_institucion = ?, t23_url = NULL WHERE t23_id = ?',
          [t23_institucion, t23_id]
        );
      }else{
        t23_url = req.file.filename; // Obtener el nombre del archivo subido
        results = await queryAsync(
          'UPDATE t23_convenios SET t23_institucion = ?, t23_url = ? WHERE t23_id = ?',
          [t23_institucion, t23_url, t23_id]
        );
      }
      
    }else{
      results = await queryAsync(
        'UPDATE t23_convenios SET t23_institucion = ? WHERE t23_id = ?',
        [t23_institucion, t23_id]
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t23_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t23_id)) && isFinite(t23_id)) {
      const results0 = await queryAsync(`SELECT * FROM t23_convenios WHERE t23_id = ?`, [t23_id]);
      if(results0[0].t23_url){
        const filePath = path.join(__dirname, '../uploads/convenios', results0[0].t23_url);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              throw err;
            } 
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      const results = await queryAsync('DELETE FROM t23_convenios WHERE t23_id = ?', [t23_id]);
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