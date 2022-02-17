import { Request, Response } from 'express'
import axios from 'axios'
import https from 'https'
import fs from 'fs'
import moment from 'moment'
import dotenv from 'dotenv'

dotenv.config()

import {
  cpflSearchRepository,
  energyPermissionsRepository,
  energisaInformationsRepository,
  energisaDataRepository
} from './../repositories'

import { EnergisaDataInterface } from './../repositories/EnergisaDataRepository'

import handleStatusOfEnergy from './../utils/handleStatusOfEnergy'

// interface dataFormattedInterface {}
type dataFormattedInterface = {
  state: string;
  city: string;
  street: string;
  status: number;
  date: string;
  initial_hour: string;
  final_hour: string;
  duration: number;
  finalSeconds: number;
  finalMaintenance: number;
}[]

type citiesInterface = Array<{
  value: string;
  label: string;
}>

type statusCountInterface = Array<{
  name: string,
  state: string,
  status_agendamento: number,
  status_emAndamento: number,
  status_concluidas: number,
}>

export default class EnergisaController {
  // códigos das empresas que vem do estado
  // minas gerais === 1

  public states = [
    'Minas Gerais', 'Mato Grosso do Sul', 'Mato Grosso', 'Paraíba', 'Paraná', 'Rio de Janeiro', 'Sergipe', 'São Paulo', 'Tocantins', 'Acre', 'Rondônia'
  ]
  //
  // criar rotina pra pegar todas as cidades disponíveis por estado tendo neles: nome da cidade e código da cidade


  private convertStateStringToInitials = (state: string) => {
    switch (state) {
      case 'Minas Gerais':
        return 'MG'
      case 'Mato Grosso do Sul':
        return 'MS'
      case 'Mato Grosso':
        return 'MT'
      case 'Paraíba':
        return 'PB'
      case 'Paraná':
        return 'PR'
      case 'Rio de Janeiro':
        return 'RJ'
      case 'Sergipe':
        return 'SE'
      case 'São Paulo':
        return 'SP'
      case 'Tocantins':
        return 'TO'
      case 'Acre':
        return 'AC'
      case 'Rondônia':
        return 'RO'
      default:
        return state
    }
  }

  private convertStateInitialsToString = (state: string) => {
    switch (state) {
      case 'MG':
        return 'Minas Gerais'
      case 'MS':
        return 'Mato Grosso do Sul'
      case 'MT':
        return 'Mato Grosso'
      case 'PB':
        return 'Paraíba'
      case 'PR':
        return 'Paraná'
      case 'RJ':
        return 'Rio de Janeiro'
      case 'SE':
        return 'Sergipe'
      case 'SP':
        return 'São Paulo'
      case 'TO':
        return 'Tocantins'
      case 'AC':
        return 'Acre'
      case 'RO':
        return 'Rondônia'
      default:
        return state
    }
  }

  private getStateAndCityInformations = async (state: string) => {
    const agent = new https.Agent({
      rejectUnauthorized: false
    })

    const jquery = 'jQuery11230851263842538539_1644581053977'
    const url = `https://svc.energisa.com.br/portal/v3/ClientSideWSATEHandler.ashx/GetMunicipiosCorporativoEGrupoRede?callback=${jquery}&pTipoOrigemChamadaServico=CHAMADA_SISTEMA_WEB&pEstadoDaEnergisaEGrupoRede=${state}&pGrupoRedeEEnergisaIntegrado=true&_=1644581053978`

    let data:  Array<{
      codMun: number,
      codUf: string,
      nomeMun: string,
      codEmpresa: number,
      codEmpresaTemporario: null,
      url: null
    }> = []

    await axios.get(
      url,
      { httpsAgent: agent }
    )
      .then((response) => {
        // isso é uma string, tratar isso
        const responseData = String(response.data)

        const splitedJqueryString = responseData.split(jquery)
        const dataString = splitedJqueryString[1].slice(1, splitedJqueryString[1].length - 1)

        const dataParsed: {
          valorRetorno:  Array<{
            codMun: number,
            codUf: string,
            nomeMun: string,
            codEmpresa: number,
            codEmpresaTemporario: null,
            url: null
          }>,
          codRetorno: number,
          mensagemRetorno: null,
          identificadorExcecao: null,
          atualizaChave: boolean,
          novaChave: null
        } = JSON.parse(dataString)

        const citiesData = dataParsed.valorRetorno
        data = citiesData
      })
      .catch(error => {
        console.log(error)
      })

    return data
  }
  
