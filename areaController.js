const Area = require('../models/Area');

// Tüm bölgeleri getir
const getAllAreas = async (req, res) => {
  try {
    const areas = await Area.findAll();
    
    res.json({
      message: 'Bölgeler başarıyla getirildi',
      areas,
      count: areas.length
    });
  } catch (error) {
    console.error('GetAllAreas error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Yeni bölge oluştur
const createArea = async (req, res) => {
  try {
    const { name, coordinates, color } = req.body;
    const userId = req.user.id;

    if (!name || !coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        message: 'İsim ve koordinatlar gerekli',
        error: 'MISSING_FIELDS'
      });
    }

    const area = await Area.create(name, coordinates, color || '#7f007f', userId);

    res.status(201).json({
      message: 'Bölge başarıyla oluşturuldu',
      area
    });
  } catch (error) {
    console.error('CreateArea error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Bölge güncelle
const updateArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { name, coordinates, color } = req.body;

    if (!name || !coordinates) {
      return res.status(400).json({
        message: 'İsim ve koordinatlar gerekli',
        error: 'MISSING_FIELDS'
      });
    }

    const area = await Area.update(areaId, name, coordinates, color || '#7f007f');

    if (!area) {
      return res.status(404).json({
        message: 'Bölge bulunamadı',
        error: 'AREA_NOT_FOUND'
      });
    }

    res.json({
      message: 'Bölge başarıyla güncellendi',
      area
    });
  } catch (error) {
    console.error('UpdateArea error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Bölge sil
const deleteArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    const result = await Area.delete(areaId);

    if (!result) {
      return res.status(404).json({
        message: 'Bölge bulunamadı',
        error: 'AREA_NOT_FOUND'
      });
    }

    res.json({
      message: 'Bölge başarıyla silindi'
    });
  } catch (error) {
    console.error('DeleteArea error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getAllAreas,
  createArea,
  updateArea,
  deleteArea
};
