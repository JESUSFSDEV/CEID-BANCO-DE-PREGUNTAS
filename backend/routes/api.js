const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: './uploads' });
// Configurar Multer para almacenar archivos en una ruta específica

/*
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/certificados-conf')); // Ruta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);  // Nombre único con la extensión del archivo original
    }
});
const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/comprobantes')); // Ruta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);  // Nombre único con la extensión del archivo original
    }
});

const storage_cursos_portadas = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/cursos/portadas')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_cursos_promo = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/cursos/promo')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_certificados_conf = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/certificados-conf')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_labels = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/labels')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_cuentas = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/cuentas')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_popups = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/popups')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_convenios = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/convenios')); // Ruta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_proyectos = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/proyectos'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_recursos = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/aula-virtual'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_entregas = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/aula-virtual/entregas'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_mentores = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/mentores'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
const storage_demostraciones = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/demostraciones'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Nombre único con la extensión del archivo original
  }
});
  

const upload = multer({ storage: storage });
const upload2 = multer({ storage: storage2 });

const upload_cursos_portadas = multer({ storage: storage_cursos_portadas });
const upload_cursos_promo = multer({ storage: storage_cursos_promo });
const upload_certificados_conf = multer({ storage: storage_certificados_conf });
const upload_labels = multer({ storage: storage_labels });
const upload_cuentas = multer({ storage: storage_cuentas });
const upload_convenios = multer({ storage: storage_convenios });
const upload_popups = multer({ storage: storage_popups });
const upload_proyectos = multer({ storage: storage_proyectos });
const upload_recursos = multer({ storage: storage_recursos });
const upload_entregas = multer({ storage: storage_entregas });
const upload_mentores = multer({ storage: storage_mentores });
const upload_demostraciones = multer({ storage: storage_demostraciones });
*/


const userLogin = require('../controllers/auth');

const t1_usuariosController = require('../controllers/t1_usuarios');

const t5_idiomasController = require('../controllers/t5_idiomas');
const t6_nivelesController = require('../controllers/t6_niveles');
const t7_ciclosController = require('../controllers/t7_ciclos');
const t8_unidadesController = require('../controllers/t8_unidades');

//router.post('/importar', upload.single('file'), t99_importController.postData);




router.post('/login', upload.none(), userLogin.login);
router.post('/token', upload.none(), userLogin.token);
router.post('/tokenAdministrativo', upload.none(), userLogin.tokenAdministrativo);


/*
router.post('/intranet/register', upload.none(), userLogin.register);
router.post('/intranet/login', upload.none(), userLogin.login);
router.post('/intranet/recuperar', upload.none(), userLogin.recuperar);
router.post('/intranet/token', upload.none(), userLogin.token);
router.post('/intranet/tokendocente', upload.none(), userLogin.tokenDocente);
*/


router.get('/idiomas/paginar', userLogin.verifyToken, upload.none(), t5_idiomasController.getPaginar);
router.get('/idiomas/:id', userLogin.verifyToken, upload.none(), t5_idiomasController.getData);
router.get('/idiomas', userLogin.verifyToken, upload.none(), t5_idiomasController.getDataFilter);
router.post('/idiomas', userLogin.verifyToken, upload.none(), t5_idiomasController.postData);
router.put('/idiomas/:id', userLogin.verifyToken, upload.none(), t5_idiomasController.putData);
router.delete('/idiomas/:id', userLogin.verifyToken, upload.none(), t5_idiomasController.deleteData);

router.get('/niveles/paginar', userLogin.verifyToken, upload.none(), t6_nivelesController.getPaginar);
router.get('/niveles/:id', userLogin.verifyToken, upload.none(), t6_nivelesController.getData);
router.get('/niveles', userLogin.verifyToken, upload.none(), t6_nivelesController.getDataFilter);
router.post('/niveles', userLogin.verifyToken, upload.none(), t6_nivelesController.postData);
router.put('/niveles/:id', userLogin.verifyToken, upload.none(), t6_nivelesController.putData);
router.delete('/niveles/:id', userLogin.verifyToken, upload.none(), t6_nivelesController.deleteData);

router.get('/ciclos/paginar', userLogin.verifyToken, upload.none(), t7_ciclosController.getPaginar);
router.get('/ciclos/:id', userLogin.verifyToken, upload.none(), t7_ciclosController.getData);
router.get('/ciclos', userLogin.verifyToken, upload.none(), t7_ciclosController.getDataFilter);
router.post('/ciclos', userLogin.verifyToken, upload.none(), t7_ciclosController.postData);
router.put('/ciclos/:id', userLogin.verifyToken, upload.none(), t7_ciclosController.putData);
router.delete('/ciclos/:id', userLogin.verifyToken, upload.none(), t7_ciclosController.deleteData);

