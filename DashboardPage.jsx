import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Kullanıcı silme onayı için
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  // Yeni kullanıcı ekleme formu için
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', defined_area: '' });

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
        setError(errorData.message || 'Kullanıcılar yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove user from state
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Kullanıcı silinirken hata oluştu');
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı');
      console.error('Delete user error:', err);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleOpenAddUserDialog = () => {
    setAddUserDialogOpen(true);
  };

  const handleCloseAddUserDialog = () => {
    setAddUserDialogOpen(false);
    setNewUser({ email: '', password: '', defined_area: '' }); // Formu temizle
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        // Kullanıcı listesini güncelle
        setUsers([...users, data.user]);
        handleCloseAddUserDialog();
      } else {
        setError(data.message || 'Kullanıcı oluşturulamadı.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı.');
      console.error('Create user error:', err);
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleEditUser = (user) => {
    navigate(`/user/${user.id}`);
  };

  const handleTrackUser = (user) => {
    navigate(`/tracking/${user.id}`);
  };

  const handleViewMap = () => {
    navigate('/map');
  };

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getUserCount = () => {
    return users.length;
  };

  const getAdminCount = () => {
    return users.filter(user => user.role === 'admin').length;
  };

  const getUserCountByRole = (role) => {
    return users.filter(user => user.role === role).length;
  };

  const getRecentUsers = (count = 5) => {
    return users.slice(0, count);
  };

  const getActiveUsers = () => {
    // In a real implementation, this would check for recent activity
    // For now, we'll just return all users
    return users;
  };

  const getUserActivityPercentage = () => {
    // In a real implementation, this would calculate based on recent activity
    // For now, we'll just return a placeholder value
    return 75;
  };

  const getUserLocations = () => {
    // In a real implementation, this would fetch user locations
    // For now, we'll just return a placeholder value
    return 42;
  };

  const getUserLocationPercentage = () => {
    // In a real implementation, this would calculate based on users with locations
    // For now, we'll just return a placeholder value
    return 65;
  };

  const getUserTrackingStatus = (user) => {
    // In a real implementation, this would check user tracking status
    // For now, we'll just return a placeholder value
    return 'Aktif';
  };

  const getUserLastLocation = (user) => {
    // In a real implementation, this would fetch user's last location
    // For now, we'll just return a placeholder value
    return '5 dakika önce';
  };

  const getUserBatteryStatus = (user) => {
    // In a real implementation, this would fetch user's battery status
    // For now, we'll just return a placeholder value
    return '85%';
  };

  const getUserNetworkStatus = (user) => {
    // In a real implementation, this would check user's network status
    // For now, we'll just return a placeholder value
    return 'WiFi';
  };

  const getUserDeviceStatus = (user) => {
    // In a real implementation, this would check user's device status
    // For now, we'll just return a placeholder value
    return 'Android';
  };

  const getUserAppVersion = (user) => {
    // In a real implementation, this would fetch user's app version
    // For now, we'll just return a placeholder value
    return '1.2.3';
  };

  const getUserLastLogin = (user) => {
    // In a real implementation, this would fetch user's last login time
    // For now, we'll just return a placeholder value
    return '2 saat önce';
  };

  const getUserRegistrationDate = (user) => {
    // In a real implementation, this would fetch user's registration date
    // For now, we'll just return a placeholder value
    return formatDate(user.created_at);
  };

  const getUserRole = (user) => {
    // In a real implementation, this would fetch user's role
    // For now, we'll just return the user's role
    return user.role;
  };

  const getUserEmail = (user) => {
    // In a real implementation, this would fetch user's email
    // For now, we'll just return the user's email
    return user.email;
  };

  const getUserId = (user) => {
    // In a real implementation, this would fetch user's ID
    // For now, we'll just return the user's ID
    return user.id;
  };

  const getUserStatus = (user) => {
    // In a real implementation, this would check user's status
    // For now, we'll just return a placeholder value
    return 'Aktif';
  };

  const getUserActions = (user) => {
    // In a real implementation, this would return user actions
    // For now, we'll just return placeholder actions
    return [
      { name: 'Düzenle', action: () => handleEditUser(user) },
      { name: 'Sil', action: () => handleDeleteUser(user) },
      { name: 'Konum İzle', action: () => handleTrackUser(user) }
    ];
  };

  const getUserActionButtons = (user) => {
    return (
      <>
        <Button
          variant="contained"
          size="small"
          sx={{
            mr: 1,
            backgroundColor: '#7f007f',
            '&:hover': {
              backgroundColor: '#bf00bf',
            },
          }}
          onClick={() => handleTrackUser(user)}
        >
          📍 Konum İzle
        </Button>
        <Button
          variant="outlined"
          size="small"
          sx={{
            mr: 1,
            borderColor: '#7f007f',
            color: '#7f007f',
            '&:hover': {
              borderColor: '#bf00bf',
              backgroundColor: 'rgba(127, 0, 127, 0.05)',
            },
          }}
          onClick={() => handleEditUser(user)}
        >
          ✏️ Düzenle
        </Button>
        <Button
          variant="outlined"
          size="small"
          sx={{
            borderColor: '#dc3545',
            color: '#dc3545',
            '&:hover': {
              borderColor: '#c82333',
              backgroundColor: 'rgba(220, 53, 69, 0.05)',
            },
          }}
          onClick={() => handleDeleteUser(user)}
        >
          🗑️ Sil
        </Button>
      </>
    );
  };

  const getUserTableRows = () => {
    return users.map((user, index) => (
      <TableRow
        key={user.id}
        sx={{
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(127, 0, 127, 0.02)',
          },
          '&:hover': {
            backgroundColor: 'rgba(127, 0, 127, 0.05)',
          },
        }}
      >
        <TableCell sx={{ fontWeight: 'bold' }}>{user.id}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Box
            sx={{
              display: 'inline-block',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: user.role === 'admin' ? '#f093fb' : '#4facfe',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
          >
            {user.role === 'admin' ? '👨‍💼 Admin' : '👤 Kullanıcı'}
          </Box>
        </TableCell>
        <TableCell>{user.defined_area || '📍 Tanımsız'}</TableCell>
        <TableCell>📅 {formatDate(user.created_at)}</TableCell>
        <TableCell>
          {getUserActionButtons(user)}
        </TableCell>
      </TableRow>
    ));
  };

  const getUserTable = () => {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#7f007f' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>🆔 ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>📧 Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>👤 Rol</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>📍 Tanımlı Alan</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>📅 Kayıt Tarihi</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>⚙️ İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getUserTableRows()}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const getUserStatistics = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Card
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              👥 Toplam Kullanıcı
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {getUserCount()}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              👨‍💼 Admin Kullanıcılar
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {getAdminCount()}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              ✅ Normal Kullanıcılar
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {getUserCountByRole('user')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const getUserManagementHeader = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7f007f' }}>
          📋 Kullanıcı Yönetimi
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            sx={{
              mr: 2,
              borderColor: '#7f007f',
              color: '#7f007f',
              '&:hover': {
                borderColor: '#bf00bf',
                backgroundColor: 'rgba(127, 0, 127, 0.05)',
              },
            }}
          >
            🔄 Yenile
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenAddUserDialog}
            sx={{
              backgroundColor: '#7f007f',
              '&:hover': {
                backgroundColor: '#bf00bf',
              },
            }}
          >
            ➕ Yeni Kullanıcı Ekle
          </Button>
        </Box>
      </Box>
    );
  };

  const getUserManagementContent = () => {
    return (
      <>
        {getUserManagementHeader()}
        {getUserStatistics()}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          getUserTable()
        )}
      </>
    );
  };

  const getUserManagementCard = () => {
    return (
      <Card>
        <CardContent>
          {getUserManagementContent()}
        </CardContent>
      </Card>
    );
  };

  const getDashboardContent = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {getUserManagementCard()}
        </Grid>
      </Grid>
    );
  };

  const getDeleteConfirmationDialog = () => {
    return (
      <Dialog open={deleteDialogOpen} onClose={cancelDeleteUser}>
        <DialogTitle>Kullanıcı Silme Onayı</DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Typography>
              <strong>{userToDelete.email}</strong> kullanıcısını silmek istediğinize emin misiniz?
              <br />
              <br />
              Bu işlem geri alınamaz.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteUser}>İptal</Button>
          <Button onClick={confirmDeleteUser} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const getAddUserDialog = () => {
    return (
      <Dialog
        open={addUserDialogOpen}
        onClose={handleCloseAddUserDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#7f007f', fontWeight: 'bold', fontSize: '1.5rem' }}>
          ➕ Yeni Kullanıcı Oluştur
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📱 Kullanıcı Oluşturma Adımları:
            </Typography>
            <Typography variant="body2" component="div">
              1️⃣ Email ve şifre belirleyin<br />
              2️⃣ Tanımlı bölge ekleyin (opsiyonel)<br />
              3️⃣ Kullanıcıya email ve şifresini iletin<br />
              4️⃣ Kullanıcı mobil uygulamayı indirip giriş yapacak
            </Typography>
          </Alert>

          <TextField
            autoFocus
            margin="dense"
            name="email"
            label="📧 Email Adresi"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={handleNewUserChange}
            placeholder="kullanici@example.com"
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
          <TextField
            margin="dense"
            name="password"
            label="🔒 Şifre"
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={handleNewUserChange}
            placeholder="En az 6 karakter"
            helperText="Kullanıcıya bu şifreyi iletmeyi unutmayın!"
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
          <TextField
            margin="dense"
            name="defined_area"
            label="📍 Tanımlı Bölge (Opsiyonel)"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.defined_area}
            onChange={handleNewUserChange}
            placeholder="Örn: Fabrika A Bölgesi, Depo 1, Ofis Katı 3"
            helperText="Kullanıcının çalışma alanını belirtin (isteğe bağlı)"
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
            onClick={handleCloseAddUserDialog}
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
            onClick={handleCreateUser}
            variant="contained"
            sx={{
              backgroundColor: '#7f007f',
              '&:hover': {
                backgroundColor: '#bf00bf',
              },
              px: 3,
            }}
          >
            ✅ Oluştur
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const getDashboardHeader = () => {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #7f007f 0%, #bf00bf 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🗺️ Konum Takip Admin Paneli
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Hoş geldiniz, {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin'}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              onClick={handleViewMap}
              sx={{
                mr: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              🗺️ Tümünü Haritada Gör
            </Button>
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 59, 48, 0.8)',
                },
              }}
            >
              🚪 Çıkış Yap
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  };

  const getDashboardError = () => {
    return (
      error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )
    );
  };

  const getDashboard = () => {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
          {getDashboardHeader()}
          {getDashboardError()}
          {getDashboardContent()}
          {getDeleteConfirmationDialog()}
          {getAddUserDialog()}
        </Container>
      </Box>
    );
  };

  return getDashboard();
}

export default DashboardPage;