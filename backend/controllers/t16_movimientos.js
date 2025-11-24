const db = require('../config/db');
const opn = require('opn');
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
    const index = req.query.index;
    const index_fin = req.query.index_fin;
    const tipo = req.query.tipo?.trim() || null;
    const precio = req.query.precio?.trim() || null;
    const curso = req.query.curso?.trim() || null;

    
    let sql = `SELECT COUNT(*) AS filas FROM t16_movimientos A
                INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
                INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
                INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
                INNER JOIN t18_ordenes_detalle E ON E.t17_ordenes_t17_id = B.t17_id
                INNER JOIN t5_cursos F ON F.t5_id = E.t5_cursos_t5_id
                WHERE 1=1 `;
    let params = [];

    if (index !== "") {
      sql += " AND DATE(t16_fecha) >= ?";
      params.push(`${index}`);
    }
    if (index_fin !== "") {
      sql += " AND DATE(t16_fecha) <= ?";
      params.push(`${index_fin}`);
    }
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
    }
    if (precio != 'null' && precio !== "") {
      if(precio == 0){
        sql += " AND t5_precio = 0";

      }else{
        sql += " AND t5_precio > 0";
      }
    }
    if (curso != 'null' && curso !== "") {
      if(curso != 0){
        sql += " AND t5_id = ?";
        params.push(curso);
      }
    }
    sql += " ORDER BY t16_id DESC;";

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