router.get('/unidades/paginar', userLogin.verifyToken, upload.none(), t8_unidadesController.getPaginar);
router.get('/unidades/:id', userLogin.verifyToken, upload.none(), t8_unidadesController.getData);
router.get('/unidades', userLogin.verifyToken, upload.none(), t8_unidadesController.getDataFilter);
router.post('/unidades', userLogin.verifyToken, upload.none(), t8_unidadesController.postData);
router.put('/unidades/:id', userLogin.verifyToken, upload.none(), t8_unidadesController.putData);
router.delete('/unidades/:id', userLogin.verifyToken, upload.none(), t8_unidadesController.deleteData);



/*
router.get('/usuarios/paginar', userLogin.verifyToken, upload.none(), t1_usuariosController.getPaginar);
router.get('/usuarios', userLogin.verifyToken, upload.none(), t1_usuariosController.getAllData);
router.get('/usuarios/:id', userLogin.verifyToken, upload.none(), t1_usuariosController.getData);
router.get('/usuarios/buscar/index', userLogin.verifyToken, upload.none(), t1_usuariosController.getDataFilter);
router.post('/usuarios', userLogin.verifyTokenAdmin, upload.none(), t1_usuariosController.postData);
router.put('/usuarios/:id', userLogin.verifyTokenAdmin, upload.none(), t1_usuariosController.putData);
router.delete('/usuarios/:id', userLogin.verifyTokenAdmin, upload.none(), t1_usuariosController.deleteData);

router.get('/alumnos/paginar', userLogin.verifyToken, upload.none(), t2_alumnosController.getPaginar);
router.get('/alumnos', userLogin.verifyToken, upload.none(), t2_alumnosController.getAllData);
router.get('/alumnos/:id', userLogin.verifyToken, upload.none(), t2_alumnosController.getData);
router.get('/alumnos/buscar/index', userLogin.verifyToken, upload.none(), t2_alumnosController.getDataFilter);
router.post('/alumnos', userLogin.verifyTokenAdmin, upload.none(), t2_alumnosController.postData);
router.post('/alumnos/activar', userLogin.verifyTokenIntranet, upload.none(), t2_alumnosController.postDataActivar);
router.put('/alumnos/:id', userLogin.verifyTokenAdmin, upload.none(), t2_alumnosController.putData);
router.delete('/alumnos/:id', userLogin.verifyTokenAdmin, upload.none(), t2_alumnosController.deleteData);

router.get('/mentores/paginar', userLogin.verifyToken, upload.none(), t6_mentoresController.getPaginar);
router.get('/mentores', userLogin.verifyToken, upload.none(), t6_mentoresController.getAllData);
router.get('/mentores/:id', userLogin.verifyToken, upload.none(), t6_mentoresController.getData);
router.get('/mentores/buscar/index', userLogin.verifyToken, upload.none(), t6_mentoresController.getDataFilter);
router.post('/mentores', userLogin.verifyTokenAdmin, upload.none(), t6_mentoresController.postData);
router.put('/mentores/:id', userLogin.verifyTokenAdmin, upload.none(), t6_mentoresController.putData);
router.delete('/mentores/:id', userLogin.verifyTokenAdmin, upload.none(), t6_mentoresController.deleteData);

router.get('/categorias/paginar', userLogin.verifyToken, upload.none(), t4_categoriasController.getPaginar);
router.get('/categorias', userLogin.verifyToken, upload.none(), t4_categoriasController.getAllData);
router.get('/categorias/:id', userLogin.verifyToken, upload.none(), t4_categoriasController.getData);
router.get('/categorias/buscar/index', userLogin.verifyToken, upload.none(), t4_categoriasController.getDataFilter);
router.post('/categorias', userLogin.verifyTokenAdmin, upload.none(), t4_categoriasController.postData);
router.put('/categorias/:id', userLogin.verifyTokenAdmin, upload.none(), t4_categoriasController.putData);
router.delete('/categorias/:id', userLogin.verifyTokenAdmin, upload.none(), t4_categoriasController.deleteData);

router.get('/carreras/paginar', userLogin.verifyToken, upload.none(), t21_carrerasController.getPaginar);
router.get('/carreras', upload.none(), t21_carrerasController.getAllData);
router.get('/carreras/:id', userLogin.verifyToken, upload.none(), t21_carrerasController.getData);
router.get('/carreras/buscar/index', userLogin.verifyToken, upload.none(), t21_carrerasController.getDataFilter);
router.post('/carreras', userLogin.verifyTokenAdmin, upload.none(), t21_carrerasController.postData);
router.put('/carreras/:id', userLogin.verifyTokenAdmin, upload.none(), t21_carrerasController.putData);
router.delete('/carreras/:id', userLogin.verifyTokenAdmin, upload.none(), t21_carrerasController.deleteData);

router.get('/cursos/paginar', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getPaginar);
router.get('/cursos', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getAllData);
router.get('/cursos/:id', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getData);
router.get('/cursos/buscar/index', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getDataFilter);
router.post('/cursos', userLogin.verifyTokenAdmin, upload_cursos_portadas.single('file_port'), t5_cursosController.postData);
router.post('/cursos/presentacion', userLogin.verifyTokenAdmin, upload_cursos_promo.single('file_port'), t5_cursosController.postDataPresentacion);
router.put('/cursos/:id', userLogin.verifyTokenAdmin, upload_cursos_portadas.single('file_port'), t5_cursosController.putData);
router.delete('/cursos/:id', userLogin.verifyTokenAdmin, upload_cursos_portadas.none(), t5_cursosController.deleteData);

router.get('/cursos/find/codes', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getDataCodes);

router.get('/cursos/matriculados/paginar', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getPaginarMatriculados);
router.get('/cursos/matriculados/all', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getAllDataMatriculados);
router.get('/cursos/matriculados/buscar/index', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getDataFilterMatriculados);

router.post('/cursos/matriculados/generar/pdf', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getReporteMatriculadosPDF);
router.post('/cursos/matriculados/generar/excel', userLogin.verifyToken, upload_cursos_portadas.none(), t5_cursosController.getReporteMatriculadosExcel);


router.get('/certificados/paginar', userLogin.verifyToken, upload_certificados_conf.none(), t10_certificadosconfController.getPaginar);
router.get('/certificados', userLogin.verifyToken, upload_certificados_conf.none(), t10_certificadosconfController.getAllData);
router.get('/certificados/:id', userLogin.verifyToken, upload_certificados_conf.none(), t10_certificadosconfController.getData);
router.get('/certificados/buscar/index', userLogin.verifyToken, upload_certificados_conf.none(), t10_certificadosconfController.getDataFilter);
router.post('/certificados', userLogin.verifyTokenAdmin, upload_certificados_conf.fields([{name:'file_port',maxCount:1},{name:'file_rev',maxCount:1}]), t10_certificadosconfController.postData);
router.put('/certificados/:id', userLogin.verifyTokenAdmin, upload_certificados_conf.fields([{name:'file_port',maxCount:1},{name:'file_rev',maxCount:1}]), t10_certificadosconfController.putData);
router.delete('/certificados/:id', userLogin.verifyTokenAdmin, upload_certificados_conf.none(), t10_certificadosconfController.deleteData);

router.post('/certificados/regenerar/certificados', userLogin.verifyTokenAdmin, upload_certificados_conf.none(), t9_certificadosController.postDataRegenerarCertificado);

router.get('/labels/paginar', userLogin.verifyToken, upload_labels.none(), t20_labelsController.getPaginar);
router.get('/labels', userLogin.verifyToken, upload_labels.none(), t20_labelsController.getAllData);
router.get('/labels/:id', userLogin.verifyToken, upload_labels.none(), t20_labelsController.getData);
router.get('/labels/buscar/index', userLogin.verifyToken, upload_labels.none(), t20_labelsController.getDataFilter);
router.post('/labels', userLogin.verifyTokenAdmin, upload_labels.single('file'), t20_labelsController.postData);
router.put('/labels/:id', userLogin.verifyTokenAdmin, upload_labels.single('file'), t20_labelsController.putData);
router.delete('/labels/:id', userLogin.verifyTokenAdmin, upload_labels.none(), t20_labelsController.deleteData);

router.get('/modulos/paginar', userLogin.verifyToken, upload.none(), t7_modulosController.getPaginar);
router.get('/modulos', userLogin.verifyToken, upload.none(), t7_modulosController.getAllData);
router.get('/modulos/:id', userLogin.verifyToken, upload.none(), t7_modulosController.getData);
router.get('/modulos/buscar/index', userLogin.verifyToken, upload.none(), t7_modulosController.getDataFilter);
router.post('/modulos', userLogin.verifyTokenAdmin, upload.none(), t7_modulosController.postData);
router.put('/modulos/:id', userLogin.verifyTokenAdmin, upload.none(), t7_modulosController.putData);
router.delete('/modulos/:id', userLogin.verifyTokenAdmin, upload.none(), t7_modulosController.deleteData);

router.get('/clases/paginar', userLogin.verifyToken, upload.none(), t8_clasesController.getPaginar);
router.get('/clases', userLogin.verifyToken, upload.none(), t8_clasesController.getAllData);
router.get('/clases/:id', userLogin.verifyToken, upload.none(), t8_clasesController.getData);
router.get('/clases/buscar/index', userLogin.verifyToken, upload.none(), t8_clasesController.getDataFilter);
router.post('/clases', userLogin.verifyTokenAdmin, upload.none(), t8_clasesController.postData);
router.put('/clases/:id', userLogin.verifyTokenAdmin, upload.none(), t8_clasesController.putData);
router.delete('/clases/:id', userLogin.verifyTokenAdmin, upload.none(), t8_clasesController.deleteData);


router.get('/examenes/paginar', userLogin.verifyToken, upload.none(), t12_examenesController.getPaginar);
router.get('/examenes', userLogin.verifyToken, upload.none(), t12_examenesController.getAllData);
router.get('/examenes/:id', userLogin.verifyToken, upload.none(), t12_examenesController.getData);
router.get('/examenes/buscar/index', userLogin.verifyToken, upload.none(), t12_examenesController.getDataFilter);
router.post('/examenes', userLogin.verifyTokenAdmin, upload.none(), t12_examenesController.postData);
router.put('/examenes/:id', userLogin.verifyTokenAdmin, upload.none(), t12_examenesController.putData);
router.delete('/examenes/:id', userLogin.verifyTokenAdmin, upload.none(), t12_examenesController.deleteData);

router.get('/preguntas/paginar', userLogin.verifyToken, upload.none(), t13_preguntasController.getPaginar);
router.get('/preguntas', userLogin.verifyToken, upload.none(), t13_preguntasController.getAllData);
router.get('/preguntas/:id', userLogin.verifyToken, upload.none(), t13_preguntasController.getData);
router.get('/preguntas/buscar/index', userLogin.verifyToken, upload.none(), t13_preguntasController.getDataFilter);
router.post('/preguntas', userLogin.verifyTokenAdmin, upload.none(), t13_preguntasController.postData);
router.put('/preguntas/:id', userLogin.verifyTokenAdmin, upload.none(), t13_preguntasController.putData);
router.delete('/preguntas/:id', userLogin.verifyTokenAdmin, upload.none(), t13_preguntasController.deleteData);

router.get('/ordenes/paginar', userLogin.verifyToken, upload.none(), t17_ordenesController.getPaginar);
router.get('/ordenes/detalles', userLogin.verifyToken, upload.none(), t17_ordenesController.getDataDetalles);
router.get('/ordenes', userLogin.verifyToken, upload.none(), t17_ordenesController.getAllData);
router.get('/ordenes/:id', userLogin.verifyToken, upload.none(), t17_ordenesController.getData);
router.get('/ordenes/buscar/index', userLogin.verifyToken, upload.none(), t17_ordenesController.getDataFilter);
router.post('/ordenes', userLogin.verifyTokenAdmin, upload.none(), t17_ordenesController.postData);
router.put('/ordenes/:id', userLogin.verifyTokenAdmin, upload.none(), t17_ordenesController.putData);
router.delete('/ordenes/:id', userLogin.verifyTokenAdmin, upload.none(), t17_ordenesController.deleteData);

router.get('/cuentas/paginar', userLogin.verifyToken, upload_cuentas.none(), t15_cuentasController.getPaginar);
router.get('/cuentas', userLogin.verifyToken, upload_cuentas.none(), t15_cuentasController.getAllData);
router.get('/cuentas/:id', userLogin.verifyToken, upload_cuentas.none(), t15_cuentasController.getData);
router.get('/cuentas/buscar/index', userLogin.verifyToken, upload_cuentas.none(), t15_cuentasController.getDataFilter);
router.post('/cuentas', userLogin.verifyTokenAdmin, upload_cuentas.single('file_port'), t15_cuentasController.postData);
router.put('/cuentas/:id', userLogin.verifyTokenAdmin, upload_cuentas.single('file_port'), t15_cuentasController.putData);
router.delete('/cuentas/:id', userLogin.verifyTokenAdmin, upload_cuentas.none(), t15_cuentasController.deleteData);

router.get('/movimientos/paginar', userLogin.verifyToken, upload.none(), t16_movimientosController.getPaginar);
router.get('/movimientos', userLogin.verifyToken, upload.none(), t16_movimientosController.getAllData);
router.get('/movimientos/:id', userLogin.verifyToken, upload.none(), t16_movimientosController.getData);
router.get('/movimientos/buscar/index', userLogin.verifyToken, upload.none(), t16_movimientosController.getDataFilter);
router.post('/movimientos', userLogin.verifyTokenAdmin, upload.none(), t16_movimientosController.postData);
router.post('/movimientos/reporte/pdf', userLogin.verifyTokenAdmin, upload.none(), t16_movimientosController.getReportePDF);
router.post('/movimientos/reporte/excel', userLogin.verifyTokenAdmin, upload.none(), t16_movimientosController.getReporteExcel);
router.put('/movimientos/:id', userLogin.verifyTokenAdmin, upload.none(), t16_movimientosController.putData);
router.delete('/movimientos/:id', userLogin.verifyTokenAdmin, upload.none(), t16_movimientosController.deleteData);

router.get('/notificaciones/paginar', userLogin.verifyToken, upload.none(), t22_notificaionesController.getPaginar);
router.get('/notificaciones', userLogin.verifyToken, upload.none(), t22_notificaionesController.getAllData);
router.get('/notificaciones/:id', userLogin.verifyToken, upload.none(), t22_notificaionesController.getData);
router.get('/notificaciones/buscar/index', userLogin.verifyToken, upload.none(), t22_notificaionesController.getDataFilter);
router.post('/notificaciones', userLogin.verifyTokenAdmin, upload.none(), t22_notificaionesController.postData);
router.put('/notificaciones/:id', userLogin.verifyTokenAdmin, upload.none(), t22_notificaionesController.putData);
router.delete('/notificaciones/:id', userLogin.verifyTokenAdmin, upload.none(), t22_notificaionesController.deleteData);

router.get('/convenios/paginar', userLogin.verifyToken, upload_convenios.none(), t23_conveniosController.getPaginar);
router.get('/convenios', userLogin.verifyToken, upload_convenios.none(), t23_conveniosController.getAllData);
router.get('/convenios/:id', userLogin.verifyToken, upload_convenios.none(), t23_conveniosController.getData);
router.get('/convenios/buscar/index', userLogin.verifyToken, upload_convenios.none(), t23_conveniosController.getDataFilter);
router.post('/convenios', userLogin.verifyTokenAdmin, upload_convenios.single('file_port'), t23_conveniosController.postData);
router.put('/convenios/:id', userLogin.verifyTokenAdmin, upload_convenios.single('file_port'), t23_conveniosController.putData);
router.delete('/convenios/:id', userLogin.verifyTokenAdmin, upload_convenios.none(), t23_conveniosController.deleteData);

router.get('/popups/paginar', userLogin.verifyToken, upload_popups.none(), t27_popupsController.getPaginar);
router.get('/popups', userLogin.verifyToken, upload_popups.none(), t27_popupsController.getAllData);
router.get('/popups/:id', userLogin.verifyToken, upload_popups.none(), t27_popupsController.getData);
router.get('/popups/buscar/index', upload_popups.none(), t27_popupsController.getActivePopups);
router.post('/popups', userLogin.verifyTokenAdmin, upload_popups.single('file'), t27_popupsController.postData);
router.put('/popups/:id', userLogin.verifyTokenAdmin, upload_popups.single('file'), t27_popupsController.putData);
router.delete('/popups/:id', userLogin.verifyTokenAdmin, upload_popups.none(), t27_popupsController.deleteData);

router.get('/certificadosolds/paginar', userLogin.verifyToken, upload.none(), t30_certificadosController.getPaginar);
router.get('/certificadosolds', userLogin.verifyToken, upload.none(), t30_certificadosController.getAllData);
router.get('/certificadosolds/:id', userLogin.verifyToken, upload.none(), t30_certificadosController.getData);
router.get('/certificadosolds/buscar/index', userLogin.verifyToken, upload.none(), t30_certificadosController.getDataFilter);
router.post('/certificadosolds', userLogin.verifyTokenAdmin, upload.none(), t30_certificadosController.postData);
router.put('/certificadosolds/:id', userLogin.verifyTokenAdmin, upload.none(), t30_certificadosController.putData);
router.delete('/certificadosolds/:id', userLogin.verifyTokenAdmin, upload.none(), t30_certificadosController.deleteData);

router.get('/participantes/paginar', userLogin.verifyToken, upload.none(), t31_participantesController.getPaginar);
router.get('/participantes', userLogin.verifyToken, upload.none(), t31_participantesController.getAllData);
router.get('/participantes/:id', userLogin.verifyToken, upload.none(), t31_participantesController.getData);
router.get('/participantes/buscar/index', userLogin.verifyToken, upload.none(), t31_participantesController.getDataFilter);
router.post('/participantes', userLogin.verifyTokenAdmin, upload.none(), t31_participantesController.postData);
router.post('/participantes/importar', userLogin.verifyTokenAdmin, upload.single('file'), t31_participantesController.postDataImport);
router.post('/participantes/exportar', userLogin.verifyTokenAdmin, upload.none(), t31_participantesController.postDataExport);
router.put('/participantes/:id', userLogin.verifyTokenAdmin, upload.none(), t31_participantesController.putData);
router.delete('/participantes/:id', userLogin.verifyTokenAdmin, upload.none(), t31_participantesController.deleteData);


// Rutas para paginación
router.post('/proyectos/pages/:pageSize', userLogin.verifyToken, t28_proyectosController.getPages);
router.post('/proyectos/data', userLogin.verifyToken, t28_proyectosController.getData);
router.post('/proyectos/filter', userLogin.verifyToken, t28_proyectosController.getDataFilter);
// Rutas estándar CRUD
router.get('/proyectos', userLogin.verifyToken, upload_proyectos.none(), t28_proyectosController.getAll);
router.get('/proyectos/:id', userLogin.verifyToken, upload_proyectos.none(), t28_proyectosController.getOne);
router.post('/proyectos', userLogin.verifyTokenAdmin, upload_proyectos.fields([{name:'imagen',maxCount:1},{name:'archivo',maxCount:1}]), t28_proyectosController.create);
router.put('/proyectos/:id', userLogin.verifyTokenAdmin, upload_proyectos.fields([{name:'imagen',maxCount:1},{name:'archivo',maxCount:1}]), t28_proyectosController.update);
router.delete('/proyectos/:id', userLogin.verifyTokenAdmin, upload_proyectos.none(), t28_proyectosController.delete);

router.get('/areas/paginar', upload.none(), t47_areasController.getPaginar);
router.get('/areas', upload.none(), t47_areasController.getAllData);
router.get('/areas/:id', upload.none(), t47_areasController.getData);
router.get('/areas/buscar/index', upload.none(), t47_areasController.getDataFilter);
router.post('/areas', userLogin.verifyTokenAdmin, upload.none(), t47_areasController.postData);
router.put('/areas/:id', userLogin.verifyTokenAdmin, upload.none(), t47_areasController.putData);
router.delete('/areas/:id', userLogin.verifyTokenAdmin, upload.none(), t47_areasController.deleteData);


router.get('/demostraciones/pages/:pageSize', userLogin.verifyToken, t48_demostracionesController.getPages);
router.get('/demostraciones/filter', userLogin.verifyToken, t48_demostracionesController.getDataFilter);
router.get('/demostraciones/:id', userLogin.verifyToken, upload_demostraciones.none(), t48_demostracionesController.getData);
router.post('/demostraciones', userLogin.verifyTokenAdmin, upload_demostraciones.fields([{name:'archivo',maxCount:1},{name:'portada',maxCount:1}]), t48_demostracionesController.create);
router.put('/demostraciones/:id', userLogin.verifyTokenAdmin, upload_demostraciones.fields([{name:'archivo',maxCount:1},{name:'portada',maxCount:1}]), t48_demostracionesController.update);
router.delete('/demostraciones/:id', userLogin.verifyTokenAdmin, upload_demostraciones.none(), t48_demostracionesController.delete);

*/

