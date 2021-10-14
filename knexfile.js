const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      database: 'web_scraping',
      user: process.env.DATABASE_DEVELOPMENT_USER,
      password: process.env.DATABASE_DEVELOPMENT_PASSWORD
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  },

  test: {
    client: "mysql2",
    connection: {
      database: 'web_scraping_test',
      user: process.env.DATABASE_DEVELOPMENT_USER,
      password: process.env.DATABASE_DEVELOPMENT_PASSWORD
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: !process.env.DATABASE_PASSWORD ? '' : process.env.DATABASE_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  }
}
