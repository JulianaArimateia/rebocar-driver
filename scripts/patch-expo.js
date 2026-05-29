const fs = require('fs');
const path = require('path');

// Fix 1: patch ExpoModulesCorePlugin.gradle — components.release removed in Gradle 8.x
const expoModulesPlugin = path.join(__dirname, '..', 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');
if (fs.existsSync(expoModulesPlugin)) {
  let content = fs.readFileSync(expoModulesPlugin, 'utf8');
  const patched = content.replace(/\bcomponents\.release\b/g, "components.findByName('release')");
  if (patched !== content) {
    fs.writeFileSync(expoModulesPlugin, patched);
    console.log('Patched ExpoModulesCorePlugin.gradle');
  }
}

// Fix 2: patch expo-font/android/build.gradle — expo-module-gradle-plugin does not exist in SDK 51
const expoFontGradle = path.join(__dirname, '..', 'node_modules', 'expo-font', 'android', 'build.gradle');
if (fs.existsSync(expoFontGradle)) {
  const original = fs.readFileSync(expoFontGradle, 'utf8');
  if (original.includes('expo-module-gradle-plugin')) {
    const patched = `apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

def safeExtGet(String prop, Object fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

group = 'host.exp.exponent'
version = '56.0.5'

android {
    namespace "expo.modules.font"
    compileSdkVersion safeExtGet('compileSdkVersion', 34)
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 23)
        targetSdkVersion safeExtGet('targetSdkVersion', 34)
        versionCode 29
        versionName "56.0.5"
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;
    fs.writeFileSync(expoFontGradle, patched);
    console.log('Patched expo-font/android/build.gradle');
  }
}
