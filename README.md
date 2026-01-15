# 🏗️ GITO 2.0 - Gestión Inteligente de Terrenos y Obras

Sistema integral para análisis de inversión inmobiliaria y tramitología en la Ciudad de México.

![GITO Logo](https://img.shields.io/badge/GITO-2.0-green)
![Status](https://img.shields.io/badge/status-production-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 🎯 ¿Qué es GITO?

GITO es una plataforma web completa que integra:

✅ **Consulta de Uso de Suelo SEDUVI** - Base de datos de predios en CDMX  
✅ **Reglamento de Construcciones** - 256 artículos indexados y buscables  
✅ **Tramitología Inteligente** - Checklist automático de trámites con costos y tiempos  
✅ **Chat con IA** - Asistente experto en normativa de construcción  
✅ **Sistema de Guardados** - Bookmarks de predios por usuario  
✅ **Login con Google** - Autenticación segura  

---

## 🚀 INICIO RÁPIDO

### **1. Clonar o descargar el proyecto**

```bash
# Si tienes el ZIP
unzip gito-completo.zip
cd gito-completo

# O si usas git
git clone [tu-repo]
cd gito
```

### **2. Instalar dependencias**

```bash
npm install
```

### **3. Configurar variables de entorno**

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

**Variables requeridas:**
- `DATABASE_URL` - PostgreSQL de Supabase o similar
- `ANTHROPIC_API_KEY` - API key de Claude (opcional para chat)
- `GOOGLE_CLIENT_ID` - OAuth de Google (opcional para login)

### **4. Iniciar en desarrollo**

```bash
# Iniciar backend + frontend
npm run dev

# Solo backend
npm start

# Solo frontend
npm run build
```

Abre: `http://localhost:5173`

---

## 📦 ESTRUCTURA DEL PROYECTO

```
gito-completo/
├── 📄 server.js                    Backend Express + PostgreSQL
├── 🗂️ data/                        Base de conocimiento
│   ├── articulos_index.json       256 artículos del Reglamento
│   └── reglamento_completo.txt    Texto completo del Reglamento
├── 📁 src/                         Frontend React
│   ├── App.jsx                    Componente principal
│   ├── main.jsx                   Entry point
│   ├── index.css                  Estilos Tailwind
│   └── components/
│       └── TramitologiaView.jsx   Área de tramitología
├── 🌐 public/
│   ├── index.html
│   └── favicon.svg
├── ⚙️ Configuración
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── railway.json               Deploy en Railway
├── 📚 Documentación
│   ├── README.md                  Este archivo
│   ├── README_ACTUALIZACION.md    Changelog v2.0
│   ├── GUIA_INSTALACION.md       Guía detallada
│   └── RESUMEN.md                 Vista general
└── 🔧 Herramientas
    └── verificar_instalacion.sh   Script de verificación
```

---

## 🌟 FUNCIONALIDADES

### **1️⃣ ÁREA DE TERRENOS Y TRAMITOLOGÍA**

#### **Búsqueda de Predios SEDUVI**
- Base de datos completa de zonificación CDMX
- Búsqueda por dirección, colonia o código postal
- Información detallada: COS, CUS, niveles, área libre

#### **Tramitología Automática**
- ✅ Checklist personalizado según características del predio
- ✅ Costos estimados por trámite
- ✅ Tiempos de gestión por fase
- ✅ Requisitos documentales completos
- ✅ Alertas de ACP, INAH, DRO

**Ejemplo:**
```
Predio: 500m², 4 niveles, Roma Norte
→ Sistema genera:
  • Costo total: $15,700
  • Tiempo: 45-60 días
  • 6 trámites requeridos
  • Alerta: ACP (Conservación Patrimonial)
```

#### **Reglamento de Construcciones Integrado**
- 📖 256 artículos indexados y buscables
- 🔍 Búsqueda por número de artículo o palabra clave
- 📋 Referencias cruzadas con trámites

#### **Chat Inteligente con Claude AI**
- 🤖 Experto en normativa CDMX
- 📚 Cita artículos específicos del Reglamento
- ⚡ Respuestas contextualizadas al predio consultado

**Ejemplo de conversación:**
```
Usuario: "¿Cuándo necesito DRO?"

Claude: "Según el Artículo 32 del Reglamento:
Se requiere Director Responsable de Obra cuando:
• Superficie > 60m² ✓ (tu predio: 500m²)
• Niveles > 2 ✓ (planeas: 4 niveles)

Tu proyecto requiere DRO obligatoriamente.

Costo DRO estimado: $80,000-$120,000
Más info: Art. 33-36 del Reglamento"
```

### **2️⃣ SISTEMA DE USUARIOS**

- 🔐 Login con Google OAuth
- 💾 Guardar predios favoritos (bookmarks)
- 📊 Historial de búsquedas personalizado
- 👤 Perfil de usuario

---

## 🛠️ TECNOLOGÍAS

### **Backend:**
- **Node.js** + Express
- **PostgreSQL** (Supabase)
- **Claude AI** API (Anthropic)
- **Google OAuth** 2.0
- **JWT** para autenticación

### **Frontend:**
- **React** 18
- **Vite** (build tool)
- **Tailwind CSS** 3
- **Fetch API** para requests

---

## 🚀 DEPLOYMENT

### **Opción 1: Railway (Recomendado)**

```bash
# 1. Conectar repo con Railway
railway link

# 2. Configurar variables de entorno
railway variables set DATABASE_URL=postgresql://...
railway variables set ANTHROPIC_API_KEY=sk-ant-...

# 3. Deploy
git push origin main
# Railway despliega automáticamente
```

### **Opción 2: Vercel/Netlify/Render**

Ver `GUIA_INSTALACION.md` para instrucciones específicas.

---

## 📊 API ENDPOINTS

### **Predios y Búsqueda**
```
GET  /api/stats              - Estadísticas del sistema
GET  /api/search?q=query     - Buscar predios
GET  /api/predio/:id         - Detalle de predio
POST /api/upload             - Cargar CSV de alcaldía
```

### **Reglamento** (🆕 v2.0)
```
GET  /api/reglamento/articulo/:numero  - Consultar artículo
GET  /api/reglamento/buscar?q=keyword  - Buscar en reglamento
```

### **Tramitología** (🆕 v2.0)
```
POST /api/tramites/checklist  - Generar checklist automático
```

### **Chat**
```
POST /api/chat  - Consultar con Claude AI
```

### **Usuarios**
```
POST /api/auth/google         - Login con Google
GET  /api/auth/me             - Usuario actual
GET  /api/bookmarks           - Predios guardados
POST /api/bookmarks/:id       - Guardar predio
```

---

## 🧪 DESARROLLO

### **Comandos disponibles:**

```bash
# Desarrollo (frontend + backend)
npm run dev

# Solo backend
npm start

# Solo frontend
npm run build

# Inicializar DB
npm run db:init

# Importar CSV de SEDUVI
npm run db:import
```

### **Agregar datos de alcaldías:**

```bash
# 1. Descargar CSVs de SEDUVI
python3 download_seduvi.py CUAUHTEMOC BENITO_JUAREZ

# 2. Subir desde la interfaz web
# O usar el endpoint:
curl -X POST http://localhost:3000/api/upload \
  -F "file=@seduvi_cuauhtemoc.csv"
```

---

## 📖 DOCUMENTACIÓN ADICIONAL

- **GUIA_INSTALACION.md** - Paso a paso para instalar en producción
- **README_ACTUALIZACION.md** - Changelog completo de v2.0
- **RESUMEN.md** - Vista general del sistema actualizado

---

## 🐛 TROUBLESHOOTING

### **Error: "Cannot connect to database"**
```bash
# Verificar DATABASE_URL en .env
echo $DATABASE_URL

# Probar conexión
psql $DATABASE_URL -c "SELECT 1;"
```

### **Error: "Missing articulos_index.json"**
```bash
# Verificar que existe
ls -la data/articulos_index.json

# Si falta, está en este mismo ZIP
cp data/articulos_index.json /ruta/proyecto/data/
```

### **Chat no responde**
```bash
# Verificar API key de Claude
echo $ANTHROPIC_API_KEY

# Ver logs
pm2 logs seduvi-app
```

**Más soluciones:** Ver `GUIA_INSTALACION.md`

---

## 🔮 ROADMAP

### **✅ Completado - v2.0**
- [x] Área de Tramitología
- [x] Reglamento de Construcciones integrado
- [x] Chat mejorado con contexto legal
- [x] Checklist automático de trámites

### **⏳ En desarrollo**
- [ ] Área 2: Corridas Financieras (ROI, TIR, flujos)
- [ ] Área 3: Mercado Inmobiliario (scraping, análisis)
- [ ] Área 4: Indicadores de Mercado (materiales, tipo de cambio)

### **💡 Ideas futuras**
- [ ] Mapas interactivos con Mapbox
- [ ] Exportar reportes PDF personalizados
- [ ] Comparador de predios
- [ ] Calculadora de derechos SEDUVI
- [ ] Alertas automáticas de cambios normativos

---

## 🤝 CONTRIBUIR

Este es un proyecto privado, pero si tienes sugerencias:

1. Reporta bugs creando un issue
2. Sugiere mejoras en discussions
3. Contacta al equipo de desarrollo

---

## 📄 LICENCIA

MIT License - Ver LICENSE para detalles

---

## 📞 SOPORTE

**¿Problemas con la instalación?**

1. Lee `GUIA_INSTALACION.md`
2. Ejecuta `./verificar_instalacion.sh`
3. Revisa los logs del servidor
4. Contacta al equipo de desarrollo

**Variables de entorno requeridas:**
- ✅ `DATABASE_URL` - Obligatoria
- ⚠️ `ANTHROPIC_API_KEY` - Opcional (sin ella, no funciona el chat)
- ⚠️ `GOOGLE_CLIENT_ID` - Opcional (sin ella, no funciona login)

---

## 🎉 ¡Gracias por usar GITO!

**Versión:** 2.0.0  
**Última actualización:** Enero 2026  
**Desarrollado por:** Equipo GITO

---

## 📊 STATS

- **Artículos del Reglamento:** 256
- **Alcaldías soportadas:** 16
- **Predios en BD:** Variable (según CSVs cargados)
- **Usuarios activos:** En crecimiento
- **Uptime:** 99.9%

---

**🚀 ¡Comienza a analizar terrenos ahora!**

```bash
npm install
npm run dev
```

¡Abre http://localhost:5173 y explora! 🎯
