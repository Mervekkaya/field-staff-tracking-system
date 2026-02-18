const express = require('express');
const router = express.Router();
const {
  getAllAreas,
  createArea,
  updateArea,
  deleteArea
} = require('../controllers/areaController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Tüm bölgeleri getir (admin)
router.get('/', authenticateToken, isAdmin, getAllAreas);

// Yeni bölge oluştur (admin)
router.post('/', authenticateToken, isAdmin, createArea);

// Bölge güncelle (admin)
router.put('/:areaId', authenticateToken, isAdmin, updateArea);

// Bölge sil (admin)
router.delete('/:areaId', authenticateToken, isAdmin, deleteArea);

module.exports = router;
