const { requireOptionalNativeModule } = require('expo-modules-core');

function getScreenTimeNative() {
  try {
    return requireOptionalNativeModule('ScreenTime');
  } catch {
    return null;
  }
}

module.exports = {
  getScreenTimeNative,
};
