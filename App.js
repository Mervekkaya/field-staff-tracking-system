import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';

// Buffer polyfill (BLE için gerekli)
global.Buffer = require('buffer').Buffer;

// Servisler
import AuthServisi from './src/Frontend/servisler/AuthServisi';

// Sayfalar
import LoginScreen from './src/Frontend/sayfalar/LoginScreen';
import AdminWarningScreen from './src/Frontend/sayfalar/AdminWarningScreen';
import AnaSayfa from './src/Frontend/sayfalar/AnaSayfa';



// Auth Loading Screen Bileşeni
function AuthLoadingScreen() {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex(prev => (prev + 1) % 3);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.authLoadingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7f007f" />
      <View style={styles.authLoadingContent}>
        <Text style={styles.authLoadingIcon}>🗺️</Text>
        <Text style={styles.authLoadingTitle}>Konum Takip</Text>
        <View style={styles.authLoadingSpinner}>
          <Text style={[styles.authLoadingDot, dotIndex === 0 && styles.authLoadingDotActive]}>●</Text>
          <Text style={[styles.authLoadingDot, dotIndex === 1 && styles.authLoadingDotActive]}>●</Text>
          <Text style={[styles.authLoadingDot, dotIndex === 2 && styles.authLoadingDotActive]}>●</Text>
        </View>
        <Text style={styles.authLoadingText}>Giriş kontrol ediliyor...</Text>
      </View>
    </View>
  );
}

// Splash Screen Bileşeni
function SplashScreen({ onFinish }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animasyonları başlat
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 2 saniye sonra auth kontrolüne geç
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7f007f" />
      <Animated.View
        style={[
          styles.splashContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.splashIcon}>🗺️</Text>
        <Text style={styles.splashTitle}>Konum Takip</Text>
        <Text style={styles.splashSubtitle}>Uygulaması</Text>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  transform: [{
                    scaleX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1]
                    })
                  }]
                }
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// Ana App Bileşeni
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'home', 'admin-warning'
  const [authLoading, setAuthLoading] = useState(true);

  // Uygulama başlatıldığında auth durumunu kontrol et
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔄 Auth durumu kontrol ediliyor...');

      // Kaydedilmiş auth verilerini yükle
      const authData = await AuthServisi.loadAuthData();

      if (authData.success) {
        // Token geçerliliğini kontrol et
        const meResult = await AuthServisi.getMe();

        if (meResult.success) {
          // Admin kontrolü - Admin kullanıcılar mobil uygulamaya giremez
          if (meResult.user.role === 'admin') {
            console.log('⚠️ Kaydedilmiş admin token bulundu, temizleniyor');
            await AuthServisi.logout();
            setIsAuthenticated(false);
            setCurrentUser(null);
            setCurrentScreen('login');
            return;
          }

          setCurrentUser(meResult.user);
          setIsAuthenticated(true);
          setCurrentScreen('home');
          console.log('✅ Kullanıcı giriş yapmış:', meResult.user.email);
        } else {
          // Token geçersiz, login ekranına yönlendir
          console.log('❌ Token geçersiz, login ekranına yönlendiriliyor');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setCurrentScreen('login');
        }
      } else {
        // Auth verisi yok, login ekranına yönlendir
        console.log('ℹ️ Auth verisi yok, login ekranına yönlendiriliyor');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentScreen('login');
      }
    } catch (error) {
      console.error('❌ Auth durum kontrolü hatası:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentScreen('login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    console.log('🔄 Login başarılı, kullanıcı:', loggedInUser);
    console.log('👤 Kullanıcı rolü:', loggedInUser.role);
    
    setCurrentUser(loggedInUser);
    setIsAuthenticated(true);
    
    if (loggedInUser.role === 'admin') {
      console.log('⚠️ Admin kullanıcısı tespit edildi, uyarı ekranına yönlendiriliyor');
      setCurrentScreen('admin-warning');
    } else {
      setCurrentScreen('home');
      console.log('✅ Normal kullanıcı, ana sayfaya yönlendiriliyor');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const navigateToLogin = () => {
    setCurrentScreen('login');
  };

  // Splash screen göster
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Auth loading göster
  if (authLoading) {
    return (
      <AuthLoadingScreen />
    );
  }

  // Ekran yönlendirme
  console.log('🔄 Mevcut ekran:', currentScreen, 'Kullanıcı:', currentUser?.email, 'Role:', currentUser?.role);

  switch (currentScreen) {
    case 'admin-warning':
      return (
        <AdminWarningScreen
          onLogout={handleLogout}
        />
      );

    case 'home':
      return <AnaSayfa currentUser={currentUser} onLogout={handleLogout} />;

    case 'login':
    default:
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
        />
      );
  }
}

const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: '#7f007f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  splashSubtitle: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 50,
  },
  loadingContainer: {
    alignItems: 'center',
    width: 200,
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 15,
  },
  loadingProgress: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
    transformOrigin: 'left',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },

  // Ana Sayfa Styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#7f007f',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonConnected: {
    backgroundColor: 'rgba(76, 217, 100, 0.3)',
  },
  headerButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(127, 0, 127, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  infoSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  saatVerileri: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saatVeri: {
    fontSize: 10,
    color: '#7f007f',
    fontWeight: 'bold',
  },
  controlContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  mainControlButton: {
    backgroundColor: '#bf00bf',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activeControlButton: {
    backgroundColor: '#7f007f',
  },
  controlIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  mainControlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Auth Loading Styles
  authLoadingContainer: {
    flex: 1,
    backgroundColor: '#7f007f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authLoadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authLoadingIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  authLoadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  authLoadingSpinner: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  authLoadingDot: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 5,
  },
  authLoadingDotActive: {
    color: '#fff',
  },
  authLoadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});