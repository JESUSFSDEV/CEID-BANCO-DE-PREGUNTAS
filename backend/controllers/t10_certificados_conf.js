const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    console.log(index)
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id ORDER BY t10_id DESC;`);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id;');
    }

    var pages = 0;
    if (results[0].filas > 0) {
      pages = Math.ceil(results[0].filas / pages_size);
    }

    var json_resp = [];
    if (pages == 0) {
      json_resp.push(
        {
          'pagina': 1,
          'size': 0,
          'offset': 0,
          'rows': results[0].filas
        }
      );
    } else {
      for (let i = 0; i < pages; i++) {
        let size;
        if (i + 1 == pages && results[0].filas % pages_size != 0) {
          size = results[0].filas % pages_size;
        } else {
          size = pages_size;
        }
        json_resp.push(
          {
            'pagina': i + 1,
            'size': size,
            'offset': i * pages_size,
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
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id ORDER BY t10_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT * FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id ORDER BY t10_id DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t10_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t10_id = ?', [t10_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t5_curso LIKE '%${req.query.index}%' ORDER BY t10_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t10_certificados_conf INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t5_curso LIKE '%${req.query.index}%' ORDER BY t10_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t10_estado, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (t10_estado==null || !t5_cursos_t5_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    // Verificar si el archivo fue subido
    let t10_img = null;
    let t10_imgrev = null;
    if (req.files.file_port) {
      t10_img = req.files['file_port'][0].filename; // Obtener el nombre del archivo subido
    }
    if (req.files.file_rev) {
      t10_imgrev = req.files['file_rev'][0].filename; // Obtener el nombre del archivo subido
    }
    const results = await queryAsync(
      'INSERT INTO t10_certificados_conf (t10_img, t10_imgrev, t10_estado, t5_cursos_t5_id) VALUES ( ?, ?, ?, ?)',
      [t10_img, t10_imgrev, t10_estado, t5_cursos_t5_id]
    );



    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    console.log(req.files)

    const t10_id = req.params.id;
    const { t10_estado, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (t10_estado==null || t5_cursos_t5_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    var results;
    // Verificar si el archivo fue subido
    let t10_img = null;
    if (req.files.file_port) {
      const results0 = await queryAsync(`SELECT * FROM t10_certificados_conf WHERE t10_id = ?`, [t10_id]);
      if(results0[0].t10_img){
        const filePath = path.join(__dirname, '../uploads/certificados-conf', results0[0].t10_img);
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

      if(req.files['file_port'][0].originalname==="delete.fdc"){
        const folderPath = path.join(__dirname, '../uploads/certificados-conf');
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
          'UPDATE t10_certificados_conf SET t10_img = NULL, t10_estado = ?, t5_cursos_t5_id = ? WHERE t10_id = ?',
          [t10_estado, t5_cursos_t5_id, t10_id]
        );
      }else{
        //console.log(req.files['file_port'][0])
        t10_img = req.files['file_port'][0].filename; // Obtener el nombre del archivo subido
        results = await queryAsync(
          'UPDATE t10_certificados_conf SET t10_img = ?, t10_estado = ?, t5_cursos_t5_id = ? WHERE t10_id = ?',
          [t10_img, t10_estado, t5_cursos_t5_id, t10_id]
        );
      }
      
    }else{
      results = await queryAsync(
        'UPDATE t10_certificados_conf SET t10_estado = ?, t5_cursos_t5_id = ? WHERE t10_id = ?',
        [t10_estado, t5_cursos_t5_id, t10_id]
      );
    }   

    let t10_imgrev = null;
    if (req.files.file_rev) {
      const results0 = await queryAsync(`SELECT * FROM t10_certificados_conf WHERE t10_id = ?`, [t10_id]);
      if(results0[0].t10_imgrev){
        const filePath = path.join(__dirname, '../uploads/certificados-conf', results0[0].t10_imgrev);
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
      

      if(req.files['file_rev'][0].originalname==="delete.fdc"){
        const folderPath = path.join(__dirname, '../uploads/certificados-conf');
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
          'UPDATE t10_certificados_conf SET t10_imgrev = NULL, t10_estado = ?, t5_cursos_t5_id = ? WHERE t10_id = ?',
          [t10_estado, t5_cursos_t5_id, t10_id]
        );
      }else{
        //console.log(req.files['file_port'][0])
        t10_imgrev = req.files['file_rev'][0].filename; // Obtener el nombre del archivo subido
        results = await queryAsync(
          'UPDATE t10_certificados_conf SET t10_imgrev = ?, t10_estado = ?, t5_cursos_t5_id = ? WHERE t10_id = ?',
          [t10_imgrev, t10_estado, t5_cursos_t5_id, t10_id]
        );
      }

      
    }else{
      results = await queryAsync(
        'UPDATE t10_certificados_conf SET t10_estado = ?, t5_cursos_t5_id = ? WHERE t10_id = ?',
        [t10_estado, t5_cursos_t5_id, t10_id]
      );
    }   
    
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t10_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t10_id)) && isFinite(t10_id)) {
      const results0 = await queryAsync(`SELECT * FROM t10_certificados_conf WHERE t10_id = ?`, [t10_id]);
      if(results0[0].t10_img){
        const filePath = path.join(__dirname, '../uploads/certificados-conf', results0[0].t10_img);
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
      if(results0[0].t10_imgrev){
        const filePath2 = path.join(__dirname, '../uploads/certificados-conf', results0[0].t10_imgrev);
        if (fs.existsSync(filePath2)) {
          // Eliminar el archivo
          fs.unlink(filePath2, (err) => {
            if (err) {
              throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      
      const results = await queryAsync('DELETE FROM t10_certificados_conf WHERE t10_id = ?;', [t10_id]);
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




