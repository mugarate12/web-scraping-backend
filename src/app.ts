import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { errors } from 'celebrate'
import { Server } from 'socket.io'
import swaggerUI from 'swagger-ui-express'

import routes from './routes'
import routines from './routines'
import RunSockets from './sockets'

let publicAccessDocuments

dotenv.config()
const app = express()
const server = http.createServer(app)

if (process.env.NODE_ENV === 'production') {
  publicAccessDocuments = require('./../../docs/public_access_docs.json')
} else {
  publicAccessDocuments = require('./../docs/public_access_docs.json')
}

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', '*', String(process.env.FRONTEND_HOST)]
  }
})

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['*'],
  exposedHeaders: ['Authorization', 'Content-Type', 'Content-Disposition', 'Access-Control-Allow-Headers', 'Origin', 'Accept', 'X-Requested-With', 'filename'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(express.json())

app.use(routes)

// docs
app.use('/public/docs', swaggerUI.serve, swaggerUI.setup(publicAccessDocuments))

// celebrate errors
app.use(errors())

// run routines
// routines(io)

// sockets
RunSockets(io)

export const serverIO = io
export default server