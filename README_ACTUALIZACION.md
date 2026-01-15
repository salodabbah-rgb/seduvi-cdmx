# GITO 2.0 - Gestión Inteligente de Terrenos y Obras

Sistema integral para análisis de terrenos, tramitología y desarrollo inmobiliario en la Ciudad de México.

## 🆕 ACTUALIZACIONES - Versión 2.0

### ✅ NUEVAS FUNCIONALIDADES

#### 1. **REGLAMENTO DE CONSTRUCCIONES INTEGRADO**
- ✅ Base de conocimiento completa del Reglamento de Construcciones CDMX (256 artículos)
- ✅ Búsqueda de artículos específicos
- ✅ Contexto automático en el chat con Claude AI
- ✅ Referencias cruzadas entre trámites y artículos

#### 2. **TRAMITOLOGÍA INTELIGENTE**
- ✅ Checklist automático personalizado según características del predio
- ✅ Costos estimados por trámite
- ✅ Tiempos de gestión
- ✅ Requisitos documentales detallados
- ✅ Alertas de ACP, INAH, y restricciones especiales
- ✅ Directorio de ventanillas SEDUVI

#### 3. **CHAT MEJORADO CON CLAUDE**
- ✅ Conocimiento del Reglamento de Construcciones completo
- ✅ Respuestas con citas de artículos específicos
- ✅ Contexto automático del predio consultado
- ✅ Advertencias sobre DRO, corresponsables y dictámenes

---

## 📂 ARCHIVOS ACTUALIZADOS

### **Backend:**
- ✅ `server.js` - Endpoints nuevos de reglamento y tramitología
- ✅ `data/articulos_index.json` - Base de datos del reglamento (256 artículos)
- ✅ `data/reglamento_completo.txt` - Texto completo del reglamento

### **Frontend:**
- ✅ `App.jsx` - Integración del área de tramitología
- ✅ `TramitologiaView.jsx` - Nuevo componente de tramitología

---

## 🚀 INSTALACIÓN DE ACTUALIZACIÓN

### Paso 1: Backup del sistema actual

```bash
# En tu servidor, hacer backup
cd /ruta/de/tu/proyecto
cp server.js server.js.backup
cp src/App.jsx src/App.jsx.backup
```

### Paso 2: Subir archivos nuevos

```bash
# Reemplazar archivos actualizados
cp server.js /ruta/de/tu/proyecto/
cp TramitologiaView.jsx /ruta/de/tu/proyecto/src/components/

# Crear directorio de datos
mkdir -p /ruta/de/tu/proyecto/data

# Subir base de datos del reglamento
cp data/articulos_index.json /ruta/de/tu/proyecto/data/
cp data/reglamento_completo.txt /ruta/de/tu/proyecto/data/
```

### Paso 3: Reiniciar servidor

```bash
# Si usas Railway
git add .
git commit -m "GITO 2.0: Reglamento + Tramitología"
git push origin main

# O si usas PM2
pm2 restart seduvi-app
```

---

## 🎯 NUEVOS ENDPOINTS DE API

### **Reglamento de Construcciones**

```javascript
// Buscar artículo específico
GET /api/reglamento/articulo/:numero
// Ejemplo: GET /api/reglamento/articulo/54
// Respuesta: {
//   articulo: "54",
//   titulo: "MANIFESTACIONES DE CONSTRUCCIÓN",
//   capitulo: "DE LAS MANIFESTACIONES DE CONSTRUCCIÓN",
//   texto: "Las manifestaciones de construcción se clasifican en..."
// }

// Buscar por palabra clave
GET /api/reglamento/buscar?q=licencia
// Respuesta: {
//   results: [
//     { articulo: "54", titulo: "...", texto: "..." },
//     { articulo: "55", titulo: "...", texto: "..." }
//   ]
// }
```

### **Tramitología**

