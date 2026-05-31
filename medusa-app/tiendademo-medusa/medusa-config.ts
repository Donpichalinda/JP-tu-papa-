import path from "path"
import dotenv from "dotenv"
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

// Ensure dotenv is loaded from DOTENV_CONFIG_PATH (set by the integration test runner)
const envPath = process.env.DOTENV_CONFIG_PATH || path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
dotenv.config({ path: envPath })

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Add explicit database driver options expected by medusa test utils
    databaseDriverOptions: {
      type: "postgres",
      url: process.env.DATABASE_URL,
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/tienda-inventory",
    },
    {
      resolve: "./src/modules/tienda-discount",
    },
    {
      resolve: "./src/modules/tienda-shipping",
    },
  ],
})
