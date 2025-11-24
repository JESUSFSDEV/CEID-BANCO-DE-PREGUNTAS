const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t21_unidades WHERE t21_unidad LIKE '%${index}%'ORDER BY t21_id DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t21_unidades;');
    }
    
    var pages = 0;
    if(results[0].filas>0){
      pages = Math.ceil(results[0].filas / pages_size); 
    }

    var json_resp = [];
    if(pages==0){
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
          if(i + 1 == pages && results[0].filas%pages_size!=0){
            size = results[0].filas%pages_size;
          }else{
            size = pages_size;
          }
          json_resp.push(
            {  
              'pagina': i+1,
              'size': size,
              'offset': i*pages_size,
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
      query = `SELECT * FROM t21_unidades ORDER BY t21_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t21_unidades  ORDER BY t21_id DESC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t21_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t21_unidades WHERE t21_id = ?', [t21_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t21_unidades WHERE t21_unidad LIKE '%${req.query.index}%' ORDER BY t21_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t21_unidades WHERE t21_unidad LIKE '%${index}%' ORDER BY t21_id DESC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t21_unidad, t21_abreviatura } = JSON.parse(req.body.data);
    if (!t21_unidad || !t21_abreviatura) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t21_unidades (t21_unidad, t21_abreviatura) VALUES (?, ?)',
      [t21_unidad, t21_abreviatura]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t21_id = req.params.id;
    const { t21_unidad, t21_abreviatura } = JSON.parse(req.body.data);
    if (!t21_unidad || !t21_abreviatura) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t21_unidades SET t21_unidad = ?, t21_abreviatura = ? WHERE t21_id = ?',
      [t21_unidad, t21_abreviatura, t21_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t21_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t21_id)) && isFinite(t21_id)) {
      const results = await queryAsync('DELETE FROM t21_unidades WHERE t21_id = ?', [t21_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};



exports.getDataIntranet = async (req, res) => {
  try {
    const t5_id = req.query.t5_id;
    const t7_id = req.query.t7_id;

    if (t5_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    const t14_calificaciones = await queryAsync(`SELECT *,
        CASE 
          WHEN NOW() BETWEEN A.t14_fecha AND A.t14_fecha_fin THEN 1 ELSE 0 END AS habilitado
      FROM t14_calificaciones A
      INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id
      INNER JOIN t7_modulos C ON A.t7_modulos_t7_id= C.t7_id 
      INNER JOIN t12_examenes D ON C.t7_id = D.t7_modulos_t7_id
      WHERE B.t5_cursos_t5_id = ${t5_id} AND A.t7_modulos_t7_id = ${t7_id} AND B.t2_alumnos_t2_id = ${req.t2_id} ORDER BY A.t14_fecha DESC;`);

    if(t14_calificaciones.length==0){
        return res.status(200).json({});
    }else{

      if(t14_calificaciones.length >= t14_calificaciones[0].t12_intentos){
        if(!t14_calificaciones[0].habilitado){
          await queryAsync(`UPDATE t14_calificaciones SET t14_estado = 1 WHERE t14_id = ?;`, [t14_calificaciones[0].t14_id]);
          t14_calificaciones[0].intentos = 0;
          return res.status(200).json(t14_calificaciones[0]);
        }else{
          t14_calificaciones[0].intentos = 0;
          return res.status(200).json(t14_calificaciones[0]);
        }
      }else{
        t14_calificaciones[0].intentos = t14_calificaciones[0].t12_intentos - t14_calificaciones.length;
      }

      if(t14_calificaciones[0].t14_estado==0){
        if(t14_calificaciones[0].habilitado){
          return res.status(200).json(t14_calificaciones[0]);
        }else{
          await queryAsync(`UPDATE t14_calificaciones SET t14_estado = 1 WHERE t14_id = ?;`, [t14_calificaciones[0].t14_id]);
          return res.status(200).json(t14_calificaciones[0]);
        }
      }else{
        return res.status(200).json(t14_calificaciones[0]);
      }
      
      
    }

  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};


exports.postDataIntranet = async (req, res) => {
  try {
    const preguntas = JSON.parse(req.body.data);
    const { t5_id } = JSON.parse(req.body.curso);
    const { t7_id } = JSON.parse(req.body.modulo);

    if (preguntas.lenth==0 || t5_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }


    const t14_calificaciones = await queryAsync(`SELECT *,
      CASE 
        WHEN NOW() BETWEEN A.t14_fecha AND A.t14_fecha_fin THEN 1 ELSE 0 END AS habilitado
    FROM t14_calificaciones A
    INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id
    INNER JOIN t7_modulos C ON A.t7_modulos_t7_id= C.t7_id 
    INNER JOIN t12_examenes D ON C.t7_id = D.t7_modulos_t7_id
    WHERE B.t5_cursos_t5_id = ${t5_id} AND A.t7_modulos_t7_id = ${t7_id} AND B.t2_alumnos_t2_id = ${req.t2_id} ORDER BY A.t14_fecha DESC;`);
    
    if(t14_calificaciones.length > 0 && t14_calificaciones.length >= t14_calificaciones[0].t12_intentos){
      throw new Error("Ya no te queda intentos disponibles para desarrollar el examen.");
    }


    const miscursos = await queryAsync(`SELECT * FROM t11_miscursos INNER JOIN t5_cursos ON t5_id = t5_cursos_t5_id WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_id = ${t5_id};`);
    const examen = await queryAsync(`SELECT * FROM t12_examenes WHERE t7_modulos_t7_id = ${t7_id} AND t5_cursos_t5_id = ${t5_id};`);

    const results = await queryAsync(
      'INSERT INTO t14_calificaciones (t14_nota,t14_estado,t14_fecha,t14_fecha_fin,t14_preguntas,t14_respuestas, t11_miscursos_t11_id, t7_modulos_t7_id) VALUES (0, 0, NOW(), ADDTIME(t14_fecha, ?), ?, ?, ?, ?)',
      [examen[0].t12_duracion, JSON.stringify(preguntas), '[]', miscursos[0].t11_id, t7_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
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





