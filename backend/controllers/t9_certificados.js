const db = require('../config/db');
const { customAlphabet } = require("nanoid");

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t9_certificados 
        INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id 
        WHERE t2_alumnos_t2_id = ${req.t2_id} ORDER BY t9_id DESC;`);
    }else{
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t9_certificados INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id WHERE t2_alumnos_t2_id = ${req.t2_id};`);
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
      query = `SELECT * FROM t9_certificados A
      INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id 
      INNER JOIN t5_cursos C ON B.t5_cursos_t5_id = C.t5_id 
      INNER JOIN t4_categorias D ON C.t4_categorias_t4_id = D.t4_id
      INNER JOIN t6_mentores E ON C.t6_mentores_t6_id = E.t6_id 
      WHERE B.t2_alumnos_t2_id = ${req.t2_id} ORDER BY t9_id DESC
      LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT * FROM t9_certificados A
      INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id 
      INNER JOIN t5_cursos C ON B.t5_cursos_t5_id = C.t5_id 
      INNER JOIN t4_categorias D ON C.t4_categorias_t4_id = D.t4_id
      INNER JOIN t6_mentores E ON C.t6_mentores_t6_id = E.t6_id 
      WHERE B.t2_alumnos_t2_id = ${req.t2_id} ORDER BY t9_id DESC
      ;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.getWeb = async (req, res) => {
  const t9_codigo = req.query.code.trim();

  try {

    var results;

    if(t9_codigo.length >= 4){

      results = await queryAsync(`
        SELECT * FROM t9_certificados 
        INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id 
        INNER JOIN t5_cursos ON t5_cursos_t5_id = t5_id 
        WHERE UPPER(REPLACE(t9_codigo, '-', '_')) = UPPER(REPLACE(?, '-', '_'));
      `, [t9_codigo]);

      if(results.length==0){
        results = await queryAsync(`
          SELECT * FROM t31_participantes 
          INNER JOIN t30_certificados ON t30_certificados_t30_id = t30_id 
          WHERE UPPER(REPLACE(t31_codigo, '-', '_')) = UPPER(REPLACE(?, '-', '_'));
        `, [t9_codigo]);
        
      }
      
    }else{
      return res.status(200).json({});
    }


    if(results.length>0){
      return res.status(200).json(results[0]);
    }else{
      return res.status(200).json({});
    }

    
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
    const t5_id = req.query.index;

    var query;
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t9_certificados 
      INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id 
      WHERE t5_cursos_t5_id = ${t5_id} AND t2_alumnos_t2_id = ${req.t2_id};`; 
    }else{
      query = `SELECT * FROM t9_certificados 
      INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id 
      WHERE t5_cursos_t5_id = ${t5_id} AND t2_alumnos_t2_id = ${req.t2_id};`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results[0]);

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

