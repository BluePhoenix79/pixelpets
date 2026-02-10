/*import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("Connected to Azure SQL");
    return pool;
  })
  .catch(err => {
    console.error("Database connection failed", err);
    throw err;
  });

export default poolPromise;*/
