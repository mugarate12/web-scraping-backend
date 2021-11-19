const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

module.exports = {
  development: {
    client: "mysql",
    connection: {
      database: 'web_scraping',
      user: process.env.DATABASE_DEVELOPMENT_USER,
      password: process.env.DATABASE_DEVELOPMENT_PASSWORD,
      port: Number(process.env.DATABASE_DEVELOPMENT_PORT)
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  },

  test: {
    client: "mysql",
    connection: {
      database: 'web_scraping_test',
      user: process.env.DATABASE_DEVELOPMENT_USER,
      password: process.env.DATABASE_DEVELOPMENT_PASSWORD,
      port: process.env.DATABASE_DEVELOPMENT_PORT
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  },

  production: {
    client: "mysql",
    connection: {
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: !process.env.DATABASE_PASSWORD ? '' : process.env.DATABASE_PASSWORD,
      port: process.env.DATABASE_PORT,
      connectTimeout: 9000000,
      propagateCreateError: false
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  }
}
