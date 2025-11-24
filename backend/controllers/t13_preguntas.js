const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t12_id = req.query.t12_id;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t13_preguntas WHERE t12_examenes_t12_id = ${t12_id} AND t13_pregunta LIKE '%${index}%'ORDER BY t13_id ASC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t13_preguntas WHERE t12_examenes_t12_id = ${t12_id} ORDER BY t13_id ASC;`);
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
    const t12_id = req.query.t12_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t13_preguntas WHERE t12_examenes_t12_id = ${t12_id} ORDER BY t13_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t13_preguntas WHERE t12_examenes_t12_id = ${t12_id} ORDER BY t13_id ASC;`; 
    }
    const results = await queryAsync(query);

    var results0 = [];
    for(let i = 0; i < results.length; i++){
      results0[i] = results[i];
      results0[i].t13_respuestas = JSON.parse(results[i].t13_respuestas);
    }

    return res.status(200).json(results0);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t13_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t13_preguntas WHERE t13_id = ?', [t13_id]);
    var results0 = [];
    results0[0] = results[0];
    results0[0].t13_respuestas = JSON.parse(results[0].t13_respuestas);
    return res.status(200).json(results0[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const t12_id = req.query.t12_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t13_preguntas WHERE t12_examenes_t12_id = ${t12_id} AND t13_pregunta LIKE '%${req.query.index}%' ORDER BY t13_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t13_preguntas WHERE t12_examenes_t12_id = ${t12_id} AND t13_pregunta LIKE '%${index}%' ORDER BY t13_id ASC;`; 
    }
    const results = await queryAsync(query);
    var results0 = [];
    for(let i = 0; i < results.length; i++){
      results0[i] = results[i];
      results0[i].t13_respuestas = JSON.parse(results[i].t13_respuestas);
    }
    return res.status(200).json(results0);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t13_pregunta, t13_respuestas, t12_examenes_t12_id } = JSON.parse(req.body.data);
    if (!t13_pregunta || t13_respuestas==null || t12_examenes_t12_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t13_preguntas (t13_pregunta, t13_respuestas,t12_examenes_t12_id) VALUES (?, ?, ?)',
      [t13_pregunta, JSON.stringify(t13_respuestas), t12_examenes_t12_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t13_id = req.params.id;
    const { t13_pregunta, t13_respuestas } = JSON.parse(req.body.data);
    if (!t13_pregunta || t13_respuestas==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t13_preguntas SET t13_pregunta = ?, t13_respuestas = ? WHERE t13_id = ?',
      [t13_pregunta, JSON.stringify(t13_respuestas), t13_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t13_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t13_id)) && isFinite(t13_id)) {
      const results = await queryAsync('DELETE FROM t13_preguntas WHERE t13_id = ?', [t13_id]);
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
  const t12_id = req.query.t12_id;
  try {
    const t12_npreguntas = await queryAsync(`SELECT t12_npreguntas FROM t12_examenes WHERE t12_id = ${t12_id}`);

    const results = await queryAsync(`SELECT * FROM t13_preguntas 
      WHERE t12_examenes_t12_id = ? ORDER BY RAND() LIMIT ${t12_npreguntas[0].t12_npreguntas};`, [t12_id]);    
    
    var results0 = [];
    for(let i = 0; i < results.length; i++){
      results0[i] = results[i];
      results0[i].t13_respuestas = JSON.parse(results[i].t13_respuestas);
    }
    return res.status(200).json(results0);
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






