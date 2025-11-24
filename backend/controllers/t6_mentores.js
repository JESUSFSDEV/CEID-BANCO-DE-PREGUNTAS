const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t6_mentores WHERE t6_mentor LIKE '%${index}%' ORDER BY t6_id DESC;`);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t6_mentores;');
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
      query = `SELECT * FROM t6_mentores ORDER BY t6_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT * FROM t6_mentores ORDER BY t6_id DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t6_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t6_mentores WHERE t6_id = ?', [t6_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t6_mentores WHERE t6_mentor LIKE '%${req.query.index}%' ORDER BY t6_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t6_mentores WHERE t6_mentor LIKE '%${req.query.index}%' ORDER BY t6_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo, t6_pass, t6_intranet } = JSON.parse(req.body.data);
    if (!t6_mentor || !t6_profesion || !t6_correo || !t6_pass || t6_intranet==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t6_mentores (t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_fecha, t6_correo, t6_pass, t6_intranet) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)',
      [t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo, t6_pass, t6_intranet]
    );
    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t6_id = req.params.id;
    const { t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo, t6_pass, t6_intranet } = JSON.parse(req.body.data);
    if (!t6_mentor || !t6_profesion || !t6_correo || !t6_pass || t6_intranet==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t6_mentores SET t6_mentor = ?, t6_profesion = ?, t6_celular = ?, t6_descripcion = ?, t6_correo = ?, t6_pass = ?, t6_intranet = ? WHERE t6_id = ?',
      [t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo, t6_pass, t6_intranet, t6_id]
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
      const results = await queryAsync('DELETE FROM t6_mentores WHERE t6_id = ?', [t6_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};



/* INTRNAET DOCENTE */

exports.getDataIntranetDocente = async (req, res) => {
  const t6_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t6_mentores WHERE t6_id = ?', [req.t6_id]);
    results[0].t6_pass = ""; // Exclude password from response
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.putDataIntranetDocente = async (req, res) => {
  try {
    const { t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo } = JSON.parse(req.body.data);
    if (!t6_mentor || !t6_profesion || !t6_correo) {
      throw new Error("Revise los campos obligatorios.");
    }

    const results0 = await queryAsync(`SELECT * FROM t6_mentores WHERE t6_id = ?;`, [req.t6_id]);
    if(results0[0].t6_foto){
      const filePath = path.join(__dirname, '../uploads/mentores', results0[0].t6_foto);
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

    let t6_foto = null;
    if (req.file) {
      t6_foto = req.file.filename; // Obtener el nombre del archivo subido
      results = await queryAsync(
        'UPDATE t6_mentores SET t6_mentor = ?, t6_profesion = ?, t6_celular = ?, t6_descripcion = ?, t6_correo = ?, t6_foto = ? WHERE t6_id = ?',
        [t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo, t6_foto, req.t6_id]
      );
    }else{
      results = await queryAsync(
        'UPDATE t6_mentores SET t6_mentor = ?, t6_profesion = ?, t6_celular = ?, t6_descripcion = ?, t6_correo = ?, t6_foto = NULL WHERE t6_id = ?',
        [t6_mentor, t6_profesion, t6_celular, t6_descripcion, t6_correo, req.t6_id]
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.putDataPassIntranetDocente = async (req, res) => {
  try {
    const { t6_pass, t6_pass2 } = JSON.parse(req.body.data);
    if (t6_pass == null || t6_pass2 == null) {
      throw new Error("Revise los campos obligatorios.");
    }

    if (t6_pass != t6_pass2) {
      throw new Error("Las contraseñas no coinciden.");
    }

    const results = await queryAsync(
      'UPDATE t6_mentores SET t6_pass = ? WHERE t6_id = ?',
      [t6_pass, req.t6_id]
    );

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
