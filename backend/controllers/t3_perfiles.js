const db = require('../config/db');
const fs = require('fs');
const path = require('path');



exports.getAllData = async (req, res) => {
  try {
    const t2_id = req.t2_id;
    const results = await queryAsync(`SELECT * FROM t3_perfiles WHERE t2_alumnos_t2_id = ${t2_id};`);
    return res.status(200).json(results[0]);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t3_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t3_perfiles WHERE t3_id = ?', [t3_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const t2_id = req.t2_id;
    const { t2_pass_old, t2_pass, t2_pass_repeat } = JSON.parse(req.body.data);
    if (!t2_pass_old || !t2_pass || t2_pass_repeat==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    var results;

    const results0 = await queryAsync(`SELECT t2_pass FROM t2_alumnos WHERE t2_id = ${t2_id};`);
    if(results0[0].t2_pass==t2_pass_old){
      if(t2_pass==t2_pass_repeat){
        results = await queryAsync(
          'UPDATE t2_alumnos SET t2_pass = ? WHERE t2_id = ?',
          [t2_pass, t2_id]
        );
      }else{
        throw new Error("Las contraseñas no coinciden.");
      }
    }else{
      throw new Error("Su contraseña original no es la correcta.");
    }
    
    
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t3_id = req.params.id;
    const { t3_nombres, t3_apellidos, t3_pais, t3_celular, t21_carreras_t21_id } = JSON.parse(req.body.data);
    if (t3_nombres==null || t3_apellidos==null || t3_celular==null || t3_pais==null || t21_carreras_t21_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t3_perfiles SET t3_nombres = UPPER(?), t3_apellidos = UPPER(?), t3_pais = ?, t3_celular = ?, t21_carreras_t21_id = ? WHERE t3_id = ?',
      [t3_nombres, t3_apellidos, t3_pais, t3_celular, t21_carreras_t21_id, t3_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};


exports.postDataFoto = async (req, res) => {
  try {
    const t2_id = req.t2_id;
    if (t2_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    
    console.log(req.file)
    var results;
    // Verificar si el archivo fue subido
    let t3_foto = null;
    if (req.file) {
      const results0 = await queryAsync(`SELECT * FROM t3_perfiles WHERE t2_alumnos_t2_id = ?;`, [t2_id]);
      if(results0[0].t3_foto){
        const filePath = path.join(__dirname, '../uploads/certificados-conf', results0[0].t3_foto);
        console.log(filePath)
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
      
      t3_foto = req.file.filename; // Obtener el nombre del archivo subido
      results = await queryAsync(
        'UPDATE t3_perfiles SET t3_foto = ? WHERE t2_alumnos_t2_id = ?;',
        [t3_foto, t2_id]
      );
    }else{

      results = await queryAsync(
        'UPDATE t3_perfiles SET t3_foto = NULL WHERE t2_alumnos_t2_id = ?;',
        [t2_id]
      );
    }
    
    
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
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





