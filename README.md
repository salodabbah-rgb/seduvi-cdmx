# SEDUVI CDMX - Consulta de Uso de Suelo

Aplicación web para consultar zonificación y uso de suelo de predios en la Ciudad de México.

## 🚀 Deployment: Railway + Supabase

### Paso 1: Crear Base de Datos en Supabase (GRATIS)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Click **"New Project"**
3. Configura:
   - **Name:** `seduvi-cdmx`
   - **Database Password:** (guarda esta contraseña!)
   - **Region:** Elige el más cercano a ti
4. Click **"Create new project"** (espera ~2 minutos)

### Paso 2: Obtener Connection String de Supabase

1. En tu proyecto de Supabase, ve a **Project Settings** (⚙️ icono)
2. Click en **Database** (menú izquierdo)
3. Scroll hasta **"Connection string"**
4. Selecciona **"URI"**
5. Copia el string, se ve así:
   ```
   postgresql://postgres.[TU-PROJECT-REF]:[TU-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
6. Reemplaza `[TU-PASSWORD]` con la contraseña que creaste

### Paso 3: Subir código a GitHub

```bash
# Descomprime el proyecto
unzip seduvi-app.zip
cd seduvi-app

# Inicializa git
git init
git add .
git commit -m "Initial commit"

# Crea un repo en GitHub, luego:
git remote add origin https://github.com/TU_USUARIO/seduvi-cdmx.git
git push -u origin main
```

### Paso 4: Deploy en Railway

1. Ve a [railway.app](https://railway.app) → Inicia sesión con GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio `seduvi-cdmx`
4. Espera a que inicie el build

### Paso 5: Configurar Variables de Entorno en Railway

1. En tu servicio de Railway, ve a **Variables**
2. Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-...supabase.com:6543/postgres` |
| `NODE_ENV` | `production` |

3. Railway redeploya automáticamente

### Paso 6: Conectar tu Dominio Personalizado

1. En Railway, ve a tu servicio → **Settings** → **Domains**
2. Click **"+ Custom Domain"**
3. Ingresa tu dominio: `seduvi.tudominio.com`
4. Railway te da un registro CNAME
5. En tu proveedor de DNS, agrega:

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | seduvi | `xxx.up.railway.app` |

Espera 5-30 minutos para propagación DNS.

---

## 📊 Ver Datos en Supabase Dashboard

Una ventaja de Supabase es que puedes ver tus datos en una interfaz visual:

1. Ve a tu proyecto en Supabase
2. Click en **Table Editor** (menú izquierdo)
3. Verás las tablas:
   - `predios` - Todos los predios cargados
   - `alcaldias_loaded` - Alcaldías disponibles
   - `search_history` - Historial de búsquedas

También puedes hacer queries SQL directamente en **SQL Editor**.

---

## 💰 Costos

### Supabase (Base de Datos)
- **Free tier:** 500MB, 2 proyectos - **SUFICIENTE para SEDUVI**
- Los CSVs de todas las alcaldías ocupan ~200MB

### Railway (Hosting)
- **Free tier:** $5/mes de crédito
- **Hobby:** ~$5/mes

**Total: ~$5/mes o GRATIS** si usas los free tiers.

---

## 🗄️ Estructura de Base de Datos

Las tablas se crean automáticamente al iniciar la app:

```sql
-- Tabla principal de predios
CREATE TABLE predios (
  id SERIAL PRIMARY KEY,
  alcaldia VARCHAR(100),
  calle VARCHAR(255),
  no_externo VARCHAR(50),
  colonia VARCHAR(255),
  codigo_pos VARCHAR(10),
  superficie DECIMAL(12,2),
  uso_descri TEXT,
  densidad_d VARCHAR(100),
  niveles VARCHAR(20),
  altura VARCHAR(50),
  area_libre VARCHAR(20),
  minimo_viv VARCHAR(50),
  liga_ciuda TEXT,
  longitud DECIMAL(15,10),
  latitud DECIMAL(15,10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_predios_calle ON predios(calle);
CREATE INDEX idx_predios_colonia ON predios(colonia);
CREATE INDEX idx_predios_alcaldia ON predios(alcaldia);
```

---

## 🔌 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Estadísticas de datos |
| GET | `/api/search?q=query` | Buscar predios |
| GET | `/api/predio/:id` | Obtener predio por ID |
| GET | `/api/history` | Historial de búsquedas |
| POST | `/api/upload` | Subir CSV |
| DELETE | `/api/alcaldia/:name` | Eliminar alcaldía |
| DELETE | `/api/history` | Limpiar historial |

---

## 🏃 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear archivo .env con tu connection string de Supabase
cp .env.example .env

# Editar .env:
# DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@...supabase.com:6543/postgres

# Iniciar desarrollo (frontend + backend)
npm run dev
```

Abre `http://localhost:5173`

---

## 📊 Cargar Datos CSV

1. Descarga los CSVs:
   ```bash
   python3 download_seduvi.py CUAUHTEMOC BENITO_JUAREZ MIGUEL_HIDALGO
   ```

2. En la app web, click **"Cargar CSV"**

3. Selecciona el archivo (ej: `seduvi_cuauhtemoc.csv`)

4. Espera 1-2 minutos para archivos grandes (~46,000 registros)

5. ¡Los datos quedan guardados permanentemente en Supabase! 🎉

---

## 🔧 Troubleshooting

### "Connection refused" o error de BD
- Verifica que `DATABASE_URL` esté correcto en Railway Variables
- Asegúrate de haber reemplazado `[YOUR-PASSWORD]` con tu contraseña real
- En Supabase, verifica que el proyecto esté activo (no pausado)

### CSV no carga / timeout
- Archivos muy grandes (>50MB) pueden causar timeout
- Prueba subir una alcaldía a la vez
- Verifica logs en Railway: Deployments → View Logs

### Dominio no funciona
- Espera hasta 24-48 horas para propagación DNS
- Verifica el registro CNAME en tu proveedor de DNS
- Prueba con `dig seduvi.tudominio.com` para verificar

### Ver logs de errores
- Railway: Tu servicio → Deployments → Click deployment → View Logs
- Supabase: Database → Logs

---

## 📁 Estructura del Proyecto

```
seduvi-app/
├── server.js           # Express API + PostgreSQL
├── src/
│   ├── App.jsx         # React frontend
│   ├── main.jsx        # Entry point
│   └── index.css       # Tailwind styles
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js      # Vite + proxy config
├── tailwind.config.js
├── railway.json        # Railway deployment
└── .env.example        # Template de variables
```

---

## 📄 Licencia

MIT
