import { readFile, writeFile } from "node:fs/promises";

const path = "android/app/build.gradle";
const source = await readFile(path, "utf8");

const releaseMarker = "            signingConfig signingConfigs.release";
if (source.includes(releaseMarker)) {
  process.exit(0);
}

const signingBlock = `        release {
            storeFile file(System.getenv('ANDROID_KEYSTORE_FILE'))
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
`;

const withReleaseSigningConfig = source.replace(
  "    buildTypes {",
  `    signingConfigs {
${signingBlock}    }

    buildTypes {`,
);

if (withReleaseSigningConfig === source) {
  throw new Error("Could not locate the generated Android buildTypes block.");
}

const buildTypesIndex = withReleaseSigningConfig.indexOf("    buildTypes {");
if (buildTypesIndex < 0) {
  throw new Error("Could not locate the generated Android buildTypes block.");
}

const beforeBuildTypes = withReleaseSigningConfig.slice(0, buildTypesIndex);
const buildTypesAndAfter = withReleaseSigningConfig.slice(buildTypesIndex);
const configuredBuildTypes = buildTypesAndAfter.replace(
  /(^\s*release\s*\{[\s\S]*?^\s*)signingConfig signingConfigs\.debug/m,
  "$1signingConfig signingConfigs.release",
);

if (configuredBuildTypes === buildTypesAndAfter) {
  throw new Error("Could not configure the generated Android release signing block.");
}

await writeFile(path, beforeBuildTypes + configuredBuildTypes);
