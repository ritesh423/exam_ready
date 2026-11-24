const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = manifest["uses-feature"] ?? [];
    const portraitFeature = features.find(
      (feature) =>
        feature.$["android:name"] === "android.hardware.screen.portrait",
    );

    // A portrait preference must not exclude devices without portrait hardware.
    if (portraitFeature) {
      portraitFeature.$["android:required"] = "false";
    } else {
      features.push({
        $: {
          "android:name": "android.hardware.screen.portrait",
          "android:required": "false",
        },
      });
    }

    manifest["uses-feature"] = features;
    return config;
  });
};
