const db = require('../config/db');
const opn = require('opn');
const fs = require('fs');
const path = require('path');

const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');
//import autoTable from 'jspdf-autotable'


// Función para obtener la fecha actual en formato 'DD/MM/YYYY'
function getFormattedDate() {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Los meses se cuentan desde 0
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
}
function convertirNombre(str) {
    const palabras = str.toLowerCase().split(' ');
    const palabrasFormateadas = palabras.map(palabra => {
      // Verificar si la palabra contiene más de una letra
      if (palabra.length > 1) {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      } else {
        return palabra.toUpperCase();
      }
    });
    return palabrasFormateadas.join(' ');
}




exports.getReporteExamen = async (req, res) => {
  try {
    const t3_id = req.params.t3_id;

    var vacantes = [];
    const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
        INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
        INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
        INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
        INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
        WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
    for(let i = 0; i < tmp_vacantes.length; i++){
        vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
    }
    //console.log(vacantes[67])

    const carreras = await queryAsync(` SELECT * FROM t6_carreras A
        INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
        INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
        INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
        INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
        INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
        WHERE C.t2_procesos_t2_pin = ? GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin]);
        
    
    var postulantes = [];
    for(let i = 0; i < carreras.length; i++){
        //console.log(carreras[i]);
        var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje FROM t14_postulantes A
        INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
        INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
        INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
        LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
        INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
        WHERE C.t6_id = ? AND A.t3_examenes_t3_id = ? AND t4_vacante = 1 GROUP BY t14_id ORDER BY puntaje DESC;`,[carreras[i].t6_id, t3_id]);
        

        for(let j = 0; j < tmp_postulantes.length; j++){
            const tmp_puntajes = await queryAsync(`SELECT B.* FROM t14_postulantes A
            INNER JOIN t19_notas B ON B.t14_postulantes_t14_id = A.t14_id
            WHERE A.t14_id = ?`, [tmp_postulantes[j].t14_id]);
            tmp_postulantes[j].puntajes = tmp_puntajes;
       
            if(vacantes[tmp_postulantes[j].t8_id] >= 1 && (tmp_postulantes[j].puntaje > carreras[i].t2_minpuntaje)){
                vacantes[tmp_postulantes[j].t8_id] -= 1;
                tmp_postulantes[j].ingresa = 1;
                console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - " + tmp_postulantes[j].t4_etiqueta + " - " + tmp_postulantes[j].puntaje)
            }else{
                tmp_postulantes[j].ingresa = 0;
                console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - NO INGRESA - " + tmp_postulantes[j].puntaje)
            }
            
        }
        postulantes.push(tmp_postulantes);

    }

    return res.status(200).json(postulantes);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};






exports.getReporteProceso = async (req, res) => {

    var htmlContent = ``;
    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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

        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


    
        const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 1 GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin]);
            
        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
        FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);

        
        var postulantes = [];      
        for(let i = 0; i < carreras.length; i++){
            //console.log(carreras[i]);
            var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
            INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
            INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
            INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
            LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
            INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
            WHERE C.t6_id = ? AND t4_vacante = 1 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[i].t6_id]);
        
            var data = [
                ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
            ];
            for(let j = 0; j < tmp_postulantes.length; j++){
                const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(SUM(A.t19_nota), 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
				LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                WHERE D.t2_pin = ? AND B.t14_codigo = ? GROUP BY A.t14_postulantes_t14_id ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                tmp_postulantes[j].puntajes = tmp_puntajes;

                var tmp_res_puntajes = [];
                var asistio = 0;
                for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                    //console.log(tmp_postulantes[j].puntajes[k])
                    tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                    if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                        let tmp_t19_categoria = "";
                        tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                        data[0].splice(3+k, 0, tmp_t19_categoria);  
                        /*
                        if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                            
                        }else{
                            if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                            }else{
                                data[0].splice(3+k, 0, "P.");
                            }
                        }
                        */
                    }

                    if(tmp_postulantes[j].puntajes[k].t15_id){
                        asistio = 1;
                    }
                }

                if(tmp_postulantes[j].t14_estado){
                    if(vacantes[tmp_postulantes[j].t8_id] >= 1 && (Number(tmp_postulantes[j].puntaje) >= carreras[i].t2_minpuntaje)){
                        vacantes[tmp_postulantes[j].t8_id] -= 1;
                        tmp_postulantes[j].ingresa = 1;
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t4_etiqueta
                            ]
                        );
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                        //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - " + tmp_postulantes[j].t4_etiqueta + " - " + tmp_postulantes[j].puntaje)
                    }else{
                        tmp_postulantes[j].ingresa = 0;
                        if(asistio){
                            data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    ""
                                ]
                            );
                        }else{
                            data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    "No se presentó"
                                ]
                            );
                        }  
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                        //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - NO INGRESA - " + tmp_postulantes[j].puntaje)
                    }
                }else{
                    data.push(
                        [
                            j+1, 
                            tmp_postulantes[j].t14_codigo, 
                            tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                            tmp_postulantes[j].puntajeView,
                            tmp_postulantes[j].t14_observacion
                        ]
                    );
                    for(let l = 0; l < tmp_res_puntajes.length; l++){
                        data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                    }
                }

                
            }

            postulantes.push(tmp_postulantes);


            //console.log(data);
            // Agregar la tabla al documento
            pdf.autoTable({
                head: [data[0]],
                body: data.slice(1),
                margin: { top: 92 },
                styles: { 
                    font: "Arial", 
                    fontSize: 8,
                    textColor: [0, 0, 0],
                },
                alternateRowStyles: {
                    fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                },
                bodyStyles: { 
                    cellPadding: 2 }
                ,
                headStyles: {
                    fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                    textColor: [0, 0, 0], // Color del texto en formato RGB
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                    1: { cellWidth: 'wrap', halign: 'center' },
                    3: { cellWidth: 'wrap', halign: 'center' },
                    4: { cellWidth: 'wrap', halign: 'center' },
                    5: { cellWidth: 'wrap', halign: 'center' },
                    6: { cellWidth: 'wrap', halign: 'center' },
                    7: { cellWidth: 'wrap', halign: 'center' }
                },
                didDrawPage: function (data) {
                    // Agregar encabezado
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFont('Times', 'normal');
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso, setCenterX(carreras[i].t2_proceso, 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
                    
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);



                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
                    pdf.setFont('Times', 'normal');
                },
                didParseCell: function (data) {
                    const columnIndex = data.column.index;
                    // Verificar si es la penúltima columna (índice - 1)
                    if (columnIndex === data.table.columns.length - 2) {
                      // Aplicar negrita al valor de la penúltima columna
                      data.cell.styles.fontStyle = 'bold';
                    }
                  },
            });

            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;
            
            /*
            pdf.text(`Espcio disp: ${espacioYDisp}`, 50, 550);
            pdf.text(`ANCHO HOja: ${pdf.internal.pageSize.width}`, 50, 560);
            pdf.line(30,570,130,570)
            pdf.line(30+100+43,570,30+100+43+100,570)
            pdf.line(30+100+43+100+43,570,30+100+43+100+43+100,570)
            */
            
            
            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
            
            
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_proc_general_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
    
        });
        */

        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error al enviar el archivo:', err);
                return res.status(500).send('Error interno del servidor');
            }
            });
        });
        return res.sendFile(filePath);


        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });

        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};

