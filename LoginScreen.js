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

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('🔄 LoginScreen render edildi, loading:', loading, 'email:', email);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Email ve şifre alanları boş bırakılamaz');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Giriş yapılıyor...', { email });
      
      const result = await AuthServisi.login(email.trim(), password);
      
      if (result.success) {
        console.log('🔄 LoginScreen login başarılı:', {
          email: result.user.email,
          role: result.user.role,
          id: result.user.id
        });
        
        // Admin ise uyarı göstermeden direkt yönlendir
        if (result.user.role === 'admin') {
          console.log('✅ Admin girişi, onLoginSuccess direkt çağrılıyor');
          onLoginSuccess(result.user);
        } else {
          // Normal kullanıcı ise hoş geldin mesajı göster
          Alert.alert(
            '✅ Giriş Başarılı!',
            `Hoş geldiniz ${result.user.email}`,
            [
              {
                text: 'Tamam',
                onPress: () => onLoginSuccess(result.user)
              }
            ]
          );
        }
      } else {
        let errorMessage = 'Giriş yapılamadı';
        
        if (result.details?.error === 'INVALID_CREDENTIALS') {
          errorMessage = 'Email veya şifre hatalı';
        } else if (result.details?.error === 'MISSING_FIELDS') {
          errorMessage = 'Email ve şifre gerekli';
        } else {
          errorMessage = result.error || 'Bilinmeyen hata';
        }
        
        Alert.alert('❌ Giriş Hatası', errorMessage);
        console.error('❌ Login hatası:', result);
      }
    } catch (error) {
      Alert.alert('❌ Hata', 'Bağlantı hatası: ' + error.message);
      console.error('❌ Login exception:', error);
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
          <Text style={styles.headerSubtitle}>Giriş Yapın</Text>
        </View>

        {/* Login Form */}
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
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒 Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi girin"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
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
  loginButton: {
    backgroundColor: '#7f007f',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;