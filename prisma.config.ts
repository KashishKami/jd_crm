
import fs from "node:fs";

if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  process.loadEnvFile();
}

const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

export default config;