  public getInformationsAndUpdateInformations = async () => {
    const states = this.states.map(state => {
      return this.convertStateStringToInitials(state)
    })

    for (let index = 0; index < states.length; index++) {
      const state = states[index]
      
      const informations = await this.getStateAndCityInformations(state)

      // get state and code of cities
      for (let index = 0; index < informations.length; index++) {
        const informationCityData = informations[index]
        
        const state_name = informationCityData.codUf
        const state_cod = String(informationCityData.codEmpresa)
        const city_name = informationCityData.nomeMun
        const city_cod = String(informationCityData.codMun)
        
        // update database
        const document = await energisaInformationsRepository.get({ state_name, state_cod, city_name, city_cod })
        const haveDocument = !document

        if (haveDocument) {
          // console.log('doc: ', document, 'value: ', haveDocument, 'doc value: ', { state_name, state_cod, city_name, city_cod })
          await energisaInformationsRepository.create({ state_name, state_cod, city_name, city_cod })
        }
        // // test to insertions
        // console.log(`cidade: ${city_cod} ${city_name}; estado: ${state_cod} ${state_cod}`)
        // await this.getData(state_cod, city_cod)
      }
    }
  }

  private getData = async (stateCod: string, cityCod: string) => {
    const agent = new https.Agent({
      rejectUnauthorized: false
    })
    
    const jquery = 'jQuery11230704261639579326_1644581190456'
    const url = `https://svc.energisa.com.br/portal/v3/ClientSideWSATEHandler.ashx/GetGrafosDoDesligamentoProgramadoDoMunicipio?callback=${jquery}&pTipoOrigemChamadaServico=CHAMADA_SISTEMA_WEB&pCodEmpresa=${stateCod}&pCodMunicipio=${cityCod}`

    let data: Array<{
      titulo: string,
      codigosLogradouro: Array<number>,
      logradouros: Array<string>,
      numRegiao: number,
      descricao: string,
      strDataInicial: string,
      strDataFinal: string,
      strDataAtual: string,
      auxRDP: {
        desligamentoProgramado: boolean,
        numRegiao: number,
        dataInicial: string,
        dataFinal: string,
        strDataInicial: string,
        strDataFinal: string,
        strDataAtual: string | null
      }
    }> = []

    await axios.get(
      url,
      { httpsAgent: agent }
    )
      .then(response => {
        const responseData = String(response.data)
        const splitedJqueryString = responseData.split(jquery)

        const dataString = splitedJqueryString[1].slice(1, splitedJqueryString[1].length - 1)
        const dataParsed: {
          valorRetorno: [
            { 
              grafos: Array<any>, 
              itens: Array<{
                titulo: string,
                codigosLogradouro: Array<number>,
                logradouros: Array<string>,
                numRegiao: number,
                descricao: string,
                strDataInicial: string,
                strDataFinal: string,
                strDataAtual: string,
                auxRDP: {
                  desligamentoProgramado: boolean,
                  numRegiao: number,
                  dataInicial: string,
                  dataFinal: string,
                  strDataInicial: string,
                  strDataFinal: string,
                  strDataAtual: string | null
                }
              }>
            } 
          ],
          codRetorno: number,
          mensagemRetorno: null,
          identificadorExcecao: null,
          atualizaChave: boolean,
          novaChave: null
        } = JSON.parse(dataString)

        // console.log('código de retorno: ', dataParsed.codRetorno, 'valor de retorno', dataParsed.valorRetorno !== null)
        // console.log(dataParsed.valorRetorno)

        if (!!dataParsed.valorRetorno) {
          data = dataParsed.valorRetorno[0].itens
        }
      })
      .catch(error => {
        console.log(error)
      })

      // console.log('data: ', data)
      return data
  }

