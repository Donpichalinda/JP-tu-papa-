/**
 * Configuración de MedusaJS para la Tienda Demo
 *
 * Este archivo configura la conexión a la base de datos, módulos y plugins
 * necesarios para el funcionamiento de la tienda.
 */

const os = require('os');

/**
 * DATABASE_URL: Configuración de la base de datos SQLite
 *
 * Se usa SQLite para simplificar la ejecución local sin necesidad
 * de un servidor de base de datos externo.
 *
 * Alternativas para producción:
 * - PostgreSQL: postgres://user:pass@localhost:5432/medusa
 * - MySQL: mysql://user:pass@localhost:3306/medusa
 */
const DATABASE_URL = process.env.DATABASE_URL || "sqlite://./tiendademo.db";

/**
 * REDIS_URL: Configuración de Redis para cache y sesiones
 *
 * Redis es opcional en desarrollo pero recomendado en producción
 * para mejor rendimiento.
 */
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Plugins configurados:
 *
 * - fileService: Para manejo de archivos e imágenes de productos
 * - sendgrid: Para envío de emails (opcional, deshabilitado por defecto)
 */
const plugins = [
  `medusa-fulfillment-module`,
  `medusa-payment-module`,
];

/**
 * Configuración del servidor
 */
const serverConfig = {
  /**
   * Puerto donde se ejecutará el servidor
   * Por defecto: 9000
   */
  port: process.env.PORT || 9000,

  /**
   * Nombre del host
   * Por defecto: localhost
   */
  host: process.env.HOST || "localhost",

  /**
   * URL base de la API (usada para webhooks y enlaces en emails)
   */
  apiUrl: process.env.API_URL || "http://localhost:9000",
};

/**
 * Configuración de CORS para permitir acceso desde el admin
 */
const corsConfig = {
  /**
   * Dominios permitidos para hacer peticiones CORS
   * El admin de Medusa corre típicamente en el puerto 7000
   */
  cors: [
    `http://localhost:7000`,
    `http://localhost:7001`,
    `http://localhost:3000`,
    process.env.ADMIN_URL || "http://localhost:7000",
  ],
};

/**
 * Función principal de configuración
 * Exporta todas las configuraciones necesarias para Medusa
 */
module.exports = {
  databaseConfig: {
    /**
     * Configuración de la base de datos
     *
     * - type: Tipo de base de datos (postgres, mysql, sqlite)
     * - url: Cadena de conexión
     * - debug: Si true, muestra queries SQL en consola (útil para debugging)
     * - logging: Controla qué tipo de queries se loguean
     */
    database: {
      type: "sqlite",
      url: DATABASE_URL,
      debug: process.env.NODE_ENV === "development",
    },
  },

  redisConfig: {
    url: REDIS_URL,
  },

  pluginsConfig: {
    plugins,
  },

  serverConfig: {
    ...serverConfig,
    ...corsConfig,
  },

  /**
   * Configuración de módulos personalizados
   * Aquí se registran los servicios de negocio implementados
   */
  modules: {},
};