exports.getReporteProcesoLibre = async (req, res) => {

    var htmlContent = ``;
    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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

        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


    
        const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 0 GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin]);
            
        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
        FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);

        
        var postulantes = [];      
        for(let i = 0; i < carreras.length; i++){
            //console.log(carreras[i]);
            var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
            INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
            INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
            INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
            LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
            INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
            WHERE C.t6_id = ? AND t4_vacante = 0 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[i].t6_id]);

            var data = [
                ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
            ];
            for(let j = 0; j < tmp_postulantes.length; j++){
                const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(SUM(A.t19_nota), 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
				LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                WHERE D.t2_pin = ? AND B.t14_codigo = ? GROUP BY  A.t14_postulantes_t14_id ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                tmp_postulantes[j].puntajes = tmp_puntajes;

                var tmp_res_puntajes = [];
                var asistio = 0;
                for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                    //console.log(tmp_postulantes[j].puntajes[k])
                    tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                    if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                        let tmp_t19_categoria = "";
                        tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                        data[0].splice(3+k, 0, tmp_t19_categoria);  
                        /*
                        if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                            
                        }else{
                            if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                            }else{
                                data[0].splice(3+k, 0, "P.");
                            }
                        }
                        */
                    }

                    if(tmp_postulantes[j].puntajes[k].t15_id){
                        asistio = 1;
                    }
                }

                if(tmp_postulantes[j].t14_estado){
                    tmp_postulantes[j].ingresa = 0;
                    if(asistio){
                        data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    tmp_postulantes[j].t4_etiqueta
                                ]
                        );
                    }else{
                        data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    "No se presentó"
                                ]
                        );
                    }  
                    for(let l = 0; l < tmp_res_puntajes.length; l++){
                        data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                    }
                }else{
                    data.push(
                        [
                            j+1, 
                            tmp_postulantes[j].t14_codigo, 
                            tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                            tmp_postulantes[j].puntajeView,
                            tmp_postulantes[j].t14_observacion
                        ]
                    );
                    for(let l = 0; l < tmp_res_puntajes.length; l++){
                        data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                    }
                }

                
            }

            postulantes.push(tmp_postulantes);


            //console.log(data);
            // Agregar la tabla al documento
            pdf.autoTable({
                head: [data[0]],
                body: data.slice(1),
                margin: { top: 92 },
                styles: { 
                    font: "Arial", 
                    fontSize: 8,
                    textColor: [0, 0, 0],
                },
                alternateRowStyles: {
                    fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                },
                bodyStyles: { 
                    cellPadding: 2 }
                ,
                headStyles: {
                    fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                    textColor: [0, 0, 0], // Color del texto en formato RGB
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                    1: { cellWidth: 'wrap', halign: 'center' },
                    3: { cellWidth: 'wrap', halign: 'center' },
                    4: { cellWidth: 'wrap', halign: 'center' },
                    5: { cellWidth: 'wrap', halign: 'center' },
                    6: { cellWidth: 'wrap', halign: 'center' },
                    7: { cellWidth: 'wrap', halign: 'center' }
                },
                didDrawPage: function (data) {
                    // Agregar encabezado
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFont('Times', 'normal');
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
                    
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);



                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
                    pdf.setFont('Times', 'normal');
                },
                didParseCell: function (data) {
                    const columnIndex = data.column.index;
                    // Verificar si es la penúltima columna (índice - 1)
                    if (columnIndex === data.table.columns.length - 2) {
                      // Aplicar negrita al valor de la penúltima columna
                      data.cell.styles.fontStyle = 'bold';
                    }
                  },
            });

            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;
            
            
            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
            
            
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_proc_general_libres_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
    
        });
        */


        // Guardar el PDF en el sistema de archivos
        
        pdf.save(filePath, () => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error al enviar el archivo:', err);
                return res.status(500).send('Error interno del servidor');
            }
            });
        });
        return res.sendFile(filePath);


        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });

        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};




exports.getReporteProcesoDetalle = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


    
        const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 1 GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin]);
            

        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
            FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        

        var postulantes = [];      
        for(let i = 0; i < carreras.length; i++){
            //console.log(carreras[i]);
            var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
            INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
            INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
            INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
            LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
            INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
            WHERE C.t6_id = ? AND t4_vacante = 1 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[i].t6_id]);
        
            var data = [
                ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
            ];
            for(let j = 0; j < tmp_postulantes.length; j++){
                const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(A.t19_nota, 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
				LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                WHERE D.t2_pin = ? AND B.t14_codigo = ? ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                tmp_postulantes[j].puntajes = tmp_puntajes;

                var tmp_res_puntajes = [];
                var asistio = 0;
                for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                    //console.log(tmp_postulantes[j].puntajes[k])
                    tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                    if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                        let tmp_t19_categoria = "";
                        if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                            tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                            data[0].splice(3+k, 0, tmp_t19_categoria);  
                        }else{
                            if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                            }else{
                                data[0].splice(3+k, 0, "P.");
                            }
                        }
                    }

                    if(tmp_postulantes[j].puntajes[k].t15_id){
                        asistio = 1;
                    }
                }

                if(tmp_postulantes[j].t14_estado){
                    if(vacantes[tmp_postulantes[j].t8_id] >= 1 && (Number(tmp_postulantes[j].puntaje) >= carreras[i].t2_minpuntaje)){
                        vacantes[tmp_postulantes[j].t8_id] -= 1;
                        tmp_postulantes[j].ingresa = 1;
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t4_etiqueta
                            ]
                        );
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                        //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - " + tmp_postulantes[j].t4_etiqueta + " - " + tmp_postulantes[j].puntaje)
                    }else{
                        tmp_postulantes[j].ingresa = 0;
                        if(asistio){
                            data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    ""
                                ]
                            );
                        }else{
                            data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    "No se presentó"
                                ]
                            );
                        }  
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                        //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - NO INGRESA - " + tmp_postulantes[j].puntaje)
                    }
                }else{
                    data.push(
                        [
                            j+1, 
                            tmp_postulantes[j].t14_codigo, 
                            tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                            tmp_postulantes[j].puntajeView,
                            tmp_postulantes[j].t14_observacion
                        ]
                    );
                    for(let l = 0; l < tmp_res_puntajes.length; l++){
                        data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                    }
                }

                
            }

            postulantes.push(tmp_postulantes);


            //console.log(data);
            // Agregar la tabla al documento
            pdf.autoTable({
                head: [data[0]],
                body: data.slice(1),
                margin: { top: 92 },
                styles: { 
                    font: "Arial", 
                    fontSize: 8,
                    textColor: [0, 0, 0],
                },
                alternateRowStyles: {
                    fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                },
                bodyStyles: { 
                    cellPadding: 2 }
                ,
                headStyles: {
                    fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                    textColor: [0, 0, 0], // Color del texto en formato RGB
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                    1: { cellWidth: 'wrap', halign: 'center' },
                    3: { cellWidth: 'wrap', halign: 'center' },
                    4: { cellWidth: 'wrap', halign: 'center' },
                    5: { cellWidth: 'wrap', halign: 'center' },
                    6: { cellWidth: 'wrap', halign: 'center' },
                    7: { cellWidth: 'wrap', halign: 'center' }
                },
                didDrawPage: function (data) {
                    // Agregar encabezado
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFont('Times', 'normal');
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso, setCenterX(carreras[i].t2_proceso, 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
                    
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);



                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
                    pdf.setFont('Times', 'normal');
                },
                didParseCell: function (data) {
                    const columnIndex = data.column.index;
                    // Verificar si es la penúltima columna (índice - 1)
                    if (columnIndex === data.table.columns.length - 2) {
                      // Aplicar negrita al valor de la penúltima columna
                      data.cell.styles.fontStyle = 'bold';
                    }
                  },
            });

            
            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;

            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
    
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_proc_detalle_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
        });
        */


        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);


        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};

