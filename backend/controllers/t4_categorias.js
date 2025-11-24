const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t4_categorias WHERE t4_categoria LIKE '%${index}%' ORDER BY t4_id DESC;`);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t4_categorias;');
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
      query = `SELECT * FROM t4_categorias ORDER BY t4_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT * FROM t4_categorias ORDER BY t4_id DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t4_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t4_categorias WHERE t4_id = ?', [t4_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t4_categorias WHERE t4_categoria LIKE '%${req.query.index}%' ORDER BY t4_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t4_categorias WHERE t4_categoria LIKE '%${req.query.index}%' ORDER BY t4_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t4_categoria } = JSON.parse(req.body.data);
    if (!t4_categoria) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t4_categorias (t4_categoria) VALUES (?)',
      [t4_categoria]
    );
    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t4_id = req.params.id;
    const { t4_categoria } = JSON.parse(req.body.data);
    if (!t4_categoria) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t4_categorias SET t4_categoria = ? WHERE t4_id = ?',
      [t4_categoria, t4_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t4_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t4_id)) && isFinite(t4_id)) {
      const results = await queryAsync('DELETE FROM t4_categorias WHERE t4_id = ?', [t4_id]);
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





