# Guía de Instalación y Setup - Control de Gastos

## 1. REQUISITOS PREVIOS

### Software Requerido
- **Node.js**: v18.x o v20.x (LTS) [Descargar](https://nodejs.org/)
- **npm**: v9+ (incluido con Node.js)
- **MySQL**: v8.0+ [Descargar](https://dev.mysql.com/downloads/mysql/)
- **Git**: [Descargar](https://git-scm.com/)
- **VS Code** (recomendado) o tu editor favorito

### Verificar Instalaciones
```bash
node --version      # v20.x.x
npm --version       # 9.x.x
mysql --version     # 8.0.x
git --version       # 2.x.x
```

---

## 2. ESTRUCTURA INICIAL DEL PROYECTO

```bash
# Navegar al directorio del proyecto
cd "Documents/proyectos/APP web para control de socios"

# Crear estructura de carpetas
mkdir -p backend frontend docs

# Crear archivos de configuración base
touch .gitignore
touch README.md
```

### Contenido de .gitignore
```
# Node modules
node_modules/
npm-debug.log
yarn-error.log

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
.cache/

# Logs
logs/
*.log
```

---

## 3. SETUP DE BASE DE DATOS MySQL

### 3.1 Conectarse a MySQL
```bash
# En Windows (si está en PATH)
mysql -u root -p

# O usando MySQL Workbench (interfaz gráfica)
```

### 3.2 Crear Base de Datos
```sql
-- Crear base de datos
CREATE DATABASE gastos_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico
CREATE USER 'gastos_app'@'localhost' IDENTIFIED BY 'tu_contraseña_segura_123';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON gastos_app.* TO 'gastos_app'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SHOW GRANTS FOR 'gastos_app'@'localhost';
```

### 3.3 Ejecutar Script de Esquema
```bash
# Importar el esquema (desde línea de comandos)
mysql -u gastos_app -p gastos_app < ESQUEMA_DB.sql
```

### 3.4 Verificar Tablas Creadas
```sql
USE gastos_app;
SHOW TABLES;
DESCRIBE users;
DESCRIBE expenses;
DESCRIBE categories;
DESCRIBE installments;
```

---

## 4. SETUP BACKEND (Node.js + Express)

### 4.1 Inicializar Proyecto
```bash
cd backend
npm init -y
```

### 4.2 Instalar Dependencias
```bash
# Dependencias principales
npm install express sequelize mysql2 jsonwebtoken bcryptjs dotenv cors helmet morgan winston

# Dependencias de desarrollo
npm install --save-dev nodemon jest supertest eslint

# Dependencias de validación
npm install joi express-validator

# Dependencias adicionales
npm install compression express-rate-limit
```

### 4.3 Estructura de Carpetas Backend
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── environment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   ├── categoryController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Category.js
│   │   └── Installment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── categories.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── services/
│   │   ├── expenseService.js
│   │   └── analyticsService.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── validators.js
│   └── server.js
├── tests/
│   ├── auth.test.js
│   └── expense.test.js
├── .env.example
├── .env.local (no incluir en git)
├── package.json
└── README.md
```

### 4.4 Archivo .env Backend
```bash
# .env (crear en raíz de backend, NO incluir en git)
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=gastos_app
DB_PASSWORD=tu_contraseña_segura_123
DB_NAME=gastos_app
DB_PORT=3306

JWT_SECRET=tu_super_secret_key_aqui_cambiar_en_produccion
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug

# Email (opcional para recuperación de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app
```

### 4.5 package.json Scripts
```json
{
  "name": "gastos-app-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.1",
    "mysql2": "^3.6.4",
    "jsonwebtoken": "^9.1.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  }
}
```

### 4.6 Ejecutar Backend en Desarrollo
```bash
cd backend
npm run dev
# Debe mostrar: Server running on http://localhost:5000
```

---

## 5. SETUP FRONTEND (React + Vite)

### 5.1 Crear Proyecto React con Vite
```bash
# Volver al directorio raíz
cd ..

# Crear proyecto React
npm create vite@latest frontend -- --template react

# Entrar en carpeta
cd frontend

# Instalar dependencias
npm install
```

### 5.2 Dependencias Adicionales
```bash
# Routing
npm install react-router-dom

# HTTP
npm install axios

# State Management
npm install @reduxjs/toolkit react-redux

# UI Components
npm install react-icons react-toastify

# Forms
npm install react-hook-form zod @hookform/resolvers

# Fechas
npm install date-fns

# Gráficos
npm install recharts

# Styling
npm install tailwindcss postcss autoprefixer

# Testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### 5.3 Configurar Tailwind CSS
```bash
# Inicializar Tailwind
npx tailwindcss init -p

# Esto crea tailwind.config.js y postcss.config.js
```

### 5.4 Estructura de Carpetas Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ExpenseForm.jsx
│   │   ├── ExpenseList.jsx
│   │   ├── Dashboard.jsx
│   │   └── Charts.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Categories.jsx
│   │   ├── Reports.jsx
│   │   └── Profile.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useExpenses.js
│   │   └── useApi.js
│   ├── store/
│   │   ├── authSlice.js
│   │   ├── expenseSlice.js
│   │   └── store.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── expenseService.js
│   │   └── analyticsService.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .env.local (no incluir en git)
├── package.json
├── vite.config.js
└── README.md
```

### 5.5 Archivo .env Frontend
```bash
# .env (crear en raíz de frontend, NO incluir en git)
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Control de Gastos
VITE_LOG_LEVEL=debug
```

### 5.6 vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
```

### 5.7 Ejecutar Frontend en Desarrollo
```bash
# Desde carpeta frontend
npm run dev
# Debe mostrar: Local: http://localhost:5173
```

---

## 6. VERIFICACIÓN DE INSTALACIÓN

### Checklist Completo
- [ ] Node.js y npm instalados
- [ ] MySQL instalado y ejecutándose
- [ ] Base de datos creada
- [ ] Usuario MySQL creado con permisos
- [ ] Backend creado con dependencias instaladas
- [ ] Frontend creado con dependencias instaladas
- [ ] .env configurado en ambos lados
- [ ] Backend ejecutándose en puerto 5000
- [ ] Frontend ejecutándose en puerto 5173
- [ ] Ambos se comunican (probar una llamada API)

### Prueba Rápida de Conexión
```javascript
// Desde frontend, probar en consola del navegador
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(e => console.error('Error:', e));
```

---

## 7. COMANDOS ÚTILES PARA DESARROLLO

### Backend
```bash
# Desarrollo (con auto-reload)
npm run dev

# Tests
npm run test

# Tests en modo watch
npm run test:watch

# Linting
npm run lint

# Producción
npm start
```

### Frontend
```bash
# Desarrollo (Vite dev server)
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Tests
npm run test

# Linting
npm run lint
```

---

## 8. GUÍA DE PRIMEROS PASOS

### Paso 1: Backend - Crear Conexión a BD
Crear `backend/src/config/database.js`:
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT,
    logging: false
  }
);

module.exports = sequelize;
```

### Paso 2: Backend - Crear Servidor Base
Crear `backend/src/server.js`:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Paso 3: Frontend - Crear API Service
Crear `frontend/src/services/api.js`:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Paso 4: Frontend - Crear App Básica
Crear `frontend/src/App.jsx`:
```javascript
import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/health')
      .then(res => setStatus(res.data.status))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-8">
      <h1>Control de Gastos</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;
```

---

## 9. TROUBLESHOOTING COMÚN

| Problema | Solución |
|----------|----------|
| Puerto 5000 ya en uso | `lsof -i :5000` (macOS/Linux) o cambiar PORT en .env |
| MySQL no conecta | Verificar credenciales en .env, usuario y base de datos existen |
| CORS error | Verificar VITE_API_URL en frontend y FRONTEND_URL en backend |
| npm ERR! | Ejecutar `npm cache clean --force` y reinstalar |
| Módulos no encontrados | `rm -rf node_modules && npm install` |

---

## 10. SIGUIENTE PASO

Una vez instalado todo:

1. **Backend**: Implementar modelos Sequelize y primeros controladores
2. **Frontend**: Crear rutas básicas y componentes de login
3. **Autenticación**: Implementar JWT completo
4. **Gastos**: CRUD de gastos

Ver documento `REQUERIMIENTOS.md` para detalles de cada funcionalidad.

---

## 11. REFERENCIAS ÚTILES

- [Node.js Docs](https://nodejs.org/en/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Sequelize Docs](https://sequelize.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
