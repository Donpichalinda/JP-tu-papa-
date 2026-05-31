const { loadEnv } = require("@medusajs/utils");
loadEnv("test", process.cwd());
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
