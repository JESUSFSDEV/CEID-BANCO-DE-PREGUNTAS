const express = require('express');
const app = express();
const morgan=require('morgan');
const cors = require('cors');
const dotenv = require("dotenv");
const path = require('path');
dotenv.config();



//Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);
var corsOptions = {
  origin: '*', // Aqui debemos reemplazar el * por el dominio de nuestro front
  optionsSuccessStatus: 200 // Es necesario para navegadores antiguos o algunos SmartTVs
}





//Middleware
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.urlencoded({extended:true}));
app.use(express.json());


//Routes
const apiRoutes = require('./routes/api');
app.use('/api',apiRoutes);
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));



//Iniciando el servidor, escuchando...
app.listen(app.get('port'),()=>{
  console.log(`Server listening on port ${app.get('port')}`);
});




