import { BleManager } from 'react-native-ble-plx';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

class SaatServisi {
  constructor() {
    try {
      this.manager = new BleManager();
      console.log('BLE Manager başarıyla oluşturuldu');
    } catch (error) {
      console.error('BLE Manager oluşturma hatası:', error);
      this.manager = null;
    }
    this.cihaz = null;
    this.bagliMi = false;
    this.dinleyiciler = [];

    // Haino Teko ve genel akıllı saat isimleri
    this.DESTEKLENEN_CIHAZLAR = [
      'Watch 9',
      'HT Watch',
      'Haino Teko',
      'G9 Mini',
      'Smart Watch',
      'Mi Band',
      'Amazfit',
      'Huawei Watch',
      'Samsung Galaxy Watch'
    ];

    // BLE Servisleri - Saatimin gerçek UUID'leri
    this.SERVISLER = {
      // Standart servisler
      KALP_ATISI: '0000180D-0000-1000-8000-00805F9B34FB',
      BATARYA: '0000180F-0000-1000-8000-00805F9B34FB',
      CIHAZ_BILGISI: '0000180A-0000-1000-8000-00805F9B34FB',
      FITNESS: '0000FEE0-0000-1000-8000-00805F9B34FB',

      // Saatimin özel servisleri 
      SAAT_ANA_SERVIS: '0000ae00-0000-1000-8000-00805f9b34fb',
      SAAT_VERI_SERVIS: '6e40ab01-b5a3-f393-e0a9-e50e24dcca9e',
      GAP_SERVIS: '00001800-0000-1000-8000-00805f9b34fb'
    };

    this.KARAKTERISTIKLER = {
      // Standart karakteristikler
      KALP_ATISI: '00002A37-0000-1000-8000-00805F9B34FB',
      BATARYA: '00002A19-0000-1000-8000-00805F9B34FB',
      ADIM_SAYISI: '00002A53-0000-1000-8000-00805F9B34FB',

      // Saatimin özel servisleri
      SAAT_YAZMA: '0000ae01-0000-1000-8000-00805f9b34fb',
      SAAT_BILDIRIM: '0000ae02-0000-1000-8000-00805f9b34fb',
      VERI_YAZMA: '6e40ab02-b5a3-f393-e0a9-e50e24dcca9e',
      VERI_BILDIRIM: '6e40ab03-b5a3-f393-e0a9-e50e24dcca9e',

      // GAP servisi karakteristikleri
      CIHAZ_ADI: '00002a00-0000-1000-8000-00805f9b34fb',
      GORUNUM: '00002a01-0000-1000-8000-00805f9b34fb'
    };
  }

  // BLE durumunu kontrol et
  async bleDurumunuKontrol() {
    try {
      if (!this.manager) {
        console.log('BLE Manager mevcut değil');
        return false;
      }

      const durum = await this.manager.state();
      console.log('BLE durumu:', durum);
      return durum === 'PoweredOn';
    } catch (error) {
      console.error('BLE durum kontrolü hatası:', error);
      return false;
    }
  }

