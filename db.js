const mysql = require('mysql2/promise');
const config = require('./config');



const connectionName = process.env.INSTANCE_CONNECTION_NAME || config.config.instancename;
const dbUser = process.env.SQL_USER || config.config.username;
const dbPassword = process.env.SQL_PASSWORD || config.config.password;
const dbName = process.env.SQL_NAME || config.config.database;

const mysqlConfig = {
	connectionLimit: 10,
	user: dbUser,
	password: dbPassword,
	database: dbName,
	ocketPath: `/cloudsql/${connectionName}`
};

exports.con_dates = mysql.createPool(mysqlConfig);