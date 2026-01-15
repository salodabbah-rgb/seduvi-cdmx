require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { Pool } = require('pg');
const multer = require('multer');
const { parse } = require('csv-parse');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'seduvi-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Google OAuth client
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Database connection (Supabase PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Auth middleware - extracts user from JWT if present
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Invalid token, continue without user
    }
  }
  next();
};

app.use(authMiddleware);

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create predios table
    await client.query(`
      CREATE TABLE IF NOT EXISTS predios (
        id SERIAL PRIMARY KEY,
        alcaldia TEXT,
        calle TEXT,
        no_externo VARCHAR(100),
        colonia TEXT,
        codigo_pos VARCHAR(20),
        superficie DECIMAL(12,2),
        uso_descri TEXT,
        densidad_d TEXT,
        niveles VARCHAR(50),
        altura VARCHAR(100),
        area_libre VARCHAR(50),
        minimo_viv VARCHAR(100),
        liga_ciuda TEXT,
        longitud DECIMAL(15,10),
        latitud DECIMAL(15,10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alter existing columns to TEXT if table already exists
    await client.query(`
      ALTER TABLE predios ALTER COLUMN alcaldia TYPE TEXT;
      ALTER TABLE predios ALTER COLUMN calle TYPE TEXT;
      ALTER TABLE predios ALTER COLUMN no_externo TYPE VARCHAR(100);
      ALTER TABLE predios ALTER COLUMN colonia TYPE TEXT;
      ALTER TABLE predios ALTER COLUMN codigo_pos TYPE VARCHAR(20);
      ALTER TABLE predios ALTER COLUMN densidad_d TYPE TEXT;
      ALTER TABLE predios ALTER COLUMN niveles TYPE VARCHAR(50);
      ALTER TABLE predios ALTER COLUMN altura TYPE VARCHAR(100);
      ALTER TABLE predios ALTER COLUMN area_libre TYPE VARCHAR(50);
      ALTER TABLE predios ALTER COLUMN minimo_viv TYPE VARCHAR(100);
    `).catch(() => {});

    // Users table for Google OAuth
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Other tables and indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_predios_calle ON predios(calle);
      CREATE INDEX IF NOT EXISTS idx_predios_colonia ON predios(colonia);
      CREATE INDEX IF NOT EXISTS idx_predios_alcaldia ON predios(alcaldia);
      CREATE INDEX IF NOT EXISTS idx_predios_codigo_pos ON predios(codigo_pos);
      
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        query VARCHAR(255),
        results_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

      CREATE TABLE IF NOT EXISTS alcaldias_loaded (
        id SERIAL PRIMARY KEY,
        alcaldia VARCHAR(100) UNIQUE,
        records_count INTEGER,
        loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add user_id column if it doesn't exist
    await client.query(`
      ALTER TABLE search_history ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    `).catch(() => {});
    
    // Bookmarks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        predio_id INTEGER REFERENCES predios(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, predio_id)
      );
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  } finally {
    client.release();
  }
}

// =============================================================================
// API ROUTES
// =============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================================================
// GOOGLE AUTHENTICATION
// =============================================================================

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ error: 'No credential provided' });
  }
  
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  
  try {
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    // Upsert user
    const result = await pool.query(`
      INSERT INTO users (google_id, email, name, picture, last_login)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (google_id) DO UPDATE SET
        name = EXCLUDED.name,
        picture = EXCLUDED.picture,
        last_login = CURRENT_TIMESTAMP
      RETURNING id, google_id, email, name, picture
    `, [googleId, email, name, picture]);
    
    const user = result.rows[0];
    
    // Generate JWT
    const token = jwt.sign({
      id: user.id,
      googleId: user.google_id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
    
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM predios');
    const alcaldiasResult = await pool.query('SELECT * FROM alcaldias_loaded ORDER BY loaded_at DESC');
    
    res.json({
      totalPredios: parseInt(totalResult.rows[0].count),
      alcaldias: alcaldiasResult.rows
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Search predios
app.get('/api/search', async (req, res) => {
  const { q, limit = 100 } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.json({ results: [], count: 0 });
  }
  
  try {
    // Split search terms
    const terms = q.toLowerCase().trim().split(/[\s,]+/).filter(t => t.length > 0);
    
    // Build search query
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    terms.forEach(term => {
      whereConditions.push(`(
        LOWER(calle) LIKE $${paramIndex} OR 
        LOWER(no_externo) LIKE $${paramIndex} OR 
        LOWER(colonia) LIKE $${paramIndex} OR 
        codigo_pos LIKE $${paramIndex}
      )`);
      params.push(`%${term}%`);
      paramIndex++;
    });
    
    const query = `
      SELECT * FROM predios 
      WHERE ${whereConditions.join(' AND ')}
      LIMIT $${paramIndex}
    `;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Save to search history (with user_id if logged in)
    if (req.user) {
      await pool.query(
        'INSERT INTO search_history (user_id, query, results_count) VALUES ($1, $2, $3)',
        [req.user.id, q, result.rows.length]
      );
    } else {
      await pool.query(
        'INSERT INTO search_history (query, results_count) VALUES ($1, $2)',
        [q, result.rows.length]
      );
    }
    
    res.json({
      results: result.rows,
      count: result.rows.length,
      query: q
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get single predio by ID
app.get('/api/predio/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM predios WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Predio not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get predio error:', err);
    res.status(500).json({ error: 'Error fetching predio' });
  }
});

// Get search history (per user if logged in)
app.get('/api/history', async (req, res) => {
  try {
    let result;
    if (req.user) {
      result = await pool.query(`
        SELECT query, results_count, created_at 
        FROM search_history 
        WHERE user_id = $1
        ORDER BY created_at DESC 
        LIMIT 20
      `, [req.user.id]);
    } else {
      result = await pool.query(`
        SELECT query, results_count, created_at 
        FROM search_history 
        WHERE user_id IS NULL
        ORDER BY created_at DESC 
        LIMIT 20
      `);
    }
    res.json(result.rows);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// Clear search history (per user)
app.delete('/api/history', async (req, res) => {
  try {
    if (req.user) {
      await pool.query('DELETE FROM search_history WHERE user_id = $1', [req.user.id]);
    } else {
      await pool.query('DELETE FROM search_history WHERE user_id IS NULL');
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Error clearing history' });
  }
});

// =============================================================================
// BOOKMARKS API
// =============================================================================

// Get user's bookmarks
app.get('/api/bookmarks', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  
  try {
    const result = await pool.query(`
      SELECT p.*, b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN predios p ON b.predio_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ error: 'Error fetching bookmarks' });
  }
});

