const { withAndroidManifest } = require("expo/config-plugins");

// Local preview APKs need HTTP access to the developer's LAN backend.
module.exports = (config) =>
  withAndroidManifest(config, (result) => {
    if (process.env.EXPO_PUBLIC_API_URL?.startsWith("http://")) {
      const application = result.modResults.manifest.application?.[0];
      if (application) application.$["android:usesCleartextTraffic"] = "true";
    }
    return result;
  });