/* INTRANET */
/* INTRANET */
/* INTRANET */


/*
router.get('/intranet/convenios', upload_convenios.none(), t23_conveniosController.getAllData);

router.get('/perfiles', userLogin.verifyTokenIntranet, upload.none(), t3_perfilesController.getAllData);
router.get('/perfiles/:id', userLogin.verifyTokenIntranet, upload.none(), t3_perfilesController.getData);
router.post('/perfiles', userLogin.verifyTokenIntranet, upload.none(), t3_perfilesController.postData);
router.post('/perfiles/foto', userLogin.verifyTokenIntranet, upload.single('file_port'), t3_perfilesController.postDataFoto);
router.put('/perfiles/:id', userLogin.verifyTokenIntranet, upload.none(), t3_perfilesController.putData);

router.get('/intranet/cursos/paginar', upload.none(), t5_cursosController.getPaginarIntranet);
router.get('/intranet/cursos', upload.none(), t5_cursosController.getAllDataIntranet);
router.get('/intranet/cursos/buscar/index', upload.none(), t5_cursosController.getDataFilterIntranet);
router.get('/intranet/cursos/favoritos/paginar', userLogin.verifyTokenIntranet, upload.none(), t5_cursosController.getPaginarFavoritos);
router.get('/intranet/cursos/favoritos/', userLogin.verifyTokenIntranet, upload.none(), t5_cursosController.getAllDataFavoritos);
router.get('/intranet/cursos/:id', upload.none(), t5_cursosController.getDataIntranet);

router.get('/intranet/proyectos/paginar', upload.none(), t28_proyectosController.getPaginarIntranet);
router.get('/intranet/proyectos/:id', upload.none(), t28_proyectosController.getDataIntranet);
router.get('/intranet/proyectos/buscar/index', upload.none(), t28_proyectosController.getDataFilterIntranet);

router.get('/intranet/demostraciones/paginar', upload.none(), t48_demostracionesController.getPaginarIntranet);
router.get('/intranet/demostraciones/:id', upload.none(), t48_demostracionesController.getDataIntranet);
router.get('/intranet/demostraciones/buscar/index', upload.none(), t48_demostracionesController.getDataFilterIntranet);

router.get('/intranet/miscursos/paginar', userLogin.verifyTokenIntranet, upload.none(), t11_miscursosController.getPaginar);
router.get('/intranet/miscursos', userLogin.verifyTokenIntranet, upload.none(), t11_miscursosController.getAllData);
router.get('/intranet/miscursos/:id', userLogin.verifyTokenIntranet, upload.none(), t11_miscursosController.getData);
router.get('/intranet/miscursos/buscar/index', userLogin.verifyTokenIntranet, upload.none(), t11_miscursosController.getDataFilter);

router.get('/intranet/misproyectos/paginar', userLogin.verifyTokenIntranet, upload.none(), t29_misproyectosController.getPaginar);
router.get('/intranet/misproyectos', userLogin.verifyTokenIntranet, upload.none(), t29_misproyectosController.getAllData);
router.get('/intranet/misproyectos/:id', userLogin.verifyTokenIntranet, upload.none(), t29_misproyectosController.getData);
router.get('/intranet/misproyectos/buscar/index', userLogin.verifyTokenIntranet, upload.none(), t29_misproyectosController.getDataFilter);

router.get('/intranet/certificados/web', upload.none(), t9_certificadosController.getWeb);
router.get('/intranet/certificados/paginar', userLogin.verifyTokenIntranet, upload.none(), t9_certificadosController.getPaginar);
router.get('/intranet/certificados', userLogin.verifyTokenIntranet, upload.none(), t9_certificadosController.getAllData);
router.get('/intranet/certificados/:id', userLogin.verifyTokenIntranet, upload.none(), t9_certificadosController.getData);
router.get('/intranet/certificados/buscar/index', userLogin.verifyTokenIntranet, upload.none(), t9_certificadosController.getDataFilter);
router.post('/intranet/certificados', userLogin.verifyTokenIntranet, upload.none(), t9_certificadosController.postIntranetData);

router.get('/intranet/modulos/all', upload.none(), t7_modulosController.getAllDataIntranetFree);
router.get('/intranet/modulos', userLogin.verifyTokenIntranet, upload.none(), t7_modulosController.getAllDataIntranet);
router.get('/intranet/modulos/:id', userLogin.verifyTokenIntranet, upload.none(), t7_modulosController.getData);

router.get('/intranet/clases', upload.none(), t8_clasesController.getAllData);
router.get('/intranet/clases/:id', userLogin.verifyTokenIntranet, upload.none(), t8_clasesController.getData);

router.get('/intranet/favoritos/paginar', userLogin.verifyTokenIntranet, upload.none(), t24_favoritosController.getPages);
router.get('/intranet/favoritos', userLogin.verifyTokenIntranet, upload.none(), t24_favoritosController.getAllData);
router.get('/intranet/favoritos/:id', userLogin.verifyTokenIntranet, upload.none(), t24_favoritosController.getData);
router.post('/intranet/favoritos', userLogin.verifyTokenIntranet, upload.none(), t24_favoritosController.postData);

router.get('/intranet/carritos/buscar/index', userLogin.verifyTokenIntranet, upload.none(), t25_carritosController.getDataFilter);
router.get('/intranet/carritos/:id', userLogin.verifyTokenIntranet, upload.none(), t25_carritosController.getData);
router.get('/intranet/carritos', userLogin.verifyTokenIntranet, upload.none(), t25_carritosController.getAllData);
router.post('/intranet/carritos', userLogin.verifyTokenIntranet, upload.none(), t25_carritosController.postData);
router.delete('/intranet/carritos/:id', userLogin.verifyTokenIntranet, upload.none(), t25_carritosController.deleteData);

router.get('/intranet/ordenes/:id', userLogin.verifyTokenIntranet, upload.none(), t17_ordenesController.getData);
router.get('/intranet/ordenes', userLogin.verifyTokenIntranet, upload.none(), t17_ordenesController.getAllData);
router.post('/intranet/ordenes', userLogin.verifyTokenIntranet, upload2.single('file'), t17_ordenesController.postDataIntranet);

router.get('/intranet/ordenesdetalle/:id', userLogin.verifyTokenIntranet, upload.none(), t18_ordenesdetalleController.getDataIntranet);

router.get('/intranet/examenes', userLogin.verifyTokenIntranet, upload.none(), t12_examenesController.getDataIntranet);
router.get('/intranet/preguntas', userLogin.verifyTokenIntranet, upload.none(), t13_preguntasController.getDataIntranet);
router.get('/intranet/calificacion', userLogin.verifyTokenIntranet, upload.none(), t14_calificacionController.getDataIntranet);
router.post('/intranet/calificacion', userLogin.verifyTokenIntranet, upload.none(), t14_calificacionController.postDataIntranet);
router.post('/intranet/examenes', userLogin.verifyTokenIntranet, upload.none(), t12_examenesController.postDataIntranet);


router.get('/intranet/cuentas', upload.none(), t15_cuentasController.getAllData);

*/



