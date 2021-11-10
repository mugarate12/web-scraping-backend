import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'

import routes from './routes'
import routines from './routines'
import RunSockets from './sockets'

dotenv.config()
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', '*', String(process.env.FRONTEND_HOST)]
  }
})

app.use(cors({
  origin: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['*'],
  exposedHeaders: ['Authorization', 'Content-Type', 'Content-Disposition', 'Access-Control-Allow-Headers', 'Origin', 'Accept', 'X-Requested-With', 'filename'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(express.json())

app.use(routes)

// run routines
routines(io)

// sockets
RunSockets(io)

export default server