const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const certificacion = req.query.certificacion?.trim() || null;

    let sql = `SELECT COUNT(*) AS filas FROM t11_miscursos INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t2_alumnos_t2_id = ${req.t2_id}`;
    let params = [];

    if (index !== "") {
      sql += " AND t5_curso LIKE ?";
      params.push(`%${index}%`);
    }
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
    }
    if (certificacion != 'null' && certificacion !== "") {
      sql += " AND t5_certificacion = ?";
      params.push(certificacion);
    }
    sql += " ORDER BY t5_id DESC;";

    const results = await queryAsync(sql, params);

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
      query = `SELECT * FROM t11_miscursos 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      WHERE t2_alumnos_t2_id = ${req.t2_id} ORDER BY t11_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t11_miscursos 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      WHERE t2_alumnos_t2_id = ${req.t2_id} ORDER BY t11_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t11_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT * FROM t11_miscursos INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t11_id = ?;`, [t11_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const certificacion = req.query.certificacion?.trim() || null;
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT * FROM t11_miscursos
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      WHERE t2_alumnos_t2_id = ${req.t2_id}
    `;
    let params = [];

    // Filtro por búsqueda
    if (index !== "") {
      sql += " AND t5_curso LIKE ?";
      params.push(`%${index}%`);
    }
    // Filtro por tipo (solo si no es null)
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
    }
    if (certificacion != 'null' && certificacion !== "") {
      sql += " AND t5_certificacion = ?";
      params.push(certificacion);
    }

    // Orden
    sql += " ORDER BY t5_id DESC";

    // Paginación
    if (size && offset) {
      sql += " LIMIT ? OFFSET ?";
      params.push(parseInt(size), parseInt(offset));
    }
    
    const results = await queryAsync(sql, params);

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};



/* INTRANET DOCENTE */

exports.getPaginarIntranetDocente = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const certificacion = req.query.certificacion?.trim() || null;

    let sql = `SELECT COUNT(*) AS filas FROM t5_cursos 
    INNER JOIN t6_mentores P ON t6_mentores_t6_id = P.t6_id
    LEFT JOIN t6_mentores T ON t6_mentores_t6_id_t = T.t6_id
    WHERE t5_tipo = 2 AND (P.t6_id = ${req.t6_id} OR T.t6_id = ${req.t6_id})`;
    let params = [];

    if (index !== "") {
      sql += " AND t5_curso LIKE ?";
      params.push(`%${index}%`);
    }
    /*
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
    }
    if (certificacion != 'null' && certificacion !== "") {
      sql += " AND t5_certificacion = ?";
      params.push(certificacion);
    }
    */
    sql += " ORDER BY t5_id DESC;";

    const results = await queryAsync(sql, params);

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

exports.getAllDataIntranetDocente = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t11_miscursos 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id 
      WHERE t5_tipo = 2 AND t2_alumnos_t2_id = ${req.t2_id} ORDER BY t11_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t11_miscursos 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      WHERE t5_tipo = 2 AND t2_alumnos_t2_id = ${req.t2_id} ORDER BY t11_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataIntranetDocente = async (req, res) => {
  const t11_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT * FROM t11_miscursos INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t5_tipo = 2 AND t2_alumnos_t2_id = ${req.t2_id} AND t11_id = ?;`, [t11_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilterIntranetDocente = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const certificacion = req.query.certificacion?.trim() || null;
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT t5_cursos.*, t8_clases.*, r.*, P.t6_mentor, T.t6_mentor AS t6_mentor_t,
      COUNT(CASE WHEN t8_estado = 1 THEN t8_id END) AS clases_realizadas,
      COUNT(CASE WHEN t8_estado != 2 THEN t8_id END) AS clases_totales
      FROM t5_cursos
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id
      INNER JOIN t6_mentores P ON t6_mentores_t6_id = P.t6_id
      LEFT JOIN t6_mentores T ON t6_mentores_t6_id_t = T.t6_id
      LEFT JOIN t7_modulos ON t5_cursos_t5_id = t5_id
      LEFT JOIN t8_clases ON t7_modulos_t7_id = t7_id
      LEFT JOIN t19_recursos r ON r.t19_id = (
        SELECT t19_id
        FROM t19_recursos
            INNER JOIN t8_clases ON t8_clases_t8_id = t8_id
        WHERE t7_modulos_t7_id = t7_id
        ORDER BY t19_fecha DESC
        LIMIT 1
      )
      WHERE t5_tipo = 2 AND (P.t6_id = ${req.t6_id} OR T.t6_id = ${req.t6_id})  
    `;
    let params = [];

    // Filtro por búsqueda
    if (index !== "") {
      sql += " AND t5_curso LIKE ?";
      params.push(`%${index}%`);
    }

    // Filtro por tipo (solo si no es null)
    /*
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
    }
    if (certificacion != 'null' && certificacion !== "") {
      sql += " AND t5_certificacion = ?";
      params.push(certificacion);
    }
    */

    sql += " GROUP BY t5_id";
    // Orden
    sql += " ORDER BY t5_id DESC";
    // Paginación
    if (size && offset) {
      sql += " LIMIT ? OFFSET ?";
      params.push(parseInt(size), parseInt(offset));
    }
    
    const results = await queryAsync(sql, params);

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
