import cluster from "cluster"
import { cpus } from 'os'

import routines from './routines'
import { serverIO } from './app'

routines(serverIO)

if (cluster.isPrimary) {
  cpus().forEach(() => cluster.fork())

  cluster.on('exit', (worker) => {
    cluster.fork()
  })
} else {
  require('./server')
}