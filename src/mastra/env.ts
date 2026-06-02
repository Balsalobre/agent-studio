function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  deepseekApiKey: requireEnv("DEEPSEEK_API_KEY"),
  databaseUrl: requireEnv("DATABASE_URL"),
  adminApiToken: requireEnv("ADMIN_API_TOKEN"),
  userApiToken: requireEnv("USER_API_TOKEN"),
};
