const { withSettingsGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withFixAndroidBuild(config) {
  config = withSettingsGradle(config, (gradle) => {
    const contents = gradle.modResults.contents;
    if (!contents.includes('expo-modules-core/android')) {
      gradle.modResults.contents = contents.replace(
        'includeBuild("../node_modules/@react-native/gradle-plugin")',
        'includeBuild("../node_modules/@react-native/gradle-plugin")\n    includeBuild("../node_modules/expo-modules-core/android")'
      );
    }
    return gradle;
  });

  config = withDangerousMod(config, ['android', (mod) => {
    const wrapperPath = path.join(
      mod.modRequest.platformProjectRoot,
      'gradle', 'wrapper', 'gradle-wrapper.properties'
    );
    if (fs.existsSync(wrapperPath)) {
      let content = fs.readFileSync(wrapperPath, 'utf8');
      content = content.replace(/gradle-[\d.]+-(?:all|bin)\.zip/, 'gradle-8.6-all.zip');
      fs.writeFileSync(wrapperPath, content);
    }
    return mod;
  }]);

  return config;
}

module.exports = withFixAndroidBuild;
