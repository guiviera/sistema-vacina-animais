
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sistema_vacinacao_pet",

  ssl: process.env.DB_HOST === "localhost"
    ? undefined
    : {
        ca: fs.readFileSync(path.join(__dirname, "ca.pem"))
      },

  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true
});

module.exports = pool;
