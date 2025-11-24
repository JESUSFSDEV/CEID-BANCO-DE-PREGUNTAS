const { Console } = require('console');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Obtener páginas para paginación
exports.getPages = async (req, res) => {
  try {
    const pageSize = parseInt(req.params.pageSize);
    const index = req.query.index || null;
    
    let query = 'SELECT COUNT(*) AS filas FROM t48_demostraciones WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (index && index.trim() !== '') {
      query += ' AND (t48_titulo LIKE ?)';
      const searchTerm = `%${index.trim()}%`;
      params.push(searchTerm);
    }
    
    const results = await queryAsync(query, params);
    
    const totalRows = results[0].filas;
    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    
    const pagesArray = [];
    
    for (let i = 0; i < totalPages; i++) {
      let size;
      if (i + 1 === totalPages && totalRows % pageSize !== 0) {
        size = totalRows % pageSize;
      } else {
        size = pageSize;
      }
      
      pagesArray.push({
        pagina: i + 1,
        size: size,
        offset: i * pageSize,
        rows: totalRows
      });
    }
    
    return res.status(200).json(pagesArray);
  } catch (error) {
    console.error('Error en getPages:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener un proyecto específico por ID
exports.getData = async (req, res) => {
  try {
    const t48_id = req.params.id;
    
    const query = 'SELECT * FROM t48_demostraciones WHERE t48_id = ?;';
    const results = await queryAsync(query, [t48_id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    return res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error en getOne:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener datos filtrados para una página específica
exports.getDataFilter = async (req, res) => {
  try {
    const size = parseInt(req.query.size);
    const offset = parseInt(req.query.offset);
    const t48_titulo = (req.query.index) || null;
  
    let query = 'SELECT * FROM t48_demostraciones WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (t48_titulo && t48_titulo.trim() !== '') {
      query += ' AND (t48_titulo LIKE ?)';
      const searchTerm = `%${t48_titulo.trim()}%`;
      params.push(searchTerm);
    }

    query += ' ORDER BY t48_id DESC';

    if(size!=null && offset!=null) {
      query += ' LIMIT ? OFFSET ?';
      params.push(size, offset);
    }

    const results = await queryAsync(query, params);
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error en getDataFilter:', error);
    return res.status(500).json({ error: error.message });
  }
};





// Crear un nuevo proyecto
exports.create = async (req, res) => {
  try {

    const { t48_titulo, t48_etiqueta, t48_descripcion, t48_estado } = JSON.parse(req.body.data);

    // Validar campos obligatorios
    if (t48_titulo==null || t48_estado==null) {
      return res.status(400).json({ error: 'Nombre del proyecto y estado son obligatorios' });
    }
    
    // Validar que se hayan subido los archivos necesarios
    if (!req.files?.archivo) {
      return res.status(400).json({ error: 'El video es obligatorio' });
    }
    
    const t48_url = req.files?.archivo ? req.files.archivo[0].filename : null;
    const t48_img = req.files?.portada ? req.files.portada[0].filename : null;
    
    const query = `
      INSERT INTO t48_demostraciones (t48_titulo, t48_descripcion, t48_etiqueta, t48_url, t48_img, t48_estado, t48_fecha) 
      VALUES (?, ?, ?, ?, ?, ?, CURDATE())
    `;
    
    const results = await queryAsync(
      query, 
      [t48_titulo, t48_descripcion || '', t48_etiqueta || '', t48_url || null, t48_img || null, t48_estado]
    );
    
    return res.status(201).json({
      id: results.insertId,
      message: 'Demostración creada exitosamente'
    });
  } catch (error) {
    console.error('Error en create:', error);
    
    // Eliminar archivos subidos en caso de error
   
    if (req.files?.archivo?.[0]) {
        fs.unlinkSync(path.join(__dirname, '../uploads/demostraciones/', req.files.archivo[0].filename));
    }
    if (req.files?.portada?.[0]) {
        fs.unlinkSync(path.join(__dirname, '../uploads/demostraciones/', req.files.portada[0].filename));
    }
    
    return res.status(500).json({ error: error.message });
  }
};

// Actualizar un proyecto existente
exports.update = async (req, res) => {
  try {
    const t48_id = req.params.id;
    const { t48_titulo, t48_etiqueta, t48_descripcion, t48_estado } = JSON.parse(req.body.data);

    // Validar campos obligatorios
    if (!t48_titulo || t48_estado==null) {
      if (req.file) {
        fs.unlinkSync(path.join(__dirname, '../uploads/demostraciones/', req.file.filename));
      }
      return res.status(400).json({ error: 'Nombre del proyecto y estado son obligatorios' });
    }
    
    // Obtener datos actuales del proyecto
    const currentData = await queryAsync('SELECT t48_url, t48_img FROM t48_demostraciones WHERE t48_id = ?', [t48_id]);
    if (currentData.length === 0) {
      return res.status(404).json({ error: 'Demostración no encontrada' });
    }

    let t48_url = currentData[0].t48_url;
    let t48_img = currentData[0].t48_img;


    // Manejar la actualización de video
    if (req.files?.archivo?.[0]) {
      // Eliminar video anterior
      if (t48_url) {
        const oldImgPath = path.join(__dirname, '../uploads/demostraciones/', t48_url);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      t48_url = req.files.archivo[0].filename;
    } else if (req.body.eliminar_video === '1') {
      // Si se solicita eliminar el video
      if (t48_url) {
        const oldImgPath = path.join(__dirname, '../uploads/demostraciones/', t48_url);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      t48_url = null;
    }

    // Manejar la actualización de portada
    if (req.files?.portada?.[0]) {
      // Eliminar portada anterior
      if (t48_img) {
        const oldImgPath = path.join(__dirname, '../uploads/demostraciones/', t48_img);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      t48_img = req.files.portada[0].filename;
    } else if (req.body.eliminar_portada === '1') {
      // Si se solicita eliminar la portada
      if (t48_img) {
        const oldImgPath = path.join(__dirname, '../uploads/demostraciones/', t48_img);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      t48_img = null;
    }

    const query = `
      UPDATE t48_demostraciones 
      SET t48_titulo = ?, t48_etiqueta = ?, t48_descripcion = ?, t48_url = ?, t48_img = ?, t48_estado = ?
      WHERE t48_id = ?
    `;
    
    await queryAsync(
      query,
      [t48_titulo, t48_etiqueta || '', t48_descripcion || '', t48_url || null, t48_img || null, t48_estado, t48_id]
    );
    
    return res.status(200).json({
      message: 'Proyecto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en update:', error);
    
    // Eliminar archivos nuevos en caso de error
    if (req.files?.archivo?.[0]) {
      fs.unlinkSync(path.join(__dirname, '../uploads/demostraciones/', req.files.archivo[0].filename));
    }
    if (req.files?.portada?.[0]) {
      fs.unlinkSync(path.join(__dirname, '../uploads/demostraciones/', req.files.portada[0].filename));
    }
    
    return res.status(500).json({ error: error.message });
  }
};

// Eliminar un proyecto
exports.delete = async (req, res) => {
  try {
    const t48_id = req.params.id;
    
    // Obtener datos actuales del proyecto
    const currentData = await queryAsync('SELECT t48_url, t48_img FROM t48_demostraciones WHERE t48_id = ?', [t48_id]);
    
    if (currentData.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Eliminar archivo de imagen si existe
    if (currentData[0].t48_url) {
      const videoPath = path.join(__dirname, '../uploads/demostraciones/', currentData[0].t48_url);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
    if (currentData[0].t48_img) {
      const imgPath = path.join(__dirname, '../uploads/demostraciones/', currentData[0].t48_img);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }
    
    // Eliminar registro de la base de datos
    await queryAsync('DELETE FROM t48_demostraciones WHERE t48_id = ?', [t48_id]);
    
    return res.status(200).json({
      message: 'Demostración eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en delete:', error);
    return res.status(500).json({ error: error.message });
  }
};





exports.getPaginarIntranet = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index?.trim() || "";

    let sql = "SELECT COUNT(*) AS filas FROM t48_demostraciones WHERE t48_estado = 1 ";
    let params = [];

    if (index !== "") {
      sql += " AND t48_titulo LIKE ?";
      params.push(`%${index}%`);
    }

    sql += " ORDER BY t48_id DESC;";

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

exports.getDataIntranet = async (req, res) => {
  const t48_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t48_demostraciones WHERE t48_estado = 1 AND t48_id = ?', [t48_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilterIntranet = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT * FROM t48_demostraciones WHERE t48_estado = 1 
    `;
    let params = [];

    if (index !== "") {
      sql += " AND t48_titulo LIKE ?";
      params.push(`%${index}%`);
    }

    sql += " ORDER BY t48_id DESC";

    if(size!=null && offset!=null) {
      sql += " LIMIT ? OFFSET ?";
      params.push(parseInt(size), parseInt(offset));
    }
    
    const results = await queryAsync(sql, params);

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
