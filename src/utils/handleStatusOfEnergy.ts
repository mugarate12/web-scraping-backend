import moment from "moment"

class HandleStatusOfEnergy {
  /**
   * format date to 'month/day/year'
   * @param {String} date have format 'day/month/year'
   * @param  {String} hour have format 'hour:minutes'
   */
   public formatDateToGetDuration = (date: string, hour: string) => {
    const dateSplitted = date.split('/')
    const dateFormatted = `${dateSplitted[1]}-${dateSplitted[0]}-${dateSplitted[2]}`

    return `${dateFormatted} ${hour}`
  }

  /**
   * get difference in format 'hour:minutes' to initialHour and finalHour
   * @param  {String} initialHour have format 'month/day/year hour:minutes'
   * @param  {String} finalHour have format 'month/day/year hour:minutes'
   */
  public getDuration = (initialHour: string, finalHour: string) => {
    const initial = moment(initialHour)
    const final = moment(finalHour)

    const duration = moment.duration(final.diff(initial))
    const durationFormatted = `${duration.hours()}:${duration.minutes()}`
    
    return durationFormatted
  }

  /**
   * get difference in format 'hour:minutes' to initialHour and finalHour
   * @param  {String} initialHour have format 'month/day/year hour:minutes'
   * @param  {String} finalHour have format 'month/day/year hour:minutes'
   */
  public getDurationInSeconds = (initialHour: string, finalHour: string) => {
    const initial = moment(initialHour)
    const final = moment(finalHour)

    const duration = moment.duration(final.diff(initial))
    const durationInSeconds = duration.asSeconds()

    return durationInSeconds
  }

  /**
   * status is a number to describe:
   * 2 = em agendamento
   * 3 = manutenção em andamento
   * 4 = manutenção finalizada
   * 5 = 20 minutos ou menos para a manutenção
   * @param  {number} finalSeconds is a number is seconds to actual time at time to maintenence
   * @param  {number} finalMaintenence is a number is seconds to actual time at time to final of maintenence
   */
  public getStatus = (finalSeconds: number, finalMaintenence: number) => {
    let status = 2

    if (finalSeconds <= 1200 && finalSeconds > 0 && finalMaintenence > 0) {
      status = 5
    }

    if (finalSeconds <= 0 && finalMaintenence > 0) {
      status = 3
    }

    if (finalSeconds <= 0 && finalMaintenence <= 0) {
      status = 4
    }

    return status
  }

  private convertStatusStringToNumber = (status: 'waiting' | 'maintenence' | 'finished') => {
    switch (status) {
      case 'waiting':
        return 2
      case 'maintenence':
        return 3
      default:
        return 4
    }
  }
}

const handleStatusOfEnergy = new HandleStatusOfEnergy()
export default handleStatusOfEnergy