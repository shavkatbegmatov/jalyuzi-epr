# Android APK qurish qo'llanmasi (Capacitor)

Bu hujjat — React/Vite + Capacitor loyihasidan Android APK qurishning **to'liq, sinab ko'rilgan** yo'riqnomasi. Jalyuzi ERP misolida yozilgan, lekin **istalgan Capacitor loyihasiga** mos (faqat yo'llar/nomlarni almashtiring).

> 💡 Bu yo'riqnoma bir marta "qiynalib" topilgan yechimlar asosida yozilgan — keyingi safar to'g'ridan-to'g'ri 3-bo'limdagi buyruqni ishlating.

---

## 1. Talablar (bir marta o'rnatiladi)

| Komponent | Tavsiya | Eslatma |
|---|---|---|
| Node.js | 18+ | frontend build uchun |
| **JDK** | **Standart JDK 21** (Microsoft OpenJDK / Temurin / Liberica) | ⚠️ GraalVM va JBR EMAS — pastga qarang |
| Android SDK | Android Studio orqali | `compileSdk` loyiha talabiga mos (Jalyuzi: 36) |
| Gradle | Wrapper (`gradlew`) loyihada | alohida o'rnatish shart emas |

JDK qayerdaligini bilish (Windows):
```powershell
Get-ChildItem "$env:USERPROFILE\.jdks"   # SDKMAN/IDE o'rnatgan JDK'lar
# yoki Android Studio JBR: "C:\Program Files\Android\Android Studio\jbr"
```

---

## 2. Asosiy oqim (har safar)

```
Frontend kodi  →  npm run build  →  npx cap sync android  →  gradlew assembleDebug  →  APK
```

`package.json`'da qulay skriptlar (Jalyuzi):
```jsonc
"android:sync":  "npm run build && npx cap sync android",   // build + dist'ni Android'ga ko'chirish
"android:open":  "npx cap open android"                     // Android Studio'da ochish
```

> `npx cap sync` web-assetlarni `android/app/src/main/assets/public` ga ko'chiradi va pluginlarni yangilaydi. **Kod o'zgarsa, har safar `android:sync` shart.**

---

## 3. Debug APK — tezkor buyruq (Windows PowerShell)

Bu loyihada (korporativ proxy + standart JDK 21 bilan) ishlaydigan to'liq buyruq:

```powershell
# 1) Frontend qurish + Android'ga sync
npm run android:sync

# 2) JDK 21 tanlash (standart — GraalVM/JBR EMAS)
$env:JAVA_HOME = "C:\Users\<USER>\.jdks\ms-21.0.11"      # yoki temurin-21 / liberica-21
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# 3) APK qurish (ONLINE + Windows truststore)
$g = "android\gradlew.bat"; $p = "android"
& $g --stop -p $p
& $g assembleDebug -p $p --console=plain "-Djavax.net.ssl.trustStoreType=Windows-ROOT"
```

**Natija:** `android/app/build/outputs/apk/debug/app-debug.apk`

Telefonga o'rnatish: faylni ko'chiring → oching → "Noma'lum manbalardan o'rnatish"ga ruxsat bering.

---

## 4. ⚠️ JDK tanlovi — eng ko'p qiynagan joy

Android Gradle Plugin (`jlink`/`JdkImageTransform`) va Kotlin plugin **standart JDK** talab qiladi. Bu mashinada uchragan holatlar:

