const { db } = require('../config/db');
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require('nodemailer');
const ShortUniqueId = require('short-unique-id');
const e = require('express');
dotenv.config();


// Configuración del transporte SMTP con Postfix
const transporter = nodemailer.createTransport({
  host: 'mail.fudecuncp.pe', // Reemplaza con el host de tu servidor SMTP Postfix
  port: 465, // Usa el puerto adecuado (por defecto, 587 es para TLS, 465 para SSL)
  secure: true, // Cambia a true si tu servidor usa SSL en lugar de TLS
  auth: {
    user: 'notificaciones@fudecuncp.pe', // Tu correo
    pass: 'ae9a56ed87' // La contraseña de tu correo
  },
  tls: {
    rejectUnauthorized: false // Esto es necesario si el certificado es autofirmado
  }
});



exports.register = async (req, res) => {
  try {
    
      const { t2_email, t2_documento } = JSON.parse(req.body.data);
  
      if (!t2_email || !t2_documento) {
        throw new Error("Revise los campos obligatorios.");
      }

      if(t2_documento.length!=8){
        throw new Error("El DNI ingresado no es correcto.");
      }

      const uid = new ShortUniqueId({ 
        length: 8, // Longitud de la contraseña
        dictionary: 'hex' // Solo letras mayúsculas y números
      });
      const t2_pass = uid.rnd();
      console.log(t2_pass)

      const results0 = await queryAsync("SELECT * FROM t2_alumnos WHERE t2_estado = 1 AND (TRIM(t2_email) = TRIM(?) OR TRIM(t2_documento) = TRIM(?));", [t2_email, t2_documento ]);
      if(results0.length>0){
        throw new Error("EL DNI y/o correo electronico ya se encuentran registrados.");
      }else{
        const results = await queryAsync(`INSERT INTO t2_alumnos (t2_tipodoc, t2_documento, t2_email, t2_pass, t2_fechareg, t2_estado) VALUES (?, TRIM(?), TRIM(?), ?, NOW(), ?);`, 
          [1, t2_documento, t2_email, t2_pass, 0]);
        const results1 = await queryAsync(`INSERT INTO t3_perfiles (t3_nombres, t3_apellidos, t3_pais, t2_alumnos_t2_id) VALUES (?, ?, ?, ?);`, 
          ["","",0,results.insertId]);


        // Enviar el correo de confirmación
        const mailOptions = {
          from: 'notificaciones@fudecuncp.pe', // El remitente
          to: t2_email, // Correo del usuario registrado
          subject: 'Registro exitoso en la plataforma virtual de FUDECUNCP', // Asunto del correo
          text: `Hola, has sido registrado exitosamente en la plataforma virtual de FUDECUNCP. Tu contraseña temporal es: ${t2_pass}
          Para activar tu cuenta e iniciar sesión, por favor sigue el siguiente enlace: https://fudecuncp.pe/intranet/login`, // Cuerpo en texto plano
          html: `
            <h1>Registro exitoso en la plataforma virtual de FUDECUNCP</h1>
            <p>Hola, has sido registrado exitosamente en nuestra plataforma. Tu contraseña temporal es: <strong>${t2_pass}</strong></p>
            <p>Para activar tu cuenta y empezar a usarla, haz clic en el botón de abajo:</p>
            <a href="https://fudecuncp.pe/intranet/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Iniciar sesión</a>
            <p>Si el botón no funciona, también puedes copiar y pegar el siguiente enlace en tu navegador:</p>
            <a href="https://fudecuncp.pe/intranet/login">https://fudecuncp.pe/intranet/login</a>
          ` // Cuerpo en HTML
        };

        await transporter.sendMail(mailOptions); // Enviar el correo

        return res.status(200).json({ message: "Registro exitoso y correo enviado" });
      }

      
  } catch (error) {
      return res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {

      const { t1_email, t1_password, t2_panel } = JSON.parse(req.body.data);

      if (!t1_email || !t1_password || !t2_panel) {
        throw new Error("Revise los campos obligatorios.");
      }

      const results = await queryAsync(`SELECT * FROM t1_personas 
        INNER JOIN t3_accesos ON t1_personas_t1_id = t1_id
        INNER JOIN t2_roles ON t2_roles_t2_id = t2_id
        WHERE t1_email = ? AND t2_panel = ? AND t3_estado = 1;`, [t1_email, t2_panel]);

      if(results.length > 0 && results[0].t1_password === t1_password) {
        const token = jwt.sign({ t1_id: results[0].t1_id, t2_id: results[0].t2_id}, process.env.TOKEN_SECRET, { expiresIn: "12h" });
        return res.status(200).json({ token });
      }else{
        return res.status(401).json({ error: "Credenciales incorrectas." });
      }

  } catch (error) {
      return res.status(500).json({ error: error.message });
  }
};

exports.recuperar = async (req, res) => {
  try {
    
    const { t2_email } = JSON.parse(req.body.data);
  
    if (!t2_email) {
      throw new Error("Revise los campos obligatorios.");
    }

    const results0 = await queryAsync(`SELECT * FROM t2_alumnos WHERE t2_email = ? ORDER BY t2_estado DESC, t2_fechareg DESC LIMIT 1;`, [t2_email]);
     

    if (results0.length > 0) {
          // Enviar el correo de confirmación
          const mailOptions = {
            from: 'notificaciones@fudecuncp.pe', // El remitente
            to: t2_email, // Correo del usuario registrado
            subject: 'Recuperación de contraseña de la plataforma virtual FUDECUNCP', // Asunto del correo
            text: `Hola, has solicitado la recuperación de tu contraseña en la plataforma virtual de FUDECUNCP. Tu contraseña es: ${results0[0].t2_pass}
            Para iniciar sesión, por favor sigue el siguiente enlace: https://fudecuncp.pe/intranet/login`, // Cuerpo en texto plano

            html: `
              <h1>Recuperación de contraseña de la plataforma virtual de FUDECUNCP</h1>
              <p>Hola, has solicitado la recuperación de tu contraseña. Tu contraseña es: <strong>${results0[0].t2_pass}</strong></p>
              <p>Para empezar a usarla, haz clic en el botón de abajo:</p>
              <a href="https://fudecuncp.pe/intranet/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
              <p>Si el botón no funciona, también puedes copiar y pegar el siguiente enlace en tu navegador:</p>
              <a href="https://fudecuncp.pe/intranet/login">https://fudecuncp.pe/intranet/login</a>
            ` // Cuerpo en HTML
         
          };

          await transporter.sendMail(mailOptions); // Enviar el correo

          return res.status(200).json({ message: "Su solicitud de recuperación de contraseña fue enviada a su correo electrónico." });

    } else {
      return res.status(401).json({ error: "El correo electronico no se encuentra registrado." });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}



exports.verifyToken = async (req, res, next) => {
    const header = req.header("Authorization") || "";
    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not provied" });
    }
    try {
      const payload = jwt.verify(token, process.env.TOKEN_SECRET);
      if(payload.t1_id){
        next();  
      }else{
        return res.status(403).json({ message: "Token not valid" });
      }
      
    } catch (error) {
      return res.status(403).json({ message: "Token not valid" });
    }
}


exports.token = async (req, res, next) => {
  const header = req.header("Authorization") || "";
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provied" });
  }
  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    if(payload.t1_id && payload.t2_id){
      const accesos = await queryAsync(`SELECT * FROM t1_personas 
        INNER JOIN t3_accesos ON t1_personas_t1_id = t1_id
        INNER JOIN t2_roles ON t2_roles_t2_id = t2_id
        WHERE t1_id = ? AND t2_id = ? AND t3_estado = 1;`, [payload.t1_id, payload.t2_id]);
      if(accesos.length===0){
        return res.status(403).json({ message: "Token not valid" });
      }else{
        accesos[0].t1_password = null;
        return res.status(200).json(accesos[0]);
      }
    }else{
      return res.status(403).json({ message: "Token not valid" });
    }
  } catch (error) {
    return res.status(403).json({ message: "Token not valid" });
  }
}

exports.tokenAdministrativo = async (req, res, next) => {
  const header = req.header("Authorization") || "";
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provied" });
  }
  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    if(payload.t1_id && payload.t2_id){
      const t2_panel = await queryAsync("SELECT t2_panel FROM t2_roles WHERE t2_id = ?", [payload.t2_id]);
      const accesos = await queryAsync(`SELECT * FROM t1_personas 
        INNER JOIN t3_accesos ON t1_personas_t1_id = t1_id
        INNER JOIN t2_roles ON t2_roles_t2_id = t2_id
        WHERE t1_id = ? AND t2_panel = ? AND t3_estado = 1;`, [payload.t1_id, t2_panel[0].t2_panel]);
      if(accesos.length===0){
        return res.status(403).json({ message: "Token not valid" });
      }else{
        accesos[0].t1_password = null;
        return res.status(200).json(accesos[0]);
      }
    }else{
      return res.status(403).json({ message: "Token not valid" });
    }
  } catch (error) {
    return res.status(403).json({ message: "Token not valid" });
  }
}




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