/**
 * Native (Capacitor) yoki HTML file input orqali rasm tanlash.
 *
 * APK ichida: native kamera/galereya tanlovi ko'rsatadi (yaxshi UX, kamerani to'liq nazorat).
 * Brauzer/PWA'da: HTML file input bilan ishlaydi (capture="environment" bilan mobil kamera).
 */
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Native rejimda kamera/galereya tanlovi.
 * Web rejimda undefined qaytaradi — chaqiruvchi HTML input ishlatishi kerak.
 */
export async function pickImageNative(): Promise<File | undefined> {
  if (!Capacitor.isNativePlatform()) return undefined;

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Kamera / Galereya tanlovi
      saveToGallery: false,
      correctOrientation: true,
      promptLabelHeader: 'Rasm tanlang',
      promptLabelPhoto: 'Galereyadan',
      promptLabelPicture: 'Kameradan suratga olish',
    });

    if (!photo.webPath) {
      throw new Error('Photo URI yo\'q');
    }

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const ext = photo.format || 'jpeg';
    return new File([blob], `capture-${Date.now()}.${ext}`, { type: `image/${ext}` });
  } catch (e) {
    // Foydalanuvchi bekor qildi yoki ruxsat bermadi
    if ((e as Error).message?.toLowerCase().includes('cancel')) return undefined;
    console.error('Camera capture failed', e);
    throw e;
  }
}

/**
 * Capacitor APK ichida ishlayotganini tekshirish (tugma matnini moslashtirish uchun).
 */
export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform();
}