exports.getReporteProcesoDetalleLibre = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


    
        const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 0 GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin]);
            

        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
            FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        
        var postulantes = [];      
        for(let i = 0; i < carreras.length; i++){
            //console.log(carreras[i]);
            var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
            INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
            INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
            INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
            LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
            INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
            WHERE C.t6_id = ? AND t4_vacante = 0 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[i].t6_id]);
        
            var data = [
                ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
            ];
            for(let j = 0; j < tmp_postulantes.length; j++){
                const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(A.t19_nota, 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
				LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                WHERE D.t2_pin = ? AND B.t14_codigo = ? ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                tmp_postulantes[j].puntajes = tmp_puntajes;

                var tmp_res_puntajes = [];
                var asistio = 0;
                for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                    //console.log(tmp_postulantes[j].puntajes[k])
                    tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                    if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                        let tmp_t19_categoria = "";
                        if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                            tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                            data[0].splice(3+k, 0, tmp_t19_categoria);  
                        }else{
                            if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                            }else{
                                data[0].splice(3+k, 0, "P.");
                            }
                        }
                    }

                    if(tmp_postulantes[j].puntajes[k].t15_id){
                        asistio = 1;
                    }
                }

                if(tmp_postulantes[j].t14_estado){
                    tmp_postulantes[j].ingresa = 0;
                    if(asistio){
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t4_etiqueta
                            ]
                        );
                    }else{
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                "No se presentó"
                            ]
                        );
                    }  
                    for(let l = 0; l < tmp_res_puntajes.length; l++){
                        data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                    }
                }else{
                    data.push(
                        [
                            j+1, 
                            tmp_postulantes[j].t14_codigo, 
                            tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                            tmp_postulantes[j].puntajeView,
                            tmp_postulantes[j].t14_observacion
                        ]
                    );
                    for(let l = 0; l < tmp_res_puntajes.length; l++){
                        data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                    }
                }
   
            }

            postulantes.push(tmp_postulantes);


            //console.log(data);
            // Agregar la tabla al documento
            pdf.autoTable({
                head: [data[0]],
                body: data.slice(1),
                margin: { top: 92 },
                styles: { 
                    font: "Arial", 
                    fontSize: 8,
                    textColor: [0, 0, 0],
                },
                alternateRowStyles: {
                    fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                },
                bodyStyles: { 
                    cellPadding: 2 }
                ,
                headStyles: {
                    fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                    textColor: [0, 0, 0], // Color del texto en formato RGB
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                    1: { cellWidth: 'wrap', halign: 'center' },
                    3: { cellWidth: 'wrap', halign: 'center' },
                    4: { cellWidth: 'wrap', halign: 'center' },
                    5: { cellWidth: 'wrap', halign: 'center' },
                    6: { cellWidth: 'wrap', halign: 'center' },
                    7: { cellWidth: 'wrap', halign: 'center' }
                },
                didDrawPage: function (data) {
                    // Agregar encabezado
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFont('Times', 'normal');
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
                    
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);



                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
                    pdf.setFont('Times', 'normal');
                },
                didParseCell: function (data) {
                    const columnIndex = data.column.index;
                    // Verificar si es la penúltima columna (índice - 1)
                    if (columnIndex === data.table.columns.length - 2) {
                      // Aplicar negrita al valor de la penúltima columna
                      data.cell.styles.fontStyle = 'bold';
                    }
                  },
            });

            
            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;

           
            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
    
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());




        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_proc_detalle_libres_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);


        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
    
        });
        */

        
        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);
        

        /*
        // Guardar el PDF en el sistema de archivos de forma sincrónica
        try {
            pdf.save(filePath);
            console.log('PDF guardado exitosamente en:', filePath);

            // Enviar el PDF como respuesta al cliente
            const fileData = fs.readFileSync(filePath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=nombre-archivo.pdf');
            res.send(fileData);
        } catch (err) {
            console.error('Error al guardar o enviar el archivo:', err);
            res.status(500).send('Error interno del servidor');
        }
        */


        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);

        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        */



        /*
        // Guardar el PDF en una carpeta específica
        const filePath = 'ruta/a/la/carpeta/especifica/miPDF.pdf';
        doc.save(filePath);

        // Enviar el PDF al cliente como respuesta
        res.download(filePath, 'miPDF.pdf', (err) => {
            // Eliminar el archivo después de enviarlo al cliente
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error al eliminar el archivo PDF:', unlinkErr);
                }
            });

            if (err) {
                console.error('Error al enviar el archivo PDF al cliente:', err);
            }
        });
        */

        //return res.status(200).json(200);
    
    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};





exports.getReporteModalidadesProceso = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


        const modalidades = await queryAsync(`SELECT * FROM t4_tipos_postulantes A
            INNER JOIN t2_procesos B ON B.t2_pin = A.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles C ON C.t4_tipos_postulantes_t4_id = A.t4_id 
            INNER JOIN t6_carreras D ON D.t6_id = C.t6_carreras_t6_id
            INNER JOIN t5_areas E ON E.t5_id = D.t5_areas_t5_id
            INNER JOIN t14_postulantes F ON F.t6_carreras_t6_id = D.t6_id AND F.t4_tipos_postulantes_t4_id = A.t4_id
            INNER JOIN t10_vacantes G ON G.t8_grupos_detalles_t8_id = C.t8_id
            WHERE A.t2_procesos_t2_pin = ? AND A.t4_vacante = 1 GROUP BY A.t4_id ORDER BY A.t4_codigo ASC, CAST(D.t6_codigo AS SIGNED) ASC, A.t4_id ASC;`,[req.t1_pin]);
    

        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
            FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        

        var postulantes = [];      
        for(let i = 0; i < modalidades.length; i++){
            var new_modalidad = false;
            //console.log(carreras[i]);
            const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 1 AND C.t4_id = ? GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin, modalidades[i].t4_id]);
            
            for(let k = 0; k < carreras.length; k++){
                var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
                INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
                INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
                INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
                LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
                INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
                WHERE C.t6_id = ? AND B.t4_id = ? AND t4_vacante = 1 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[k].t6_id, modalidades[i].t4_id]);

                var data = [
                    ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
                ];
                for(let j = 0; j < tmp_postulantes.length; j++){
                    const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(SUM(A.t19_nota), 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                    INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                    INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                    INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
                    LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                    WHERE D.t2_pin = ? AND B.t14_codigo = ? GROUP BY  A.t14_postulantes_t14_id ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                    tmp_postulantes[j].puntajes = tmp_puntajes;
    
                    var tmp_res_puntajes = [];
                    var asistio = 0;
                    for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                        //console.log(tmp_postulantes[j].puntajes[k])
                        tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                        if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                            let tmp_t19_categoria = "";
                            tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                            data[0].splice(3+k, 0, tmp_t19_categoria);  
                            /*
                            if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                                
                            }else{
                                if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                    tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                    //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                    data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                                }else{
                                    data[0].splice(3+k, 0, "P.");
                                }
                            }
                            */
                        }
    
                        if(tmp_postulantes[j].puntajes[k].t15_id){
                            asistio = 1;
                        }
                    }
    

                    if(tmp_postulantes[j].t14_estado){
                        if(vacantes[tmp_postulantes[j].t8_id] >= 1 && (Number(tmp_postulantes[j].puntaje) >= carreras[k].t2_minpuntaje)){
                            vacantes[tmp_postulantes[j].t8_id] -= 1;
                            tmp_postulantes[j].ingresa = 1;
                            data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    tmp_postulantes[j].t4_etiqueta
                                ]
                            );
                            for(let l = 0; l < tmp_res_puntajes.length; l++){
                                data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                            }
                            //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - " + tmp_postulantes[j].t4_etiqueta + " - " + tmp_postulantes[j].puntaje)
                        }else{
                            tmp_postulantes[j].ingresa = 0;
                            if(asistio){
                                data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        ""
                                    ]
                                );
                            }else{
                                data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        "No se presentó"
                                    ]
                                );
                            }  
                            for(let l = 0; l < tmp_res_puntajes.length; l++){
                                data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                            }
                            //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - NO INGRESA - " + tmp_postulantes[j].puntaje)
                        }
                    }else{
                        //console.log(tmp_postulantes[j])
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t14_observacion
                            ]
                        );
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                    }
    
                }
    
                postulantes.push(tmp_postulantes);



                var alturaTableY;
                if(pdf.autoTable.previous.finalY && new_modalidad){
                    var alturaTableY = pdf.autoTable.previous.finalY + 35;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), alturaTableY-8);
                    pdf.setFont('Times', 'normal');
                }else{
                    var alturaTableY = 102;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), 96);
                    pdf.setFont('Times', 'normal');
                    new_modalidad = true;
                }
                
                
                  
                //console.log(data);
                // Agregar la tabla al documento
                pdf.autoTable({
                    head: [data[0]],
                    body: data.slice(1),
                    startY: alturaTableY,
                    margin: { top: 90 },
                    styles: { 
                        font: "Arial", 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                    },
                    alternateRowStyles: {
                        fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                    },
                    bodyStyles: { 
                        cellPadding: 2 }
                    ,
                    headStyles: {
                        fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                        textColor: [0, 0, 0], // Color del texto en formato RGB
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                        1: { cellWidth: 'wrap', halign: 'center' },
                        3: { cellWidth: 'wrap', halign: 'center' },
                        4: { cellWidth: 'wrap', halign: 'center' },
                        5: { cellWidth: 'wrap', halign: 'center' },
                        6: { cellWidth: 'wrap', halign: 'center' },
                        7: { cellWidth: 'wrap', halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        // Agregar encabezado
                        pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                        pdf.setFontSize(18);
                        pdf.setFont('Times');
                        pdf.text(`${carreras[k].t5_siglas}`, 375, 45);
                        pdf.setFontSize(14);
                        pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                        pdf.setFontSize(12);
                        pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                        pdf.setFont('Times', 'normal');
                        pdf.setFontSize(16);
                        pdf.text(modalidades[i].t2_proceso, setCenterX(modalidades[i].t2_proceso, 16, 'Times'), 52);
                        pdf.setFontSize(12);
                        pdf.setFont('Times', 'bold');
                        pdf.text('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', 12, 'Times'), 66, { underline: true });
                        pdf.text(modalidades[i].t4_tipo, setCenterX(modalidades[i].t4_tipo, 14, 'Times'),80);

                        // Agregar pie de página
                        const currentPage = pdf.internal.getNumberOfPages();
                        //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                        const pagina = `Página ${currentPage}`;
                        // Establecer el color de la línea y grosor
                        pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                        pdf.setLineWidth(0.5); // Grosor de la línea
                        pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                        pdf.setTextColor(0); // Color del texto (negro)
                        pdf.setFontSize(8);
                        pdf.setFont('Times', 'normal');
                        pdf.text('Comisión de Admisión - Cod: '+carreras[k].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                        pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                        pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                    
                    },
                    didParseCell: function (data) {
                        const columnIndex = data.column.index;
                        // Verificar si es la penúltima columna (índice - 1)
                        if (columnIndex === data.table.columns.length - 2) {
                        // Aplicar negrita al valor de la penúltima columna
                        data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });


            }

   
            
            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;


            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
            
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_mod_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        
        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
        });
        */
        
        
        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);
        

        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};