```javascript
// Generar checklist de trámites
POST /api/tramites/checklist
// Body: {
//   superficie: 250,
//   niveles: 3,
//   uso: "habitacional",
//   colonia: "ROMA NORTE",
//   alcaldia: "Cuauhtémoc"
// }
// Respuesta: {
//   preConstruccion: [...],
//   registro: [...],
//   permisos: [...],
//   postConstruccion: [...],
//   alertasEspeciales: [...],
//   costoEstimado: 15000,
//   tiempoEstimado: "45-60 días"
// }
```

### **Chat Mejorado**

```javascript
// El endpoint de chat ahora acepta datos del predio
POST /api/chat
// Body: {
//   messages: [...],
//   systemPrompt: "...",
//   propertyData: {  // NUEVO
//     calle: "Durango",
//     no_externo: "259",
//     colonia: "ROMA NORTE",
//     alcaldia: "Cuauhtémoc",
//     uso_descri: "HC/4/30",
//     superficie: 500,
//     niveles: "4"
//   }
// }
```

---

## 📋 EJEMPLOS DE USO

### **Ejemplo 1: Consultar trámites para una obra**

```javascript
// Desde el frontend
const response = await fetch('/api/tramites/checklist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    superficie: 180,
    niveles: 3,
    uso: 'habitacional',
    colonia: 'CONDESA',
    alcaldia: 'Cuauhtémoc'
  })
});

const checklist = await response.json();
console.log(checklist);
// Output:
// {
//   preConstruccion: [
//     { nombre: "Constancia de Alineamiento", costo: 800, tiempo: "3-5 días" },
//     { nombre: "CEUZ", costo: 1800, tiempo: "5-10 días" }
//   ],
//   registro: [
//     { nombre: "Licencia Tipo A", costo: 8100, tiempo: "10-20 días" }
//   ],
//   alertasEspeciales: [
//     { tipo: "ACP", mensaje: "Área de Conservación Patrimonial" }
//   ],
//   costoEstimado: 15700,
//   tiempoEstimado: "45-60 días"
// }
```

### **Ejemplo 2: Consultar artículo del reglamento**

```javascript
const art = await fetch('/api/reglamento/articulo/54').then(r => r.json());
console.log(art);
// Output:
// {
//   articulo: "54",
//   titulo: "MANIFESTACIONES DE CONSTRUCCIÓN",
//   texto: "Las manifestaciones se clasifican en Registro y Licencia..."
// }
```

---

## 🧠 SISTEMA DE CONOCIMIENTO DEL REGLAMENTO

El chat de Claude ahora tiene acceso completo al Reglamento de Construcciones:

### **Características:**
- ✅ 256 artículos indexados
- ✅ 11 títulos organizados
- ✅ 47 capítulos
- ✅ Búsqueda por palabra clave
- ✅ Referencias cruzadas automáticas

### **Prompt del sistema mejorado:**

```
El asistente ahora incluye:
- Contexto del Reglamento de Construcciones CDMX
- Artículos clave de referencia
- Instrucciones para citar artículos específicos
- Datos del predio en consulta (si aplica)
```

### **Ejemplo de respuesta del chat:**

**Usuario:** "Quiero construir 3 departamentos, ¿qué necesito?"

**Claude:**
```
Para construir 3 departamentos necesitas:

📋 TRÁMITE REQUERIDO:
Licencia de Construcción Tipo A (Artículo 55 del Reglamento)

⚠️ REQUISITOS CRÍTICOS:
• Director Responsable de Obra (DRO) - Art. 32-36
• Proyecto ejecutivo completo
• Memoria de cálculo estructural
• CEUZ vigente
• Constancia de alineamiento

📐 CONSIDERACIONES:
- Superficie a construir determinará derechos
- Si es > 250m² requiere corresponsable
- Cumplir área libre según zonificación (Art. 77-78)
- Cajones de estacionamiento según Art. 84-86

🏛️ ALERTAS ESPECIALES:
Tu predio está en ROMA NORTE → Área de Conservación Patrimonial
Requiere dictamen de Patrimonio Cultural Urbano de SEDUVI

💰 COSTO ESTIMADO: $12,000 - $18,000
⏱️ TIEMPO: 45-60 días hábiles

¿Quieres que te detalle algún trámite específico?
```

