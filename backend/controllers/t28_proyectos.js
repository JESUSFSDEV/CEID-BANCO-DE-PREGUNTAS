const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Obtener páginas para paginación
exports.getPages = async (req, res) => {
  try {
    const pageSize = parseInt(req.params.pageSize);
    const filtro = req.body;
    
    let query = 'SELECT COUNT(*) AS filas FROM t28_proyectos WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (filtro.t28_proyecto && filtro.t28_proyecto.trim() !== '') {
      query += ' AND (t28_proyecto LIKE ? OR t28_etiqueta LIKE ? OR t28_descripcion LIKE ?)';
      const searchTerm = `%${filtro.t28_proyecto.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
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

// Obtener datos para una página específica
exports.getData = async (req, res) => {
  try {
    const page = req.body;
    
    console.log(page)
    // Verificar que el objeto page tenga las propiedades necesarias
    if (!page || page.offset==null || page.size === undefined) {
      return res.status(400).json({ error: 'Parámetros de paginación inválidos' });
    }
    
    const query = `
      SELECT * FROM t28_proyectos INNER JOIN t47_areas ON t47_areas_t47_id = t47_id 
      ORDER BY t28_id DESC
      LIMIT ? OFFSET ?
    `;
    
    const results = await queryAsync(query, [page.size, page.offset]);
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error en getData:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener datos filtrados para una página específica
exports.getDataFilter = async (req, res) => {
  try {
    const { page, filtro } = req.body;
    
    // Verificar que los objetos tengan las propiedades necesarias
    if (!page || page.offset==null || page.size === undefined || !filtro) {
      return res.status(400).json({ error: 'Parámetros de filtrado inválidos' });
    }
    
    let query = 'SELECT * FROM t28_proyectos INNER JOIN t47_areas ON t47_areas_t47_id = t47_id WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (filtro.t28_proyecto && filtro.t28_proyecto.trim() !== '') {
      query += ' AND (t28_proyecto LIKE ? OR t28_etiqueta LIKE ?)';
      const searchTerm = `%${filtro.t28_proyecto.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY t28_id DESC LIMIT ? OFFSET ?';
    params.push(page.size, page.offset);
    
    const results = await queryAsync(query, params);
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error en getDataFilter:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener todos los proyectos
exports.getAll = async (req, res) => {
  try {
    const results = await queryAsync('SELECT * FROM t28_proyectos INNER JOIN t47_areas ON t47_areas_t47_id = t47_id ORDER BY t28_id DESC');
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error en getAll:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener un proyecto específico por ID
exports.getOne = async (req, res) => {
  try {
    const t28_id = req.params.id;
    
    const query = 'SELECT * FROM t28_proyectos INNER JOIN t47_areas ON t47_areas_t47_id = t47_id WHERE t28_id = ?';
    const results = await queryAsync(query, [t28_id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    return res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error en getOne:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo proyecto
exports.create = async (req, res) => {
  try {
    const { t28_proyecto, t28_etiqueta, t28_descripcion, t28_precio, t28_estado, t47_areas_t47_id } = req.body;

    // Validar campos obligatorios
    if (!t28_proyecto || t28_precio==null || t28_estado==null || t47_areas_t47_id==null) {
      return res.status(400).json({ error: 'Nombre del proyecto, precio, estado y área son obligatorios' });
    }
    
    // Validar que se hayan subido los archivos necesarios
    if (!req.files || !req.files.imagen || !req.files.archivo) {
      return res.status(400).json({ error: 'Imagen y archivo son obligatorios' });
    }
    
    const imgFile = req.files.imagen[0];
    const urlFile = req.files.archivo[0];
    
    const t28_img = imgFile.filename;
    const t28_url = urlFile.filename;
    
    const query = `
      INSERT INTO t28_proyectos (t28_proyecto, t28_etiqueta, t28_descripcion, t28_precio, t28_estado, t28_img, t28_url, t47_areas_t47_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const results = await queryAsync(
      query, 
      [t28_proyecto, t28_etiqueta || '', t28_descripcion || '', parseFloat(t28_precio), t28_estado, t28_img, t28_url, t47_areas_t47_id]
    );
    
    return res.status(201).json({
      id: results.insertId,
      message: 'Proyecto creado exitosamente'
    });
  } catch (error) {
    console.error('Error en create:', error);
    
    // Eliminar archivos subidos en caso de error
    if (req.files) {
      if (req.files.imagen && req.files.imagen[0]) {
        fs.unlinkSync(path.join(__dirname, '../uploads/proyectos/', req.files.imagen[0].filename));
      }
      if (req.files.archivo && req.files.archivo[0]) {
        fs.unlinkSync(path.join(__dirname, '../uploads/proyectos/', req.files.archivo[0].filename));
      }
    }
    
    return res.status(500).json({ error: error.message });
  }
};

// Actualizar un proyecto existente
exports.update = async (req, res) => {
  try {
    const t28_id = req.params.id;
    const { t28_proyecto, t28_etiqueta, t28_descripcion, t28_precio, t28_estado, t47_areas_t47_id } = req.body;

    // Validar campos obligatorios
    if (!t28_proyecto || t28_precio==null || t28_estado==null || t47_areas_t47_id==null) {
      return res.status(400).json({ error: 'Nombre del proyecto, precio, estado y área son obligatorios' });
    }
    
    // Obtener datos actuales del proyecto
    const currentData = await queryAsync('SELECT t28_img, t28_url FROM t28_proyectos WHERE t28_id = ?', [t28_id]);
    
    if (currentData.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    let t28_img = currentData[0].t28_img;
    let t28_url = currentData[0].t28_url;
    
    // Manejar la actualización de imagen
    if (req.files && req.files.imagen) {
      // Eliminar imagen anterior
      if (t28_img) {
        const oldImgPath = path.join(__dirname, '../uploads/proyectos/', t28_img);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      
      t28_img = req.files.imagen[0].filename;
    } else if (req.body.eliminar_imagen === '1') {
      // Si se solicita eliminar la imagen
      if (t28_img) {
        const oldImgPath = path.join(__dirname, '../uploads/proyectos/', t28_img);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      t28_img = null;
    }
    
    // Manejar la actualización de archivo
    if (req.files && req.files.archivo) {
      // Eliminar archivo anterior
      if (t28_url) {
        const oldFilePath = path.join(__dirname, '../uploads/proyectos/', t28_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      t28_url = req.files.archivo[0].filename;
    } else if (req.body.eliminar_archivo === '1') {
      // Si se solicita eliminar el archivo
      if (t28_url) {
        const oldFilePath = path.join(__dirname, '../uploads/proyectos/', t28_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      t28_url = null;
    }
    
    const query = `
      UPDATE t28_proyectos 
      SET t28_proyecto = ?, t28_etiqueta = ?, t28_descripcion = ?, t28_precio = ?, t28_estado = ?, t28_img = ?, t28_url = ?, t47_areas_t47_id = ?
      WHERE t28_id = ?
    `;
    
    await queryAsync(
      query, 
      [t28_proyecto, t28_etiqueta || '', t28_descripcion || '', parseFloat(t28_precio), t28_estado, t28_img, t28_url, t47_areas_t47_id, t28_id]
    );
    
    return res.status(200).json({
      message: 'Proyecto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en update:', error);
    
    // Eliminar archivos nuevos en caso de error
    if (req.files) {
      if (req.files.imagen && req.files.imagen[0]) {
        fs.unlinkSync(path.join(__dirname, '../uploads/proyectos/', req.files.imagen[0].filename));
      }
      if (req.files.archivo && req.files.archivo[0]) {
        fs.unlinkSync(path.join(__dirname, '../uploads/proyectos/', req.files.archivo[0].filename));
      }
    }
    
    return res.status(500).json({ error: error.message });
  }
};

// Eliminar un proyecto
exports.delete = async (req, res) => {
  try {
    const t28_id = req.params.id;
    
    // Obtener datos actuales del proyecto
    const currentData = await queryAsync('SELECT t28_img, t28_url FROM t28_proyectos WHERE t28_id = ?', [t28_id]);
    
    if (currentData.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Eliminar archivo de imagen si existe
    if (currentData[0].t28_img) {
      const imgPath = path.join(__dirname, '../uploads/proyectos/', currentData[0].t28_img);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }
    
    // Eliminar archivo adjunto si existe
    if (currentData[0].t28_url) {
      const filePath = path.join(__dirname, '../uploads/proyectos/', currentData[0].t28_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Eliminar registro de la base de datos
    await queryAsync('DELETE FROM t28_proyectos WHERE t28_id = ?', [t28_id]);
    
    return res.status(200).json({
      message: 'Proyecto eliminado exitosamente'
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
    const t47_id = Number(req.query.t47_id);

    let sql = "SELECT COUNT(*) AS filas FROM t28_proyectos WHERE t28_estado = 1 ";
    let params = [];

    if (index !== "") {
      sql += " AND t28_proyecto LIKE ?";
      params.push(`%${index}%`);
    }

    if (t47_id !== 0) {
      sql += " AND t47_areas_t47_id = ?";
      params.push(t47_id);
    }

    sql += " ORDER BY t28_id DESC;";

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
  const t28_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t28_proyectos INNER JOIN t47_areas ON t47_areas_t47_id = t47_id WHERE t28_estado = 1 AND t28_id = ?', [t28_id]);
    return res.status(200).json(results[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDataFilterIntranet = async (req, res) => {
  try {
    const index = req.query.index?.trim() || "";
    const t47_id = Number(req.query.t47_id);
    const size = req.query.size;
    const offset = req.query.offset;

    let sql = `
      SELECT * FROM t28_proyectos INNER JOIN t47_areas ON t47_areas_t47_id = t47_id 
      WHERE t28_estado = 1 
    `;
    let params = [];

    if (index !== "") {
      sql += " AND t28_proyecto LIKE ?";
      params.push(`%${index}%`);
    }

    if (t47_id !== 0) {
      sql += " AND t47_areas_t47_id = ?";
      params.push(t47_id);
    }

    sql += " ORDER BY t28_id DESC";

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
