// config/db.js
const mysql = require('mysql2');
const dotenv = require("dotenv");
dotenv.config();

// Configuración para la primera base de datos (principal)
const pool1 = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Configuración para la segunda base de datos
const pool2 = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB2_HOST || process.env.DB_HOST, // Si no se especifica, usa el mismo host
  user: process.env.DB2_USER || process.env.DB_USER, // Si no se especifica, usa el mismo usuario
  password: process.env.DB2_PASSWORD || process.env.DB_PASSWORD, // Si no se especifica, usa la misma contraseña
  database: process.env.DB2_DATABASE // Esta debe ser diferente
});

// Eventos para la primera base de datos
pool1.on('connection', (connection) => {
  console.log('Nueva conexión a la base de datos principal (DB1)');
});

pool1.on('error', (err) => {
  console.error('Error en la base de datos principal (DB1):', err);
});

// Eventos para la segunda base de datos
pool2.on('connection', (connection) => {
  console.log('Nueva conexión a la base de datos secundaria (DB2)');
});

pool2.on('error', (err) => {
  console.error('Error en la base de datos secundaria (DB2):', err);
});

// Exportar ambas conexiones
module.exports = {
  db: pool1,        // Base de datos principal
  db2: pool2,        // Base de datos secundaria
  default: pool1     // Mantener compatibilidad con código existente
};