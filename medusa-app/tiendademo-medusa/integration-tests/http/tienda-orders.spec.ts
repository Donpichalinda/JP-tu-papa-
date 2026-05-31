import dotenv from "dotenv"
import path from "path"
import seedTiendaDemoData from "../../src/scripts/tienda-seed"

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), ".env.test")
dotenv.config({ path: envPath })

const { medusaIntegrationTestRunner } = require("@medusajs/test-utils")

jest.setTimeout(120 * 1000)

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
  testSuite: ({ api, getContainer }) => {
    describe("POST /store/orders - Flujo Completo de Orden", () => {
      beforeAll(async () => {
        const container = getContainer()
        const data = { container } as any
        await seedTiendaDemoData(data)
      })

      /**
       * CP-E2E-01: Crear orden exitosa con descuento y envío válido
       *
       * Escenario: Compra de 1 Teclado Mecánico ($250.000) con código
       * DESCUENTO10 y envío a zona CENTRO.
       *
       * Flujo esperado:
       * 1. Inventario: stock suficiente ✓
       * 2. Descuento: código promo aplica 10% ✓
       * 3. Envío: zona CENTRO < 5km = $5.000 ✓
       * 4. Orden creada exitosamente
       */
      it("CP-E2E: Orden completa - inventario OK, descuento promo, envío express", async () => {
        const response = await api.post("/store/orders", {
          items: [{ product_id: "teclado_mecanico", quantity: 1 }],
          promo_code: "DESCUENTO10",
          zone: "CENTRO",
        }, { validateStatus: () => true })

        console.log("ORDER CREATE RESPONSE BODY:", JSON.stringify(response.data, null, 2))

        expect(response.status).toBe(201)
        const body = response.data
        expect(body.order).toBeDefined()
        expect(body.summary.subtotal).toBe(250000)
        expect(body.summary.discount_amount).toBe(25000)
        expect(body.summary.shipping_cost).toBe(5000)
        expect(body.summary.total).toBe(230000) // 250000 - 25000 + 5000
        expect(body.discount.type).toBe("promo_code")
        expect(body.shipping.tariff).toBe("Envio Express")
      })

      /**
       * Orden rechazada por inventario insuficiente
       */
      it("Orden rechazada cuando inventario es insuficiente", async () => {
        const response = await api.post("/store/orders", {
          items: [{ product_id: "laptop_hp", quantity: 999 }],
          zone: "CENTRO",
        }, { validateStatus: () => true })

        expect(response.status).toBe(400)
        expect(response.data.error).toBe("INVENTORY_VALIDATION_FAILED")
      })

      /**
       * Orden rechazada por zona de envío fuera de cobertura
       */
      it("Orden rechazada cuando la zona de envío excede 10 km", async () => {
        const response = await api.post("/store/orders", {
          items: [{ product_id: "mouse_inalambrico", quantity: 1 }],
          zone: "SUR",
        }, { validateStatus: () => true })

        expect(response.status).toBe(400)
        expect(response.data.error).toBe("SHIPPING_NOT_AVAILABLE")
      })

      /**
       * Orden rechazada por request inválido (sin items)
       */
      it("Orden rechazada cuando no se proporcionan items", async () => {
        const response = await api.post("/store/orders", {
          items: [],
          zone: "CENTRO",
        }, { validateStatus: () => true })

        expect(response.status).toBe(400)
        expect(response.data.error).toBe("INVALID_REQUEST")
      })
    })

    describe("POST /store/inventory/validate - Validación de Inventario API", () => {
      it("Valida inventario exitosamente via API", async () => {
        const response = await api.post("/store/inventory/validate", {
          items: [{ product_id: "mouse_inalambrico", quantity: 2 }],
        }, { validateStatus: () => true })

        console.log("VALIDATE RESPONSE STATUS:", response.status)
        console.log("VALIDATE RESPONSE DATA:", JSON.stringify(response.data, null, 2))

        expect(response.status).toBe(200)
        expect(response.data.valid).toBe(true)
      })

      it("Rechaza request sin items", async () => {
        const response = await api.post("/store/inventory/validate", {}, { validateStatus: () => true })

        expect(response.status).toBe(400)
        expect(response.data.error).toBe("INVALID_REQUEST")
      })
    })

    describe("POST /store/discounts/calculate - Cálculo de Descuento API", () => {
      it("Calcula descuento automático via API", async () => {
        const response = await api.post("/store/discounts/calculate", {
          subtotal: 250000,
        }, { validateStatus: () => true })

        expect(response.status).toBe(200)
        expect(response.data.applies).toBe(true)
        expect(response.data.type).toBe("auto_threshold")
        expect(response.data.discount_amount).toBe(25000)
      })

      it("Rechaza subtotal negativo", async () => {
        const response = await api.post("/store/discounts/calculate", {
          subtotal: -100,
        }, { validateStatus: () => true })

        expect(response.status).toBe(400)
        expect(response.data.error).toBe("INVALID_REQUEST")
      })
    })

    describe("POST /store/discounts/validate - Validación de Código Promo API", () => {
      it("Rechaza request sin código", async () => {
        const response = await api.post("/store/discounts/validate", {}, { validateStatus: () => true })

        expect(response.status).toBe(400)
        expect(response.data.error).toBe("MISSING_CODE")
      })
    })

    describe("POST /store/shipping/calculate - Cálculo de Envío API", () => {
      it("Calcula envío por coordenadas", async () => {
        const response = await api.post("/store/shipping/calculate", {
          x: 2,
          y: 1,
        }, { validateStatus: () => true })

        expect(response.status).toBe(200)
        expect(response.data.available).toBe(true)
        expect(response.data.price).toBe(5000)
      })
    })
  },
})

