# 🚀 GUÍA DE INSTALACIÓN - GITO 2.0

## ⚡ INSTALACIÓN RÁPIDA (5 pasos)

### 📋 **PASO 1: Descargar archivos actualizados**

Has recibido los siguientes archivos:
```
✅ server.js                    → Reemplaza tu server.js actual
✅ TramitologiaView.jsx         → Nuevo componente (agregar a src/components/)
✅ data/articulos_index.json    → Base de datos del reglamento
✅ data/reglamento_completo.txt → Texto completo del reglamento
✅ README_ACTUALIZACION.md      → Documentación completa
```

---

### 🔧 **PASO 2: Backup de tu sistema actual**

**En tu servidor (Railway, VPS, o local):**

```bash
# Conectar por SSH o terminal
cd /ruta/de/tu/proyecto

# Hacer backup de archivos críticos
cp server.js server.js.backup
cp src/App.jsx src/App.jsx.backup

# Verificar backup
ls -la *.backup
```

---

### 📁 **PASO 3: Subir archivos nuevos**

#### **Opción A: Si usas Railway con GitHub**

```bash
# En tu computadora local, dentro del repo del proyecto:

# 1. Reemplazar server.js
cp /ruta/descarga/server.js ./server.js

# 2. Crear directorio data (si no existe)
mkdir -p data

# 3. Copiar archivos del reglamento
cp /ruta/descarga/data/articulos_index.json ./data/
cp /ruta/descarga/data/reglamento_completo.txt ./data/

# 4. Crear directorio de componentes
mkdir -p src/components

# 5. Copiar componente de tramitología
cp /ruta/descarga/TramitologiaView.jsx ./src/components/

# 6. Commit y push
git add .
git commit -m "GITO 2.0: Reglamento + Tramitología integrados"
git push origin main

# Railway desplegará automáticamente
```

#### **Opción B: Si usas FTP/SFTP**

```
1. Conectar con FileZilla o WinSCP
2. Navegar a la carpeta del proyecto
3. Subir server.js → reemplazar el actual
4. Crear carpeta "data" en la raíz
5. Subir articulos_index.json → dentro de /data
6. Subir reglamento_completo.txt → dentro de /data  
7. Crear carpeta "components" dentro de /src
8. Subir TramitologiaView.jsx → dentro de /src/components
```

#### **Opción C: Si tienes acceso SSH directo**

```bash
# Subir archivos con scp
scp server.js usuario@servidor:/ruta/proyecto/
scp -r data usuario@servidor:/ruta/proyecto/
scp TramitologiaView.jsx usuario@servidor:/ruta/proyecto/src/components/

# Conectar y verificar
ssh usuario@servidor
cd /ruta/proyecto
ls -la data/
```

---

### 🔄 **PASO 4: Actualizar App.jsx**

Necesitas agregar el import y la integración del componente de tramitología.

**Agregar al inicio de src/App.jsx:**

```javascript
// Después de los otros imports, agregar:
import { TramitologiaView } from './components/TramitologiaView';
```

**Modificar el estado para incluir el view de tramitología:**

Busca donde está definido `const [viewMode, setViewMode] = useState('search');`

Y agrega una nueva opción al menú de navegación. Busca la sección del header donde están los botones de navegación y agrega:

