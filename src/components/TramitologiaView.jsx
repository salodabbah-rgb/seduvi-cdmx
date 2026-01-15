import React, { useState, useEffect } from 'react';

// =============================================================================
// COMPONENTE: ÁREA DE TRAMITOLOGÍA
// =============================================================================

export function TramitologiaView({ property, api }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState(null);
  const [showReglamento, setShowReglamento] = useState(false);

  // Generar checklist automáticamente cuando hay una propiedad
  useEffect(() => {
    if (property) {
      generarChecklist();
    }
  }, [property]);

  const generarChecklist = async () => {
    setLoading(true);
    try {
      const data = await api.post('/tramites/checklist', {
        superficie: property.superficie,
        niveles: property.niveles,
        uso: property.uso_descri,
        colonia: property.colonia,
        alcaldia: property.alcaldia
      });
      setChecklist(data);
    } catch (err) {
      console.error('Error generando checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const buscarArticulo = async (numero) => {
    try {
      const art = await api.get(`/reglamento/articulo/${numero}`);
      setSelectedArticulo(art);
      setShowReglamento(true);
    } catch (err) {
      console.error('Error buscando artículo:', err);
    }
  };

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Área de Tramitología
          </h2>
          <p className="text-slate-500 mb-4">
            Selecciona un predio para generar el checklist de trámites automático
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gob-primary to-gob-dark text-white rounded-2xl p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">📋 Tramitología CDMX</h1>
        <p className="text-white/90">
          Checklist automático de trámites para: {property.calle} {property.no_externo}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gob-primary"></div>
          <p className="mt-4 text-slate-600">Generando checklist personalizado...</p>
        </div>
      ) : checklist && (
        <div className="space-y-6">
          {/* Resumen Ejecutivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-2xl font-bold text-gob-primary">
                ${checklist.costoEstimado.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Costo estimado total</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-2xl font-bold text-gob-primary">
                {checklist.tiempoEstimado}
              </div>
              <div className="text-sm text-slate-500">Tiempo estimado</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-2">📝</div>
              <div className="text-2xl font-bold text-gob-primary">
                {checklist.preConstruccion.length + checklist.registro.length + 
                 checklist.permisos.length + checklist.postConstruccion.length}
              </div>
              <div className="text-sm text-slate-500">Trámites requeridos</div>
            </div>
          </div>

          {/* Alertas Especiales */}
          {checklist.alertasEspeciales.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center">
                ⚠️ Alertas Importantes
              </h3>
              {checklist.alertasEspeciales.map((alerta, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="font-semibold text-amber-800">{alerta.tipo}</div>
                  <div className="text-sm text-amber-700">{alerta.mensaje}</div>
                  {alerta.articulo && (
                    <button
                      onClick={() => buscarArticulo(alerta.articulo.replace('Art. ', ''))}
                      className="text-xs text-amber-600 hover:text-amber-800 underline mt-1"
                    >
                      {alerta.articulo} →
                    </button>
                  )}
                  {alerta.requisitos && (
                    <ul className="text-xs text-amber-700 mt-1 ml-4 list-disc">
                      {alerta.requisitos.map((req, j) => (
                        <li key={j}>{req}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FASE 1: PRE-CONSTRUCCIÓN */}
          {checklist.preConstruccion.length > 0 && (
            <TramiteSection
              title="FASE 1: PRE-CONSTRUCCIÓN"
              icon="📄"
              tramites={checklist.preConstruccion}
              onVerArticulo={buscarArticulo}
            />
          )}

          {/* FASE 2: REGISTRO DE OBRA */}
          {checklist.registro.length > 0 && (
            <TramiteSection
              title="FASE 2: REGISTRO DE OBRA"
              icon="🏗️"
              tramites={checklist.registro}
              onVerArticulo={buscarArticulo}
            />
          )}

          {/* FASE 3: PERMISOS ESPECIALES */}
          {checklist.permisos.length > 0 && (
            <TramiteSection
              title="FASE 3: PERMISOS ESPECIALES"
              icon="✅"
              tramites={checklist.permisos}
              onVerArticulo={buscarArticulo}
            />
          )}

          {/* FASE 4: POST-CONSTRUCCIÓN */}
          {checklist.postConstruccion.length > 0 && (
            <TramiteSection
              title="FASE 4: POST-CONSTRUCCIÓN"
              icon="🎉"
              tramites={checklist.postConstruccion}
              onVerArticulo={buscarArticulo}
            />
          )}

          {/* Directorio de Ventanillas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="mr-2">📍</span>
              Directorio de Ventanillas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ContactoVentanilla
                nombre="SEDUVI Central"
                direccion="Av. Tlaxcoaque 8, Centro Histórico"
                telefono="55-5345-8000"
                horario="Lun-Vie 9:00-14:00"
              />
              <ContactoVentanilla
                nombre={`SEDUVI ${property.alcaldia}`}
                direccion="Consultar directorio por alcaldía"
                telefono="Pendiente"
                horario="Lun-Vie 9:00-14:00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Artículo del Reglamento */}
      {showReglamento && selectedArticulo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Artículo {selectedArticulo.articulo}
              </h3>
              <button
                onClick={() => setShowReglamento(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-slate-600 mb-2">
              {selectedArticulo.titulo}
            </div>
            {selectedArticulo.capitulo && (
              <div className="text-xs text-slate-500 mb-4">
                {selectedArticulo.capitulo}
              </div>
            )}
            <div className="text-slate-700 leading-relaxed">
              {selectedArticulo.texto}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Sección de Trámites
function TramiteSection({ title, icon, tramites, onVerArticulo }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      <div className="space-y-4">
        {tramites.map((tramite, i) => (
          <div key={i} className="border-l-4 border-gob-primary pl-4 py-2">
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold text-slate-800">{tramite.nombre}</div>
              <div className="text-right">
                <div className="text-gob-primary font-bold">
                  ${tramite.costo.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">{tramite.tiempo}</div>
              </div>
            </div>
            <div className="text-sm text-slate-600 mb-2">
              📍 {tramite.ventanilla}
            </div>
            {tramite.articulo && (
              <button
                onClick={() => onVerArticulo(tramite.articulo.replace('Art. ', ''))}
                className="text-xs text-gob-primary hover:text-gob-dark underline mb-2"
              >
                {tramite.articulo} - Ver reglamento →
              </button>
            )}
            {tramite.requisitos && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-slate-700 mb-1">Requisitos:</div>
                <ul className="text-xs text-slate-600 ml-4 space-y-1">
                  {tramite.requisitos.map((req, j) => (
                    <li key={j} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de Contacto de Ventanilla
function ContactoVentanilla({ nombre, direccion, telefono, horario }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <h4 className="font-semibold text-slate-800 mb-2">{nombre}</h4>
      <div className="space-y-1 text-sm text-slate-600">
        <div>📍 {direccion}</div>
        <div>📞 {telefono}</div>
        <div>🕐 {horario}</div>
      </div>
    </div>
  );
}
