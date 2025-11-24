const db = require('../config/db');
const ExcelJS = require('exceljs');


exports.postData = async (req, res) => {

  function getRandomDateTimeBetween(dateString, startTime, endTime) {
    // Crear un objeto Date a partir de la cadena de fecha proporcionada
    const date = new Date(dateString);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
    }

    // Concatenar la fecha con la hora de inicio y fin
    const startDateTime = new Date(`${date.toISOString().split('T')[0]}T${startTime}`).getTime();
    const endDateTime = new Date(`${date.toISOString().split('T')[0]}T${endTime}`).getTime();

    // Verificar si startDateTime y endDateTime son válidos
    if (isNaN(startDateTime) || isNaN(endDateTime)) {
        throw new Error('Hora de inicio o fin inválida');
    }

    // Generar un número aleatorio entre el tiempo de inicio y el tiempo de fin
    const randomDateTime = new Date(startDateTime + Math.random() * (endDateTime - startDateTime));

    // Incrementar entre 20 a 50 segundos de manera aleatoria
    const additionalSeconds = Math.floor(Math.random() * 31) + 20; // Entre 20 y 50 segundos
    const randomDateTimePlus = new Date(randomDateTime.getTime() + additionalSeconds * 1000);

    // Formatear ambos tiempos como "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
        const datePart = date.toISOString().substr(0, 10);  // Obtener la parte de la fecha
        const timePart = date.toTimeString().substr(0, 8);  // Obtener la parte de la hora
        return `${datePart} ${timePart}`;
    };

    const randomDateTimeStr = formatDateTime(randomDateTime);
    const randomDateTimePlusStr = formatDateTime(randomDateTimePlus);

    // Retornar un array con los dos valores
    return [randomDateTimeStr, randomDateTimePlusStr];
  }


  console.log("iniciando");

  const results0 = await queryAsync(`SELECT *, COUNT(IF(accion='Marcar ENTRADA',1,NULL)) AS nro, DATE(inicio) AS f_inicio FROM reg_asistencias.asistencias GROUP BY DATE(inicio) HAVING nro >= 10 OR DATE(inicio) = '2021-06-25' OR DATE(inicio) = '2021-06-28' ORDER BY f_inicio;`);

  for(let i = 0; i < results0.length; i++){
    //console.log(results0[i].f_inicio)
    let [inicio1, fin1] = getRandomDateTimeBetween(results0[i].inicio, '07:20:00', '07:26:59');
    let [inicio2, fin2] = getRandomDateTimeBetween(results0[i].inicio, '15:40:00', '18:55:59');
  
    //console.log(inicio2 + ' - '+ fin2);
    
    await queryAsync(`INSERT INTO asistencias (inicio,fin,correo,nombre,dependencia,accion) VALUES (?,?,'rdamian@uncp.edu.pe','ROCIO DAMIAN ALVARADO','Oficina de Información y Comunicación','Marcar ENTRADA');`,
      [inicio1, fin1]);
    await queryAsync(`INSERT INTO asistencias (inicio,fin,correo,nombre,dependencia,accion) VALUES (?,?,'rdamian@uncp.edu.pe','ROCIO DAMIAN ALVARADO','Oficina de Información y Comunicación','Marcar SALIDA');`,
      [inicio2, fin2]);

  }

  return res.status(200).json(200);


  /*
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
              rowData.push(cell.value ? cell.value.toString() : '');
          });
          data.push(rowData);
      });

      console.log("borrar filas");
    
      await queryAsync("DELETE FROM asistencias WHERE id > 0;");

      var query = "INSERT INTO asistencias (inicio, fin, correo, nombre, dependencia, accion, actividades, personas) VALUES ";

      // Ignorar la primera fila (encabezados), comenzar desde i = 1
      for (let i = 1; i < data.length; i++) {
          let arrayInterno = data[i];

          // Construir la query para cada fila de datos
          query += `(${db.escape(arrayInterno[0])},${db.escape(arrayInterno[1])},${db.escape(arrayInterno[2])},${db.escape(arrayInterno[3])},${db.escape(arrayInterno[4])},${db.escape(arrayInterno[5])},${db.escape(arrayInterno[6])},${db.escape(arrayInterno[7])}),`;
      }

      query = query.slice(0,-1);
      console.log(query);
      const results = await queryAsync(query);
      return res.status(200).json(results);
      
  } catch (error) {
      return res.status(500).json({ error: error.message });
  }

  */
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
