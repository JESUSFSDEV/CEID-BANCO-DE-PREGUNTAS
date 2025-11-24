const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t47_areas WHERE t47_area LIKE '%${index}%' ORDER BY t47_id DESC;`);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t47_areas;');
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
      query = `SELECT * FROM t47_areas ORDER BY t47_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT *, COUNT(t28_id) AS proyectos FROM t47_areas LEFT JOIN t28_proyectos ON t47_areas_t47_id = t47_id AND t28_estado = 1 GROUP BY t47_id ORDER BY proyectos DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t47_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t47_areas WHERE t47_id = ?', [t47_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t47_areas WHERE t47_area LIKE '%${req.query.index}%' ORDER BY t47_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t47_areas WHERE t47_area LIKE '%${req.query.index}%' ORDER BY t47_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t47_area } = JSON.parse(req.body.data);
    if (!t47_area) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t47_areas (t47_area) VALUES (?)',
      [t47_area]
    );
    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t47_id = req.params.id;
    const { t47_area } = JSON.parse(req.body.data);
    if (!t47_area) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t47_areas SET t47_area = ? WHERE t47_id = ?',
      [t47_area, t47_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t47_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t47_id)) && isFinite(t47_id)) {
      const results = await queryAsync('DELETE FROM t47_areas WHERE t47_id = ?', [t47_id]);
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





