import cluster from "cluster"
import { cpus } from 'os'

if (cluster.isPrimary) {
  cpus().forEach(() => cluster.fork())

  cluster.on('exit', (worker) => {
    cluster.fork()
  })
} else {
  require('./server')
}