import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import KonumServisi from '../servisler/KonumServisi';
import SaatServisi from '../servisler/SaatServisi';
import ApiServisi from '../servisler/ApiServisi';
import AuthServisi from '../servisler/AuthServisi';


//  State'ler
const AnaSayfa = ({ currentUser, onLogout }) => {
  const [takipAktif, setTakipAktif] = useState(false);
  const [sure, setSure] = useState(0);
  const [mesafe, setMesafe] = useState(0);
  const [hiz, setHiz] = useState(0);
  const [konumGecmisi, setKonumGecmisi] = useState([]);
  const [mevcutKonum, setMevcutKonum] = useState(null);
  const [saatBagli, setSaatBagli] = useState(false);
  const [batarya, setBatarya] = useState(0); //olup olmamasının bir önemi yok 
  const [adimSayisi, setAdimSayisi] = useState(0);  //olup olmamasının bir önemi yok 

  // Uygulama başlatma
  useEffect(() => {
    uygulamayiBaslat();
    return () => {
      temizle();
    };
  }, []);

  // Süre sayacı
  useEffect(() => {
    let interval = null;
    if (takipAktif) {
      interval = setInterval(() => {
        setSure(sure => sure + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [takipAktif]);

  const uygulamayiBaslat = async () => {
    try {
      // Konum geçmişini yükle  - geçmiş üç bağlantıyı mesela veritabanına kaydetsin öyle gösterebilsin
      const gecmis = await KonumServisi.konumGecmisiniYukle();
      setKonumGecmisi(gecmis);

      // Kullanıcının mevcut konumunu al
      await mevcutKonumuAl();
    } catch (error) {
      console.error('Uygulama başlatma hatası:', error);
    }

    // Servislerin algılayıcılrını kur
    KonumServisi.dinleyiciEkle((tip, veri) => {
      try {
        if (tip === 'yeniKonum') {
          setMevcutKonum(veri);
          setKonumGecmisi(onceki => [...onceki, veri]);

          // İstatistikleri güncelle
          const toplamMesafe = KonumServisi.toplamMesafeHesapla();
          const ortalamaHiz = KonumServisi.ortalamaHizHesapla();
          setMesafe(toplamMesafe);
          setHiz(ortalamaHiz);
        }
      } catch (error) {
        console.error('Konum dinleyici hatası:', error);
      }
    });

    SaatServisi.dinleyiciEkle((tip, veri) => {
      try {
        if (tip === 'baglantiDurumu') {
          setSaatBagli(veri.bagliMi);
        } else if (tip === 'batarya') {
          setBatarya(veri);
        } else if (tip === 'adimSayisi') {
          setAdimSayisi(veri);
        }
      } catch (error) {
        console.error('Saat dinleyici hatası:', error);
      }
    });
  };

  const temizle = async () => {
    await KonumServisi.takibiDurdur();
    await SaatServisi.baglantiKes();
  };

  const takibiBaslatDurdur = async () => {
    if (takipAktif) {
      // Takibi durdur
      await KonumServisi.takibiDurdur();
      setTakipAktif(false);
      Alert.alert(
        '🏁 Takip Durduruldu',
        `Süre: ${formatSure(sure)}\nMesafe: ${mesafe.toFixed(2)} km\nOrtalama Hız: ${hiz.toFixed(1)} km/h\n${saatBagli ? `👟 Adım: ${adimSayisi}\n🔋 Batarya: ${batarya}%` : ''}`
      );
    } else {
      // Takibi başlat
      const basarili = await KonumServisi.takibiBaslat();
      if (basarili) {
        setTakipAktif(true);
        setSure(0);
        setMesafe(0);
        setHiz(0);
        // Konum geçmişini temizle (yeni takip)
        setKonumGecmisi([]);
        Alert.alert('🚀 Takip Başlatıldı', 'Konum takibi aktif edildi');
      } else {
        Alert.alert('❌ Hata', 'Konum takibi başlatılamadı. GPS izinlerini kontrol edin.');
      }
    }
  };

  const formatSure = (saniye) => {
    const saat = Math.floor(saniye / 3600);
    const dakika = Math.floor((saniye % 3600) / 60);
    const sn = saniye % 60;

    if (saat > 0) {
      return `${saat}:${dakika.toString().padStart(2, '0')}:${sn.toString().padStart(2, '0')}`;
    }
    return `${dakika}:${sn.toString().padStart(2, '0')}`;
  };

  const saatBaglantiSayfasi = async () => {
    if (saatBagli) {
      // Bağlantıyı kes
      Alert.alert(
        'Saat Bağlantısını Kes',
        'Akıllı saat bağlantısını kesmek istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Kes',
            style: 'destructive',
            onPress: async () => {
              await SaatServisi.baglantiKes();
            }
          }
        ]
      );
    } else {
      // Saat tarama ve bağlantı
      Alert.alert(
        'Akıllı Saat Bağlantısı',
        'Akıllı saatinizi tarayıp bağlamak istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Tara ve Bağlan',
            onPress: async () => {
              try {
                const bleAktif = await SaatServisi.bleDurumunuKontrol();
                if (!bleAktif) {
                  Alert.alert('Bluetooth Kapalı', 'Bluetooth\'u açmanız gerekiyor');
                  return;
                }

                Alert.alert('Taranıyor...', 'Akıllı saatler taranıyor, lütfen bekleyin');

                const cihazlar = await SaatServisi.cihazlariTara();

                if (cihazlar.length === 0) {
                  Alert.alert(
                    'Cihaz Bulunamadı',
                    'Yakında desteklenen akıllı saat bulunamadı.\n\nDesteklenen saatler:\n• Haino Teko Watch 9\n• Mi Band\n• Amazfit\n• Samsung Galaxy Watch'
                  );
                } else {
                  // İlk cihaza bağlan
                  const basarili = await SaatServisi.cihazaBaglan(cihazlar[0].id);
                  if (basarili) {
                    Alert.alert('✅ Başarılı', `${cihazlar[0].isim} saatine bağlandı!\n\nVeriler yükleniyor...`);

                    // Bağlantı kurulduktan 2 saniye sonra veri okumayı tetikle
                    setTimeout(async () => {
                      try {
                        await SaatServisi.testVeriOkuma();
                      } catch (error) {
                        console.log('İlk veri okuma hatası:', error);
                      }
                    }, 2000);
                  } else {
                    Alert.alert('❌ Hata', 'Saat bağlantısı kurulamadı');
                  }
                }
              } catch (error) {
                Alert.alert('Hata', error.message);
              }
            }
          }
        ]
      );
    }
  };

  const veriTestiYap = async () => {
    Alert.alert(
      'Saat Veri Testi',
      'Saatinizden veri okuma testi yapılacak. Bu işlem birkaç saniye sürebilir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Test Et',
          onPress: async () => {
            try {
              Alert.alert('Test Başlatıldı', 'Saat verileri test ediliyor...');

              // SaatServisi'nden test fonksiyonunu çağır
              const sonuc = await SaatServisi.testVeriOkuma();

              setTimeout(() => {
                Alert.alert(
                  'Test Tamamlandı',
                  `Batarya: ${batarya}%\nAdım: ${adimSayisi}\n\nKonsol loglarını kontrol edin.`
                );
              }, 3000);

            } catch (error) {
              Alert.alert('Test Hatası', error.message);
            }
          }
        }
      ]
    );
  };


  // test kısmını bu fonksiyonla başlatıyorum 
  const apiTestiYap = async () => {
    Alert.alert(
      'API Bağlantı Testi',
      'Backend server bağlantısı test edilecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Test Et',
          onPress: async () => {
            try {
              console.log('🔄 API bağlantı testi başlatılıyor...');

              const result = await ApiServisi.testConnection();

              if (result.success) {
                Alert.alert(
                  '✅ Bağlantı Başarılı!',
                  `Server zamanı: ${result.data.server_time}\n\nDetaylar konsol loglarında.`
                );
                console.log('✅ API Test Sonucu:', result.data);
              } else {
                Alert.alert(
                  '❌ Bağlantı Hatası!',
                  `Hata: ${result.error}\n\nServer çalışıyor mu kontrol edin.`
                );
                console.error('❌ API Test Hatası:', result.error);
              }

            } catch (error) {
              Alert.alert('❌ Test Hatası', error.message);
              console.error('❌ API Test Exception:', error);
            }
          }
        }
      ]
    );
  };

  const databaseTestiYap = async () => {
    Alert.alert(
      'Veritabanı Bağlantı Testi',
      'PostgreSQL veritabanı bağlantısı test edilecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Test Et',
          onPress: async () => {
            try {
              console.log('🔄 Veritabanı bağlantı testi başlatılıyor...');

              const result = await ApiServisi.testDatabase();

              if (result.success) {
                const { data } = result;
                Alert.alert(
                  '✅ Veritabanı Bağlantısı Başarılı!',
                  `Veritabanı: ${data.database}\nTablolar: ${data.tables.join(', ')}\nKullanıcılar: ${data.data.users}\nKonumlar: ${data.data.locations}\n\nDetaylar konsol loglarında.`
                );
                console.log('✅ Database Test Sonucu:', data);
              } else {
                Alert.alert(
                  '❌ Veritabanı Bağlantı Hatası!',
                  `Hata: ${result.error}\n\nPostgreSQL çalışıyor mu kontrol edin.`
                );
                console.error('❌ Database Test Hatası:', result.error);
              }

            } catch (error) {
              Alert.alert('❌ Test Hatası', error.message);
              console.error('❌ Database Test Exception:', error);
            }
          }
        }
      ]
    );
  };

  const authTestiYap = async () => {
    Alert.alert(
      'Auth Sistemi Testi',
      'Hangi testi yapmak istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kayıt Ol',
          onPress: async () => {
            try {
              const testEmail = `test${Date.now()}@example.com`;
              const testPassword = '123456';

              console.log('🔄 Kullanıcı kaydı test ediliyor...');
              const result = await AuthServisi.register(testEmail, testPassword, 'user');

              if (result.success) {
                Alert.alert(
                  '✅ Kayıt Başarılı!',
                  `Email: ${result.user.email}\nRol: ${result.user.role}\nID: ${result.user.id}`
                );
                console.log('✅ Register Test Sonucu:', result);
              } else {
                Alert.alert('❌ Kayıt Hatası!', result.error);
                console.error('❌ Register Test Hatası:', result);
              }
            } catch (error) {
              Alert.alert('❌ Test Hatası', error.message);
            }
          }
        },
        {
          text: 'Giriş Yap',
          onPress: async () => {
            try {
              // Test kullanıcısı ile giriş
              const testEmail = 'test@example.com';
              const testPassword = '123456';

              console.log('🔄 Kullanıcı girişi test ediliyor...');
              const result = await AuthServisi.login(testEmail, testPassword);

              if (result.success) {
                Alert.alert(
                  '✅ Giriş Başarılı!',
                  `Email: ${result.user.email}\nRol: ${result.user.role}\nID: ${result.user.id}`
                );
                console.log('✅ Login Test Sonucu:', result);
              } else {
                Alert.alert('❌ Giriş Hatası!', result.error);
                console.error('❌ Login Test Hatası:', result);
              }
            } catch (error) {
              Alert.alert('❌ Test Hatası', error.message);
            }
          }
        },
        {
          text: 'Profil Getir',
          onPress: async () => {
            try {
              console.log('🔄 Kullanıcı profili test ediliyor...');
              const result = await AuthServisi.getMe();

              if (result.success) {
                Alert.alert(
                  '✅ Profil Getirildi!',
                  `Email: ${result.user.email}\nRol: ${result.user.role}\nID: ${result.user.id}`
                );
                console.log('✅ GetMe Test Sonucu:', result);
              } else {
                Alert.alert('❌ Profil Hatası!', result.error);
                console.error('❌ GetMe Test Hatası:', result);
              }
            } catch (error) {
              Alert.alert('❌ Test Hatası', error.message);
            }
          }
        }
      ]
    );
  };

  const mevcutKonumuAl = async () => {
    try {
      const izinVar = await KonumServisi.konumIzniIste();
      if (izinVar) {
        // Mevcut konumu al
        const konum = await KonumServisi.getCurrentPosition();
        if (konum) {
          setMevcutKonum(konum);
        }
      }
    } catch (error) {
      console.log('Mevcut konum alınamadı:', error);
    }
  };

  const haritaBolgesiAl = () => {
    if (mevcutKonum) {
      return {
        latitude: mevcutKonum.latitude,
        longitude: mevcutKonum.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Varsayılan konum (İstanbul) konumu alınamazsa
    return {
      latitude: 41.0082,
      longitude: 28.9784,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7f007f" />

      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Konum Takip</Text>
        <Text style={styles.subtitle}>
          {takipAktif ? `⏱️ ${formatSure(sure)}` : 'Hazır'}
        </Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, saatBagli && styles.headerButtonConnected]}
            onPress={saatBaglantiSayfasi}
          >
            <Text style={styles.headerButtonText}>
              {saatBagli ? '⌚ Bağlı' : '⌚ Saat Bağla'}
            </Text>
          </TouchableOpacity>



          <TouchableOpacity
            style={[styles.headerButton, styles.logoutButton]}
            onPress={() => {
              Alert.alert(
                'Çıkış Yap',
                'Çıkış yapmak istediğinizden emin misiniz?',
                [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                      await AuthServisi.logout();
                      // onLogout prop'u varsa çağır (App.js'den gelecek)
                      if (typeof onLogout === 'function') {
                        onLogout();
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.headerButtonText}>🚪 Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* İstatistik Kartları */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>{mesafe.toFixed(2)} km</Text>
            <Text style={styles.statLabel}>Mesafe</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>{hiz.toFixed(1)} km/h</Text>
            <Text style={styles.statLabel}>Hız</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{formatSure(sure)}</Text>
            <Text style={styles.statLabel}>Süre</Text>
          </View>
        </View>

        {/* Saat Verileri - Sadece bağlıyken göster */}
        {saatBagli && (
          <View style={styles.saatVerileriContainer}>
            <Text style={styles.saatVerileriBaslik}>⌚ Akıllı Saat Verileri</Text>
            <View style={styles.saatStatsContainer}>
              <View style={styles.saatStatCard}>
                <Text style={styles.saatStatIcon}>🔋</Text>
                <Text style={[styles.saatStatValue, batarya === 0 && styles.veriYukleniyor]}>
                  {batarya === 0 ? 'Yükleniyor...' : `${batarya}%`}
                </Text>
                <Text style={styles.saatStatLabel}>Batarya</Text>
              </View>

              <View style={styles.saatStatCard}>
                <Text style={styles.saatStatIcon}>👟</Text>
                <Text style={[styles.saatStatValue, adimSayisi === 0 && styles.veriYukleniyor]}>
                  {adimSayisi === 0 ? 'Yükleniyor...' : adimSayisi.toLocaleString()}
                </Text>
                <Text style={styles.saatStatLabel}>Adım</Text>
              </View>
            </View>

            {/* Veri durumu göstergesi */}
            <View style={styles.veriDurumuContainer}>
              <Text style={styles.veriDurumuText}>
                {batarya > 0 || adimSayisi > 0
                  ? '✅ Canlı veri alınıyor'
                  : '🔄 Veriler yükleniyor...'}
              </Text>
            </View>
          </View>
        )}

        {/* Gerçek Harita */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={haritaBolgesiAl()}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={takipAktif}
          >
            {/* Başlangıç noktası */}
            {konumGecmisi.length > 0 && (
              <Marker
                coordinate={{
                  latitude: konumGecmisi[0].latitude,
                  longitude: konumGecmisi[0].longitude,
                }}
                title="🚀 Başlangıç"
                description="Takip başlangıç noktası"
                pinColor="#bf00bf"
              />
            )}

            {/* Mevcut konum */}
            {mevcutKonum && (
              <Marker
                coordinate={{
                  latitude: mevcutKonum.latitude,
                  longitude: mevcutKonum.longitude,
                }}
                title="📍 Mevcut Konum"
                description={`Hız: ${mevcutKonum.speed ? (mevcutKonum.speed * 3.6).toFixed(1) : '0'} km/h`}
                pinColor="#7f007f"
              />
            )}

            {/* Rota çizgisi */}
            {konumGecmisi.length > 1 && (
              <Polyline
                coordinates={konumGecmisi.map(konum => ({
                  latitude: konum.latitude,
                  longitude: konum.longitude,
                }))}
                strokeColor="#7f007f"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>

          {/* Harita üzerinde bilgi */}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>
              {takipAktif ? `📍 ${konumGecmisi.length} nokta` : 'Takip başlatın'}
            </Text>
          </View>
        </View>

        {/* Bilgi Kartları */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📱 Telefon GPS</Text>
            <Text style={styles.infoText}>Aktif ve hazır</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>⌚ Akıllı Saat</Text>
            <Text style={styles.infoText}>
              {saatBagli ? '✅ Bağlı ve veri alınıyor' : '❌ Bağlı değil'}
            </Text>
            {saatBagli && (
              <View style={styles.saatDurumBilgisi}>
                <Text style={styles.saatDurumText}>📊 Canlı veri akışı aktif</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Ana Kontrol Butonu */}
      <View style={styles.controlContainer}>
        <TouchableOpacity
          style={[
            styles.mainControlButton,
            takipAktif && styles.activeControlButton
          ]}
          onPress={takibiBaslatDurdur}
        >
          <Text style={styles.controlIcon}>
            {takipAktif ? '⏹️' : '▶️'}
          </Text>
          <Text style={styles.mainControlText}>
            {takipAktif ? 'DURDUR' : 'BAŞLAT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    marginLeft: 10,
  },
  apiButton: {
    backgroundColor: 'rgba(0, 123, 255, 0.3)',
    marginLeft: 10,
  },
  dbButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.3)',
    marginLeft: 10,
  },
  authButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.3)',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: 'rgba(108, 117, 125, 0.3)',
    marginLeft: 10,
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
  saatDurumBilgisi: {
    marginTop: 8,
  },
  saatDurumText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  saatVerileriContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saatVerileriBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  saatStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  saatStatCard: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  saatStatIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  saatStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7f007f',
    marginBottom: 4,
  },
  saatStatLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  veriYukleniyor: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  veriDurumuContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  veriDurumuText: {
    fontSize: 12,
    color: '#4CAF50',
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
});

export default AnaSayfa;