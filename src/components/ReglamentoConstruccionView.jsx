import React, { useState, useEffect } from 'react';

// =============================================================================
// COMPONENTE: REGLAMENTO DE CONSTRUCCIONES CDMX
// =============================================================================

// Datos del índice del reglamento (estructura de títulos)
const TITULOS_REGLAMENTO = [
  { numero: 1, nombre: 'DISPOSICIONES GENERALES', articulos: '1-6' },
  { numero: 2, nombre: 'DE LA VÍA PÚBLICA Y OTROS BIENES DE USO COMÚN', articulos: '7-25' },
  { numero: 3, nombre: 'DE LOS DIRECTORES RESPONSABLES DE OBRA Y CORRESPONSABLES', articulos: '26-52' },
  { numero: 4, nombre: 'DE LAS MANIFESTACIONES DE CONSTRUCCIÓN', articulos: '53-70' },
  { numero: 5, nombre: 'DEL PROYECTO ARQUITECTÓNICO', articulos: '71-95' },
  { numero: 6, nombre: 'DE LA SEGURIDAD ESTRUCTURAL DE LAS CONSTRUCCIONES', articulos: '96-182' },
  { numero: 7, nombre: 'DE LAS INSTALACIONES', articulos: '183-212' },
  { numero: 8, nombre: 'DEL USO, OPERACIÓN Y MANTENIMIENTO', articulos: '213-240' },
  { numero: 9, nombre: 'DE LAS AMPLIACIONES DE OBRAS', articulos: '241-260' },
  { numero: 10, nombre: 'DE LAS DEMOLICIONES', articulos: '261-278' }
];

// Temas frecuentes para búsqueda rápida
const TEMAS_FRECUENTES = [
  { nombre: 'Licencias de construcción', busqueda: 'licencia construcción', icono: '📋' },
  { nombre: 'Manifestación de obra', busqueda: 'manifestación construcción', icono: '📝' },
  { nombre: 'Director Responsable de Obra', busqueda: 'director responsable', icono: '👷' },
  { nombre: 'Seguridad estructural', busqueda: 'seguridad estructural', icono: '🏗️' },
  { nombre: 'Uso de suelo', busqueda: 'uso suelo zonificación', icono: '🗺️' },
  { nombre: 'Estacionamientos', busqueda: 'estacionamiento cajones', icono: '🚗' },
  { nombre: 'Área libre', busqueda: 'área libre', icono: '🌳' },
  { nombre: 'Niveles y altura', busqueda: 'niveles altura', icono: '📏' },
  { nombre: 'Demoliciones', busqueda: 'demolición', icono: '🔨' },
  { nombre: 'Vía pública', busqueda: 'vía pública', icono: '🛣️' },
  { nombre: 'Normas Técnicas', busqueda: 'normas técnicas complementarias', icono: '📚' },
  { nombre: 'Sanciones', busqueda: 'sanción multa infracción', icono: '⚠️' }
];

