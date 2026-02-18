const { pool } = require('../config/database');

class Location {
  // Konum kaydet
  static async create(userId, locationData) {
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp
    } = locationData;

    const query = `
      INSERT INTO locations (
        user_id, latitude, longitude, accuracy, 
        altitude, speed, heading, timestamp, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;

    const values = [
      userId,
      latitude,
      longitude,
      accuracy || null,
      altitude || null,
      speed || null,
      heading || null,
      timestamp || new Date()
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Toplu konum kaydet
  static async createBulk(userId, locations) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertedLocations = [];
      
      for (const location of locations) {
        const query = `
          INSERT INTO locations (
            user_id, latitude, longitude, accuracy, 
            altitude, speed, heading, timestamp, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *;
        `;

        const values = [
          userId,
          location.latitude,
          location.longitude,
          location.accuracy || null,
          location.altitude || null,
          location.speed || null,
          location.heading || null,
          location.timestamp || new Date()
        ];

        const result = await client.query(query, values);
        insertedLocations.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return insertedLocations;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Kullanıcının tüm konumlarını getir
  static async findByUserId(userId, limit = 100) {
    const query = `
      SELECT * FROM locations 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Tarih aralığına göre konumları getir
  static async findByDateRange(userId, startDate, endDate) {
    const query = `
      SELECT * FROM locations 
      WHERE user_id = $1 
        AND timestamp >= $2 
        AND timestamp <= $3
      ORDER BY timestamp ASC
    `;
    
    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  // Son konumu getir
  static async findLatest(userId) {
    const query = `
      SELECT * FROM locations 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Tüm kullanıcıların son konumlarını getir (admin için)
  static async findAllLatest() {
    const query = `
      SELECT DISTINCT ON (user_id) 
        l.*, u.email 
      FROM locations l
      JOIN users u ON l.user_id = u.id
      ORDER BY user_id, timestamp DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Konum sayısı
  static async count(userId = null) {
    let query = 'SELECT COUNT(*) as count FROM locations';
    const values = [];
    
    if (userId) {
      query += ' WHERE user_id = $1';
      values.push(userId);
    }
    
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  // Eski konumları sil (temizlik için)
  static async deleteOlderThan(days) {
    const query = `
      DELETE FROM locations 
      WHERE timestamp < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;
    
    const result = await pool.query(query);
    return result.rowCount;
  }
}

module.exports = Location;