// Add bookmark
app.post('/api/bookmarks/:predioId', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  
  try {
    await pool.query(
      'INSERT INTO bookmarks (user_id, predio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.predioId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ error: 'Error adding bookmark' });
  }
});

// Remove bookmark
app.delete('/api/bookmarks/:predioId', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  
  try {
    await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND predio_id = $2',
      [req.user.id, req.params.predioId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Remove bookmark error:', err);
    res.status(500).json({ error: 'Error removing bookmark' });
  }
});

// Check if predio is bookmarked
app.get('/api/bookmarks/check/:predioId', async (req, res) => {
  if (!req.user) {
    return res.json({ bookmarked: false });
  }
  
  try {
    const result = await pool.query(
      'SELECT 1 FROM bookmarks WHERE user_id = $1 AND predio_id = $2',
      [req.user.id, req.params.predioId]
    );
    res.json({ bookmarked: result.rows.length > 0 });
  } catch (err) {
    console.error('Check bookmark error:', err);
    res.status(500).json({ error: 'Error checking bookmark' });
  }
});

// Upload CSV
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const filePath = req.file.path;
  let recordsInserted = 0;
  let alcaldia = 'UNKNOWN';
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const records = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    if (records.length === 0) {
      throw new Error('No records found in CSV');
    }
    
    // Detect alcaldía from first record or filename
    alcaldia = records[0].alcaldia || 
               req.file.originalname.replace(/seduvi_|\.csv/gi, '').toUpperCase() ||
               'UNKNOWN';
    
    // Check if alcaldía already loaded
    const existingResult = await pool.query(
      'SELECT * FROM alcaldias_loaded WHERE alcaldia = $1',
      [alcaldia]
    );
    
    if (existingResult.rows.length > 0) {
      await pool.query('DELETE FROM predios WHERE UPPER(alcaldia) = UPPER($1)', [alcaldia]);
      await pool.query('DELETE FROM alcaldias_loaded WHERE alcaldia = $1', [alcaldia]);
    }
    
    // FAST BATCH INSERT
    const batchSize = 100;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const values = [];
        const placeholders = [];
        let paramIndex = 1;
        
        for (const record of batch) {
          placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12}, $${paramIndex+13}, $${paramIndex+14})`);
          values.push(
            record.alcaldia || alcaldia,
            record.calle || '',
            record.no_externo || '',
            record.colonia || '',
            record.codigo_pos || '',
            parseFloat(record.superficie) || null,
            record.uso_descri || '',
            record.densidad_d || '',
            record.niveles || '',
            record.altura || '',
            record.area_libre || '',
            record.minimo_viv || '',
            record.liga_ciuda || '',
            parseFloat(record.longitud) || null,
            parseFloat(record.latitud) || null
          );
          paramIndex += 15;
        }
        
        await client.query(`
          INSERT INTO predios (
            alcaldia, calle, no_externo, colonia, codigo_pos,
            superficie, uso_descri, densidad_d, niveles, altura,
            area_libre, minimo_viv, liga_ciuda, longitud, latitud
          ) VALUES ${placeholders.join(', ')}
        `, values);
        
        recordsInserted += batch.length;
        console.log(`Inserted ${recordsInserted}/${records.length} records...`);
      }
      
      await client.query(
        'INSERT INTO alcaldias_loaded (alcaldia, records_count) VALUES ($1, $2)',
        [alcaldia, recordsInserted]
      );
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      alcaldia,
      recordsInserted,
      message: `Successfully imported ${recordsInserted} records for ${alcaldia}`
    });
    
  } catch (err) {
    console.error('Upload error:', err);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete alcaldía data
app.delete('/api/alcaldia/:name', async (req, res) => {
  const alcaldia = req.params.name.toUpperCase();
  
  try {
    await pool.query('DELETE FROM predios WHERE UPPER(alcaldia) = $1', [alcaldia]);
    await pool.query('DELETE FROM alcaldias_loaded WHERE UPPER(alcaldia) = $1', [alcaldia]);
    res.json({ success: true, message: `Deleted data for ${alcaldia}` });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error deleting alcaldía data' });
  }
});

// =============================================================================
// REGLAMENTO DE CONSTRUCCIONES - KNOWLEDGE BASE
// =============================================================================

// Sistema de base de conocimiento del reglamento
const REGLAMENTO_CONTEXT = `
# REGLAMENTO DE CONSTRUCCIONES DE LA CIUDAD DE MÉXICO
Publicación: 29 de enero de 2004 | Última reforma: 4 de octubre de 2024

