import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import routes from './routes'
import routines, { convertMinutesToMilliseconds, oneMinuteRoutines } from './routines'

dotenv.config()
const app = express()

app.use(cors({
  origin: ['http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['*'],
  exposedHeaders: ['Authorization', 'Content-Type', 'Content-Disposition', 'Access-Control-Allow-Headers', 'Origin', 'Accept', 'X-Requested-With', 'filename'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(express.json())

app.use(routes)

// run routines
routines()
// setInterval(() => {
//   oneMinuteRoutines()
// }, convertMinutesToMilliseconds(3))

export default app