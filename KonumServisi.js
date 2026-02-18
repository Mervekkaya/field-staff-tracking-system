import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';

class KonumServisi {
  constructor() {
    this.takipAktif = false;
    this.konumGecmisi = [];
    this.dinleyiciler = [];
    this.watchId = null;
  }

  // Konum izni iste
  async konumIzniIste() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Konum izni verilmedi');
      }

      // Arka plan izni de iste
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      console.log('Arka plan konum izni:', backgroundStatus.status);

      return true;
    } catch (error) {
      console.error('Konum izni hatası:', error);
      return false;
    }
  }

  // Mevcut konumu al (tek seferlik)
  async getCurrentPosition() {
    try {
      const konum = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return this.konumVerisiniFormatla(konum);
    } catch (error) {
      console.error('Mevcut konum alma hatası:', error);
      return null;
    }
  }

  // Konum takibini başlat
  async takibiBaslat() {
    try {
      const izinVar = await this.konumIzniIste();
      if (!izinVar) {
        throw new Error('Konum izni gerekli');
      }

      this.takipAktif = true;

      // İlk konumu al
      const ilkKonum = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const konumVerisi = this.konumVerisiniFormatla(ilkKonum);
      this.konumEkle(konumVerisi);

      // Sürekli konum takibi
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // 2 saniyede bir
          distanceInterval: 5, // 5 metre hareket
        },
        (konum) => {
          const konumVerisi = this.konumVerisiniFormatla(konum);
          this.konumEkle(konumVerisi);
        }
      );

      console.log('Konum takibi başlatıldı');
      return true;
    } catch (error) {
      console.error('Konum takibi başlatma hatası:', error);
      this.takipAktif = false;
      return false;
    }
  }

  // Konum takibini durdur
  async takibiDurdur() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.takipAktif = false;
    console.log('Konum takibi durduruldu');
  }

  // Konum verisini formatla
  konumVerisiniFormatla(konum) {
    return {
      latitude: konum.coords.latitude,
      longitude: konum.coords.longitude,
      altitude: konum.coords.altitude,
      accuracy: konum.coords.accuracy,
      speed: konum.coords.speed || 0,
      heading: konum.coords.heading,
      timestamp: konum.timestamp,
      kaynak: 'telefon'
    };
  }

  // Konum ekle
  async konumEkle(konumVerisi) {
    this.konumGecmisi.push(konumVerisi);

    // Maksimum 1000 nokta sakla
    if (this.konumGecmisi.length > 1000) {
      this.konumGecmisi = this.konumGecmisi.slice(-1000);
    }

    // AsyncStorage'a kaydet
    try {
      await AsyncStorage.setItem('konumGecmisi', JSON.stringify(this.konumGecmisi));
    } catch (error) {
      console.error('Konum kaydetme hatası:', error);
    }

    // Backend'e konum gönder
    this.konumGonder(konumVerisi);

    // Dinleyicileri bilgilendir
    this.dinleyicileriBilgilendir('yeniKonum', konumVerisi);
  }

  // Backend'e konum gönder
  async konumGonder(konumVerisi) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('Kullanıcı oturum açmamış, konum gönderilemedi');
        return;
      }

      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: konumVerisi.latitude,
          longitude: konumVerisi.longitude,
        }),
      });

      if (!response.ok) {
        console.error('Konum gönderme hatası:', response.status);
      }
    } catch (error) {
      console.error('Konum gönderme hatası:', error);
    }
  }

  // Konum geçmişini yükle
  async konumGecmisiniYukle() {
    try {
      const gecmis = await AsyncStorage.getItem('konumGecmisi');
      if (gecmis) {
        this.konumGecmisi = JSON.parse(gecmis);
      }
      return this.konumGecmisi;
    } catch (error) {
      console.error('Konum geçmişi yükleme hatası:', error);
      return [];
    }
  }

  // Konum geçmişini temizle
  async konumGecmisiniTemizle() {
    this.konumGecmisi = [];
    try {
      await AsyncStorage.removeItem('konumGecmisi');
    } catch (error) {
      console.error('Konum geçmişi temizleme hatası:', error);
    }
  }

  // Mesafe hesapla (Haversine formülü)
  mesafeHesapla(lat1, lon1, lat2, lon2) {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(derece) {
    return derece * (Math.PI / 180);
  }

  // Toplam mesafe hesapla
  toplamMesafeHesapla() {
    if (this.konumGecmisi.length < 2) return 0;

    let toplam = 0;
    for (let i = 1; i < this.konumGecmisi.length; i++) {
      const onceki = this.konumGecmisi[i - 1];
      const mevcut = this.konumGecmisi[i];
      toplam += this.mesafeHesapla(
        onceki.latitude, onceki.longitude,
        mevcut.latitude, mevcut.longitude
      );
    }
    return toplam;
  }

  // Ortalama hız hesapla
  ortalamaHizHesapla() {
    const hizlar = this.konumGecmisi
      .filter(konum => konum.speed && konum.speed > 0)
      .map(konum => konum.speed * 3.6); // m/s'den km/h'ye çevir

    if (hizlar.length === 0) return 0;
    return hizlar.reduce((a, b) => a + b, 0) / hizlar.length;
  }

  // Dinleyici ekle
  dinleyiciEkle(callback) {
    this.dinleyiciler.push(callback);
  }

  // Dinleyicileri bilgilendir
  dinleyicileriBilgilendir(tip, veri) {
    this.dinleyiciler.forEach(callback => {
      callback(tip, veri);
    });
  }

  // Getter'lar
  get aktifMi() {
    return this.takipAktif;
  }

  get gecmis() {
    return this.konumGecmisi;
  }

  get sonKonum() {
    return this.konumGecmisi[this.konumGecmisi.length - 1] || null;
  }
}

export default new KonumServisi();