exports.getReporteModalidadesProcesoLibre = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


        const modalidades = await queryAsync(`SELECT * FROM t4_tipos_postulantes A
            INNER JOIN t2_procesos B ON B.t2_pin = A.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles C ON C.t4_tipos_postulantes_t4_id = A.t4_id 
            INNER JOIN t6_carreras D ON D.t6_id = C.t6_carreras_t6_id
            INNER JOIN t5_areas E ON E.t5_id = D.t5_areas_t5_id
            INNER JOIN t14_postulantes F ON F.t6_carreras_t6_id = D.t6_id AND F.t4_tipos_postulantes_t4_id = A.t4_id
            INNER JOIN t10_vacantes G ON G.t8_grupos_detalles_t8_id = C.t8_id
            WHERE A.t2_procesos_t2_pin = ? AND A.t4_vacante = 0 GROUP BY A.t4_id ORDER BY A.t4_codigo ASC, CAST(D.t6_codigo AS SIGNED) ASC, A.t4_id ASC;`,[req.t1_pin]);
    

        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
            FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        

        var postulantes = [];      
        for(let i = 0; i < modalidades.length; i++){
            var new_modalidad = false;
            //console.log(carreras[i]);
            const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 0 AND C.t4_id = ? GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin, modalidades[i].t4_id]);
            
            for(let k = 0; k < carreras.length; k++){
                var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
                INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
                INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
                INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
                LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
                INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
                WHERE C.t6_id = ? AND B.t4_id = ? AND t4_vacante = 0 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[k].t6_id, modalidades[i].t4_id]);

                var data = [
                    ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
                ];
                for(let j = 0; j < tmp_postulantes.length; j++){
                    const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(SUM(A.t19_nota), 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                    INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                    INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                    INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
                    LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                    WHERE D.t2_pin = ? AND B.t14_codigo = ? GROUP BY  A.t14_postulantes_t14_id ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                    tmp_postulantes[j].puntajes = tmp_puntajes;
    
                    var tmp_res_puntajes = [];
                    var asistio = 0;
                    for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                        //console.log(tmp_postulantes[j].puntajes[k])
                        tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                        if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                            let tmp_t19_categoria = "";
                            tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                            data[0].splice(3+k, 0, tmp_t19_categoria);  
                            /*
                            if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                                
                            }else{
                                if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                    tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                    //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                    data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                                }else{
                                    data[0].splice(3+k, 0, "P.");
                                }
                            }
                            */
                        }
    
                        if(tmp_postulantes[j].puntajes[k].t15_id){
                            asistio = 1;
                        }
                    }
    
                    if(tmp_postulantes[j].t14_estado){
                        tmp_postulantes[j].ingresa = 0;
                        if(asistio){
                            data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        tmp_postulantes[j].t4_etiqueta
                                    ]
                            );
                        }else{
                            data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        "No se presentó"
                                    ]
                            );
                        }  
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                    }else{
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t14_observacion
                            ]
                        );
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                    }
    
                }
    
                postulantes.push(tmp_postulantes);



                var alturaTableY;
                if(pdf.autoTable.previous.finalY && new_modalidad){
                    var alturaTableY = pdf.autoTable.previous.finalY + 35;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), alturaTableY-8);
                    pdf.setFont('Times', 'normal');
                }else{
                    var alturaTableY = 102;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), 96);
                    pdf.setFont('Times', 'normal');
                    new_modalidad = true;
                }
                
                
                  
                //console.log(data);
                // Agregar la tabla al documento
                pdf.autoTable({
                    head: [data[0]],
                    body: data.slice(1),
                    startY: alturaTableY,
                    margin: { top: 90 },
                    styles: { 
                        font: "Arial", 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                    },
                    alternateRowStyles: {
                        fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                    },
                    bodyStyles: { 
                        cellPadding: 2 }
                    ,
                    headStyles: {
                        fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                        textColor: [0, 0, 0], // Color del texto en formato RGB
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                        1: { cellWidth: 'wrap', halign: 'center' },
                        3: { cellWidth: 'wrap', halign: 'center' },
                        4: { cellWidth: 'wrap', halign: 'center' },
                        5: { cellWidth: 'wrap', halign: 'center' },
                        6: { cellWidth: 'wrap', halign: 'center' },
                        7: { cellWidth: 'wrap', halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        // Agregar encabezado
                        pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                        pdf.setFontSize(18);
                        pdf.setFont('Times');
                        pdf.text(`${carreras[k].t5_siglas}`, 375, 45);
                        pdf.setFontSize(14);
                        pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                        pdf.setFontSize(12);
                        pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                        pdf.setFont('Times', 'normal');
                        pdf.setFontSize(16);
                        pdf.text(modalidades[i].t2_proceso, setCenterX(modalidades[i].t2_proceso, 16, 'Times'), 52);
                        pdf.setFontSize(12);
                        pdf.setFont('Times', 'bold');
                        pdf.text('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', 12, 'Times'), 66, { underline: true });
                        pdf.text(modalidades[i].t4_tipo, setCenterX(modalidades[i].t4_tipo, 14, 'Times'),80);

                        // Agregar pie de página
                        const currentPage = pdf.internal.getNumberOfPages();
                        //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                        const pagina = `Página ${currentPage}`;
                        // Establecer el color de la línea y grosor
                        pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                        pdf.setLineWidth(0.5); // Grosor de la línea
                        pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                        pdf.setTextColor(0); // Color del texto (negro)
                        pdf.setFontSize(8);
                        pdf.setFont('Times', 'normal');
                        pdf.text('Comisión de Admisión - Cod: '+carreras[k].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                        pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                        pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                    
                    },
                    didParseCell: function (data) {
                        const columnIndex = data.column.index;
                        // Verificar si es la penúltima columna (índice - 1)
                        if (columnIndex === data.table.columns.length - 2) {
                        // Aplicar negrita al valor de la penúltima columna
                        data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });


            }

   
            
            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;

       
            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_mod_libre_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        
        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
        });
        */

        
        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);
        

        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};


