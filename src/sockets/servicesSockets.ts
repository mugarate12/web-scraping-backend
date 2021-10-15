import { Server } from 'socket.io'

import { monitoringRepository } from './../repositories'

export default function servicesSockets(ioServer: Server) {
  ioServer.on('connection', async (socket) => {
    // await services
    console.log('conexão estabelecida')

    const monitoringServices = await monitoringRepository.index()

    socket.emit('monitoring-services', monitoringServices)
  })
}