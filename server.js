require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { Pool } = require('pg');
const multer = require('multer');
const { parse } = require('csv-parse');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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
    await client.query(`
      CREATE TABLE IF NOT EXISTS predios (
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

      CREATE INDEX IF NOT EXISTS idx_predios_calle ON predios(calle);
      CREATE INDEX IF NOT EXISTS idx_predios_colonia ON predios(colonia);
      CREATE INDEX IF NOT EXISTS idx_predios_alcaldia ON predios(alcaldia);
      CREATE INDEX IF NOT EXISTS idx_predios_codigo_pos ON predios(codigo_pos);
      
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        query VARCHAR(255),
        results_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alcaldias_loaded (
        id SERIAL PRIMARY KEY,
        alcaldia VARCHAR(100) UNIQUE,
        records_count INTEGER,
        loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
    
    // Save to search history
    await pool.query(
      'INSERT INTO search_history (query, results_count) VALUES ($1, $2)',
      [q, result.rows.length]
    );
    
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

// Get search history
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT query, results_count, created_at 
      FROM search_history 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// Clear search history
app.delete('/api/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM search_history');
    res.json({ success: true });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Error clearing history' });
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
      // Delete existing records for this alcaldía
      await pool.query('DELETE FROM predios WHERE UPPER(alcaldia) = UPPER($1)', [alcaldia]);
      await pool.query('DELETE FROM alcaldias_loaded WHERE alcaldia = $1', [alcaldia]);
    }
    
    // Insert records in batches
    const batchSize = 1000;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (const record of batch) {
          await client.query(`
            INSERT INTO predios (
              alcaldia, calle, no_externo, colonia, codigo_pos,
              superficie, uso_descri, densidad_d, niveles, altura,
              area_libre, minimo_viv, liga_ciuda, longitud, latitud
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            record.alcaldia || alcaldia,
            record.calle,
            record.no_externo,
            record.colonia,
            record.codigo_pos,
            parseFloat(record.superficie) || null,
            record.uso_descri,
            record.densidad_d,
            record.niveles,
            record.altura,
            record.area_libre,
            record.minimo_viv,
            record.liga_ciuda,
            parseFloat(record.longitud) || null,
            parseFloat(record.latitud) || null
          ]);
          recordsInserted++;
        }
        
        console.log(`Inserted ${Math.min(i + batchSize, records.length)}/${records.length} records...`);
      }
      
      // Record the loaded alcaldía
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
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      alcaldia,
      recordsInserted,
      message: `Successfully imported ${recordsInserted} records for ${alcaldia}`
    });
    
  } catch (err) {
    console.error('Upload error:', err);
    // Clean up on error
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
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();