exports.getReporteModalidadesProcesoDetalle = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


        const modalidades = await queryAsync(`SELECT * FROM t4_tipos_postulantes A
            INNER JOIN t2_procesos B ON B.t2_pin = A.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles C ON C.t4_tipos_postulantes_t4_id = A.t4_id 
            INNER JOIN t6_carreras D ON D.t6_id = C.t6_carreras_t6_id
            INNER JOIN t5_areas E ON E.t5_id = D.t5_areas_t5_id
            INNER JOIN t14_postulantes F ON F.t6_carreras_t6_id = D.t6_id AND F.t4_tipos_postulantes_t4_id = A.t4_id
            INNER JOIN t10_vacantes G ON G.t8_grupos_detalles_t8_id = C.t8_id
            WHERE A.t2_procesos_t2_pin = ? AND A.t4_vacante = 1 GROUP BY A.t4_id ORDER BY A.t4_codigo ASC, CAST(D.t6_codigo AS SIGNED) ASC, A.t4_id ASC;`,[req.t1_pin]);
    

        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
            FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        

        var postulantes = [];      
        for(let i = 0; i < modalidades.length; i++){
            var new_modalidad = false;
            //console.log(carreras[i]);
            const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 1 AND C.t4_id = ? GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin, modalidades[i].t4_id]);
            
            for(let k = 0; k < carreras.length; k++){
                var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
                INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
                INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
                INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
                LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
                INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
                WHERE C.t6_id = ? AND B.t4_id = ? AND t4_vacante = 1 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[k].t6_id, modalidades[i].t4_id]);

                var data = [
                    ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
                ];
                for(let j = 0; j < tmp_postulantes.length; j++){
                    const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(A.t19_nota, 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                    INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                    INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                    INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
                    LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                    WHERE D.t2_pin = ? AND B.t14_codigo = ? ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                    tmp_postulantes[j].puntajes = tmp_puntajes;
    
                    var tmp_res_puntajes = [];
                    var asistio = 0;
                    for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                        //console.log(tmp_postulantes[j].puntajes[k])
                        tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                        if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                            let tmp_t19_categoria = "";
                            if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                                tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                                data[0].splice(3+k, 0, tmp_t19_categoria);  
                            }else{
                                if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                    tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                    //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                    data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                                }else{
                                    data[0].splice(3+k, 0, "P.");
                                }
                            }
                        }
    
                        if(tmp_postulantes[j].puntajes[k].t15_id){
                            asistio = 1;
                        }
                    }
    
                    if(tmp_postulantes[j].t14_estado){
                        if(vacantes[tmp_postulantes[j].t8_id] >= 1 && (Number(tmp_postulantes[j].puntaje) >= carreras[k].t2_minpuntaje)){
                            vacantes[tmp_postulantes[j].t8_id] -= 1;
                            tmp_postulantes[j].ingresa = 1;
                            data.push(
                                [
                                    j+1, 
                                    tmp_postulantes[j].t14_codigo, 
                                    tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                    tmp_postulantes[j].puntajeView,
                                    tmp_postulantes[j].t4_etiqueta
                                ]
                            );
                            for(let l = 0; l < tmp_res_puntajes.length; l++){
                                data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                            }
                            //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - " + tmp_postulantes[j].t4_etiqueta + " - " + tmp_postulantes[j].puntaje)
                        }else{
                            tmp_postulantes[j].ingresa = 0;
                            if(asistio){
                                data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        ""
                                    ]
                                );
                            }else{
                                data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        "No se presentó"
                                    ]
                                );
                            }  
                            for(let l = 0; l < tmp_res_puntajes.length; l++){
                                data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                            }
                            //console.log(tmp_postulantes[j].t6_carrera + " - " + tmp_postulantes[j].t4_tipo + " - " + tmp_postulantes[j].t14_codigo + " - " + tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + " - NO INGRESA - " + tmp_postulantes[j].puntaje)
                        }
                    }else{
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t14_observacion
                            ]
                        );
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                    }
    
                }
    
                postulantes.push(tmp_postulantes);



                var alturaTableY;
                if(pdf.autoTable.previous.finalY && new_modalidad){
                    var alturaTableY = pdf.autoTable.previous.finalY + 35;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), alturaTableY-8);
                    pdf.setFont('Times', 'normal');
                }else{
                    var alturaTableY = 102;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), 96);
                    pdf.setFont('Times', 'normal');
                    new_modalidad = true;
                }
                
                
                  
                //console.log(data);
                // Agregar la tabla al documento
                pdf.autoTable({
                    head: [data[0]],
                    body: data.slice(1),
                    startY: alturaTableY,
                    margin: { top: 90 },
                    styles: { 
                        font: "Arial", 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                    },
                    alternateRowStyles: {
                        fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                    },
                    bodyStyles: { 
                        cellPadding: 2 }
                    ,
                    headStyles: {
                        fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                        textColor: [0, 0, 0], // Color del texto en formato RGB
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                        1: { cellWidth: 'wrap', halign: 'center' },
                        3: { cellWidth: 'wrap', halign: 'center' },
                        4: { cellWidth: 'wrap', halign: 'center' },
                        5: { cellWidth: 'wrap', halign: 'center' },
                        6: { cellWidth: 'wrap', halign: 'center' },
                        7: { cellWidth: 'wrap', halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        // Agregar encabezado
                        pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                        pdf.setFontSize(18);
                        pdf.setFont('Times');
                        pdf.text(`${carreras[k].t5_siglas}`, 375, 45);
                        pdf.setFontSize(14);
                        pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                        pdf.setFontSize(12);
                        pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                        pdf.setFont('Times', 'normal');
                        pdf.setFontSize(16);
                        pdf.text(modalidades[i].t2_proceso, setCenterX(modalidades[i].t2_proceso, 16, 'Times'), 52);
                        pdf.setFontSize(12);
                        pdf.setFont('Times', 'bold');
                        pdf.text('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', 12, 'Times'), 66, { underline: true });
                        pdf.text(modalidades[i].t4_tipo, setCenterX(modalidades[i].t4_tipo, 14, 'Times'),80);

                        // Agregar pie de página
                        const currentPage = pdf.internal.getNumberOfPages();
                        //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                        const pagina = `Página ${currentPage}`;
                        // Establecer el color de la línea y grosor
                        pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                        pdf.setLineWidth(0.5); // Grosor de la línea
                        pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                        pdf.setTextColor(0); // Color del texto (negro)
                        pdf.setFontSize(8);
                        pdf.setFont('Times', 'normal');
                        pdf.text('Comisión de Admisión - Cod: '+carreras[k].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                        pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                        pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                    
                    },
                    didParseCell: function (data) {
                        const columnIndex = data.column.index;
                        // Verificar si es la penúltima columna (índice - 1)
                        if (columnIndex === data.table.columns.length - 2) {
                        // Aplicar negrita al valor de la penúltima columna
                        data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });


            }

   
            
            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;

            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
            
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_mod_detalle_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
        });
        */

        
        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);
        

        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};

