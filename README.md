# 📘 Banco de Preguntas – CEID (Centro de Idiomas UNCP)

Sistema web para la **gestión, administración y aplicación de un banco de preguntas** desarrollado para el **Centro de Idiomas de la Universidad Nacional del Centro del Perú (CEID – UNCP)**.  
Permite organizar preguntas por niveles, cursos, unidades, competencias y tipos, facilitando la creación de exámenes y evaluaciones automatizadas.

---

## 🚀 Tecnologías Utilizadas

### **Frontend**
- Angular 19
- TypeScript
- Bootstrap
- JWT para autenticación
- Servicios REST

### **Backend**
- Node.js + Express
- JSON Web Token (JWT)
- Bcrypt
- Express Validator
- Middleware de seguridad

### **Base de Datos**
- MySQL 8
- mysql2 / sequelize (según implementación)
- Procedimientos almacenados (opcional)

---

## 📂 Arquitectura del Proyecto
/frontend
├── src
│ ├── app
│ ├── assets
│ └── environments
└── angular.json

/backend
├── src
│ ├── controllers
│ ├── routes
│ └── config
└── index.js

## 🛠️ Requerimientos

### Backend
- Node.js 20+
- MySQL 8+
- npm 10+

### Frontend
- Angular CLI 19+
- Node.js 20+

---

## ⚙️ Instalación

### 📌 1. Clonar el repositorio

```bash
git clone https://github.com/tu_usuario/CEID-BANCO-DE-PREGUNTAS.git
cd CEID-BANCO-DE-PREGUNTAS

## 📦 Instalación del Backend

```bash
cd backend
npm install

⚙️ Archivo .env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ceid_banco
JWT_SECRET=clave_secreta

▶️ Ejecutar backend
npm start


🌐 Instalación del Frontend
cd frontend
npm install

Configurar backend en:
src/environments/environment.ts

▶️ Ejecutar frontend
ng serve -o



