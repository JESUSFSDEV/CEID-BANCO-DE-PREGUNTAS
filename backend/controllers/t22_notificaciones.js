const db = require('../config/db');

exports.getPaginar = async (req, res) => {
  try {
    const page_size = Number(req.query.size);
    const index = req.query.index;
    let results;
    if (index && index.trim() !== "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t22_notificaciones WHERE t22_notificacion LIKE ?`, [`%${index}%`]);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t22_notificaciones;');
    }

    let pages = 0;
    if (results[0].filas > 0) {
      pages = Math.ceil(results[0].filas / page_size);
    }

    let json_resp = [];
    if (pages === 0) {
      json_resp.push({
        'pagina': 1,
        'size': 0,
        'offset': 0,
        'rows': results[0].filas
      });
    } else {
      for (let i = 0; i < pages; i++) {
        let size;
        if (i + 1 === pages && results[0].filas % page_size !== 0) {
          size = results[0].filas % page_size;
        } else {
          size = page_size;
        }
        json_resp.push({
          'pagina': i + 1,
          'size': size,
          'offset': i * page_size,
          'rows': results[0].filas
        });
      }
    }

    return res.status(200).json(json_resp);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    let query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t22_notificaciones ORDER BY t22_id DESC LIMIT ? OFFSET ?;`;
      const results = await queryAsync(query, [Number(req.query.size), Number(req.query.offset)]);

      return res.status(200).json(results);
    } else {
      query = "SELECT * FROM t22_notificaciones ORDER BY t22_id DESC;";
      const results = await queryAsync(query);
      return res.status(200).json(results);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t22_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t22_notificaciones WHERE t22_id = ?', [t22_id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    const index = req.query.index || '';
    let query;
    let params = [`%${index}%`];
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t22_notificaciones WHERE t22_notificacion LIKE ? ORDER BY t22_id DESC LIMIT ? OFFSET ?;`;
      params.push(Number(req.query.size), Number(req.query.offset));
    } else {
      query = `SELECT * FROM t22_notificaciones WHERE t22_notificacion LIKE ? ORDER BY t22_id DESC;`;
    }
    const results = await queryAsync(query, params);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t22_notificacion, t22_fecha, t22_prioridad, t22_estado } = JSON.parse(req.body.data);

    if (!t22_notificacion || !t22_fecha || !t22_prioridad || !t22_estado) {
      throw new Error("Todos los campos son obligatorios.");
    }

    const results = await queryAsync(
      'INSERT INTO t22_notificaciones (t22_notificacion, t22_fecha, t22_prioridad, t22_estado) VALUES (?, ?, ?, ?)',
      [t22_notificacion, t22_fecha, t22_prioridad, t22_estado]
    );
    return res.status(201).json({ message: 'Notificación creada correctamente', insertId: results.insertId });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({ error: error.message });
  }
};

exports.putData = async (req, res) => {
  try {
    const t22_id = req.params.id;
    const { t22_notificacion, t22_fecha, t22_prioridad, t22_estado } = JSON.parse(req.body.data);

    if (!t22_notificacion || !t22_fecha || !t22_prioridad || !t22_estado) {
      throw new Error("Todos los campos son obligatorios.");
    }

    const results = await queryAsync(
      'UPDATE t22_notificaciones SET t22_notificacion = ?, t22_fecha = ?, t22_prioridad = ?, t22_estado = ? WHERE t22_id = ?',
      [t22_notificacion, t22_fecha, t22_prioridad, t22_estado, t22_id]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    return res.status(200).json({ message: 'Notificación actualizada correctamente' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteData = async (req, res) => {
  const t22_id = req.params.id;
  try {
    if (!isNaN(parseInt(t22_id)) && isFinite(t22_id)) {
      const results = await queryAsync('DELETE FROM t22_notificaciones WHERE t22_id = ?', [t22_id]);
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Notificación no encontrada' });
      }
      return res.status(200).json(results);
    } else {
      throw new Error("El ID proporcionado no es válido.");
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

