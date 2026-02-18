import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

function MapPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnAreas, setDrawnAreas] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const polygonsRef = useRef([]);

  useEffect(() => {
    loadGoogleMapsScript();
    fetchAllUsersWithLocations();
    fetchSavedAreas();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAllUsersWithLocations();
      }, 10000); // Her 10 saniyede bir güncelle
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadGoogleMapsScript = async () => {
    if (window.google) {
      initMap();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/config/google-maps-key', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('API anahtarı alınamadı');
      }

      const data = await response.json();
      const apiKey = data.apiKey;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } catch (err) {
      setError('Google Maps yüklenirken hata oluştu. API anahtarı geçersiz olabilir.');
      console.error('Google Maps script load error:', err);
    }
  };

  const initMap = () => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 41.0082, lng: 28.9784 }, // İstanbul
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    googleMapRef.current = map;

    // Drawing Manager
    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#7f007f',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#7f007f',
        clickable: true,
        editable: true,
        zIndex: 1
      }
    });

    drawingManager.setMap(map);

    window.google.maps.event.addListener(drawingManager, 'polygoncomplete', async (polygon) => {
      const path = polygon.getPath();
      const coordinates = [];
      for (let i = 0; i < path.getLength(); i++) {
        coordinates.push({
          lat: path.getAt(i).lat(),
          lng: path.getAt(i).lng()
        });
      }
      
      const areaName = prompt('Bu bölge için bir isim girin:');
      if (areaName) {
        const newArea = {
          id: Date.now(),
          name: areaName,
          coordinates: coordinates,
          color: '#7f007f',
          polygon: polygon
        };
        
        // Backend'e kaydet
        const savedArea = await saveAreaToBackend(newArea);
        if (savedArea) {
          newArea.id = savedArea.id; // Backend'den gelen gerçek ID'yi kullan
        }
        
        setDrawnAreas(prev => [...prev, newArea]);
        polygonsRef.current.push(polygon);
      } else {
        polygon.setMap(null); // İsim verilmezse polygon'u sil
      }
      
      drawingManager.setDrawingMode(null);
      setDrawingMode(false);
    });

    window.drawingManager = drawingManager;
  };

  const fetchSavedAreas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/api/areas', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const areas = data.areas.map(area => ({
          id: area.id,
          name: area.name,
          coordinates: area.coordinates,
          color: area.color || '#7f007f',
          polygon: null // Will be created when map loads
        }));
        setDrawnAreas(areas);
        
        // Draw areas on map if map is ready
        if (googleMapRef.current) {
          drawSavedAreas(areas);
        }
      }
    } catch (err) {
      console.error('Fetch saved areas error:', err);
    }
  };

  const drawSavedAreas = (areas) => {
    if (!googleMapRef.current) return;

    areas.forEach(area => {
      const polygon = new window.google.maps.Polygon({
        paths: area.coordinates,
        fillColor: area.color,
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: area.color,
        clickable: true,
        editable: false,
        map: googleMapRef.current
      });

      area.polygon = polygon;
      polygonsRef.current.push(polygon);
    });
  };

  const saveAreaToBackend = async (area) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: area.name,
          coordinates: area.coordinates,
          color: area.color || '#7f007f'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bölge kaydedildi:', data.area);
        return data.area;
      }
    } catch (error) {
      console.error('❌ Bölge kaydetme hatası:', error);
    }
  };

  const deleteAreaFromBackend = async (areaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/areas/${areaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Bölge silindi');
        return true;
      }
    } catch (error) {
      console.error('❌ Bölge silme hatası:', error);
    }
    return false;
  };

  const fetchAllUsersWithLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:3000/api/admin/users-with-locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        updateMapMarkers(data.users);
      } else {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
        setError(errorData.message || 'Kullanıcı bilgileri yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (usersData) => {
    if (!googleMapRef.current) return;

    // Eski markerları temizle
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasLocations = false;

    usersData.forEach((user, index) => {
      if (user.latitude && user.longitude) {
        hasLocations = true;
        
        // Kullanıcı için renk seç
        const colors = ['#7f007f', '#bf00bf', '#4facfe', '#f093fb', '#667eea'];
        const color = colors[index % colors.length];

        // Custom marker icon
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(user.latitude), lng: parseFloat(user.longitude) },
          map: googleMapRef.current,
          title: user.email,
          label: {
            text: user.email.charAt(0).toUpperCase(),
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3,
          },
          animation: window.google.maps.Animation.DROP,
        });

        // Info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 10px 0; color: #7f007f;">${user.email}</h3>
              <p style="margin: 5px 0;"><strong>Rol:</strong> ${user.role === 'admin' ? '👨‍💼 Admin' : '👤 Kullanıcı'}</p>
              <p style="margin: 5px 0;"><strong>Tanımlı Alan:</strong> ${user.defined_area || 'Tanımsız'}</p>
              <p style="margin: 5px 0;"><strong>Son Güncelleme:</strong> ${user.last_location_timestamp ? new Date(user.last_location_timestamp).toLocaleString('tr-TR') : 'Bilinmiyor'}</p>
              <button onclick="window.trackUser(${user.id})" style="margin-top: 10px; padding: 8px 16px; background: #7f007f; color: white; border: none; border-radius: 4px; cursor: pointer;">
                📍 Detaylı İzle
              </button>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
          setSelectedUser(user);
        });

        markersRef.current.push(marker);
        bounds.extend(marker.getPosition());
      }
    });

    if (hasLocations) {
      googleMapRef.current.fitBounds(bounds);
    }
  };

  // Global function for tracking user
  window.trackUser = (userId) => {
    navigate(`/tracking/${userId}`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    fetchAllUsersWithLocations();
  };

  const toggleDrawingMode = () => {
    if (!window.drawingManager) return;
    
    const newMode = !drawingMode;
    setDrawingMode(newMode);
    
    if (newMode) {
      window.drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    } else {
      window.drawingManager.setDrawingMode(null);
    }
  };

  const deleteArea = async (areaId) => {
    // Backend'den sil
    const deleted = await deleteAreaFromBackend(areaId);
    
    if (deleted) {
      // Haritadan sil
      const area = drawnAreas.find(a => a.id === areaId);
      if (area && area.polygon) {
        area.polygon.setMap(null);
      }
      setDrawnAreas(prev => prev.filter(a => a.id !== areaId));
      polygonsRef.current = polygonsRef.current.filter(p => p !== area?.polygon);
    }
  };

  const getUsersWithLocation = () => users.filter(u => u.latitude && u.longitude);
  const getUsersWithoutLocation = () => users.filter(u => !u.latitude || !u.longitude);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: 320,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
            backgroundColor: 'white',
            borderRight: '2px solid #7f007f',
          },
        }}
      >
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #7f007f 0%, #bf00bf 100%)', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            🗺️ Harita Kontrol Paneli
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="secondary"
              />
            }
            label="🔄 Otomatik Güncelleme (10sn)"
          />
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#7f007f' }}>
            📊 İstatistikler
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Toplam: ${users.length}`}
              color="primary"
              size="small"
            />
            <Chip
              label={`Konumlu: ${getUsersWithLocation().length}`}
              color="success"
              size="small"
            />
            <Chip
              label={`Konumsuz: ${getUsersWithoutLocation().length}`}
              color="default"
              size="small"
            />
          </Box>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#7f007f' }}>
            🎨 Bölge Çizimi
          </Typography>
          <Button
            fullWidth
            variant={drawingMode ? "contained" : "outlined"}
            startIcon={<DrawIcon />}
            onClick={toggleDrawingMode}
            sx={{
              mb: 1,
              borderColor: '#7f007f',
              color: drawingMode ? 'white' : '#7f007f',
              backgroundColor: drawingMode ? '#7f007f' : 'transparent',
              '&:hover': {
                backgroundColor: drawingMode ? '#bf00bf' : 'rgba(127, 0, 127, 0.05)',
              },
            }}
          >
            {drawingMode ? 'Çizimi Bitir' : 'Bölge Çiz'}
          </Button>

          {drawnAreas.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Çizilen Bölgeler:
              </Typography>
              <List dense>
                {drawnAreas.map(area => (
                  <ListItem
                    key={area.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => deleteArea(area.id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={area.name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        <Divider />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#7f007f' }}>
            👥 Kullanıcılar ({getUsersWithLocation().length})
          </Typography>
          <List dense>
            {getUsersWithLocation().map((user, index) => {
              const colors = ['#7f007f', '#bf00bf', '#4facfe', '#f093fb', '#667eea'];
              const color = colors[index % colors.length];
              
              return (
                <ListItem
                  key={user.id}
                  button
                  selected={selectedUser?.id === user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    if (googleMapRef.current && user.latitude && user.longitude) {
                      googleMapRef.current.panTo({
                        lat: parseFloat(user.latitude),
                        lng: parseFloat(user.longitude)
                      });
                      googleMapRef.current.setZoom(15);
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(127, 0, 127, 0.1)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <LocationOnIcon sx={{ fontSize: 16, color: color }} />
                      }
                    >
                      <Avatar sx={{ bgcolor: color, width: 32, height: 32 }}>
                        {user.email.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.email}
                    secondary={user.defined_area || 'Tanımsız'}
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #7f007f 0%, #bf00bf 100%)',
            color: 'white',
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleBack} sx={{ color: 'white' }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  🗺️ Gerçek Zamanlı Harita
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {getUsersWithLocation().length} kullanıcı haritada gösteriliyor
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title="Yenile">
                <IconButton onClick={handleRefresh} sx={{ color: 'white', mr: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                onClick={() => setDrawerOpen(!drawerOpen)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                {drawerOpen ? '◀ Gizle' : '▶ Göster'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Map Container */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 'calc(100vh - 100px)',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default MapPage;
