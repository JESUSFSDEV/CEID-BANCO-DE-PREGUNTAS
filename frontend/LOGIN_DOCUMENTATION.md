# Interfaz de Login - CEID UNCP

## Descripción
Interfaz de inicio de sesión responsiva para el Sistema Integral de Información del Centro de Idiomas de la Universidad Nacional del Centro del Perú.

## Características Implementadas

### ✅ Diseño Visual
- **Colores institucionales**: Basado en el azul institucional (#3b5998)
- **Logo**: Placeholder SVG (reemplazar con logo oficial)
- **Tipografía**: Segoe UI para mejor legibilidad
- **Efectos**: Animaciones suaves y sombras profesionales

### ✅ Tipos de Usuario
- **Administrativo**: Acceso al panel administrativo
- **Docente**: Acceso al panel docente  
- **Alumno**: Acceso al campus virtual

### ✅ Formulario de Login
- **Validación en tiempo real**: Email y contraseña
- **Mostrar/ocultar contraseña**: Toggle visual
- **Recordar sesión**: Checkbox funcional
- **Mensajes de error**: Feedback inmediato

### ✅ Responsividad
- **Mobile first**: Diseño adaptativo desde 320px
- **Tablets**: Optimizado para pantallas medianas
- **Desktop**: Experiencia completa en pantallas grandes

### ✅ Tecnologías
- **Angular 19**: Framework principal
- **Bootstrap 5**: Sistema de grids y componentes
- **FontAwesome 7**: Iconografía
- **ngx-toastr**: Notificaciones
- **Reactive Forms**: Manejo de formularios

## Archivos Modificados

### 1. `login.component.html`
- Estructura completa del formulario
- Selector de tipo de usuario con iconos
- Campos de email y contraseña con validación
- Footer informativo

### 2. `login.component.css`
- Variables CSS para colores institucionales
- Estilos responsivos con media queries
- Animaciones y efectos hover
- Soporte para modo oscuro (opcional)

### 3. `login.component.ts`
- Lógica del formulario con validaciones
- Manejo de estados (loading, show password)
- Navegación condicional por tipo de usuario
- Integración con toastr para mensajes

### 4. `styles.css`
- Importaciones de librerías
- Variables globales de colores
- Personalización de Bootstrap
- Utilidades adicionales

## Configuración de Assets

### Logo Institucional
Reemplazar el archivo placeholder con el logo oficial:
- **Ubicación**: `src/assets/images/logo-ceid.png`
- **Formato**: PNG con transparencia
- **Tamaño**: 200x200px mínimo
- **Calidad**: Alta resolución

## Funcionalidades Implementadas

### Validaciones
- Email formato válido y requerido
- Contraseña mínimo 6 caracteres
- Selección obligatoria de tipo de usuario

### UX/UI
- Feedback visual en tiempo real
- Estados de carga con spinner
- Animaciones de entrada suaves
- Hover effects en elementos interactivos

### Navegación
- Redireccionamiento automático por tipo de usuario:
  - Administrativo → `/admin`
  - Docente → `/docente`  
  - Alumno → `/alumno`

### Persistencia
- Recordar sesión con localStorage
- Guardar tipo de usuario y email

## Próximos Pasos

### 1. Integración Backend
- Conectar con API de autenticación
- Implementar JWT tokens
- Manejo de errores del servidor

### 2. Rutas y Guards
- Crear componentes para cada tipo de usuario
- Implementar guards de autenticación
- Configurar lazy loading

### 3. Mejoras Adicionales
- Recuperación de contraseña
- Registro de nuevos usuarios
- Cambio de idioma
- Tema oscuro/claro

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
ng serve

# Compilar para producción
ng build --prod

# Ejecutar tests
ng test
```

## Estructura de Componentes Sugerida

```
src/app/
├── auth/
│   ├── login/
│   ├── forgot-password/
│   └── register/
├── admin/
│   └── dashboard/
├── docente/
│   └── dashboard/
├── alumno/
│   └── dashboard/
├── shared/
│   ├── components/
│   ├── services/
│   └── guards/
└── core/
    ├── interceptors/
    └── services/
```

## Notas de Desarrollo

- El componente es standalone (Angular 17+)
- Usa Reactive Forms para mejor control
- Implementa accessibility features
- Optimizado para SEO básico
- Compatible con PWA future

---
**Desarrollado para**: CEID - Universidad Nacional del Centro del Perú
**Versión**: 1.0.0
**Última actualización**: Noviembre 2024