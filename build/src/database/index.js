"use strict";
const knex = require('knex');
const configuration = require('./../../knexfile.js');
console.log(process.env.NODE_ENV);
let config;
if (process.env.NODE_ENV === 'test') {
    config = configuration.test;
}
else if (process.env.NODE_ENV === 'development') {
    config = configuration.development;
}
else {
    config = configuration.production;
}
const connection = knex(config);
module.exports = connection;
