#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";

const configDir = path.join(os.homedir(), ".gitgenie");
const configFile = path.join(configDir, "config.json");

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return true;
  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      return !!config.GEMINI_API_KEY;
    } catch {
      return false;
    }
  }
  return false;
}

const hasApiKey = getApiKey();

// 🧞‍♂️ Classic Aladdin-style Genie Lamp
const banner = `
    ${chalk.cyan("🔮")} ${chalk.magentaBright("Git")}${chalk.yellow("Genie")} ${chalk.cyan("🔮")}
    ${chalk.gray("┌─────────────────┐")}
    ${chalk.gray("│")} ${chalk.green("✨ AI-Powered Git ✨")} ${chalk.gray("│")}
    ${chalk.gray("│")} ${chalk.blue("Smart Commit Magic")} ${chalk.gray("│")}
    ${chalk.gray("└─────────────────┘")}
       ${chalk.yellow("⚡")} ${chalk.red("Ready to code!")} ${chalk.yellow("⚡")}
`;
const logo = `
 $$$$$$\\   $$$$$$\\  
$$  __$$\\ $$  __$$\\ 
$$ /  \\__|$$ /  \\__|
$$ |$$$$\\ $$ |$$$$\\ 
$$ |\\_$$ |$$ |\\_$$ |
$$ |  $$ |$$ |  $$ |
\\$$$$$$  |\\$$$$$$  |
 \\______/  \\______/  
`;




console.log(chalk.green.bold("\n Welcome to GitGenie!"));
console.log(logo);
console.log(banner);

if (hasApiKey) {
  console.log(chalk.green("Genie powers already unlocked!"));
  console.log("Try your first AI-powered commit:");
  console.log(chalk.magenta('   gg "your changes" --genie\n'));
} else {
  console.log(chalk.yellow("⚡ Unlock Genie powers:"));
  console.log("   gg config <your_api_key>\n");
  console.log(chalk.cyan("Or just get started with a manual commit:"));
  console.log(chalk.magenta('   gg "your commit message"\n'));
}

console.log(chalk.blue("📖 Docs & guide: https://gitgenie.vercel.app/\n"));