exports.postDataRegenerarCertificado = async (req, res) => {

  try {

    const { t5_id, t2_id, t11_id, t9_id } = JSON.parse(req.body.data);

    if (t5_id == null || t2_id == null || t11_id == null || t9_id == null) {
      throw new Error("Revise los campos obligatorios.");
    }

    const cert = await queryAsync(`SELECT A.*, C.*, D.*, E.* FROM t9_certificados A
      INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id 
      INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
      INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id 
      INNER JOIN t5_cursos E ON B.t5_cursos_t5_id = E.t5_id 
      WHERE B.t2_alumnos_t2_id = ? AND B.t5_cursos_t5_id = ? GROUP BY A.t9_id;`, [t2_id, t5_id]);

    if(cert.length==0){
      throw new Error("El alumno aún no completó este curso.");
    }

    const t9_codigo = cert[0].t9_codigo;

    const certificado_conf = await queryAsync(`SELECT * FROM t10_certificados_conf WHERE t10_estado = 1 AND t5_cursos_t5_id = ?;`, [t5_id]);
    const labels = await queryAsync(`SELECT t20_labels.* FROM t20_labels INNER JOIN t10_certificados_conf ON t10_id = t10_certificados_conf_t10_id WHERE t5_cursos_t5_id = ?;`, [t5_id]);
    if(certificado_conf.length==0){
      throw new Error("El certificado aun no está habilitado.");
    }

    var cod_QR;
    const generateQRCode = async (text) => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(text, {margin: 1});
        cod_QR = qrCodeDataURL; 
      } catch (err) {
        console.error(err);
      }
    };
    await generateQRCode('https://fudecuncp.pe/validar/'+t9_codigo);
    

    // Crear el nombre del archivo
    const fileName = t9_codigo+`.pdf`;
    const filePath = path.join(__dirname, '../uploads/certificados-async', fileName);

    // Crear el documento PDF
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    // Guardar el PDF en el sistema de archivos
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Agregar contenido al PDF
    doc.image('uploads/certificados-conf/'+certificado_conf[0].t10_img, 0, 0, { height: 595.28, width: 841.89 }); // Fondo (A4)

    for(let i = 0; i < labels.length; i++){
      if(labels[i].t20_hoja==1){
        if(labels[i].t20_tipo=='NOMBRES'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(cert[0].t3_nombres + ' ' + cert[0].t3_apellidos, labels[i].t20_x, labels[i].t20_y);
        }
        if(labels[i].t20_tipo=='CODIGO'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(t9_codigo, labels[i].t20_x, labels[i].t20_y);
        }
        if(labels[i].t20_tipo=='QR'){
          doc.image(cod_QR, labels[i].t20_x, labels[i].t20_y, { width: labels[i].t20_w, height: labels[i].t20_h });
        }

        //const fecha = new Date();
        const fecha = cert[0].t9_fecha ? new Date(cert[0].t9_fecha + 'T00:00:00') : new Date();
        const meses = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        if(labels[i].t20_tipo=='FECHA-DIA'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(fecha.getDate().toString().padStart(2, '0'), labels[i].t20_x, labels[i].t20_y);
        }
        if(labels[i].t20_tipo=='FECHA-MES'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(meses[fecha.getMonth()], labels[i].t20_x, labels[i].t20_y);
        }
        if(labels[i].t20_tipo=='FECHA-AÑO'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(fecha.getFullYear().toString().slice(-2), labels[i].t20_x, labels[i].t20_y);
        }
      }
    }


    if(certificado_conf[0].t10_imgrev!=null){
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
      doc.image('uploads/certificados-conf/'+certificado_conf[0].t10_imgrev, 0, 0, { height: 595.28, width: 841.89 }); // Fondo (A4)

      let promedio_n = 0;
      let promedio = 0;
      for(let i = 0; i < labels.length; i++){
        if(labels[i].t20_hoja==2){

          if(labels[i].t20_tipo=='CODIGO'){
            doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(t9_codigo, labels[i].t20_x, labels[i].t20_y);
          }

          if(labels[i].t20_tipo.slice(0,5)=='NOTA-'){
            let nota = await queryAsync(`SELECT * FROM t14_calificaciones 
              INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id 
              WHERE t14_estado = 2 AND t7_modulos_t7_id = ? AND t5_cursos_t5_id = ? AND t2_alumnos_t2_id = ?;`, [labels[i].t20_tipo.replace('NOTA-', ''), t5_id, t2_id]);
            doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(nota[0].t14_nota, labels[i].t20_x, labels[i].t20_y);
            promedio_n += 1;
            promedio += nota[0].t14_nota;
          }

        }
      }

      for(let i = 0; i < labels.length; i++){
        if(labels[i].t20_hoja==2){
          if(labels[i].t20_tipo=='PROMEDIO'){
            let p_final = promedio / promedio_n;
            if (Number.isInteger(p_final)) {
              p_final.toString(); // Convertir a cadena sin decimales
            } else {
              p_final.toFixed(1); // Mostrar solo un decimal
            }
            doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(p_final, labels[i].t20_x, labels[i].t20_y);
          }
        }
      }
    }

    // Finalizar el documento
    await doc.end();
    
    const results = await queryAsync('UPDATE t9_certificados SET t9_codigo = ?, t9_estado = ? WHERE t9_id = ?;', [t9_codigo, 1, cert[0].t9_id]);
    console.log("gertificado regenerado: ", t9_codigo);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(400).send(error.message);
  }

  
}