  private getDataAndFormat = async (stateCod: string, cityCod: string) => {
    const data = await this.getData(stateCod, cityCod)

    let formattedData = data.map((information) => {
      const streets = information.logradouros

      const date = information.strDataInicial.split(' ')[0]
      const finalMaintenanceDate = information.strDataFinal.split(' ')[0]
      let initialDate = information.strDataInicial
      let finalDate = information.strDataFinal

      let initialHour = initialDate.split(' ')[1]
      let finalHour = finalDate.split(' ')[1]

      let duration = handleStatusOfEnergy.getDurationInSeconds(
        handleStatusOfEnergy.formatDateToGetDuration(date, initialHour),
        handleStatusOfEnergy.formatDateToGetDuration(finalMaintenanceDate, finalHour)
      )

      const actualDate = moment().format('DD/MM/YYYY HH:mm')

      let finalSeconds = handleStatusOfEnergy.getDurationInSeconds(
        handleStatusOfEnergy.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
        handleStatusOfEnergy.formatDateToGetDuration(finalMaintenanceDate, initialHour)
      )
  
      let finalMaintenance = handleStatusOfEnergy.getDurationInSeconds(
        handleStatusOfEnergy.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
        handleStatusOfEnergy.formatDateToGetDuration(finalMaintenanceDate, finalHour)
      )

      if (finalSeconds < 0) {
        finalSeconds = 0
      }
  
      if (finalMaintenance < 0) {
        finalMaintenance = 0
      }

      const status = handleStatusOfEnergy.getStatus(finalSeconds, finalMaintenance)

      return streets.map((street) => {
        return {
          state: information.titulo.split('/')[0],
          city: information.titulo.split('/')[1],
          street,

          status,

          date,
          initial_hour: initialDate,
          final_hour: finalDate,

          duration,
          finalSeconds,
          finalMaintenance
        }
      })
    })

    // filtrar dados
    const filteredData: dataFormattedInterface = []

    formattedData.forEach(arrayOfData => {
      arrayOfData.forEach(data => {
        let have = false

        filteredData.forEach(filtered => {
          const haveSameState = filtered.state === data.state
          const haveSameCity = filtered.city === data.city
          const haveSameStreet = filtered.street === data.street
          const haveSameStatus = filtered.status === data.status

          const haveSameDate = filtered.date === data.date

          const haveSameInitialHour = filtered.initial_hour === data.initial_hour
          const haveSameFinalHour = filtered.final_hour === data.final_hour

          if (haveSameState && haveSameCity && haveSameStreet && haveSameStatus && haveSameDate && haveSameInitialHour && haveSameFinalHour) {
            have = true
          }
        })

        if (!have) {
          filteredData.push(data)
        }
      })
    })

    return filteredData
  }

  private updateData = async (dataArray: dataFormattedInterface) => {
    for (let index = 0; index < dataArray.length; index++) {
      const data = dataArray[index]

      const document = await energisaDataRepository.get({
        state: data.state,
        city: data.city,
        street: data.street,

        status: data.status,
        
        date: data.date,
        initial_hour: data.initial_hour,
        final_hour: data.final_hour,

        duration: data.duration,
        final_seconds: data.finalSeconds,
        final_maintenance: data.finalMaintenance
      })

      if (!document) {
        await energisaDataRepository.create({
          state: data.state,
          city: data.city,
          street: data.street,
  
          status: data.status,
          
          date: data.date,
          initial_hour: data.initial_hour,
          final_hour: data.final_hour,
  
          duration: data.duration,
          final_seconds: data.finalSeconds,
          final_maintenance: data.finalMaintenance
        })
      }
    }
  }

  private statesAndCitiesPermittedOfUser = async (userID: number) => {
    let states: Array<string> = []
    let cities: Array<string> = []
    
    // await energyPermissionsRepository.ge
    const searchs = await cpflSearchRepository.index({ dealership: 'energisa' })
    for (let index = 0; index < searchs.length; index++) {
      const search = searchs[index]

      const energyPermission = await energyPermissionsRepository.get({
        cpfl_search_FK: search.id,
        client_FK: userID
      })

      if (!!energyPermission) {
        const state = this.convertStateInitialsToString(search.state)

        if (!states.includes(state)) {
          states.push(state)
        }

        if (!cities.includes(search.city)) {
          cities.push(search.city)
        }
      }
    }

    return {
      states,
      cities
    }
  }

  private haveCityInDataFormatted = (array: statusCountInterface, cityName: string) => {
    let have = false

    array.forEach(formattedData => {
      if (formattedData.name === cityName) {
        have = true
      }
    })

    return have
  }

