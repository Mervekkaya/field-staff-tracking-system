import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

function TrackingPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserLocations();
  }, [userId]);

  const fetchUserLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setLocations(data.locations);
      } else {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
        setError(errorData.message || 'Konum bilgileri yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı');
      console.error('Fetch locations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {user ? `Konum İzleme: ${user.email}` : 'Konum İzleme'}
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          Geri Dön
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Kullanıcı Konumları
                </Typography>
                
                {locations.length === 0 ? (
                  <Typography>Kullanıcının henüz konum bilgisi bulunmamaktadır.</Typography>
                ) : (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Son {locations.length} Konum Kaydı
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Enlem</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Boylam</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Zaman</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locations.map((location) => (
                            <tr key={location.id}>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                {location.latitude.toFixed(6)}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                {location.longitude.toFixed(6)}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                {new Date(location.timestamp).toLocaleString('tr-TR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default TrackingPage;