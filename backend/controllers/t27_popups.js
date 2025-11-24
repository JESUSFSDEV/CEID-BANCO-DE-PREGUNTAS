const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getPaginar = async (req, res) => {
  try {
    const pages_size = Number(req.query.size);
    const index = req.query.index;
    var results;
    if(index.trim()!=""){
      results = await queryAsync(`SELECT COUNT(*) AS filas FROM t27_popups WHERE t27_id LIKE '%${index}%'ORDER BY t27_orden DESC;`);
    }else{
      results = await queryAsync('SELECT COUNT(*) AS filas FROM t27_popups ORDER BY t27_orden DESC;');
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
    if(req.query.size && req.query.offset){
      query = `SELECT * FROM t27_popups ORDER BY t27_orden ASC LIMIT ${req.query.size} OFFSET ${req.query.offset};`; 
    }else{
      query = "SELECT * FROM t27_popups ORDER BY t27_orden ASC;"; 
    }
    const results = await queryAsync(query);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  const t27_id = req.params.id;
  try {
    const results = await queryAsync('SELECT * FROM t27_popups WHERE t27_id = ?', [t27_id]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getActivePopups = async (req, res) => {
  try {
    const query = "SELECT * FROM t27_popups WHERE t27_estado = 1 ORDER BY t27_orden ASC;";
    const results = await queryAsync(query);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.postData = async (req, res) => {
  try {
    const { t27_orden, t27_estado } = JSON.parse(req.body.data);
    
    if (t27_orden==null || t27_estado==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    // Verify if file was uploaded
    let t27_img = null;
    if (req.file) {
      t27_img = req.file.filename;
    }

    const results = await queryAsync(
      'INSERT INTO t27_popups (t27_img, t27_estado, t27_orden) VALUES (?, ?, ?)',
      [t27_img, t27_estado, t27_orden]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.log(error.message);
    return res.status(400).send(error.message);
  }
};

exports.putData = async (req, res) => {
  try {
    const t27_id = req.params.id;
    const { t27_orden, t27_estado } = JSON.parse(req.body.data);

    if (t27_orden==null || t27_estado==null) {
      throw new Error("Revise los campos obligatorios.");
    }

    
    let results;
    // Check if file was uploaded
    if (req.file) {
      // Delete old image if exists
      const oldImage = await queryAsync('SELECT t27_img FROM t27_popups WHERE t27_id = ?', [t27_id]);
      if (oldImage[0].t27_img) {
        const filePath = path.join(__dirname, '../uploads/popups', oldImage[0].t27_img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const t27_img = req.file.filename;
      results = await queryAsync(
        'UPDATE t27_popups SET t27_estado = ?, t27_orden = ?, t27_img = ? WHERE t27_id = ?',
        [t27_estado, t27_orden, t27_img, t27_id]
      );
    } else {
      results = await queryAsync(
        'UPDATE t27_popups SET t27_estado = ?, t27_orden = ? WHERE t27_id = ?',
        [t27_estado, t27_orden, t27_id]
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

exports.deleteData = async (req, res) => {
  const t27_id = req.params.id;
  try {
    if (!isNaN(parseFloat(t27_id)) && isFinite(t27_id)) {
      // Delete image file if exists
      const popup = await queryAsync('SELECT t27_img FROM t27_popups WHERE t27_id = ?', [t27_id]);
      if (popup[0].t27_img) {
        const filePath = path.join(__dirname, '../uploads/popups', popup[0].t27_img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete record and reorder remaining popups
      await queryAsync('DELETE FROM t27_popups WHERE t27_id = ?', [t27_id]);
      
      // Reorder remaining popups
      const remainingPopups = await queryAsync('SELECT t27_id FROM t27_popups ORDER BY t27_orden ASC');
      for (let i = 0; i < remainingPopups.length; i++) {
        await queryAsync('UPDATE t27_popups SET t27_orden = ? WHERE t27_id = ?', 
          [i + 1, remainingPopups[i].t27_id]
        );
      }

      return res.status(200).json({ message: 'Popup deleted successfully' });
    } else {
      throw new Error("Invalid ID format");
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


// Helper function for database queries
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