exports.getReporteModalidadesProcesoDetalleLibre = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
        var vacantes = [];
        const tmp_vacantes = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? ORDER BY t5_siglas, t6_codigo, t4_id ASC;`,[req.t1_pin]);
        for(let i = 0; i < tmp_vacantes.length; i++){
            vacantes[tmp_vacantes[i].t8_id] = tmp_vacantes[i].t10_cantidad;
        }


        const modalidades = await queryAsync(`SELECT * FROM t4_tipos_postulantes A
            INNER JOIN t2_procesos B ON B.t2_pin = A.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles C ON C.t4_tipos_postulantes_t4_id = A.t4_id 
            INNER JOIN t6_carreras D ON D.t6_id = C.t6_carreras_t6_id
            INNER JOIN t5_areas E ON E.t5_id = D.t5_areas_t5_id
            INNER JOIN t14_postulantes F ON F.t6_carreras_t6_id = D.t6_id AND F.t4_tipos_postulantes_t4_id = A.t4_id
            INNER JOIN t10_vacantes G ON G.t8_grupos_detalles_t8_id = C.t8_id
            WHERE A.t2_procesos_t2_pin = ? AND A.t4_vacante = 0 GROUP BY A.t4_id ORDER BY A.t4_codigo ASC, CAST(D.t6_codigo AS SIGNED) ASC, A.t4_id ASC;`,[req.t1_pin]);
    

        const autoridades = await queryAsync(`SELECT t20_id, t20_nombre, IFNULL(t20_cargo, " ") AS t20_cargo, t20_orden, t20_alumno, t2_procesos_t2_pin 
            FROM t20_autoridades WHERE t2_procesos_t2_pin = ? ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_autoridades = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 0 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        const n_veedores = await queryAsync(`SELECT * FROM t20_autoridades WHERE t2_procesos_t2_pin = ? AND t20_alumno = 1 ORDER BY t20_orden ASC;`,[req.t1_pin]);
        

        var postulantes = [];      
        for(let i = 0; i < modalidades.length; i++){
            var new_modalidad = false;
            //console.log(carreras[i]);
            const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 0 AND C.t4_id = ? GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin, modalidades[i].t4_id]);
            
            for(let k = 0; k < carreras.length; k++){
                var tmp_postulantes = await queryAsync(`SELECT *, SUM(t19_nota) AS puntaje, FORMAT(ROUND(SUM(t19_nota),6),6) AS puntajeView FROM t14_postulantes A
                INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
                INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
                INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id
                LEFT JOIN t19_notas E ON E.t14_postulantes_t14_id = A.t14_id
                INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
                WHERE C.t6_id = ? AND B.t4_id = ? AND t4_vacante = 0 GROUP BY t14_codigo ORDER BY puntaje DESC;`,[carreras[k].t6_id, modalidades[i].t4_id]);

                var data = [
                    ['N°', 'COD.', 'APELLIDOS Y NOMBRES', 'TOTAL', 'OBSERVACIÓN']
                ];
                for(let j = 0; j < tmp_postulantes.length; j++){
                    const tmp_puntajes = await queryAsync(`SELECT A.t19_id, FORMAT(ROUND(A.t19_nota, 6), 6) AS t19_nota, A.t19_categoria, C.*, E.t15_id FROM t19_notas A
                    INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                    INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                    INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
                    LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                    WHERE D.t2_pin = ? AND B.t14_codigo = ? ORDER BY A.t19_id DESC;`, [t2_pin,tmp_postulantes[j].t14_codigo]);
                    tmp_postulantes[j].puntajes = tmp_puntajes;
    
                    var tmp_res_puntajes = [];
                    var asistio = 0;
                    for(let k = 0; k < tmp_postulantes[j].puntajes.length; k++){
                        //console.log(tmp_postulantes[j].puntajes[k])
                        tmp_res_puntajes.push(tmp_postulantes[j].puntajes[k].t19_nota);
                        if(data[0].length < tmp_postulantes[j].puntajes.length + 5){
                            let tmp_t19_categoria = "";
                            if(Number(tmp_postulantes[j].puntajes[k].t3_importable)==1){
                                tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t3_abreviatura;
                                data[0].splice(3+k, 0, tmp_t19_categoria);  
                            }else{
                                if(tmp_postulantes[j].puntajes[k].t19_categoria){
                                    tmp_t19_categoria = tmp_postulantes[j].puntajes[k].t19_categoria.substring(0, 5);
                                    //let tmp_t19_categoria2 = tmp_t19_categoria.substring(0, 5);
                                    data[0].splice(3+k, 0, "P."+tmp_t19_categoria);
                                }else{
                                    data[0].splice(3+k, 0, "P.");
                                }
                            }
                        }
    
                        if(tmp_postulantes[j].puntajes[k].t15_id){
                            asistio = 1;
                        }
                    }
    
                    if(tmp_postulantes[j].t14_estado){
                        tmp_postulantes[j].ingresa = 0;
                        if(asistio){
                            data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        tmp_postulantes[j].t4_etiqueta
                                    ]
                            );
                        }else{
                            data.push(
                                    [
                                        j+1, 
                                        tmp_postulantes[j].t14_codigo, 
                                        tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                        tmp_postulantes[j].puntajeView,
                                        "No se presentó"
                                    ]
                            );
                        }  
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                    }else{
                        data.push(
                            [
                                j+1, 
                                tmp_postulantes[j].t14_codigo, 
                                tmp_postulantes[j].t14_apellido_pat + " " + tmp_postulantes[j].t14_apellido_mat + ", " + convertirNombre(tmp_postulantes[j].t14_nombres),
                                tmp_postulantes[j].puntajeView,
                                tmp_postulantes[j].t14_observacion
                            ]
                        );
                        for(let l = 0; l < tmp_res_puntajes.length; l++){
                            data[j+1].splice(3+l, 0, tmp_res_puntajes[l]);
                        }
                    }
    
                }
    
                postulantes.push(tmp_postulantes);



                var alturaTableY;
                if(pdf.autoTable.previous.finalY && new_modalidad){
                    var alturaTableY = pdf.autoTable.previous.finalY + 35;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, alturaTableY-20, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), alturaTableY-8);
                    pdf.setFont('Times', 'normal');
                }else{
                    var alturaTableY = 102;
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 85, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.setFont('Times', 'bold');
                    pdf.text(carreras[k].t6_carrera, setCenterX(carreras[k].t6_carrera, 14, 'Times'), 96);
                    pdf.setFont('Times', 'normal');
                    new_modalidad = true;
                }
                
                
                  
                //console.log(data);
                // Agregar la tabla al documento
                pdf.autoTable({
                    head: [data[0]],
                    body: data.slice(1),
                    startY: alturaTableY,
                    margin: { top: 90 },
                    styles: { 
                        font: "Arial", 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                    },
                    alternateRowStyles: {
                        fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                    },
                    bodyStyles: { 
                        cellPadding: 2 }
                    ,
                    headStyles: {
                        fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                        textColor: [0, 0, 0], // Color del texto en formato RGB
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                        1: { cellWidth: 'wrap', halign: 'center' },
                        3: { cellWidth: 'wrap', halign: 'center' },
                        4: { cellWidth: 'wrap', halign: 'center' },
                        5: { cellWidth: 'wrap', halign: 'center' },
                        6: { cellWidth: 'wrap', halign: 'center' },
                        7: { cellWidth: 'wrap', halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        // Agregar encabezado
                        pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                        pdf.setFontSize(18);
                        pdf.setFont('Times');
                        pdf.text(`${carreras[k].t5_siglas}`, 375, 45);
                        pdf.setFontSize(14);
                        pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                        pdf.setFontSize(12);
                        pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                        pdf.setFont('Times', 'normal');
                        pdf.setFontSize(16);
                        pdf.text(modalidades[i].t2_proceso, setCenterX(modalidades[i].t2_proceso, 16, 'Times'), 52);
                        pdf.setFontSize(12);
                        pdf.setFont('Times', 'bold');
                        pdf.text('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR MODALIDAD', 12, 'Times'), 66, { underline: true });
                        pdf.text(modalidades[i].t4_tipo, setCenterX(modalidades[i].t4_tipo, 14, 'Times'),80);

                        // Agregar pie de página
                        const currentPage = pdf.internal.getNumberOfPages();
                        //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                        const pagina = `Página ${currentPage}`;
                        // Establecer el color de la línea y grosor
                        pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                        pdf.setLineWidth(0.5); // Grosor de la línea
                        pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                        pdf.setTextColor(0); // Color del texto (negro)
                        pdf.setFontSize(8);
                        pdf.setFont('Times', 'normal');
                        pdf.text('Comisión de Admisión - Cod: '+carreras[k].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                        pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                        pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                    
                    },
                    didParseCell: function (data) {
                        const columnIndex = data.column.index;
                        // Verificar si es la penúltima columna (índice - 1)
                        if (columnIndex === data.table.columns.length - 2) {
                        // Aplicar negrita al valor de la penúltima columna
                        data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });


            }

   
            
            pdf.setDrawColor(0); // Color del borde (negro)
            pdf.setLineWidth(0.5); // Ancho del borde
            pdf.line(30, pdf.autoTable.previous.finalY, pdf.internal.pageSize.width - 30, pdf.autoTable.previous.finalY);

            pdf.setFontSize(8);
            pdf.setFont('Arial');
            pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
            pdf.setLineWidth(0.5); // Grosor de la línea

            var autoridadesY = pdf.autoTable.previous.finalY + 30;
            var espacioYDisp = pdf.internal.pageSize.height - pdf.autoTable.previous.finalY;

            if(espacioYDisp >= 0 && espacioYDisp <= 80 && (n_autoridades.length>0 || n_veedores>0)){
                pdf.addPage();
                pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                pdf.setFontSize(18);
                pdf.setFont('Times');
                pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                pdf.setFontSize(14);
                pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                pdf.setFontSize(12);
                pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                pdf.setFontSize(16);
                pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                pdf.setFontSize(12);
                pdf.setFont('Times', 'bold');
                pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
    
                // Agregar pie de página
                const currentPage = pdf.internal.getNumberOfPages();
                //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                const pagina = `Página ${currentPage}`;
                // Establecer el color de la línea y grosor
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea
                pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                pdf.setTextColor(0); // Color del texto (negro)
                pdf.setFontSize(8);
                pdf.setFont('Times', 'normal');
                pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);

                // Dibujar el rectángulo con borde y fondo
                pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                pdf.setDrawColor(0);       // Color del borde (negro)
                pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                // Agregar el texto encima del rectángulo
                pdf.setTextColor(0);     // Color del texto (negro)
                pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);

                pdf.setFontSize(8);
                pdf.setFont('Arial');
                pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                pdf.setLineWidth(0.5); // Grosor de la línea

                autoridadesY = 140;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0],autoridadesY+65, setCenterLineX(autoridades[a].t20_orden)[1],autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            if(espacioYDisp > 80 && espacioYDisp <= 140 && (n_autoridades.length>0 || (n_autoridades > 0 && n_veedores>=0))){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                    }
                }

                if(n_autoridades > 3 || n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno==0){
                            if(autoridades[a].t20_orden==4){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==5){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }
                            if(autoridades[a].t20_orden==6){
                                pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                                pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                                pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                            }   
                        }
                    }
    
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY+65);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6+65);
                        }
                    } 
                }
                
            }
            if(espacioYDisp > 140 && espacioYDisp <= 210 && (n_autoridades.length>0 && n_veedores>=0)){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno==0){
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    }
                }

                if(n_veedores>0){
                    pdf.addPage();
                    pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                    pdf.setFontSize(18);
                    pdf.setFont('Times');
                    pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                    pdf.setFontSize(14);
                    pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                    pdf.setFontSize(12);
                    pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                    pdf.setFontSize(16);
                    pdf.text(carreras[i].t2_proceso + ' - LIBRES', setCenterX(carreras[i].t2_proceso + ' - LIBRES', 16, 'Times'), 52);
                    pdf.setFontSize(12);
                    pdf.setFont('Times', 'bold');
                    pdf.text('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', setCenterX('RESULTADO EN ORDEN DE MÉRITO POR CARRERAS', 12, 'Times'), 68, { underline: true });
        
                    // Agregar pie de página
                    const currentPage = pdf.internal.getNumberOfPages();
                    //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                    const pagina = `Página ${currentPage}`;
                    // Establecer el color de la línea y grosor
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
                    pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                    pdf.setTextColor(0); // Color del texto (negro)
                    pdf.setFontSize(8);
                    pdf.setFont('Times', 'normal');
                    pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, 30, pdf.internal.pageSize.height - 13);
                    pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                    pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);
    
                    // Dibujar el rectángulo con borde y fondo
                    pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                    pdf.setDrawColor(0);       // Color del borde (negro)
                    pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                    // Agregar el texto encima del rectángulo
                    pdf.setTextColor(0);     // Color del texto (negro)
                    pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
    
                    pdf.setFontSize(8);
                    pdf.setFont('Arial');
                    pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                    pdf.setLineWidth(0.5); // Grosor de la línea
    
                    autoridadesY = 140;
                    for(let a = 0; a < autoridades.length; a++){
                        if(autoridades[a].t20_alumno){
                            pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY+6);
                        }
                    }
                }
                
            }
            if(espacioYDisp > 210){
                autoridadesY = pdf.autoTable.previous.finalY + 50;
                for(let a = 0; a < autoridades.length; a++){
                    if(autoridades[a].t20_alumno){
                        pdf.line(35 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130, 80 + ((autoridades[a].t20_orden-1)*80),autoridadesY + 130);
                        pdf.text(autoridades[a].t20_nombre, 45 + ((autoridades[a].t20_orden-1)*80), autoridadesY + 6 + 130);
                    }else{
                        if(autoridades[a].t20_orden==1){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==2){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==3){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12);
                        }
                        if(autoridades[a].t20_orden==4){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==5){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                        if(autoridades[a].t20_orden==6){
                            pdf.line(setCenterLineX(autoridades[a].t20_orden)[0], autoridadesY + 65, setCenterLineX(autoridades[a].t20_orden)[1], autoridadesY + 65);
                            pdf.text(autoridades[a].t20_nombre, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_nombre), autoridadesY + 6 + 65);
                            pdf.text(autoridades[a].t20_cargo, setCenterTextX(autoridades[a].t20_orden,autoridades[a].t20_cargo), autoridadesY + 12 + 65);
                        }
                    } 
                
                }
            }
            
            
            pdf.addPage();


        }
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_mod_detalle_libres_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        
        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
        });
        */

        
        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);
        

        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        return res.status(200).json(200);
        */

    
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }


};