/* INTRANET DOCENTE */
/* INTRANET DOCENTE */
/* INTRANET DOCENTE */

/*
router.get('/intranet-docente/miscursos/paginar', userLogin.verifyTokenIntranetDocente, upload.none(), t11_miscursosController.getPaginarIntranetDocente);
router.get('/intranet-docente/miscursos', userLogin.verifyTokenIntranetDocente, upload.none(), t11_miscursosController.getAllDataIntranetDocente);
router.get('/intranet-docente/miscursos/:id', userLogin.verifyTokenIntranetDocente, upload.none(), t11_miscursosController.getDataIntranetDocente);
router.get('/intranet-docente/miscursos/buscar/index', userLogin.verifyTokenIntranetDocente, upload.none(), t11_miscursosController.getDataFilterIntranetDocente);

router.get('/intranet-docente/mentor', userLogin.verifyTokenIntranetDocente, upload.none(), t6_mentoresController.getDataIntranetDocente);
router.put('/intranet-docente/mentor', userLogin.verifyTokenIntranetDocente, upload_mentores.single('file'), t6_mentoresController.putDataIntranetDocente);
router.put('/intranet-docente/mentor/pass', userLogin.verifyTokenIntranetDocente, upload.none(), t6_mentoresController.putDataPassIntranetDocente);

*/



