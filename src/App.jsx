import React, { useState, useEffect, useRef } from 'react';
import { ReglamentoConstruccionView } from './components/ReglamentoConstruccionView';

// =============================================================================
// AUTH HELPERS
// =============================================================================

const AUTH_KEY = 'seduvi_auth_token';
const USER_KEY = 'seduvi_user';

const getStoredAuth = () => {
  const token = localStorage.getItem(AUTH_KEY);
  const user = localStorage.getItem(USER_KEY);
  if (token && user) {
    return { token, user: JSON.parse(user) };
  }
  return null;
};

const setStoredAuth = (token, user) => {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
};

// =============================================================================
// API CLIENT
// =============================================================================

const createApi = (getToken) => ({
  async get(endpoint) {
    const token = getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api${endpoint}`, { headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  async post(endpoint, data) {
    const token = getToken();
    const headers = { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  async delete(endpoint) {
    const token = getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api${endpoint}`, { method: 'DELETE', headers });
    return res.json();
  }
});

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
// PROGRAMAS PARCIALES DE DESARROLLO URBANO (PPDU)
// =============================================================================

const PROGRAMAS_PARCIALES = {
  // PPDU Nápoles - Benito Juárez (Gaceta 27 Agosto 2002)
  napoles: {
    id: 'napoles',
    nombre: 'Programa Parcial de Desarrollo Urbano Nápoles, Ampliación Nápoles, Nochebuena y Ciudad de los Deportes',
    alcaldia: 'BENITO JUAREZ',
    colonias: ['NAPOLES', 'NÁPOLES', 'AMPLIACION NAPOLES', 'AMPLIACIÓN NÁPOLES', 
               'NOCHEBUENA', 'CIUDAD DE LOS DEPORTES'],
    fechaPublicacion: '27 de agosto de 2002',
    gaceta: 'Gaceta Oficial del Distrito Federal No. 116',
    superficie: '182.8 hectáreas',
    
    // Zonificaciones del programa
    zonificaciones: {
      'H': { niveles: 3, descripcion: 'Habitacional unifamiliar', areaLibre: 'Según tabla' },
      'HC': { niveles: 6, descripcion: 'Habitacional con Comercio en planta baja', areaLibre: 'Según tabla' },
      'HO': { niveles: '3-12', descripcion: 'Habitacional con Oficinas', areaLibre: 'Según tabla' },
      'HM': { niveles: '6-11', descripcion: 'Habitacional Mixto', areaLibre: 'Según tabla' },
      'CB': { niveles: 3, descripcion: 'Centro de Barrio', areaLibre: 'Según tabla' },
      'E': { niveles: '3-11', descripcion: 'Equipamiento', areaLibre: 'Según tabla' }
    },
    
    // Restricciones generales
    restricciones: [
      'No se permite el establecimiento de más gasolineras',
      'Antenas parabólicas >3m prohibidas en zonas H (especialmente Nochebuena y Nápoles)',
      'No se permiten obras de infraestructura aéreas visibles desde vía pública',
      'Prohibida la afectación de vialidades por particulares',
      'Se prohíbe utilizar el arroyo vehicular como estacionamiento (valet parking)',
      'No se permite alteración a la traza urbana por particulares'
    ],
    
    // Normas de altura
    normasAltura: {
      titulo: 'Alturas de Edificación',
      reglas: [
        'Altura máxima: 2 veces la distancia al paramento opuesto',
        'Edificios >5 niveles: restricción posterior del 15% de la altura (mínimo 4m)',
        'Altura máxima de entrepiso para vivienda: 3.60m',
        'Techos inclinados forman parte de la altura total'
      ]
    },
    
    // Subdivisión mínima por zonificación
    subdivisionMinima: {
      'H': 250, 'HC': 250, 'HM': 750, 'HO': 750, 'CB': 250, 'E': 750
    },
    
    // Incentivos para vivienda
    incentivosVivienda: {
      titulo: 'Norma para impulsar construcción de vivienda en zona H',
      descripcion: 'Se autorizan hasta 2 niveles adicionales para proyectos de vivienda',
      condiciones: [
        'Cumplir con 20% adicional de estacionamiento sobre el Reglamento',
        'Respetar área libre según superficie del predio'
      ],
      tabla: [
        { superficie: 'Hasta 250 m²', niveles: 'Según plano', areaLibre: '30%' },
        { superficie: '250-500 m²', niveles: '4 niveles máx', areaLibre: '30%' },
        { superficie: '500-750 m²', niveles: '5 niveles máx', areaLibre: '30%' },
        { superficie: '750-1000 m²', niveles: '6 niveles máx', areaLibre: '35%' }
      ]
    },
    
    // Vialidades con requisito especial de estacionamiento (+20%)
    vialidadesEspeciales: {
      titulo: 'Incremento de 20% en estacionamiento',
      vialidades: [
        'Manzana del W.T.C. (Av. del Parque, Altadena, Chicago)',
        'Viaducto Miguel Alemán (Nueva York a Av. Insurgentes)',
        'Av. Nueva York (Dakota a Viaducto Río Becerra)',
        'Av. Dakota (Nueva York a Viaducto Río Becerra)',
        'Av. Augusto Rodin (Holbein a Viaducto Río Becerra)'
      ]
    },
    
    // Corredores urbanos principales
    corredoresUrbanos: [
      { nombre: 'Av. Insurgentes (acera poniente)', zonificacion: 'HM/11', tramo: 'Viaducto Miguel Alemán a Porfirio Díaz' },
      { nombre: 'Av. Pennsylvania', zonificacion: 'HC', tramo: 'Viaducto Río Becerra a Glorieta' },
      { nombre: 'Viaducto Miguel Alemán (acera sur)', zonificacion: 'HO', tramo: 'Av. Nueva York a Av. Insurgentes' },
      { nombre: 'Av. Patriotismo (acera oriente)', zonificacion: 'HM', tramo: 'Holbein a Viaducto' },
      { nombre: 'Eje 5 Sur San Antonio', zonificacion: 'HC', tramo: 'Av. Patriotismo a Av. Insurgentes' },
      { nombre: 'Eje 6 Sur Tintoretto-Holbein', zonificacion: 'HC', tramo: 'Av. Patriotismo a Av. Insurgentes' }
    ],
    
    // Patrimonio
    patrimonioArtistico: [
      { nombre: 'Poliforum Cultural Siqueiros', ubicacion: 'Insurgentes esq. Filadelfia', nota: 'Requiere dictamen de Dirección de Sitios Patrimoniales' }
    ],
    
    // Área libre según tamaño de lote
    areaLibrePorSuperficie: [
      { desde: 0, hasta: 500, areaLibre: 30 },
      { desde: 500, hasta: 1000, areaLibre: 35 },
      { desde: 1000, hasta: 2500, areaLibre: 40 },
      { desde: 2500, hasta: 5000, areaLibre: 45 },
      { desde: 5000, hasta: Infinity, areaLibre: 50 }
    ],
    
    // Usos prohibidos generales
    usosProhibidos: [
      'Gasolineras nuevas',
      'Centrales de abasto',
      'Rastros y frigoríficos',
      'Depósitos de combustibles',
      'Centrales de autotransporte foráneo',
      'Industria contaminante'
    ]
  },

  // PPDU Insurgentes Mixcoac - Benito Juárez (Gaceta 21 Julio 2000)
  insurgentesMixcoac: {
    id: 'insurgentes-mixcoac',
    nombre: 'Programa Parcial de Desarrollo Urbano Insurgentes Mixcoac',
    alcaldia: 'BENITO JUAREZ',
    colonias: ['INSURGENTES MIXCOAC', 'INSURGENTES-MIXCOAC'],
    fechaPublicacion: '21 de julio de 2000',
    gaceta: 'Gaceta Oficial del Distrito Federal',
    superficie: '48.91 hectáreas',
    manzanas: 37,
    lotes: 680,
    
    // Límites del polígono
    limites: {
      norte: 'Calle Empresa',
      sur: 'Av. Río Mixcoac',
      oriente: 'Av. Insurgentes Sur',
      poniente: 'Av. Revolución'
    },
    
    // Zonificaciones del programa
    zonificaciones: {
      'H': { niveles: 3, descripcion: 'Habitacional unifamiliar', areaLibre: '30%' },
      'HC': { niveles: '3-6', descripcion: 'Habitacional con Comercio en planta baja', areaLibre: '30%' },
      'HO': { niveles: '3-8', descripcion: 'Habitacional con Oficinas', areaLibre: '30%' },
      'HM': { niveles: '6-8', descripcion: 'Habitacional Mixto', areaLibre: '20-30%' },
      'E': { niveles: '3-8', descripcion: 'Equipamiento', areaLibre: 'Según proyecto' },
      'EA': { niveles: '-', descripcion: 'Espacios Abiertos', areaLibre: '100%' },
      'CP': { niveles: '3', descripcion: 'Conservación Patrimonial', areaLibre: '30%' }
    },
    
    // Restricciones generales
    restricciones: [
      'Área de Conservación Patrimonial en zona central (Plaza Jáuregui)',
      '33 inmuebles catalogados con valor patrimonial histórico y arquitectónico',
      'Modificaciones a inmuebles patrimoniales requieren autorización de Dirección de Sitios Patrimoniales',
      'No se permite demolición de inmuebles catalogados sin autorización',
      'Prohibido el cambio de uso del suelo de habitacional a comercial sin autorización',
      'Protección de la traza urbana colonial en zona central',
      'Restricción de estacionamientos en predios no autorizados'
    ],
    
    // Normas de altura
    normasAltura: {
      titulo: 'Alturas de Edificación',
      reglas: [
        'Zona H: máximo 3 niveles',
        'Zona HC: máximo 3-6 niveles según ubicación',
        'Zona HO: máximo 8 niveles en corredores principales',
        'Altura máxima: 2 veces la distancia al paramento opuesto',
        'En colindancia con inmuebles patrimoniales: altura restringida'
      ]
    },
    
    // Subdivisión mínima por zonificación
    subdivisionMinima: {
      'H': 200, 'HC': 200, 'HM': 500, 'HO': 500, 'E': 500
    },
    
    // Patrimonio - Zona de Conservación Patrimonial
    patrimonioHistorico: {
      titulo: 'Zona de Conservación Patrimonial',
      descripcion: 'El área central de la colonia posee un valioso conjunto de inmuebles con valor histórico y cultural de los siglos XVI al XX',
      elementos: [
        { nombre: 'Ex Convento de Santo Domingo de Guzmán', siglo: 'XVI (1595)', ubicacion: 'Plaza Jáuregui' },
        { nombre: 'Templo de Santo Domingo de Guzmán', siglo: 'XVI', ubicacion: 'Plaza Jáuregui' },
        { nombre: 'Capilla de Nuestra Señora del Rayo', siglo: 'XVII', ubicacion: 'Zona central' },
        { nombre: 'Casa de la Campana', siglo: 'XVIII-XIX', ubicacion: 'Calle Campana' },
        { nombre: 'Plaza Agustín Jáuregui', siglo: 'Colonial', ubicacion: 'Centro histórico' },
        { nombre: 'Fuente Art-Decó Plaza Sevilla', siglo: 'XX (1930s)', ubicacion: 'Cruce Valencia, Cádiz y Santander' },
        { nombre: 'Escuela Secundaria No. 10', siglo: 'XIX', ubicacion: 'Calle Gaya' }
      ],
      nota: 'Cualquier intervención requiere dictamen de la Dirección de Sitios Patrimoniales de SEDUVI'
    },
    
    // Zonas de diagnóstico
    zonasDiagnostico: [
      { zona: 'I', nombre: 'Centro Antiguo', descripcion: 'Núcleo histórico con Plaza Jáuregui, Universidad Panamericana y Simón Bolívar' },
      { zona: 'II', nombre: 'Río Mixcoac', descripcion: 'Frente norte de Av. Río Mixcoac, Colegio Simón Bolívar' },
      { zona: 'III', nombre: 'Av. Insurgentes', descripcion: 'Corredor comercial metropolitano' },
      { zona: 'IV', nombre: 'Interior Insurgentes', descripcion: 'Zona de transición habitacional-comercial' },
      { zona: 'V', nombre: 'Extremadura-Empresa', descripcion: 'Condominios y vivienda unifamiliar' },
      { zona: 'VI', nombre: 'Revolución-Patriotismo', descripcion: 'Área comercial, Metro Mixcoac' }
    ],
    
    // Corredores urbanos principales
    corredoresUrbanos: [
      { nombre: 'Av. Insurgentes Sur', zonificacion: 'HM/8', tramo: 'Empresa a Río Mixcoac' },
      { nombre: 'Av. Río Mixcoac', zonificacion: 'HC/6', tramo: 'Insurgentes a Patriotismo' },
      { nombre: 'Av. Patriotismo', zonificacion: 'HM/6', tramo: 'Empresa a Río Mixcoac' },
      { nombre: 'Av. Revolución', zonificacion: 'HM/6', tramo: 'Empresa a Río Mixcoac' },
      { nombre: 'Eje 7 Sur Extremadura', zonificacion: 'HC/4', tramo: 'Insurgentes a Revolución' }
    ],
    
    // Equipamiento educativo relevante
    equipamientoEducativo: [
      'Universidad Panamericana',
      'Universidad Simón Bolívar',
      'Colegio Simón Bolívar (varios niveles)',
      'Escuela Secundaria Diurna No. 10',
      'Centro Internacional de Estudios Superiores'
    ],
    
    // Área libre según tamaño de lote
    areaLibrePorSuperficie: [
      { desde: 0, hasta: 500, areaLibre: 30 },
      { desde: 500, hasta: 1000, areaLibre: 35 },
      { desde: 1000, hasta: 2500, areaLibre: 40 },
      { desde: 2500, hasta: 5000, areaLibre: 45 },
      { desde: 5000, hasta: Infinity, areaLibre: 50 }
    ],
    
    // Usos prohibidos generales
    usosProhibidos: [
      'Demolición de inmuebles patrimoniales sin autorización',
      'Estacionamientos en predios no autorizados',
      'Modificaciones a fachadas patrimoniales sin dictamen',
      'Usos incompatibles con zona habitacional en área central',
      'Comercio ambulante en vía pública',
      'Industria contaminante'
    ],
    
    // Consideraciones especiales
    consideracionesEspeciales: [
      'La zona central es la única con valor histórico y patrimonial de la Delegación Benito Juárez',
      'Población flotante elevada por actividades educativas (aprox. 10,000 personas)',
      'Zona de transición sísmica (Zona I y II divididas por Av. Patriotismo)',
      'Prioridad al uso habitacional para frenar despoblamiento',
      'Protección del patrimonio arquitectónico colonial y Art-Decó'
    ]
  },

  // PPDU Hipódromo - Cuauhtémoc (Gaceta 15 Septiembre 2000)
  hipodromo: {
    id: 'hipodromo',
    nombre: 'Programa Parcial de Desarrollo Urbano Colonia Hipódromo',
    alcaldia: 'CUAUHTEMOC',
    colonias: ['HIPODROMO', 'HIPÓDROMO'],
    fechaPublicacion: '15 de septiembre de 2000',
    gaceta: 'Gaceta Oficial del Distrito Federal No. 164',
    superficie: '110.8 hectáreas',
    poblacionResidente: '12,742 habitantes (1995)',
    poblacionFlotante: '26,500 personas (días hábiles)',
    
    // Límites del polígono
    limites: {
      este: 'Av. Insurgentes',
      noreste: 'Av. Yucatán',
      noroeste: 'Av. Álvaro Obregón',
      oeste: 'Av. Nuevo León hasta Juan Escutia y Tamaulipas hasta Benjamín Franklin',
      sur: 'Av. Benjamín Franklin hasta Av. Nuevo León',
      sureste: 'Av. Nuevo León hasta Av. Insurgentes'
    },
    
    // Zonificaciones del programa
    zonificaciones: {
      'H': { niveles: '3-15', descripcion: 'Habitacional', areaLibre: '20-22.5%' },
      'HC': { niveles: '3-6', descripcion: 'Habitacional con Comercio en planta baja', areaLibre: '20%' },
      'HO': { niveles: '3-22', descripcion: 'Habitacional con Oficinas', areaLibre: '20-50%' },
      'HM': { niveles: '6-8', descripcion: 'Habitacional Mixto', areaLibre: '20%' },
      'E': { niveles: '3-5', descripcion: 'Equipamiento', areaLibre: 'Según proyecto' },
      'EA': { niveles: '-', descripcion: 'Espacios Abiertos (Parque México)', areaLibre: '100%' }
    },
    
    // Restricciones generales
    restricciones: [
      'Toda la colonia es Área de Conservación Patrimonial',
      'Modificaciones a inmuebles requieren Vo.Bo. de la Dirección de Gestión de Patrimonio Cultural Urbano de SEDUVI',
      'Área mínima por vivienda: 90 m² (sin incluir áreas comunes)',
      'Restaurantes con venta de bebidas alcohólicas restringidos en zonas específicas',
      'Restricción de antenas parabólicas visibles desde vía pública',
      'Prohibido el uso prolongado de vía pública para estacionamiento (valet parking)',
      'Extractores de restaurantes deben cumplir normas ambientales'
    ],
    
    // Normas de altura
    normasAltura: {
      titulo: 'Alturas de Edificación',
      reglas: [
        'La altura depende del plano de zonificación secundaria',
        'Formato típico: H/15m/20% = Habitacional, 15m altura máxima, 20% área libre',
        'Altura máxima: 2 veces la distancia al paramento opuesto',
        'Edificios altos: pueden aplicar Norma 10 con restricciones laterales de 3.5m',
        'Instalaciones en azotea (tinacos, máquinas): hasta 3.50m adicionales remetidos'
      ]
    },
    
    // Subdivisión mínima por zonificación
    subdivisionMinima: {
      'H': 200, 'HC': 200, 'HM': 500, 'HO': 500, 'E': 500
    },
    
    // Los 6 distritos internos
    distritosInternos: [
      { 
        distrito: 'I', 
        nombre: 'Popocatépetl-Insurgentes', 
        descripcion: 'Traza concéntrica al Parque México. Uso predominante: comercio, servicios y oficinas intensas.',
        usoPredominante: 'Comercio/Servicios/Oficinas'
      },
      { 
        distrito: 'II', 
        nombre: 'Parque México', 
        descripcion: 'Traza concéntrica al Parque México. Uso habitacional plurifamiliar con oficinas.',
        usoPredominante: 'Habitacional plurifamiliar'
      },
      { 
        distrito: 'III', 
        nombre: 'Insurgentes-Nuevo León', 
        descripcion: 'Traza reticular. Predominan oficinas con vivienda plurifamiliar de uso intenso.',
        usoPredominante: 'Oficinas'
      },
      { 
        distrito: 'IV', 
        nombre: 'Tamaulipas-Nuevo León', 
        descripcion: 'Zona de restaurantes y cafés. Uso mixto: vivienda, oficinas y giros mercantiles.',
        usoPredominante: 'Uso mixto/Restaurantes'
      },
      { 
        distrito: 'V', 
        nombre: 'Baja California-Franklin', 
        descripcion: 'Habitacional unifamiliar con tendencia a cambio de uso a oficinas.',
        usoPredominante: 'Habitacional unifamiliar'
      },
      { 
        distrito: 'VI', 
        nombre: 'Nuevo León-Franklin', 
        descripcion: 'Zona insular por ejes viales. Habitacional unifamiliar.',
        usoPredominante: 'Habitacional unifamiliar'
      }
    ],
    
    // Corredores de alta intensidad
    corredoresUrbanos: [
      { nombre: 'Av. Insurgentes', tipo: 'Alta intensidad', descripcion: 'Importancia metropolitana. Comercio, servicios, oficinas corporativas.' },
      { nombre: 'Av. Nuevo León', tipo: 'Alta intensidad', descripcion: 'Oficinas y restaurantes. Conecta sur con Chapultepec y Reforma.' },
      { nombre: 'Eje 3 Sur Baja California', tipo: 'Alta intensidad', descripcion: 'Un sentido O-P. Comercio (fotocopiadoras) y oficinas.' },
      { nombre: 'Av. Benjamín Franklin', tipo: 'Alta intensidad', descripcion: 'Liga Periférico-Revolución con Ejes Viales.' },
      { nombre: 'Av. Tamaulipas', tipo: 'Baja intensidad', descripcion: 'Restaurantes, bares, cines (Plaza y Bella Época).' },
      { nombre: 'Av. Michoacán', tipo: 'Baja intensidad', descripcion: 'Restaurantes con terrazas. Zona gastronómica.' },
      { nombre: 'Circuito Amsterdam', tipo: 'Baja intensidad', descripcion: 'Doble sentido con camellón arbolado. Uso habitacional con restaurantes.' }
    ],
    
    // Patrimonio y espacios públicos
    patrimonioYEspacios: {
      titulo: 'Espacios Públicos y Patrimonio',
      espacios: [
        { nombre: 'Parque México (San Martín)', tipo: 'Nodo metropolitano', descripcion: 'Segundo parque más visitado después de Chapultepec (desde 1930s)' },
        { nombre: 'Parque España', tipo: 'Espacio público', descripcion: 'Área verde complementaria' },
        { nombre: 'Circuito Amsterdam', tipo: 'Camellón patrimonial', descripcion: 'Característico circuito con camellón arbolado' },
        { nombre: 'Plaza Popocatépetl', tipo: 'Glorieta', descripcion: 'Fuente de Popocatépetl' },
        { nombre: 'Glorieta Citlaltépetl', tipo: 'Glorieta', descripcion: 'Fuente de Citlaltépetl' }
      ],
      nota: 'La colonia data de 1926, diseñada por el arquitecto José Luis Cuevas. Considerada de calidad sobresaliente por su trazo y espacios públicos.'
    },
    
    // Área libre según tamaño de lote
    areaLibrePorSuperficie: [
      { desde: 0, hasta: 500, areaLibre: 20 },
      { desde: 500, hasta: 1000, areaLibre: 25 },
      { desde: 1000, hasta: 2500, areaLibre: 30 },
      { desde: 2500, hasta: 5000, areaLibre: 40 },
      { desde: 5000, hasta: Infinity, areaLibre: 50 }
    ],
    
    // Usos prohibidos y restringidos
    usosProhibidos: [
      'Industria contaminante',
      'Centrales de autotransporte',
      'Gasolineras nuevas (no más gasolineras)',
      'Comercio ambulante',
      'Valet parking que invada arroyo vehicular',
      'Antenas parabólicas >3m visibles desde vía pública'
    ],
    
    // Problemática identificada
    problematicaIdentificada: [
      'Cambio acelerado de uso del suelo (habitacional a comercial/oficinas)',
      'Déficit de estacionamiento: 12,252 cajones (oferta: 11,349 vs demanda: 24,601)',
      'Estacionamiento en doble fila por usuarios de oficinas y restaurantes',
      'Conflictos entre residentes y restauranteros por ruido y extractores',
      'Despoblamiento: de 15,065 hab (1990) a 12,742 hab (1995)',
      'Emigración de población joven (18-34 años)'
    ],
    
    // Consideraciones especiales
    consideracionesEspeciales: [
      'Toda la colonia está en Área de Conservación Patrimonial',
      'El Parque México funciona como nodo metropolitano',
      'Metro Chilpancingo y Patriotismo (Línea 9) sirven la zona',
      'Zona III del Valle de México: alta sismicidad (períodos 0.9-1.8 segundos)',
      'Prioridad: frenar y revertir el proceso de despoblamiento',
      'Arquitectura Art Decó característica de la colonia (años 1930s-1940s)'
    ]
  },

  // PPDU Colonia Cuauhtémoc - Alcaldía Cuauhtémoc (Gaceta 15 Septiembre 2000)
  coloniaCuauhtemoc: {
    id: 'coloniaCuauhtemoc',
    nombre: 'Programa Parcial de Desarrollo Urbano Colonia Cuauhtémoc',
    alcaldia: 'CUAUHTEMOC',
    colonias: ['CUAUHTEMOC', 'CUAUHTÉMOC'],
    // Excluir colonias que tienen su propio programa
    coloniasExcluidas: ['HIPODROMO', 'HIPÓDROMO', 'HIPODROMO CONDESA', 'HIPÓDROMO CONDESA', 
                        'CONDESA', 'ROMA NORTE', 'ROMA SUR', 'JUAREZ', 'JUÁREZ', 'CENTRO'],
    fechaPublicacion: '15 de septiembre de 2000',
    gaceta: 'Gaceta Oficial del Distrito Federal No. 164',
    superficie: '45.6 hectáreas aproximadamente',
    antecedentes: 'Originalmente Zona Especial de Desarrollo Controlado (Diario Oficial, 27 de enero de 1994)',
    
    // Límites del polígono
    limites: {
      norte: 'Circuito Interior (Calzada Melchor Ocampo y Av. Parque Vía)',
      este: 'Av. Sullivan hasta Av. Insurgentes Centro',
      sur: 'Paseo de la Reforma',
      oeste: 'Circuito Interior (Calzada Melchor Ocampo)'
    },
    
    // Zonificaciones del programa
    zonificaciones: {
      'H': { niveles: '3-8', descripcion: 'Habitacional', areaLibre: '20-30%' },
      'HC': { niveles: '3-6', descripcion: 'Habitacional con Comercio en planta baja', areaLibre: '20%' },
      'HO': { niveles: '6-15', descripcion: 'Habitacional con Oficinas', areaLibre: '20-40%' },
      'HM': { niveles: '6-10', descripcion: 'Habitacional Mixto', areaLibre: '20-30%' },
      'E': { niveles: '3-8', descripcion: 'Equipamiento', areaLibre: 'Según proyecto' }
    },
    
    // Restricciones generales
    restricciones: [
      'Conservación del uso habitacional como prioritario',
      'Altura máxima en Paseo de la Reforma: 2 veces el ancho de la calle',
      'Restricciones para cambio de uso del suelo habitacional a comercial/oficinas',
      'Prohibición de nuevas gasolineras',
      'Restricción de antenas parabólicas visibles desde vía pública',
      'Protección de inmuebles con valor arquitectónico e histórico'
    ],
    
    // Normas de altura
    normasAltura: {
      titulo: 'Alturas de Edificación',
      reglas: [
        'Paseo de la Reforma: altura máxima de 2 veces el ancho de la calle',
        'Interior de la colonia: según plano de zonificación secundaria',
        'Restricciones posteriores del 15% de la altura para edificios >5 niveles',
        'Techos inclinados forman parte de la altura total'
      ]
    },
    
    // Subdivisión mínima por zonificación
    subdivisionMinima: {
      'H': 200, 'HC': 200, 'HM': 500, 'HO': 500, 'E': 500
    },
    
    // Corredores urbanos principales
    corredoresUrbanos: [
      { nombre: 'Paseo de la Reforma', tipo: 'Alta intensidad', descripcion: 'Corredor financiero metropolitano. Comercio, servicios, oficinas corporativas de gran altura.' },
      { nombre: 'Av. Insurgentes', tipo: 'Alta intensidad', descripcion: 'Importancia metropolitana. Conectividad norte-sur.' },
      { nombre: 'Av. Sullivan', tipo: 'Media intensidad', descripcion: 'Comercio y servicios. Galerías de arte y comercio especializado.' },
      { nombre: 'Circuito Interior', tipo: 'Vialidad primaria', descripcion: 'Límite poniente y norte de la colonia.' }
    ],
    
    // Características urbanas
    caracteristicasUrbanas: {
      titulo: 'Características de la Colonia',
      elementos: [
        { aspecto: 'Tipo de colonia', descripcion: 'Residencial de clase media-alta con tendencia a uso mixto' },
        { aspecto: 'Época de desarrollo', descripcion: 'Primeras décadas del siglo XX (Porfiriato y post-revolución)' },
        { aspecto: 'Traza urbana', descripcion: 'Reticular con algunas calles diagonales' },
        { aspecto: 'Arquitectura', descripcion: 'Edificios de principios de siglo XX, algunos con valor histórico' },
        { aspecto: 'Vialidades internas', descripcion: 'Río Lerma, Río Pánuco, Río Nazas, Río Tiber, Río Sena' }
      ],
      nota: 'La colonia se desarrolló como zona residencial exclusiva para familias acomodadas que comenzaban a salir del centro de la ciudad.'
    },
    
    // Área libre según tamaño de lote
    areaLibrePorSuperficie: [
      { desde: 0, hasta: 500, areaLibre: 20 },
      { desde: 500, hasta: 1000, areaLibre: 25 },
      { desde: 1000, hasta: 2500, areaLibre: 30 },
      { desde: 2500, hasta: 5000, areaLibre: 35 },
      { desde: 5000, hasta: Infinity, areaLibre: 40 }
    ],
    
    // Usos prohibidos y restringidos
    usosProhibidos: [
      'Industria contaminante',
      'Centrales de autotransporte',
      'Gasolineras nuevas',
      'Bodegas de almacenamiento industrial',
      'Talleres mecánicos mayores',
      'Comercio ambulante en vía pública'
    ],
    
    // Problemática identificada
    problematicaIdentificada: [
      'Presión para cambio de uso habitacional a comercial/oficinas',
      'Incremento de tráfico vehicular en horas pico',
      'Demanda de estacionamiento por oficinas y comercios',
      'Conservación del carácter residencial frente a presiones comerciales',
      'Mantenimiento de inmuebles con valor arquitectónico'
    ],
    
    // Consideraciones especiales
    consideracionesEspeciales: [
      'Colonia con ubicación estratégica entre Paseo de la Reforma e Insurgentes',
      'Presencia de embajadas y oficinas corporativas',
      'Zona III del Valle de México: alta sismicidad',
      'Prioridad: conservación del uso habitacional',
      'Cercanía a estaciones de Metrobús (Línea 1) en Insurgentes',
      'Metro Insurgentes y Cuauhtémoc cercanos'
    ]
  }
};