exports.getReporteBoleta = async (req, res) => {

    const pdf_margin_left = 30;
    const pdf_firma = 100;
    const pdf_firma_margin = 43;

    try {

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
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
            isUnicode: true
        });

        // Ruta de la imagen PNG
        const imgData = fs.readFileSync('static/uncp.png');
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



        const t2_pin = req.t1_pin;
    
    
        const carreras = await queryAsync(`SELECT * FROM t6_carreras A
            INNER JOIN t5_areas D ON D.t5_id = A.t5_areas_t5_id
            INNER JOIN t2_procesos F ON F.t2_pin = D.t2_procesos_t2_pin
            INNER JOIN t8_grupos_detalles B ON B.t6_carreras_t6_id = A.t6_id 
            INNER JOIN t4_tipos_postulantes C ON B.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t14_postulantes G ON G.t6_carreras_t6_id = A.t6_id AND G.t4_tipos_postulantes_t4_id = C.t4_id
            INNER JOIN t10_vacantes E ON E.t8_grupos_detalles_t8_id = B.t8_id
            WHERE C.t2_procesos_t2_pin = ? AND C.t4_vacante = 1 GROUP BY t6_id ORDER BY t5_siglas ASC, CAST(t6_codigo AS SIGNED) ASC, t4_id ASC;`,[req.t1_pin]);
            
        const examen = await queryAsync(`SELECT * FROM t3_examenes INNER JOIN t2_procesos ON t2_procesos_t2_id = t2_id WHERE t3_importable = 0 AND t2_pin = ?`,[req.t1_pin]);
    
          
        for(let i = 0; i < carreras.length; i++){
            //console.log(carreras[i]);
            var tmp_postulantes = await queryAsync(`SELECT *, SUM(t18_valor) AS valor, FORMAT(ROUND(SUM(t18_valor),6),6) AS valorView
            FROM t14_postulantes A
            INNER JOIN t4_tipos_postulantes B ON A.t4_tipos_postulantes_t4_id = B.t4_id
            INNER JOIN t6_carreras C ON A.t6_carreras_t6_id = C.t6_id 
            INNER JOIN t8_grupos_detalles D ON D.t6_carreras_t6_id = C.t6_id AND D.t4_tipos_postulantes_t4_id = B.t4_id

            INNER JOIN t7_grupos G ON G.t7_id = D.t7_grupos_t7_id
            INNER JOIN t13_factores H ON H.t7_grupos_t7_id = G.t7_id
            
            INNER JOIN t10_vacantes F ON F.t8_grupos_detalles_t8_id = D.t8_id
            LEFT JOIN t15_identidades I ON I.t14_postulantes_t14_id = A.t14_id
            LEFT JOIN t3_examenes  M on I.t3_examenes_t3_id = M.t3_id
			LEFT JOIN t2_procesos N on M.t2_procesos_t2_id = N.t2_id

            LEFT JOIN t18_calificaciones E ON E.t14_postulantes_t14_id = A.t14_id


            WHERE C.t6_id = ? AND t4_vacante = 1 AND N.t2_pin = ? AND H.t3_examenes_t3_id = ? GROUP BY t14_codigo ORDER BY valor DESC;`,[carreras[i].t6_id, req.t1_pin, examen[0].t3_id]);
        
            
            for(let j = 0; j < tmp_postulantes.length; j++){
                var data_head = [
                    ['N°', 'MARCADO', 'CLAVE', 'VALOR']
                ];
                var data_body = [];
                const tmp_calificacion = await queryAsync(`SELECT A.*, E.t15_id FROM t18_calificaciones A
                INNER JOIN t14_postulantes B ON A.t14_postulantes_t14_id = B.t14_id 
                INNER JOIN t3_examenes C ON B.t3_examenes_t3_id = C.t3_id
                INNER JOIN t2_procesos D ON C.t2_procesos_t2_id = D.t2_id
				LEFT JOIN t15_identidades E ON E.t14_postulantes_t14_id = B.t14_id
                WHERE D.t2_pin = ? AND B.t14_codigo = ? AND C.t3_importable = 0 ORDER BY t18_id ASC;`, [t2_pin, tmp_postulantes[j].t14_codigo]);

                var asistio = 0;
                for(let k = 0; k < tmp_calificacion.length; k++){
                    data_body.push([tmp_calificacion[k].t18_pregunta,tmp_calificacion[k].t18_marcado,tmp_calificacion[k].t18_clave,tmp_calificacion[k].t18_valor]);

                    if(tmp_calificacion[k].t15_id){
                        asistio = 1;
                    }

                }

                console.log(data_body.length)
                var table_mitad = 0;
                if(data_body.length%2==0){
                    table_mitad = data_body.length/2
                }else{
                    table_mitad = (data_body.length - 1)/2
                }

                console.log(table_mitad)

                //console.log(data);
                // Agregar la tabla al documento
                pdf.autoTable({
                    head: [data_head[0]],
                    body: data_body.slice(0, table_mitad),
                    startY: 142,
                    tableWidth: 150,
                    styles: { 
                        font: "Arial", 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                    },
                    alternateRowStyles: {
                        fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                    },
                    bodyStyles: { 
                        cellPadding: 1 }
                    ,
                    headStyles: {
                        fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                        textColor: [0, 0, 0], // Color del texto en formato RGB
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                        1: { cellWidth: 'wrap', halign: 'center' },
                        2: { cellWidth: 'wrap', halign: 'center' },
                        3: { cellWidth: 'wrap', halign: 'center' },
                        4: { cellWidth: 'wrap', halign: 'center' },
                        5: { cellWidth: 'wrap', halign: 'center' },
                        6: { cellWidth: 'wrap', halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        // Agregar encabezado
                        
                        pdf.addImage(base64Image, 'PNG', 30, 20, 50, 45);
                        pdf.setFontSize(18);
                        pdf.setFont('Times');
                        pdf.text(`${carreras[i].t5_siglas}`, 375, 45);
                        pdf.setFontSize(14);
                        pdf.text('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', setCenterX('UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ', 14, 'Times'), 25);
                        pdf.setFontSize(12);
                        pdf.text('COMISIÓN DE ADMISIÓN', setCenterX('COMISIÓN DE ADMISIÓN', 12, 'Times'), 35);
                        pdf.setFont('Times', 'normal');
                        pdf.setFontSize(16);
                        pdf.text(carreras[i].t2_proceso, setCenterX(carreras[i].t2_proceso, 16, 'Times'), 52);
                        pdf.setFontSize(12);
                        pdf.setFont('Times', 'bold');
                        pdf.text('HOJA DE RESPUESTAS DE POSTULANTE', setCenterX('HOJA DE RESPUESTAS DE POSTULANTE', 12, 'Times'), 68, { underline: true });
                        let nombre_full = tmp_postulantes[j].t14_apellido_pat + ' ' + tmp_postulantes[j].t14_apellido_mat + ', ' + convertirNombre(tmp_postulantes[j].t14_nombres);
                        pdf.setFontSize(10);
                        pdf.setFont('Arial', 'bold');
                        pdf.text(nombre_full, setCenterX(nombre_full, 12, 'Arial'), 104, { underline: true });




                        
                        pdf.setFontSize(9);
                        pdf.setFont('Arial', 'normal');
                        pdf.text('Código del postulante:', 30, 120);
                        pdf.text(`${tmp_postulantes[j].t14_codigo}`, 120, 120);
                        pdf.text('Pab. y aula:', 30, 130);
                        
                        //console.log(tmp_postulantes[j])
                        asistio == 1 ? pdf.text(tmp_postulantes[j].t15_pabellon, 120, 130) : pdf.text("No se presentó", 120, 130);
                        
                        



                        pdf.text('Total acumulado:', pdf.internal.pageSize.width - 165, pdf.internal.pageSize.height - 95);
                        pdf.text(`${tmp_postulantes[j].valorView}`, pdf.internal.pageSize.width - 95, pdf.internal.pageSize.height - 95);
                        pdf.text('Factor de conversión:', pdf.internal.pageSize.width - 165, pdf.internal.pageSize.height - 85);
                        pdf.text(`${tmp_postulantes[j].t13_factor}`, pdf.internal.pageSize.width - 95, pdf.internal.pageSize.height - 85);
                        pdf.text('Puntaje obtenido:', pdf.internal.pageSize.width - 165, pdf.internal.pageSize.height - 70);

                        let punt_final = tmp_postulantes[j].valor*tmp_postulantes[j].t13_factor;
                        punt_final = punt_final.toFixed(6);

                        pdf.text(`${punt_final}`, pdf.internal.pageSize.width - 95, pdf.internal.pageSize.height - 70);


                        //console.log(tmp_postulantes[j])
                        
                        pdf.text('Litho código:', 200, 120);
                        asistio == 1 ? pdf.text(`${tmp_postulantes[j].t15_litho}`, 200, 130) : pdf.text("No se presentó", 200, 130);

                        pdf.text('Lectura Identi:', 280, 120);
                        asistio == 1 ? pdf.text(`${tmp_postulantes[j].t15_lectura}`, 280, 130) : pdf.text("No se presentó", 280, 130);

                     
                        


                        // Agregar pie de página
                        const currentPage = pdf.internal.getNumberOfPages();
                        //const currentPage = pdf.internal.getNumberOfPages() + data.pageNumber;
                        const pagina = `Página ${currentPage}`;
                        // Establecer el color de la línea y grosor
                        pdf.setDrawColor(0); // Color de la línea en formato RGB (negro)
                        pdf.setLineWidth(0.5); // Grosor de la línea
                        pdf.line(30, pdf.internal.pageSize.height - 22, 415, pdf.internal.pageSize.height - 22);
                        pdf.setTextColor(0); // Color del texto (negro)
                        pdf.setFontSize(8);
                        pdf.setFont('Times', 'normal');
                        pdf.text('Comisión de Admisión - Cod: '+carreras[i].t2_pin, data.settings.margin.left, pdf.internal.pageSize.height - 13);
                        pdf.text(getFormattedDate(), setCenterX(getFormattedDate(), 8, 'Times'), pdf.internal.pageSize.height - 13);
                        pdf.text(pagina, pdf.internal.pageSize.width - 55, pdf.internal.pageSize.height - 13);



                        // Dibujar el rectángulo con borde y fondo
                        pdf.setFillColor(170, 170, 170);  // Color de fondo en formato RGB
                        pdf.roundedRect(30, 72, 385, 16, 3, 3, 'F');  // 'FD' indica que se deben dibujar el borde y el fondo
                        pdf.setDrawColor(0);       // Color del borde (negro)
                        pdf.roundedRect(30, 72, 385, 16, 3, 3, 'D');  // 'FD' indica que se deben dibujar el borde y el fondo
                        // Agregar el texto encima del rectángulo
                        pdf.setTextColor(0);     // Color del texto (negro)
                        pdf.setFont('Times', 'bold');
                        pdf.text(carreras[i].t6_carrera, setCenterX(carreras[i].t6_carrera, 14, 'Times'), 84);
                        pdf.setFont('Times', 'normal');
                        
                    },
                    didParseCell: function (data) {
                        const columnIndex = data.column.index;
                        // Verificar si es la penúltima columna (índice - 1)
                        if (columnIndex === data.table.columns.length - 2) {
                        // Aplicar negrita al valor de la penúltima columna
                        data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });

                pdf.autoTable({
                    head: [data_head[0]],
                    body: data_body.slice(-table_mitad),
                    startY: 142,
                    margin: { left: 200 },
                    tableWidth: 150,
                    styles: { 
                        font: "Arial", 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                    },
                    alternateRowStyles: {
                        fillColor: [215, 215, 215], // Color de fondo para filas alternas en formato RGB
                    },
                    bodyStyles: { 
                        cellPadding: 1 }
                    ,
                    headStyles: {
                        fillColor: [250, 250, 250], // Color de fondo para el encabezado en formato RGB
                        textColor: [0, 0, 0], // Color del texto en formato RGB
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 'wrap', halign: 'center' }, // Centra el texto en la columna 1 (índice 0)
                        1: { cellWidth: 'wrap', halign: 'center' },
                        2: { cellWidth: 'wrap', halign: 'center' },
                        3: { cellWidth: 'wrap', halign: 'center' },
                        4: { cellWidth: 'wrap', halign: 'center' },
                        5: { cellWidth: 'wrap', halign: 'center' },
                        6: { cellWidth: 'wrap', halign: 'center' }
                    },
                    didDrawPage: function (data) {
                       
                    },
                    didParseCell: function (data) {
                        const columnIndex = data.column.index;
                        // Verificar si es la penúltima columna (índice - 1)
                        if (columnIndex === data.table.columns.length - 2) {
                        // Aplicar negrita al valor de la penúltima columna
                        data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });

                pdf.addPage();


            }


            
            

            


        }
        
       
        
        pdf.deletePage(pdf.internal.getNumberOfPages());


        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const nombreArchivo = `Reporte_boletas_${uniqueId}.pdf`;
        const filePath = path.join(__dirname,'..','reportes',nombreArchivo);

        /*
        pdf.save(filePath);
        opn(filePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
            return res.status(200).json(200);
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
            return res.status(200).json(404);
        });
        */



        
        // Guardar el PDF en el sistema de archivos
        pdf.save(filePath, (err) => {
            console.log('PDF guardado exitosamente en:', filePath);
            // Enviar el PDF como respuesta al cliente
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).send('Error interno del servidor');
                }
            });
        });
        return res.sendFile(filePath);
        

        /*
        const pdfFilePath = 'archivo.pdf';
        pdf.save(pdfFilePath);
        opn(pdfFilePath).then(() => {
            console.log('Archivo PDF abierto exitosamente.');
        }).catch(err => {
            console.error('Error al intentar abrir el archivo PDF:', err);
        });
        return res.status(200).json(200);
        */

    
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
