import React, { useState, useEffect, useRef } from 'react';

// =============================================================================
// API CLIENT
// =============================================================================

const api = {
  async get(endpoint) {
    const res = await fetch(`/api${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  async post(endpoint, data) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },
  async delete(endpoint) {
    const res = await fetch(`/api${endpoint}`, { method: 'DELETE' });
    return res.json();
  }
};

// =============================================================================
// ÁREA DE CONSERVACIÓN PATRIMONIAL (ACP)
// =============================================================================

const ACP_COLONIAS = {
  'ROMA NORTE': true, 'ROMA SUR': true, 'CONDESA': true, 'HIPODROMO': true,
  'HIPÓDROMO': true, 'HIPODROMO CONDESA': true, 'HIPÓDROMO CONDESA': true,
  'JUAREZ': true, 'JUÁREZ': true, 'CUAUHTEMOC': true, 'CUAUHTÉMOC': true,
  'SAN RAFAEL': true, 'SANTA MARIA LA RIBERA': true, 'SANTA MARÍA LA RIBERA': true,
  'CENTRO': true, 'CENTRO HISTORICO': true, 'CENTRO HISTÓRICO': true,
  'TABACALERA': true, 'GUERRERO': true, 'DEL VALLE CENTRO': true,
  'DEL VALLE NORTE': true, 'NARVARTE PONIENTE': true, 'NARVARTE ORIENTE': true,
  'NAPOLES': true, 'NÁPOLES': true, 'POLANCO': true, 'POLANCO I SECCION': true,
  'POLANCO II SECCION': true, 'POLANCO III SECCION': true, 'POLANCO IV SECCION': true,
  'POLANCO V SECCION': true, 'LOMAS DE CHAPULTEPEC': true, 'SAN MIGUEL CHAPULTEPEC': true,
  'TACUBA': true, 'TACUBAYA': true, 'COYOACAN': true, 'COYOACÁN': true,
  'DEL CARMEN': true, 'VILLA COYOACAN': true, 'VILLA COYOACÁN': true,
  'SAN ANGEL': true, 'SAN ÁNGEL': true, 'CHIMALISTAC': true
};

const ACP_INFO = {
  titulo: 'ÁREA DE CONSERVACIÓN PATRIMONIAL (ACP)',
  requisitos: [
    'Aviso de intervención, dictamen u opinión técnica de la Dirección del Patrimonio Cultural Urbano de SEDUVI',
    'Si está en Zona de Monumentos Históricos: autorización del INAH'
  ],
  criterios: {
    general: 'Cualquier intervención deberá integrarse y enriquecer el contexto urbano y patrimonial.',
    obraNueva: [
      'Respetar proporciones de macizos y vanos',
      'Materiales, colores y texturas afines al entorno',
      'Instalaciones en azotea remetidas mínimo 3.00m y ocultas'
    ]
  }
};

// =============================================================================
// PDDU CUAUHTÉMOC RESTRICTIONS
// =============================================================================

const PDDU_CUAUHTEMOC = {
  nota5: {
    colonias: ['ROMA NORTE', 'JUAREZ', 'JUÁREZ'],
    titulo: 'NOTA 5 - Restricciones Roma Norte y Juárez (HM)',
    prohibidos: [
      'Gasolinerías y estaciones de gas', 'Materiales de construcción', 'Madererías',
      'Hospitales generales', 'Escuelas primarias/secundarias', 'Talleres automotrices',
      'Verificentros', 'Hojalatería y pintura', 'Tortillerías/panaderías (producción)',
      'Carpintería y ebanistería'
    ]
  },
  nota6: {
    colonias: ['ROMA NORTE'],
    titulo: 'NOTA 6 - Restricciones Roma Norte (excepto La Romita)',
    excepcion: { nombre: 'La Romita', delimitacion: 'Av. Chapultepec, Eje 1 Pte, Durango y Morelia' },
    prohibidos: [
      'Restaurante con venta de bebidas alcohólicas', 'Restaurante-bar', 'Cantinas',
      'Bares', 'Video-bares', 'Centros nocturnos', 'Discotecas', 'Cervecerías',
      'Pulquerías', 'Salones de baile', 'Peñas'
    ]
  }
};

// =============================================================================
// NORMAS DE ORDENACIÓN COMPLETAS (PGDU/PDDU)
// =============================================================================

const NORMAS_ORDENACION = {
  1: {
    titulo: 'Coeficiente de Ocupación del Suelo (COS) y Coeficiente de Utilización del Suelo (CUS)',
    descripcion: 'Determinan la superficie máxima de desplante y construcción total permitida en un predio.',
    aplicacion: 'Aplica a TODOS los predios en cualquier zonificación.',
    formulas: [
      'COS = Superficie de Desplante / Superficie del Terreno',
      'CUS = Superficie Total Construida / Superficie del Terreno',
      'COS máximo = (100% - % Área Libre) / 100',
      'CUS máximo = COS × Número de Niveles'
    ],
    ejemplo: 'Terreno de 500m² con 20% área libre y 4 niveles: COS = 0.80, CUS = 3.20, Desplante máx = 400m², Construcción máx = 1,600m²',
    importante: 'El CUS incluye TODAS las áreas techadas: habitables, circulaciones, estacionamientos techados, cuartos de servicio, etc.'
  },
  4: {
    titulo: 'Área Libre de Construcción y Recarga de Aguas Pluviales',
    descripcion: 'Establece el porcentaje mínimo del terreno que debe permanecer sin construcción para permitir la infiltración de agua pluvial.',
    aplicacion: 'Aplica a TODOS los predios. En Áreas de Conservación Patrimonial tiene requisitos adicionales.',
    formulas: [
      'Área Libre mínima = Superficie Terreno × (% Área Libre / 100)',
      'El área libre debe ser a cielo abierto y permeable',
      'En sótanos: el área libre debe mantenerse sin construcción subterránea para permitir infiltración'
    ],
    ejemplo: 'Terreno de 500m² con 30% área libre: mínimo 150m² deben quedar sin construir.',
    importante: 'En Áreas de Conservación Patrimonial (ACP), el área libre debe contribuir a mantener la imagen urbana y puede tener restricciones adicionales de jardinería o tratamiento.'
  },
  7: {
    titulo: 'Alturas de Edificación y Restricciones en Colindancia Posterior',
    descripcion: 'Define la altura máxima permitida y las restricciones de construcción en la parte posterior del predio.',
    aplicacion: 'Aplica a TODOS los predios con construcciones de más de un nivel.',
    formulas: [
      'Altura máxima = Número de Niveles × 3.60 metros',
      'Se permite adicionar hasta 3.50m para instalaciones (tinacos, cuarto de máquinas)',
      'Restricción posterior = según tabla de niveles'
    ],
    tablaRestricciones: {
      '1-2 niveles': '3.00m de restricción posterior',
      '3 niveles': '4.00m de restricción posterior', 
      '4 niveles': '5.00m de restricción posterior',
      '5 niveles': '6.00m de restricción posterior',
      '6+ niveles': '6.00m + 1.00m por cada nivel adicional'
    },
    ejemplo: 'Edificio de 5 niveles: altura máx = 18m (+3.5m instalaciones = 21.5m total), restricción posterior = 6m',
    importante: 'En colindancia con predios de menor altura, se debe escalonar la construcción para no afectar iluminación natural.'
  },
  8: {
    titulo: 'Instalaciones Permitidas por Encima del Número de Niveles',
    descripcion: 'Regula qué construcciones pueden ubicarse por encima de la altura máxima permitida.',
    aplicacion: 'Aplica a azoteas y cubiertas de edificaciones.',
    permitido: [
      'Tinacos y equipos de bombeo (hasta 3.50m adicionales)',
      'Cuartos de máquinas y elevadores',
      'Antenas y equipos de telecomunicaciones',
      'Instalaciones de aire acondicionado',
      'Calentadores solares y paneles fotovoltaicos',
      'Áreas de tendido (techadas o descubiertas)'
    ],
    restricciones: [
      'Deben remeterse del paramento de fachada',
      'En ACP: remeterse mínimo 3.00m del alineamiento y ocultarse',
      'No pueden ser habitables',
      'Altura máxima adicional: 3.50m sobre último nivel'
    ],
    importante: 'Los roof gardens y terrazas habitables SÍ cuentan como nivel si están techados más del 50%.'
  },
  9: {
    titulo: 'Subdivisión de Predios',
    descripcion: 'Establece las condiciones para dividir un predio en dos o más lotes.',
    aplicacion: 'Aplica cuando se desea fraccionar un terreno.',
    requisitos: [
      'Lote mínimo resultante según zonificación (generalmente 90-250m²)',
      'Frente mínimo según zonificación (generalmente 6-8m)',
      'Cada lote resultante debe tener acceso a vía pública',
      'Respetar la zonificación predominante de la zona'
    ],
    ejemplo: 'En zona H-4/20: lote mínimo = 250m², frente mínimo = 8m.',
    importante: 'En Áreas de Conservación Patrimonial, la subdivisión puede estar restringida si afecta la imagen urbana.'
  },
  10: {
    titulo: 'Fusión de Predios',
    descripcion: 'Establece las condiciones para unir dos o más predios contiguos.',
    aplicacion: 'Aplica cuando se desea integrar varios lotes.',
    requisitos: [
      'Los predios deben ser colindantes',
      'El predio resultante adopta la zonificación predominante',
      'Si tienen diferentes zonificaciones, prevalece la menos intensiva'
    ],
    importante: 'La fusión no cambia automáticamente la zonificación ni permite mayor intensidad de construcción.'
  },
  11: {
    titulo: 'Cálculo del Número de Viviendas Permitidas',
    descripcion: 'Determina la cantidad máxima de unidades de vivienda que pueden construirse en un predio según su densidad.',
    aplicacion: 'Aplica a TODOS los desarrollos habitacionales.',
    formulas: [
      'Número de viviendas = Superficie del Terreno ÷ M² por vivienda (según densidad)',
      'Densidades comunes:',
      '  - 1 viv/100m² = Densidad muy baja',
      '  - 1 viv/50m² = Densidad baja (más común)',
      '  - 1 viv/33m² = Densidad media',
      '  - 1 viv/25m² = Densidad alta'
    ],
    ejemplo: 'Terreno de 400m² con densidad "1 viv c/50m²": máximo 8 viviendas permitidas.',
    importante: 'El número de viviendas es independiente del CUS. Puedes tener más m² construidos pero NO más viviendas que las permitidas por densidad.'
  },
  13: {
    titulo: 'Locales con Uso Distinto al Habitacional en Zonificación H',
    descripcion: 'Permite ciertos usos no habitacionales en planta baja de zonas habitacionales puras.',
    aplicacion: 'Aplica SOLO a zonificación H (Habitacional puro), NO a HM ni HC.',
    usosPermitidos: [
      'Comercio básico de hasta 50m² en planta baja',
      'Consultorios y oficinas de hasta 100m²',
      'Solo en vialidades principales o esquinas'
    ],
    importante: 'En HM (Habitacional Mixto) y HC (Habitacional con Comercio), los usos comerciales ya están contemplados en la zonificación.'
  },
  17: {
    titulo: 'Vía Pública y Estacionamientos Subterráneos',
    descripcion: 'Regula el uso del subsuelo de la vía pública para estacionamientos.',
    aplicacion: 'Aplica a proyectos que requieren estacionamiento bajo banqueta o arroyo vehicular.',
    requisitos: [
      'Autorización especial de SEDUVI y Autoridad del Espacio Público',
      'Estudio de factibilidad técnica',
      'No afectar infraestructura subterránea'
    ],
    importante: 'Generalmente solo se autoriza en proyectos de gran escala. Para proyectos privados es muy difícil obtener esta autorización.'
  },
  18: {
    titulo: 'Ampliación de Construcciones Existentes',
    descripcion: 'Regula las condiciones para ampliar edificaciones que ya existen.',
    aplicacion: 'Aplica a inmuebles existentes que buscan crecer.',
    condiciones: [
      'La ampliación debe respetar la zonificación vigente',
      'No puede exceder el COS ni CUS permitidos',
      'Debe cumplir con el Reglamento de Construcciones vigente',
      'En ACP: requiere dictamen de Patrimonio Cultural Urbano'
    ],
    tiposObra: {
      'Tipo A': 'Ampliación hasta 200m² sin cambio estructural - Sin DRO',
      'Tipo B': 'Ampliación >200m² o con cambio estructural - Requiere DRO',
      'Tipo C': 'Ampliación >5,000m² o >5 niveles - DRO + Corresponsables'
    },
    importante: 'Si la construcción existente no cumple con la normatividad actual, la ampliación puede requerir regularización previa.'
  },
  19: {
    titulo: 'Estudio de Impacto Urbano',
    descripcion: 'Establece cuándo es obligatorio presentar un estudio que evalúe los efectos de un proyecto en su entorno.',
    aplicacion: 'Aplica a proyectos de gran escala o alto impacto.',
    obligatorio: [
      'Proyectos >5,000m² de construcción',
      'Edificios >5 niveles de altura',
      'Proyectos en Áreas de Conservación Patrimonial mayores a cierto umbral',
      'Usos de alto impacto (hospitales, centros comerciales)',
      'Desarrollos habitacionales >50 viviendas'
    ],
    contenido: [
      'Análisis de vialidad y transporte',
      'Estudio de demanda de servicios',
      'Impacto en imagen urbana',
      'Medidas de mitigación propuestas'
    ],
    importante: 'El dictamen de impacto urbano puede condicionar o negar el proyecto si los impactos no son mitigables.'
  },
  26: {
    titulo: 'Norma para Incentivar la Producción de Vivienda Sustentable',
    descripcion: 'Otorga beneficios a proyectos que incorporan criterios de sustentabilidad.',
    aplicacion: 'Aplica a proyectos habitacionales que cumplan criterios sustentables.',
    beneficios: [
      'Incremento de hasta 35% en el número de viviendas permitidas',
      'Reducción en requerimientos de estacionamiento',
      'Posible reducción en área libre (con compensación ecológica)'
    ],
    requisitos: [
      'Sistemas de captación de agua pluvial',
      'Calentadores solares o ahorradores de energía',
      'Materiales sustentables en construcción',
      'Naturación de azoteas o áreas verdes'
    ],
    importante: 'Los beneficios varían según el nivel de sustentabilidad alcanzado. Requiere dictamen técnico específico.'
  }
};

// =============================================================================
// GET RESTRICTIONS FOR A PROPERTY
// =============================================================================

const getRestricciones = (property) => {
  const colonia = (property.colonia || '').toUpperCase();
  const alcaldia = (property.alcaldia || '').toUpperCase();
  const zonificacion = (property.uso_descri || '').toUpperCase();
  const restricciones = [];
  
  // Check ACP
  const coloniaClean = colonia.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isACP = Object.keys(ACP_COLONIAS).some(c => 
    coloniaClean.includes(c.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
  
  if (isACP) {
    restricciones.push({ tipo: 'ACP', ...ACP_INFO, aplica: true });
  }
  
  // Check Cuauhtémoc restrictions
  if (alcaldia.includes('CUAUHTEMOC') || alcaldia.includes('CUAUHTÉMOC')) {
    if (PDDU_CUAUHTEMOC.nota5.colonias.some(c => colonia.includes(c)) && zonificacion.includes('HABITACIONAL')) {
      restricciones.push({ tipo: 'NOTA 5', ...PDDU_CUAUHTEMOC.nota5, aplica: true });
    }
    if (colonia.includes('ROMA NORTE') && zonificacion.includes('HABITACIONAL')) {
      restricciones.push({ tipo: 'NOTA 6', ...PDDU_CUAUHTEMOC.nota6, aplica: true });
    }
  }
  
  return restricciones;
};

// =============================================================================
// PROPERTY CARD COMPONENT
// =============================================================================

const PropertyCard = ({ property }) => {
  const supTerreno = parseFloat(property.superficie) || 0;
  const niveles = parseInt(property.niveles) || 4;
  const areaLibre = parseFloat(property.area_libre) || 20;
  const cosMax = (100 - areaLibre) / 100;
  const cusMax = cosMax * niveles;
  const supMaxConst = supTerreno > 0 ? Math.round(supTerreno * cosMax * niveles) : '-';
  
  let densidadM2 = 50;
  if (property.densidad_d?.includes('33')) densidadM2 = 33;
  else if (property.densidad_d?.includes('100')) densidadM2 = 100;
  const numViviendas = supTerreno > 0 ? Math.floor(supTerreno / densidadM2) : '-';
  
  const cuentaMatch = property.liga_ciuda?.match(/cuentaCatastral=([^&]+)/);
  const cuentaCatastral = cuentaMatch ? cuentaMatch[1] : null;
  const restricciones = getRestricciones(property);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gob-primary to-gob-dark px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">🏛️ CDMX</span>
            <span className="text-lime-200 text-sm">Normatividad de Uso de Suelo</span>
          </div>
          <span className="text-lime-200 text-xs">{new Date().toLocaleDateString('es-MX')}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-gob-primary font-bold text-sm border-b-2 border-gob-primary pb-1 mb-2">
              Información General
            </h3>
            <div className="space-y-1.5 text-sm">
              {cuentaCatastral && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Cuenta Catastral:</span>
                  <span className="font-mono font-semibold">{cuentaCatastral}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Dirección:</span>
                <span className="font-semibold">{property.calle} {property.no_externo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Colonia:</span>
                <span className="font-semibold">{property.colonia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CP:</span>
                <span className="font-semibold">{property.codigo_pos || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alcaldía:</span>
                <span className="font-semibold">{property.alcaldia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Superficie:</span>
                <span className="font-bold text-gob-primary">{supTerreno.toLocaleString()} m²</span>
              </div>
            </div>
          </div>
          
          {/* Map Links */}
          <div className="bg-slate-100 rounded-lg p-3 flex flex-col items-center justify-center">
            <div className="text-3xl mb-2">📍</div>
            {property.latitud && property.longitud ? (
              <div className="text-xs text-slate-500 text-center space-y-2">
                <div>
                  <div>Lat: {parseFloat(property.latitud).toFixed(6)}</div>
                  <div>Lon: {parseFloat(property.longitud).toFixed(6)}</div>
                </div>
                <a 
                  href={`https://sig.cdmx.gob.mx/sig_cdmx/?x=${property.longitud}&y=${property.latitud}&zoomLevel=8`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gob-primary text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gob-dark block"
                >
                  🗺️ Ver en SIG CDMX
                </a>
                <a 
                  href={`https://www.google.com/maps?q=${property.latitud},${property.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline block"
                >
                  📍 Google Maps
                </a>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Sin coordenadas</span>
            )}
          </div>
        </div>

        {/* Zonificación */}
        <div>
          <h3 className="text-gob-primary font-bold text-sm border-b-2 border-gob-primary pb-1 mb-2">
            Zonificación
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-xs">
                  <th className="border px-2 py-1.5 text-left">Uso del Suelo</th>
                  <th className="border px-2 py-1.5 text-center">Niveles</th>
                  <th className="border px-2 py-1.5 text-center">Área Libre</th>
                  <th className="border px-2 py-1.5 text-center">COS</th>
                  <th className="border px-2 py-1.5 text-center">CUS</th>
                  <th className="border px-2 py-1.5 text-center">Densidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-2 font-semibold text-gob-primary">{property.uso_descri || 'N/A'}</td>
                  <td className="border px-2 py-2 text-center font-bold text-lg">{property.niveles || '-'}</td>
                  <td className="border px-2 py-2 text-center">{property.area_libre || '20'}%</td>
                  <td className="border px-2 py-2 text-center font-semibold">{cosMax.toFixed(2)}</td>
                  <td className="border px-2 py-2 text-center font-semibold">{cusMax.toFixed(2)}</td>
                  <td className="border px-2 py-2 text-center text-xs">{property.densidad_d || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Normas de Ordenación Aplicables - EXPANDABLE */}
        <details className="group" open>
          <summary className="text-gob-primary font-bold text-sm border-b-2 border-gob-primary pb-1 mb-2 cursor-pointer list-none flex justify-between items-center">
            📜 Normas de Ordenación Aplicables
            <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
          </summary>
          
          <div className="space-y-3 mt-3">
            {/* Norma 1 - COS y CUS */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 1: {NORMAS_ORDENACION[1].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[1].descripcion}</p>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📐 Fórmulas:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[1].formulas.map((f, i) => (
                      <li key={i} className="font-mono text-xs">{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800">💡 Ejemplo:</div>
                  <p className="text-green-700">{NORMAS_ORDENACION[1].ejemplo}</p>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[1].importante}</p>
                </div>
              </div>
            </details>

            {/* Norma 4 - Área Libre */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 4: {NORMAS_ORDENACION[4].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[4].descripcion}</p>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📐 Fórmulas:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[4].formulas.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800">💡 Ejemplo:</div>
                  <p className="text-green-700">{NORMAS_ORDENACION[4].ejemplo}</p>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[4].importante}</p>
                </div>
              </div>
            </details>

            {/* Norma 7 - Alturas */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 7: {NORMAS_ORDENACION[7].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[7].descripcion}</p>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📐 Fórmulas:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[7].formulas.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <div className="font-semibold text-purple-800 mb-1">📏 Tabla de Restricciones Posteriores:</div>
                  <div className="grid grid-cols-2 gap-1 text-purple-700">
                    {Object.entries(NORMAS_ORDENACION[7].tablaRestricciones).map(([niveles, restriccion]) => (
                      <div key={niveles} className="flex justify-between bg-white/50 px-2 py-1 rounded">
                        <span>{niveles}:</span>
                        <span className="font-semibold">{restriccion}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800">💡 Ejemplo:</div>
                  <p className="text-green-700">{NORMAS_ORDENACION[7].ejemplo}</p>
                </div>
              </div>
            </details>

            {/* Norma 8 - Instalaciones en Azotea */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 8: {NORMAS_ORDENACION[8].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[8].descripcion}</p>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800 mb-1">✓ Permitido:</div>
                  <ul className="text-green-700 space-y-0.5">
                    {NORMAS_ORDENACION[8].permitido.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <div className="font-semibold text-red-800 mb-1">⚠️ Restricciones:</div>
                  <ul className="text-red-700 space-y-0.5">
                    {NORMAS_ORDENACION[8].restricciones.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[8].importante}</p>
                </div>
              </div>
            </details>

            {/* Norma 11 - Número de Viviendas */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 11: {NORMAS_ORDENACION[11].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[11].descripcion}</p>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📐 Fórmulas:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[11].formulas.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800">💡 Ejemplo:</div>
                  <p className="text-green-700">{NORMAS_ORDENACION[11].ejemplo}</p>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[11].importante}</p>
                </div>
              </div>
            </details>

            {/* Norma 18 - Ampliaciones */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 18: {NORMAS_ORDENACION[18].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[18].descripcion}</p>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📋 Condiciones:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[18].condiciones.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <div className="font-semibold text-purple-800 mb-1">🏗️ Tipos de Obra:</div>
                  {Object.entries(NORMAS_ORDENACION[18].tiposObra).map(([tipo, desc]) => (
                    <div key={tipo} className="flex gap-2 text-purple-700 mb-1">
                      <span className="font-semibold">{tipo}:</span>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[18].importante}</p>
                </div>
              </div>
            </details>

            {/* Norma 19 - Impacto Urbano */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 19: {NORMAS_ORDENACION[19].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[19].descripcion}</p>
                <div className="bg-red-50 rounded p-2">
                  <div className="font-semibold text-red-800 mb-1">⚠️ Obligatorio cuando:</div>
                  <ul className="text-red-700 space-y-0.5">
                    {NORMAS_ORDENACION[19].obligatorio.map((o, i) => (
                      <li key={i}>• {o}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📄 Contenido del Estudio:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[19].contenido.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[19].importante}</p>
                </div>
              </div>
            </details>

            {/* Norma 26 - Vivienda Sustentable */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Norma 26: {NORMAS_ORDENACION[26].titulo}</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-slate-600">{NORMAS_ORDENACION[26].descripcion}</p>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800 mb-1">🎁 Beneficios:</div>
                  <ul className="text-green-700 space-y-0.5">
                    {NORMAS_ORDENACION[26].beneficios.map((b, i) => (
                      <li key={i}>✓ {b}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800 mb-1">📋 Requisitos:</div>
                  <ul className="text-blue-700 space-y-0.5">
                    {NORMAS_ORDENACION[26].requisitos.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <div className="font-semibold text-amber-800">⚠️ Importante:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[26].importante}</p>
                </div>
              </div>
            </details>

            {/* Other Normas Summary */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Otras Normas (9, 10, 13, 17)</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-3">
                <div className="bg-white rounded p-2 border">
                  <div className="font-semibold text-slate-800">Norma 9: {NORMAS_ORDENACION[9].titulo}</div>
                  <p className="text-slate-600 mt-1">{NORMAS_ORDENACION[9].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[9].importante}</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-semibold text-slate-800">Norma 10: {NORMAS_ORDENACION[10].titulo}</div>
                  <p className="text-slate-600 mt-1">{NORMAS_ORDENACION[10].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[10].importante}</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-semibold text-slate-800">Norma 13: {NORMAS_ORDENACION[13].titulo}</div>
                  <p className="text-slate-600 mt-1">{NORMAS_ORDENACION[13].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[13].importante}</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-semibold text-slate-800">Norma 17: {NORMAS_ORDENACION[17].titulo}</div>
                  <p className="text-slate-600 mt-1">{NORMAS_ORDENACION[17].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[17].importante}</p>
                </div>
              </div>
            </details>
          </div>
        </details>

        {/* Cálculos */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h3 className="text-blue-800 font-bold text-sm mb-2">📐 Cálculos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <div className="text-blue-600 font-bold text-lg">{Math.round(supTerreno * cosMax).toLocaleString()}</div>
              <div className="text-xs text-blue-700">m² Desplante</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-bold text-lg">{typeof supMaxConst === 'number' ? supMaxConst.toLocaleString() : supMaxConst}</div>
              <div className="text-xs text-blue-700">m² Máx. Const.</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-bold text-lg">{numViviendas}</div>
              <div className="text-xs text-blue-700">Viviendas Máx.</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-bold text-lg">{niveles * 3.6}m</div>
              <div className="text-xs text-blue-700">Altura Máx.</div>
            </div>
          </div>
        </div>

        {/* Restricciones */}
        {restricciones.length > 0 && (
          <div className="space-y-3">
            {restricciones.filter(r => r.tipo === 'ACP').map((r, i) => (
              <div key={i} className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                <h3 className="text-amber-800 font-bold text-sm mb-2">🏛️ {r.titulo}</h3>
                <div className="text-xs text-amber-700 space-y-2">
                  <div className="font-semibold">⚠️ Requisitos obligatorios:</div>
                  <ul className="space-y-1">{r.requisitos.map((req, j) => <li key={j}>• {req}</li>)}</ul>
                </div>
              </div>
            ))}
            
            {restricciones.filter(r => r.tipo !== 'ACP').map((r, i) => (
              <div key={i} className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <h3 className="text-red-800 font-bold text-sm mb-2">⚠️ {r.titulo}</h3>
                {r.excepcion && (
                  <div className="bg-green-100 border border-green-300 rounded p-2 mb-2 text-xs">
                    <span className="font-semibold text-green-800">✓ Excepción "{r.excepcion.nombre}":</span>
                    <span className="text-green-700"> {r.excepcion.delimitacion}</span>
                  </div>
                )}
                <div className="text-xs text-red-700">
                  <div className="font-semibold mb-1">Usos NO permitidos:</div>
                  <ul className="grid md:grid-cols-2 gap-1">
                    {r.prohibidos.map((uso, j) => <li key={j}>❌ {uso}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Official Links */}
        <div className="flex flex-wrap gap-2">
          {property.liga_ciuda && (
            <a href={property.liga_ciuda} target="_blank" rel="noopener noreferrer"
               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium">
              📄 CiudadMX Oficial
            </a>
          )}
          {property.latitud && property.longitud && (
            <a href={`https://sig.cdmx.gob.mx/sig_cdmx/?x=${property.longitud}&y=${property.latitud}&zoomLevel=8`}
               target="_blank" rel="noopener noreferrer"
               className="flex-1 bg-gob-primary hover:bg-gob-dark text-white text-center py-2 px-3 rounded-lg text-sm font-medium">
              🗺️ SIG CDMX Mapa
            </a>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>"VERSIÓN DE DIVULGACIÓN"</strong> - Para documento oficial, solicitar Certificado Único de Zonificación ante SEDUVI.
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

export default function App() {
  const [stats, setStats] = useState({ totalPredios: 0, alcaldias: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Clear chat when property changes
  useEffect(() => {
    setChatMessages([]);
  }, [selectedProperty?.id]);

  const loadStats = async () => {
    try {
      const data = await api.get('/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.get('/history');
      setSearchHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.results);
      loadHistory();
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      const result = await api.upload(file);
      setUploadStatus({ success: true, message: result.message });
      loadStats();
    } catch (err) {
      setUploadStatus({ success: false, message: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAlcaldia = async (alcaldia) => {
    if (!confirm(`¿Eliminar todos los datos de ${alcaldia}?`)) return;
    try {
      await api.delete(`/alcaldia/${alcaldia}`);
      loadStats();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/history');
      setSearchHistory([]);
    } catch (err) {
      console.error('Clear history failed:', err);
    }
  };

  // AI Chat - uses backend proxy
  const handleChat = async () => {
    if (!chatInput.trim() || isChatting || !selectedProperty) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);
    
    const supTerreno = parseFloat(selectedProperty.superficie) || 0;
    const niveles = parseInt(selectedProperty.niveles) || 4;
    const areaLibre = parseFloat(selectedProperty.area_libre) || 20;
    const cosMax = (100 - areaLibre) / 100;
    const restricciones = getRestricciones(selectedProperty);
    
    let restriccionesTexto = restricciones.map(r => {
      if (r.tipo === 'ACP') return `ACP: ${r.requisitos.join('. ')}`;
      return `${r.titulo}: NO permitido: ${r.prohibidos.join(', ')}`;
    }).join('\n');
    
    const systemPrompt = `Experto en desarrollo urbano CDMX. Predio: ${selectedProperty.calle} ${selectedProperty.no_externo}, ${selectedProperty.colonia}, ${selectedProperty.alcaldia}. Superficie: ${supTerreno}m², Uso: ${selectedProperty.uso_descri}, Niveles: ${niveles}, Área libre: ${areaLibre}%, COS: ${cosMax.toFixed(2)}, CUS: ${(cosMax*niveles).toFixed(2)}. ${restriccionesTexto}. Responde en español, práctico y específico.`;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          messages: chatMessages.concat([{ role: 'user', content: userMessage }])
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error}` }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gob-primary to-gob-dark px-4 py-3 shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-white font-bold">SEDUVI CDMX</h1>
              <p className="text-lime-200 text-xs">
                {stats.totalPredios > 0 
                  ? `${stats.totalPredios.toLocaleString()} predios en ${stats.alcaldias.length} alcaldía(s)`
                  : 'Sin datos cargados'}
              </p>
            </div>
          </div>
          
          {selectedProperty && (
            <button onClick={() => setSelectedProperty(null)} className="text-lime-200 hover:text-white text-sm">
              ← Volver
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {!selectedProperty ? (
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="bg-gob-primary hover:bg-gob-dark text-white px-4 py-2 rounded-lg cursor-pointer font-medium text-sm">
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" disabled={isUploading} />
                    📂 {isUploading ? 'Subiendo...' : 'Cargar CSV'}
                  </label>
                  {stats.alcaldias.length > 0 && (
                    <div className="text-sm text-slate-600">
                      ✓ {stats.alcaldias.map(a => `${a.alcaldia} (${a.records_count.toLocaleString()})`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              {uploadStatus && (
                <div className={`mt-3 p-2 rounded text-sm ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {uploadStatus.message}
                </div>
              )}

              {/* Manage loaded alcaldías */}
              {stats.alcaldias.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-slate-500 mb-2">Administrar datos:</div>
                  <div className="flex flex-wrap gap-2">
                    {stats.alcaldias.map(a => (
                      <button
                        key={a.alcaldia}
                        onClick={() => handleDeleteAlcaldia(a.alcaldia)}
                        className="text-xs px-2 py-1 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded"
                      >
                        {a.alcaldia} ✕
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search */}
            {stats.totalPredios > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar: Durango 259, Roma Norte..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-gob-primary"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-gob-primary hover:bg-gob-dark disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    {isLoading ? '...' : '🔍'}
                  </button>
                </div>
              </div>
            )}

            {/* History */}
            {searchHistory.length > 0 && searchResults.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-700">🕐 Historial</h3>
                  <button onClick={clearHistory} className="text-xs text-slate-400 hover:text-red-500">Limpiar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setSearchQuery(h.query); }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm"
                    >
                      {h.query} <span className="text-slate-400">({h.results_count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{searchResults.length} resultados</span>
                  <button onClick={() => setSearchResults([])} className="text-sm text-slate-500">✕</button>
                </div>
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                  {searchResults.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => setSelectedProperty(row)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{row.calle} {row.no_externo}</div>
                          <div className="text-sm text-slate-500">{row.colonia} • {row.uso_descri}</div>
                        </div>
                        <span className="text-gob-primary text-sm">Ver →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {stats.totalPredios === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-5xl mb-4">📂</div>
                <h2 className="text-xl font-bold mb-2">Cargar datos SEDUVI</h2>
                <p className="text-slate-500 mb-4">Sube los archivos CSV de las alcaldías</p>
                <div className="text-left max-w-md mx-auto bg-slate-50 rounded-lg p-4 text-sm">
                  <p className="font-semibold mb-2">Archivos disponibles:</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>• seduvi_benito_juarez.csv</li>
                    <li>• seduvi_cuauhtemoc.csv</li>
                    <li>• seduvi_miguel_hidalgo.csv</li>
                    <li>• ... otras alcaldías</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <PropertyCard property={selectedProperty} />
            
            {/* Chat */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b">
                <h3 className="font-semibold">💬 Consulta sobre {selectedProperty.calle} {selectedProperty.no_externo}</h3>
              </div>
              <div className="p-4">
                {chatMessages.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                          m.role === 'user' ? 'bg-gob-primary text-white' : 'bg-slate-100'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isChatting && <div className="text-slate-400 text-sm">⏳ Analizando...</div>}
                    <div ref={chatEndRef} />
                  </div>
                )}
                
                {chatMessages.length === 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['¿Puedo poner un bar?', '¿Qué permisos necesito?', '¿Cuántas viviendas puedo construir?'].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Pregunta sobre el predio..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gob-primary"
                  />
                  <button
                    onClick={handleChat}
                    disabled={isChatting || !chatInput.trim()}
                    className="bg-gob-primary hover:bg-gob-dark disabled:bg-slate-300 text-white px-4 py-2 rounded-lg"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}