// Función para obtener el programa parcial aplicable
const getProgramaParcial = (colonia, alcaldia) => {
  if (!colonia) return null;
  const coloniaUpper = colonia.toUpperCase().trim();
  const alcaldiaUpper = alcaldia?.toUpperCase().trim() || '';
  
  for (const [key, programa] of Object.entries(PROGRAMAS_PARCIALES)) {
    // Verificar si la colonia está en la lista del programa
    const coloniaMatch = programa.colonias.some(c => 
      coloniaUpper.includes(c) || c.includes(coloniaUpper)
    );
    // Verificar alcaldía si está especificada
    const alcaldiaMatch = !programa.alcaldia || alcaldiaUpper.includes(programa.alcaldia);
    
    // Verificar si la colonia está excluida (para programas que aplican a una alcaldía pero excluyen ciertas colonias)
    const coloniaExcluida = programa.coloniasExcluidas?.some(c => 
      coloniaUpper.includes(c) || c.includes(coloniaUpper)
    );
    
    if (coloniaMatch && alcaldiaMatch && !coloniaExcluida) {
      return programa;
    }
  }
    }
  }
  return null;
};

// Función para obtener el área libre según el programa parcial
const getAreaLibrePPDU = (programa, superficie) => {
  if (!programa?.areaLibrePorSuperficie || !superficie) return null;
  const sup = parseFloat(superficie);
  const rango = programa.areaLibrePorSuperficie.find(r => sup >= r.desde && sup < r.hasta);
  return rango ? rango.areaLibre : null;
};

