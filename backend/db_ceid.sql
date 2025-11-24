CREATE DATABASE  IF NOT EXISTS `db_ceid` /*!40100 DEFAULT CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_ceid`;
-- MySQL dump 10.13  Distrib 8.0.11, for Win64 (x86_64)
--
-- Host: localhost    Database: db_ceid
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t0_general`
--

DROP TABLE IF EXISTS `t0_general`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t0_general` (
  `t0_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`t0_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t0_general`
--

LOCK TABLES `t0_general` WRITE;
/*!40000 ALTER TABLE `t0_general` DISABLE KEYS */;
/*!40000 ALTER TABLE `t0_general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t10_preguntas`
--

DROP TABLE IF EXISTS `t10_preguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t10_preguntas` (
  `t10_id` int NOT NULL AUTO_INCREMENT,
  `t10_pregunta` varchar(175) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t10_estado` tinyint NOT NULL,
  `t10_creacion` datetime NOT NULL,
  `t10_aprobacion` datetime DEFAULT NULL,
  `t9_contenidos_t9_id` int NOT NULL,
  `t1_personas_t1_id` int NOT NULL,
  `t1_personas_t1_id1` int NOT NULL,
  PRIMARY KEY (`t10_id`),
  KEY `fk_t10_preguntas_t9_contenidos1_idx` (`t9_contenidos_t9_id`),
  KEY `fk_t10_preguntas_t1_personas1_idx` (`t1_personas_t1_id`),
  KEY `fk_t10_preguntas_t1_personas2_idx` (`t1_personas_t1_id1`),
  CONSTRAINT `fk_t10_preguntas_t1_personas1` FOREIGN KEY (`t1_personas_t1_id`) REFERENCES `t1_personas` (`t1_id`),
  CONSTRAINT `fk_t10_preguntas_t1_personas2` FOREIGN KEY (`t1_personas_t1_id1`) REFERENCES `t1_personas` (`t1_id`),
  CONSTRAINT `fk_t10_preguntas_t9_contenidos1` FOREIGN KEY (`t9_contenidos_t9_id`) REFERENCES `t9_contenidos` (`t9_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t10_preguntas`
--

LOCK TABLES `t10_preguntas` WRITE;
/*!40000 ALTER TABLE `t10_preguntas` DISABLE KEYS */;
/*!40000 ALTER TABLE `t10_preguntas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t11_respuestas`
--

DROP TABLE IF EXISTS `t11_respuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t11_respuestas` (
  `t11_id` int NOT NULL AUTO_INCREMENT,
  `t11_respuesta` varchar(45) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t11_estado` tinyint NOT NULL,
  `t10_preguntas_t10_id` int NOT NULL,
  PRIMARY KEY (`t11_id`),
  KEY `fk_t11_respuestas_t10_preguntas1_idx` (`t10_preguntas_t10_id`),
  CONSTRAINT `fk_t11_respuestas_t10_preguntas1` FOREIGN KEY (`t10_preguntas_t10_id`) REFERENCES `t10_preguntas` (`t10_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t11_respuestas`
--

LOCK TABLES `t11_respuestas` WRITE;
/*!40000 ALTER TABLE `t11_respuestas` DISABLE KEYS */;
/*!40000 ALTER TABLE `t11_respuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t12_balotarios`
--

DROP TABLE IF EXISTS `t12_balotarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t12_balotarios` (
  `t12_id` int NOT NULL AUTO_INCREMENT,
  `t12_balotario` varchar(245) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t12_fecha` datetime NOT NULL,
  `t12_horas` int NOT NULL,
  PRIMARY KEY (`t12_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t12_balotarios`
--

LOCK TABLES `t12_balotarios` WRITE;
/*!40000 ALTER TABLE `t12_balotarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `t12_balotarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t13_balotarios_detalles`
--

DROP TABLE IF EXISTS `t13_balotarios_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t13_balotarios_detalles` (
  `t13_id` int NOT NULL AUTO_INCREMENT,
  `t13_pregunta` varchar(175) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t13_alternativas` json NOT NULL,
  `t13_respuesta` varchar(175) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t12_balotarios_t12_id` int NOT NULL,
  PRIMARY KEY (`t13_id`),
  KEY `fk_t13_balotarios_detalles_t12_balotarios1_idx` (`t12_balotarios_t12_id`),
  CONSTRAINT `fk_t13_balotarios_detalles_t12_balotarios1` FOREIGN KEY (`t12_balotarios_t12_id`) REFERENCES `t12_balotarios` (`t12_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t13_balotarios_detalles`
--

LOCK TABLES `t13_balotarios_detalles` WRITE;
/*!40000 ALTER TABLE `t13_balotarios_detalles` DISABLE KEYS */;
/*!40000 ALTER TABLE `t13_balotarios_detalles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t14_tokens`
--

DROP TABLE IF EXISTS `t14_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t14_tokens` (
  `t14_id` int NOT NULL AUTO_INCREMENT,
  `t14_plataforma` varchar(145) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t14_token` varchar(275) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t14_estado` tinyint NOT NULL,
  PRIMARY KEY (`t14_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t14_tokens`
--

LOCK TABLES `t14_tokens` WRITE;
/*!40000 ALTER TABLE `t14_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `t14_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t1_personas`
--

DROP TABLE IF EXISTS `t1_personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t1_personas` (
  `t1_id` int NOT NULL AUTO_INCREMENT,
  `t1_documento` varchar(15) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t1_email` varchar(175) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t1_celular` varchar(15) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `t1_nombres` varchar(175) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t1_apellidos` varchar(175) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t1_estado` tinyint NOT NULL,
  `t1_password` varchar(145) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`t1_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t1_personas`
--

LOCK TABLES `t1_personas` WRITE;
/*!40000 ALTER TABLE `t1_personas` DISABLE KEYS */;
INSERT INTO `t1_personas` VALUES (1,'xxxxx','xxxx@hotmail.com','xxxxxx','xxxxx','xxxxxx',1,'xxxxx');
/*!40000 ALTER TABLE `t1_personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t2_roles`
--

DROP TABLE IF EXISTS `t2_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t2_roles` (
  `t2_id` int NOT NULL AUTO_INCREMENT,
  `t2_rol` varchar(145) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t2_panel` tinyint NOT NULL,
  PRIMARY KEY (`t2_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t2_roles`
--

LOCK TABLES `t2_roles` WRITE;
/*!40000 ALTER TABLE `t2_roles` DISABLE KEYS */;
INSERT INTO `t2_roles` VALUES (1,'ADMINISTRATIVO',3);
/*!40000 ALTER TABLE `t2_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t3_accesos`
--

DROP TABLE IF EXISTS `t3_accesos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t3_accesos` (
  `t3_id` int NOT NULL AUTO_INCREMENT,
  `t3_estado` tinyint NOT NULL,
  `t2_roles_t2_id` int NOT NULL,
  `t1_personas_t1_id` int NOT NULL,
  PRIMARY KEY (`t3_id`),
  KEY `fk_t3_accesos_t2_roles_idx` (`t2_roles_t2_id`),
  KEY `fk_t3_accesos_t1_personas1_idx` (`t1_personas_t1_id`),
  CONSTRAINT `fk_t3_accesos_t1_personas1` FOREIGN KEY (`t1_personas_t1_id`) REFERENCES `t1_personas` (`t1_id`),
  CONSTRAINT `fk_t3_accesos_t2_roles` FOREIGN KEY (`t2_roles_t2_id`) REFERENCES `t2_roles` (`t2_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t3_accesos`
--

LOCK TABLES `t3_accesos` WRITE;
/*!40000 ALTER TABLE `t3_accesos` DISABLE KEYS */;
INSERT INTO `t3_accesos` VALUES (1,1,1,1);
/*!40000 ALTER TABLE `t3_accesos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t4_modulos`
--

DROP TABLE IF EXISTS `t4_modulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t4_modulos` (
  `t4_id` int NOT NULL AUTO_INCREMENT,
  `t4_modulo` varchar(75) COLLATE utf8mb3_spanish_ci NOT NULL,
  PRIMARY KEY (`t4_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t4_modulos`
--

LOCK TABLES `t4_modulos` WRITE;
/*!40000 ALTER TABLE `t4_modulos` DISABLE KEYS */;
/*!40000 ALTER TABLE `t4_modulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t5_idiomas`
--

DROP TABLE IF EXISTS `t5_idiomas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t5_idiomas` (
  `t5_id` int NOT NULL AUTO_INCREMENT,
  `t5_idioma` varchar(75) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t5_estado` tinyint NOT NULL,
  PRIMARY KEY (`t5_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t5_idiomas`
--

LOCK TABLES `t5_idiomas` WRITE;
/*!40000 ALTER TABLE `t5_idiomas` DISABLE KEYS */;
INSERT INTO `t5_idiomas` VALUES (1,'INGLES',1),(3,'ITALIANO',1);
/*!40000 ALTER TABLE `t5_idiomas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t6_niveles`
--

DROP TABLE IF EXISTS `t6_niveles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t6_niveles` (
  `t6_id` int NOT NULL AUTO_INCREMENT,
  `t6_nivel` varchar(45) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t5_idiomas_t5_id` int NOT NULL,
  PRIMARY KEY (`t6_id`),
  KEY `fk_t6_niveles_t5_idiomas1_idx` (`t5_idiomas_t5_id`),
  CONSTRAINT `fk_t6_niveles_t5_idiomas1` FOREIGN KEY (`t5_idiomas_t5_id`) REFERENCES `t5_idiomas` (`t5_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t6_niveles`
--

LOCK TABLES `t6_niveles` WRITE;
/*!40000 ALTER TABLE `t6_niveles` DISABLE KEYS */;
INSERT INTO `t6_niveles` VALUES (1,'BASICO',1),(2,'INTERMEDIO',1),(3,'AVANZADO',1),(4,'BASICO',3),(5,'INTERMEDIO',3),(6,'AVANZADO',3);
/*!40000 ALTER TABLE `t6_niveles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t7_ciclos`
--

DROP TABLE IF EXISTS `t7_ciclos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t7_ciclos` (
  `t7_id` int NOT NULL AUTO_INCREMENT,
  `t7_ciclo` varchar(45) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t6_niveles_t6_id` int NOT NULL,
  PRIMARY KEY (`t7_id`),
  KEY `fk_t7_ciclos_t6_niveles1_idx` (`t6_niveles_t6_id`),
  CONSTRAINT `fk_t7_ciclos_t6_niveles1` FOREIGN KEY (`t6_niveles_t6_id`) REFERENCES `t6_niveles` (`t6_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t7_ciclos`
--

LOCK TABLES `t7_ciclos` WRITE;
/*!40000 ALTER TABLE `t7_ciclos` DISABLE KEYS */;
INSERT INTO `t7_ciclos` VALUES (1,'1',3),(3,'2',3),(4,'3',3),(5,'4',3),(6,'1',4),(7,'2',4),(8,'3',4),(9,'4',4),(10,'5',4);
/*!40000 ALTER TABLE `t7_ciclos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t8_unidades`
--

DROP TABLE IF EXISTS `t8_unidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t8_unidades` (
  `t8_id` int NOT NULL AUTO_INCREMENT,
  `t8_unidad` varchar(45) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t7_ciclos_t7_id` int NOT NULL,
  PRIMARY KEY (`t8_id`),
  KEY `fk_t8_unidades_t7_ciclos1_idx` (`t7_ciclos_t7_id`),
  CONSTRAINT `fk_t8_unidades_t7_ciclos1` FOREIGN KEY (`t7_ciclos_t7_id`) REFERENCES `t7_ciclos` (`t7_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t8_unidades`
--

LOCK TABLES `t8_unidades` WRITE;
/*!40000 ALTER TABLE `t8_unidades` DISABLE KEYS */;
INSERT INTO `t8_unidades` VALUES (2,'asdsadd',1),(3,'asdsad',1),(4,'asdsad',1),(5,'32432sfdf',1),(6,'UNIDAD 1',6),(7,'UNIDAD 2',6);
/*!40000 ALTER TABLE `t8_unidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t9_contenidos`
--

DROP TABLE IF EXISTS `t9_contenidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t9_contenidos` (
  `t9_id` int NOT NULL AUTO_INCREMENT,
  `t9_contenido` varchar(1445) COLLATE utf8mb3_spanish_ci NOT NULL,
  `t8_unidades_t8_id` int NOT NULL,
  PRIMARY KEY (`t9_id`),
  KEY `fk_t9_contenidos_t8_unidades1_idx` (`t8_unidades_t8_id`),
  CONSTRAINT `fk_t9_contenidos_t8_unidades1` FOREIGN KEY (`t8_unidades_t8_id`) REFERENCES `t8_unidades` (`t8_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t9_contenidos`
--

LOCK TABLES `t9_contenidos` WRITE;
/*!40000 ALTER TABLE `t9_contenidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `t9_contenidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ta4_modulos`
--

DROP TABLE IF EXISTS `ta4_modulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `ta4_modulos` (
  `ta4_id` int NOT NULL AUTO_INCREMENT,
  `ta4_lectura` tinyint NOT NULL,
  `t4a_crear` tinyint NOT NULL,
  `t4a_modificar` tinyint NOT NULL,
  `t4a_eliminar` tinyint NOT NULL,
  `t4_modulos_t4_id` int NOT NULL,
  `t2_roles_t2_id` int NOT NULL,
  PRIMARY KEY (`ta4_id`),
  KEY `fk_ta4_modulos_t4_modulos1_idx` (`t4_modulos_t4_id`),
  KEY `fk_ta4_modulos_t2_roles1_idx` (`t2_roles_t2_id`),
  CONSTRAINT `fk_ta4_modulos_t2_roles1` FOREIGN KEY (`t2_roles_t2_id`) REFERENCES `t2_roles` (`t2_id`),
  CONSTRAINT `fk_ta4_modulos_t4_modulos1` FOREIGN KEY (`t4_modulos_t4_id`) REFERENCES `t4_modulos` (`t4_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ta4_modulos`
--

LOCK TABLES `ta4_modulos` WRITE;
/*!40000 ALTER TABLE `ta4_modulos` DISABLE KEYS */;
/*!40000 ALTER TABLE `ta4_modulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ta5_idiomas`
--

DROP TABLE IF EXISTS `ta5_idiomas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `ta5_idiomas` (
  `ta5_id` int NOT NULL AUTO_INCREMENT,
  `t1_personas_t1_id` int NOT NULL,
  `t5_idiomas_t5_id` int NOT NULL,
  PRIMARY KEY (`ta5_id`),
  KEY `fk_ta5_idiomas_t1_personas1_idx` (`t1_personas_t1_id`),
  KEY `fk_ta5_idiomas_t5_idiomas1_idx` (`t5_idiomas_t5_id`),
  CONSTRAINT `fk_ta5_idiomas_t1_personas1` FOREIGN KEY (`t1_personas_t1_id`) REFERENCES `t1_personas` (`t1_id`),
  CONSTRAINT `fk_ta5_idiomas_t5_idiomas1` FOREIGN KEY (`t5_idiomas_t5_id`) REFERENCES `t5_idiomas` (`t5_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ta5_idiomas`
--

LOCK TABLES `ta5_idiomas` WRITE;
/*!40000 ALTER TABLE `ta5_idiomas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ta5_idiomas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ta6_niveles`
--

DROP TABLE IF EXISTS `ta6_niveles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `ta6_niveles` (
  `ta6_id` int NOT NULL AUTO_INCREMENT,
  `t1_personas_t1_id` int NOT NULL,
  `t6_niveles_t6_id` int NOT NULL,
  PRIMARY KEY (`ta6_id`),
  KEY `fk_ta6_niveles_t1_personas1_idx` (`t1_personas_t1_id`),
  KEY `fk_ta6_niveles_t6_niveles1_idx` (`t6_niveles_t6_id`),
  CONSTRAINT `fk_ta6_niveles_t1_personas1` FOREIGN KEY (`t1_personas_t1_id`) REFERENCES `t1_personas` (`t1_id`),
  CONSTRAINT `fk_ta6_niveles_t6_niveles1` FOREIGN KEY (`t6_niveles_t6_id`) REFERENCES `t6_niveles` (`t6_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ta6_niveles`
--

LOCK TABLES `ta6_niveles` WRITE;
/*!40000 ALTER TABLE `ta6_niveles` DISABLE KEYS */;
/*!40000 ALTER TABLE `ta6_niveles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ta7_ciclos`
--

DROP TABLE IF EXISTS `ta7_ciclos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `ta7_ciclos` (
  `ta7_id` int NOT NULL AUTO_INCREMENT,
  `t1_personas_t1_id` int NOT NULL,
  `t7_ciclos_t7_id` int NOT NULL,
  PRIMARY KEY (`ta7_id`),
  KEY `fk_ta7_ciclos_t1_personas1_idx` (`t1_personas_t1_id`),
  KEY `fk_ta7_ciclos_t7_ciclos1_idx` (`t7_ciclos_t7_id`),
  CONSTRAINT `fk_ta7_ciclos_t1_personas1` FOREIGN KEY (`t1_personas_t1_id`) REFERENCES `t1_personas` (`t1_id`),
  CONSTRAINT `fk_ta7_ciclos_t7_ciclos1` FOREIGN KEY (`t7_ciclos_t7_id`) REFERENCES `t7_ciclos` (`t7_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ta7_ciclos`
--

LOCK TABLES `ta7_ciclos` WRITE;
/*!40000 ALTER TABLE `ta7_ciclos` DISABLE KEYS */;
/*!40000 ALTER TABLE `ta7_ciclos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'db_ceid'
--

--
-- Dumping routines for database 'db_ceid'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-23 22:10:35
