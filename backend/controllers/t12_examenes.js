const db = require('../config/db');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t12_examenes INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id WHERE t5_curso LIKE '%${index}%' ORDER BY t12_id DESC;`);
    } else {
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t12_examenes INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id;');
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
      query = `SELECT *, COUNT(t13_id) AS t13_preguntas FROM t12_examenes 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
      LEFT JOIN t13_preguntas ON t12_id = t12_examenes_t12_id 
      GROUP BY t12_id ORDER BY t12_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT *, COUNT(t13_id) AS t13_preguntas FROM t12_examenes 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
      LEFT JOIN t13_preguntas ON t12_id = t12_examenes_t12_id 
      GROUP BY t12_id ORDER BY t12_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t12_id = req.params.id;
  try {
    const results = await queryAsync('SELECT *, COUNT(t13_id) AS t13_preguntas FROM t12_examenes INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id LEFT JOIN t13_preguntas ON t12_id = t12_examenes_t12_id WHERE t12_id = ? GROUP BY t12_id', [t12_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT *, COUNT(t13_id) AS t13_preguntas FROM t12_examenes 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
      LEFT JOIN t13_preguntas ON t12_id = t12_examenes_t12_id 
      WHERE t5_curso LIKE '%${req.query.index}%' GROUP BY t12_id ORDER BY t12_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT *, COUNT(t13_id) AS t13_preguntas FROM t12_examenes 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
      LEFT JOIN t13_preguntas ON t12_id = t12_examenes_t12_id 
      WHERE t5_curso LIKE '%${req.query.index}%' GROUP BY t12_id ORDER BY t12_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    //console.log(req.body.data)
    const { t12_tipo, t12_duracion, t12_label, t12_intentos, t12_indicaciones, t12_nota_min, t12_nota_max, t12_npreguntas, t12_ppreguntas, t12_estado, t5_cursos_t5_id, t7_modulos_t7_id } = JSON.parse(req.body.data);
    if (t12_tipo==null || t12_duracion==null || t12_label==null || t12_intentos==null || !t12_indicaciones || t12_nota_min==null || t12_nota_max==null || t12_npreguntas==null || t12_ppreguntas==null || t12_estado==null || !t5_cursos_t5_id || !t7_modulos_t7_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t12_examenes (t12_tipo, t12_duracion, t12_label, t12_intentos, t12_fecha, t12_indicaciones, t12_nota_min, t12_nota_max, t12_npreguntas, t12_ppreguntas, t12_estado, t5_cursos_t5_id, t7_modulos_t7_id) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)',
      [t12_tipo, t12_duracion, t12_label, t12_intentos, t12_indicaciones, t12_nota_min, t12_nota_max, t12_npreguntas, t12_ppreguntas, t12_estado, t5_cursos_t5_id, t7_modulos_t7_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t12_id = req.params.id;
    const { t12_tipo, t12_duracion, t12_label, t12_intentos, t12_indicaciones, t12_nota_min, t12_nota_max, t12_npreguntas, t12_ppreguntas, t12_estado, t5_cursos_t5_id, t7_modulos_t7_id } = JSON.parse(req.body.data);
    if (t12_tipo==null || t12_duracion==null || t12_label==null || t12_intentos==null || !t12_indicaciones || t12_nota_min==null || t12_nota_max==null || t12_npreguntas==null || t12_ppreguntas==null || t12_estado==null || !t5_cursos_t5_id || !t7_modulos_t7_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t12_examenes SET t12_tipo = ?, t12_duracion = ?, t12_label = ?, t12_intentos = ?, t12_indicaciones = ?, t12_nota_min = ?, t12_nota_max = ?, t12_npreguntas = ?, t12_ppreguntas = ?, t12_estado = ?, t5_cursos_t5_id = ?,  t7_modulos_t7_id = ? WHERE t12_id = ?',
      [t12_tipo, t12_duracion, t12_label, t12_intentos, t12_indicaciones, t12_nota_min, t12_nota_max, t12_npreguntas, t12_ppreguntas, t12_estado, t5_cursos_t5_id, t7_modulos_t7_id, t12_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t12_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t12_id)) && isFinite(t12_id)) {
      const results = await queryAsync('DELETE FROM t12_examenes WHERE t12_id = ?', [t12_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


/* INTRANET */
/* INTRANET */
/* INTRANET */
exports.getDataIntranet = async (req, res) => {
  const t5_id = req.query.t5_id;
  const t7_id = req.query.t7_id;
  try {
    const examen = await queryAsync('SELECT * FROM t12_examenes WHERE t5_cursos_t5_id = ? AND t7_modulos_t7_id = ?;', [t5_id, t7_id]);

    const t14_calificaciones = await queryAsync(`SELECT *,
      CASE 
        WHEN NOW() BETWEEN A.t14_fecha AND A.t14_fecha_fin THEN 1 ELSE 0 END AS habilitado
    FROM t14_calificaciones A
    INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id
    INNER JOIN t7_modulos C ON A.t7_modulos_t7_id= C.t7_id 
    INNER JOIN t12_examenes D ON C.t7_id = D.t7_modulos_t7_id
    WHERE B.t5_cursos_t5_id = ${t5_id} AND A.t7_modulos_t7_id = ${t7_id} AND B.t2_alumnos_t2_id = ${req.t2_id} ORDER BY A.t14_fecha DESC;`);

    if(t14_calificaciones.length>0 && !t14_calificaciones[0].habilitado && t14_calificaciones[0].t14_estado!=2){
      await queryAsync('UPDATE t14_calificaciones SET t14_estado = 1 WHERE t14_id = ?;',[t14_calificaciones[0].t14_id]);
    }
    

    return res.status(200).json(examen[0]);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postDataIntranet = async (req, res) => {

  const { t5_id } = JSON.parse(req.body.curso);
  const { t7_id } = JSON.parse(req.body.modulo);
  const preguntas = JSON.parse(req.body.data);

  var puntaje = 0;
  console.log(preguntas[0].t13_respuestas)

  try {
    
    if (t5_id==null || preguntas.length==0) {
      throw new Error("Revise los campos obligatorios.");
    }


    const t12_examenes = await queryAsync(`SELECT *,
      CASE 
        WHEN NOW() BETWEEN A.t14_fecha AND A.t14_fecha_fin THEN 1 ELSE 0 END AS habilitado
    FROM t14_calificaciones A
    INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id
    INNER JOIN t7_modulos C ON A.t7_modulos_t7_id= C.t7_id 
    INNER JOIN t12_examenes D ON C.t7_id = D.t7_modulos_t7_id
    WHERE B.t5_cursos_t5_id = ${t5_id} AND A.t7_modulos_t7_id = ${t7_id} AND B.t2_alumnos_t2_id = ${req.t2_id} AND A.t14_estado = 0 ORDER BY A.t14_fecha DESC;`);


    if(!t12_examenes[0].habilitado){
      await queryAsync('UPDATE t14_calificaciones SET t14_estado = 1 WHERE t14_id = ?;',[t12_examenes[0].t14_id]);
      throw new Error("Enviaste tu examen fuera del tiempo permitido.");
    }

    const t13_preguntas = await queryAsync(`SELECT * FROM t13_preguntas 
      INNER JOIN t12_examenes ON t12_examenes_t12_id = t12_id 
      WHERE t12_id = ${t12_examenes[0].t12_id};`);

    for(let i = 0; i < preguntas.length; i++){
      for(let j = 0; j < t13_preguntas.length; j++){
        if(preguntas[i].t13_id == t13_preguntas[j].t13_id){
          t13_preguntas[j].t13_respuestas = Object.assign([], JSON.parse(t13_preguntas[j].t13_respuestas));
          if(t13_preguntas[j].t13_respuestas[preguntas[i].t13_marcado].t16_correcta == 1){
            console.log(preguntas[i].t13_pregunta + ": Correcto")
            puntaje += t12_examenes[0].t12_ppreguntas;
          }else{
            console.log(preguntas[i].t13_pregunta + ": Incorrecto")
          }
        }
      }
    }

    var results;
    if(puntaje>=t12_examenes[0].t12_nota_min){
      results = await queryAsync('UPDATE t14_calificaciones SET t14_nota = ?, t14_estado = 2 WHERE t14_id = ?;',[puntaje, t12_examenes[0].t14_id]);
      if(t12_examenes[0].t12_tipo=='F'){
        await queryAsync(`INSERT INTO t9_certificados (t9_fecha, t9_codigo, t9_estado, t11_miscursos_t11_id) VALUES(DATE(NOW()), '', 0, ?);`,[t12_examenes[0].t11_miscursos_t11_id]);
      }
    }else{
      results = await queryAsync('UPDATE t14_calificaciones SET t14_nota = ?, t14_estado = 1 WHERE t14_id = ?;',[puntaje, t12_examenes[0].t14_id]);
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
