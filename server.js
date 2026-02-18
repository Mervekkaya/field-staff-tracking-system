const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { authenticateToken, isAdmin } = require('./middleware/auth');
const dotenv = require('dotenv');
const { pool, testConnection } = require('./config/database');

// Environment variables yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS (Web Panel ve Mobil App için)
// Geliştirme ortamında tüm origin'lere izin ver (güvenlik için production'da kısıtla)
const allowedOrigins = [
    'http://localhost:19006',  // Mobil App (Expo)
    'http://localhost:5173',   // Web Admin Panel (Vite)
    'http://localhost:3000',   // Geliştirme
    process.env.FRONTEND_URL   // .env'den gelen URL
].filter(Boolean); // undefined olanları filtrele

app.use(cors({
    origin: function (origin, callback) {
        // Geliştirme ortamında tüm origin'lere izin ver
        if (process.env.NODE_ENV === 'development' || !origin) {
            callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Mobil uygulamalar için de izin ver (origin undefined olabilir)
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Konum Takip Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        message: 'Server bağlantısı başarılı!',
        timestamp: new Date().toISOString(),
        server_time: new Date().toLocaleString('tr-TR'),
        status: 'OK'
    });
});

// Database migration endpoint
app.post('/admin/migrate', async (req, res) => {
    try {
        console.log('🔄 Database migration başlatılıyor...');
        
        // Users tablosuna role kolonu ekle (eğer yoksa)
        const addRoleColumnQuery = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' NOT NULL;
        `;
        
        await pool.query(addRoleColumnQuery);
        console.log('✅ Role kolonu eklendi/kontrol edildi');
        
        // Mevcut kullanıcıların role'ünü güncelle
        const updateExistingUsersQuery = `
            UPDATE users 
            SET role = 'user' 
            WHERE role IS NULL OR role = '';
        `;
        
        const updateResult = await pool.query(updateExistingUsersQuery);
        console.log(`✅ ${updateResult.rowCount} kullanıcının role'ü güncellendi`);
        
        // Tablo yapısını kontrol et
        const tableInfoQuery = `
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `;
        
        const tableInfo = await pool.query(tableInfoQuery);
        
        res.json({
            message: 'Database migration başarılı!',
            changes: [
                'Role kolonu eklendi/kontrol edildi',
                `${updateResult.rowCount} kullanıcının role'ü güncellendi`
            ],
            table_structure: tableInfo.rows,
            timestamp: new Date().toISOString(),
            status: 'OK'
        });
        
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            message: 'Migration hatası!',
            error: error.message,
            status: 'ERROR'
        });
    }
});

// Database test endpoint
app.get('/test/database', async (req, res) => {
    try {
        const isConnected = await testConnection();
        
        if (isConnected) {
            // Tabloları kontrol et
            const tablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `;
            
            const result = await pool.query(tablesQuery);
            const tables = result.rows.map(row => row.table_name);
            
            let userCount = 0;
            let locationCount = 0;

            // Kullanıcı sayısını güvenli bir şekilde kontrol et
            try {
                if (tables.includes('users')) {
                    const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
                    userCount = userResult.rows[0].count;
                }
            } catch (e) { /* Tablo yoksa veya hata olursa sayımı 0 olarak bırak */ }

            // Konum sayısını güvenli bir şekilde kontrol et
            try {
                if (tables.includes('locations')) {
                    const locationResult = await pool.query('SELECT COUNT(*) as count FROM locations');
                    locationCount = locationResult.rows[0].count;
                }
            } catch (e) { /* Tablo yoksa veya hata olursa sayımı 0 olarak bırak */ }


            res.json({
                message: 'PostgreSQL bağlantısı başarılı!',
                database: process.env.DB_NAME,
                tables: tables,
                data: {
                    users: parseInt(userCount),
                    locations: parseInt(locationCount)
                },
                timestamp: new Date().toISOString(),
                status: 'OK'
            });
        } else {
            res.status(500).json({
                message: 'Veritabanı bağlantısı başarısız!',
                status: 'ERROR'
            });
        }
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            message: 'Veritabanı test hatası!',
            error: error.message,
            status: 'ERROR'
        });
    }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/config', require('./routes/config'));

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler - route'lardan sonra, error handler'dan önce
app.use(notFoundHandler);

// Global error handler - en sonda
app.use(errorHandler);

// Server başlat
app.listen(PORT, async () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL}`);
    console.log(`📅 Başlatma zamanı: ${new Date().toLocaleString()}`);
    
    // Veritabanı bağlantısını test et
    console.log('\n🔄 Veritabanı bağlantısı test ediliyor...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
        console.log('✅ PostgreSQL bağlantısı başarılı!');
        console.log(`📊 Veritabanı: ${process.env.DB_NAME}`);
        console.log(`🔗 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    } else {
        console.log('❌ PostgreSQL bağlantısı başarısız!');
        console.log('⚠️  Veritabanı ayarlarını kontrol edin (.env dosyası)');
    }
    
    console.log('\n📋 Test URL\'leri:');
    console.log(`   Server Test: http://localhost:${PORT}/test`);
    console.log(`   DB Test: http://localhost:${PORT}/test/database`);
    console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = app;