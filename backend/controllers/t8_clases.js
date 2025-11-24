const db = require('../config/db');


exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t7_id = req.query.t7_id;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t8_clases WHERE t7_modulos_t7_id = ${t7_id} AND t8_clase LIKE '%${index}%'ORDER BY t8_id ASC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t8_clases WHERE t7_modulos_t7_id = ${t7_id} ORDER BY t8_id ASC;`);
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
    const t7_id = req.query.t7_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t8_clases WHERE t7_modulos_t7_id = ${t7_id} ORDER BY t8_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t8_clases WHERE t7_modulos_t7_id = ${t7_id} ORDER BY t8_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t8_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t8_clases WHERE t8_id = ?', [t8_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const t7_id = req.query.t7_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t8_clases WHERE t7_modulos_t7_id = ${t7_id} AND t8_clase LIKE '%${req.query.index}%' ORDER BY t8_id ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t8_clases WHERE t7_modulos_t7_id = ${t7_id} AND t8_clase LIKE '%${index}%' ORDER BY t8_id ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_url, t8_estado, t8_grabado, t7_modulos_t7_id } = JSON.parse(req.body.data);
    if (!t8_clase || t8_duracion_h==null || t8_duracion_m==null || !t7_modulos_t7_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    if (isNaN(parseFloat(t8_estado)) || !isFinite(t8_estado)) {
      t8_estado = 0; // Default to 'Pendiente' if not provided
    }

    const results = await queryAsync(
      'INSERT INTO t8_clases (t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_url, t8_estado, t8_grabado, t7_modulos_t7_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [t8_clase, t8_fecha || null, t8_duracion_h, t8_duracion_m, t8_url, t8_estado, t8_estado != 1 ? null : t8_grabado,t7_modulos_t7_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t8_id = req.params.id;
    const { t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_url, t8_grabado, t8_estado } = JSON.parse(req.body.data);
    if (!t8_clase || t8_duracion_h==null || t8_duracion_m==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    if (isNaN(parseFloat(t8_estado)) || !isFinite(t8_estado)) {
      t8_estado = 0; // Default to 'Pendiente' if not provided
    }

    const results = await queryAsync(
      'UPDATE t8_clases SET t8_clase = ?, t8_fecha = ?, t8_duracion_h = ?, t8_duracion_m = ?, t8_url = ?, t8_grabado = ?, t8_estado = ? WHERE t8_id = ?',
      [t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_url, t8_estado != 1 ? null : t8_grabado, t8_estado, t8_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t8_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t8_id)) && isFinite(t8_id)) {
      const results = await queryAsync('DELETE FROM t8_clases WHERE t8_id = ?', [t8_id]);
      await queryAsync('DELETE FROM t37_asistencias_detalles WHERE t8_clases_t8_id = ?', [t8_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};





exports.getAllDataAulaVirtual = async (req, res) => {
  try {
    var query;
    const t5_id = req.query.t5_id;
    if(req.query.size && req.query.offset){
      query = `SELECT *,
          IF(DATE(t8_fecha)=CURDATE(),1,0) AS clase_hoy,
          IF(DATE(t8_fecha)<CURDATE(),1,0) AS clase_pasada
          FROM t8_clases 
          INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
          WHERE t5_cursos_t5_id = ${t5_id} ORDER BY t8_fecha ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT *,
          IF(DATE(t8_fecha)=CURDATE(),1,0) AS clase_hoy,
          IF(DATE(t8_fecha)<CURDATE(),1,0) AS clase_pasada
          FROM t8_clases 
          INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
          WHERE t5_cursos_t5_id = ${t5_id} ORDER BY t8_fecha ASC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    const { t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_grabado, t8_url, t8_estado, t7_modulos_t7_id } = JSON.parse(req.body.data);
    if (!t8_clase || t8_fecha==null || t8_duracion_h==null || t8_duracion_m==null || !t7_modulos_t7_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    if (isNaN(parseFloat(t8_estado)) || !isFinite(t8_estado)) {
      t8_estado = 0; // Default to 'Pendiente' if not provided
    }

    const results = await queryAsync(
      'INSERT INTO t8_clases (t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_grabado, t8_url, t8_estado, t7_modulos_t7_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_estado != 1 ? null : t8_grabado, t8_url, t8_estado, t7_modulos_t7_id]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.putDataAulaVirtual = async (req, res) => {
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    const t8_id = req.params.id;
    const { t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_grabado, t8_url, t8_estado, t7_modulos_t7_id, t5_cursos_t5_id } = JSON.parse(req.body.data);
    if (!t8_clase || t8_duracion_h==null || t8_duracion_m==null || !t7_modulos_t7_id) {
      throw new Error("Revise los campos obligatorios.");
    }
    if (isNaN(parseFloat(t8_estado)) || !isFinite(t8_estado)) {
      t8_estado = 0; // Default to 'Pendiente' if not provided
    }

    const results = await queryAsync(
      'UPDATE t8_clases SET t8_clase = ?, t8_fecha = ?, t8_duracion_h = ?, t8_duracion_m = ?, t8_url = ?, t8_estado = ?, t8_grabado = ?, t7_modulos_t7_id = ? WHERE t8_id = ?',
      [t8_clase, t8_fecha, t8_duracion_h, t8_duracion_m, t8_url, t8_estado, t8_estado != 1 ? null : t8_grabado, t7_modulos_t7_id, t8_id]
    );
    
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteDataAulaVirtual = async (req, res) => {
  const t8_id = req.params.id;
  try {

    if(!req.t6_id && !req.t1_id){
      throw new Error("Acceso denegado.");
    }

    if (!isNaN(parseFloat(t8_id)) && isFinite(t8_id)) {
      await queryAsync('DELETE FROM t37_asistencias_detalles WHERE t8_clases_t8_id = ?', [t8_id]);
      const results = await queryAsync('DELETE FROM t8_clases WHERE t8_id = ?', [t8_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};



exports.getCalendarioAulaVirtual = async (req, res) => {
  const { year, month } = req.query;

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
                   String(today.getMonth() + 1).padStart(2, '0') + '-' +
                   String(today.getDate()).padStart(2, '0');

  const y = year ? parseInt(year) : today.getFullYear();
  const m = month ? parseInt(month) - 1 : today.getMonth(); // 0 = Enero, 11 = Diciembre

  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const days = [];

  let startWeekDay = firstDay.getDay(); 
  startWeekDay = startWeekDay === 0 ? 7 : startWeekDay;

  if (startWeekDay > 1) {
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const prevLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = startWeekDay - 2; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, prevLastDay - i);
      const dateStr = date.getFullYear() + '-' +
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0');
      days.push({
        day: date.getDate(),
        weekday: date.toLocaleDateString('es-PE', { weekday: 'long' }),
        date: dateStr,
        fromOtherMonth: true,
        today: dateStr === todayStr,
      });
    }
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(y, m, day);
    const dateStr = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0');
    days.push({
      day,
      weekday: date.toLocaleDateString('es-PE', { weekday: 'long' }),
      date: dateStr,
      fromOtherMonth: false,
      today: dateStr === todayStr,
    });
  }

  let endWeekDay = lastDay.getDay(); 
  endWeekDay = endWeekDay === 0 ? 7 : endWeekDay;

  if (endWeekDay < 7) {
    const nextMonth = m === 11 ? 0 : m + 1;
    const nextYear = m === 11 ? y + 1 : y;

    for (let i = 1; i <= 7 - endWeekDay; i++) {
      const date = new Date(nextYear, nextMonth, i);
      const dateStr = date.getFullYear() + '-' +
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0');
      days.push({
        day: date.getDate(),
        weekday: date.toLocaleDateString('es-PE', { weekday: 'long' }),
        date: dateStr,
        fromOtherMonth: true,
        today: dateStr === todayStr,
      });
    }
  }

  res.status(200).json({
    year: y,
    month: m + 1,
    monthName: firstDay.toLocaleDateString('es-PE', { month: 'long' }),
    days,
  });
};

exports.getClasesCalendarioAulaVirtual = async (req, res) => {
  try {
    let query;

    const { year, month } = req.query;
    const paddedMonth = String(month).padStart(2, '0'); // Asegura formato 2 dígitos: 07, 08, etc.
    const fechaLike = `${year}-${paddedMonth}-%`;

    if(req.t2_id) {
      query = `SELECT * FROM t8_clases A
                INNER JOIN t7_modulos B ON A.t7_modulos_t7_id = B.t7_id
                INNER JOIN t5_cursos C ON B.t5_cursos_t5_id = C.t5_id
                INNER JOIN t11_miscursos D ON D.t5_cursos_t5_id = C.t5_id
                WHERE D.t2_alumnos_t2_id = ${req.t2_id} AND C.t5_tipo = 2 AND A.t8_fecha LIKE ?
                ORDER BY A.t8_fecha ASC;`; 
    }else if(req.t6_id) {
      query = `SELECT * FROM t8_clases
                INNER JOIN t7_modulos ON t7_modulos_t7_id = t7_id
                INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id
                WHERE (t6_mentores_t6_id = ${req.t6_id} OR t6_mentores_t6_id_t = ${req.t6_id}) AND t5_tipo = 2 AND t8_fecha LIKE ?
                ORDER BY t8_fecha ASC;`; 
    }else{
      throw new Error("No tiene acceso a este modulo.");
    }
    
    const results = await queryAsync(query, [fechaLike]);

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