export function ReglamentoConstruccionView({ api }) {
  const [reglamento, setReglamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArticulo, setSelectedArticulo] = useState(null);
  const [selectedTitulo, setSelectedTitulo] = useState(null);
  const [viewMode, setViewMode] = useState('inicio'); // 'inicio', 'busqueda', 'titulo', 'articulo'

  // Cargar el reglamento
  useEffect(() => {
    loadReglamento();
  }, []);

  const loadReglamento = async () => {
    try {
      const response = await fetch('/data/reglamento_construccion.json');
      const data = await response.json();
      setReglamento(data);
    } catch (err) {
      console.error('Error cargando reglamento:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar en el reglamento
  const handleSearch = (query = searchQuery) => {
    if (!query.trim() || !reglamento) return;
    
    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    
    const results = reglamento.articulos.filter(art => {
      const texto = art.texto.toLowerCase();
      return searchTerms.some(term => texto.includes(term));
    }).map(art => {
      // Calcular relevancia
      const texto = art.texto.toLowerCase();
      let score = 0;
      searchTerms.forEach(term => {
        const matches = (texto.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });
      return { ...art, score };
    }).sort((a, b) => b.score - a.score).slice(0, 20);

    setSearchResults(results);
    setViewMode('busqueda');
  };

  // Ver artículo específico
  const viewArticulo = (articulo) => {
    setSelectedArticulo(articulo);
    setViewMode('articulo');
  };

  // Ver artículos de un título
  const viewTitulo = (tituloNum) => {
    setSelectedTitulo(tituloNum);
    setViewMode('titulo');
  };

  // Obtener artículos de un título
  const getArticulosByTitulo = (tituloNum) => {
    if (!reglamento) return [];
    
    const titulo = TITULOS_REGLAMENTO.find(t => t.numero === tituloNum);
    if (!titulo) return [];
    
    const [start, end] = titulo.articulos.split('-').map(Number);
    return reglamento.articulos.filter(art => {
      const num = art.numero;
      return num >= start && num <= end;
    });
  };

  // Buscar artículo por número
  const buscarPorNumero = (num) => {
    if (!reglamento) return null;
    return reglamento.articulos.find(art => art.numero === num && !art.sufijo);
  };

  // Resaltar términos de búsqueda
  const highlightText = (text, query) => {
    if (!query) return text;
    const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    let result = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
    });
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gob-primary mb-4"></div>
          <p className="text-slate-600">Cargando Reglamento de Construcciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="text-white font-bold text-lg">Reglamento de Construcciones CDMX</h2>
              <p className="text-amber-100 text-xs">Última reforma: 4 de octubre de 2024</p>
            </div>
          </div>
          {viewMode !== 'inicio' && (
            <button
              onClick={() => {
                setViewMode('inicio');
                setSearchQuery('');
                setSearchResults([]);
                setSelectedArticulo(null);
                setSelectedTitulo(null);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              ← Inicio
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Barra de búsqueda (siempre visible) */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar en el reglamento... (ej: licencia construcción, estacionamiento)"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
            <button
              onClick={() => handleSearch()}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Buscar
            </button>
          </div>
          
          {/* Búsqueda por número de artículo */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Ir al artículo:</span>
            <input
              type="number"
              min="1"
              max="278"
              placeholder="Núm."
              className="w-20 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const art = buscarPorNumero(parseInt(e.target.value));
                  if (art) viewArticulo(art);
                }
              }}
            />
          </div>
        </div>

        {/* Vista: Inicio */}
        {viewMode === 'inicio' && (
          <div className="space-y-6">
            {/* Temas frecuentes */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>⚡</span> Temas frecuentes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {TEMAS_FRECUENTES.map((tema, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(tema.busqueda);
                      handleSearch(tema.busqueda);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-sm text-left transition-colors"
                  >
                    <span>{tema.icono}</span>
                    <span className="text-slate-700">{tema.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Índice por títulos */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>📚</span> Índice del Reglamento
              </h3>
              <div className="space-y-2">
                {TITULOS_REGLAMENTO.map((titulo) => (
                  <button
                    key={titulo.numero}
                    onClick={() => viewTitulo(titulo.numero)}
                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-amber-600 font-bold">TÍTULO {titulo.numero}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-700 text-sm">{titulo.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Arts. {titulo.articulos}</span>
                        <span className="text-slate-400 group-hover:text-amber-600 transition-colors">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span>ℹ️</span> Información
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Publicado en la Gaceta Oficial: 29 de enero de 2004</li>
                <li>• Última reforma: 4 de octubre de 2024</li>
                <li>• Total de artículos: {reglamento?.articulos?.length || 274}</li>
                <li>• Complementado por las Normas Técnicas Complementarias (NTC)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Vista: Resultados de búsqueda */}
        {viewMode === 'busqueda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">
                {searchResults.length} resultados para "{searchQuery}"
              </h3>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-500">No se encontraron artículos con esos términos</p>
                <p className="text-sm text-slate-400 mt-2">Intenta con palabras diferentes</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {searchResults.map((art, idx) => (
                  <button
                    key={idx}
                    onClick={() => viewArticulo(art)}
                    className="w-full text-left p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-amber-700 mb-1">
                          Artículo {art.numero}{art.sufijo ? ` ${art.sufijo}` : ''}
                        </div>
                        <p 
                          className="text-sm text-slate-600 line-clamp-3"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText(art.texto.substring(0, 300) + '...', searchQuery) 
                          }}
                        />
                      </div>
                      <span className="text-amber-600 text-lg">→</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista: Artículos de un título */}
        {viewMode === 'titulo' && selectedTitulo && (
          <div className="space-y-4">
            <div className="bg-amber-100 rounded-lg p-4">
              <h3 className="font-bold text-amber-800">
                TÍTULO {selectedTitulo}: {TITULOS_REGLAMENTO.find(t => t.numero === selectedTitulo)?.nombre}
              </h3>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {getArticulosByTitulo(selectedTitulo).map((art, idx) => (
                <button
                  key={idx}
                  onClick={() => viewArticulo(art)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-amber-700 mb-1">
                        Artículo {art.numero}{art.sufijo ? ` ${art.sufijo}` : ''}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {art.texto.substring(0, 200)}...
                      </p>
                    </div>
                    <span className="text-amber-600 text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista: Artículo completo */}
        {viewMode === 'articulo' && selectedArticulo && (
          <div className="space-y-4">
            <div className="bg-amber-100 rounded-lg p-4">
              <h3 className="font-bold text-amber-800 text-xl">
                Artículo {selectedArticulo.numero}{selectedArticulo.sufijo ? ` ${selectedArticulo.sufijo}` : ''}
              </h3>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
              <div 
                className="text-slate-700 whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: searchQuery 
                    ? highlightText(selectedArticulo.texto, searchQuery)
                    : selectedArticulo.texto
                }}
              />
            </div>

            {/* Navegación entre artículos */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const prevArt = reglamento.articulos.find(a => 
                    a.numero === selectedArticulo.numero - 1 && !a.sufijo
                  );
                  if (prevArt) viewArticulo(prevArt);
                }}
                disabled={selectedArticulo.numero <= 1}
                className="flex items-center gap-1 text-amber-600 hover:text-amber-800 disabled:text-slate-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                ← Artículo anterior
              </button>
              <button
                onClick={() => {
                  const nextArt = reglamento.articulos.find(a => 
                    a.numero === selectedArticulo.numero + 1 && !a.sufijo
                  );
                  if (nextArt) viewArticulo(nextArt);
                }}
                className="flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm font-medium"
              >
                Artículo siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReglamentoConstruccionView;
