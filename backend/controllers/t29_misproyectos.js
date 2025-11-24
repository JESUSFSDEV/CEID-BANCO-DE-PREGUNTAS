const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t29_misproyectos INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyecto LIKE '%${index}%' ORDER BY t29_id DESC;`);
    } else {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t29_misproyectos INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id WHERE t2_alumnos_t2_id = ${req.t2_id};`);
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
      query = `SELECT * FROM t29_misproyectos 
      INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id 
      WHERE t2_alumnos_t2_id = ${req.t2_id} ORDER BY t29_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t29_misproyectos 
      INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id 
      WHERE t2_alumnos_t2_id = ${req.t2_id} ORDER BY t29_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t29_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT * FROM t29_misproyectos INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t29_id = ?;`, [t29_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t29_misproyectos INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyecto LIKE '%${req.query.index}%' ORDER BY t29_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t29_misproyectos INNER JOIN t28_proyectos ON t28_proyectos_t28_id = t28_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t28_proyecto LIKE '%${req.query.index}%' ORDER BY t29_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

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