Eres un experto en normativa de construcción de la CDMX. Tu conocimiento incluye:
- Reglamento de Construcciones CDMX completo (256 artículos)
- Programas Parciales de Desarrollo Urbano (PDDU)
- Áreas de Conservación Patrimonial (ACP)  
- Normas Técnicas Complementarias

## TÍTULOS DEL REGLAMENTO:
1. DISPOSICIONES GENERALES - Definiciones, clasificación de edificaciones
2. VÍA PÚBLICA - Alineamiento, uso de vía pública
3. DIRECTORES RESPONSABLES DE OBRA (DRO) - Requisitos, responsabilidades
4. MANIFESTACIONES DE CONSTRUCCIÓN - Tipos de trámites (Registro, Licencia)
5. PROYECTO ARQUITECTÓNICO - Habitabilidad, accesibilidad, instalaciones
6. SEGURIDAD ESTRUCTURAL - Cimentación, cargas, sismo, viento
7. EJECUCIÓN DE OBRAS - Procedimientos constructivos, seguridad
8. USO, OPERACIÓN Y MANTENIMIENTO
9. AMPLIACIONES DE OBRAS
10. DEMOLICIONES
11. VISITAS, SANCIONES Y RECURSOS

## ARTÍCULOS CLAVE:
- Art. 54-60: Tipos de manifestaciones (Registro vs Licencia)
- Art. 77-78: Áreas libres mínimas
- Art. 84-86: Estacionamiento
- Art. 143-166: Accesibilidad universal
- Art. 32-51: Responsabilidades del DRO

