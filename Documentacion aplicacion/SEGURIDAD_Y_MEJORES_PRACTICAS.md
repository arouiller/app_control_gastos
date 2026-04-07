# Seguridad y Mejores Prácticas - Control de Gastos

## 1. SEGURIDAD DE AUTENTICACIÓN

### 1.1 Contraseñas
- **Requisitos mínimos**: Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 símbolo
- **Hasheado**: Usar bcrypt con salt rounds = 10
- **Nunca almacenar**: Contraseña en texto plano
- **Expiración**: Forzar cambio de contraseña cada 90 días (opcional)

### 1.2 Tokens JWT
```
Estructura:
{
  header: { alg: "HS256", typ: "JWT" },
  payload: { 
    sub: user_id,
    email: user_email,
    iat: issued_at,
    exp: expiration_time
  },
  signature: HMACSHA256(...)
}
```

- **Access Token**: Expiración 15 minutos
- **Refresh Token**: Expiración 7 días
- **Almacenamiento**: Access token en memoria/sessionStorage, Refresh token en cookie HTTP-only

### 1.3 Sesiones
- **Timeout de inactividad**: 30 minutos
- **Logout en múltiples dispositivos**: Validar refresh token contra BD
- **Revocación de tokens**: Mantener lista negra en Redis (opcional)

---

## 2. PROTECCIÓN CONTRA VULNERABILIDADES OWASP TOP 10

### 2.1 Inyección SQL
```javascript
// ❌ MAL - SQL Injection
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ BIEN - Usar ORM (Sequelize)
User.findOne({ where: { email: email } });

// ✅ BIEN - Prepared Statements
db.query('SELECT * FROM users WHERE email = ?', [email]);
```

### 2.2 Broken Authentication
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens con expiración
- ✅ Renovación de tokens segura
- ✅ Validación de email (registro y recuperación)
- ✅ Límite de intentos de login (rate limiting)

### 2.3 Exposición de Datos Sensibles
- ❌ No retornar contraseñas en respuestas API
- ✅ HTTPS obligatorio en producción
- ✅ Enmascarar errores (no exponer detalles internos)
- ✅ No loguear datos sensibles (contraseñas, tokens)

### 2.4 XML/Entidades Externas (XXE)
- ✅ No procesar XML directamente
- ✅ Si es necesario, usar parsers seguros con validación

### 2.5 Control de Acceso Roto
```javascript
// ✅ Siempre verificar que el usuario tenga acceso
async getExpense(req, res) {
  const expense = await Expense.findByPk(req.params.id);
  
  // Verificar propiedad
  if (expense.user_id !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  
  return res.json(expense);
}
```

### 2.6 Configuración de Seguridad Incorrecta
- ✅ Usar Helmet.js para headers de seguridad
- ✅ CORS configurado restrictivamente
- ✅ Desactivar X-Powered-By
- ✅ Content Security Policy (CSP)
- ✅ HSTS (HTTP Strict Transport Security)

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 2.7 Cross-Site Scripting (XSS)
```javascript
// ❌ MAL - Inyectar HTML directo
res.json({ message: userInput }); // Si contiene <script>...

// ✅ BIEN - Usar librerías de sanitización
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(userInput);

// ✅ BIEN - React escapa automáticamente
<div>{userInput}</div> // React escapa HTML
```

### 2.8 Desserialización Insegura
- ✅ Validar todas las entradas JSON
- ✅ Usar schema validators (Joi, Zod)
- ✅ Nunca usar eval() o Function() constructor

### 2.9 Uso de Componentes con Vulnerabilidades Conocidas
- ✅ Ejecutar `npm audit` regularmente
- ✅ Mantener dependencias actualizadas
- ✅ Usar herramientas como Snyk

### 2.10 Logging y Monitoreo Insuficiente
- ✅ Loguear intentos de login fallidos
- ✅ Loguear cambios de datos sensibles
- ✅ No loguear información sensible
- ✅ Monitoreo de alertas en tiempo real

---

## 3. VALIDACIÓN DE ENTRADA

### 3.1 Backend Validation (Joi)
```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/[A-Z]/).pattern(/[0-9]/).required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso().required()
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

### 3.2 Frontend Validation (Zod)
```javascript
import { z } from 'zod';

const expenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  category_id: z.number().int().positive(),
  date: z.string().date(),
  payment_method: z.enum(['cash', 'credit_card'])
});

try {
  const validated = expenseSchema.parse(data);
} catch (error) {
  // Mostrar errores de validación
}
```

---

## 4. PROTECCIÓN DE API

### 4.1 Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: 'Demasiados intentos de login. Intenta en 15 minutos.'
});

app.post('/api/auth/login', loginLimiter, loginController);
```

### 4.2 CORS
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4.3 Compresión
```javascript
const compression = require('compression');
app.use(compression()); // Gzip automático
```

