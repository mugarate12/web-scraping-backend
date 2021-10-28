const bcrypt = require('bcryptjs')
const dotenv = require('dotenv') 

const {
  USERS_TABLE_NAME
} = require('./../types')

dotenv.config()

exports.seed = async function seed(knex) {
  const salt = await bcrypt.genSalt()
  const pw = await bcrypt.hash(process.env.ADMIN_PASSWORD || '', salt)

  await knex(USERS_TABLE_NAME)
    .where({ id: 1 })
    .select('*')
    .then(async (user) => {
      const notHaveUser = user.length === 0

      if (notHaveUser) {
        await knex(USERS_TABLE_NAME).insert([
          { 
            id: 1,
            login: process.env.ADMIN_LOGIN,
            password: pw, 
          }
        ])
      }
    })

}