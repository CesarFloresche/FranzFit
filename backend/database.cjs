const mysql = require('mysql2/promise');

function createDatabasePool(mysqlConfig) {
  return mysql.createPool({
    ...mysqlConfig,
    charset: 'utf8mb4',
    waitForConnections: true,
    queueLimit: 0,
  });
}

module.exports = { createDatabasePool };