## INSTRUCCIONES:
- Siempre cita el artículo específico del reglamento cuando aplique
- Si no estás seguro, indica que se debe consultar el artículo específico
- Menciona si se requiere DRO, corresponsable, o dictámenes especiales
- Advierte sobre restricciones de ACP, INAH, o PDDU cuando aplique
`;

// =============================================================================
// CLAUDE AI CHAT PROXY CON CONTEXTO DEL REGLAMENTO
// =============================================================================

app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt, propertyData } = req.body;
  
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    // Construir contexto enriquecido
    let enrichedSystemPrompt = REGLAMENTO_CONTEXT + '\n\n';
    
    if (systemPrompt) {
      enrichedSystemPrompt += systemPrompt + '\n\n';
    }
    
    // Agregar datos del predio si están disponibles
    if (propertyData) {
      enrichedSystemPrompt += `\n## DATOS DEL PREDIO EN CONSULTA:\n`;
      enrichedSystemPrompt += `- Dirección: ${propertyData.calle} ${propertyData.no_externo}\n`;
      enrichedSystemPrompt += `- Colonia: ${propertyData.colonia}\n`;
      enrichedSystemPrompt += `- Alcaldía: ${propertyData.alcaldia}\n`;
      enrichedSystemPrompt += `- Zonificación: ${propertyData.uso_descri}\n`;
      enrichedSystemPrompt += `- Superficie: ${propertyData.superficie} m²\n`;
      if (propertyData.niveles) enrichedSystemPrompt += `- Niveles permitidos: ${propertyData.niveles}\n`;
      if (propertyData.altura) enrichedSystemPrompt += `- Altura máxima: ${propertyData.altura}\n`;
      if (propertyData.area_libre) enrichedSystemPrompt += `- Área libre: ${propertyData.area_libre}\n`;
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: enrichedSystemPrompt,
        messages: messages
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
    
    res.json({ content: data.content[0].text });
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// =============================================================================
// ENDPOINTS DEL REGLAMENTO Y TRAMITOLOGÍA
// =============================================================================

// Buscar artículos del reglamento
app.get('/api/reglamento/articulo/:numero', async (req, res) => {
  try {
    const articulosPath = path.join(__dirname, 'data', 'articulos_index.json');
    if (!fs.existsSync(articulosPath)) {
      return res.status(404).json({ error: 'Base de datos del reglamento no encontrada' });
    }
    
    const articulos = JSON.parse(fs.readFileSync(articulosPath, 'utf-8'));
    const articulo = articulos.find(a => a.articulo === req.params.numero);
    
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    res.json(articulo);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar reglamento' });
  }
});

