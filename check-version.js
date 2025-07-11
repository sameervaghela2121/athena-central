import { execSync } from "child_process";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Get Git commit hash
const getCommitHash = () => {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch (error) {
    console.error("check-version.js Error:", error);
    return "unknown";
  }
};

// Get commit hash and create full version
const commitHash = getCommitHash();
const newVersion = `${commitHash}`;

// Update or add VITE_APP_VERSION in .env file with full version (with commit hash)
try {
  const envFile = fs.readFileSync(".env", "utf-8");
  let envFileContent = envFile.toString();

  // Check if VITE_APP_VERSION already exists in the file
  if (envFileContent.includes("VITE_APP_VERSION=")) {
    // Replace existing VITE_APP_VERSION
    envFileContent = envFileContent.replace(
      /VITE_APP_VERSION=.*/,
      `VITE_APP_VERSION=${newVersion}`,
    );
  } else {
    // Add VITE_APP_VERSION as a new line
    envFileContent = `${envFileContent.trim()}\nVITE_APP_VERSION=${newVersion}\n`;
  }

  fs.writeFileSync(".env", envFileContent);
  console.log(
    `Environment variable VITE_APP_VERSION set to ${newVersion} (with commit hash)`,
  );
} catch (error) {
  console.error("check-version.js Error:", error);
}
