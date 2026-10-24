import "dotenv/config";

const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 8787),
  mongoUri: required("MONGODB_URI"),
  mongoDb: required("MONGODB_DB", "meadowvale"),
  tokenSecret: required("TOKEN_SECRET"),
  tokenTtlDays: Number(process.env.TOKEN_TTL_DAYS || 30),
  corsOrigin: process.env.CORS_ORIGIN || "",
  isProd: process.env.NODE_ENV === "production",
};
