import React, { useState } from 'react';
import { Avatar, Button, CssBaseline, TextField, Box, Typography, Container, Alert, Paper } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MapIcon from '@mui/icons-material/Map';
import { useNavigate } from 'react-router-dom';

// ⚠️ ARKA UÇ SUNUCU ADRESİ
// Web panel aynı bilgisayarda çalıştığı için localhost kullanıyoruz
// Eğer farklı bir bilgisayarda çalışıyorsa, o bilgisayarın IP adresini yazın
const API_BASE_URL = 'http://localhost:3000';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password: password 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.user && data.user.role === 'admin') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        } else {
          setError('Bu panele yalnızca admin kullanıcılar erişebilir.');
        }
      } else {
        setError(data.message || data.details?.error || 'Giriş başarısız oldu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7f007f 0%, #bf00bf 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          {/* Logo/Icon */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <MapIcon sx={{ fontSize: 60, color: '#7f007f', mb: 1 }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: '#7f007f' }}>
              🗺️ Konum Takip
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#666', mt: 1 }}>
              Admin Paneli
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="📧 Email Adresi"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="🔒 Şifre"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#7f007f',
                '&:hover': {
                  backgroundColor: '#bf00bf',
                },
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
              }}
            >
              {loading ? '⏳ Giriş Yapılıyor...' : '🚀 Giriş Yap'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#999' }}>
              © 2025 Konum Takip Sistemi
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;