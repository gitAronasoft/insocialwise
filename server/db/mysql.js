// const mysql = require('mysql');

// const con = mysql.createConnection({
//     host:'localhost',
//     user:'root',
//     password:'',
//     database:'node_insocialvise'
// });

// con.connect((err)=>{
//     if(!err){
//         console.log("Connected sucessfully to MySql");
//     }
// });

// module.exports = con;

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: 3306,
    dialectOptions: {
        connectTimeout: 30000
    },
    pool: {
        max: 1,               // Max number of connections in the pool
        min: 0,                // Min number of connections
        acquire: 30000,        // Max time (in ms) to acquire a connection
        idle: 10000            // Max time (in ms) for idle connections before release
    }
});

sequelize.authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize; 
