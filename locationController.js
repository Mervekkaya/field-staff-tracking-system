const Location = require('../models/Location');

// Kullanıcı konumunu kaydet
const saveLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const locationData = req.body;

    // Konumu kaydet
    const location = await Location.create(userId, locationData);

    res.status(201).json({
      message: 'Konum başarıyla kaydedildi',
      location
    });

  } catch (error) {
    console.error('SaveLocation error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Kullanıcının son konumlarını getir
const getUserRecentLocations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;

    const locations = await Location.findByUserId(userId, limit);

    res.json({
      message: 'Son konumlar başarıyla getirildi',
      locations,
      count: locations.length
    });

  } catch (error) {
    console.error('GetUserRecentLocations error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Toplu konum kaydet
const saveBulkLocations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { locations } = req.body;

    const savedLocations = await Location.createBulk(userId, locations);

    res.status(201).json({
      message: `${savedLocations.length} konum başarıyla kaydedildi`,
      locations: savedLocations,
      count: savedLocations.length
    });

  } catch (error) {
    console.error('SaveBulkLocations error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Tarih aralığına göre konumları getir
const getLocationsByDateRange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Başlangıç ve bitiş tarihi gerekli',
        error: 'MISSING_DATES'
      });
    }

    const locations = await Location.findByDateRange(userId, startDate, endDate);

    res.json({
      message: 'Konumlar başarıyla getirildi',
      locations,
      count: locations.length,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('GetLocationsByDateRange error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Son konumu getir
const getLatestLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const location = await Location.findLatest(userId);

    if (!location) {
      return res.status(404).json({
        message: 'Konum bulunamadı',
        error: 'NO_LOCATION_FOUND'
      });
    }

    res.json({
      message: 'Son konum başarıyla getirildi',
      location
    });

  } catch (error) {
    console.error('GetLatestLocation error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  saveLocation,
  saveBulkLocations,
  getUserRecentLocations,
  getLocationsByDateRange,
  getLatestLocation
};