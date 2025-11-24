const db = require('../config/db');
const ShortUniqueId = require('short-unique-id');
const fs = require('fs').promises;
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t30_certificados WHERE t30_curso LIKE '%${index}%' ORDER BY t30_id DESC;`);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t30_certificados;');
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
      query = `SELECT * FROM t30_certificados ORDER BY t30_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT * FROM t30_certificados ORDER BY t30_id DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t30_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t30_certificados WHERE t30_id = ?', [t30_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t30_certificados WHERE t30_curso LIKE '%${req.query.index}%' ORDER BY t30_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t30_certificados WHERE t30_curso LIKE '%${req.query.index}%' ORDER BY t30_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t30_curso, t30_codigo, t30_fecha_inicio, t30_fecha_fin, t30_horas, t30_year, t30_post_ruta } = JSON.parse(req.body.data);
    if (!t30_curso || !t30_codigo || !t30_fecha_inicio || !t30_fecha_fin || t30_horas==null || t30_year==null) {
      throw new Error("Revise los campos obligatorios.");
    }


    const cod_results1 = await queryAsync('SELECT * FROM t5_cursos WHERE TRIM(UPPER(t5_codigo)) = TRIM(UPPER(?));', [t30_codigo]);
    if(cod_results1.length == 0){
      const cod_results2 = await queryAsync('SELECT * FROM t30_certificados WHERE TRIM(UPPER(t30_codigo)) = TRIM(UPPER(?)) AND t30_year = ?;', [t30_codigo, t30_year]);
      if(cod_results2.length == 0){
       
      }else{
        throw new Error("El código del certificado ya se encuentra registrado.");
      }
    }else{
      throw new Error("El código del certificado ya se encuentra registrado.");
    }


    /*
    const uid = new ShortUniqueId({ length: 10 });
    uid.setDictionary('alpha_upper');

    let uniqueCode;
    while(true){
      uniqueCode = uid.rnd();
      uniqueCodeQuery = await queryAsync(`SELECT * FROM t30_certificados WHERE t30_carpeta = ?;`,[uniqueCode]);
      if(uniqueCodeQuery.length==0){
        break;
      }
    }
    */
    const uniqueCode = t30_codigo + '_' + t30_year;
    
    const results = await queryAsync(
      'INSERT INTO t30_certificados (t30_curso, t30_codigo, t30_fecha_inicio, t30_fecha_fin, t30_horas, t30_year, t30_carpeta, t30_post_ruta, t30_unq) VALUES (?,?,?,?,?,?,?,?,?)',
      [t30_curso, t30_codigo, t30_fecha_inicio, t30_fecha_fin, t30_horas, t30_year, uniqueCode, t30_post_ruta, t30_codigo+'_'+t30_year]
    );

    if (results.affectedRows > 0) {
      try {
        const dirPath = path.join(__dirname, '../uploads/certificados-sync', uniqueCode); 
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        console.error('Error creando la carpeta:', error);
        return res.status(500).send('Error creando la carpeta');
      }
    }
    

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t30_id = req.params.id;
    const { t30_curso, t30_fecha_inicio, t30_fecha_fin, t30_horas, t30_post_ruta } = JSON.parse(req.body.data);
    if (!t30_curso || !t30_fecha_inicio || !t30_fecha_fin || t30_horas==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t30_certificados SET t30_curso = ?, t30_fecha_inicio = ?, t30_fecha_fin = ?, t30_horas = ?, t30_post_ruta = ? WHERE t30_id = ?',
      [t30_curso, t30_fecha_inicio, t30_fecha_fin, t30_horas, t30_post_ruta, t30_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t30_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t30_id)) && isFinite(t30_id)) {
      var certificado = await queryAsync(`SELECT * FROM t30_certificados WHERE t30_id = ?`, [t30_id]);
      var results = await queryAsync('DELETE FROM t30_certificados WHERE t30_id = ?', [t30_id]);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }

  if (results.affectedRows > 0) {
    try {
      var dirPath = path.join(__dirname, '../uploads/certificados-sync', certificado[0].t30_carpeta); 
      if (true) {
        const files = await fs.readdir(dirPath); // Leer el contenido del directorio
        // Iterar sobre cada archivo y subdirectorio
        await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const stat = await fs.lstat(filePath);
            // Si es un directorio, llamamos a la función de forma recursiva
            if (stat.isDirectory()) {
              await removeDir(filePath);
            } else {
              // Si es un archivo, lo eliminamos
              await fs.unlink(filePath);
            }
          })
        );
        // Finalmente, eliminamos el directorio vacío
        await fs.rmdir(dirPath);
        console.log(`Directorio ${dirPath} eliminado exitosamente`);
      }else{
        console.log(`Directorio ${dirPath} no existe`);
      }
    } catch (error) {
      console.log(`Error eliminando ${dirPath}:`, error);
    }
  }
  return res.status(200).json(results);

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





