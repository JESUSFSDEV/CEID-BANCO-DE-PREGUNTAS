const db = require('../config/db');
const ExcelJS = require('exceljs');



exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const t30_id = req.query.t30_id;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_id} AND t31_nombres LIKE '%${index}%'ORDER BY t31_id ASC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_id} ORDER BY t31_id ASC;`);
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
    const t30_id = req.query.t30_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_id} ORDER BY t31_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_id} ORDER BY t31_id DESC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t31_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t31_participantes WHERE t31_id = ?', [t31_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const t30_id = req.query.t30_id;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_id} AND t31_nombres LIKE '%${req.query.index}%' ORDER BY t31_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_id} AND t31_nombres LIKE '%${index}%' ORDER BY t31_id DESC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {

    const { t31_nombres, t31_apellidos, t31_participacion, t30_certificados_t30_id } = JSON.parse(req.body.data);
    if (!t31_nombres || !t31_participacion || t30_certificados_t30_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }
    
    const results0 = await queryAsync(`SELECT COUNT(*) + 1 AS t31_nro, MAX(t31_nro) AS t31_nro_max FROM t31_participantes WHERE t30_certificados_t30_id = ?;`, [t30_certificados_t30_id]);
    while(results0[0].t31_nro <= results0[0].t31_nro_max){
      results0[0].t31_nro += 1;
    }
    const results1 = await queryAsync(`SELECT * FROM t30_certificados WHERE t30_id = ?;`, [t30_certificados_t30_id]);
    const t31_codigo = results1[0].t30_codigo + '-' + results0[0].t31_nro.toString().padStart(5, '0') + '-' + results1[0].t30_year;

    const results = await queryAsync(
      'INSERT INTO t31_participantes (t31_nro, t31_nombres, t31_apellidos, t31_participacion, t31_codigo, t30_certificados_t30_id) VALUES (?, ?, ?, ?, ?, ?)',
      [results0[0].t31_nro, t31_nombres, t31_apellidos, t31_participacion, t31_codigo, t30_certificados_t30_id]
    );
    
    return res.status(200).json(results);
  } catch (error) {
    console.log(error)
    return res.status(400).send(error);
  }
};

exports.putData = async (req, res) => {
  try {
    const t31_id = req.params.id;
    const { t31_nro, t31_nombres, t31_apellidos, t31_participacion, t31_codigo } = JSON.parse(req.body.data);
    if (!t31_nro || !t31_nombres || !t31_participacion || !t31_codigo ) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'UPDATE t31_participantes SET t31_nro = ?, t31_nombres = ?, t31_apellidos = ?, t31_participacion = ?, t31_codigo = ? WHERE t31_id = ?',
      [t31_nro, t31_nombres, t31_apellidos, t31_participacion, t31_codigo, t31_id]
    );
    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t31_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t31_id)) && isFinite(t31_id)) {
      const results = await queryAsync('DELETE FROM t31_participantes WHERE t31_id = ?', [t31_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


exports.postDataImport = async (req, res) => {

  const { t30_certificados_t30_id } = JSON.parse(req.body.data);

  if (t30_certificados_t30_id==null) {
    throw new Error("Revise los campos obligatorios.");
  }

  try {
      if(!req.file) {
          return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }
      const workbook = new ExcelJS.Workbook();
      try{
          await workbook.xlsx.readFile(req.file.path);
      }catch (excelError) {
          // Manejar el error si no es un archivo Excel válido
          console.error(excelError);
          return res.status(400).json({ error: 'El archivo no es un archivo Excel válido' });
      }
      const worksheet = workbook.getWorksheet(1);


      const data = [];
      worksheet.eachRow((row, rowNumber) => {
          const rowData = [];
          row.eachCell((cell, colNumber) => {
              rowData.push(cell.value.toString());
          });
          data.push(rowData);
      });

      if(data.length==1){
        return res.status(400).json({ error: 'No se encontraron registros.' });
      }

      const results0 = await queryAsync(`SELECT COUNT(*) AS t31_nro FROM t31_participantes WHERE t30_certificados_t30_id = ?;`, [t30_certificados_t30_id]);
      const results1 = await queryAsync(`SELECT * FROM t30_certificados WHERE t30_id = ?;`, [t30_certificados_t30_id]);
     
      var query = "INSERT INTO t31_participantes (t31_nro, t31_nombres, t31_apellidos, t31_participacion, t31_codigo, t30_certificados_t30_id) VALUES ";
      for (let i = 1; i < data.length; i++) {
          let arrayInterno = data[i];
          
          //console.log(arrayInterno);

          if( arrayInterno.length==3 &&
            (arrayInterno[0].length>0 && arrayInterno[0].trim()!="") && 
            (arrayInterno[1].length>0 && arrayInterno[1].trim()!="") && 
            (arrayInterno[2].length>0 && arrayInterno[2].trim()!="")
          ){
            let t31_codigo = results1[0].t30_codigo + '-' + (i+results0[0].t31_nro).toString().padStart(5, '0') + '-' + results1[0].t30_year;
            query += `(${i+results0[0].t31_nro},${db.escape(arrayInterno[0])},${db.escape(arrayInterno[1])},${db.escape(arrayInterno[2])},'${t31_codigo}',${t30_certificados_t30_id}),`;
          }else{

            if( arrayInterno.length>=4 &&
              (arrayInterno[0].length>0 && arrayInterno[0].trim()!="") && 
              (arrayInterno[1].length>0 && arrayInterno[1].trim()!="") && 
              (arrayInterno[2].length>0 && arrayInterno[2].trim()!="") && 
              (arrayInterno[3].length>0 && arrayInterno[3].trim()!="")
            ){
              let t31_codigo = arrayInterno[3];
              query += `(${i+results0[0].t31_nro},${db.escape(arrayInterno[0])},${db.escape(arrayInterno[1])},${db.escape(arrayInterno[2])},'${t31_codigo}',${t30_certificados_t30_id}),`;
            }else{
              return res.status(400).json({ error: 'El archivo Excel no tiene las columnas solicitadas' });
            }

          }
          
      }

      query = query.slice(0,-1);

      const results = await queryAsync(query);
      return res.status(200).json(results);
      
  } catch (error) {
      return res.status(500).json({ error: 'Error al momento de importar datos en la DB.' });
  }
};


exports.postDataExport = async (req, res) => {
  try {
  
    const { t30_certificados_t30_id } = JSON.parse(req.body.data);
    const results = await queryAsync(`SELECT * FROM t31_participantes WHERE t30_certificados_t30_id = ${t30_certificados_t30_id} ORDER BY t31_id DESC;`); 

    var data = [];
    for(let i = 0; i < results.length; i++){
      data.push(
        {
          t31_nombres: results[i].t31_nombres, 
          t31_apellidos: results[i].t31_apellidos,
          t31_participacion: results[i].t31_participacion,
          t31_codigo: results[i].t31_codigo
        }
      );
    }

    // Crear un nuevo libro de trabajo (workbook)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Participantes');

    // Agregar encabezados
    worksheet.columns = [
        { header: 'NOMBRE', key: 't31_nombres', width: 40 },
        { header: 'APELLIDOS', key: 't31_apellidos', width: 40 },
        { header: 'TIPO', key: 't31_participacion', width: 30 },
        { header: 'CODIGO', key: 't31_codigo', width: 30 }
    ];

    // Agregar las filas con los datos
    data.forEach(participante => {
        worksheet.addRow(participante);
    });

    // Configurar los encabezados de la respuesta para descargar el archivo
    res.setHeader('Content-Disposition', 'attachment; filename=participantes.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Escribir el archivo Excel a la respuesta HTTP
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
      console.log('Error al exportar el Excel:', error);
      res.status(500).send('Error al exportar el archivo');
  }
};



// Función auxiliar para realizar consultas a la base de datos con async/await
function queryAsync(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error.error);
      } else {
        resolve(results);
      }
    });
  });
}





