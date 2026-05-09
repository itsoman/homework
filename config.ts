import dotenv from "dotenv";
import rawConfig from "./config.json";

// Load environment variables from .env file
const config: Record<string, any> = rawConfig;
dotenv.config();

// This function will return the `ENV` for the current environment
export function getEnvName(): string {
  const env = process.env.environment; // Will retrieve 'dev', 'staging', 'sandbox' or 'prod' from the .env
  if (!env || !config[env]) {
    throw new Error(`Invalid or missing environment in config.json: ${env}`);
  }
  return config[env].ENV;
}

export function getWebsiteUrl(): string {
  const env = process.env.environment;
  if (!env || !config[env]) {
    throw new Error(`Invalid or missing Website url in config.json: ${env}`);
  }
  return config[env].WEBSITE_ADDRESS;
}

export function getUsCitiesArray(): string[] {
  const env = process.env.environment;
  if (!env || !config[env]) {
    throw new Error(`Invalid or missing US cities array in config.json: ${env}`);
  }
  return config[env].US_CITIES_ARRAY;
}

export function getMonthMapping(): Record<string, number> {
  const env = process.env.environment;
  if (!env || !config[env]) {
    throw new Error(`Invalid or missing Month mapping in config.json: ${env}`);
  }
  return config[env].MONTH_MAPPING;
}