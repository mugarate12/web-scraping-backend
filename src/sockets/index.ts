import { Server } from 'socket.io'

import servicesSockets from './servicesSockets'

export default function RunSockets(ioServer: Server) {
  servicesSockets(ioServer)
}