### 4.4 HTTPS
- ✅ Obligatorio en producción
- ✅ Certificados SSL/TLS válidos
- ✅ Renovación automática (Let's Encrypt)

---

## 5. SEGURIDAD EN BASE DE DATOS

### 5.1 Credenciales
```
// .env
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=secure_password_123
DB_NAME=gastos_db
```

### 5.2 Permisos de Usuario DB
```sql
-- Crear usuario específico para la app (NO root)
CREATE USER 'gastos_app'@'localhost' IDENTIFIED BY 'secure_password';

-- Otorgar permisos específicos
GRANT SELECT, INSERT, UPDATE, DELETE ON gastos_db.* TO 'gastos_app'@'localhost';

-- NO otorgar:
-- - CREATE, ALTER, DROP
-- - GRANT
-- - SUPER
```

### 5.3 Backups y Recuperación
- ✅ Backups automáticos diarios
- ✅ Almacenar en ubicación segura (AWS S3, etc.)
- ✅ Encriptar backups
- ✅ Probar restauración regularmente

### 5.4 Auditoría
- ✅ Usar tabla audit_logs
- ✅ Registrar qué usuario hizo qué cambio
- ✅ Retener logs 90+ días

---

## 6. SEGURIDAD EN FRONTEND

### 6.1 Content Security Policy
```
Header: Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://trusted.com; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:;
```

### 6.2 Protección de LocalStorage
```javascript
// ❌ MAL - Almacenar token en localStorage (accesible por XSS)
localStorage.setItem('token', accessToken);

// ✅ BIEN - Almacenar en memoria + sessionStorage
sessionStorage.setItem('accessToken', accessToken); // Temporal
// Refresh token en cookie HTTP-only (servidor)
```

### 6.3 Prevención de Clickjacking
```
Header: X-Frame-Options: DENY
Header: X-Content-Type-Options: nosniff
```

### 6.4 Sanitización de HTML
```javascript
import DOMPurify from 'dompurify';

const safeHTML = DOMPurify.sanitize(userInput);
```

---

## 7. MONITOREO Y LOGGING

### 7.1 Niveles de Log
```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 7.2 Eventos a Loguear
- ✅ Login exitoso/fallido
- ✅ Cambios de contraseña
- ✅ Creación/modificación de datos sensibles
- ✅ Errores del servidor
- ✅ Accesos no autorizados

### 7.3 No Loguear
- ❌ Contraseñas
- ❌ Tokens JWT
- ❌ Números de tarjeta
- ❌ SSN/DNI

---

## 8. TESTING DE SEGURIDAD

### 8.1 Tests Unitarios
```javascript
describe('Authentication', () => {
  it('debe rechazar contraseña débil', () => {
    const weak = 'abc123';
    expect(validatePassword(weak)).toBe(false);
  });

  it('debe encriptar contraseña con bcrypt', async () => {
    const hashed = await hashPassword('password123');
    expect(hashed).not.toBe('password123');
  });
});
```

### 8.2 Tests de Integración
```javascript
describe('Protected Routes', () => {
  it('debe rechazar sin token', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('debe rechazar token inválido', async () => {
    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
  });
});
```

### 8.3 Herramientas de Seguridad
- OWASP ZAP - Escaneo de seguridad
- Burp Suite - Pruebas de penetración
- npm audit - Dependencias vulnerables
- Snyk - Monitoreo de vulnerabilidades

---

## 9. DEPLOYMENT SEGURO

### 9.1 Variables de Entorno
```
# .env.production
NODE_ENV=production
DB_HOST=db.production.aws.com
DB_USER=gastos_app
JWT_SECRET=super_secure_random_key_here
FRONTEND_URL=https://app.example.com
LOG_LEVEL=warn
```

### 9.2 Docker Security
```dockerfile
# Usar imagen base mínima
FROM node:20-alpine

# Ejecutar como usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# No instalar dependencias de desarrollo
RUN npm ci --only=production
```

### 9.3 Control de Acceso
- ✅ Firewall: Solo puertos 443 (HTTPS)
- ✅ SSH: Key-based auth, desactivar root
- ✅ Database: Aislado en VPN privada
- ✅ Secrets: AWS Secrets Manager, HashiCorp Vault

---

## 10. CUMPLIMIENTO REGULATORIO

### 10.1 GDPR (si aplica)
- ✅ Consentimiento de datos personales
- ✅ Derecho a ser olvidado (endpoint de eliminación)
- ✅ Política de privacidad clara
- ✅ Encriptación de datos sensibles

### 10.2 PCI DSS (si maneja tarjetas)
- ⚠️ NUNCA almacenar números de tarjeta completos
- ✅ Si es necesario, usar tokenización (Stripe, PayPal)
- ✅ Cumplimiento de estándares de seguridad

---

## 11. CHECKLIST PRE-PRODUCCIÓN

- [ ] HTTPS configurado y funcionando
- [ ] Todas las contraseñas hasheadas
- [ ] Tokens JWT con expiración
- [ ] Rate limiting en endpoints sensibles
- [ ] CORS configurado restrictivamente
- [ ] Helmet.js instalado y activo
- [ ] Validación de entrada en todos los endpoints
- [ ] Manejo de errores sin exponer detalles
- [ ] Logging configurado
- [ ] Backup automático de BD
- [ ] Dependencias sin vulnerabilidades (npm audit)
- [ ] Tests ejecutándose al 80%+ cobertura
- [ ] Variables de entorno seguras
- [ ] Database user sin privilegios excesivos
- [ ] Documentación de API actualizada
- [ ] Plan de incident response

---

## 12. RECURSOS Y REFERENCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
