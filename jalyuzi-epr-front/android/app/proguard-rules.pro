# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Crash report'larida raqamli stack trace saqlanishi uchun
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ===== Capacitor =====
# Capacitor WebView orqali JavaScript interface'larni chaqiradi, shuning
# uchun ushbu klasslar nomlari obfuscate qilinmasligi kerak.
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# Cordova plugin support
-keep class org.apache.cordova.** { *; }

# WebView JS interfeyslar uchun
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX core
-keep class androidx.core.app.** { *; }
