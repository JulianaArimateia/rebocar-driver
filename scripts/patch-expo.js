const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  const patched = content.replace(/\bcomponents\.release\b/g, "components.findByName('release')");
  if (patched !== content) {
    fs.writeFileSync(file, patched);
    console.log('Patched ExpoModulesCorePlugin.gradle');
  }
}