  // Android 12+ için çalışma zamanı izinleri: BLUETOOTH_SCAN, BLUETOOTH_CONNECT
  async izinleriIste() {
    try {
      if (!this.manager) return false;

      if (Platform.OS === 'android') {
        // Bluetooth açık mı?
        const durum = await this.manager.state();
        if (durum !== 'PoweredOn') {
          Alert.alert('Bluetooth Kapalı', 'Lütfen Bluetooth\'u açın ve tekrar deneyin.');
          return false;
        }

        // Android sürümüne göre gerekli izinleri iste
        try {
          const version = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);

          // Android 12+ (API 31+) için BLE runtime izinleri
          if (version >= 31) {
            const scan = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              {
                title: 'Bluetooth Tarama İzni',
                message: 'Yakındaki akıllı saatleri bulmak için Bluetooth tarama iznine ihtiyaç var.',
                buttonPositive: 'İzin Ver',
              }
            );

            const connect = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              {
                title: 'Bluetooth Bağlantı İzni',
                message: 'Akıllı saate bağlanmak için Bluetooth bağlantı iznine ihtiyaç var.',
                buttonPositive: 'İzin Ver',
              }
            );

            if (scan !== PermissionsAndroid.RESULTS.GRANTED || connect !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('İzin Gerekli', 'Bluetooth izinleri verilmedi. Bağlantı kurulamaz.');
              return false;
            }
          } else {
            // Android 11 ve altı için konum izni gerekli (BLE tarama için)
            const fine = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Konum İzni',
                message: 'Bluetooth cihazlarını taramak için konum izni gereklidir.',
                buttonPositive: 'İzin Ver',
              }
            );
            if (fine !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('İzin Gerekli', 'Konum izni verilmedi. BLE taraması yapılamaz.');
              return false;
            }
          }
        } catch (e) {
          console.warn('Android izinleri istenirken hata:', e);
          // Bazı cihazlarda izinler zaten verilmiş olabilir; devam etmeyi dene
        }
      }
      return true;
    } catch (error) {
      Alert.alert('İzin Hatası', 'Bluetooth izinleri alınamadı: ' + (error?.message || 'bilinmiyor'));
      return false;
    }
  }

  // Cihazları tara
  async cihazlariTara() {
    return new Promise((resolve, reject) => {
      if (!this.manager) {
        console.error('BLE Manager mevcut değil');
        resolve([]);
        return;
      }

      // İzin kontrolü (ek güvenlik)
      this.izinleriIste().then((izinVar) => {
        if (!izinVar) {
          resolve([]);
          return;
        }

        const bulunanCihazlar = [];
        console.log('Akıllı saatler taranıyor...');

        try {
          this.manager.startDeviceScan(null, null, (error, cihaz) => {
            if (error) {
              console.error('Tarama hatası:', error);
              Alert.alert('Tarama Hatası', error?.message || 'Cihaz tarama sırasında hata oluştu');
              this.manager.stopDeviceScan();
              resolve(bulunanCihazlar);
              return;
            }

            if (cihaz && cihaz.name && this.desteklenenCihazMi(cihaz.name)) {
              console.log('Desteklenen cihaz bulundu:', cihaz.name, 'RSSI:', cihaz.rssi);

              // Aynı cihazı tekrar ekleme
              const mevcutMu = bulunanCihazlar.find(c => c.id === cihaz.id);
              if (!mevcutMu) {
                bulunanCihazlar.push({
                  id: cihaz.id,
                  isim: cihaz.name,
                  rssi: cihaz.rssi,
                  manufacturerData: cihaz.manufacturerData,
                  serviceUUIDs: cihaz.serviceUUIDs
                });
              }
            }
          });

          // 15 saniye sonra taramayı durdur
          setTimeout(() => {
            try {
              this.manager.stopDeviceScan();
              console.log(`Tarama tamamlandı. ${bulunanCihazlar.length} cihaz bulundu.`);
              resolve(bulunanCihazlar);
            } catch (error) {
              console.error('Tarama durdurma hatası:', error);
              resolve(bulunanCihazlar);
            }
          }, 15000);

        } catch (error) {
          console.error('Tarama başlatma hatası:', error);
          Alert.alert('Tarama Başlatılamadı', error?.message || 'Bilinmeyen bir hata');
          resolve([]);
        }
      });
    });
  }

  // Desteklenen cihaz mı kontrol et
  desteklenenCihazMi(cihazIsmi) {
    return this.DESTEKLENEN_CIHAZLAR.some(isim =>
      cihazIsmi.toLowerCase().includes(isim.toLowerCase())
    );
  }

  // Cihaza bağlan
  async cihazaBaglan(cihazId) {
    try {
      console.log('Cihaza bağlanılıyor:', cihazId);

      const izinOk = await this.izinleriIste();
      if (!izinOk) {
        return false;
      }

      this.cihaz = await this.manager.connectToDevice(cihazId);
      console.log('Bağlantı kuruldu, servisler keşfediliyor...');

      await this.cihaz.discoverAllServicesAndCharacteristics();

      this.bagliMi = true;

      // Bağlandıktan sonra servis/karakteristik debug dökümü
      await this.servisleriYazdir();

      // Veri dinlemeyi başlat (hata durumunda bile devam et)
      try {
        await this.veriDinlemeyiBaslat();
      } catch (error) {
        console.log('Veri dinleme başlatılamadı, ancak bağlantı devam ediyor:', error.message);
      }

      this.dinleyicileriBilgilendir('baglantiDurumu', { bagliMi: true, cihaz: this.cihaz });

      console.log('Saat başarıyla bağlandı');
      return true;

    } catch (error) {
      console.error('Bağlantı hatası:', error);
      Alert.alert('Bağlantı Hatası', error?.message || 'Cihaza bağlanılamadı');
      this.bagliMi = false;
      this.dinleyicileriBilgilendir('baglantiDurumu', { bagliMi: false, hata: error.message });
      return false;
    }
  }

  // Veri dinlemeyi başlat
  async veriDinlemeyiBaslat() {
    if (!this.cihaz) return;

    try {
      // Saatinizin özel servislerini dinle
      await this.saatServisleriniDinle();

      // Standart servisleri de dene
      await this.bataryaDinle();
      await this.adimSayisiDinle();

      // İlk verileri manuel oku
      await this.ilkVerileriOku();

      // Periyodik veri okuma başlat
      this.periyodikVeriOkuma();

    } catch (error) {
      console.error('Veri dinleme başlatma hatası:', error);
      console.log('Veri dinleme servisleri başlatılamadı, ancak bağlantı devam ediyor');
    }
  }

  // Saatinizin özel servislerini dinle
  async saatServisleriniDinle() {
    try {
      console.log('Saatin özel servisleri dinleniyor...');

      // Ana servis bildirimlerini dinle
      await this.saatBildirimDinle(this.SERVISLER.SAAT_ANA_SERVIS, this.KARAKTERISTIKLER.SAAT_BILDIRIM);

      // Veri servis bildirimlerini dinle  
      await this.saatBildirimDinle(this.SERVISLER.SAAT_VERI_SERVIS, this.KARAKTERISTIKLER.VERI_BILDIRIM);

      // Veri isteme komutları gönder
      await this.veriIstemeKomutlariGonder();

    } catch (error) {
      console.log('Özel servis dinleme hatası:', error.message);
    }
  }

  // Saat bildirimlerini dinle
  async saatBildirimDinle(servisUUID, karakteristikUUID) {
    try {
      const services = await this.cihaz.services();
      const service = services.find(s => s.uuid.toLowerCase() === servisUUID.toLowerCase());

      if (!service) {
        console.log(`Servis bulunamadı: ${servisUUID}`);
        return;
      }

      const characteristics = await this.cihaz.characteristicsForService(servisUUID);
      const characteristic = characteristics.find(c => c.uuid.toLowerCase() === karakteristikUUID.toLowerCase());

      if (!characteristic || !characteristic.isNotifiable) {
        console.log(`Bildirim karakteristiği bulunamadı: ${karakteristikUUID}`);
        return;
      }

      console.log(`Bildirim dinleniyor: ${servisUUID} -> ${karakteristikUUID}`);

      this.cihaz.monitorCharacteristicForService(
        servisUUID,
        karakteristikUUID,
        (error, karakteristik) => {
          if (error) {
            console.error(`Bildirim dinleme hatası (${karakteristikUUID}):`, error);
            return;
          }

          if (karakteristik && karakteristik.value) {
            console.log(`Veri alındı (${karakteristikUUID}):`, karakteristik.value);
            this.saatVerisiParse(karakteristik.value, karakteristikUUID);
          }
        }
      );

    } catch (error) {
      console.log(`Bildirim dinleme başlatma hatası (${karakteristikUUID}):`, error.message);
    }
  }

  // Veri isteme komutları gönder
  async veriIstemeKomutlariGonder() {
    try {
      console.log('Saattan veri isteme komutları gönderiliyor...');

      // Çeşitli Smart Watch protokol komutları deneyelim
      const komutlar = [
        // Temel komutlar
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x01, 0x01], aciklama: 'Sistem durumu' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x02, 0x01], aciklama: 'Genel durum' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x03, 0x01], aciklama: 'Batarya seviyesi' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x04, 0x01], aciklama: 'Adım sayısı' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x05, 0x01], aciklama: 'Güç durumu' },

        // Alternatif protokol komutları
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x10, 0x01], aciklama: 'Veri sync 1' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x20, 0x01], aciklama: 'Veri sync 2' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x30, 0x01], aciklama: 'Veri sync 3' },

        // Hex komutları
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0xAA, 0x55], aciklama: 'Senkronizasyon' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0xFF, 0x01], aciklama: 'Tüm veriler' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x55, 0xAA], aciklama: 'Alternatif sync' },

        // Daha uzun komutlar
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0x7E, 0x00, 0x03, 0x01, 0x7E], aciklama: 'Çerçeveli komut' },
        { servis: this.SERVISLER.SAAT_VERI_SERVIS, char: this.KARAKTERISTIKLER.VERI_YAZMA, komut: [0xAB, 0x00, 0x04, 0xFF, 0x57, 0x80], aciklama: 'Özel protokol' }
      ];

      // Komutları sırayla gönder
      for (let i = 0; i < komutlar.length; i++) {
        const { servis, char, komut, aciklama } = komutlar[i];
        console.log(`Komut ${i + 1}/${komutlar.length}: ${aciklama}`);

        await this.komutGonder(servis, char, komut);

        // Komutlar arasında kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Daha uzun komut dizileri (bazı saatler için gerekli)
      setTimeout(async () => {
        console.log('Uzun komut dizileri gönderiliyor...');

        // Çeşitli uzun komutlar
        const uzunKomutlar = [
          [0x01, 0x02, 0x03, 0x04, 0x05],
          [0x10, 0x20, 0x30, 0x40, 0x50],
          [0xA1, 0xB2, 0xC3, 0xD4, 0xE5],
          [0xFF, 0xFE, 0xFD, 0xFC, 0xFB],
          [0x00, 0x11, 0x22, 0x33, 0x44]
        ];

        for (const komut of uzunKomutlar) {
          await this.komutGonder(this.SERVISLER.SAAT_VERI_SERVIS, this.KARAKTERISTIKLER.VERI_YAZMA, komut);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }, 5000);

    } catch (error) {
      console.log('Komut gönderme hatası:', error.message);
    }
  }

  // Komut gönder
  async komutGonder(servisUUID, karakteristikUUID, komutArray) {
    try {
      const services = await this.cihaz.services();
      const service = services.find(s => s.uuid.toLowerCase() === servisUUID.toLowerCase());

      if (!service) {
        console.log(`Komut servisi bulunamadı: ${servisUUID}`);
        return false;
      }

      const characteristics = await this.cihaz.characteristicsForService(servisUUID);
      const characteristic = characteristics.find(c => c.uuid.toLowerCase() === karakteristikUUID.toLowerCase());

      if (!characteristic || (!characteristic.isWritableWithResponse && !characteristic.isWritableWithoutResponse)) {
        console.log(`Yazma karakteristiği bulunamadı: ${karakteristikUUID}`);
        return false;
      }

      const buffer = Buffer.from(komutArray);
      const base64Data = buffer.toString('base64');

      console.log(`Komut gönderiliyor: [${komutArray.join(', ')}] -> ${base64Data}`);

      await this.cihaz.writeCharacteristicWithResponseForService(
        servisUUID,
        karakteristikUUID,
        base64Data
      );

      console.log('Komut başarıyla gönderildi');
      return true;

    } catch (error) {
      console.log(`Komut gönderme hatası (${karakteristikUUID}):`, error.message);
      return false;
    }
  }

  // Saat verisini parse et
  saatVerisiParse(base64Data, karakteristikUUID) {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const bytes = Array.from(buffer);

      console.log(`Veri parse ediliyor (${karakteristikUUID}): [${bytes.join(', ')}]`);

      // Batarya verisi kontrolü
      if (bytes.length >= 2) {
        // Batarya genellikle 2. veya 3. byte'ta olur
        for (let i = 0; i < bytes.length; i++) {
          const deger = bytes[i];
          if (deger > 0 && deger <= 100) {
            console.log(`Potansiyel batarya verisi bulundu: ${deger}% (index: ${i})`);
            this.dinleyicileriBilgilendir('batarya', deger);
          }
        }
      }

      // Adım sayısı kontrolü (genellikle 2-4 byte)
      if (bytes.length >= 4) {
        // Little endian 32-bit integer
        const adim32 = buffer.readUInt32LE(0);
        if (adim32 > 0 && adim32 < 100000) {
          console.log(`Potansiyel adım verisi (32-bit): ${adim32}`);
          this.dinleyicileriBilgilendir('adimSayisi', adim32);
        }

        // Big endian 32-bit integer
        const adim32BE = buffer.readUInt32BE(0);
        if (adim32BE > 0 && adim32BE < 100000) {
          console.log(`Potansiyel adım verisi (32-bit BE): ${adim32BE}`);
          this.dinleyicileriBilgilendir('adimSayisi', adim32BE);
        }
      }

      if (bytes.length >= 2) {
        // 16-bit integer
        const adim16 = buffer.readUInt16LE(0);
        if (adim16 > 0 && adim16 < 65000) {
          console.log(`Potansiyel adım verisi (16-bit): ${adim16}`);
          this.dinleyicileriBilgilendir('adimSayisi', adim16);
        }
      }

    } catch (error) {
      console.error('Veri parse hatası:', error);
    }
  }



  // Batarya dinle
  async bataryaDinle() {
    try {
      // Önce servisin mevcut olup olmadığını kontrol et
      const services = await this.cihaz.services();
      const batteryService = services.find(s => s.uuid === this.SERVISLER.BATARYA);

      if (!batteryService) {
        console.log('Batarya servisi bulunamadı, atlanıyor');
        return;
      }

      // Karakteristiği kontrol et
      const characteristics = await this.cihaz.characteristicsForService(this.SERVISLER.BATARYA);
      const batteryChar = characteristics.find(c => c.uuid === this.KARAKTERISTIKLER.BATARYA);

      if (!batteryChar) {
        console.log('Batarya karakteristiği bulunamadı, atlanıyor');
        return;
      }

      this.cihaz.monitorCharacteristicForService(
        this.SERVISLER.BATARYA,
        this.KARAKTERISTIKLER.BATARYA,
        (error, karakteristik) => {
          if (error) {
            console.error('Batarya dinleme hatası:', error);
            return;
          }

          if (karakteristik && karakteristik.value) {
            const batarya = this.bataryaParse(karakteristik.value);
            if (batarya !== null) {
              this.dinleyicileriBilgilendir('batarya', batarya);
            }
          }
        }
      );
    } catch (error) {
      console.log('Batarya servisi başlatılamadı:', error.message);
      // Hata durumunda uygulamanın çökmesini önle
    }
  }

  // Adım sayısı dinle
  async adimSayisiDinle() {
    try {
      // Önce servisin mevcut olup olmadığını kontrol et
      const services = await this.cihaz.services();
      const fitnessService = services.find(s => s.uuid === this.SERVISLER.FITNESS);

      if (!fitnessService) {
        console.log('Fitness servisi bulunamadı, atlanıyor');
        return;
      }

      // Karakteristiği kontrol et
      const characteristics = await this.cihaz.characteristicsForService(this.SERVISLER.FITNESS);
      const stepChar = characteristics.find(c => c.uuid === this.KARAKTERISTIKLER.ADIM_SAYISI);

      if (!stepChar) {
        console.log('Adım sayısı karakteristiği bulunamadı, atlanıyor');
        return;
      }

      this.cihaz.monitorCharacteristicForService(
        this.SERVISLER.FITNESS,
        this.KARAKTERISTIKLER.ADIM_SAYISI,
        (error, karakteristik) => {
          if (error) {
            console.error('Adım sayısı dinleme hatası:', error);
            return;
          }

          if (karakteristik && karakteristik.value) {
            const adimSayisi = this.adimSayisiParse(karakteristik.value);
            if (adimSayisi !== null) {
              this.dinleyicileriBilgilendir('adimSayisi', adimSayisi);
            }
          }
        }
      );
    } catch (error) {
      console.log('Adım sayısı servisi başlatılamadı:', error.message);
      // Hata durumunda uygulamanın çökmesini önle
    }
  }



  // Batarya parse et
  bataryaParse(base64Data) {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      return buffer.readUInt8(0);
    } catch (error) {
      console.error('Batarya parse hatası:', error);
      return null;
    }
  }

  // Adım sayısı parse et
  adimSayisiParse(base64Data) {
    try {
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length >= 4) {
        return buffer.readUInt32LE(0);
      } else if (buffer.length >= 2) {
        return buffer.readUInt16LE(0);
      }

      return null;
    } catch (error) {
      console.error('Adım sayısı parse hatası:', error);
      return null;
    }
  }

  // İlk verileri manuel oku
  async ilkVerileriOku() {
    try {
      console.log('İlk veriler okunuyor...');

      // Önce standart yöntemle dene
      await this.bataryaOku();
      await this.adimSayisiOku();

      // Eğer veri gelmezse akıllı tarama yap
      setTimeout(async () => {
        try {
          console.log('Akıllı veri tarama başlatılıyor...');
          await this.akilliBataryaOku();
          await this.akilliAdimSayisiOku();
        } catch (error) {
          console.log('Akıllı veri tarama hatası:', error.message);
        }
      }, 3000); // 3 saniye sonra akıllı tarama

      console.log('İlk veri okuma tamamlandı');
    } catch (error) {
      console.log('İlk veri okuma hatası:', error.message);
    }
  }

  // Batarya seviyesini manuel oku
  async bataryaOku() {
    try {
      const services = await this.cihaz.services();
      const batteryService = services.find(s => s.uuid === this.SERVISLER.BATARYA);

      if (batteryService) {
        const characteristics = await this.cihaz.characteristicsForService(this.SERVISLER.BATARYA);
        const batteryChar = characteristics.find(c => c.uuid === this.KARAKTERISTIKLER.BATARYA);

        if (batteryChar && batteryChar.isReadable) {
          const result = await this.cihaz.readCharacteristicForService(
            this.SERVISLER.BATARYA,
            this.KARAKTERISTIKLER.BATARYA
          );

          if (result && result.value) {
            const batarya = this.bataryaParse(result.value);
            if (batarya !== null) {
              this.dinleyicileriBilgilendir('batarya', batarya);
              console.log('Batarya seviyesi okundu:', batarya + '%');
            }
          }
        }
      }
    } catch (error) {
      console.log('Batarya okuma hatası:', error.message);
    }
  }

  // Adım sayısını manuel oku
  async adimSayisiOku() {
    try {
      const services = await this.cihaz.services();
      const fitnessService = services.find(s => s.uuid === this.SERVISLER.FITNESS);

      if (fitnessService) {
        const characteristics = await this.cihaz.characteristicsForService(this.SERVISLER.FITNESS);
        const stepChar = characteristics.find(c => c.uuid === this.KARAKTERISTIKLER.ADIM_SAYISI);

        if (stepChar && stepChar.isReadable) {
          const result = await this.cihaz.readCharacteristicForService(
            this.SERVISLER.FITNESS,
            this.KARAKTERISTIKLER.ADIM_SAYISI
          );

          if (result && result.value) {
            const adimSayisi = this.adimSayisiParse(result.value);
            if (adimSayisi !== null) {
              this.dinleyicileriBilgilendir('adimSayisi', adimSayisi);
              console.log('Adım sayısı okundu:', adimSayisi);
            }
          }
        }
      }
    } catch (error) {
      console.log('Adım sayısı okuma hatası:', error.message);
    }
  }

  // Periyodik veri okuma (her 15 saniyede bir)
  periyodikVeriOkuma() {
    if (this.veriOkumaInterval) {
      clearInterval(this.veriOkumaInterval);
    }

    this.veriOkumaInterval = setInterval(async () => {
      if (this.bagliMi && this.cihaz) {
        try {
          console.log('Periyodik veri güncelleniyor...');

          // Önce standart yöntemle dene
          await this.bataryaOku();
          await this.adimSayisiOku();

          // Akıllı tarama da yap (daha güvenilir)
          await this.akilliBataryaOku();
          await this.akilliAdimSayisiOku();

        } catch (error) {
          console.log('Periyodik veri okuma hatası:', error.message);
        }
      }
    }, 15000); // 15 saniye (daha sık güncelleme)
  }

  // Bağlantıyı kes
  async baglantiKes() {
    if (this.cihaz) {
      try {
        // Periyodik veri okuma interval'ını temizle
        if (this.veriOkumaInterval) {
          clearInterval(this.veriOkumaInterval);
          this.veriOkumaInterval = null;
        }

        await this.cihaz.cancelConnection();
        this.cihaz = null;
        this.bagliMi = false;
        this.dinleyicileriBilgilendir('baglantiDurumu', { bagliMi: false });
        console.log('Saat bağlantısı kesildi');
      } catch (error) {
        console.error('Bağlantı kesme hatası:', error);
        Alert.alert('Bağlantı Kesilemedi', error?.message || 'Bilinmeyen bir hata');
      }
    }
  }

  // Debug: Servis ve karakteristik listesi
  async servisleriYazdir() {
    try {
      if (!this.cihaz) return;
      const services = await this.cihaz.services();
      console.log('--- GATT Servisleri ---');
      for (const s of services) {
        const chars = await this.cihaz.characteristicsForService(s.uuid);
        console.log(`Service: ${s.uuid}`);
        for (const c of chars) {
          console.log(`  Char: ${c.uuid} - Read: ${c.isReadable}, Write: ${c.isWritableWithResponse || c.isWritableWithoutResponse}, Notify: ${c.isNotifiable}, Indicate: ${c.isIndicatable}`);
        }
      }
      console.log('--- GATT Sonu ---');
    } catch (error) {
      console.error('Servis/karakteristik yazdırma hatası:', error);
    }
  }

  // Tüm mevcut servisleri ve karakteristikleri tara
  async tumServisleriTara() {
    try {
      if (!this.cihaz) return [];

      const services = await this.cihaz.services();
      const servisBilgileri = [];

      for (const service of services) {
        const characteristics = await this.cihaz.characteristicsForService(service.uuid);

        servisBilgileri.push({
          serviceUUID: service.uuid,
          characteristics: characteristics.map(char => ({
            uuid: char.uuid,
            isReadable: char.isReadable,
            isWritable: char.isWritableWithResponse || char.isWritableWithoutResponse,
            isNotifiable: char.isNotifiable,
            isIndicatable: char.isIndicatable
          }))
        });
      }

      return servisBilgileri;
    } catch (error) {
      console.error('Servis tarama hatası:', error);
      return [];
    }
  }

  // Akıllı veri okuma - tüm readable karakteristikleri dene
  async akilliBataryaOku() {
    try {
      const servisBilgileri = await this.tumServisleriTara();

      for (const servis of servisBilgileri) {
        for (const char of servis.characteristics) {
          if (char.isReadable) {
            try {
              const result = await this.cihaz.readCharacteristicForService(
                servis.serviceUUID,
                char.uuid
              );

              if (result && result.value) {
                const buffer = Buffer.from(result.value, 'base64');

                // Batarya verisi olabilecek değerleri kontrol et
                if (buffer.length === 1) {
                  const deger = buffer.readUInt8(0);
                  if (deger >= 0 && deger <= 100) {
                    console.log(`Potansiyel batarya verisi bulundu: ${deger}% (Service: ${servis.serviceUUID}, Char: ${char.uuid})`);
                    this.dinleyicileriBilgilendir('batarya', deger);
                    return deger;
                  }
                }
              }
            } catch (error) {
              // Bu karakteristik okunamadı, devam et
              continue;
            }
          }
        }
      }

      console.log('Batarya verisi bulunamadı');
      return null;
    } catch (error) {
      console.error('Akıllı batarya okuma hatası:', error);
      return null;
    }
  }

  // Akıllı adım sayısı okuma
  async akilliAdimSayisiOku() {
    try {
      const servisBilgileri = await this.tumServisleriTara();

      for (const servis of servisBilgileri) {
        for (const char of servis.characteristics) {
          if (char.isReadable) {
            try {
              const result = await this.cihaz.readCharacteristicForService(
                servis.serviceUUID,
                char.uuid
              );

              if (result && result.value) {
                const buffer = Buffer.from(result.value, 'base64');

                // Adım sayısı olabilecek değerleri kontrol et
                if (buffer.length >= 2) {
                  let deger;
                  if (buffer.length >= 4) {
                    deger = buffer.readUInt32LE(0);
                  } else {
                    deger = buffer.readUInt16LE(0);
                  }

                  // Makul adım sayısı aralığında mı? (0-100000)
                  if (deger >= 0 && deger <= 100000) {
                    console.log(`Potansiyel adım verisi bulundu: ${deger} (Service: ${servis.serviceUUID}, Char: ${char.uuid})`);
                    this.dinleyicileriBilgilendir('adimSayisi', deger);
                    return deger;
                  }
                }
              }
            } catch (error) {
              // Bu karakteristik okunamadı, devam et
              continue;
            }
          }
        }
      }

      console.log('Adım sayısı verisi bulunamadı');
      return null;
    } catch (error) {
      console.error('Akıllı adım sayısı okuma hatası:', error);
      return null;
    }
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
    return this.bagliMi;
  }

  get mevcutCihaz() {
    return this.cihaz;
  }

  // Public metodlar
  async testVeriOkuma() {
    console.log('=== SAAT VERİ TEST BAŞLADI ===');

    if (!this.bagliMi || !this.cihaz) {
      console.log('Saat bağlı değil!');
      return false;
    }

    try {
      // Tüm servisleri listele
      await this.servisleriYazdir();

      // Yoğun komut gönderimi
      console.log('Yoğun komut gönderimi başlatılıyor...');
      await this.veriIstemeKomutlariGonder();

      // Biraz bekle
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Akıllı veri okuma
      console.log('Akıllı veri okuma başlatılıyor...');
      const batarya = await this.akilliBataryaOku();
      const adimSayisi = await this.akilliAdimSayisiOku();

      // Tüm readable karakteristikleri oku ve logla
      console.log('Tüm readable karakteristikler okunuyor...');
      await this.tumReadableKarakteristikleriOku();

      console.log(`Test sonucu - Batarya: ${batarya}%, Adım: ${adimSayisi}`);
      console.log('=== SAAT VERİ TEST BİTTİ ===');

      return { batarya, adimSayisi };
    } catch (error) {
      console.error('Test hatası:', error);
      return false;
    }
  }

  // Tüm readable karakteristikleri oku ve logla
  async tumReadableKarakteristikleriOku() {
    try {
      const servisBilgileri = await this.tumServisleriTara();

      console.log('=== TÜM READABLe KARAKTERİSTİKLER ===');

      for (const servis of servisBilgileri) {
        console.log(`Servis: ${servis.serviceUUID}`);

        for (const char of servis.characteristics) {
          if (char.isReadable) {
            try {
              const result = await this.cihaz.readCharacteristicForService(
                servis.serviceUUID,
                char.uuid
              );

              if (result && result.value) {
                const buffer = Buffer.from(result.value, 'base64');
                const bytes = Array.from(buffer);
                const hexString = bytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');

                console.log(`  Char: ${char.uuid}`);
                console.log(`    Bytes: [${bytes.join(', ')}]`);
                console.log(`    Hex: ${hexString}`);
                console.log(`    String: ${buffer.toString('ascii').replace(/[^\x20-\x7E]/g, '.')}`);

                // Potansiyel veri analizi
                this.veriAnaliziYap(bytes, char.uuid);

              } else {
                console.log(`  Char: ${char.uuid} - Veri yok`);
              }
            } catch (error) {
              console.log(`  Char: ${char.uuid} - Okuma hatası: ${error.message}`);
            }
          }
        }
      }

      console.log('=== TÜM READABLe KARAKTERİSTİKLER SONU ===');
    } catch (error) {
      console.error('Tüm karakteristik okuma hatası:', error);
    }
  }

  // Veri analizi yap
  veriAnaliziYap(bytes, karakteristikUUID) {
    try {
      // Batarya analizi
      for (let i = 0; i < bytes.length; i++) {
        const deger = bytes[i];
        if (deger > 0 && deger <= 100) {
          console.log(`    -> Potansiyel batarya: ${deger}% (index ${i})`);
        }
      }

      // Adım sayısı analizi
      if (bytes.length >= 2) {
        const buffer = Buffer.from(bytes);

        // 16-bit değerler
        for (let i = 0; i <= bytes.length - 2; i++) {
          const val16LE = buffer.readUInt16LE(i);
          const val16BE = buffer.readUInt16BE(i);

          if (val16LE > 0 && val16LE < 65000) {
            console.log(`    -> Potansiyel adım (16-bit LE): ${val16LE} (index ${i})`);
          }
          if (val16BE > 0 && val16BE < 65000 && val16BE !== val16LE) {
            console.log(`    -> Potansiyel adım (16-bit BE): ${val16BE} (index ${i})`);
          }
        }

        // 32-bit değerler
        if (bytes.length >= 4) {
          for (let i = 0; i <= bytes.length - 4; i++) {
            const val32LE = buffer.readUInt32LE(i);
            const val32BE = buffer.readUInt32BE(i);

            if (val32LE > 0 && val32LE < 100000) {
              console.log(`    -> Potansiyel adım (32-bit LE): ${val32LE} (index ${i})`);
            }
            if (val32BE > 0 && val32BE < 100000 && val32BE !== val32LE) {
              console.log(`    -> Potansiyel adım (32-bit BE): ${val32BE} (index ${i})`);
            }
          }
        }
      }

      // Zaman damgası analizi
      if (bytes.length >= 4) {
        const buffer = Buffer.from(bytes);
        const timestamp = buffer.readUInt32LE(0);

        // Unix timestamp kontrolü (2020-2030 arası)
        if (timestamp > 1577836800 && timestamp < 1893456000) {
          const date = new Date(timestamp * 1000);
          console.log(`    -> Potansiyel zaman damgası: ${date.toLocaleString()}`);
        }
      }

    } catch (error) {
      console.log(`    -> Veri analizi hatası: ${error.message}`);
    }
  }
}

export default new SaatServisi();