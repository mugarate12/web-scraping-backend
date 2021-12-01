import { Server } from 'socket.io'
import dotenv from 'dotenv'

import servicesSockets from './servicesSockets'

dotenv.config()

const processName = process.env.name || 'primary'

export default function RunSockets(ioServer: Server) {
  if(processName.search(/primary/) !== -1){
    servicesSockets(ioServer)
  }
}