// Buscar por palabra clave
app.get('/api/reglamento/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    const articulosPath = path.join(__dirname, 'data', 'articulos_index.json');
    
    if (!fs.existsSync(articulosPath)) {
      return res.status(404).json({ error: 'Base de datos del reglamento no encontrada' });
    }
    
    const articulos = JSON.parse(fs.readFileSync(articulosPath, 'utf-8'));
    
    const results = articulos.filter(a =>
      a.texto.toLowerCase().includes(q.toLowerCase()) ||
      a.titulo.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({ results: results.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

// Generar checklist de trámites
app.post('/api/tramites/checklist', async (req, res) => {
  try {
    const { superficie, niveles, uso, colonia, alcaldia } = req.body;
    
    const checklist = {
      preConstruccion: [],
      registro: [],
      permisos: [],
      postConstruccion: [],
      alertasEspeciales: [],
      costoEstimado: 0,
      tiempoEstimado: '30-60 días hábiles'
    };
    
    // FASE 1: PRE-CONSTRUCCIÓN (siempre)
    checklist.preConstruccion.push({
      nombre: 'Constancia de Alineamiento y Número Oficial',
      costo: 800,
      tiempo: '3-5 días',
      ventanilla: `SEDUVI ${alcaldia}`,
      requisitos: ['Identificación oficial', 'Comprobante de propiedad', 'Pago de predial']
    });
    
    checklist.preConstruccion.push({
      nombre: 'Certificado de Zonificación (CEUZ)',
      costo: 1800,
      tiempo: '5-10 días',
      ventanilla: 'SEDUVI Central',
      requisitos: ['Constancia de alineamiento vigente', 'Pago de derechos']
    });
    
    // FASE 2: REGISTRO/LICENCIA
    const superficieNum = parseFloat(superficie) || 0;
    const nivelesNum = parseInt(niveles) || 1;
    
    if (superficieNum <= 60 && nivelesNum <= 2) {
      // Obra menor - solo manifestación
      checklist.registro.push({
        nombre: 'Registro de Manifestación de Construcción Tipo C (Obra Menor)',
        costo: 2500,
        tiempo: '3-5 días',
        ventanilla: `SEDUVI ${alcaldia}`,
        articulo: 'Art. 57',
        requisitos: ['Proyecto arquitectónico', 'CEUZ vigente', 'DRO no requerido']
      });
    } else {
      // Obra mayor - licencia
      checklist.registro.push({
        nombre: 'Licencia de Construcción Tipo A',
        costo: superficieNum * 45, // Aproximado
        tiempo: '10-20 días',
        ventanilla: `SEDUVI ${alcaldia}`,
        articulo: 'Art. 55',
        requisitos: [
          'Proyecto ejecutivo firmado por DRO',
          'Memoria de cálculo estructural',
          'CEUZ vigente',
          'Pago de derechos'
        ]
      });
      
      checklist.alertasEspeciales.push({
        tipo: 'DRO Requerido',
        mensaje: 'Se requiere Director Responsable de Obra (DRO) registrado',
        articulo: 'Art. 32-36'
      });
    }
    
    // Verificar si requiere Dictamen de Impacto Urbano
    if (superficieNum > 5000) {
      checklist.permisos.push({
        nombre: 'Dictamen de Impacto Urbano (DUI)',
        costo: 15000,
        tiempo: '30-45 días',
        ventanilla: 'SEDUVI Central',
        requisitos: ['Estudio de impacto urbano', 'DRO especializado']
      });
    }
    
    // FASE 3: PERMISOS ESPECIALES
    
    // Área de Conservación Patrimonial
    const ACP_COLONIAS = ['ROMA NORTE', 'ROMA SUR', 'CONDESA', 'CENTRO', 'CENTRO HISTORICO', 
                          'JUAREZ', 'POLANCO', 'SAN ANGEL', 'COYOACAN'];
    
    if (ACP_COLONIAS.includes(colonia?.toUpperCase())) {
      checklist.alertasEspeciales.push({
        tipo: 'Área de Conservación Patrimonial (ACP)',
        mensaje: 'Requiere dictamen de la Dirección del Patrimonio Cultural Urbano de SEDUVI',
        requisitos: [
          'Proyecto respetuoso con el contexto',
          'Materiales y acabados acordes',
          'Posible restricción de alturas'
        ]
      });
      
      checklist.permisos.push({
        nombre: 'Dictamen ACP',
        costo: 5000,
        tiempo: '15-20 días',
        ventanilla: 'SEDUVI - Dirección de Patrimonio Cultural Urbano'
      });
    }
    
    // FASE 4: POST-CONSTRUCCIÓN
    checklist.postConstruccion.push({
      nombre: 'Aviso de Terminación de Obra',
      costo: 0,
      tiempo: '1 día',
      ventanilla: `SEDUVI ${alcaldia}`,
      requisitos: ['Bitácora de obra', 'Fotografías']
    });
    
    if (uso?.toLowerCase().includes('condominio') || uso?.toLowerCase().includes('departamento')) {
      checklist.postConstruccion.push({
        nombre: 'Declaratoria de Régimen de Propiedad en Condominio',
        costo: 8000,
        tiempo: '20-30 días',
        ventanilla: 'Notaría + Registro Público',
        requisitos: ['Planos arquitectónicos', 'Aviso de terminación']
      });
    }
    
    // Calcular totales
    checklist.costoEstimado = 
      checklist.preConstruccion.reduce((sum, t) => sum + t.costo, 0) +
      checklist.registro.reduce((sum, t) => sum + t.costo, 0) +
      checklist.permisos.reduce((sum, t) => sum + t.costo, 0) +
      checklist.postConstruccion.reduce((sum, t) => sum + t.costo, 0);
    
    res.json(checklist);
  } catch (err) {
    console.error('Error generando checklist:', err);
    res.status(500).json({ error: 'Error generando checklist' });
  }
});

// =============================================================================
// SERVE STATIC FILES (Production)
// =============================================================================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// =============================================================================
// START SERVER
// =============================================================================

async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           SEDUVI CDMX - Server Running                       ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                   ║
║  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                ║
║  Google OAuth: ${GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}                             ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();
