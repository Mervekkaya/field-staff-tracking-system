import { BleManager } from 'react-native-ble-plx';
import { Alert, Platform } from 'react-native';

let manager = null;
let bagliCihaz = null;

function ensureManager() {
  if (!manager) {
    try {
      manager = new BleManager();
    } catch (e) {
      console.error('BLE Manager init error:', e);
      manager = null;
    }
  }
  return manager;
}

export function telefonaBagli() {
  return !!bagliCihaz;
}

async function bluetoothAcikMi() {
  const m = ensureManager();
  if (!m) return false;
  try {
    const state = await m.state();
    return state === 'PoweredOn';
  } catch (e) {
    return false;
  }
}

export async function taraVeBaglan() {
  const m = ensureManager();
  if (!m) {
    return { basarili: false, mesaj: 'BLE desteklenmiyor' };
  }

  if (!(await bluetoothAcikMi())) {
    Alert.alert('Bluetooth Kapalı', 'Lütfen Bluetooth\'u açın.');
    return { basarili: false, mesaj: 'Bluetooth kapalı' };
  }

  const bulunan = [];
  try {
    await new Promise((resolve) => {
      m.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Telefon tarama hatası:', error);
          m.stopDeviceScan();
          resolve();
          return;
        }
        if (device && device.name) {
          // Basit bir sezgisel: bazı telefonlar ad yayınlar, çoğu yayınlamaz.
          // Örnek filtre: adında 'Phone', 'Android', 'iPhone' geçenler
          const ad = device.name.toLowerCase();
          if (ad.includes('phone') || ad.includes('android') || ad.includes('iphone')) {
            if (!bulunan.find((d) => d.id === device.id)) {
              bulunan.push({ id: device.id, isim: device.name, rssi: device.rssi });
            }
          }
        }
      });

      setTimeout(() => {
        try { m.stopDeviceScan(); } catch {}
        resolve();
      }, 12000);
    });

    if (bulunan.length === 0) {
      return { basarili: false, mesaj: 'Uygun telefon yayını bulunamadı' };
    }

    // İlk cihaza bağlanmayı dene (çoğu telefonda GATT açık değildir; bu sadece demo)
    const hedef = bulunan[0];
    try {
      const device = await m.connectToDevice(hedef.id);
      await device.discoverAllServicesAndCharacteristics();
      bagliCihaz = device;
      return { basarili: true, cihazIsmi: hedef.isim };
    } catch (e) {
      return { basarili: false, mesaj: e?.message || 'Bağlantı başarısız' };
    }
  } catch (e) {
    return { basarili: false, mesaj: e?.message || 'Tarama sırasında hata' };
  }
}

export async function baglantiyiKes() {
  if (bagliCihaz) {
    try {
      await bagliCihaz.cancelConnection();
    } catch {}
    bagliCihaz = null;
  }
}


