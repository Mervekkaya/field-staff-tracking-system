const { pool } = require('../config/database');

class Area {
  // Bölge oluştur
  static async create(name, coordinates, color = '#7f007f', createdBy = null) {
    const query = `
      INSERT INTO defined_area (name, coordinates, color, created_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;

    const result = await pool.query(query, [
      name,
      JSON.stringify(coordinates),
      color,
      createdBy
    ]);

    return result.rows[0];
  }

  // Tüm bölgeleri getir
  static async findAll() {
    const query = `
      SELECT a.*, u.email as created_by_email
      FROM defined_area a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      coordinates: typeof row.coordinates === 'string'
        ? JSON.parse(row.coordinates)
        : row.coordinates
    }));
  }

  // ID ile bölge bul
  static async findById(id) {
    const query = 'SELECT * FROM defined_area WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) return null;

    const area = result.rows[0];
    return {
      ...area,
      coordinates: typeof area.coordinates === 'string'
        ? JSON.parse(area.coordinates)
        : area.coordinates
    };
  }

  // Bölge güncelle
  static async update(id, name, coordinates, color) {
    const query = `
      UPDATE defined_area 
      SET name = $1, coordinates = $2, color = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;

    const result = await pool.query(query, [
      name,
      JSON.stringify(coordinates),
      color,
      id
    ]);

    if (result.rows.length === 0) return null;

    const area = result.rows[0];
    return {
      ...area,
      coordinates: typeof area.coordinates === 'string'
        ? JSON.parse(area.coordinates)
        : area.coordinates
    };
  }

  // Bölge sil
  static async delete(id) {
    const query = 'DELETE FROM defined_area WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Bölge sayısı
  static async count() {
    const query = 'SELECT COUNT(*) as count FROM defined_area';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Area;
