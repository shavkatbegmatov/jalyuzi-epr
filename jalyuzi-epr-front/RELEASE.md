# Android Release qo'llanma

Bu fayl Jalyuzi ERP Android ilovasini Play Store'ga chiqarish bo'yicha qadamlarni tushuntiradi.

## 1. Keystore yaratish (BIR MARTA)

Keystore — ilovani imzolash uchun maxfiy kalit. **YO'QOTILSA, ilovani Play Store'da yangilab bo'lmaydi.**

```bash
keytool -genkey -v -keystore D:\Projects\JALYUZI_EPR\jalyuzi-keystore.jks ^
        -alias jalyuzi-epr -keyalg RSA -keysize 2048 -validity 9125
```

Yoki Android Studio'da: **Build → Generate Signed Bundle / APK → Create new...**

⚠️ **Backup qiling:**
- Keystore faylini bulutga yuklang (Google Drive, Dropbox)
- Parollarni parol menejerida saqlang (1Password, Bitwarden)

## 2. keystore.properties sozlash

```bash
cp android/keystore.properties.example android/keystore.properties
```

`android/keystore.properties` faylini oching va to'g'ri qiymatlarni kiriting (parollar bilan).

## 3. Release AAB qurish

### Buyruq satridan:

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease       # Linux/Mac
gradlew.bat bundleRelease     # Windows
```

Natija: `android/app/build/outputs/bundle/release/app-release.aab`

### Yoki Android Studio'da:

1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** → Next
3. Keystore'ni tanlang, parolni kiriting
4. **Build Variant: release** → Finish

## 4. Versiyani yangilash

Har yangi release oldidan `android/app/build.gradle` faylida:

```gradle
versionCode 2          // har release'da +1
versionName "1.0.1"    // semver
```

## 5. Play Store'ga yuklash

1. https://play.google.com/console
2. App → Internal testing (yoki Production)
3. Create new release
4. AAB faylni yuklang
5. Release notes yozing (Uzbek)
6. Submit for review

## 6. Test qilish (release AAB)

Release AABni telefoningizda sinash uchun:

```bash
# AAB → APKlar (bundletool kerak)
bundletool build-apks --bundle=app-release.aab --output=app.apks --mode=universal
unzip -p app.apks universal.apk > release.apk
adb install release.apk
```

Yoki Play Store Internal testing track orqali (oson yo'l).

## Tez-tez uchraydigan muammolar

**"Keystore was tampered with"** — parol noto'g'ri.

**"INSTALL_FAILED_UPDATE_INCOMPATIBLE"** — debug APK o'rnatilgan, oldin uni o'chirib, keyin release o'rnating.

**"Version code already exists"** — `versionCode`ni oshiring.
