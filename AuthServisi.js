import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiServisi from './ApiServisi';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthServisi {
  constructor() {
    this.currentUser = null;
    this.token = null;
  }

  // Kullanıcı kaydı
  async register(email, password, role = 'user') {
    try {
      const result = await ApiServisi.post('/api/auth/register', {
        email,
        password,
        role
      });

      if (result.success) {
        const { user, token } = result.data;
        
        // Token ve kullanıcı bilgilerini kaydet
        await this.saveAuthData(token, user);
        
        return {
          success: true,
          user,
          message: result.data.message
        };
      } else {
        return {
          success: false,
          error: result.error,
          details: result.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Kullanıcı girişi
  async login(email, password) {
    try {
      // Email'i lowercase ve trim yap (backend ile uyumlu olması için)
      const normalizedEmail = email.toLowerCase().trim();
      
      const result = await ApiServisi.post('/api/auth/login', {
        email: normalizedEmail,
        password
      });

      if (result.success) {
        const { user, token } = result.data;
        
        console.log('🔄 AuthServisi login başarılı:', {
          email: user.email,
          role: user.role,
          id: user.id
        });
        
        // Token ve kullanıcı bilgilerini kaydet
        await this.saveAuthData(token, user);
        
        return {
          success: true,
          user,
          message: result.data.message
        };
      } else {
        return {
          success: false,
          error: result.error,
          details: result.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Çıkış
  async logout() {
    try {
      // Server'a logout isteği gönder (token varsa)
      if (this.token) {
        await ApiServisi.post('/api/auth/logout');
      }
    } catch (error) {
      console.log('Logout server error:', error);
      // Server hatası olsa bile local logout yap
    } finally {
      // Local verileri temizle
      await this.clearAuthData();
      return { success: true };
    }
  }

  // Kullanıcı bilgilerini getir
  async getMe() {
    try {
      const result = await ApiServisi.get('/api/auth/me');
      
      if (result.success) {
        const { user } = result.data;
        this.currentUser = user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        
        return {
          success: true,
          user
        };
      } else {
        // Token geçersizse logout yap
        if (result.details?.error === 'TOKEN_EXPIRED' || result.details?.error === 'INVALID_TOKEN') {
          await this.logout();
        }
        
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Auth verilerini kaydet
  async saveAuthData(token, user) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      this.token = token;
      this.currentUser = user;
      
      console.log('✅ Auth verileri kaydedildi:', { email: user.email, role: user.role });
    } catch (error) {
      console.error('❌ Auth veri kaydetme hatası:', error);
      throw error;
    }
  }

  // Auth verilerini temizle
  async clearAuthData() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      this.token = null;
      this.currentUser = null;
      
      console.log('✅ Auth verileri temizlendi');
    } catch (error) {
      console.error('❌ Auth veri temizleme hatası:', error);
    }
  }

  // Kaydedilmiş auth verilerini yükle
  async loadAuthData() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);
      
      if (token && userData) {
        this.token = token;
        this.currentUser = JSON.parse(userData);
        
        console.log('✅ Auth verileri yüklendi:', { email: this.currentUser.email, role: this.currentUser.role });
        
        return {
          success: true,
          token,
          user: this.currentUser
        };
      } else {
        return {
          success: false,
          message: 'Kaydedilmiş auth verisi yok'
        };
      }
    } catch (error) {
      console.error('❌ Auth veri yükleme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Giriş yapılmış mı kontrol et
  isAuthenticated() {
    return !!(this.token && this.currentUser);
  }

  // Admin mi kontrol et
  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  // User mi kontrol et
  isUser() {
    return ['user', 'admin'].includes(this.currentUser?.role);
  }

  // Mevcut kullanıcıyı getir
  getCurrentUser() {
    return this.currentUser;
  }

  // Token'ı getir
  getToken() {
    return this.token;
  }
}

export default new AuthServisi();