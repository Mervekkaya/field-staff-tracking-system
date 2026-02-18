import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import AuthServisi from '../servisler/AuthServisi';

const RegisterScreen = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Hata', 'Geçerli bir email adresi girin');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Kayıt yapılıyor...', { email: email.trim() });
      
      const result = await AuthServisi.register(email.trim(), password, 'user');
      
      if (result.success) {
        console.log('🔄 RegisterScreen kayıt başarılı:', {
          email: result.user.email,
          role: result.user.role,
          id: result.user.id
        });
        
        // Admin kontrolü - Admin kullanıcılar mobil uygulamaya giremez
        if (result.user.role === 'admin') {
          console.log('⚠️ Admin kullanıcısı kayıt oldu, giriş engelleniyor');
          
          // Admin kullanıcıyı logout yap
          await AuthServisi.logout();
          
          Alert.alert(
            '⚠️ Admin Hesabı Oluşturuldu',
            `Merhaba ${result.user.email}\n\nHesabınız admin yetkisiyle oluşturuldu.\n\nAdmin hesapları mobil uygulamaya giriş yapamaz.\n\nAdmin işlemleri için web dashboard'ını kullanın.`,
            [
              {
                text: 'Anladım',
                onPress: () => {
                  console.log('🚪 Admin kullanıcısı uyarı aldı, login ekranına yönlendiriliyor');
                  onNavigateToLogin(); // Login ekranına yönlendir
                }
              }
            ]
          );
          return; // Giriş yapma
        }
        
        // Normal kullanıcı kaydı
        Alert.alert(
          '✅ Kayıt Başarılı!',
          `Hoş geldiniz ${result.user.email}\nHesabınız oluşturuldu ve giriş yapıldı.`,
          [
            {
              text: 'Tamam',
              onPress: () => {
                console.log('✅ Normal kullanıcı kaydı, ana sayfaya yönlendiriliyor');
                onRegisterSuccess(result.user);
              }
            }
          ]
        );
      } else {
        let errorMessage = 'Kayıt yapılamadı';
        
        if (result.details?.error === 'EMAIL_EXISTS') {
          errorMessage = 'Bu email adresi zaten kayıtlı';
        } else if (result.details?.error === 'PASSWORD_TOO_SHORT') {
          errorMessage = 'Şifre en az 6 karakter olmalı';
        } else if (result.details?.error === 'INVALID_EMAIL') {
          errorMessage = 'Geçerli bir email adresi girin';
        } else if (result.details?.error === 'MISSING_FIELDS') {
          errorMessage = 'Tüm alanları doldurun';
        } else {
          errorMessage = result.error || 'Bilinmeyen hata';
        }
        
        Alert.alert('❌ Kayıt Hatası', errorMessage);
        console.error('❌ Register hatası:', result);
      }
    } catch (error) {
      Alert.alert('❌ Hata', 'Bağlantı hatası: ' + error.message);
      console.error('❌ Register exception:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7f007f" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🗺️</Text>
          <Text style={styles.headerTitle}>Konum Takip</Text>
          <Text style={styles.headerSubtitle}>Hesap Oluşturun</Text>
        </View>

        {/* Register Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>📧 Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              autoFocus={true}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒 Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="En az 6 karakter"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒 Şifre Tekrar</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>


          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity 
              onPress={onNavigateToLogin}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Giriş Yapın</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hesap oluşturarak konum takip özelliklerini kullanabilirsiniz
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7f007f',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 50,
  },
  registerButton: {
    backgroundColor: '#7f007f',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#7f007f',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default RegisterScreen;