/* AULA VIRTUAL */
/* AULA VIRTUAL */
/* AULA VIRTUAL */

/*
router.get('/aula-virtual/calendario', userLogin.verifyTokenAulaVirtual, upload.none(), t8_clasesController.getCalendarioAulaVirtual);
router.get('/aula-virtual/calendario/clases', userLogin.verifyTokenAulaVirtual, upload.none(), t8_clasesController.getClasesCalendarioAulaVirtual);

router.get('/aula-virtual/cursos/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t5_cursosController.getDataAulaVirtual);
router.get('/aula-virtual/matriculados', userLogin.verifyTokenAulaVirtual, upload.none(), t5_cursosController.getAllDataMatriculadosAulaVirtual);
router.put('/aula-virtual/cursos/asistencia/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t5_cursosController.putDataMinAsistenciaAulaVirtual);



router.get('/aula-virtual/modulos', userLogin.verifyTokenAulaVirtual, upload.none(), t7_modulosController.getAllDataAulaVirtual);
router.post('/aula-virtual/modulos', userLogin.verifyTokenAulaVirtual, upload.none(), t7_modulosController.postDataAulaVirtual);
router.put('/aula-virtual/modulos/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t7_modulosController.putDataAulaVirtual);
router.delete('/aula-virtual/modulos/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t7_modulosController.deleteDataAulaVirtual);

router.get('/aula-virtual/clases', userLogin.verifyTokenAulaVirtual, upload.none(), t8_clasesController.getAllDataAulaVirtual);
router.post('/aula-virtual/clases', userLogin.verifyTokenAulaVirtual, upload.none(), t8_clasesController.postDataAulaVirtual);
router.put('/aula-virtual/clases/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t8_clasesController.putDataAulaVirtual);
router.delete('/aula-virtual/clases/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t8_clasesController.deleteDataAulaVirtual);

router.get('/aula-virtual/recursos', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.getAllDataAulaVirtual);
router.post('/aula-virtual/recursos', userLogin.verifyTokenAulaVirtual, upload_recursos.single('file'), t19_recursosController.postDataAulaVirtual);
router.put('/aula-virtual/recursos/:id', userLogin.verifyTokenAulaVirtual, upload_recursos.single('file'), t19_recursosController.putDataAulaVirtual);
router.put('/aula-virtual/recursos/config/:id', userLogin.verifyTokenAulaVirtual, upload_recursos.none(), t19_recursosController.putDataConfAulaVirtual);
router.delete('/aula-virtual/recursos/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.deleteDataAulaVirtual);

router.get('/aula-virtual/recursos/foros', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.getForosAulaVirtual);
router.post('/aula-virtual/recursos/foros', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.postForosAulaVirtual);
router.delete('/aula-virtual/recursos/foros/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.deleteForosAulaVirtual);

router.get('/aula-virtual/recursos/notasdetalle', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.getNotasDetalleAulaVirtual);
router.put('/aula-virtual/recursos/notasdetalle/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t19_recursosController.putNotasDetalleAulaVirtual);
router.put('/aula-virtual/recursos/entregas/:id', userLogin.verifyTokenAulaVirtual, upload_entregas.single('file'), t19_recursosController.putEntregasAulaVirtual);

router.get('/aula-virtual/asistencias-detalles', userLogin.verifyTokenAulaVirtual, upload.none(), t37_asistenciasDetallesController.getDataAulaVirtual);
router.get('/aula-virtual/asistencias-detalles/all', userLogin.verifyTokenAulaVirtual, upload.none(), t37_asistenciasDetallesController.getAllDataAulaVirtual);
router.put('/aula-virtual/asistencias-detalles/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t37_asistenciasDetallesController.putDataAulaVirtual);


router.get('/aula-virtual/notas-detalles/all', userLogin.verifyTokenAulaVirtual, upload.none(), t39_notasDetallesController.getAllDataAulaVirtual);


router.get('/aula-virtual/posts/paginar', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.getPaginar);
router.get('/aula-virtual/posts', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.getAllData);
router.get('/aula-virtual/posts/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.getData);
router.get('/aula-virtual/posts/buscar/index', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.getDataFilter);
router.post('/aula-virtual/posts', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.postData);
router.put('/aula-virtual/posts/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.putData);
router.delete('/aula-virtual/posts/:id', userLogin.verifyTokenAulaVirtual, upload.none(), t35_postsController.deleteData);

*/



module.exports = router;