| JDK | Muammo | Xulosa |
|---|---|---|
| **GraalVM 21** (ko'pincha default `JAVA_HOME`) | `JdkImageTransform` / `jlink.exe` fail | ❌ ishlatmang |
| **Android Studio JBR** | `Windows-ROOT not found` (SSL truststore'ni qo'llamaydi) | ❌ online build'da ishlamaydi |
| **JDK 17** | `invalid source release: 21` (loyiha JDK 21 kerak) | ❌ versiya past |
| **Standart JDK 21** (MS OpenJDK / Temurin / Liberica) | — | ✅ **ishlating** |

> Qoida: **standart (HotSpot) JDK** + loyiha talab qilgan versiya (`compileOptions`/`sourceCompatibility`'da yozilган).

---

## 5. ⚠️ SSL (korporativ proxy / firewall)

Agar `PKIX path building failed` yoki `SSLHandshakeException` chiqsa — proxy (Zscaler/firewall) SSL'ni ushlab qoladi va JDK CA'sini ishonmaydi. Yechim — **Windows tizim sertifikatlaridan** foydalanish:

```
-Djavax.net.ssl.trustStoreType=Windows-ROOT
```

- Faqat **standart JDK**'da ishlaydi (JBR'da emas).
- Doimiy qilish uchun (faqat shu mashinada, repo'ga emas): `~/.gradle/gradle.properties` ga
  `systemProp.javax.net.ssl.trustStoreType=Windows-ROOT` qo'shing.
  > Repo'dagi `android/gradle.properties` ga **qo'shmang** — u Windows-only, Mac/Linux/CI'ni buzadi.

---

## 6. ⚠️ Offline rejim ishlatmang

`--offline` Kotlin plugin'da `ConcurrentModificationException` (`debugRuntimeClasspath` resolution) beradi. **Online** quring. Bir marta yuklangach, keyingi build'lar baribir tez (kesh ishlaydi).

Agar metadata buzilgan bo'lsa (yarim yuklangan): `assembleDebug --refresh-dependencies` bilan tozalang.

---

## 7. Versiya boshqaruvi (buyurtmachi farqlashi uchun)

Versiya **ikki joyda** turadi — har relizda **ikkalasini** oshiring:

| Fayl | Maydon | Vazifa |
|---|---|---|
| `package.json` | `"version": "1.1.0"` | yagona UI manbasi (`__APP_VERSION__` orqali ko'rsatiladi) |
| `android/app/build.gradle` | `versionName "1.1.0"` | foydalanuvchi ko'radigan versiya |
| `android/app/build.gradle` | `versionCode 2` | **har APK'da +1** (Play Store/yangilanish uchun unique butun son) |

UI'da ko'rsatish (Jalyuzi'da sozlangan):
- `vite.config.ts` → `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`
- `src/vite-env.d.ts` → `declare const __APP_VERSION__: string;`
- Ko'rsatish joylari: **Login footer**, **Sidebar** (mobil "Ko'proq"), **Footer** (desktop).

> SemVer: tuzatish → `1.1.x`, yangi imkoniyat → `1.x.0`, buzuvchi o'zgarish → `x.0.0`.

---

## 8. Release (imzolangan) APK / AAB — Play Store uchun

1. Keystore yarating (bir marta):
   ```powershell
   keytool -genkey -v -keystore jalyuzi-release.keystore -alias jalyuzi -keyalg RSA -keysize 2048 -validity 10000
   ```
2. `android/keystore.properties` yarating (gitignore'da, `keystore.properties.example`'dan nusxa):
   ```properties
   storeFile=../../jalyuzi-release.keystore
   storePassword=••••••
   keyAlias=jalyuzi
   keyPassword=••••••
   ```
3. Quring:
   ```powershell
   & android\gradlew.bat assembleRelease -p android "-Djavax.net.ssl.trustStoreType=Windows-ROOT"   # imzolangan APK
   & android\gradlew.bat bundleRelease   -p android "-Djavax.net.ssl.trustStoreType=Windows-ROOT"   # Play Store .aab
   ```
   `build.gradle` allaqachon `minifyEnabled true` + ProGuard bilan sozlangan; keystore mavjud bo'lsa avtomatik imzolanadi.

Natija: `android/app/build/outputs/apk/release/app-release.apk` yoki `.../bundle/release/app-release.aab`

---

## 9. Tez muammo-yechim (cheat sheet)

| Xato | Sabab | Yechim |
|---|---|---|
| `PKIX path building failed` / SSL handshake | proxy SSL | `-Djavax.net.ssl.trustStoreType=Windows-ROOT` (standart JDK'da) |
| `Windows-ROOT not found` | JBR ishlatilgan | standart JDK 21 ga o'ting |
| `JdkImageTransform` / `jlink.exe` fail | GraalVM | standart JDK 21 ga o'ting |
| `invalid source release: 21` | JDK 17 | JDK 21 ga o'ting |
| `ConcurrentModificationException` | `--offline` | online quring (`--offline` olib tashlang) |
| eski kod APK'da | sync qilinmagan | `npm run android:sync` |

---

## 10. Boshqa Capacitor loyihasiga moslash

1. `appId` / `appName` — `capacitor.config.ts`.
2. Production API — `.env.production` (`VITE_API_URL=...`), Capacitor uchun **absolute URL** shart.
3. CORS — backend WebView origin'ni ruxsat bersin: `https://localhost`, `capacitor://localhost`.
4. Versiya — 7-bo'lim (`package.json` + `build.gradle`).
5. Build — 3-bo'limdagi buyruq (yo'llar/JDK nomini moslang).