/* INTRANET */
/* INTRANET */

exports.postIntranetData = async (req, res) => {
  try {
    const { t5_cursos_t5_id } = JSON.parse(req.body.data)

    if (t5_cursos_t5_id==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    const cert = await queryAsync(`SELECT A.*, C.*, D.*, E.* FROM t9_certificados A
      INNER JOIN t11_miscursos B ON A.t11_miscursos_t11_id = B.t11_id 
      INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
      INNER JOIN t3_perfiles D ON C.t2_id = D.t2_alumnos_t2_id 
      INNER JOIN t5_cursos E ON B.t5_cursos_t5_id = E.t5_id 
      WHERE B.t2_alumnos_t2_id = ? AND B.t5_cursos_t5_id = ? GROUP BY A.t9_id;`, [req.t2_id, t5_cursos_t5_id]);

    if(cert.length==0){
      throw new Error("Aún no completaste este curso.");
    }
    if(cert[0].t9_estado==1){
      throw new Error("El certificado ya fue generado anteriormente.");
    }


    // Alfabeto solo con letras mayúsculas
    //const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
    //t9_codigo = nanoid();

    const  query_nro_codigos = await queryAsync(`SELECT COUNT(*) AS nro_codigos FROM t9_certificados INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id WHERE t5_cursos_t5_id = ? AND t9_estado = 1;`, [t5_cursos_t5_id]);
    let nro_codigos_tmp = query_nro_codigos[0].nro_codigos + 1;
    let nro_codigos = nro_codigos_tmp.toString().padStart(4, '0');

    let t9_codigo = cert[0].t5_codigo + '-' + cert[0].t2_documento + '-' + nro_codigos + '-' + new Date().getFullYear();
    let  codigo = await queryAsync(`SELECT * FROM t9_certificados WHERE t9_codigo = ?;`, [t9_codigo]);

    while(codigo.length>0){
      nro_codigos_tmp += 1;
      nro_codigos = nro_codigos_tmp.toString().padStart(4, '0');
      t9_codigo = cert[0].t5_codigo + '-' + cert[0].t2_documento + '-' + nro_codigos + '-' + new Date().getFullYear();
      codigo = await queryAsync(`SELECT * FROM t9_certificados WHERE t9_codigo = ?;`, [t9_codigo]);
    }

    const certificado_conf = await queryAsync(`SELECT * FROM t10_certificados_conf WHERE t10_estado = 1 AND t5_cursos_t5_id = ?;`, [t5_cursos_t5_id]);
    const labels = await queryAsync(`SELECT t20_labels.* FROM t20_labels INNER JOIN t10_certificados_conf ON t10_id = t10_certificados_conf_t10_id WHERE t5_cursos_t5_id = ?;`, [t5_cursos_t5_id]);
    if(certificado_conf.length==0){
      throw new Error("El certificado aun no está habilitado.");
    }

    var cod_QR;
    const generateQRCode = async (text) => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(text, {margin: 1});
        cod_QR = qrCodeDataURL; 
      } catch (err) {
        console.error(err);
      }
    };
    await generateQRCode('https://fudecuncp.pe/validar/'+t9_codigo);
    
    //console.log(cod_QR);
    

    // Crear el nombre del archivo
    const fileName = t9_codigo+`.pdf`;
    const filePath = path.join(__dirname, '../uploads/certificados-async', fileName);

    // Crear el documento PDF
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    // Guardar el PDF en el sistema de archivos
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Agregar contenido al PDF
    doc.image('uploads/certificados-conf/'+certificado_conf[0].t10_img, 0, 0, { height: 595.28, width: 841.89 }); // Fondo (A4)

    for(let i = 0; i < labels.length; i++){
      if(labels[i].t20_hoja==1){

        if(labels[i].t20_tipo=='NOMBRES'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(cert[0].t3_nombres + ' ' + cert[0].t3_apellidos, labels[i].t20_x, labels[i].t20_y);
        }

        if(labels[i].t20_tipo=='CODIGO'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(t9_codigo, labels[i].t20_x, labels[i].t20_y);
        }

        if(labels[i].t20_tipo=='QR'){
          doc.image(cod_QR, labels[i].t20_x, labels[i].t20_y, { width: labels[i].t20_w, height: labels[i].t20_h });
        }
        

        //const fecha = new Date();
        const fecha = cert[0].t9_fecha ? new Date(cert[0].t9_fecha + 'T00:00:00') : new Date();
    
        const meses = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        if(labels[i].t20_tipo=='FECHA-DIA'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(fecha.getDate().toString().padStart(2, '0'), labels[i].t20_x, labels[i].t20_y);
        }
        if(labels[i].t20_tipo=='FECHA-MES'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(meses[fecha.getMonth()], labels[i].t20_x, labels[i].t20_y);
        }
        if(labels[i].t20_tipo=='FECHA-AÑO'){
          doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(fecha.getFullYear().toString().slice(-2), labels[i].t20_x, labels[i].t20_y);
        }


      }
    }



    /*
    doc.fontSize(24).font('Times-Bold').text('Certificado de Finalización', { align: 'center', underline: true, margin: 20 });
    doc.moveDown(2);
    doc.fontSize(18).font('Times-Roman').text(`Otorgado a: sssss}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Por haber completado satisfactoriamente el curso:`, { align: 'center' });
    doc.fontSize(18).font('Times-Bold').text('sssss', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).font('Times-Roman').text(`Fecha de emisión: 01-01-2025`, { align: 'center' });
    */



    if(certificado_conf[0].t10_imgrev!=null){
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
      doc.image('uploads/certificados-conf/'+certificado_conf[0].t10_imgrev, 0, 0, { height: 595.28, width: 841.89 }); // Fondo (A4)

      let promedio_n = 0;
      let promedio = 0;
      for(let i = 0; i < labels.length; i++){
        if(labels[i].t20_hoja==2){

          if(labels[i].t20_tipo=='CODIGO'){
            doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(t9_codigo, labels[i].t20_x, labels[i].t20_y);
          }

          if(labels[i].t20_tipo.slice(0,5)=='NOTA-'){
            let nota = await queryAsync(`SELECT * FROM t14_calificaciones 
              INNER JOIN t11_miscursos ON t11_miscursos_t11_id = t11_id 
              WHERE t14_estado = 2 AND t7_modulos_t7_id = ? AND t5_cursos_t5_id = ? AND t2_alumnos_t2_id = ?;`, [labels[i].t20_tipo.replace('NOTA-', ''), t5_cursos_t5_id, req.t2_id]);
            doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(nota[0].t14_nota, labels[i].t20_x, labels[i].t20_y);
            promedio_n += 1;
            promedio += nota[0].t14_nota;
          }

        }
      }

      for(let i = 0; i < labels.length; i++){
        if(labels[i].t20_hoja==2){
          if(labels[i].t20_tipo=='PROMEDIO'){
            let p_final = promedio / promedio_n;
            if (Number.isInteger(p_final)) {
              p_final.toString(); // Convertir a cadena sin decimales
            } else {
              p_final.toFixed(1); // Mostrar solo un decimal
            }
            doc.fontSize(labels[i].t20_fontsize).fillColor(labels[i].t20_color).font('Times-Roman').text(p_final, labels[i].t20_x, labels[i].t20_y);
          }
        }
      }

      
    }



    // Finalizar el documento
    await doc.end();


    /*
    writeStream.on('finish', () => {
      // Enviar el archivo al cliente Angular
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error al enviar el certificado:', err);
          res.status(500).send('Error al generar el certificado.');
        }
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error al escribir el archivo:', err);
      res.status(500).send('Error al generar el certificado.');
    });
    */


    
    const results = await queryAsync('UPDATE t9_certificados SET t9_codigo = ?, t9_estado = ? WHERE t9_id = ?;', [t9_codigo, 1, cert[0].t9_id]);

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