exports.getDataFilter = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const index_fin = req.query.index_fin?.trim() || "";
    const tipo = req.query.tipo?.trim() || null;
    const precio = req.query.precio?.trim() || null;
    const curso = req.query.curso?.trim() || null;
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT *, DATE_FORMAT(t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
          INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
          INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
          INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
          INNER JOIN t18_ordenes_detalle E ON E.t17_ordenes_t17_id = B.t17_id
          INNER JOIN t5_cursos F ON F.t5_id = E.t5_cursos_t5_id
          WHERE 1=1 
    `;
    let params = [];

    if (index !== "") {
      sql += " AND t16_fecha >= ?";
      params.push(`${index}`);
    }
    if (index_fin !== "") {
      sql += " AND t16_fecha <= ?";
      params.push(`${index_fin}`);
    }
    if (tipo != 'null' && tipo !== "") {
      sql += " AND t5_tipo = ?";
      params.push(tipo);
    }
    if (precio != 'null' && precio !== "") {
      if(precio == 0){
        sql += " AND t5_precio = 0";

      }else{
        sql += " AND t5_precio > 0";
      }
    }
    if (curso != 'null' && curso !== "") {
      if(curso != 0){
        sql += " AND t5_id = ?";
        params.push(curso);
      }
    }

    sql += " ORDER BY A.t16_id DESC ";

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


/*
exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    const index_fin = req.query.index_fin;
    console.log(req.query)
    var results;
    if(index.trim() != ""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t16_movimientos WHERE DATE(t16_fecha) >= '${index}' AND DATE(t16_fecha) <= '${index_fin}' ORDER BY t16_id DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t16_movimientos ORDER BY t16_id DESC;');
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
*/

exports.getAllData = async (req, res) => {
  try {
    var query;
    if(req.query.size && req.query.offset){
      query = `SELECT *, DATE_FORMAT(A.t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
          INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
          INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
          INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id
          WHERE B.t17_estado = 1 ORDER BY A.t16_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT *, DATE_FORMAT(A.t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
          INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
          INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
          INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
          WHERE B.t17_estado = 1 ORDER BY A.t16_id DESC;`; 
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

/*
exports.getDataFilter = async (req, res) => {
  try {
    var query;
    const index = req.query.index;
    const index_fin = req.query.index_fin;
    if(req.query.size && req.query.offset){
      query = `SELECT *, DATE_FORMAT(t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
          INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
          INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
          INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
          WHERE B.t17_estado = 1 AND DATE(A.t16_fecha) >= '${index}' AND DATE(A.t16_fecha) <= '${index_fin}' ORDER BY A.t16_id DESC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = `SELECT *, DATE_FORMAT(t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
          INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
          INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
          INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
          WHERE B.t17_estado = 1 AND DATE(A.t16_fecha) >= '${index}' AND DATE(A.t16_fecha) <= '${index_fin}' ORDER BY A.t16_id DESC;`; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
*/

exports.postData = async (req, res) => {
  try {
    const { t2_tipodoc, t2_documento, t2_email, t2_pass, t2_estado } = JSON.parse(req.body.data);
    if (!t2_tipodoc || !t2_documento || !t2_email || !t2_pass || !t2_estado) {
      throw new Error("Revise los campos obligatorios.");
    }
    const results = await queryAsync(
      'INSERT INTO t2_alumnos (t2_tipodoc, t2_documento, t2_email, t2_pass, t2_fechareg, t2_estado) VALUES (?, ?, ?, ?, NOW(), ?)',
      [t2_tipodoc, t2_documento, t2_email, t2_pass, t2_estado]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t2_id = req.params.id;
    const { t2_tipodoc, t2_documento, t2_email, t2_pass, t2_fechareg, t2_estado } = JSON.parse(req.body.data);
    if (!t2_tipodoc || !t2_documento || !t2_email || !t2_pass || !t2_fechareg || !t2_estado) {
      throw new Error("Revise los campos obligatorios.");
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
      const results = await queryAsync('DELETE FROM t2_alumnos WHERE t2_id = ?', [t2_id]);
      return res.status(200).json(results);
    } else {
      throw new Error("Revise los campos obligatorios.");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


exports.getReportePDF = async (req, res) => {

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
    
      const { t16_fecha, t16_fecha_fin, t5_tipo, t5_precio, t5_id } = JSON.parse(req.body.data);
      console.log(t5_tipo);
      // Query mejorado con los mismos filtros que Excel
      let sql = `
        SELECT *, DATE_FORMAT(t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
            INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
            INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
            INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
            INNER JOIN t18_ordenes_detalle E ON E.t17_ordenes_t17_id = B.t17_id
            INNER JOIN t5_cursos F ON F.t5_id = E.t5_cursos_t5_id
            WHERE 1=1 
      `;
      let params = [];

      if (t16_fecha !== "" && t16_fecha != null) {
        sql += " AND t16_fecha >= ?";
        params.push(`${t16_fecha}`);
      }
      if (t16_fecha_fin !== "" && t16_fecha_fin != null) {
        sql += " AND t16_fecha <= ?";
        params.push(`${t16_fecha_fin}`);
      }
      if (t5_tipo != 'null' && t5_tipo !== "" && t5_tipo != null) {
        sql += " AND t5_tipo = ?";
        params.push(t5_tipo);
      }
      if (t5_precio != 'null' && t5_precio !== "" && t5_precio != null) {
        if(t5_precio == 0){
          sql += " AND t5_precio = 0";
        }else{
          sql += " AND t5_precio > 0";
        }
      }
      if (t5_id != 'null' && t5_id !== "" && t5_id != null) {
        if(t5_id != 0){
          sql += " AND t5_id = ?";
          params.push(t5_id);
        }
      }

      sql += " ORDER BY A.t16_id DESC ";
      console.log(sql);
      const results = await queryAsync(sql, params);
     
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

      // Encabezados mejorados con más columnas
      var data = [
          ['N°','CONCEPTO', 'FECHA', 'N° DE ORDEN', 'ABONADOR', 'TIPO DE RECURSO', 'CURSO', 'COD OPERACIÓN', 'GRATUITO', 'MONTO']
      ];

      var total_recaudado = 0;
      var cursos_gratuitos = 0;
      var cursos_pagados = 0;

      for(let i = 0; i < results.length; i++){
          let tmp_nombres = results[i].t3_apellidos + ' ' + results[i].t3_nombres;
          let tipo_recurso = results[i].t5_tipo == 1 ? 'AUTOFORMATIVO' : 'EN VIVO';
          let modalidad = results[i].t16_monto == 0 ? 'GRATUITO' : 'PAGADO';
          
          total_recaudado += results[i].t16_monto;
          
          if(results[i].t16_monto == 0) {
              cursos_gratuitos++;
          } else {
              cursos_pagados++;
          }

          var tmp_reportes = [
              i+1, 
              results[i].t16_concepto, 
              results[i].t16_fecha, 
              results[i].t17_id, 
              tmp_nombres.toUpperCase(),
              tipo_recurso,
              results[i].t5_curso.substring(0, 65) + (results[i].t5_curso.length > 65 ? '...' : ''), // Truncar curso
              results[i].t17_operacion || 'N/A',
              modalidad,
              'S/. ' + results[i].t16_monto
          ];
          data.push(tmp_reportes);
      }

      // Información de filtros
      let filterInfo = '';
      if (t16_fecha !== "" && t16_fecha_fin !== "" && t16_fecha != null && t16_fecha_fin != null) {
          filterInfo += `Período: ${t16_fecha} - ${t16_fecha_fin}`;
      } else {
          filterInfo += 'Período: Todos los registros';
      }

      if (t5_tipo != 'null' && t5_tipo !== "" && t5_tipo != null) {
          filterInfo += ` | Tipo: ${t5_tipo == 1 ? 'AUTOFORMATIVO' : 'EN VIVO'}`;
      }

      if (t5_precio != 'null' && t5_precio !== "" && t5_precio != null) {
          filterInfo += ` | Modalidad: ${t5_precio == 0 ? 'GRATUITO' : 'PAGADO'}`;
      }

      pdf.autoTable({
          head: [data[0]],
          body: data.slice(1),
          margin: { top: 120 }, // Más espacio para encabezado
          styles: { 
              font: "Arial", 
              fontSize: 7, // Fuente más pequeña para más columnas
              textColor: [0, 0, 0],
              cellPadding: 2,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
          },
          alternateRowStyles: {
              fillColor: [248, 249, 250], // Gris muy claro
          },
          bodyStyles: { 
              cellPadding: 2,
              valign: 'middle',
              fontSize: 7
          },
          headStyles: {
              fillColor: [68, 114, 196], // Azul corporativo
              textColor: [255, 255, 255], // Texto blanco
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 8,
              cellPadding: 3
          },
          columnStyles: {
              0: { cellWidth: 25, halign: 'center' }, // N°
              1: { cellWidth: 60, halign: 'center' }, // Concepto
              2: { cellWidth: 65, halign: 'center' }, // Fecha
              3: { cellWidth: 35, halign: 'center' }, // N° Orden
              4: { cellWidth: 80, halign: 'left' }, // Abonador
              5: { cellWidth: 55, halign: 'center' }, // Tipo Recurso
              6: { cellWidth: 120, halign: 'left' }, // Curso
              7: { cellWidth: 45, halign: 'center' }, // Cod Operación
              8: { cellWidth: 40, halign: 'center' }, // Modalidad
              9: { cellWidth: 35, halign: 'right' } // Monto
          },
          didDrawCell: function (data) {
              // Colorear celdas según el contenido
              if (data.column.index === 8 && data.section === 'body') { // Columna Modalidad
                  if (data.cell.raw === 'GRATUITO') {
                      // Fondo verde claro para GRATUITO
                      pdf.setFillColor(232, 245, 232);
                      pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                      pdf.setTextColor(40, 167, 69); // Verde
                      pdf.setFont('Arial', 'bold');
                      pdf.text('GRATUITO', data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {align: 'center', baseline: 'middle'});
                  } else if (data.cell.raw === 'PAGADO') {
                      // Fondo azul claro para PAGADO
                      pdf.setFillColor(227, 242, 253);
                      pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                      pdf.setTextColor(0, 123, 255); // Azul
                      pdf.setFont('Arial', 'bold');
                      pdf.text('PAGADO', data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {align: 'center', baseline: 'middle'});
                  }
              }
              
              // Colorear montos pagados
              if (data.column.index === 9 && data.section === 'body' && data.cell.raw !== 'S/. 0') {
                  pdf.setTextColor(0, 123, 255); // Azul para montos
                  pdf.setFont('Arial', 'bold');
              }
          },
          didDrawPage: function (data) {
              // ENCABEZADO MEJORADO
              pdf.addImage(base64Image, 'PNG', 35, 20, 60, 48);
              
              // Título principal
              pdf.setFontSize(16);
              pdf.setFont('Times', 'bold');
              pdf.setTextColor(47, 85, 151); // Azul corporativo
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
              pdf.text('REPORTE DE MOVIMIENTOS', setCenterX('REPORTE DE MOVIMIENTOS', 14, 'Times'), 84);
              
              // Información de filtros
              if (filterInfo) {
                  pdf.setFontSize(9);
                  pdf.setFont('Arial', 'normal');
                  pdf.setTextColor(102, 102, 102);
                  pdf.text(filterInfo, setCenterX(filterInfo, 9, 'Arial'), 98);
              }

              // Estadísticas rápidas en recuadros
              const statsY = 105;
              
              // Total registros
              pdf.setFillColor(68, 114, 196);
              pdf.roundedRect(150, statsY, 80, 12, 2, 2, 'F');
              pdf.setTextColor(255, 255, 255);
              pdf.setFont('Arial', 'bold');
              pdf.setFontSize(8);
              pdf.text(`Total: ${results.length} registros`, 190, statsY + 8, {align: 'center'});

              // Cursos gratuitos
              pdf.setFillColor(40, 167, 69);
              pdf.roundedRect(240, statsY, 80, 12, 2, 2, 'F');
              pdf.text(`Gratuitos: ${cursos_gratuitos}`, 280, statsY + 8, {align: 'center'});

              // Cursos pagados
              pdf.setFillColor(0, 123, 255);
              pdf.roundedRect(330, statsY, 80, 12, 2, 2, 'F');
              pdf.text(`Pagados: ${cursos_pagados}`, 370, statsY + 8, {align: 'center'});

              // Total recaudado
              pdf.setFillColor(255, 193, 7);
              pdf.roundedRect(420, statsY, 100, 12, 2, 2, 'F');
              pdf.setTextColor(0, 0, 0);
              pdf.text(`Total: S/. ${total_recaudado.toFixed(2)}`, 470, statsY + 8, {align: 'center'});

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
      pdf.roundedRect(30, finalY, 570, 35, 3, 3, 'FD');
      
      // Título del resumen
      pdf.setFont('Times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(47, 85, 151);
      pdf.text('RESUMEN GENERAL', setCenterX('RESUMEN GENERAL', 12, 'Times'), finalY + 12);
      
      // Estadísticas del resumen
      pdf.setFont('Arial', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      const statsText = [
          `Total de registros: ${results.length}`,
          `Cursos gratuitos: ${cursos_gratuitos}`,
          `Cursos pagados: ${cursos_pagados}`,
          `Total recaudado: S/. ${total_recaudado.toFixed(2)}`
      ];
      
      // Distribuir estadísticas en 2 filas
      const col1X = 80;
      const col2X = 350;
      
      pdf.text(statsText[0], col1X, finalY + 22);
      pdf.text(statsText[1], col2X, finalY + 22);
      pdf.text(statsText[2], col1X, finalY + 30);
      
      // Total recaudado destacado
      pdf.setFont('Arial', 'bold');
      pdf.setTextColor(0, 123, 255);
      pdf.text(statsText[3], col2X, finalY + 30);

      const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
      const nombreArchivo = `Movimientos_${uniqueId}.pdf`;
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

}

exports.getReporteExcel = async (req, res) => {

  var htmlContent = ``;
  const pdf_margin_left = 30;
  const pdf_firma = 100;
  const pdf_firma_margin = 43;

  try {

      // Ruta de la imagen PNG
      const imgData = fs.readFileSync('static/uncp.png');
      const base64Image = 'data:image/png;base64,' + Buffer.from(imgData).toString('base64');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de movimientos');
      const columnas = [
              { header: 'N°', key: 'N°', width: 5 },
              { header: 'CONCEPTO', key: 'CONCEPTO', width: 25 },
              { header: 'FECHA', key: 'FECHA', width: 20 },
              { header: 'N° DE ORDEN', key: 'N° DE ORDEN', width: 15 },
              { header: 'ABONADOR', key: 'ABONADOR', width: 45 },
              { header: 'TIPO DE RECURSO', key: 'TIPO DE RECURSO', width: 28 },
              { header: 'CURSO', key: 'CURSO', width: 95 },
              { header: 'COD DE OPERACIÓN', key: 'COD DE OPERACIÓN', width: 20 },
              { header: 'GRATUITO', key: 'GRATUITO', width: 15 },
              { header: 'MONTO', key: 'MONTO', width: 10 },
              { header: 'VOUCHER', key: 'VOUCHER', width: 20 },
      ];
      worksheet.columns = columnas;
      var data_E = [];

      const { t16_fecha, t16_fecha_fin, t5_tipo, t5_precio, t5_id } = JSON.parse(req.body.data);
      let sql = `
        SELECT *, DATE_FORMAT(t16_fecha, '%d-%m-%Y %H:%i:%s') AS t16_fecha FROM t16_movimientos A
            INNER JOIN t17_ordenes B ON A.t17_ordenes_t17_id = B.t17_id 
            INNER JOIN t2_alumnos C ON B.t2_alumnos_t2_id = C.t2_id
            INNER JOIN t3_perfiles D ON D.t2_alumnos_t2_id = C.t2_id 
            INNER JOIN t18_ordenes_detalle E ON E.t17_ordenes_t17_id = B.t17_id
            INNER JOIN t5_cursos F ON F.t5_id = E.t5_cursos_t5_id
            WHERE 1=1 
      `;
      let params = [];

      if (t16_fecha !== "" && t16_fecha != null) {
        sql += " AND t16_fecha >= ?";
        params.push(`${t16_fecha}`);
      }
      if (t16_fecha_fin !== "" && t16_fecha_fin != null) {
        sql += " AND t16_fecha <= ?";
        params.push(`${t16_fecha_fin}`);
      }
      if (t5_tipo != 'null' && t5_tipo !== "" && t5_tipo != null) {
        sql += " AND t5_tipo = ?";
        params.push(t5_tipo);
      }
      if (t5_precio != 'null' && t5_precio !== "" && t5_precio != null) {
        if(t5_precio == 0){
          sql += " AND t5_precio = 0";
        }else{
          sql += " AND t5_precio > 0";
        }
      }
      if (t5_id != 'null' && t5_id !== "" && t5_id != null) {
        if(t5_id != 0){
          sql += " AND t5_id = ?";
          params.push(t5_id);
        }
      }

      sql += " ORDER BY A.t16_id DESC ";

      const results = await queryAsync(sql, params);

      for(let j = 0; j <  results.length; j++){
        let tmp_nombres = results[j].t3_apellidos + ' ' + results[j].t3_nombres;
        data_E.push(
          [
            j+1, 
            results[j].t16_concepto,
            results[j].t16_fecha,
            results[j].t17_id,
            tmp_nombres.toUpperCase(),
            results[j].t5_tipo == 1 ? 'CURSO AUTOFORMATIVO' : 'CURSO EN VIVO',
            results[j].t5_curso,
            results[j].t17_operacion,
            results[j].t16_monto == 0 ? 'GRATUITO' : 'PAGADO',
            results[j].t16_monto,
            results[j].t16_monto > 0 ? { text: "Ver Voucher", hyperlink: "https://api.fudecuncp.pe/api/uploads/comprobantes/" + results[j].t17_url } : ''
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
    worksheet.mergeCells('A1:K1'); // Combinar celdas para el título
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE MOVIMIENTOS - FUNDACIÓN PARA EL DESARROLLO DEL CENTRO DEL PERÚ';
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

    // 3. AGREGAR INFORMACIÓN DE FILTROS (si aplica)
    let filterInfo = 'Período: ';
    if (t16_fecha !== "" && t16_fecha_fin !== "" && t16_fecha != null && t16_fecha_fin != null) {
        filterInfo += `${t16_fecha} - ${t16_fecha_fin}`;
    } else {
        filterInfo += 'Todos los registros';
    }

    if (t5_tipo != 'null' && t5_tipo !== "" && t5_tipo != null) {
        filterInfo += ` | Tipo: ${t5_tipo == 1 ? 'CURSO AUTOFORMATIVO' : 'CURSO EN VIVO'}`;
    }

    if (t5_precio != 'null' && t5_precio !== "" && t5_precio != null) {
        filterInfo += ` | Modalidad: ${t5_precio == 0 ? 'GRATUITO' : 'PAGADO'}`;
    }

    worksheet.mergeCells('A2:K2');
    const filterCell = worksheet.getCell('A2');
    filterCell.value = filterInfo;
    filterCell.font = {
        name: 'Arial',
        size: 10,
        italic: true,
        color: { argb: 'FF666666' }
    };
    filterCell.alignment = {
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

    // Modificar el bucle existente para aplicar estilos
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

            // Alineación por columna
            switch (colNumber) {
                case 1: // N°
                case 4: // N° de Orden
                case 8: // Cod de Operación
                case 10: // Monto
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    break;
                case 3: // Fecha
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    break;
                case 5: // Abonador
                case 7: // Curso
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

            // Estilo especial para columna GRATUITO/PAGADO
            if (colNumber === 9) {
                if (cell.value === 'GRATUITO') {
                    cell.font = {
                        name: 'Arial',
                        size: 10,
                        bold: true,
                        color: { argb: 'FF28A745' } // Verde
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE8F5E8' } // Fondo verde claro
                    };
                } else if (cell.value === 'PAGADO') {
                    cell.font = {
                        name: 'Arial',
                        size: 10,
                        bold: true,
                        color: { argb: 'FF007BFF' } // Azul
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE3F2FD' } // Fondo azul claro
                    };
                }
            }

            // Estilo especial para la columna MONTO
            if (colNumber === 10 && data_E[i][9] > 0) {
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    bold: true,
                    color: { argb: 'FF007BFF' }
                };
                cell.numFmt = '"S/. "#,##0.00'; // Formato de moneda
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

        // Aplicar hipervínculo a la columna VOUCHER
        const voucherCell = fila.getCell(11);
        if (data_E[i][9] > 0) {
            voucherCell.value = {
                text: "📄 Ver Voucher",
                hyperlink: data_E[i][10].hyperlink
            };
            voucherCell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF0000FF' },
                underline: true,
                bold: true
            };
            voucherCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F8FF' } // Fondo azul muy claro
            };
        } else {
            voucherCell.value = '-';
            voucherCell.alignment = { vertical: 'middle', horizontal: 'center' };
            voucherCell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF999999' }
            };
        }
    }


    //console.log(`Archivo Excel creado`);
             
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const nombreArchivo = `Movimientos_${uniqueId}.xlsx`;
    const filePath = path.join(__dirname,'..','reportes',nombreArchivo);
      
    await workbook.xlsx.writeFile(filePath)
    return res.sendFile(filePath);

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

