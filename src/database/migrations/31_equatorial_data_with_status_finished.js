const {
  EQUATORIAL_DATA
} = require('./../types')

exports.up = function(knex) {
  return knex(EQUATORIAL_DATA)
    .where({ status: 4 })
    .delete()
}

exports.down = function(knex) {
  
}