const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim() != ""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t2_alumnos 
        LEFT JOIN t3_perfiles ON t2_id = t2_alumnos_t2_id
        WHERE t2_documento LIKE '%${index.trim()}%' OR t2_email LIKE '%${index.trim()}%' OR CONCAT(t3_nombres, ' ', t3_apellidos) LIKE '%${index.trim()}%' 
        ORDER BY t2_id DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t2_alumnos;');
    }

    var pages = 0;
    if(results[0].filas > 0){
      pages = Math.ceil(results[0].filas / pages_size); 
    }

    var json_resp = [];
    if(pages == 0){
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
        if(i + 1 == pages && results[0].filas % pages_size != 0){
          size = results[0].filas % pages_size;
        }else{
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
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t2_alumnos LEFT JOIN t3_perfiles ON t2_id = t2_alumnos_t2_id GROUP BY t2_id ORDER BY t2_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t2_alumnos LEFT JOIN t3_perfiles ON t2_id = t2_alumnos_t2_id GROUP BY t2_id ORDER BY t2_id DESC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t2_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t2_alumnos WHERE t2_id = ?', [t2_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t2_alumnos 
      LEFT JOIN t3_perfiles ON t2_id = t2_alumnos_t2_id 
      WHERE t2_documento LIKE '%${req.query.index.trim()}%' OR t2_email LIKE '%${req.query.index.trim()}%' OR CONCAT(t3_nombres, ' ', t3_apellidos) LIKE '%${req.query.index.trim()}%'
      GROUP BY t2_id ORDER BY t2_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t2_alumnos 
      LEFT JOIN t3_perfiles ON t2_id = t2_alumnos_t2_id 
      WHERE t2_documento LIKE '%${req.query.index.trim()}%' OR t2_email LIKE '%${req.query.index.trim()}%' OR CONCAT(t3_nombres, ' ', t3_apellidos) LIKE '%${req.query.index.trim()}%'
      GROUP BY t2_id ORDER BY t2_id DESC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t2_tipodoc, t2_documento, t2_email, t2_pass, t2_estado } = JSON.parse(req.body.data);
    if (t2_tipodoc == null || !t2_documento || !t2_email || !t2_pass || t2_estado == null) {
      throw new Error("Revise los campos obligatorios.");
    }

    // Verificar si el documento ya existe
    const existingDoc = await queryAsync('SELECT * FROM t2_alumnos WHERE TRIM(t2_documento) = TRIM(?)', [t2_documento]);
    if (existingDoc.length > 0) {
      throw new Error("El documento ya se encuentra registrado.");
    }
    // Verificar si el email ya existe
    const existingEmail = await queryAsync('SELECT * FROM t2_alumnos WHERE TRIM(t2_email) = TRIM(?)', [t2_email]);
    if (existingEmail.length > 0) {
      throw new Error("El email ya se encuentra registrado.");
    }

    const results = await queryAsync(
      'INSERT INTO t2_alumnos (t2_tipodoc, t2_documento, t2_email, t2_pass, t2_fechareg, t2_estado) VALUES (?, TRIM(?), TRIM(?), ?, NOW(), ?)',
      [t2_tipodoc, t2_documento, t2_email, t2_pass, t2_estado]
    );
    const results1 = await queryAsync(`INSERT INTO t3_perfiles (t3_nombres, t3_apellidos, t3_pais, t2_alumnos_t2_id) VALUES (?, ?, ?, ?);`, 
      ["","",0,results.insertId]);

    return res.status(200).json(results1);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t2_id = req.params.id;
    const { t2_tipodoc, t2_documento, t2_email, t2_pass, t2_fechareg, t2_estado } = JSON.parse(req.body.data);
    if (t2_tipodoc == null || !t2_documento || !t2_email || !t2_pass || !t2_fechareg || t2_estado == null) {
      throw new Error("Revise los campos obligatorios.");
    }

    // Verificar si el documento ya existe, excepto para el registro actual 
    const existingDoc = await queryAsync('SELECT * FROM t2_alumnos WHERE t2_estado = 1 AND TRIM(t2_documento) = TRIM(?) AND t2_id != ?', [t2_documento, t2_id]);
    if (existingDoc.length > 0) {
      throw new Error("El documento ya se encuentra registrado.");
    }
    // Verificar si el email ya existe, excepto para el registro actual
    const existingEmail = await queryAsync('SELECT * FROM t2_alumnos WHERE t2_estado = 1 AND TRIM(t2_email) = TRIM(?) AND t2_id != ?', [t2_email, t2_id]);
    if (existingEmail.length > 0) {
      throw new Error("El email ya se encuentra registrado.");
    }

    const results = await queryAsync(
      'UPDATE t2_alumnos SET t2_tipodoc = ?, t2_documento = ?, t2_email = ?, t2_pass = ?, t2_fechareg = ?, t2_estado = ? WHERE t2_id = ?',
      [t2_tipodoc, t2_documento, t2_email, t2_pass, t2_fechareg, t2_estado, t2_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t2_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t2_id)) && isFinite(t2_id)) {
      const results2 = await queryAsync('SELECT * FROM t2_alumnos WHERE t2_id = ?', [t2_id]);
      if(results2.length == 0){
        throw new Error("El alumno que intenta eliminar no existe.");
      }else{
        if(results2[0].t2_estado == 1){
          throw new Error("No se puede eliminar un alumno habilitado. Deshabilítelo primero.");
        }
      }
      const results0 = await queryAsync('DELETE FROM t3_perfiles WHERE t2_alumnos_t2_id = ?', [t2_id]);
      const results = await queryAsync('DELETE FROM t2_alumnos WHERE t2_id = ?', [t2_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.postDataActivar = async (req, res) => {
  try {
    const { t2_id } = req;
    const { t2_pin } = JSON.parse(req.body.data);
    if (t2_id==null || t2_pin==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    var results;
    if(t2_pin == "12345"){
      results = await queryAsync(
        'UPDATE t2_alumnos SET t2_estado = ? WHERE t2_id = ?;',
        [1, t2_id]
      );
    }else{
      throw new Error("El codigo PIN proporcionado no es válido");
    }
    

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
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






