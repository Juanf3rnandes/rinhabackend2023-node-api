const pino = require("pino");

module.exports = pino({level: process.env.PINO_LEVEL || "info"})
