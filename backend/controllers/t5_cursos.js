const db = require('../config/db');
const fs = require('fs');

const path = require('path');
const ExcelJS = require('exceljs');

const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');

// Función para obtener la fecha actual en formato 'DD/MM/YYYY'
function getFormattedDate() {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Los meses se cuentan desde 0
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;

    let sql = "SELECT COUNT(*) AS filas FROM t5_cursos WHERE 1=1";
    let params = [];

    if (index !== "") {
      sql += " AND t5_curso LIKE ?";
      params.push(`%${index}%`);
    }
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
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
      query = `SELECT * FROM t5_cursos 
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id 
      ORDER BY t5_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT * FROM t5_cursos INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id ORDER BY t5_id DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t5_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t5_cursos INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id WHERE t5_id = ?', [t5_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT * FROM t5_cursos
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      WHERE 1=1
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

exports.postData = async (req, res) => {
  try {
    const { 
      t5_codigo, t5_tipo, t5_curso, t5_certificacion, t5_fecha, t5_dificultad, t5_precio, 
      t5_duracion_h, t5_duracion_m, t5_duracion, t5_descripcion, 
      t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t
    } = JSON.parse(req.body.data);

    if (t5_codigo==null || t5_tipo==null || t5_certificacion==null || !t5_curso || t5_fecha==null || t5_dificultad==null || t5_precio==null || 
        !t5_descripcion || !t5_dirigido || !t5_requisitos || t5_estado==null ||
        !t4_categorias_t4_id || !t6_mentores_t6_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    if(t6_mentores_t6_id == t6_mentores_t6_id_t){
      throw new Error("El mentor y el tutor no pueden ser el mismo usuario.");
    }

    const cod_results1 = await queryAsync('SELECT * FROM t5_cursos WHERE TRIM(UPPER(t5_codigo)) = TRIM(UPPER(?));', [t5_codigo]);
    if(cod_results1.length == 0){
      const cod_results2 = await queryAsync('SELECT * FROM t30_certificados WHERE TRIM(UPPER(t30_codigo)) = TRIM(UPPER(?))', [t5_codigo]);
      if(cod_results2.length == 0){
       
      }else{
        throw new Error("El código del certificado ya se encuentra registrado.");
      }
    }else{
      throw new Error("El código del certificado ya se encuentra registrado.");
    }


    // Verificar si el archivo fue subido
    let t5_img = null;
    var results;
    if (req.file) {
      t5_img = req.file.filename; // Obtener el nombre del archivo subido
      results = await queryAsync(
        'INSERT INTO t5_cursos (t5_img, t5_codigo, t5_tipo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t) VALUES (?, TRIM(UPPER(?)), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t5_img, t5_codigo, t5_tipo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t]
      );
    }else{
      results = await queryAsync(
        'INSERT INTO t5_cursos (t5_codigo, t5_tipo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t) VALUES (TRIM(UPPER(?)), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t5_codigo, t5_tipo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t]
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t5_id = req.params.id;
    const { 
      t5_codigo, t5_tipo, t5_curso, t5_certificacion, t5_fecha, t5_dificultad, t5_precio, 
      t5_duracion_h, t5_duracion_m, t5_duracion, t5_descripcion, 
      t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t
    } = JSON.parse(req.body.data);

    if (t5_codigo==null || t5_tipo==null || t5_certificacion==null || !t5_curso || t5_fecha==null || t5_dificultad==null || t5_precio==null || 
        !t5_descripcion || !t5_dirigido || !t5_requisitos || t5_estado==null ||
        !t4_categorias_t4_id || !t6_mentores_t6_id) {
      throw new Error("Revise los campos obligatorios.");
    }

    if(t6_mentores_t6_id == t6_mentores_t6_id_t){
      throw new Error("El mentor y el tutor no pueden ser el mismo usuario.");
    }

    const cod_results1 = await queryAsync('SELECT * FROM t5_cursos WHERE TRIM(UPPER(t5_codigo)) = TRIM(UPPER(?)) AND t5_id != ?;', [t5_codigo, t5_id]);
    if(cod_results1.length == 0){
      const cod_results2 = await queryAsync('SELECT * FROM t30_certificados WHERE TRIM(UPPER(t30_codigo)) = TRIM(UPPER(?))', [t5_codigo]);
      if(cod_results2.length == 0){
       
      }else{
        throw new Error("El código del certificado ya se encuentra registrado.");
      }
    }else{
      throw new Error("El código del certificado ya se encuentra registrado.");
    }

   
    var results;
    // Verificar si el archivo fue subido
    let t5_img = null;
    if (req.file) {
      const results0 = await queryAsync(`SELECT * FROM t5_cursos WHERE t5_id = ?`, [t5_id]);
      if(results0[0].t5_img){
        const filePath = path.join(__dirname, '../uploads/cursos/portadas', results0[0].t5_img);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      
      if(req.file.originalname==="delete.fdc"){
        const folderPath = path.join(__dirname, '../uploads/cursos/portadas');
        fs.readdir(folderPath, (err, files) => {
          const filesToDelete = files.filter(file => path.extname(file).toLowerCase() === ".fdc");
          filesToDelete.forEach(file => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                //console.error(`Error al eliminar el archivo ${file}:`, err);
              } else {
                //console.log(`Archivo ${file} eliminado correctamente.`);
              }
            });
          });
        });
        results = await queryAsync(
          'UPDATE t5_cursos SET t5_img = NULL, t5_codigo = TRIM(UPPER(?)), t5_certificacion = ?, t5_curso = ?, t5_fecha = ?, t5_dificultad = ?, t5_precio = ?, t5_duracion = ?, t5_duracion_h = ?, t5_duracion_m = ?, t5_descripcion = ?, t5_dirigido = ?, t5_requisitos = ?, t5_horario = ?, t5_estado = ?, t4_categorias_t4_id = ?, t6_mentores_t6_id = ?, t6_mentores_t6_id_t = ? WHERE t5_id = ?;',
          [t5_codigo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t == 0 ? null : t6_mentores_t6_id_t, t5_id]
        );
      }else{
        t5_img = req.file.filename; // Obtener el nombre del archivo subido
        results = await queryAsync(
          'UPDATE t5_cursos SET t5_img = ?, t5_codigo = TRIM(UPPER(?)), t5_certificacion = ?, t5_curso = ?, t5_fecha = ?, t5_dificultad = ?, t5_precio = ?, t5_duracion = ?, t5_duracion_h = ?, t5_duracion_m = ?, t5_descripcion = ?, t5_dirigido = ?, t5_requisitos = ?, t5_horario = ?, t5_estado = ?, t4_categorias_t4_id = ?, t6_mentores_t6_id = ?, t6_mentores_t6_id_t = ? WHERE t5_id = ?;',
          [t5_img, t5_codigo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t == 0 ? null : t6_mentores_t6_id_t, t5_id]
        );
      }

    }else{
      results = await queryAsync(
        'UPDATE t5_cursos SET t5_codigo = TRIM(UPPER(?)), t5_certificacion = ?, t5_curso = ?, t5_fecha = ?, t5_dificultad = ?, t5_precio = ?, t5_duracion = ?, t5_duracion_h = ?, t5_duracion_m = ?, t5_descripcion = ?, t5_dirigido = ?, t5_requisitos = ?, t5_horario = ?, t5_estado = ?, t4_categorias_t4_id = ?, t6_mentores_t6_id = ?, t6_mentores_t6_id_t = ? WHERE t5_id = ?;',
        [t5_codigo, t5_certificacion, t5_curso, t5_fecha, t5_dificultad, t5_precio, t5_duracion, t5_duracion_h, t5_duracion_m, t5_descripcion, t5_dirigido, t5_requisitos, t5_horario, t5_estado, t4_categorias_t4_id, t6_mentores_t6_id, t6_mentores_t6_id_t == 0 ? null : t6_mentores_t6_id_t, t5_id]
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};


exports.deleteData = async (req, res) => {
  const t5_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t5_id)) && isFinite(t5_id)) {
      const results0 = await queryAsync(`SELECT * FROM t5_cursos WHERE t5_id = ?`, [t5_id]);
      if(results0[0].t5_img){
        const filePath = path.join(__dirname, '../uploads/cursos/portadas', results0[0].t5_img);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }

      if(results0[0].t5_url){
        const filePath = path.join(__dirname, '../uploads/cursos/promo', results0[0].t5_url);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }
      const results = await queryAsync('DELETE FROM t5_cursos WHERE t5_id = ?', [t5_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};



exports.getDataCodes = async (req, res) => {
  const t5_codigo = req.query.t5_codigo;
  const t5_id = req.query.t5_id;
  try {
    let results;
    const results1 = await queryAsync('SELECT * FROM t5_cursos WHERE TRIM(UPPER(t5_codigo)) = TRIM(UPPER(?)) AND t5_id != ?;', [t5_codigo, t5_id]);
    if(results1.length == 0){
      const results2 = await queryAsync('SELECT * FROM t30_certificados WHERE TRIM(UPPER(t30_codigo)) = TRIM(UPPER(?))', [t5_codigo]);
      if(results2.length == 0){
        results = {rep: false};
      }else{
        results = {rep: true, location: 'SYNC'};
      }
    }else{
      results = {rep: true, location: 'ASYNC'};
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};



exports.getPaginarMatriculados = async (req, res) => {
  try {
    const t5_id = req.query.t5_id || null;
    const pages_size = Number(req.query.size);
    const index = req.query.index || null;

    let query = `SELECT COUNT(*) AS filas FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        WHERE 1=1 `;
    let params = [];
    
    if(t5_id != 0 && t5_id != 'null'){
      query += ` AND A.t5_id = ?`;
      params.push(t5_id);
      console.log("condicion t5_id")
    }

    if (index && index.trim() !== '') {
      query += ` AND CONCAT(D.t3_nombres, ' ', D.t3_apellidos) LIKE ?`;
      const searchTerm = `%${index.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY D.t3_nombres ASC';
    const results = await queryAsync(query, params);

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

exports.getAllDataMatriculados = async (req, res) => {
  try {
    const t5_id = req.query.t5_id || null;
    const size = parseInt(req.query.size);
    const offset = parseInt(req.query.offset);

    let query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        INNER JOIN t5_cursos G ON G.t5_id = B.t5_cursos_t5_id
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        LEFT JOIN t21_carreras F ON F.t21_id = D.t21_carreras_t21_id
        WHERE 1=1 `;
    let params = [];

    if(t5_id != 0 && t5_id != 'null'){
      query += ` AND A.t5_id = ?`;
      params.push(t5_id);
      console.log("condicion t5_id")
    }

    query += ' ORDER BY D.t3_nombres ASC';

    if(size!=null && offset!=null) {
      query += ' LIMIT ? OFFSET ?';
      params.push(size, offset);
    }

    const results = await queryAsync(query, params);

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilterMatriculados = async (req, res) => {
  try {
    const t5_id = req.query.t5_id;
    var query;
    console.log(t5_id)
    console.log(req.query.index)

    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        WHERE A.t5_id = ${t5_id} AND CONCAT(D.t3_nombres, ' ', D.t3_apellidos) LIKE '%${req.query.index}%' ORDER BY D.t3_nombres ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id 
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        WHERE A.t5_id = ${t5_id} AND CONCAT(D.t3_nombres, ' ', D.t3_apellidos) LIKE '%${req.query.index}%' ORDER BY D.t3_nombres ASC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getReporteMatriculadosPDF = async (req, res) => {

  function setCenterLineX(orden) {
      let posLineX = [];
      switch(orden){
          case 1: posLineX[0] =  pdf_margin_left; posLineX[1] =  posLineX[0] + pdf_firma; break;
          case 2: posLineX[0] =  pdf_margin_left + pdf_firma + pdf_firma_margin; posLineX[1] = posLineX[0] + pdf_firma; break;
          case 3: posLineX[0] =  pdf_margin_left + pdf_firma + pdf_firma_margin + pdf_firma + pdf_firma_margin; posLineX[1] = posLineX[0] + pdf_firma; break;
          case 4: posLineX[0] =  pdf_margin_left; posLineX[1] =  posLineX[0] + pdf_firma; break;
          case 5: posLineX[0] =  pdf_margin_left + pdf_firma + pdf_firma_margin; posLineX[1] = posLineX[0] + pdf_firma; break;
          case 6: posLineX[0] =  pdf_margin_left + pdf_firma + pdf_firma_margin + pdf_firma + pdf_firma_margin; posLineX[1] = posLineX[0] + pdf_firma; break;
      }
      return posLineX;
  }
  
  function setCenterX(texto, fontSize, fontType) {
      pdf.setFont(fontType);
      pdf.setFontSize(fontSize);
      const pageWidth = pdf.internal.pageSize.width; // Ancho de la página
      const textWidth = pdf.getStringUnitWidth(texto) * fontSize / pdf.internal.scaleFactor; // Anchura del texto
      const x = (pageWidth - textWidth) / 2; // Posición x centrada
      return x;
  }

  function setCenterTextX(orden, texto) {
      pdf.setFont('Arial');
      pdf.setFontSize('8');
      const textWidth = pdf.getStringUnitWidth(texto) * 8 / pdf.internal.scaleFactor; // Anchura del texto
      let posX;
      switch(orden){
          case 1: posX =  pdf_margin_left + ((pdf_firma - textWidth)/2); break;
          case 2: posX =  pdf_margin_left + pdf_firma + pdf_firma_margin + ((pdf_firma - textWidth)/2); break;
          case 3: posX =  pdf_margin_left + pdf_firma + pdf_firma_margin + pdf_firma + pdf_firma_margin + ((pdf_firma - textWidth)/2); break;
          case 4: posX =  pdf_margin_left + ((pdf_firma - textWidth)/2); break;
          case 5: posX =  pdf_margin_left + pdf_firma + pdf_firma_margin + ((pdf_firma - textWidth)/2); break;
          case 6: posX =  pdf_margin_left + pdf_firma + pdf_firma_margin + pdf_firma + pdf_firma_margin + ((pdf_firma - textWidth)/2); break;
      }
      return posX;
  }

  const pdf  = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
      isUnicode: true
  });

  try {

      const { t5_id } = JSON.parse(req.body.data);

      let query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        INNER JOIN t5_cursos G ON G.t5_id = B.t5_cursos_t5_id
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        LEFT JOIN t21_carreras F ON F.t21_id = D.t21_carreras_t21_id
        WHERE 1=1 `;
      let params = [];

      if(t5_id != 0 && t5_id != 'null' && t5_id != undefined && t5_id != null){
        query += ` AND A.t5_id = ?`;
        params.push(t5_id);
        console.log("condicion t5_id")
      }

      query += ' ORDER BY D.t3_apellidos ASC, D.t3_nombres ASC';
      const results = await queryAsync(query, params);

      // Ruta de la imagen PNG
      const imgData = fs.readFileSync('static/fudec.png');
      const base64Image = 'data:image/png;base64,' + Buffer.from(imgData).toString('base64');

      // add the font to jsPDF
      const myFont = fs.readFileSync('static/Times.ttf', 'binary');
      const myFont2 = fs.readFileSync('static/Times-bold.ttf', 'binary');
      const myFont3 = fs.readFileSync('static/Arial.ttf', 'binary');
      const myFont4 = fs.readFileSync('static/Arial-bold.ttf', 'binary');
      pdf.addFileToVFS("Times.ttf", myFont);
      pdf.addFont("Times.ttf", "Times", "normal");
      pdf.addFileToVFS("Times-bold.ttf", myFont2);
      pdf.addFont("Times-bold.ttf", "Times", "bold");
      pdf.addFileToVFS("Arial.ttf", myFont3);
      pdf.addFont("Arial.ttf", "Arial", "normal");
      pdf.addFileToVFS("Arial-bold.ttf", myFont4);
      pdf.addFont("Arial-bold.ttf", "Arial", "bold");
      pdf.setFont("Times");

      // Encabezados adaptados para alumnos
      var data = [
          ['N°', 'DOCUMENTO', 'APELLIDOS', 'NOMBRES', 'EMAIL', 'CELULAR', 'CARRERA', 'CURSO']
      ];

      // Estadísticas de alumnos
      var total_alumnos = results.length;
      var carreras_count = {};

      for(let i = 0; i < results.length; i++){
          
          // Contar carreras
          const carrera = results[i].t21_carrera || 'Sin carrera';
          if (carreras_count[carrera]) {
              carreras_count[carrera]++;
          } else {
              carreras_count[carrera] = 1;
          }

          var tmp_reportes = [
              i+1, 
              results[i].t2_documento || '',
              results[i].t3_apellidos || '',
              results[i].t3_nombres || '',
              results[i].t2_email || '',
              results[i].t3_celular || '',
              (results[i].t21_carrera || 'Sin carrera').substring(0, 40) + (results[i].t21_carrera && results[i].t21_carrera.length > 40 ? '...' : ''),
              (results[i].t5_curso || 'Sin curso').substring(0, 80) + (results[i].t5_curso && results[i].t5_curso.length > 80 ? '...' : '')
          ];
          data.push(tmp_reportes);
      }


      // Información del curso
      let cursoInfo = '';
      if (results.length > 0 && t5_id != 0 && t5_id != 'null') {
          cursoInfo = `Curso: ${results[0].t5_curso}`;
      } else {
          cursoInfo = 'Todos los cursos';
      }

      // Carrera más común
      let carreraMasComun = 'Sin datos';
      let maxCount = 0;
      for (const [carrera, count] of Object.entries(carreras_count)) {
          if (count > maxCount) {
              maxCount = count;
              carreraMasComun = carrera;
          }
      }


      pdf.autoTable({
          head: [data[0]],
          body: data.slice(1),
          margin: { top: 120 },
          styles: { 
              font: "Arial", 
              fontSize: 8,
              textColor: [0, 0, 0],
              cellPadding: 3,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
          },
          alternateRowStyles: {
              fillColor: [248, 249, 250],
          },
          bodyStyles: { 
              cellPadding: 3,
              valign: 'middle',
              fontSize: 8
          },
          headStyles: {
              fillColor: [68, 114, 196],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 9,
              cellPadding: 4
          },
          columnStyles: {
              0: { cellWidth: 'auto', halign: 'center' }, // N°
              1: { cellWidth: 'auto', halign: 'center' }, // DOCUMENTO
              2: { cellWidth: 'auto', halign: 'left' }, // APELLIDOS
              3: { cellWidth: 'auto', halign: 'left' }, // NOMBRES
              4: { cellWidth: 'auto', halign: 'left' }, // EMAIL
              5: { cellWidth: 'auto', halign: 'center' }, // CELULAR
              6: { cellWidth: 'auto', halign: 'left' }, // CARRERA
              7: { cellWidth: 'auto', halign: 'left' }  // CURSO
          },
          didDrawCell: function (data) {
              // Colorear emails
              if (data.column.index === 4 && data.section === 'body') {
                  pdf.setTextColor(0, 102, 204); // Azul para emails
                  pdf.setFont('Arial', 'normal');
              }
              
              // Resaltar documentos
              if (data.column.index === 1 && data.section === 'body') {
                  pdf.setTextColor(0, 0, 0);
                  pdf.setFont('Arial', 'bold');
              }
          },
          didDrawPage: function (data) {
              // ENCABEZADO MEJORADO
              pdf.addImage(base64Image, 'PNG', 35, 20, 60, 48);
              
              // Título principal
              pdf.setFontSize(16);
              pdf.setFont('Times', 'bold');
              pdf.setTextColor(47, 85, 151);
              pdf.text('FUNDACIÓN PARA EL DESARROLLO DEL CENTRO DEL PERÚ', setCenterX('FUNDACIÓN PARA EL DESARROLLO DEL CENTRO DEL PERÚ', 16, 'Times'), 45);
              
              // Subtítulo
              pdf.setFontSize(12);
              pdf.setFont('Times', 'normal');
              pdf.setTextColor(102, 102, 102);
              pdf.text('"Año de la recuperación y consolidación de la economía peruana"', setCenterX('"Año de la recuperación y consolidación de la economía peruana"', 12, 'Times'), 58);
              
              // Título del reporte con fondo
              pdf.setFillColor(170, 170, 170);
              pdf.roundedRect(30, 72, 570, 16, 3, 3, 'F');
              pdf.setDrawColor(0);
              pdf.roundedRect(30, 72, 570, 16, 3, 3, 'D');
              pdf.setTextColor(0);
              pdf.setFont('Times', 'bold');
              pdf.setFontSize(14);
              pdf.text('REPORTE DE ALUMNOS MATRICULADOS', setCenterX('REPORTE DE ALUMNOS MATRICULADOS', 14, 'Times'), 84);
              
              // Información del curso
              if (cursoInfo) {
                  pdf.setFontSize(9);
                  pdf.setFont('Arial', 'normal');
                  pdf.setTextColor(102, 102, 102);
                  pdf.text(cursoInfo, setCenterX(cursoInfo, 9, 'Arial'), 98);
              }

              // Estadísticas rápidas en recuadros
              const statsY = 105;
              
              // Total alumnos
              pdf.setFillColor(68, 114, 196);
              pdf.roundedRect(120, statsY, 100, 12, 2, 2, 'F');
              pdf.setTextColor(255, 255, 255);
              pdf.setFont('Arial', 'bold');
              pdf.setFontSize(8);
              pdf.text(`Total Alumnos: ${total_alumnos}`, 170, statsY + 8, {align: 'center'});

              // Carreras diferentes
              pdf.setFillColor(40, 167, 69);
              pdf.roundedRect(230, statsY, 100, 12, 2, 2, 'F');
              pdf.text(`Carreras: ${Object.keys(carreras_count).length}`, 280, statsY + 8, {align: 'center'});

              // Carrera más común
              pdf.setFillColor(255, 193, 7);
              pdf.roundedRect(340, statsY, 160, 12, 2, 2, 'F');
              pdf.setTextColor(0, 0, 0);
              const carreraTexto = carreraMasComun.length > 20 ? carreraMasComun.substring(0, 17) + '...' : carreraMasComun;
              pdf.text(`Carrera principal: ${carreraTexto}`, 420, statsY + 8, {align: 'center'});

              // PIE DE PÁGINA MEJORADO
              const currentPage = pdf.internal.getNumberOfPages();
              const pagina = `Página ${currentPage}`;
              
              // Línea del pie
              pdf.setDrawColor(68, 114, 196);
              pdf.setLineWidth(1);
              pdf.line(30, pdf.internal.pageSize.height - 22, 600, pdf.internal.pageSize.height - 22);
              
              // Información del pie
              pdf.setTextColor(102, 102, 102);
              pdf.setFontSize(8);
              pdf.setFont('Arial', 'normal');
              pdf.text('FUDEC UNCP - Sistema de Gestión Académica', 30, pdf.internal.pageSize.height - 13);
              pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Arial'), pdf.internal.pageSize.height - 13);
              pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
          }
          

      });

      // RESUMEN FINAL MEJORADO
      const finalY = pdf.autoTable.previous.finalY + 15;
      
      // Recuadro de resumen
      pdf.setFillColor(248, 249, 250);
      pdf.setDrawColor(68, 114, 196);
      pdf.setLineWidth(1);
      pdf.roundedRect(30, finalY, 570, 45, 3, 3, 'FD');
      
      // Título del resumen
      pdf.setFont('Times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(47, 85, 151);
      pdf.text('RESUMEN DE MATRICULACIÓN', setCenterX('RESUMEN DE MATRICULACIÓN', 12, 'Times'), finalY + 12);
      
      // Estadísticas del resumen
      pdf.setFont('Arial', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      const statsText = [
          `Total de alumnos matriculados: ${total_alumnos}`,
          `Carreras representadas: ${Object.keys(carreras_count).length}`,
          `Carrera más común: ${carreraMasComun} (${maxCount} alumnos)`,
          `Fecha de generación: ${getFormattedDate()}`
      ];
      
      // Distribuir estadísticas en 2 filas
      const col1X = 80;
      const col2X = 350;
      
      pdf.text(statsText[0], col1X, finalY + 22);
      pdf.text(statsText[1], col2X, finalY + 22);
      pdf.text(statsText[2], col1X, finalY + 32);
      
      // Fecha destacada
      pdf.setFont('Arial', 'bold');
      pdf.setTextColor(0, 123, 255);
      pdf.text(statsText[3], col2X, finalY + 32);

      // Top 3 carreras
      if (Object.keys(carreras_count).length > 1) {
          const topCarreras = Object.entries(carreras_count)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3);
          
          pdf.setFont('Arial', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(102, 102, 102);
          pdf.text('Top carreras:', col1X, finalY + 40);
          
          let topText = '';
          topCarreras.forEach(([carrera, count], index) => {
              topText += `${index + 1}. ${carrera.substring(0, 15)}${carrera.length > 15 ? '...' : ''} (${count})`;
              if (index < topCarreras.length - 1) topText += ' | ';
          });
          
          pdf.text(topText, col1X + 60, finalY + 40);
      }

     

      const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
      const nombreArchivo = `Matriculados_${uniqueId}.pdf`;
      const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

      

      pdf.save(filePath, (err) => {
          console.log('PDF guardado exitosamente en:', filePath);
          return res.sendFile(filePath, (err) => {
          if (err) {
              console.error('Error al enviar el archivo:', err);
              return res.status(500).send('Error interno del servidor');
          }
          });
      });

       

      return res.sendFile(filePath);
  
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

};

exports.getReporteMatriculadosExcel = async (req, res) => {

  try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Alumnos');
      const columnas = [
              { header: 'N°', key: 'numero', width: 8 },
              { header: 'DOCUMENTO', key: 'documento', width: 18 },
              { header: 'APELLIDOS', key: 'apellidos', width: 30 },
              { header: 'NOMBRES', key: 'nombres', width: 30 },
              { header: 'EMAIL', key: 'email', width: 35 },
              { header: 'CELULAR', key: 'celular', width: 15 },
              { header: 'CARRERA', key: 'carrera', width: 40 },
              { header: 'CURSO', key: 'curso', width: 80 },
      ];
      worksheet.columns = columnas;
      var data_E = [];

      const { t5_id } = JSON.parse(req.body.data);
      
      let query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        INNER JOIN t5_cursos G ON G.t5_id = B.t5_cursos_t5_id
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        LEFT JOIN t21_carreras F ON F.t21_id = D.t21_carreras_t21_id
        WHERE 1=1 `;
      let params = [];

      if(t5_id != 0 && t5_id != 'null' && t5_id != undefined && t5_id != null){
        query += ` AND A.t5_id = ?`;
        params.push(t5_id);
        console.log("condicion t5_id")
      }

      query += ' ORDER BY D.t3_apellidos ASC, D.t3_nombres ASC';
      const results = await queryAsync(query, params);

      for(let j = 0; j <  results.length; j++){
        data_E.push(
          [
            j+1, 
            results[j].t2_documento || '',
            results[j].t3_apellidos || '',
            results[j].t3_nombres || '',
            results[j].t2_email || '',
            results[j].t3_celular || '',
            results[j].t21_carrera || 'Sin carrera',
            results[j].t5_curso || 'Sin curso'
          ]
        );
      }
      
        

    // 1. CONFIGURAR ENCABEZADOS CON ESTILO
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25; // Aumentar altura del encabezado
    // Aplicar estilo a cada celda del encabezado
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' } // Azul corporativo
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' } // Texto blanco
        };
        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    // 2. AGREGAR TÍTULO PRINCIPAL
    worksheet.spliceRows(1, 0, [''], ['']); // Insertar 2 filas vacías al inicio
    worksheet.mergeCells('A1:G1'); // Combinar celdas para el título (7 columnas)
    const titleCell = worksheet.getCell('A1');
    
    // Obtener nombre del curso si hay filtro específico
    let tituloReporte = 'REPORTE DE ALUMNOS - FUNDACIÓN PARA EL DESARROLLO DEL CENTRO DEL PERÚ';
    if(results.length > 0 && t5_id != 0 && t5_id != 'null'){
        tituloReporte = `REPORTE DE ALUMNOS - ${results[0].t5_curso.toUpperCase()}`;
    }
    
    titleCell.value = tituloReporte;
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF2F5597' }
    };
    titleCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
    };

    // 3. AGREGAR INFORMACIÓN ADICIONAL
    let infoAdicional = `Total de alumnos: ${results.length}`;
    if(results.length > 0 && t5_id != 0 && t5_id != 'null'){
        infoAdicional += ` | Curso: ${results[0].t5_curso}`;
    }
    infoAdicional += ` | Fecha de generación: ${new Date().toLocaleDateString('es-PE')}`;

    worksheet.mergeCells('A2:G2'); // Combinar celdas para info adicional
    const infoCell = worksheet.getCell('A2');
    infoCell.value = infoAdicional;
    infoCell.font = {
        name: 'Arial',
        size: 10,
        italic: true,
        color: { argb: 'FF666666' }
    };
    infoCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };

    // Ajustar altura de las filas del título
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 20;

    // Los encabezados ahora están en la fila 3
    const newHeaderRow = worksheet.getRow(3);
    newHeaderRow.height = 25;

    // Reaplicar estilo a los encabezados en su nueva posición
    newHeaderRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    // Modificar el bucle existente para aplicar estilos a datos de alumnos
    for (let i = 0; i < data_E.length; i++) {
        const fila = worksheet.getRow(i + 4); // Empezar desde la fila 4 (después del título y encabezados)
        fila.values = data_E[i];
        fila.height = 20; // Altura estándar para filas de datos

        // Aplicar estilo a cada celda de la fila
        fila.eachCell((cell, colNumber) => {
            // Bordes para todas las celdas
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
            };

            // Alineación por columna según el HTML
            switch (colNumber) {
                case 1: // N°
                case 2: // DOCUMENTO
                case 6: // CELULAR
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    break;
                case 3: // APELLIDOS
                case 4: // NOMBRES
                case 7: // CARRERA
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                    break;
                case 5: // EMAIL
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    break;
                case 8: // CURSO
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                    break;
                default:
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }

            // Colores alternados para filas
            if (i % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8F9FA' } // Gris muy claro
                };
            }

            // Estilo especial para emails
            if (colNumber === 5) {
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    color: { argb: 'FF0066CC' } // Azul para emails
                };
            }

            // Estilo especial para documentos
            if (colNumber === 2) {
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    bold: true,
                    color: { argb: 'FF333333' }
                };
            }

            // Fuente estándar para otras celdas
            if (!cell.font || (!cell.font.bold && !cell.font.color)) {
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    color: { argb: 'FF333333' }
                };
            }
        });
    }


    //console.log(`Archivo Excel creado`);
             
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const nombreArchivo = `Alumnos_${uniqueId}.xlsx`;
    const filePath = path.join(__dirname,'..','reportes',nombreArchivo);
      
    await workbook.xlsx.writeFile(filePath)
    return res.sendFile(filePath);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }


};





exports.postDataPresentacion = async (req, res) => {
  try {
    const { t5_id, t5_url_old } = JSON.parse(req.body.data);
    if (t5_id == null) {
      throw new Error("Revise los campos obligatorios.");
    }
    // Verificar si el archivo fue subido

    let results;
    if (req.file) {
      const results0 = await queryAsync(`SELECT * FROM t5_cursos WHERE t5_id = ?`, [t5_id]);
      if(results0[0].t5_url){
        const filePath = path.join(__dirname, '../uploads/cursos/promo', results0[0].t5_url);
        if (fs.existsSync(filePath)) {
          // Eliminar el archivo
          fs.unlink(filePath, (err) => {
            if (err) {
              throw err;
            }
          });
        } else {
          console.log('Archivo no encontrado.');
        }
      }

      if(req.file.originalname==="delete.fdc"){
        const folderPath = path.join(__dirname, '../uploads/cursos/promo');
        fs.readdir(folderPath, (err, files) => {
          const filesToDelete = files.filter(file => path.extname(file).toLowerCase() === ".fdc");
          filesToDelete.forEach(file => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                //console.error(`Error al eliminar el archivo ${file}:`, err);
              } else {
                //console.log(`Archivo ${file} eliminado correctamente.`);
              }
            });
          });
        });

        results = await queryAsync(
          'UPDATE t5_cursos SET t5_url = NULL WHERE t5_id = ?;',
          [t5_id]
        );

      }else{
        const t5_url_new = req.file.filename; // Obtener el nombre del archivo subido
        results = await queryAsync(
          'UPDATE t5_cursos SET t5_url = ? WHERE t5_id = ?;',
          [t5_url_new, t5_id]
        );
      }
    }else{
      results = {serverStatus: 2}
    }

    return res.status(200).json(results);

  } catch (error) {
    console.log(error.message)
    return res.status(400).send(error.message);
  }
};

exports.getPaginarFavoritos = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if (index.trim() != "") {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t24_favoritos 
        INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
        WHERE t2_alumnos_t2_id = ${req.t2_id} AND t5_curso LIKE '%${index}%' ORDER BY t5_id DESC;`);
    } else {
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t24_favoritos
        INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
        WHERE t2_alumnos_t2_id = ${req.t2_id};`);
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

exports.getAllDataFavoritos = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t24_favoritos 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id 
      WHERE t2_alumnos_t2_id = ${req.t2_id} 
      ORDER BY t5_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t24_favoritos 
      INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id 
      WHERE t2_alumnos_t2_id = ${req.t2_id} 
      ORDER BY t5_id DESC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};




exports.getPaginarIntranet = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const certificacion = req.query.certificacion?.trim() || null;
    const precio = req.query.precio?.trim() || null;

    let sql = "SELECT COUNT(*) AS filas FROM t5_cursos WHERE t5_estado >= 1 ";
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
    if (precio != 'null' && precio !== "") {
      if(precio == 0){
        sql += " AND t5_precio = 0";

      }else{
        sql += " AND t5_precio > 0";
      }
    }
    sql += " ORDER BY t5_id DESC;";

    //console.log(sql);
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

exports.getAllDataIntranet = async (req, res) => {
  try {
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t5_cursos INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id WHERE t5_estado >= 1 ORDER BY t5_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = "SELECT * FROM t5_cursos INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id WHERE t5_estado >= 1 ORDER BY t5_id DESC;";
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataIntranet = async (req, res) => {
  const t5_id = req.params.id;
  try {
    const results = await queryAsync(`SELECT *, COUNT(t11_id) AS 't11_id' FROM t5_cursos 
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id 
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id 
      LEFT JOIN t11_miscursos ON t5_cursos_t5_id = t5_id
      WHERE t5_estado >= 1 AND t5_id = ? GROUP BY t5_id;`, [t5_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilterIntranet = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const certificacion = req.query.certificacion?.trim() || null;
    const precio = req.query.precio?.trim() || null;
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT * FROM t5_cursos
      INNER JOIN t4_categorias ON t4_categorias_t4_id = t4_id
      INNER JOIN t6_mentores ON t6_mentores_t6_id = t6_id
      WHERE t5_estado >= 1 
    `;
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
    if (precio != 'null' && precio !== "") {
      if(precio == 0){
        sql += " AND t5_precio = 0";

      }else{
        sql += " AND t5_precio > 0";
      }
    }

    sql += " ORDER BY t5_id DESC";

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





exports.getDataAulaVirtual = async (req, res) => {
  const t5_id = req.params.id;
  let results0;
  try {
    if(req.t2_id) {
      results0 = await queryAsync(`SELECT A.*, B.*, D.*, E.*,
        C.t6_mentor,   
        C.t6_foto,               
        m2.t6_mentor AS t6_mentor_t, 
        m2.t6_foto AS t6_foto_t,
        m2.t6_celular AS t6_celular_t,
        COUNT(CASE WHEN t8_estado = 1 THEN t8_id END) AS clases_realizadas,
        COUNT(CASE WHEN t8_estado != 2 THEN t8_id END) AS clases_totales
        FROM t11_miscursos A
        INNER JOIN t5_cursos B ON A.t5_cursos_t5_id = B.t5_id 
        INNER JOIN t6_mentores C ON B.t6_mentores_t6_id = C.t6_id
        LEFT JOIN t6_mentores AS m2 ON B.t6_mentores_t6_id_t = m2.t6_id     
        LEFT JOIN t7_modulos D ON D.t5_cursos_t5_id = B.t5_id
        LEFT JOIN t8_clases E ON E.t7_modulos_t7_id = D.t7_id
        WHERE B.t5_tipo = 2 AND A.t5_cursos_t5_id = ? AND A.t2_alumnos_t2_id = ?;`, [t5_id, req.t2_id]);
    }else if(req.t6_id) {
      results0 = await queryAsync(`SELECT 
            m1.t6_mentor,   
            m1.t6_foto,               
            m2.t6_mentor AS t6_mentor_t, 
            m2.t6_foto AS t6_foto_t,
            m2.t6_celular AS t6_celular_t,
            t5_cursos.*,            
            COUNT(CASE WHEN t8_estado = 1 THEN t8_id END) AS clases_realizadas,
            COUNT(CASE WHEN t8_estado != 2 THEN t8_id END) AS clases_totales
        FROM t5_cursos
        INNER JOIN t6_mentores AS m1 ON t5_cursos.t6_mentores_t6_id = m1.t6_id         
        LEFT JOIN t6_mentores AS m2 ON t5_cursos.t6_mentores_t6_id_t = m2.t6_id      
        LEFT JOIN t7_modulos ON t5_cursos_t5_id = t5_id
        LEFT JOIN t8_clases ON t7_modulos_t7_id = t7_id
        WHERE t5_tipo = 2 
          AND t5_id = ? 
          AND (m1.t6_id = ? OR m2.t6_id = ?)
        GROUP BY t5_cursos.t5_id;`, [t5_id, req.t6_id, req.t6_id]);
    }else if(req.t1_id){
      results0 = await queryAsync(`SELECT 
            m1.t6_mentor,   
            m1.t6_foto,               
            m2.t6_mentor AS t6_mentor_t, 
            m2.t6_foto AS t6_foto_t,
            m2.t6_celular AS t6_celular_t,
            t5_cursos.*,            
            COUNT(CASE WHEN t8_estado = 1 THEN t8_id END) AS clases_realizadas,
            COUNT(CASE WHEN t8_estado != 2 THEN t8_id END) AS clases_totales
        FROM t5_cursos
        INNER JOIN t6_mentores AS m1 ON t5_cursos.t6_mentores_t6_id = m1.t6_id         
        LEFT JOIN t6_mentores AS m2 ON t5_cursos.t6_mentores_t6_id_t = m2.t6_id      
        LEFT JOIN t7_modulos ON t5_cursos_t5_id = t5_id
        LEFT JOIN t8_clases ON t7_modulos_t7_id = t7_id
        WHERE t5_tipo = 2 
          AND t5_id = ? 
        GROUP BY t5_cursos.t5_id;`, [t5_id]);
    }else{
      throw new Error("No tiene acceso a este curso.");
    }

    if(results0.length == 0){
      throw new Error("No tiene acceso a este curso.");
    }
    return res.status(200).json(results0[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllDataMatriculadosAulaVirtual = async (req, res) => {
  try {
    const t5_id = req.query.t5_id;
    var query;
    if (req.query.size && req.query.offset) {
      query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        WHERE A.t5_id = ${t5_id} ORDER BY D.t3_apellidos ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`;
    } else {
      query = `SELECT * FROM t5_cursos A
        INNER JOIN t11_miscursos B ON B.t5_cursos_t5_id = A.t5_id
        INNER JOIN t2_alumnos C ON C.t2_id = B.t2_alumnos_t2_id
        INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id
        LEFT JOIN t9_certificados E ON E.t11_miscursos_t11_id = B.t11_id 
        WHERE A.t5_id = ${t5_id} ORDER BY D.t3_apellidos ASC;`;
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.putDataMinAsistenciaAulaVirtual = async (req, res) => {
  const t5_id = req.params.id;
  const { t5_asistencia } = JSON.parse(req.body.data);

  try{
    if (t5_asistencia == null || t5_asistencia < 0 || t5_asistencia > 100) {
      throw new Error("El porcentaje de asistencia debe estar entre 0 y 100.");
    }
    if(!req.t6_id){
        throw new Error("Acceso denegado.");
    }

    const results = await queryAsync(`UPDATE t5_cursos 
                    SET t5_asistencia = ? 
                    WHERE t5_id = ? AND (t6_mentores_t6_id = ? OR t6_mentores_t6_id_t = ?)`, 
                    [t5_asistencia, t5_id, req.t6_id, req.t6_id]);

    
    const results1 = await queryAsync(`
                SELECT 
                  A.*, 
                  E.t5_asistencia, 
                  COUNT(CASE WHEN A.t37_estado = 1 THEN 1 END)*100/COUNT(t8_id) AS t36_asistencia,
                  CASE 
                    WHEN COUNT(CASE WHEN A.t37_estado = 1 THEN 1 END)*100/COUNT(t8_id) >= E.t5_asistencia THEN 1 
                    ELSE 0 
                  END AS t36_estado
                FROM t37_asistencias_detalles A
                INNER JOIN t8_clases B ON A.t8_clases_t8_id = B.t8_id
                INNER JOIN t36_asistencias C ON A.t36_asistencias_t36_id = C.t36_id
                INNER JOIN t11_miscursos D ON C.t11_miscursos_t11_id = D.t11_id 
                INNER JOIN t5_cursos E ON D.t5_cursos_t5_id = E.t5_id
                WHERE E.t5_id = ?
                  AND B.t8_estado != 2 
                  AND (E.t6_mentores_t6_id = ? OR E.t6_mentores_t6_id_t = ?)
                GROUP BY A.t36_asistencias_t36_id
                ORDER BY B.t8_id ASC;
          `, [t5_id, req.t6_id, req.t6_id]);

    for (let i = 0; i < results1.length; i++) {
      await queryAsync(`
              UPDATE t36_asistencias 
              SET t36_asistencia = ?, t36_estado = ?
              WHERE t36_id = ?
      `, [results1[i].t36_asistencia, results1[i].t36_estado, results1[i].t36_asistencias_t36_id]);
    }

    return res.status(200).json(results);

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