// =============================================================================
// NORMAS DE ORDENACIÓN GENERALES COMPLETAS (28 NORMAS - GODF 8 ABR 2005)
// =============================================================================

const NORMAS_ORDENACION = {
  1: {
    titulo: 'Coeficiente de Ocupación del Suelo (COS) y Coeficiente de Utilización del Suelo (CUS)',
    descripcion: 'Determinan la superficie máxima de desplante y construcción total permitida en un predio.',
    aplicacion: 'Aplica a TODOS los predios en cualquier zonificación.',
    categoria: 'intensidad',
    formulas: [
      'COS = 1 - (% Área Libre / 100)',
      'Superficie de Desplante = COS × Superficie del Terreno',
      'CUS = COS × Número de Niveles',
      'Superficie Máxima de Construcción = CUS × Superficie del Terreno'
    ],
    ejemplo: 'Terreno de 500m² con 20% área libre y 4 niveles: COS = 0.80, CUS = 3.20, Desplante máx = 400m², Construcción máx = 1,600m²',
    excepciones: [
      'En predios <200m² con área libre ≥40%, se puede optar por 30% sin rebasar CUS',
      'Construcción bajo banqueta NO cuenta para CUS',
      'Si hay árboles a conservar, se puede ajustar el proyecto respetando el CUS'
    ],
    importante: 'El CUS incluye TODAS las áreas techadas: habitables, circulaciones, estacionamientos techados, cuartos de servicio, etc.'
  },
  2: {
    titulo: 'Terrenos con Pendiente Natural en Suelo Urbano',
    descripcion: 'Regula la construcción en terrenos con pendiente para evitar deslizamientos y afectaciones.',
    aplicacion: 'Aplica a predios con pendiente natural significativa.',
    categoria: 'restriccion',
    restricciones: [
      'Pendiente 0-15%: Construcción normal',
      'Pendiente 15-25%: Requiere estudio de mecánica de suelos',
      'Pendiente 25-45%: Restricciones especiales, dictamen geotécnico',
      'Pendiente >45%: Solo obras de contención, sin edificación'
    ],
    requisitos: [
      'Estudio de mecánica de suelos',
      'Dictamen de estabilidad de taludes',
      'Proyecto de drenaje pluvial',
      'Sistema de contención si es necesario'
    ],
    importante: 'Los cortes y rellenos deben minimizarse. No se permite modificar la topografía natural en pendientes >25%.'
  },
  3: {
    titulo: 'Fusión de 2 o más Predios cuando uno se ubica en Zonificación Habitacional',
    descripcion: 'Establece las condiciones para unir predios con diferentes zonificaciones.',
    aplicacion: 'Aplica cuando se fusionan predios y al menos uno tiene zonificación H.',
    categoria: 'procedimiento',
    reglas: [
      'Si un predio es H y otro es HM/HC: el resultante puede ser HM/HC',
      'La zonificación resultante la define el mayor % de superficie',
      'Se debe respetar la densidad más restrictiva',
      'El frente debe dar a vía pública de al menos 6m'
    ],
    importante: 'La fusión NO cambia automáticamente la zonificación. Se debe solicitar actualización a SEDUVI.'
  },
  4: {
    titulo: 'Área Libre de Construcción y Recarga de Aguas Pluviales',
    descripcion: 'Establece el porcentaje mínimo del terreno que debe permanecer sin construcción para permitir la infiltración de agua pluvial.',
    aplicacion: 'Aplica a TODOS los predios. En Áreas de Conservación Patrimonial tiene requisitos adicionales.',
    categoria: 'ambiental',
    formulas: [
      'Área Libre mínima = Superficie Terreno × (% Área Libre / 100)',
      'El área libre debe ser a cielo abierto y permeable',
      'En sótanos: el área libre debe mantenerse sin construcción subterránea para permitir infiltración'
    ],
    requisitos: [
      'Área libre debe estar al nivel de banqueta o máximo 1.50m abajo',
      'Debe ser permeable (no impermeabilizada)',
      'Pozos de absorción según SACMEX',
      'Sistema de captación pluvial recomendado'
    ],
    ejemplo: 'Terreno de 500m² con 30% área libre: mínimo 150m² deben quedar sin construir.',
    importante: 'En Áreas de Conservación Patrimonial (ACP), el área libre debe contribuir a mantener la imagen urbana.'
  },
  5: {
    titulo: 'Área Construible en Zonificación Espacios Abiertos (EA)',
    descripcion: 'Limita severamente la construcción en áreas destinadas a espacios abiertos.',
    aplicacion: 'Aplica SOLO a zonificación EA.',
    categoria: 'restriccion',
    permitido: [
      'Kioscos y elementos de mobiliario urbano',
      'Instalaciones temporales desmontables',
      'Sanitarios públicos',
      'Casetas de vigilancia (máx 20m²)'
    ],
    prohibido: [
      'Edificaciones permanentes',
      'Estacionamientos',
      'Usos comerciales permanentes',
      'Vivienda'
    ],
    importante: 'Los EA son áreas públicas protegidas. NO se permite cambio de uso de suelo.'
  },
  6: {
    titulo: 'Área Construible en Zonificación Áreas de Valor Ambiental (AV)',
    descripcion: 'Protege áreas verdes y de valor ambiental limitando la construcción.',
    aplicacion: 'Aplica SOLO a zonificación AV.',
    categoria: 'ambiental',
    permitido: [
      'Instalaciones para conservación ambiental',
      'Senderos y andadores peatonales',
      'Miradores y áreas de descanso',
      'Equipamiento para educación ambiental'
    ],
    restricciones: [
      'Máximo 5% del área puede tener construcción',
      'Altura máxima: 4m (1 nivel)',
      'Materiales permeables y naturales',
      'Sin afectación a vegetación existente'
    ],
    importante: 'Las AV son áreas protegidas. Cualquier intervención requiere autorización de SEDEMA.'
  },
  7: {
    titulo: 'Alturas de Edificación y Restricciones en Colindancia Posterior',
    descripcion: 'Define la altura máxima permitida y las restricciones de construcción en la parte posterior del predio.',
    aplicacion: 'Aplica a TODOS los predios con construcciones de más de un nivel.',
    categoria: 'altura',
    formulas: [
      'Altura máxima = Número de Niveles × 3.60 metros (uso habitacional)',
      'Altura máxima = Número de Niveles × 4.50 metros (otros usos)',
      'Se permite adicionar hasta 3.50m para instalaciones'
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
    categoria: 'altura',
    permitido: [
      'Tinacos y equipos de bombeo (hasta 3.50m adicionales)',
      'Cuartos de máquinas y elevadores',
      'Antenas y equipos de telecomunicaciones',
      'Instalaciones de aire acondicionado',
      'Calentadores solares y paneles fotovoltaicos',
      'Áreas de tendido (techadas o descubiertas)',
      'Proyectos de naturación de azoteas'
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
    categoria: 'procedimiento',
    tablaMinimos: {
      'H (Habitacional)': { loteMin: '250m²', frenteMin: '8m' },
      'HM (Hab. Mixto)': { loteMin: '200m²', frenteMin: '7m' },
      'HC (Hab. Comercio)': { loteMin: '150m²', frenteMin: '6m' },
      'CB (Centro Barrio)': { loteMin: '120m²', frenteMin: '6m' },
      'E (Equipamiento)': { loteMin: '500m²', frenteMin: '15m' }
    },
    requisitos: [
      'Cada lote resultante debe tener acceso a vía pública',
      'Respetar la zonificación predominante de la zona',
      'En predios <750m²: frente mínimo 7m',
      'En predios >750m²: frente mínimo 15m'
    ],
    importante: 'En Áreas de Conservación Patrimonial, la subdivisión puede estar restringida si afecta la imagen urbana.'
  },
  10: {
    titulo: 'Alturas Máximas en Vialidades y Restricciones Laterales',
    descripcion: 'Establece alturas máximas según el ancho de la vialidad y superficie del predio, con restricciones laterales.',
    aplicacion: 'Aplica en Áreas de Actuación con Potencial de Desarrollo y predios en vialidades principales.',
    categoria: 'altura',
    formulaAltura: 'Altura = 2 × (ancho de vialidad + remetimiento + 1.50m)',
    tablaAlturasPorSuperficie: {
      'Hasta 500m²': '5 niveles máximo',
      '501-1,000m²': '8 niveles máximo',
      '1,001-2,500m²': '12 niveles máximo',
      '2,501-5,000m²': '15 niveles máximo',
      'Más de 5,000m²': '18 niveles máximo'
    },
    restriccionesLaterales: {
      '5-8 niveles': '3.00m de separación a colindancias laterales',
      '9-12 niveles': '4.50m de separación a colindancias laterales',
      '13+ niveles': '6.00m de separación a colindancias laterales'
    },
    importante: 'Requiere dictamen de SEDUVI. NO aplica en Áreas de Conservación Patrimonial.'
  },
  11: {
    titulo: 'Cálculo del Número de Viviendas Permitidas (Densidad)',
    descripcion: 'Determina la cantidad máxima de unidades de vivienda que pueden construirse en un predio según su densidad.',
    aplicacion: 'Aplica a TODOS los desarrollos habitacionales.',
    categoria: 'intensidad',
    tablaDensidades: {
      'M (Muy Baja)': '1 vivienda por cada 100m² de terreno',
      'B (Baja)': '1 vivienda por cada 50m² de terreno',
      'MB (Media Baja)': '1 vivienda por cada 33m² de terreno',
      'A (Alta)': '1 vivienda por cada 25m² de terreno'
    },
    formulas: [
      'Número de viviendas = Superficie del Terreno ÷ M² por vivienda',
      'Siempre se redondea hacia ABAJO'
    ],
    ejemplo: 'Terreno de 400m² con densidad B (1/50m²): máximo 8 viviendas permitidas.',
    importante: 'El número de viviendas es independiente del CUS. Puedes tener más m² construidos pero NO más viviendas que las permitidas por densidad.'
  },
  12: {
    titulo: 'Sistema de Transferencia de Potencialidad del Desarrollo Urbano',
    descripcion: 'Permite transferir derechos de construcción de predios emisores (ACP) a predios receptores.',
    aplicacion: 'Aplica a inmuebles catalogados o en Áreas de Conservación Patrimonial como emisores.',
    categoria: 'incentivo',
    areasEmisoras: [
      'Inmuebles catalogados por INAH o INBA',
      'Predios en Áreas de Conservación Patrimonial',
      'Áreas de Actuación en Suelo de Conservación'
    ],
    areasReceptoras: [
      'Áreas de Actuación con Potencial de Desarrollo',
      'Áreas de Actuación con Potencial de Reciclamiento',
      'Corredores Urbanos de Alta Intensidad'
    ],
    calculo: 'Potencial transferible = (CUS permitido - CUS utilizado) × Superficie del predio emisor',
    importante: 'Requiere dictamen de SEDUVI. El predio emisor debe comprometerse a conservar el inmueble.'
  },
  13: {
    titulo: 'Locales con Uso Distinto al Habitacional en Zonificación H',
    descripcion: 'Permite regularizar y autorizar ciertos usos no habitacionales en zonas habitacionales puras.',
    aplicacion: 'Aplica SOLO a zonificación H (Habitacional puro), NO a HM ni HC.',
    categoria: 'uso',
    usosPermitidos: [
      'Comercio básico de hasta 50m² en planta baja',
      'Consultorios y oficinas de hasta 100m²',
      'Servicios de bajo impacto urbano',
      'Solo en vialidades colectoras o principales, o esquinas'
    ],
    requisitos: [
      'Certificado de Acreditación de Uso del Suelo (CAUS)',
      'Que el uso existiera antes de la normatividad vigente',
      'No causar molestias a vecinos'
    ],
    importante: 'En HM y HC los usos comerciales ya están permitidos en la zonificación base.'
  },
  14: {
    titulo: 'Usos de Suelo dentro de Conjuntos Habitacionales',
    descripcion: 'Regula los usos comerciales y de servicios permitidos dentro de conjuntos de vivienda.',
    aplicacion: 'Aplica a conjuntos habitacionales en régimen de propiedad en condominio.',
    categoria: 'uso',
    usosPermitidos: [
      'Comercio básico: tiendas de abarrotes, farmacias',
      'Servicios: lavanderías, tintorerías, papelerías',
      'Oficinas administrativas del conjunto',
      'Instalaciones deportivas y recreativas'
    ],
    restricciones: [
      'Máximo 10% del área construida total',
      'Solo en planta baja',
      'No venta de alcohol',
      'No usos de mediano o alto impacto'
    ],
    importante: 'Estos usos deben estar previstos en la escritura constitutiva del condominio.'
  },
  15: {
    titulo: 'Zonas Federales y Derechos de Vía',
    descripcion: 'Establece las restricciones de construcción cerca de zonas federales y derechos de vía.',
    aplicacion: 'Aplica a predios colindantes con ríos, ductos, vías férreas, líneas de alta tensión.',
    categoria: 'restriccion',
    restriccionesPrincipales: {
      'Ríos y cauces': '10-20m según importancia del cauce',
      'Líneas de alta tensión': '15-25m según voltaje',
      'Ductos de PEMEX': '15-50m según diámetro',
      'Vías férreas': '20m del eje de la vía',
      'Metro elevado': '10m del eje de la vía'
    },
    importante: 'Estas restricciones son federales y NO se pueden modificar. Consultar con SCT, CONAGUA o CFE según corresponda.'
  },
  16: {
    titulo: 'Predios con Dos o más Zonificaciones',
    descripcion: 'Establece cómo aplicar la normatividad cuando un predio tiene múltiples zonificaciones.',
    aplicacion: 'Aplica cuando el plano de zonificación divide un predio en dos o más zonas.',
    categoria: 'procedimiento',
    reglas: [
      'Si una zonificación es AV o EA: esa porción debe respetarse integramente',
      'Para el resto: puede optarse por la zonificación predominante (>50%)',
      'Si ninguna supera 50%: se aplica la más restrictiva',
      'Se requiere dictamen de SEDUVI para confirmar'
    ],
    importante: 'NO se pueden promediar las zonificaciones. Cada porción debe cumplir su normatividad o se aplica la más restrictiva.'
  },
  17: {
    titulo: 'Vía Pública y Estacionamientos Subterráneos',
    descripcion: 'Regula el uso del subsuelo de la vía pública para estacionamientos y el uso de banquetas.',
    aplicacion: 'Aplica a proyectos que requieren estacionamiento bajo vía pública.',
    categoria: 'procedimiento',
    requisitos: [
      'Autorización especial de SEDUVI y Autoridad del Espacio Público',
      'Estudio de factibilidad técnica y de interferencias',
      'No afectar infraestructura subterránea (agua, drenaje, gas, electricidad)',
      'Callejones cerrados: mínimo 4m de sección libre'
    ],
    importante: 'Generalmente solo se autoriza en proyectos de gran escala. Para proyectos privados es muy difícil obtener esta autorización.'
  },
  18: {
    titulo: 'Ampliación de Construcciones Existentes',
    descripcion: 'Regula las condiciones para ampliar edificaciones que ya existen.',
    aplicacion: 'Aplica a inmuebles existentes que buscan crecer.',
    categoria: 'procedimiento',
    condiciones: [
      'La ampliación debe respetar la zonificación vigente',
      'No puede exceder el COS ni CUS permitidos',
      'Debe cumplir con el Reglamento de Construcciones vigente',
      'En ACP: requiere dictamen de Patrimonio Cultural Urbano'
    ],
    tiposObra: {
      'Menor': 'Hasta 200m² sin cambio estructural - Aviso',
      'Mayor': 'Mayor a 200m² o con cambio estructural - Licencia con DRO',
      'Especial': 'Mayor a 5,000m² o >5 niveles - Licencia con DRO y Corresponsables'
    },
    importante: 'Si la construcción existente no cumple con la normatividad actual, la ampliación puede requerir regularización previa.'
  },
  19: {
    titulo: 'Estudio de Impacto Urbano',
    descripcion: 'Establece cuándo es obligatorio presentar un estudio que evalúe los efectos de un proyecto en su entorno.',
    aplicacion: 'Aplica a proyectos de gran escala o alto impacto.',
    categoria: 'procedimiento',
    obligatorio: [
      'Proyectos >5,000m² de construcción',
      'Edificios >5 niveles de altura (en ciertas zonas)',
      'Desarrollos habitacionales >50 viviendas',
      'Centros comerciales >2,500m²',
      'Hospitales y clínicas >500m²',
      'Proyectos donde aplique Norma 10'
    ],
    contenido: [
      'Análisis de vialidad y transporte',
      'Estudio de demanda de servicios (agua, drenaje, energía)',
      'Impacto en imagen urbana',
      'Análisis social y de entorno',
      'Medidas de mitigación propuestas'
    ],
    importante: 'El dictamen de impacto urbano puede condicionar o negar el proyecto si los impactos no son mitigables.'
  },
  20: {
    titulo: 'Suelo de Conservación',
    descripcion: 'Establece las restricciones para construcción en suelo de conservación.',
    aplicacion: 'Aplica a predios ubicados fuera del suelo urbano.',
    categoria: 'restriccion',
    zonificaciones: {
      'PE (Preservación Ecológica)': 'NO se permite construcción',
      'RE (Rescate Ecológico)': 'Solo obras de restauración ambiental',
      'PRA (Producción Rural Agroindustrial)': 'Construcciones agrícolas, máx 1 nivel'
    },
    permitido: [
      'Vivienda rural unifamiliar (máx 90m²)',
      'Instalaciones agropecuarias',
      'Ecoturismo de bajo impacto',
      'Equipamiento rural básico'
    ],
    importante: 'El suelo de conservación NO puede urbanizarse. Cualquier construcción requiere autorización de SEDEMA y SEDUVI.'
  },
  21: {
    titulo: 'Barrancas',
    descripcion: 'Protege las barrancas como elementos naturales regulando construcciones cercanas.',
    aplicacion: 'Aplica a predios colindantes o dentro de barrancas.',
    categoria: 'ambiental',
    restricciones: [
      '10m de restricción desde el borde de la barranca',
      'En barrancas mayores: restricción proporcional a la profundidad',
      'Prohibida cualquier construcción dentro de la barranca',
      'No se permite modificar cauces ni escurrimientos'
    ],
    importante: 'Las barrancas son Áreas de Valor Ambiental protegidas. Violarlas es delito ambiental.'
  },
  22: {
    titulo: 'Altura Máxima y Área Libre en Zonificaciones E, CB e I',
    descripcion: 'Establece parámetros específicos para Equipamiento, Centro de Barrio e Industria.',
    aplicacion: 'Aplica a zonificaciones E, CB e I.',
    categoria: 'intensidad',
    parametros: {
      'E (Equipamiento)': { areaLibre: '20%', alturaMax: 'Según vialidad y entorno' },
      'CB (Centro de Barrio)': { areaLibre: '20%', alturaMax: '4 niveles generalmente' },
      'I (Industria)': { areaLibre: '20%', alturaMax: '3 niveles, 15m máximo' }
    },
    importante: 'En CB se permiten usos mixtos. En E depende del tipo de equipamiento específico.'
  },
  26: {
    titulo: 'Norma para Incentivar la Producción de Vivienda Sustentable, de Interés Social y Popular',
    descripcion: 'Otorga beneficios a proyectos de vivienda social que incorporan criterios de sustentabilidad.',
    aplicacion: 'Aplica a proyectos de vivienda de interés social y popular.',
    categoria: 'incentivo',
    territorios: {
      'Territorio 1 (Dentro Circuito Interior)': 'Zonificación directa H 5/20, incremento +1 nivel',
      'Territorio 2 (Circuito Interior a Periférico)': 'Zonificación directa H 6/20, incremento +2 niveles',
      'Territorio 3 (Periférico a límite urbano)': 'Zonificación directa H 4/20, incremento +1 nivel'
    },
    categoriasVivienda: {
      'A (Interés Social)': 'Precio máximo: 15 VSMA',
      'B (Interés Popular)': 'Precio máximo: 20-25 VSMA',
      'C (Sustentable)': 'Precio máximo: 25-30 VSMA'
    },
    criteriosSustentabilidad: [
      'Sistemas de captación de agua pluvial',
      'Calentadores solares o ahorradores de energía',
      'Materiales sustentables en construcción',
      'Naturación de azoteas o áreas verdes'
    ],
    noAplica: [
      'Áreas de Conservación Patrimonial del Territorio 1 y 2',
      'Suelo de Conservación',
      'Zonas de alto riesgo',
      'Predios sin acceso a vía pública >6m'
    ],
    importante: 'ACTUALMENTE SUSPENDIDA en ciertas zonas. Verificar vigencia con SEDUVI antes de aplicar.'
  },
  27: {
    titulo: 'Requerimientos para Captación de Aguas Pluviales y Descarga de Aguas Residuales',
    descripcion: 'Establece obligaciones de manejo de agua en nuevas construcciones.',
    aplicacion: 'Aplica a construcciones nuevas y ampliaciones mayores.',
    categoria: 'ambiental',
    requisitos: [
      'Sistema de captación de agua pluvial (obligatorio >500m² construidos)',
      'Separación de aguas pluviales y residuales',
      'Pozos de absorción según normatividad SACMEX',
      'Tratamiento de aguas residuales (según escala del proyecto)'
    ],
    capacidades: {
      'Cisternas': 'Mínimo 3 días de consumo',
      'Pozos de absorción': '1 pozo por cada 150m² de desplante',
      'Captación pluvial': 'Mínimo 80% del área de azotea'
    },
    importante: 'Estos sistemas deben incluirse en el proyecto de instalaciones y requieren visto bueno de SACMEX.'
  },
  28: {
    titulo: 'Zonas y Usos de Riesgo',
    descripcion: 'Identifica zonas de riesgo y establece restricciones especiales.',
    aplicacion: 'Aplica a predios en zonas identificadas como de riesgo.',
    categoria: 'restriccion',
    tiposRiesgo: {
      'Geológico': 'Minas, cavernas, grietas, hundimientos',
      'Hidrometeorológico': 'Inundaciones, deslaves',
      'Químico-Tecnológico': 'Cercanía a industrias peligrosas, ductos',
      'Sísmico': 'Zonas de alta amplificación (lago)'
    },
    restricciones: [
      'Prohibición total de construcción en riesgo alto',
      'Estudios especiales en riesgo medio',
      'Medidas de mitigación obligatorias',
      'Dictamen de Protección Civil'
    ],
    importante: 'Los mapas de riesgo son públicos. Verificar SIEMPRE antes de comprar o construir en un predio.'
  }
};

// =============================================================================
// NORMAS PARTICULARES POR ZONA/COLONIA
// =============================================================================

const NORMAS_PARTICULARES = {
  areasConservacionPatrimonial: {
    titulo: 'Normas para Áreas de Conservación Patrimonial',
    descripcion: 'Restricciones adicionales aplicables a las 135 ACP de la CDMX.',
    aplicacion: 'Colonias declaradas como Área de Conservación Patrimonial.',
    restricciones: [
      'Altura máxima según contexto predominante (generalmente 3-4 niveles)',
      'Porcentaje de área libre mayor al estándar',
      'Prohibición de demolición total sin autorización',
      'Materiales y acabados compatibles con el entorno',
      'Anuncios y publicidad restringidos',
      'Prohibición de cambios en fachada sin dictamen'
    ],
    requisitosObra: [
      'Dictamen de la Dirección de Patrimonio Cultural Urbano de SEDUVI',
      'Si hay monumentos: autorización de INAH o INBA',
      'Fotografías del estado actual',
      'Proyecto de integración al contexto'
    ],
    beneficios: [
      'Acceso al Sistema de Transferencia de Potencialidad (como emisor)',
      'Posibles beneficios fiscales por conservación',
      'Programas de apoyo para restauración'
    ]
  },
  corredoresUrbanos: {
    titulo: 'Normas en Corredores Urbanos',
    descripcion: 'Parámetros especiales para predios con frente a vialidades principales.',
    tipos: {
      'Alta Intensidad': {
        vialidades: ['Insurgentes', 'Reforma', 'Universidad', 'Tlalpan'],
        caracteristicas: [
          'Permite zonificación HM, HC, CB o E',
          'Altura según Norma 10 (hasta 15-20 niveles)',
          'Usos comerciales y de servicios permitidos',
          'Mayor CUS que zonas interiores'
        ]
      },
      'Media Intensidad': {
        vialidades: ['División del Norte', 'Coyoacán', 'Revolución'],
        caracteristicas: [
          'Generalmente HM o HC',
          'Altura 5-8 niveles',
          'Comercio y servicios de mediano impacto'
        ]
      },
      'Baja Intensidad': {
        vialidades: ['Vialidades secundarias y colectoras'],
        caracteristicas: [
          'Zonificación H o HM',
          'Altura 3-5 niveles',
          'Solo comercio de bajo impacto'
        ]
      }
    }
  },
  centrosDeBarrio: {
    titulo: 'Normas para Centros de Barrio (CB)',
    descripcion: 'Parámetros para zonas comerciales de escala barrial.',
    usos: [
      'Comercio al menudeo',
      'Servicios básicos (salud, educación, gobierno)',
      'Restaurantes y cafeterías',
      'Oficinas y consultorios',
      'Talleres de bajo impacto'
    ],
    restricciones: [
      'Generalmente 3-5 niveles',
      '20% de área libre',
      'Estacionamiento obligatorio según m²',
      'No industria ni usos de alto impacto'
    ]
  }
};

// Función para obtener normas aplicables a un predio
const getNormasAplicables = (property) => {
  const normasAplicables = [];
  const zonificacion = (property.uso_descri || '').toUpperCase();
  const colonia = (property.colonia || '').toUpperCase();
  const superficie = parseFloat(property.superficie) || 0;
  const niveles = parseInt(property.niveles) || 0;
  
  // Norma 1 - SIEMPRE aplica
  normasAplicables.push({ numero: 1, ...NORMAS_ORDENACION[1], aplicaMotivo: 'Aplica a todos los predios para cálculo de COS y CUS' });
  
  // Norma 4 - SIEMPRE aplica
  normasAplicables.push({ numero: 4, ...NORMAS_ORDENACION[4], aplicaMotivo: 'Aplica a todos los predios para área libre y recarga' });
  
  // Norma 7 - Si tiene más de 1 nivel
  if (niveles > 1) {
    normasAplicables.push({ numero: 7, ...NORMAS_ORDENACION[7], aplicaMotivo: `Aplica por tener ${niveles} niveles permitidos` });
  }
  
  // Norma 8 - SIEMPRE aplica para instalaciones
  normasAplicables.push({ numero: 8, ...NORMAS_ORDENACION[8], aplicaMotivo: 'Aplica para instalaciones en azotea' });
  
  // Norma 9 - Si el terreno es grande
  if (superficie > 500) {
    normasAplicables.push({ numero: 9, ...NORMAS_ORDENACION[9], aplicaMotivo: 'Aplica si se desea subdividir el predio' });
  }
  
  // Norma 10 - Si tiene potencial de altura
  if (niveles >= 5 || superficie > 1000) {
    normasAplicables.push({ numero: 10, ...NORMAS_ORDENACION[10], aplicaMotivo: 'Posible aplicación para mayor altura (requiere dictamen SEDUVI)' });
  }
  
  // Norma 11 - Si es habitacional
  if (zonificacion.includes('HABITACIONAL') || zonificacion.includes('H ') || zonificacion.includes('HM') || zonificacion.includes('HC')) {
    normasAplicables.push({ numero: 11, ...NORMAS_ORDENACION[11], aplicaMotivo: 'Aplica para calcular número de viviendas según densidad' });
  }
  
  // Norma 13 - Si es H puro
  if (zonificacion.includes('HABITACIONAL') && !zonificacion.includes('MIXTO') && !zonificacion.includes('COMERCIO')) {
    normasAplicables.push({ numero: 13, ...NORMAS_ORDENACION[13], aplicaMotivo: 'Aplica en zonificación H para usos comerciales limitados' });
  }
  
  // Norma 18 - SIEMPRE relevante
  normasAplicables.push({ numero: 18, ...NORMAS_ORDENACION[18], aplicaMotivo: 'Aplica si se desea ampliar construcción existente' });
  
  // Norma 19 - Si el proyecto es grande
  if (superficie > 1000 || niveles > 5) {
    normasAplicables.push({ numero: 19, ...NORMAS_ORDENACION[19], aplicaMotivo: 'Posible requerimiento de Estudio de Impacto Urbano' });
  }
  
  // Norma 26 - Si es zona habitacional
  if (zonificacion.includes('HABITACIONAL') || zonificacion.includes('H ')) {
    normasAplicables.push({ numero: 26, ...NORMAS_ORDENACION[26], aplicaMotivo: 'Posibles beneficios para vivienda social (verificar vigencia)' });
  }
  
  // Norma 27 - Si el proyecto es significativo
  if (superficie > 250) {
    normasAplicables.push({ numero: 27, ...NORMAS_ORDENACION[27], aplicaMotivo: 'Aplica para sistemas de captación pluvial' });
  }
  
  return normasAplicables;
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
  
  // Check Benito Juárez - Nápoles PPDU
  if (alcaldia.includes('BENITO JUAREZ') || alcaldia.includes('BENITO JUÁREZ')) {
    const isNapolesZone = PDDU_NAPOLES.colonias.some(c => 
      coloniaClean.includes(c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
    );
    
    if (isNapolesZone) {
      restricciones.push({ 
        tipo: 'PPDU_NAPOLES', 
        titulo: PDDU_NAPOLES.restriccionesGenerales.titulo,
        prohibidos: PDDU_NAPOLES.restriccionesGenerales.prohibidos,
        requisitos: PDDU_NAPOLES.restriccionesGenerales.requisitos,
        programa: PDDU_NAPOLES.nombre,
        fecha: PDDU_NAPOLES.fecha,
        aplica: true 
      });
    }
  }
  
  return restricciones;
};

// =============================================================================
// PROPERTY CARD COMPONENT
// =============================================================================

const PropertyCard = ({ property, chatMessages, chatInput, setChatInput, handleChat, isChatting, chatEndRef, user, isBookmarked, toggleBookmark, shareViaWhatsApp, copyShareLink }) => {
  const supTerreno = parseFloat(property.superficie) || 0;
  const niveles = parseInt(property.niveles) || 4;
  const areaLibre = parseFloat(property.area_libre) || 20;
  const cosMax = (100 - areaLibre) / 100;
  const cusMax = cosMax * niveles;
  const supMaxConst = supTerreno > 0 ? Math.round(supTerreno * cosMax * niveles) : '-';
  
  let densidadM2 = 50;
  if (property.densidad_d?.includes('33')) densidadM2 = 33;
  else if (property.densidad_d?.includes('100')) densidadM2 = 100;
  const numViviendas = supTerreno > 0 ? Math.round(supTerreno / densidadM2) : '-';
  
  const cuentaMatch = property.liga_ciuda?.match(/cuentaCatastral=([^&]+)/);
  const cuentaCatastral = cuentaMatch ? cuentaMatch[1] : null;
  const restricciones = getRestricciones(property);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gob-primary to-gob-dark px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">📋</span>
            <span className="text-white font-semibold">Normatividad de Uso de Suelo</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Share Buttons */}
            <button
              onClick={shareViaWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
              title="Compartir por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button
              onClick={copyShareLink}
              className="bg-slate-500 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
              title="Copiar enlace"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Bookmark Button */}
            {user && (
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${isBookmarked ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                title={isBookmarked ? 'Quitar de guardados' : 'Guardar'}
              >
                <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
          </div>
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
                <div className="flex flex-col gap-2 w-full">
                  <a 
                    href={`https://www.google.com/maps?q=${property.latitud},${property.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gob-primary text-white px-3 py-2 rounded text-xs font-medium hover:bg-gob-dark flex items-center justify-center gap-1"
                  >
                    <span>🗺️</span> Google Maps
                  </a>
                  <a 
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.latitud},${property.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-amber-600 flex items-center justify-center gap-1"
                  >
                    <span>👁️</span> Street View
                  </a>
                  {/* MAPAS OFICIALES CDMX */}
                  <div className="border-t border-slate-300 pt-2 mt-1">
                    <div className="text-xs text-slate-500 text-center mb-1">Mapas Oficiales CDMX:</div>
                    <a 
                      href={cuentaCatastral ? `http://ciudadmx.cdmx.gob.mx:8080/seduvi/?cuentaCatastral=${cuentaCatastral}` : `http://ciudadmx.cdmx.gob.mx:8080/seduvi/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-purple-700 flex items-center justify-center gap-1 mb-1"
                    >
                      <span>🏛️</span> SEDUVI CiudadMX
                    </a>
                    <a 
                      href="https://sig.cdmx.gob.mx/sig_cdmx/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-teal-700 flex items-center justify-center gap-1 mb-1"
                    >
                      <span>📊</span> SIG CDMX (Nuevo)
                    </a>
                    <a 
                      href="https://ovica.finanzas.cdmx.gob.mx/Mapa.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-rose-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-rose-700 flex items-center justify-center gap-1"
                    >
                      <span>🏠</span> Catastro OVICA
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Sin coordenadas</span>
            )}}
          </div>
        </div>

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

        {/* Chat - Expandable */}
        <details className="group bg-slate-50 rounded-lg overflow-hidden">
          <summary className="bg-slate-100 px-4 py-3 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between items-center hover:bg-slate-200 transition-colors">
            <span>💬 Consulta sobre este predio</span>
            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-4">
            {chatMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-gob-primary text-white' : 'bg-white border'
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
                  <button key={q} onClick={() => setChatInput(q)} className="text-xs px-3 py-1.5 bg-white hover:bg-slate-100 rounded-full border">
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
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gob-primary bg-white"
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
        </details>

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

        {/* Programa Parcial de Desarrollo Urbano Aplicable */}
        {(() => {
          const programaParcial = getProgramaParcial(property.colonia, property.alcaldia);
          if (!programaParcial) return null;
          
          const areaLibrePPDU = getAreaLibrePPDU(programaParcial, property.superficie);
          
          return (
            <details className="group bg-purple-50 rounded-lg overflow-hidden border border-purple-200" open>
              <summary className="bg-purple-100 px-4 py-3 cursor-pointer font-semibold text-sm text-purple-800 flex justify-between items-center hover:bg-purple-200 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Programa Parcial Aplicable: {programaParcial.nombre.split(' ').slice(0, 6).join(' ')}...
                </span>
                <span className="text-purple-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              
              <div className="p-4 space-y-4">
                {/* Encabezado del programa */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <h4 className="font-bold text-purple-900 text-sm mb-2">{programaParcial.nombre}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-purple-600">📅 Publicación:</span> <span className="font-medium">{programaParcial.fechaPublicacion}</span></div>
                    <div><span className="text-purple-600">📰 Gaceta:</span> <span className="font-medium">{programaParcial.gaceta}</span></div>
                    <div><span className="text-purple-600">🏛️ Alcaldía:</span> <span className="font-medium">{programaParcial.alcaldia}</span></div>
                    <div><span className="text-purple-600">📐 Superficie:</span> <span className="font-medium">{programaParcial.superficie}</span></div>
                  </div>
                </div>

                {/* Área libre según PPDU */}
                {areaLibrePPDU && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h5 className="font-semibold text-green-800 text-sm mb-1 flex items-center gap-1">
                      <span>🌳</span> Área Libre según PPDU
                    </h5>
                    <p className="text-green-700 text-sm">
                      Para un predio de <strong>{parseFloat(property.superficie).toLocaleString()} m²</strong>, 
                      el área libre mínima es <strong>{areaLibrePPDU}%</strong> según este programa parcial.
                    </p>
                  </div>
                )}

                {/* ========== NUEVA SECCIÓN: CÁLCULO SEGÚN PROGRAMA PARCIAL ========== */}
                {(() => {
                  // Calcular valores según el Programa Parcial
                  const superficieNum = parseFloat(property.superficie) || 0;
                  const nivelesNum = parseInt(property.niveles) || 0;
                  const areaLibreNormal = parseFloat(property.area_libre) || 20;
                  const areaLibrePP = areaLibrePPDU || areaLibreNormal;
                  
                  // COS y CUS normales (Programa Delegacional)
                  const cosNormal = (100 - areaLibreNormal) / 100;
                  const cusNormal = cosNormal * nivelesNum;
                  const desplanteNormal = superficieNum * cosNormal;
                  const construccionNormal = superficieNum * cusNormal;
                  
                  // COS y CUS según Programa Parcial
                  const cosPP = (100 - areaLibrePP) / 100;
                  const cusPP = cosPP * nivelesNum;
                  const desplantePP = superficieNum * cosPP;
                  const construccionPP = superficieNum * cusPP;
                  
                  // Calcular beneficios de incentivos de vivienda si aplican
                  let nivelesIncentivo = null;
                  let areaLibreIncentivo = null;
                  let construccionIncentivo = null;
                  
                  if (programaParcial.incentivosVivienda?.tabla) {
                    const rangoIncentivo = programaParcial.incentivosVivienda.tabla.find(r => {
                      const rango = r.superficie;
                      if (rango.includes('Hasta')) {
                        const max = parseFloat(rango.replace(/[^\d]/g, ''));
                        return superficieNum <= max;
                      } else if (rango.includes('-')) {
                        const [min, max] = rango.split('-').map(s => parseFloat(s.replace(/[^\d]/g, '')));
                        return superficieNum > min && superficieNum <= max;
                      }
                      return false;
                    });
                    
                    if (rangoIncentivo) {
                      const nivelesStr = rangoIncentivo.niveles;
                      if (nivelesStr && !nivelesStr.includes('Según')) {
                        nivelesIncentivo = parseInt(nivelesStr.replace(/[^\d]/g, ''));
                        areaLibreIncentivo = parseFloat(rangoIncentivo.areaLibre.replace('%', ''));
                        const cosIncentivo = (100 - areaLibreIncentivo) / 100;
                        const cusIncentivo = cosIncentivo * nivelesIncentivo;
                        construccionIncentivo = superficieNum * cusIncentivo;
                      }
                    }
                  }
                  
                  // Diferencia entre normal y PP
                  const diferenciaDesplante = desplantePP - desplanteNormal;
                  const diferenciaConstruccion = construccionPP - construccionNormal;
                  
                  return (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300 shadow-sm">
                      <h5 className="font-bold text-green-800 text-sm mb-3 flex items-center gap-2">
                        <span className="text-xl">📊</span> CÁLCULO SEGÚN PROGRAMA PARCIAL
                      </h5>
                      
                      {/* Tabla comparativa */}
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-xs border-2 border-green-400 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-green-600 text-white">
                              <th className="border border-green-500 px-2 py-2 text-left">Concepto</th>
                              <th className="border border-green-500 px-2 py-2 text-center">Prog. Delegacional</th>
                              <th className="border border-green-500 px-2 py-2 text-center bg-green-700">Prog. Parcial</th>
                              {nivelesIncentivo && (
                                <th className="border border-green-500 px-2 py-2 text-center bg-emerald-600">Con Incentivo Vivienda</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr>
                              <td className="border border-green-300 px-2 py-1.5 font-medium text-green-800">Área Libre</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center">{areaLibreNormal}%</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-green-700 bg-green-50">{areaLibrePP}%</td>
                              {nivelesIncentivo && (
                                <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50">{areaLibreIncentivo}%</td>
                              )}
                            </tr>
                            <tr>
                              <td className="border border-green-300 px-2 py-1.5 font-medium text-green-800">COS (Coef. Ocupación)</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center">{cosNormal.toFixed(2)}</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-green-700 bg-green-50">{cosPP.toFixed(2)}</td>
                              {nivelesIncentivo && (
                                <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50">{((100 - areaLibreIncentivo) / 100).toFixed(2)}</td>
                              )}
                            </tr>
                            <tr>
                              <td className="border border-green-300 px-2 py-1.5 font-medium text-green-800">Niveles</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center">{nivelesNum}</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-green-700 bg-green-50">{nivelesNum}</td>
                              {nivelesIncentivo && (
                                <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50">{nivelesIncentivo} (+{nivelesIncentivo - nivelesNum})</td>
                              )}
                            </tr>
                            <tr>
                              <td className="border border-green-300 px-2 py-1.5 font-medium text-green-800">CUS (Coef. Utilización)</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center">{cusNormal.toFixed(2)}</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-green-700 bg-green-50">{cusPP.toFixed(2)}</td>
                              {nivelesIncentivo && (
                                <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50">{(((100 - areaLibreIncentivo) / 100) * nivelesIncentivo).toFixed(2)}</td>
                              )}
                            </tr>
                            <tr className="bg-yellow-50">
                              <td className="border border-green-300 px-2 py-1.5 font-medium text-green-800">Desplante Máximo</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center">{desplanteNormal.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</td>
                              <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-green-700 bg-green-100">{desplantePP.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</td>
                              {nivelesIncentivo && (
                                <td className="border border-green-300 px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-100">{(superficieNum * ((100 - areaLibreIncentivo) / 100)).toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</td>
                              )}
                            </tr>
                            <tr className="bg-green-100">
                              <td className="border border-green-300 px-2 py-2 font-bold text-green-800">🏗️ CONSTRUCCIÓN MÁXIMA</td>
                              <td className="border border-green-300 px-2 py-2 text-center text-lg">{construccionNormal.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</td>
                              <td className="border border-green-300 px-2 py-2 text-center text-lg font-bold text-green-700 bg-green-200">{construccionPP.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</td>
                              {nivelesIncentivo && (
                                <td className="border border-green-300 px-2 py-2 text-center text-lg font-bold text-emerald-700 bg-emerald-200">{construccionIncentivo.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</td>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Resumen de diferencias */}
                      {(diferenciaDesplante !== 0 || nivelesIncentivo) && (
                        <div className="bg-white rounded-lg p-3 border border-green-300">
                          <h6 className="font-semibold text-green-800 text-xs mb-2">✨ DIFERENCIA CON PROGRAMA PARCIAL:</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {diferenciaDesplante !== 0 && (
                              <div className={`rounded p-2 ${diferenciaDesplante > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className="font-medium">Desplante:</span> {diferenciaDesplante > 0 ? '+' : ''}{diferenciaDesplante.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²
                              </div>
                            )}
                            {diferenciaConstruccion !== 0 && (
                              <div className={`rounded p-2 ${diferenciaConstruccion > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className="font-medium">Construcción:</span> {diferenciaConstruccion > 0 ? '+' : ''}{diferenciaConstruccion.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²
                              </div>
                            )}
                          </div>
                          {nivelesIncentivo && construccionIncentivo && (
                            <div className="mt-2 bg-emerald-100 rounded p-2 text-emerald-800 text-xs">
                              <span className="font-bold">🏠 CON INCENTIVO DE VIVIENDA:</span> Puedes construir hasta <strong>{construccionIncentivo.toLocaleString('es-MX', {maximumFractionDigits: 2})} m²</strong> 
                              {' '}({((construccionIncentivo - construccionNormal) / construccionNormal * 100).toFixed(1)}% más que con el programa delegacional)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ========== NUEVA SECCIÓN: BENEFICIOS DEL PROGRAMA PARCIAL ========== */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-2 border-amber-300 shadow-sm">
                  <h5 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
                    <span className="text-xl">🎁</span> BENEFICIOS DEL PROGRAMA PARCIAL
                  </h5>
                  
                  <div className="space-y-2">
                    {/* Beneficio: Incentivos de vivienda */}
                    {programaParcial.incentivosVivienda && (
                      <div className="bg-white rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                        <span className="text-2xl">🏠</span>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-800 text-sm">{programaParcial.incentivosVivienda.titulo}</div>
                          <p className="text-xs text-amber-700">{programaParcial.incentivosVivienda.descripcion}</p>
                          <div className="mt-1 text-xs text-amber-600">
                            <strong>Condiciones:</strong> {programaParcial.incentivosVivienda.condiciones.join(' • ')}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Beneficio: Sistema de Transferencia de Potencialidades */}
                    {(programaParcial.id === 'hipodromo' || programaParcial.id === 'insurgentes_mixcoac') && (
                      <div className="bg-white rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                        <span className="text-2xl">🔄</span>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-800 text-sm">Sistema de Transferencia de Potencialidades</div>
                          <p className="text-xs text-amber-700">Los predios con zonificación H y altura de 15m pueden ser receptores de transferencia de potencialidades, permitiendo incremento de niveles adicionales.</p>
                          <div className="mt-1 text-xs bg-amber-100 rounded p-1 text-amber-800">
                            <strong>Nota:</strong> Requiere resolución de SEDUVI y pago de derechos correspondientes.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Beneficio: Área libre escalonada */}
                    {programaParcial.areaLibrePorSuperficie && (
                      <div className="bg-white rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                        <span className="text-2xl">📐</span>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-800 text-sm">Área Libre Escalonada por Superficie</div>
                          <p className="text-xs text-amber-700">El programa parcial establece áreas libres diferenciadas según el tamaño del predio:</p>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                            {programaParcial.areaLibrePorSuperficie.map((r, i) => (
                              <div key={i} className="bg-amber-50 rounded px-2 py-1 text-center border border-amber-200">
                                <div className="text-amber-600">{r.desde === 0 ? '0' : r.desde.toLocaleString()}-{r.hasta === Infinity ? '∞' : r.hasta.toLocaleString()} m²</div>
                                <div className="font-bold text-amber-800">{r.areaLibre}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Beneficio: Corredores urbanos */}
                    {programaParcial.corredoresUrbanos && (
                      <div className="bg-white rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                        <span className="text-2xl">🛤️</span>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-800 text-sm">Corredores Urbanos con Normatividad Especial</div>
                          <p className="text-xs text-amber-700 mb-2">Vialidades con zonificación diferenciada que permite mayor intensidad de uso:</p>
                          <div className="space-y-1">
                            {programaParcial.corredoresUrbanos.slice(0, 4).map((c, i) => (
                              <div key={i} className="text-xs flex items-center gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${c.tipo.includes('Alta') ? 'bg-red-500' : 'bg-blue-500'}`}>
                                  {c.tipo}
                                </span>
                                <span className="font-medium text-amber-800">{c.nombre}</span>
                              </div>
                            ))}
                            {programaParcial.corredoresUrbanos.length > 4 && (
                              <div className="text-xs text-amber-600 italic">...y {programaParcial.corredoresUrbanos.length - 4} corredores más</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Beneficio: Área de conservación patrimonial */}
                    {programaParcial.restricciones?.some(r => r.toLowerCase().includes('patrimoni') || r.toLowerCase().includes('conservación')) && (
                      <div className="bg-white rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                        <span className="text-2xl">🏛️</span>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-800 text-sm">Zona de Conservación Patrimonial</div>
                          <p className="text-xs text-amber-700">Este predio se encuentra en Área de Conservación Patrimonial, lo que puede otorgar beneficios fiscales y acceso al Sistema de Transferencia de Potencialidades como predio emisor.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Restricciones */}
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <h5 className="font-semibold text-red-800 text-sm mb-2 flex items-center gap-1">
                    <span>🚫</span> Restricciones del Programa Parcial
                  </h5>
                  <ul className="text-xs text-red-700 space-y-1">
                    {programaParcial.restricciones.map((r, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-red-500">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Normas de altura */}
                {programaParcial.normasAltura && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h5 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-1">
                      <span>📏</span> {programaParcial.normasAltura.titulo}
                    </h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {programaParcial.normasAltura.reglas.map((r, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-500">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Incentivos para vivienda */}
                {programaParcial.incentivosVivienda && (
                  <details className="bg-emerald-50 rounded-lg overflow-hidden border border-emerald-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-emerald-800 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>🏠</span> {programaParcial.incentivosVivienda.titulo}
                      </span>
                      <span className="text-emerald-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-emerald-200">
                      <p className="text-xs text-emerald-700 mb-2">{programaParcial.incentivosVivienda.descripcion}</p>
                      <div className="text-xs text-emerald-700 mb-2">
                        <strong>Condiciones:</strong>
                        <ul className="ml-3 mt-1">
                          {programaParcial.incentivosVivienda.condiciones.map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                      <table className="w-full text-xs border border-emerald-300">
                        <thead>
                          <tr className="bg-emerald-100">
                            <th className="border border-emerald-300 px-2 py-1">Superficie</th>
                            <th className="border border-emerald-300 px-2 py-1">Niveles Máx.</th>
                            <th className="border border-emerald-300 px-2 py-1">Área Libre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programaParcial.incentivosVivienda.tabla.map((row, i) => (
                            <tr key={i}>
                              <td className="border border-emerald-300 px-2 py-1">{row.superficie}</td>
                              <td className="border border-emerald-300 px-2 py-1 text-center font-medium">{row.niveles}</td>
                              <td className="border border-emerald-300 px-2 py-1 text-center">{row.areaLibre}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}

                {/* Subdivisión mínima */}
                {programaParcial.subdivisionMinima && (
                  <details className="bg-amber-50 rounded-lg overflow-hidden border border-amber-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-amber-800 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>✂️</span> Subdivisión Mínima de Predios
                      </span>
                      <span className="text-amber-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-amber-200">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                        {Object.entries(programaParcial.subdivisionMinima).map(([zona, min]) => (
                          <div key={zona} className="bg-white rounded p-2 text-center border border-amber-200">
                            <div className="font-bold text-amber-800">{zona}</div>
                            <div className="text-amber-600">{min} m²</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {/* Vialidades con requisito especial */}
                {programaParcial.vialidadesEspeciales && (
                  <details className="bg-orange-50 rounded-lg overflow-hidden border border-orange-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-orange-800 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>🚗</span> {programaParcial.vialidadesEspeciales.titulo}
                      </span>
                      <span className="text-orange-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-orange-200">
                      <ul className="text-xs text-orange-700 space-y-1">
                        {programaParcial.vialidadesEspeciales.vialidades.map((v, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-orange-500">•</span> {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}

                {/* Corredores Urbanos */}
                {programaParcial.corredoresUrbanos && programaParcial.corredoresUrbanos.length > 0 && (
                  <details className="bg-indigo-50 rounded-lg overflow-hidden border border-indigo-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-indigo-800 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>🛣️</span> Corredores Urbanos
                      </span>
                      <span className="text-indigo-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-indigo-200 overflow-x-auto">
                      <table className="w-full text-xs border border-indigo-200">
                        <thead>
                          <tr className="bg-indigo-100">
                            <th className="border border-indigo-200 px-2 py-1 text-left">Vialidad</th>
                            <th className="border border-indigo-200 px-2 py-1 text-center">Zonificación</th>
                            <th className="border border-indigo-200 px-2 py-1 text-left">Tramo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programaParcial.corredoresUrbanos.map((c, i) => (
                            <tr key={i}>
                              <td className="border border-indigo-200 px-2 py-1 font-medium">{c.nombre}</td>
                              <td className="border border-indigo-200 px-2 py-1 text-center font-bold text-indigo-700">{c.zonificacion}</td>
                              <td className="border border-indigo-200 px-2 py-1 text-indigo-600">{c.tramo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}

                {/* Usos Prohibidos */}
                {programaParcial.usosProhibidos && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h5 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
                      <span>⛔</span> Usos Prohibidos en la Zona
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {programaParcial.usosProhibidos.map((u, i) => (
                        <span key={i} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patrimonio Histórico (específico para Insurgentes Mixcoac) */}
                {programaParcial.patrimonioHistorico && (
                  <details className="bg-amber-50 rounded-lg overflow-hidden border border-amber-300">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-amber-900 flex justify-between items-center bg-amber-100">
                      <span className="flex items-center gap-1">
                        <span>🏛️</span> {programaParcial.patrimonioHistorico.titulo}
                      </span>
                      <span className="text-amber-600">▼</span>
                    </summary>
                    <div className="p-3 border-t border-amber-200 space-y-3">
                      <p className="text-xs text-amber-800">{programaParcial.patrimonioHistorico.descripcion}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-amber-200">
                          <thead>
                            <tr className="bg-amber-100">
                              <th className="border border-amber-200 px-2 py-1 text-left">Elemento Patrimonial</th>
                              <th className="border border-amber-200 px-2 py-1 text-center">Siglo</th>
                              <th className="border border-amber-200 px-2 py-1 text-left">Ubicación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programaParcial.patrimonioHistorico.elementos.map((e, i) => (
                              <tr key={i}>
                                <td className="border border-amber-200 px-2 py-1 font-medium">{e.nombre}</td>
                                <td className="border border-amber-200 px-2 py-1 text-center text-amber-700">{e.siglo}</td>
                                <td className="border border-amber-200 px-2 py-1 text-amber-600">{e.ubicacion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {programaParcial.patrimonioHistorico.nota && (
                        <div className="bg-amber-100 rounded p-2 text-xs text-amber-800">
                          <strong>⚠️ Nota:</strong> {programaParcial.patrimonioHistorico.nota}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Zonas de Diagnóstico */}
                {programaParcial.zonasDiagnostico && (
                  <details className="bg-cyan-50 rounded-lg overflow-hidden border border-cyan-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-cyan-800 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>🗺️</span> Zonas del Programa Parcial
                      </span>
                      <span className="text-cyan-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-cyan-200">
                      <div className="space-y-2">
                        {programaParcial.zonasDiagnostico.map((z, i) => (
                          <div key={i} className="bg-white rounded p-2 border border-cyan-200">
                            <div className="flex items-center gap-2">
                              <span className="bg-cyan-600 text-white text-xs font-bold px-2 py-0.5 rounded">Zona {z.zona}</span>
                              <span className="font-semibold text-sm text-cyan-800">{z.nombre}</span>
                            </div>
                            <p className="text-xs text-cyan-600 mt-1">{z.descripcion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {/* Equipamiento Educativo */}
                {programaParcial.equipamientoEducativo && (
                  <details className="bg-violet-50 rounded-lg overflow-hidden border border-violet-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-violet-800 flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>🎓</span> Equipamiento Educativo Principal
                      </span>
                      <span className="text-violet-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-violet-200">
                      <ul className="text-xs text-violet-700 space-y-1">
                        {programaParcial.equipamientoEducativo.map((e, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-violet-500">🏫</span> {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}

                {/* Consideraciones Especiales */}
                {programaParcial.consideracionesEspeciales && (
                  <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
                    <h5 className="font-semibold text-rose-800 text-sm mb-2 flex items-center gap-1">
                      <span>📌</span> Consideraciones Especiales
                    </h5>
                    <ul className="text-xs text-rose-700 space-y-1">
                      {programaParcial.consideracionesEspeciales.map((c, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-rose-500">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Distritos Internos (específico para Hipódromo) */}
                {programaParcial.distritosInternos && (
                  <details className="bg-teal-50 rounded-lg overflow-hidden border border-teal-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-teal-800 flex justify-between items-center bg-teal-100">
                      <span className="flex items-center gap-1">
                        <span>🏘️</span> Distritos de la Colonia ({programaParcial.distritosInternos.length} zonas)
                      </span>
                      <span className="text-teal-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-teal-200 space-y-2">
                      {programaParcial.distritosInternos.map((d, i) => (
                        <div key={i} className="bg-white rounded p-2 border border-teal-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded">Distrito {d.distrito}</span>
                            <span className="font-semibold text-sm text-teal-800">{d.nombre}</span>
                            <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded">{d.usoPredominante}</span>
                          </div>
                          <p className="text-xs text-teal-600 mt-1">{d.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Patrimonio y Espacios Públicos (específico para Hipódromo) */}
                {programaParcial.patrimonioYEspacios && (
                  <details className="bg-emerald-50 rounded-lg overflow-hidden border border-emerald-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-emerald-800 flex justify-between items-center bg-emerald-100">
                      <span className="flex items-center gap-1">
                        <span>🌳</span> {programaParcial.patrimonioYEspacios.titulo}
                      </span>
                      <span className="text-emerald-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-emerald-200 space-y-2">
                      {programaParcial.patrimonioYEspacios.espacios.map((e, i) => (
                        <div key={i} className="bg-white rounded p-2 border border-emerald-200 flex items-start gap-2">
                          <span className="text-lg">{e.tipo === 'Nodo metropolitano' ? '⭐' : '🌲'}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-emerald-800">{e.nombre}</span>
                              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded">{e.tipo}</span>
                            </div>
                            <p className="text-xs text-emerald-600 mt-1">{e.descripcion}</p>
                          </div>
                        </div>
                      ))}
                      {programaParcial.patrimonioYEspacios.nota && (
                        <div className="bg-emerald-100 rounded p-2 text-xs text-emerald-800">
                          <strong>📜 Historia:</strong> {programaParcial.patrimonioYEspacios.nota}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Problemática Identificada (específico para Hipódromo) */}
                {programaParcial.problematicaIdentificada && (
                  <details className="bg-orange-50 rounded-lg overflow-hidden border border-orange-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-orange-800 flex justify-between items-center bg-orange-100">
                      <span className="flex items-center gap-1">
                        <span>⚠️</span> Problemática Identificada
                      </span>
                      <span className="text-orange-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-orange-200">
                      <ul className="text-xs text-orange-700 space-y-1">
                        {programaParcial.problematicaIdentificada.map((p, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-orange-500">⚡</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}

                {/* Características Urbanas (específico para Colonia Cuauhtémoc) */}
                {programaParcial.caracteristicasUrbanas && (
                  <details className="bg-sky-50 rounded-lg overflow-hidden border border-sky-200">
                    <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-sky-800 flex justify-between items-center bg-sky-100">
                      <span className="flex items-center gap-1">
                        <span>🏛️</span> {programaParcial.caracteristicasUrbanas.titulo}
                      </span>
                      <span className="text-sky-500">▼</span>
                    </summary>
                    <div className="p-3 border-t border-sky-200 space-y-2">
                      {programaParcial.caracteristicasUrbanas.elementos.map((e, i) => (
                        <div key={i} className="bg-white rounded p-2 border border-sky-200 flex items-start gap-2">
                          <span className="bg-sky-600 text-white text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">{e.aspecto}</span>
                          <p className="text-xs text-sky-700 flex-1">{e.descripcion}</p>
                        </div>
                      ))}
                      {programaParcial.caracteristicasUrbanas.nota && (
                        <div className="bg-sky-100 rounded p-2 text-xs text-sky-800">
                          <strong>📜 Historia:</strong> {programaParcial.caracteristicasUrbanas.nota}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Antecedentes del Programa (para Colonia Cuauhtémoc) */}
                {programaParcial.antecedentes && (
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <h5 className="font-semibold text-indigo-800 text-sm mb-1 flex items-center gap-1">
                      <span>📋</span> Antecedentes
                    </h5>
                    <p className="text-xs text-indigo-700">{programaParcial.antecedentes}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })()}

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
            <details className="bg-emerald-50 rounded-lg overflow-hidden border border-emerald-200">
              <summary className="bg-emerald-100 px-3 py-2 cursor-pointer font-semibold text-sm text-emerald-700 flex justify-between">
                <span>🏠 Norma 26: {NORMAS_ORDENACION[26].titulo}</span>
                <span className="text-emerald-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-2">
                <p className="text-emerald-600">{NORMAS_ORDENACION[26].descripcion}</p>
                
                {/* Territorios */}
                {NORMAS_ORDENACION[26].territorios && (
                  <div className="bg-white rounded p-2 border border-emerald-200">
                    <div className="font-semibold text-emerald-800 mb-1">🗺️ Territorios:</div>
                    <div className="space-y-1">
                      {Object.entries(NORMAS_ORDENACION[26].territorios).map(([territorio, detalle]) => (
                        <div key={territorio} className="text-emerald-700 text-xs bg-emerald-50 p-1 rounded">
                          <strong>{territorio}:</strong> {detalle}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Categorías de Vivienda */}
                {NORMAS_ORDENACION[26].categoriasVivienda && (
                  <div className="bg-blue-50 rounded p-2 border border-blue-200">
                    <div className="font-semibold text-blue-800 mb-1">🏘️ Categorías de Vivienda:</div>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(NORMAS_ORDENACION[26].categoriasVivienda).map(([cat, precio]) => (
                        <div key={cat} className="text-blue-700 text-xs flex justify-between">
                          <span className="font-medium">{cat}:</span>
                          <span>{precio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Criterios de Sustentabilidad */}
                {NORMAS_ORDENACION[26].criteriosSustentabilidad && (
                  <div className="bg-green-50 rounded p-2">
                    <div className="font-semibold text-green-800 mb-1">🌿 Criterios de Sustentabilidad:</div>
                    <ul className="text-green-700 space-y-0.5">
                      {NORMAS_ORDENACION[26].criteriosSustentabilidad.map((c, i) => (
                        <li key={i}>✓ {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Donde NO Aplica */}
                {NORMAS_ORDENACION[26].noAplica && (
                  <div className="bg-red-50 rounded p-2">
                    <div className="font-semibold text-red-800 mb-1">⛔ NO Aplica en:</div>
                    <ul className="text-red-700 space-y-0.5">
                      {NORMAS_ORDENACION[26].noAplica.map((n, i) => (
                        <li key={i}>• {n}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-amber-50 rounded p-2 border-2 border-amber-300">
                  <div className="font-semibold text-amber-800">⚠️ IMPORTANTE:</div>
                  <p className="text-amber-700">{NORMAS_ORDENACION[26].importante}</p>
                </div>
              </div>
            </details>

            {/* Other Normas Summary */}
            <details className="bg-slate-50 rounded-lg overflow-hidden">
              <summary className="bg-slate-100 px-3 py-2 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between">
                <span>Otras Normas (9, 10, 12, 13, 17, 20, 21, 27, 28)</span>
                <span className="text-slate-400">▼</span>
              </summary>
              <div className="p-3 text-xs space-y-3">
                <div className="bg-white rounded p-2 border">
                  <div className="font-semibold text-slate-800">Norma 9: {NORMAS_ORDENACION[9].titulo}</div>
                  <p className="text-slate-600 mt-1">{NORMAS_ORDENACION[9].descripcion}</p>
                  {NORMAS_ORDENACION[9].tablaMinimos && (
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                      {Object.entries(NORMAS_ORDENACION[9].tablaMinimos).slice(0, 4).map(([zona, vals]) => (
                        <div key={zona} className="bg-slate-100 p-1 rounded">
                          <span className="font-medium">{zona}:</span> {vals.loteMin}, frente {vals.frenteMin}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <div className="font-semibold text-blue-800">Norma 10: {NORMAS_ORDENACION[10].titulo}</div>
                  <p className="text-blue-600 mt-1">{NORMAS_ORDENACION[10].descripcion}</p>
                  {NORMAS_ORDENACION[10].tablaAlturasPorSuperficie && (
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                      {Object.entries(NORMAS_ORDENACION[10].tablaAlturasPorSuperficie).slice(0, 4).map(([sup, niveles]) => (
                        <div key={sup} className="bg-white p-1 rounded">
                          <span className="font-medium">{sup}:</span> {niveles}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[10].importante}</p>
                </div>
                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <div className="font-semibold text-green-800">Norma 12: {NORMAS_ORDENACION[12].titulo}</div>
                  <p className="text-green-600 mt-1">{NORMAS_ORDENACION[12].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[12].importante}</p>
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
                <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                  <div className="font-semibold text-yellow-800">Norma 20: {NORMAS_ORDENACION[20].titulo}</div>
                  <p className="text-yellow-600 mt-1">{NORMAS_ORDENACION[20].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[20].importante}</p>
                </div>
                <div className="bg-orange-50 rounded p-2 border border-orange-200">
                  <div className="font-semibold text-orange-800">Norma 21: {NORMAS_ORDENACION[21].titulo}</div>
                  <p className="text-orange-600 mt-1">{NORMAS_ORDENACION[21].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[21].importante}</p>
                </div>
                <div className="bg-cyan-50 rounded p-2 border border-cyan-200">
                  <div className="font-semibold text-cyan-800">Norma 27: {NORMAS_ORDENACION[27].titulo}</div>
                  <p className="text-cyan-600 mt-1">{NORMAS_ORDENACION[27].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[27].importante}</p>
                </div>
                <div className="bg-red-50 rounded p-2 border border-red-200">
                  <div className="font-semibold text-red-800">Norma 28: {NORMAS_ORDENACION[28].titulo}</div>
                  <p className="text-red-600 mt-1">{NORMAS_ORDENACION[28].descripcion}</p>
                  <p className="text-amber-700 mt-1 italic">{NORMAS_ORDENACION[28].importante}</p>
                </div>
              </div>
            </details>

            {/* Índice de Normas - Referencia Rápida */}
            <details className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg overflow-hidden border border-slate-300">
              <summary className="px-3 py-2 cursor-pointer font-semibold text-sm text-slate-800 flex justify-between bg-slate-200">
                <span>📑 ÍNDICE COMPLETO: 28 Normas de Ordenación</span>
                <span className="text-slate-500">▼</span>
              </summary>
              <div className="p-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(NORMAS_ORDENACION).map(([num, norma]) => (
                    <div key={num} className={`p-2 rounded border ${
                      norma.categoria === 'intensidad' ? 'bg-blue-50 border-blue-200' :
                      norma.categoria === 'altura' ? 'bg-purple-50 border-purple-200' :
                      norma.categoria === 'restriccion' ? 'bg-red-50 border-red-200' :
                      norma.categoria === 'ambiental' ? 'bg-green-50 border-green-200' :
                      norma.categoria === 'procedimiento' ? 'bg-gray-50 border-gray-200' :
                      norma.categoria === 'uso' ? 'bg-orange-50 border-orange-200' :
                      norma.categoria === 'incentivo' ? 'bg-emerald-50 border-emerald-200' :
                      'bg-white border-slate-200'
                    }`}>
                      <span className="font-bold">N°{num}:</span> {norma.titulo.slice(0, 50)}{norma.titulo.length > 50 ? '...' : ''}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">🔵 Intensidad</span>
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">🟣 Altura</span>
                  <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">🔴 Restricción</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">🟢 Ambiental</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">⚪ Procedimiento</span>
                  <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">🟠 Uso</span>
                  <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800">💚 Incentivo</span>
                </div>
              </div>
            </details>
          </div>
        </details>

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
            
            {/* PPDU Nápoles restrictions */}
            {restricciones.filter(r => r.tipo === 'PPDU_NAPOLES').map((r, i) => (
              <div key={i} className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <h3 className="text-purple-800 font-bold text-sm mb-2">📋 {r.titulo}</h3>
                <p className="text-xs text-purple-600 mb-2">{r.programa} ({r.fecha})</p>
                
                {r.prohibidos && r.prohibidos.length > 0 && (
                  <div className="text-xs text-red-700 mb-3">
                    <div className="font-semibold mb-1">🚫 Prohibiciones:</div>
                    <ul className="space-y-1">
                      {r.prohibidos.map((p, j) => <li key={j}>❌ {p}</li>)}
                    </ul>
                  </div>
                )}
                
                {r.requisitos && r.requisitos.length > 0 && (
                  <div className="text-xs text-purple-700">
                    <div className="font-semibold mb-1">📌 Requisitos por zonificación:</div>
                    <ul className="space-y-1">
                      {r.requisitos.map((req, j) => <li key={j}>• {req}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            
            {/* Other restrictions (Nota 5, Nota 6) */}
            {restricciones.filter(r => r.tipo !== 'ACP' && r.tipo !== 'PPDU_NAPOLES').map((r, i) => (
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
            <>
              <a href={`https://www.google.com/maps?q=${property.latitud},${property.longitud}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex-1 bg-gob-primary hover:bg-gob-dark text-white text-center py-2 px-3 rounded-lg text-sm font-medium">
                🗺️ Google Maps
              </a>
              <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.latitud},${property.longitud}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium">
                👁️ Street View
              </a>
            </>
          )}
        </div>

        {/* MAPAS OFICIALES CDMX - Sección Prominente */}
        <details className="group bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg overflow-hidden border-2 border-purple-200" open>
          <summary className="bg-gradient-to-r from-purple-100 to-teal-100 px-4 py-3 cursor-pointer font-semibold text-sm text-purple-800 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              Mapas Oficiales de Catastro y Uso de Suelo CDMX
            </span>
            <span className="text-purple-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-4 space-y-3">
            <p className="text-xs text-purple-700 mb-3">
              Consulta la información oficial del predio en los sistemas gubernamentales de la CDMX:
            </p>
            
            {/* Sistema Principal - SEDUVI CiudadMX */}
            <a 
              href={cuentaCatastral 
                ? `http://ciudadmx.cdmx.gob.mx:8080/seduvi/?cuentaCatastral=${cuentaCatastral}`
                : `http://ciudadmx.cdmx.gob.mx:8080/seduvi/`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏛️</span>
                <div>
                  <div className="font-bold">SEDUVI CiudadMX</div>
                  <div className="text-xs text-purple-200">Sistema de Información Geográfica de Uso de Suelo</div>
                  {cuentaCatastral && (
                    <div className="text-xs mt-1 bg-purple-500 px-2 py-0.5 rounded inline-block">
                      Cuenta: {cuentaCatastral}
                    </div>
                  )}
                </div>
              </div>
            </a>
            
            {/* SIG CDMX Nuevo */}
            <a 
              href="https://sig.cdmx.gob.mx/sig_cdmx/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-bold">SIG CDMX (Sistema Nuevo)</div>
                  <div className="text-xs text-teal-200">Sistema Abierto de Información Geográfica con 60+ capas</div>
                </div>
              </div>
            </a>
            
            {/* OVICA Catastro */}
            <a 
              href="https://ovica.finanzas.cdmx.gob.mx/Mapa.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-bold">OVICA - Oficina Virtual del Catastro</div>
                  <div className="text-xs text-rose-200">Consulta fichas catastrales y valores de predios</div>
                </div>
              </div>
            </a>
            
            {/* Datos Abiertos */}
            <a 
              href="https://sig.cdmx.gob.mx/datos/descarga"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <div className="font-bold">Datos Abiertos CDMX</div>
                  <div className="text-xs text-slate-300">Descarga shapefiles y CSV de catastro y uso de suelo</div>
                </div>
              </div>
            </a>
            
            {/* Certificado Digital */}
            <a 
              href="https://www.seduvi.cdmx.gob.mx/servicios/servicio/certificado_digital"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📜</span>
                <div>
                  <div className="font-bold">Tramitar CUZUS Digital</div>
                  <div className="text-xs text-amber-200">Certificado Único de Zonificación de Uso de Suelo ($2,025 MXN)</div>
                </div>
              </div>
            </a>
            
            <div className="bg-white/50 rounded-lg p-3 text-xs text-purple-700 border border-purple-200">
              <strong>💡 Tip:</strong> El SIG CiudadMX es la fuente oficial de SEDUVI para consultar uso de suelo. 
              Si necesitas un documento legal, debes tramitar el Certificado Único de Zonificación (CUZUS).
            </div>
          </div>
        </details>

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

// Google Client ID
// Google Client ID - set in .env file as VITE_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const [stats, setStats] = useState({ totalPredios: 0, alcaldias: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewMode, setViewMode] = useState('search'); // 'search', 'bookmarks', or 'reglamento'
  const chatEndRef = useRef(null);

  // Create API instance with current token
  const api = createApi(() => authToken);

  // Load Google Sign-In script
  useEffect(() => {
    // Check for stored auth
    const stored = getStoredAuth();
    if (stored) {
      setAuthToken(stored.token);
      setUser(stored.user);
    }

    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize Google Sign-In when loaded
  useEffect(() => {
    if (googleLoaded && window.google && !user && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }, [googleLoaded, user]);

  const handleGoogleLogin = async (response) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        setStoredAuth(data.token, data.user);
        loadHistory(); // Reload history for this user
      } else {
        console.error('Login failed:', data.error);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    clearStoredAuth();
    setSearchHistory([]);
    setBookmarks([]);
    setViewMode('search');
  };

  const googleButtonRef = useRef(null);
  
  // Render Google Sign-In button when ready
  useEffect(() => {
    if (googleLoaded && window.google && !user && googleButtonRef.current && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        { 
          theme: 'outline', 
          size: 'medium',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left'
        }
      );
    }
  }, [googleLoaded, user]);

  // Load initial data
  useEffect(() => {
    loadStats();
    checkUrlForPredio();
  }, []);

  // Load history and bookmarks when auth changes
  useEffect(() => {
    loadHistory();
    if (authToken) {
      loadBookmarks();
    }
  }, [authToken]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Clear chat when property changes
  useEffect(() => {
    setChatMessages([]);
    if (selectedProperty?.id && authToken) {
      checkIfBookmarked(selectedProperty.id);
    }
  }, [selectedProperty?.id]);

  // Update URL when property changes
  useEffect(() => {
    if (selectedProperty) {
      window.history.pushState({}, '', `/predio/${selectedProperty.id}`);
    } else if (window.location.pathname.startsWith('/predio/')) {
      window.history.pushState({}, '', '/');
    }
  }, [selectedProperty]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      checkUrlForPredio();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const checkUrlForPredio = async () => {
    const match = window.location.pathname.match(/\/predio\/(\d+)/);
    if (match) {
      try {
        const res = await fetch(`/api/predio/${match[1]}`);
        if (res.ok) {
          const predio = await res.json();
          setSelectedProperty(predio);
        }
      } catch (err) {
        console.error('Failed to load predio from URL:', err);
      }
    } else {
      setSelectedProperty(null);
    }
  };

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

  const loadBookmarks = async () => {
    try {
      const data = await api.get('/bookmarks');
      setBookmarks(data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const checkIfBookmarked = async (predioId) => {
    try {
      const data = await api.get(`/bookmarks/check/${predioId}`);
      setIsBookmarked(data.bookmarked);
    } catch (err) {
      setIsBookmarked(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !selectedProperty) return;
    
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${selectedProperty.id}`);
        setIsBookmarked(false);
        setBookmarks(prev => prev.filter(b => b.id !== selectedProperty.id));
      } else {
        await api.post(`/bookmarks/${selectedProperty.id}`);
        setIsBookmarked(true);
        loadBookmarks();
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const shareViaWhatsApp = () => {
    if (!selectedProperty) return;
    const url = `${window.location.origin}/predio/${selectedProperty.id}`;
    const text = `📍 ${selectedProperty.calle} ${selectedProperty.no_externo}, ${selectedProperty.colonia}\n🏛️ ${selectedProperty.uso_descri}\n\nVer en GITO: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyShareLink = () => {
    if (!selectedProperty) return;
    const url = `${window.location.origin}/predio/${selectedProperty.id}`;
    navigator.clipboard.writeText(url);
    alert('¡Enlace copiado!');
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

  const clearHistory = async () => {
    try {
      await api.delete('/history');
      setSearchHistory([]);
    } catch (err) {
      console.error('Clear history failed:', err);
    }
  };

  // AI Chat - uses backend proxy with FULL property context
  const handleChat = async () => {
    if (!chatInput.trim() || isChatting || !selectedProperty) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);
    
    // Calculate all property values
    const supTerreno = parseFloat(selectedProperty.superficie) || 0;
    const niveles = parseInt(selectedProperty.niveles) || 4;
    const areaLibre = parseFloat(selectedProperty.area_libre) || 20;
    const cosMax = (100 - areaLibre) / 100;
    const cusMax = cosMax * niveles;
    const supDesplante = supTerreno * cosMax;
    const supMaxConst = supTerreno * cusMax;
    const restricciones = getRestricciones(selectedProperty);
    
    // Calculate viviendas
    let numViviendas = 'N/A';
    const densidad = selectedProperty.densidad_d;
    if (densidad) {
      const match = densidad.match(/(\d+)\s*VIV/i);
      if (match) {
        const vivPor = parseInt(match[1]);
        const viv = supMaxConst / vivPor;
        numViviendas = viv >= 0.5 ? Math.round(viv) : Math.floor(viv);
      }
    }
    
    // Build comprehensive restrictions text
    let restriccionesTexto = '';
    if (restricciones.length > 0) {
      restriccionesTexto = '\n\nRESTRICCIONES ESPECIALES:\n' + restricciones.map(r => {
        if (r.tipo === 'ACP') {
          return `- ÁREA DE CONSERVACIÓN PATRIMONIAL (ACP): ${r.requisitos.join('. ')}`;
        }
        return `- ${r.titulo}: Usos NO permitidos: ${r.prohibidos.join(', ')}`;
      }).join('\n');
    }
    
    // Build comprehensive system prompt with ALL property data
    const systemPrompt = `Eres un experto en desarrollo urbano de la Ciudad de México. YA TIENES TODA la información del predio que el usuario está consultando. NO pidas la dirección ni datos adicionales - ya los tienes aquí:

===== DATOS DEL PREDIO =====
📍 DIRECCIÓN COMPLETA: ${selectedProperty.calle} ${selectedProperty.no_externo}, Colonia ${selectedProperty.colonia}, Alcaldía ${selectedProperty.alcaldia || 'N/A'}, CP ${selectedProperty.codigo_pos || 'N/A'}

📐 CARACTERÍSTICAS FÍSICAS:
- Superficie del terreno: ${supTerreno} m²
- Uso de suelo: ${selectedProperty.uso_descri}
- Niveles permitidos: ${niveles}
- Altura permitida: ${selectedProperty.altura || 'No especificada'}
- Área libre requerida: ${areaLibre}%

📊 CÁLCULOS DE INTENSIDAD:
- COS máximo: ${cosMax.toFixed(2)} (${(cosMax*100).toFixed(0)}%)
- CUS máximo: ${cusMax.toFixed(2)}
- Superficie máxima de desplante: ${supDesplante.toFixed(2)} m²
- Superficie máxima de construcción: ${supMaxConst.toFixed(2)} m²
- Densidad: ${selectedProperty.densidad_d || 'No aplica'}
- Viviendas permitidas: ${numViviendas}
- Mínimo m² por vivienda: ${selectedProperty.minimo_viv || 'No especificado'}
${restriccionesTexto}

===== REGLAS DE MANIFESTACIÓN DE CONSTRUCCIÓN =====
- TIPO A (Simplificada): Hasta 200m² de construcción, no requiere DRO
- TIPO B (Con DRO): Hasta 5,000m² o hasta 5 niveles, requiere DRO
- TIPO C (Especial): Más de 5,000m² o más de 5 niveles, requiere DRO + Corresponsables

INSTRUCCIONES:
1. NUNCA pidas la dirección - ya la tienes arriba
2. NUNCA pidas que el usuario proporcione datos que ya tienes
3. Responde de manera directa y específica para ESTE predio
4. Usa los números exactos calculados arriba
5. Responde en español, de forma práctica y útil
6. Si te preguntan sobre usos permitidos, basa tu respuesta en el uso de suelo: "${selectedProperty.uso_descri}"
7. Si te preguntan sobre construcción, usa los cálculos de superficie máxima`;
    
    try {
      const token = authToken;
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
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

  const showCenteredSearch = !selectedProperty && viewMode === 'search';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back button - Top Left */}
      {(selectedProperty || viewMode === 'bookmarks' || viewMode === 'reglamento') && (
        <div className="absolute top-0 left-0 p-4 z-10">
          <button 
            onClick={() => {
              if (selectedProperty) {
                setSelectedProperty(null);
              } else {
                setViewMode('search');
              }
            }} 
            className="flex items-center gap-1 text-slate-600 hover:text-gob-primary text-sm font-medium bg-white rounded-full px-3 py-1.5 shadow-sm"
          >
            ← Volver
          </button>
        </div>
      )}

      {/* Minimal Header - Right side */}
      <header className="absolute top-0 right-0 p-4 z-10">
        <div className="flex items-center gap-3">
          {/* Reglamento Button - visible for all users */}
          {!selectedProperty && (
            <button
              onClick={() => setViewMode(viewMode === 'reglamento' ? 'search' : 'reglamento')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'reglamento' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <span>📜</span>
              <span className="hidden sm:inline">Reglamento</span>
            </button>
          )}
          
          {/* Bookmarks Button - only when logged in and not viewing a property */}
          {user && !selectedProperty && (
            <button
              onClick={() => setViewMode(viewMode === 'bookmarks' ? 'search' : 'bookmarks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'bookmarks' 
                  ? 'bg-yellow-400 text-yellow-900' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <svg className="w-4 h-4" fill={viewMode === 'bookmarks' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="hidden sm:inline">Guardados</span>
              {bookmarks.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${viewMode === 'bookmarks' ? 'bg-yellow-600 text-yellow-100' : 'bg-gob-primary text-white'}`}>
                  {bookmarks.length}
                </span>
              )}
            </button>
          )}
          
          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm text-slate-700 hidden sm:block">{user.name?.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 text-xs ml-1"
                title="Cerrar sesión"
              >
                ✕
              </button>
            </div>
          ) : null}
          <div ref={googleButtonRef} className={`google-signin-btn ${user ? 'hidden' : ''}`} />
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-4 ${showCenteredSearch && searchResults.length === 0 ? 'pt-[15vh]' : 'pt-20'}`}>
        {!selectedProperty ? (
          <div className="space-y-6">
            {/* Bookmarks View */}
            {viewMode === 'bookmarks' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">📑 Predios Guardados</h2>
                  <p className="text-slate-500 text-sm">Tus predios marcados para acceso rápido</p>
                </div>
                
                {bookmarks.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="text-5xl mb-4">📑</div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Sin predios guardados</h3>
                    <p className="text-slate-500 text-sm mb-4">
                      Busca un predio y haz clic en el botón de guardar para verlo aquí.
                    </p>
                    <button
                      onClick={() => setViewMode('search')}
                      className="bg-gob-primary hover:bg-gob-dark text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      Buscar predios
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="divide-y max-h-[70vh] overflow-y-auto">
                      {bookmarks.map((row) => {
                        // Extraer cuenta catastral del link
                        const cuentaMatch = row.liga_ciuda?.match(/cuentaCatastral=([^&]+)/);
                        const cuentaCatastral = cuentaMatch ? cuentaMatch[1] : null;
                        const direccionCompleta = encodeURIComponent(`${row.calle} ${row.no_externo}, ${row.colonia}, ${row.alcaldia}, CDMX`);
                        
                        return (
                          <div key={row.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                            <button
                              onClick={() => setSelectedProperty(row)}
                              className="w-full text-left"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-slate-800">{row.calle} {row.no_externo}</div>
                                  <div className="text-sm text-slate-500">{row.colonia} • {row.alcaldia}</div>
                                  <div className="text-xs text-gob-primary font-medium mt-1">📋 {row.uso_descri}</div>
                                  {cuentaCatastral && (
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">Cuenta: {cuentaCatastral}</div>
                                  )}
                                </div>
                                <span className="text-gob-primary text-sm font-medium bg-gob-primary/10 px-2 py-1 rounded">Ver Detalle →</span>
                              </div>
                            </button>
                            
                            {/* MAPAS - Google y Street View */}
                            <div className="mt-3 space-y-2">
                              <div className="flex gap-2">
                                {row.latitud && row.longitud && (
                                  <>
                                    <a 
                                      href={`https://www.google.com/maps?q=${row.latitud},${row.longitud}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 bg-gob-primary hover:bg-gob-dark text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                      <span>🗺️</span> Google Maps
                                    </a>
                                    <a 
                                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${row.latitud},${row.longitud}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                      <span>👁️</span> Street View
                                    </a>
                                  </>
                                )}
                              </div>
                              
                              {/* MAPAS OFICIALES CDMX */}
                              <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg p-2 border border-purple-200">
                                <div className="text-xs text-purple-700 font-medium mb-2 text-center">🏛️ Mapas Oficiales CDMX</div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <a 
                                    href={cuentaCatastral 
                                      ? `http://ciudadmx.cdmx.gob.mx:8080/seduvi/?cuentaCatastral=${cuentaCatastral}`
                                      : `http://ciudadmx.cdmx.gob.mx:8080/seduvi/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>🏛️</span> SEDUVI
                                  </a>
                                  <a 
                                    href="https://sig.cdmx.gob.mx/sig_cdmx/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-teal-600 hover:bg-teal-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>📊</span> SIG CDMX
                                  </a>
                                  <a 
                                    href="https://ovica.finanzas.cdmx.gob.mx/Mapa.aspx"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>🏠</span> Catastro
                                  </a>
                                  <a 
                                    href={`https://www.google.com/maps/search/${direccionCompleta}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-slate-600 hover:bg-slate-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>📍</span> Buscar Dir.
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reglamento de Construcciones View */}
            {viewMode === 'reglamento' && (
              <div className="space-y-4">
                <ReglamentoConstruccionView api={api} />
              </div>
            )}

            {/* Search View */}
            {viewMode === 'search' && (
              <div className="text-center">
                {/* Logo - Always visible */}
                {stats.totalPredios > 0 && (
                  <div className="mb-8">
                    <h1 className="text-6xl font-bold mb-2">
                      <span className="text-gob-primary">G</span>
                      <span className="text-slate-700">I</span>
                      <span className="text-gob-primary">T</span>
                      <span className="text-slate-700">O</span>
                    </h1>
                    <p className="text-slate-500 text-sm">Gestión Inteligente de Terrenos y Obras</p>
                  </div>
                )}
              
                {/* Search Box - Always centered */}
                {stats.totalPredios > 0 && (
                  <div className="max-w-xl mx-auto mb-6">
                    <div className="bg-white rounded-full shadow-lg border border-slate-200 hover:shadow-xl transition-shadow flex items-center px-5 py-3">
                      <span className="text-slate-400 mr-3">🔍</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar dirección: Durango 259, Roma Norte..."
                        className="flex-1 outline-none text-slate-700 bg-transparent"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')} 
                          className="text-slate-400 hover:text-slate-600 mr-3"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="bg-gob-primary hover:bg-gob-dark disabled:bg-slate-300 text-white px-5 py-2 rounded-full font-medium text-sm transition-colors"
                      >
                        {isLoading ? '...' : 'Buscar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* History - Show when no results */}
                {searchResults.length === 0 && searchHistory.length > 0 && (
                  <div className="max-w-xl mx-auto mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm text-slate-500">
                        🕐 Búsquedas recientes
                      </h3>
                      <button onClick={clearHistory} className="text-xs text-slate-400 hover:text-red-500">Limpiar</button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchHistory.slice(0, 8).map((h, i) => (
                        <button
                          key={i}
                          onClick={() => { setSearchQuery(h.query); }}
                          className="px-4 py-2 bg-white hover:bg-slate-100 rounded-full text-sm text-slate-600 shadow-sm border border-slate-200 transition-colors"
                        >
                          {h.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {searchResults.length > 0 && (
                  <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden text-left">
                    <div className="bg-slate-50 px-5 py-3 border-b flex justify-between items-center">
                      <span className="font-medium text-slate-700">{searchResults.length} resultados encontrados</span>
                      <button onClick={() => setSearchResults([])} className="text-sm text-slate-400 hover:text-slate-600">✕ Cerrar</button>
                    </div>
                    <div className="divide-y max-h-[60vh] overflow-y-auto">
                      {searchResults.map((row) => {
                        // Extraer cuenta catastral del link
                        const cuentaMatch = row.liga_ciuda?.match(/cuentaCatastral=([^&]+)/);
                        const cuentaCatastral = cuentaMatch ? cuentaMatch[1] : null;
                        const direccionCompleta = encodeURIComponent(`${row.calle} ${row.no_externo}, ${row.colonia}, ${row.alcaldia}, CDMX`);
                        
                        return (
                          <div key={row.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                            <button
                              onClick={() => setSelectedProperty(row)}
                              className="w-full text-left"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-slate-800">{row.calle} {row.no_externo}</div>
                                  <div className="text-sm text-slate-500">{row.colonia} • {row.alcaldia}</div>
                                  <div className="text-xs text-gob-primary font-medium mt-1">📋 {row.uso_descri}</div>
                                  {cuentaCatastral && (
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">Cuenta: {cuentaCatastral}</div>
                                  )}
                                </div>
                                <span className="text-gob-primary text-sm font-medium bg-gob-primary/10 px-2 py-1 rounded">Ver Detalle →</span>
                              </div>
                            </button>
                            
                            {/* MAPAS - Google y Street View */}
                            <div className="mt-3 space-y-2">
                              <div className="flex gap-2">
                                {row.latitud && row.longitud && (
                                  <>
                                    <a 
                                      href={`https://www.google.com/maps?q=${row.latitud},${row.longitud}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 bg-gob-primary hover:bg-gob-dark text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                      <span>🗺️</span> Google Maps
                                    </a>
                                    <a 
                                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${row.latitud},${row.longitud}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                      <span>👁️</span> Street View
                                    </a>
                                  </>
                                )}
                              </div>
                              
                              {/* MAPAS OFICIALES CDMX */}
                              <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg p-2 border border-purple-200">
                                <div className="text-xs text-purple-700 font-medium mb-2 text-center">🏛️ Mapas Oficiales CDMX</div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <a 
                                    href={cuentaCatastral 
                                      ? `http://ciudadmx.cdmx.gob.mx:8080/seduvi/?cuentaCatastral=${cuentaCatastral}`
                                      : `http://ciudadmx.cdmx.gob.mx:8080/seduvi/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>🏛️</span> SEDUVI
                                  </a>
                                  <a 
                                    href="https://sig.cdmx.gob.mx/sig_cdmx/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-teal-600 hover:bg-teal-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>📊</span> SIG CDMX
                                  </a>
                                  <a 
                                    href="https://ovica.finanzas.cdmx.gob.mx/Mapa.aspx"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>🏠</span> Catastro
                                  </a>
                                  <a 
                                    href={`https://www.google.com/maps/search/${direccionCompleta}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-slate-600 hover:bg-slate-700 text-white text-center py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>📍</span> Buscar Dir.
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty State - No data loaded */}
                {stats.totalPredios === 0 && (
                  <div className="py-12">
                    <div className="mb-8">
                      <h1 className="text-6xl font-bold mb-2">
                        <span className="text-gob-primary">G</span>
                        <span className="text-slate-700">I</span>
                        <span className="text-gob-primary">T</span>
                        <span className="text-slate-700">O</span>
                      </h1>
                      <p className="text-slate-500 text-sm">Gestión Inteligente de Terrenos y Obras</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-md mx-auto">
                      <p className="text-amber-800 font-medium mb-2">⚠️ Base de datos vacía</p>
                      <p className="text-amber-700 text-sm">
                        Contacta al administrador para cargar los datos de SEDUVI.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <PropertyCard 
            property={selectedProperty}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChat={handleChat}
            isChatting={isChatting}
            chatEndRef={chatEndRef}
            user={user}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            shareViaWhatsApp={shareViaWhatsApp}
            copyShareLink={copyShareLink}
          />
        )}
      </main>
    </div>
  );
}