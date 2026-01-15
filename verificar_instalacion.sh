#!/bin/bash

# =============================================================================
# GITO 2.0 - SCRIPT DE VERIFICACIÓN DE INSTALACIÓN
# =============================================================================

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       GITO 2.0 - Verificación de Instalación                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Función de verificación
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# =============================================================================
# VERIFICACIONES
# =============================================================================

echo "📋 Verificando estructura de archivos..."
echo ""

# 1. Verificar server.js actualizado
if grep -q "REGLAMENTO_CONTEXT" server.js 2>/dev/null; then
    check 0 "server.js actualizado con contexto del reglamento"
else
    check 1 "server.js NO actualizado (falta REGLAMENTO_CONTEXT)"
fi

# 2. Verificar directorio data
if [ -d "data" ]; then
    check 0 "Directorio /data existe"
else
    check 1 "Directorio /data NO existe"
fi

# 3. Verificar articulos_index.json
if [ -f "data/articulos_index.json" ]; then
    SIZE=$(stat -f%z "data/articulos_index.json" 2>/dev/null || stat -c%s "data/articulos_index.json" 2>/dev/null)
    if [ "$SIZE" -gt 100000 ]; then
        check 0 "articulos_index.json existe (${SIZE} bytes)"
    else
        check 1 "articulos_index.json muy pequeño (${SIZE} bytes)"
    fi
else
    check 1 "articulos_index.json NO existe"
fi

# 4. Verificar reglamento_completo.txt
if [ -f "data/reglamento_completo.txt" ]; then
    SIZE=$(stat -f%z "data/reglamento_completo.txt" 2>/dev/null || stat -c%s "data/reglamento_completo.txt" 2>/dev/null)
    if [ "$SIZE" -gt 300000 ]; then
        check 0 "reglamento_completo.txt existe (${SIZE} bytes)"
    else
        check 1 "reglamento_completo.txt muy pequeño (${SIZE} bytes)"
    fi
else
    check 1 "reglamento_completo.txt NO existe"
fi

# 5. Verificar directorio components
if [ -d "src/components" ]; then
    check 0 "Directorio /src/components existe"
else
    check 1 "Directorio /src/components NO existe"
fi

# 6. Verificar TramitologiaView.jsx
if [ -f "src/components/TramitologiaView.jsx" ]; then
    check 0 "TramitologiaView.jsx existe"
else
    check 1 "TramitologiaView.jsx NO existe"
fi

# 7. Verificar import en App.jsx
if grep -q "TramitologiaView" src/App.jsx 2>/dev/null; then
    check 0 "App.jsx importa TramitologiaView"
else
    check 1 "App.jsx NO importa TramitologiaView"
fi

# 8. Verificar package.json tiene las dependencias
echo ""
echo "📦 Verificando dependencias..."
echo ""

if [ -f "package.json" ]; then
    check 0 "package.json existe"
    
    if grep -q "express" package.json; then
        check 0 "Dependencia: express"
    else
        check 1 "Dependencia: express FALTA"
    fi
    
    if grep -q "pg" package.json; then
        check 0 "Dependencia: pg (PostgreSQL)"
    else
        check 1 "Dependencia: pg FALTA"
    fi
else
    check 1 "package.json NO existe"
fi

# 9. Verificar endpoints en server.js
echo ""
echo "🔌 Verificando endpoints de API..."
echo ""

if grep -q "/api/reglamento/articulo" server.js 2>/dev/null; then
    check 0 "Endpoint: /api/reglamento/articulo/:numero"
else
    check 1 "Endpoint: /api/reglamento/articulo/:numero FALTA"
fi

if grep -q "/api/reglamento/buscar" server.js 2>/dev/null; then
    check 0 "Endpoint: /api/reglamento/buscar"
else
    check 1 "Endpoint: /api/reglamento/buscar FALTA"
fi

if grep -q "/api/tramites/checklist" server.js 2>/dev/null; then
    check 0 "Endpoint: /api/tramites/checklist"
else
    check 1 "Endpoint: /api/tramites/checklist FALTA"
fi

# 10. Verificar variables de entorno
echo ""
echo "⚙️ Verificando variables de entorno..."
echo ""

if [ -f ".env" ]; then
    check 0 "Archivo .env existe"
    
    if grep -q "DATABASE_URL" .env; then
        check 0 "Variable: DATABASE_URL configurada"
    else
        check 1 "Variable: DATABASE_URL FALTA"
    fi
    
    if grep -q "ANTHROPIC_API_KEY" .env; then
        check 0 "Variable: ANTHROPIC_API_KEY configurada"
    else
        echo -e "${YELLOW}⚠${NC} Variable: ANTHROPIC_API_KEY NO configurada (opcional para chat)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Archivo .env NO existe (puede estar en variables del servidor)"
fi

# =============================================================================
# RESUMEN
# =============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    RESUMEN DE VERIFICACIÓN                   ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  %-20s %s%-38s%s ║\n" "Verificaciones:" "${GREEN}" "✓ $PASSED pasadas" "${NC}"
printf "║  %-20s %s%-38s%s ║\n" "" "${RED}" "✗ $FAILED fallidas" "${NC}"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Determinar estado general
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡INSTALACIÓN COMPLETA Y CORRECTA!${NC}"
    echo ""
    echo "Puedes proceder a reiniciar el servidor:"
    echo "  pm2 restart seduvi-app"
    echo "  o"
    echo "  git push origin main (si usas Railway)"
    echo ""
elif [ $FAILED -le 3 ]; then
    echo -e "${YELLOW}⚠️ INSTALACIÓN PARCIAL - Revisar errores${NC}"
    echo ""
    echo "Algunos archivos faltan o no están actualizados."
    echo "Revisa la GUIA_INSTALACION.md para corregir."
    echo ""
else
    echo -e "${RED}❌ INSTALACIÓN INCOMPLETA - Revisar múltiples errores${NC}"
    echo ""
    echo "Varios archivos críticos faltan."
    echo "Recomendación: Comenzar de nuevo siguiendo GUIA_INSTALACION.md"
    echo ""
fi

# Próximos pasos
echo "📚 DOCUMENTACIÓN DISPONIBLE:"
echo "  • GUIA_INSTALACION.md - Pasos detallados"
echo "  • README_ACTUALIZACION.md - Funcionalidades completas"
echo "  • RESUMEN.md - Vista general del sistema"
echo ""

exit $FAILED
