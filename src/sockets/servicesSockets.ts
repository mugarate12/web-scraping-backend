import { Server } from 'socket.io'

import { 
  monitoringRepository,
  servicesUpdateTimeRepository
} from './../repositories'

export default function servicesSockets(ioServer: Server) {
  ioServer.on('connection', async (socket) => {
    // await services
    // console.log('conexão estabelecida')

    const monitoringServices = await monitoringRepository.index()
    const routinesUpdateTime = await servicesUpdateTimeRepository.index()

    socket.emit('monitoring-services', monitoringServices)
    socket.emit('routines_update_time', routinesUpdateTime)
  })
}