---

## 🔧 CONFIGURACIÓN ADICIONAL

### **Variables de entorno (no cambió):**

```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=production
GOOGLE_CLIENT_ID=...
JWT_SECRET=...
```

### **Estructura de directorios actualizada:**

```
proyecto/
├── server.js                    ← ACTUALIZADO
├── data/                        ← NUEVO
│   ├── articulos_index.json    ← NUEVO
│   └── reglamento_completo.txt ← NUEVO
├── src/
│   ├── App.jsx                  ← ACTUALIZADO
│   ├── main.jsx
│   ├── index.css
│   └── components/              ← NUEVO
│       └── TramitologiaView.jsx ← NUEVO
├── package.json
└── ...otros archivos
```

---

## 📊 BENEFICIOS DE LA ACTUALIZACIÓN

### **Para Desarrolladores:**
- ✅ Respuestas técnicas precisas con citas del reglamento
- ✅ Checklist automático = menos errores
- ✅ Costos y tiempos estimados = mejor planeación

### **Para Clientes:**
- ✅ Transparencia total en trámites
- ✅ Presupuestos más precisos
- ✅ Alertas tempranas de restricciones

### **Para el Negocio:**
- ✅ Diferenciación competitiva
- ✅ Profesionalismo aumentado
- ✅ Mejor toma de decisiones

---

## 🐛 TROUBLESHOOTING

### **Error: "Base de datos del reglamento no encontrada"**

**Solución:**
```bash
# Verificar que existe el directorio data
ls -la data/
# Debe mostrar: articulos_index.json y reglamento_completo.txt

# Si no existe, crear y subir archivos
mkdir -p data
cp articulos_index.json data/
cp reglamento_completo.txt data/
```

### **Error: "Cannot read property 'articulo' of undefined"**

**Solución:**
```bash
# Verificar que el archivo JSON es válido
cat data/articulos_index.json | jq '.[0]'
# Debe mostrar un artículo completo

# Si está corrupto, reemplazar con el archivo original
```

### **El chat no responde con citas del reglamento**

**Solución:**
```bash
# Verificar que ANTHROPIC_API_KEY está configurada
echo $ANTHROPIC_API_KEY

# Revisar logs del servidor
pm2 logs seduvi-app
# O
tail -f /var/log/seduvi.log
```

---

## 📞 SOPORTE

Si tienes problemas con la actualización:

1. **Revisa los logs:** `pm2 logs` o en Railway: Deployments → View Logs
2. **Verifica archivos:** Asegúrate de que `data/articulos_index.json` existe
3. **Reinicia servidor:** `pm2 restart seduvi-app`
4. **Rollback si es necesario:** `cp server.js.backup server.js`

---

## 🚀 PRÓXIMAS FUNCIONALIDADES

Las siguientes áreas están listas para implementar:

### **Área 2: Corridas Financieras** (Próximamente)
- Calculadora de ROI y TIR
- Análisis de viabilidad
- Flujos de caja
- Escenarios de sensibilidad

### **Área 3: Mercado Inmobiliario** (Próximamente)
- Web scraping de portales inmobiliarios
- Análisis de precios por colonia
- Alertas de nuevas propiedades

### **Área 4: Indicadores de Mercado** (Próximamente)
- Precio de materiales en tiempo real
- Tipo de cambio USD/MXN
- Gráficas históricas

---

## 📄 LICENCIA

MIT - Ver LICENSE para más detalles

---

## 🎉 ¡Felicidades por actualizar a GITO 2.0!

Ahora tienes el sistema más completo de análisis de terrenos y tramitología en la CDMX.
