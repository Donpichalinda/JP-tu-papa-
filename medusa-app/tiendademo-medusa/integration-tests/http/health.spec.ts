import dotenv from "dotenv"
import path from "path"

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), ".env.test")
dotenv.config({ path: envPath })

const { medusaIntegrationTestRunner } = require("@medusajs/test-utils")

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  debug: true,
  env: {
    NODE_ENV: "test",
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_PORT: process.env.DB_PORT,
  },
  testSuite: ({ api }) => {
    describe("Ping", () => {
      it("ping the server health endpoint", async () => {
        const response = await api.get('/health')
        expect(response.status).toEqual(200)
      })
    })
  },
})