```javascript
<button
  onClick={() => { setViewMode('tramites'); setSelectedProperty(null); }}
  className={`px-4 py-2 rounded-full ${viewMode === 'tramites' ? 'bg-gob-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
>
  📋 Tramitología
</button>
```

**Agregar el renderizado condicional:**

Busca donde se renderizan los diferentes viewMode y agrega:

```javascript
{viewMode === 'tramites' && (
  <TramitologiaView 
    property={selectedProperty}
    api={createApi(() => token)}
  />
)}
```

**O si prefieres, puedo enviarte el App.jsx completo actualizado.**

---

### ▶️ **PASO 5: Reiniciar el servidor**

#### **Railway:**
```
Ya se reiniciará automáticamente al hacer push
Ver el progreso en: railway.app → tu proyecto → Deployments
```

#### **PM2:**
```bash
pm2 restart seduvi-app
pm2 logs seduvi-app  # Ver logs
```

#### **Node directo:**
```bash
# Detener proceso actual (Ctrl+C)
# Iniciar de nuevo
npm start
```

---

## ✅ **VERIFICACIÓN DE INSTALACIÓN**

### **1. Verificar archivos subidos:**

```bash
# En el servidor
cd /ruta/proyecto

# Verificar estructura
ls -la data/
# Debe mostrar:
# - articulos_index.json
# - reglamento_completo.txt

ls -la src/components/
# Debe mostrar:
# - TramitologiaView.jsx
```

### **2. Verificar que el servidor arrancó correctamente:**

```bash
# Ver logs
pm2 logs seduvi-app
# O en Railway: Deployments → View Logs

# Buscar líneas como:
# ✅ Database initialized successfully
# Server Running Port: 3000
```

### **3. Probar en el navegador:**

1. **Abrir tu aplicación:** `https://tu-dominio.com`

2. **Buscar un predio** cualquiera

3. **Ver detalles del predio**

4. **Hacer una pregunta en el chat:** "¿Qué artículo regula las licencias?"
   - Debe responder citando el Art. 54-60

5. **Ir a "Tramitología"** (nuevo botón en el header)
   - Debe mostrar checklist automático

---

## 🧪 **PRUEBAS SUGERIDAS**

### **Test 1: Chat con contexto del reglamento**

```
Pregunta: "¿Cuándo necesito DRO?"
Respuesta esperada: "Según el Art. 32... se requiere DRO para..."
```

### **Test 2: Checklist de tramitología**

```
1. Busca: "Durango 259, Roma Norte"
2. Click en resultado
3. Ve a pestaña "Tramitología"
4. Debe mostrar:
   - Costo estimado total
   - Timeline de trámites
   - Alertas de ACP (Roma Norte es ACP)
```

### **Test 3: Búsqueda de artículo**

```
Desde consola del navegador (F12):
fetch('/api/reglamento/articulo/54')
  .then(r => r.json())
  .then(d => console.log(d))

Debe retornar objeto con el artículo 54
```

---

## ❌ **PROBLEMAS COMUNES**

### **Error: "Cannot find module './components/TramitologiaView'"**

**Solución:**
```bash
# Verificar que el archivo existe
ls -la src/components/TramitologiaView.jsx

# Si no existe, subirlo de nuevo
# Verificar mayúsculas/minúsculas
```

### **Error: "articulos_index.json not found"**

**Solución:**
```bash
# Crear directorio data en la raíz del proyecto
mkdir -p data

# Subir archivo
cp articulos_index.json data/

# Reiniciar servidor
pm2 restart seduvi-app
```

### **El chat no cita artículos del reglamento**

**Solución:**
```bash
# Verificar que ANTHROPIC_API_KEY está configurada
# En Railway: Settings → Variables
# Agregar: ANTHROPIC_API_KEY=sk-ant-...

# Reiniciar deployment
```

### **Botón de "Tramitología" no aparece**

**Solución:**
```javascript
// Verificar que agregaste el botón en App.jsx
// Buscar la sección del header y agregar:

<button
  onClick={() => setViewMode('tramites')}
  className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-100"
>
  📋 Tramitología
</button>
```

---

## 🔄 **ROLLBACK (si algo sale mal)**

```bash
# Restaurar archivos originales
cp server.js.backup server.js
cp src/App.jsx.backup src/App.jsx

# Reiniciar
pm2 restart seduvi-app
# O git reset --hard si usas git
```

---

## 📞 **SIGUIENTE PASO**

Una vez que confirmes que todo funciona correctamente, podemos proceder con:

✅ **Área 1: Terrenos y Tramitología** ← Ya instalada
⏳ **Área 2: Corridas Financieras** ← Siguiente
⏳ **Área 3: Mercado Inmobiliario**
⏳ **Área 4: Indicadores de Mercado**

---

## 🎉 **¡Listo!**

Tu sistema ahora incluye:
- ✅ Reglamento de Construcciones completo (256 artículos)
- ✅ Checklist automático de tramitología
- ✅ Chat mejorado con citas del reglamento
- ✅ Costos y tiempos estimados por trámite

**¿Necesitas ayuda con la instalación?**
- Revisa los logs del servidor
- Verifica la estructura de archivos
- Prueba los endpoints de API manualmente