  public formatStatesToFrontend = (states: Array<string>) => {
    return states.map(state => {
      return {
        label: this.convertStateStringToInitials(state),
        value: this.convertStateStringToInitials(state)
      }
    })
  }

  public getCities = async (state: string) => {
    const formattedState = this.convertStateStringToInitials(state)

    const cities = await energisaInformationsRepository.index({ state_name: formattedState })
    let formattedCities: citiesInterface = []

    formattedCities = cities.map(city => {
      return {
        label:  city.city_name,
        value: city.city_name
      }
    })

    return formattedCities
  }

  public updateTime = async (state: string, city: string) => {
    const convertHour = Number(process.env.CONVERT_TO_TIMEZONE)

    const documents = await energisaDataRepository.index({
      states: [ this.convertStateInitialsToString(state) ],
      cities: [ city ]
    })

    for (let index = 0; index < documents.length; index++) {
      const document = documents[index]
      
      const actualDate = moment().subtract(convertHour, 'hours').format('DD/MM/YYYY HH:mm')

      let finalSeconds = handleStatusOfEnergy.getDurationInSeconds(
        handleStatusOfEnergy.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
        handleStatusOfEnergy.formatDateToGetDuration(document.initial_hour.split(' ')[0], document.initial_hour.split(' ')[1])
      )
      let finalMaintenance = handleStatusOfEnergy.getDurationInSeconds(
        handleStatusOfEnergy.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
        handleStatusOfEnergy.formatDateToGetDuration(document.final_hour.split(' ')[0], document.final_hour.split(' ')[1])
      )

      let duration = handleStatusOfEnergy.getDurationInSeconds(
        handleStatusOfEnergy.formatDateToGetDuration(document.initial_hour.split(' ')[0], document.initial_hour.split(' ')[1]),
        handleStatusOfEnergy.formatDateToGetDuration(document.final_hour.split(' ')[0], document.final_hour.split(' ')[1])
      )

      if (finalSeconds < 0) {
        finalSeconds = 0
      }

      if (finalMaintenance < 0) {
        finalMaintenance = 0
      }

      const status = handleStatusOfEnergy.getStatus(finalSeconds, finalMaintenance)

      await energisaDataRepository.update({
        identifiers: {
          street: document.street,
          city: document.city,
          state: document.state
        },
        payload: {
          final_maintenance: finalMaintenance,
          final_seconds: finalSeconds,
          duration,
          status
        }
      })
    }
  }

  public runRoutine = async (stateName: string, cityName: string) => {
    const documents = await energisaInformationsRepository.index({ state_name: stateName, city_name: cityName })
    const doc = documents[0]

    if (!!doc) {
      const data = await this.getDataAndFormat(doc.state_cod, doc.city_cod)
      await this.updateData(data)
    }
  }

  public getCitiesAvailable = async () => {
    await this.getInformationsAndUpdateInformations()
  }

  public deleteAllDataWithStatusFinished = async () => {
    await energisaDataRepository.delete({ status: 4 })
  }

  public updateManually = async (req: Request<{ state: string, city: string }>, res: Response) => {
    const { state, city } = req.params

    const documents = await energisaInformationsRepository.index({ state_name: state, city_name: city })
    const doc = documents[0]

    if (!!doc) {
      const data = await this.getDataAndFormat(doc.state_cod, doc.city_cod)
      await this.updateData(data)
    }

    return res.status(200).json({})
  }

  public getDataByState = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    const permitted = await this.statesAndCitiesPermittedOfUser(userID)
    
    let data: Array<EnergisaDataInterface> = []

    if (permitted.states.length > 0 && permitted.cities.length > 0) {
      data = await energisaDataRepository.index({ 
        states: permitted.states,
        cities: permitted.cities
      })
    }

