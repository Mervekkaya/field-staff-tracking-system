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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    role: 'user',
    defined_area: ''
  });

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // Fetch user details
      const userResponse = await fetch(`http://localhost:3000/api/admin/users/${userId}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        setLocations(userData.locations);
        setEditForm({
          email: userData.user.email,
          role: userData.user.role || 'user',
          defined_area: userData.user.defined_area || ''
        });
      } else {
        const errorData = await userResponse.json(); 
        if (userResponse.status === 401 || userResponse.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
        setError(errorData.message || 'Kullanıcı bilgileri yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı');
      console.error('Fetch user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editForm.email,
          role: editForm.role,
          defined_area: editForm.defined_area
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Kullanıcı bilgileri güncellendi!');
        handleCloseEditDialog();

        // Refresh user data
        fetchUserDetails();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Kullanıcı güncellenirken hata oluştu');
      }
    } catch (err) {
      setError('Kullanıcı güncellenirken hata oluştu');
      console.error('Update user error:', err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 3 }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            p: 3,
            background: 'linear-gradient(135deg, #7f007f 0%, #bf00bf 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              👤 {user ? user.email : 'Kullanıcı Profili'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Kullanıcı Detayları ve Düzenleme
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleBack}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            ← Geri Dön
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {user && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ color: '#7f007f', fontWeight: 'bold' }}>
                    📋 Kullanıcı Bilgileri
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>ID</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>#{user.id}</Typography>
                    </Box>

                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>📧 Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{user.email}</Typography>
                    </Box>

                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>👤 Rol</Typography>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          mt: 0.5,
                          borderRadius: 2,
                          backgroundColor: user.role === 'admin' ? '#f093fb' : '#4facfe',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {user.role === 'admin' ? '👨‍💼 Admin' : '👤 Kullanıcı'}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>📍 Tanımlı Alan</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {user.defined_area || '🚫 Tanımsız'}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>📅 Kayıt Tarihi</Typography>
                      <Typography variant="body2">
                        {new Date(user.created_at).toLocaleString('tr-TR')}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleOpenEditDialog}
                    sx={{
                      backgroundColor: '#7f007f',
                      '&:hover': {
                        backgroundColor: '#bf00bf',
                      },
                      py: 1.5,
                      fontWeight: 'bold',
                    }}
                  >
                    ✏️ Düzenle
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ color: '#7f007f', fontWeight: 'bold' }}>
                    📍 Konum Geçmişi ({locations.length} kayıt)
                  </Typography>

                  {locations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="h6" sx={{ color: '#999', mb: 2 }}>
                        🗺️ Henüz konum bilgisi yok
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Kullanıcı mobil uygulamayı kullanmaya başladığında konumlar burada görünecek.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#7f007f', color: 'white' }}>
                            <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>📍 Enlem</th>
                            <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>📍 Boylam</th>
                            <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>🕐 Zaman</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locations.map((location, index) => (
                            <tr
                              key={location.id}
                              style={{
                                backgroundColor: index % 2 === 0 ? 'rgba(127, 0, 127, 0.02)' : 'white',
                              }}
                            >
                              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                {location.latitude.toFixed(6)}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                {location.longitude.toFixed(6)}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                {new Date(location.timestamp).toLocaleString('tr-TR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Edit User Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ color: '#7f007f', fontWeight: 'bold', fontSize: '1.5rem' }}>
            ✏️ Kullanıcıyı Düzenle
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                💡 Düzenleme İpuçları:
              </Typography>
              <Typography variant="body2" component="div">
                • Email değişikliği kullanıcıya bildirilmelidir<br />
                • Rol değişikliği hemen etkili olur<br />
                • Tanımlı alan departman/bölge değişikliklerinde güncellenebilir
              </Typography>
            </Alert>

            <TextField
              autoFocus
              margin="dense"
              label="📧 Email Adresi"
              type="email"
              fullWidth
              value={editForm.email}
              onChange={(e) => handleEditFormChange('email', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#7f007f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7f007f',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7f007f',
                },
              }}
            />

            <FormControl
              fullWidth
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#7f007f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7f007f',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7f007f',
                },
              }}
            >
              <InputLabel>👤 Kullanıcı Rolü</InputLabel>
              <Select
                value={editForm.role}
                label="👤 Kullanıcı Rolü"
                onChange={(e) => handleEditFormChange('role', e.target.value)}
              >
                <MenuItem value="user">👤 Kullanıcı (Mobil Uygulama)</MenuItem>
                <MenuItem value="admin">👨‍💼 Admin (Web Panel)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="📍 Tanımlı Alan / Departman"
              type="text"
              fullWidth
              value={editForm.defined_area}
              onChange={(e) => handleEditFormChange('defined_area', e.target.value)}
              placeholder="Örn: Fabrika A - Üretim Hattı 2, Depo 3, Ofis - 5. Kat"
              helperText="Kullanıcının çalışma alanını veya departmanını belirtin"
              multiline
              rows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#7f007f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7f007f',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7f007f',
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseEditDialog}
              sx={{
                color: '#666',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              ❌ İptal
            </Button>
            <Button
              onClick={handleSaveUser}
              variant="contained"
              sx={{
                backgroundColor: '#7f007f',
                '&:hover': {
                  backgroundColor: '#bf00bf',
                },
                px: 3,
              }}
            >
              ✅ Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default UserProfilePage;