    return res.status(200).json({
      data: data
    })
  }

  public getCountStatus = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    // get states and cities with user have permission
    const permitted = await this.statesAndCitiesPermittedOfUser(userID)

    let data: Array<EnergisaDataInterface> = []

    if (permitted.states.length > 0 && permitted.cities.length > 0) {
      data = await energisaDataRepository.index({ 
        states: permitted.states,
        cities: permitted.cities
      })
    }
    // name is a city name
    let dataFormatted: statusCountInterface = []

    data.forEach(energisaData => {
      const haveCity = this.haveCityInDataFormatted(dataFormatted, energisaData.city)

      if (haveCity) {
        dataFormatted.forEach(formattedData => {
          if (formattedData.name === energisaData.city) {
            if (energisaData.status === 2) {
              formattedData.status_agendamento += 1
            } else if (energisaData.status === 3) {
              formattedData.status_emAndamento += 1
            } else {
              formattedData.status_concluidas += 1
            }
          }
        }) 
      } else {
        if (energisaData.status === 2) {
          dataFormatted.push({
            name: energisaData.city,
            state: energisaData.state,
            status_agendamento: 1,
            status_emAndamento: 0,
            status_concluidas: 0,
          })
        } else if (energisaData.status === 3) {
          dataFormatted.push({
            name: energisaData.city,
            state: energisaData.state,
            status_agendamento: 0,
            status_emAndamento: 1,
            status_concluidas: 0,
          })
        } else  {
          dataFormatted.push({
            name: energisaData.city,
            state: energisaData.state,
            status_agendamento: 0,
            status_emAndamento: 0,
            status_concluidas: 1,
          })
        }
      }
    })

    return res.status(200).json({
      data: dataFormatted
    })
  }

  public getSummary = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    // get states and cities with user have permission
    const permitted = await this.statesAndCitiesPermittedOfUser(userID)

    let data: Array<EnergisaDataInterface> = []

    if (permitted.states.length > 0 && permitted.cities.length > 0) {
      data = await energisaDataRepository.index({ 
        states: permitted.states,
        cities: permitted.cities
      })
    }

    const tomorrowDayDate = moment().subtract(1, 'days').format('DD/MM/YYYY')
    const actualDate = moment().format('DD/MM/YYYY')
    const nextDayDate = moment().add(1, 'days').format('DD/MM/YYYY')

    const onSchedule = await energisaDataRepository.index({
      date: actualDate,
      status: 2,
      states: permitted.states,
      cities: permitted.cities
    })

    const executeIn20Minutes = await energisaDataRepository.index({
      date: actualDate,
      status: 5,
      states: permitted.states,
      cities: permitted.cities
    })

    const inMaintenance = await energisaDataRepository.index({
      status: 3,
      date: actualDate,
      states: permitted.states,
      cities: permitted.cities
    })

    const maintanceSchedulein24h = await energisaDataRepository.indexPerDateWithLimit({
      status: 2,
      lowerLimit: actualDate,
      higherLimit: nextDayDate,
      states: permitted.states,
      cities: permitted.cities
    })
    
    const finishedIn24h = await energisaDataRepository.indexPerDateWithLimit({
      status: 4,
      lowerLimit: tomorrowDayDate,
      higherLimit: actualDate,
      states: permitted.states,
      cities: permitted.cities
    })

    let responseData: {
      totalDeAgendamentos: number,
      manutencoesAgora: number,
      manutencoesEm24h: number,
      concluidasEm24h: number,
      paraIniciaremEm20min: number
    } = {
      totalDeAgendamentos: 0,
      manutencoesAgora: 0,
      manutencoesEm24h: 0,
      concluidasEm24h: 0,
      paraIniciaremEm20min: 0
    }

    if (permitted.states.length > 0 && permitted.cities.length > 0) {
      responseData = {
        totalDeAgendamentos: onSchedule.length,
        manutencoesAgora: inMaintenance.length,
        manutencoesEm24h: maintanceSchedulein24h.length,
        concluidasEm24h: finishedIn24h.length,
        paraIniciaremEm20min: executeIn20Minutes.length
      }
    }

    return res.status(200).json({
      data: responseData
    })
  }
 
  public test = async (req: Request, res: Response) => {
    // method to add states and cities to list of requestable
    await this.getInformationsAndUpdateInformations()

    // const energisa = await energisaInformationsRepository.index({})
    // essa requisição de dados precisa ser em paralelo
    const data = await this.getDataAndFormat('3', '1')
    // await this.updateData(data)

    // const requests = await cpflSearchRepository.index({ able: 1, dealership: 'energisa', update_time: 15 })
    // for (let index = 0; index < requests.length; index++) {
    //   const request = requests[index];
      
    //   console.log(request.state, request.city)
    //   await this.runRoutine(request.state, request.city)
    // }

    return res.status(200).json({
      // data: data.filter(d => d.street === 'RUA I')
    })
  }
}