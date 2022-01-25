import { Request, Response } from 'express'
import Tesseract from 'tesseract.js'
import vision, { v1 } from '@google-cloud/vision'
import path from 'path'
import https from 'https'
import fs from 'fs'
import moment from 'moment'
import dotenv from 'dotenv'

dotenv.config()

const gm = require('gm').subClass({imageMagick: true})

import { ocrDataRepository } from './../repositories'

let clientKey = path.resolve(__dirname, '..', '..', 'googleJSONCredentials.json')

if (process.env.NODE_ENV === 'production') {
  clientKey = path.resolve(__dirname, '..', '..', '..', 'googleJSONCredentials.json')
}

const client = new vision.ImageAnnotatorClient({
  keyFilename: clientKey,
  projectId: 'image-text-338511'
})


export default class OCRController {
  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  private formatValue = (value: string) => {
    let formattedValue = value
    const lastLetterOfValue = formattedValue[formattedValue.length - 1]

    if (lastLetterOfValue === ']' || lastLetterOfValue === '|' || lastLetterOfValue === '/') {
      formattedValue = formattedValue.slice(0, formattedValue.length - 1)
    }

    const haveDotInValue = formattedValue.includes('.')
    const lastLetterIsZero = lastLetterOfValue === '0'

    if (lastLetterOfValue === '6' || (haveDotInValue && lastLetterIsZero)) {
      formattedValue = formattedValue.slice(0, formattedValue.length - 1) + 'G'
    }

    return formattedValue
  }

  private formatPercent = (percent: string) => {
    let formattedPercent = percent

    const lastLetterOfPercent = formattedPercent[formattedPercent.length - 1]
    if (lastLetterOfPercent !== '%') {
      formattedPercent = formattedPercent.slice(0, formattedPercent.length - 1) + '%'
    }

    return formattedPercent
  }

  private updateInDatabase = async (dataArray: {
    serviceName: string;
    up_value: string;
    up_percent: string;
    down_value: string;
    down_percent: string;
  }[], state: string, city: string, imageDate: string, updateLastExecution: boolean) => {
    const actualDate = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm')
    
    for (let index = 0; index < dataArray.length; index++) {
      const data = dataArray[index]
      let ocrDataPayload: {
        up_value: string,
        up_percent: string,
        down_value: string,
        down_percent: string,
  
        last_update_page: string,
        last_update_routine?: string
      } = {
        up_value: data.up_value,
        up_percent: data.up_percent,
        down_value: data.down_value,
        down_percent: data.down_percent,
        last_update_page: imageDate
      }

      if (updateLastExecution) {
        ocrDataPayload.last_update_routine = actualDate
      }

      if (!!data.serviceName && !!data.up_value && !!data.up_percent && !!data.down_value && !!data.down_percent) {        
        const ocrData = await ocrDataRepository.get({ state, city, service: data.serviceName })
        if (!!ocrData) {
          await ocrDataRepository.update({
            identifiers: {
              state,
              city,
              service: data.serviceName
            },
            payload: {
              ...ocrDataPayload
            }
          })
        } else {
          await ocrDataRepository.create({
            state,
            city,
            service: data.serviceName,
            ...ocrDataPayload
          })
        }
      }

    }
  }

  private getRJCropedInformations = () => {
    const services = {
      CLARO: {
        width: 105,
        height: 167,
        initialPointX: 145,
        initialPointY: 0
      },
      LUMEN: {
        width: 117,
        height: 167,
        initialPointX: 273,
        initialPointY: 0
      },
      ELETRONET: {
        width: 97,
        height: 167,
        initialPointX: 404,
        initialPointY: 0
      },
      DURAND: {
        width: 110,
        height: 167,
        initialPointX: 522,
        initialPointY: 0
      },
      GLOBO: {
        width: 104,
        height: 167,
        initialPointX: 652,
        initialPointY: 0
      },
      'UFINET-SC': {
        width: 116,
        height: 167,
        initialPointX: 774,
        initialPointY: 0
      },
      CBPF: {
        width: 650,
        height: 90,
        initialPointX: 190,
        initialPointY: 170
      },
      'EQUINIX-RJ1': {
        width: 650,
        height: 90,
        initialPointX: 190,
        initialPointY: 170
      },
      'UFINET-JB': {
        width: 119,
        height: 169,
        initialPointX: 146,
        initialPointY: 271
      },
      MUNDIVOX: {
        width: 98,
        height: 169,
        initialPointX: 280,
        initialPointY: 271
      },
      COMMCORP: {
        width: 104,
        height: 169,
        initialPointX: 402,
        initialPointY: 271
      },
      INTERNEXA: {
        width: 104,
        height: 169,
        initialPointX: 526,
        initialPointY: 271
      },
      LINKFULL: {
        width: 101,
        height: 169,
        initialPointX: 656,
        initialPointY: 271
      },
      'EQUINIX-RJ2': {
        width: 116,
        height: 169,
        initialPointX: 773,
        initialPointY: 271
      },

    }

    return services
  }

  private getFortalezaCropedInformations = () => {
    const services = {
      RNP: {
        width: 124,
        height: 167,
        initialPointX: 152,
        initialPointY: 0
      },
      'MOB TELECOM': {
        width: 105,
        height: 167,
        initialPointX: 354,
        initialPointY: 0
      },
      'LUMEN': {
        width: 124,
        height: 167,
        initialPointX: 570,
        initialPointY: 0
      },
      'ELETRONET': {
        width: 110,
        height: 167,
        initialPointX: 785,
        initialPointY: 0
      },
      ETICE: {
        width: 650,
        height: 90,
        initialPointX: 193,
        initialPointY: 170
      },
      GLOBENET: {
        width: 650,
        height: 90,
        initialPointX: 193,
        initialPointY: 170
      },
      COMMCORP: {
        width: 119,
        height: 169,
        initialPointX: 146,
        initialPointY: 271
      },
      'ANGOLA CABLES': {
        width: 138,
        height: 169,
        initialPointX: 345,
        initialPointY: 271
      },
      HOSTWEB: {
        width: 110,
        height: 169,
        initialPointX: 572,
        initialPointY: 271
      },
      ASCENTY: {
        width: 111,
        height: 169,
        initialPointX: 776,
        initialPointY: 271
      },
    }

    return services
  }

  private getCascavelCropedInformations = () => {
    const services = {
      CERTTO: {
        width: 106,
        height: 100,
        initialPointX: 43,
        initialPointY: 86
      },
      DIPELNET: {
        width: 117,
        height: 100,
        initialPointX: 199,
        initialPointY: 86
      },
    }

    return services
  }

  private getCuritibaCropedInformations = () => {
    const services = {
      OI: {
        width: 100,
        height: 85,
        initialPointX: 36,
        initialPointY: 93
      },
      NovaFibra: {
        width: 96,
        height: 85,
        initialPointX: 267,
        initialPointY: 93
      },
      CenturyLink: {
        width: 105,
        height: 85,
        initialPointX: 392,
        initialPointY: 93
      },
      CELEPAR: {
        width: 105,
        height: 85,
        initialPointX: 637,
        initialPointY: 93
      },
      UFPR: {
        width: 115,
        height: 87,
        initialPointX: 37,
        initialPointY: 283
      },
      GVT: {
        width: 108,
        height: 87,
        initialPointX: 170,
        initialPointY: 283
      },
      COPEL: {
        width: 108,
        height: 87,
        initialPointX: 320,
        initialPointY: 283
      },
      COMMCORP: {
        width: 110,
        height: 87,
        initialPointX: 465,
        initialPointY: 283
      },
      DBUG: {
        width: 105,
        height: 87,
        initialPointX: 629,
        initialPointY: 283
      }
    }

    return services
  }

  private getLondrinaCropedInformations = () => {
    const services = {
      PERSIS: {
        width: 75,
        height: 103,
        initialPointX: 83,
        initialPointY: 86
      },
      SERCOMTEL: {
        width: 65,
        height: 103,
        initialPointX: 231,
        initialPointY: 86
      },
      UEL: {
        width: 59,
        height: 106,
        initialPointX: 238,
        initialPointY: 229
      }
    }

    return services
  }

  private getMaringaCropedInformations = () => {
    const services = {
      UEM: {
        width: 201,
        height: 62,
        initialPointX: 76,
        initialPointY: 60
      },
      VSX: {
        width: 201,
        height: 62,
        initialPointX: 76,
        initialPointY: 60
      },
    }

    return services
  }

  private getPortoAlegreCropedInformations = () => {
    const services = {
      SYGO: {
        width: 86,
        height: 92,
        initialPointX: 43,
        initialPointY: 93
      },
      COMMCORP: {
        width: 94,
        height: 92,
        initialPointX: 141,
        initialPointY: 93
      },
      OI: {
        width: 102,
        height: 92,
        initialPointX: 236,
        initialPointY: 93
      },
      'Nossa Telecom': {
        width: 89,
        height: 92,
        initialPointX: 343,
        initialPointY: 93
      },
      GVT: {
        width: 91,
        height: 92,
        initialPointX: 439,
        initialPointY: 93
      },
      Defferrari: {
        width: 93,
        height: 92,
        initialPointX: 536,
        initialPointY: 93
      },
      CenturyLink: {
        width: 109,
        height: 92,
        initialPointX: 630,
        initialPointY: 93
      },
      VOGEL: {
        width: 93,
        height: 88,
        initialPointX: 42,
        initialPointY: 286
      },
      'RNP UFRGS': {
        width: 100,
        height: 88,
        initialPointX: 134,
        initialPointY: 286
      },
      LVT: {
        width: 92,
        height: 88,
        initialPointX: 241,
        initialPointY: 286
      },
      ADYLNET: {
        width: 101,
        height: 88,
        initialPointX: 336,
        initialPointY: 286
      },
      RENOVARE: {
        width: 92,
        height: 88,
        initialPointX: 440,
        initialPointY: 286
      },
      RedeISP: {
        width: 102,
        height: 88,
        initialPointX: 535,
        initialPointY: 286
      },
      METROLAN: {
        width: 101,
        height: 88,
        initialPointX: 637,
        initialPointY: 286
      },
    }

    return services
  }

  private getInformationRJ = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    if (key === 'CLARO' || key === 'LUMEN' || key === 'ELETRONET' || key === 'DURAND' || key === 'GLOBO' || key === 'UFINET-SC') {
      serviceName = key
      up_value = this.formatValue(informationsArray[2])

      let lastLetter = informationsArray[3].length - 1
      if (informationsArray[3][lastLetter] === '6' || informationsArray[3][lastLetter] === 'G' || informationsArray[3][lastLetter] === 'M') {
        up_percent = '0%'
        down_value = this.formatValue(informationsArray[3])

        if (informationsArray.length === 5) {
          down_percent = this.formatPercent( informationsArray[4])
        } else {
          down_percent = '0%'
        }
      } else {
        up_percent = this.formatPercent(informationsArray[3])
        down_value = this.formatValue(informationsArray[4])
        
        if (informationsArray.length === 6) {
          down_percent = this.formatPercent(informationsArray[5])
        } else {
          down_percent = '0%'
        }
      }
    } else if (key === 'CBPF') {
      serviceName = key

      up_value = this.formatValue(informationsArray[0])
      up_percent = this.formatPercent(informationsArray[2])
      down_value = this.formatValue(informationsArray[7])
      down_percent = this.formatPercent(informationsArray[9])
    } else if (key === 'EQUINIX-RJ1') {
      serviceName = key

      up_value = this.formatValue(informationsArray[7])
      up_percent = this.formatPercent(informationsArray[9])
      down_value = this.formatValue(informationsArray[0])
      down_percent = this.formatPercent(informationsArray[2])
    } else if (key === 'UFINET-JB' || key === 'MUNDIVOX' || key === 'COMMCORP' || key === 'INTERNEXA' || key === 'LINKFULL' || key === 'EQUINIX-RJ2' ) {
      // console.log(informationsArray)
      serviceName = key

      up_value = this.formatValue(informationsArray[2])
      up_percent = this.formatPercent(informationsArray[3])

      down_value = this.formatValue(informationsArray[0])
      down_percent = this.formatPercent(informationsArray[1])
    }

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getInformationFortaleza = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    if (key === 'RNP' || key === 'LUMEN' || key === 'ELETRONET') {
      serviceName = key
      // console.log(informationsArray)
      up_value = this.formatValue(informationsArray[2])

      let lastLetter = informationsArray[3].length - 1
      if (informationsArray[3][lastLetter] === '6' || informationsArray[3][lastLetter] === 'G' || informationsArray[3][lastLetter] === 'M') {
        up_percent = '0%'
        down_value = this.formatValue(informationsArray[3])

        if (informationsArray.length === 5) {
          down_percent = this.formatPercent( informationsArray[4])
        } else {
          down_percent = '0%'
        }
      } else {
        up_percent = this.formatPercent(informationsArray[3])
        down_value = this.formatValue(informationsArray[4])
        
        if (informationsArray.length === 6) {
          down_percent = this.formatPercent(informationsArray[5])
        } else {
          down_percent = '0%'
        }
      }
    } else if (key === 'MOB TELECOM') {
      serviceName = key
      // console.log(informationsArray)
      up_value = this.formatValue(informationsArray[3])

      let lastLetter = informationsArray[4].length - 1
      if (informationsArray[4][lastLetter] === '6' || informationsArray[4][lastLetter] === 'G' || informationsArray[4][lastLetter] === 'M') {
        up_percent = '0%'
        down_value = this.formatValue(informationsArray[4])

        if (informationsArray.length === 6) {
          down_percent = this.formatPercent( informationsArray[5])
        } else {
          down_percent = '0%'
        }
      } else {
        up_percent = this.formatPercent(informationsArray[4])
        down_value = this.formatValue(informationsArray[5])
        
        if (informationsArray.length === 7) {
          down_percent = this.formatPercent(informationsArray[6])
        } else {
          down_percent = '0%'
        }
      }
    } else if (key === 'ETICE') {
      serviceName = key

      if (informationsArray[0].includes('/') && informationsArray[0][informationsArray[0].length - 1] !== '/') {
        const value = informationsArray[0].split('/')

        up_value = this.formatValue(value[0])
        up_percent = this.formatPercent(value[1])

        down_value = this.formatValue(informationsArray[7])
        down_percent = this.formatPercent(informationsArray[9])
      } else {
        up_value = this.formatValue(informationsArray[0])
        up_percent = this.formatPercent(informationsArray[2])
        down_value = this.formatValue(informationsArray[7])
        down_percent = this.formatPercent(informationsArray[9])
      }

    } else if (key === 'GLOBENET') {
      serviceName = key

      if (informationsArray[2] === '/') {
        up_value = this.formatValue(informationsArray[6])
        up_percent = this.formatPercent(informationsArray[8])
        down_value = this.formatValue(informationsArray[0])
        down_percent = this.formatPercent(informationsArray[1])
      } else {
        up_value = this.formatValue(informationsArray[7])
        up_percent = this.formatPercent(informationsArray[9])
        down_value = this.formatValue(informationsArray[0])
        down_percent = this.formatPercent(informationsArray[2])
      }

    } else if (key === 'COMMCORP' || key === 'ANGOLA CABLES' || key === 'HOSTWEB' || key === 'ASCENTY') {
      // console.log(informationsArray)
      serviceName = key

      up_value = this.formatValue(informationsArray[2])
      up_percent = this.formatPercent(informationsArray[3])

      down_value = this.formatValue(informationsArray[0])
      down_percent = this.formatPercent(informationsArray[1])
    }

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getInformationCascavel = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    up_value = this.formatValue(informationsArray[0])
    down_value = this.formatValue(informationsArray[1])

    up_percent = '0%'
    down_percent = '0%'
    serviceName = key

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getInformationCuritiba = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    if (key === 'OI' || key === 'NovaFibra' || key === 'CenturyLink' || key === 'CELEPAR') {
      serviceName = key
      
      up_value = this.formatPercent(informationsArray[0])
      down_value = this.formatPercent(informationsArray[1])

      up_percent = '0%'
      down_percent = '0%'
    } else {
      serviceName = key

      down_value = this.formatValue(informationsArray[0])
      up_value = this.formatValue(informationsArray[1])

      up_percent = '0%'
      down_percent = '0%'
    }

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getInformationLondrina = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    serviceName = key

    if (key === 'PERSIS' || key === 'SERCOMTEL') {
      up_value = this.formatValue(informationsArray[0])
      down_value = this.formatValue(informationsArray[1])

      up_percent = '0%'
      down_percent = '0%'
    } else {
      up_value = this.formatValue(informationsArray[1])
      down_value = this.formatValue(informationsArray[0])

      up_percent = '0%'
      down_percent = '0%'
    }

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getMaringaInformation = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    serviceName = key
    up_percent = '0%'
    down_percent = '0%'

    if (key === 'UEM') {
      up_value = this.formatValue(informationsArray[0])
      down_value = this.formatValue(informationsArray[1])
    } else {
      up_value = this.formatValue(informationsArray[1])
      down_value = this.formatValue(informationsArray[0])
    }

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getPortoAlegreInformation = (informationsArray: Array<string>, key: string) => {
    let serviceName = ''
    let up_value = ''
    let up_percent = ''
    let down_value = ''
    let down_percent = ''

    serviceName = key

    if (key === 'SYGO' || key === 'COMMCORP' || key === 'OI' || key === 'NossaTelecom' || key === 'GVT' || key === 'Defferrari' || key === 'CenturyLink') {
      up_value = this.formatValue(informationsArray[0])
      up_percent = this.formatPercent(informationsArray[1])

      down_value = this.formatValue(informationsArray[2])
      down_percent = this.formatValue(informationsArray[3])
    } else {
      down_value = this.formatValue(informationsArray[0])
      down_percent = this.formatPercent(informationsArray[1])

      up_value = this.formatValue(informationsArray[2])
      up_percent = this.formatPercent(informationsArray[3])
    }

    return {
      serviceName,
      up_value,
      up_percent,
      down_value,
      down_percent
    }
  }

  private getDateInformation = async (filename: string, cropedFilename: string, width: number, height: number, initialPointX: number, initialPointY: number) => {
    let imageDate = ''
    
    gm(filename)
      .crop(
        width, 
        height, 
        initialPointX, 
        initialPointY
        )
      .write(cropedFilename, function(err) {
        if (err) return console.dir(arguments)
      })

    await this.sleep(5)

    try {
      const [ result ] = await client.textDetection(cropedFilename)
      const texts = result.textAnnotations
      let arrayString: Array<string> = []

      if (!!texts) {
        texts.forEach(text => {
          arrayString.push(String(text.description))
        })
      }

      arrayString.slice(1, arrayString.length).forEach((content, index) => {
        if (index === 0) {
          imageDate += content
        } 

        if (index === 1) {
          imageDate += ` ${content}`
        }
      })

    } catch (error) {
      console.log(error)
    }

    if (imageDate.includes('(')) {
      imageDate = imageDate.slice(0, imageDate.indexOf('('))
    }

    imageDate = `${imageDate.slice(0, 10)} ${imageDate.slice(10, imageDate.length)}`

    return imageDate
  }

  private getRJ = async (isRoutine: boolean) => {
    let example = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'
  
    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(example, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }
    
    const cropedInformations = this.getRJCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
          // console.log('OCR --> image croped')
        })

      await this.sleep(5)
      // console.log('OCR --> image croped timming ok')
      // console.log(key)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        const information = this.getInformationRJ(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)
       
      } catch (error) {
        console.log(error)
      }
    }

    const dataCrop = {
      width: 158,
      height: 12,
      initialPointX: 437,
      initialPointY: 456
    }

    gm(filename)
      .crop(
        dataCrop.width, 
        dataCrop.height, 
        dataCrop.initialPointX, 
        dataCrop.initialPointY
        )
      .write(cropedFilename, function(err) {
        if (err) return console.dir(arguments)
        // console.log('OCR --> created')
      })

    await this.sleep(5)
    // console.log('OCR --> timming  date ok')
    let imageDate = ''

    try {
      const [ result ] = await client.textDetection(cropedFilename)
      const texts = result.textAnnotations
      let arrayString: Array<string> = []

      if (!!texts) {
        texts.forEach(text => {
          // console.log(text.description)
          arrayString.push(String(text.description))
        })
      }

      // console.log(arrayString.slice(1, arrayString.length))
      arrayString.slice(1, arrayString.length).forEach((content, index) => {
        if (index === 0) {
          imageDate += content
        } 

        if (index === 1) {
          imageDate += ` ${content}`
        }
      })

    } catch (error) {
      console.log(error)
    }


    if (imageDate.includes('(')) {
      imageDate = imageDate.slice(0, imageDate.indexOf('('))
    }
    console.log('OCR --> atualizando no banco de dados - Rio de Janeiro')
    await this.updateInDatabase(formattedInformations, 'RJ', 'Rio de Janeiro', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Rio de Janeiro')
  }

  private getFortaleza = async (isRoutine: boolean) => {
    let fortalezaURL = 'https://old.ix.br/stats/cbff2f8aa74c6b3a283048e31b56576d/ce/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(fortalezaURL, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)
    
    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }

    const cropedInformations = this.getFortalezaCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
          // console.log('OCR --> image croped')
        })

      await this.sleep(5)
        // console.log('OCR --> image croped timming ok')
        // console.log(key)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        const information = this.getInformationFortaleza(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)
        
      } catch (error) {
        console.log(error)
      }
    }
    
    let imageDate = await this.getDateInformation(filename, cropedFilename, 165, 12, 454, 456)

    console.log('OCR --> atualizando no banco de dados - Fortaleza')
    await this.updateInDatabase(formattedInformations, 'CE', 'Fortaleza', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Fortaleza')
  }

  private getCascavel = async (isRoutine: boolean) => {
    const cascavelURL = 'https://old.ix.br/stats/56e371cdae2b4155300bf05876654a02/cac/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(cascavelURL, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }

    const cropedInformations = this.getCascavelCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
        })

      await this.sleep(5)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        const information = this.getInformationCascavel(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)
        
      } catch (error) {
        console.log(error)
      }  
    }

    let imageDate = await this.getDateInformation(filename, cropedFilename, 149, 15, 114, 3)
   
    console.log('OCR --> atualizando no banco de dados - Cascavel')
    await this.updateInDatabase(formattedInformations, 'PR', 'Cascavel', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Cascavel')
  }

  private getCuritiba = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/d1bc698ee8ecc275bdbc6f79047ed203/pr/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }

    const cropedInformations = this.getCuritibaCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
        })

      await this.sleep(5)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        const information = this.getInformationCuritiba(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)        
      } catch (error) {
        console.log(error)
      }  
    }

    const imageDate = await this.getDateInformation(filename, cropedFilename, 161, 10, 236, 457)
    console.log(imageDate)

    console.log('OCR --> atualizando no banco de dados - Curitiba')
    await this.updateInDatabase(formattedInformations, 'PR', 'Curitiba', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Curitiba')
  }

  private getLondrina = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/9e20a5fe27367d4880f8c781e90c810e/lda/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }

    const cropedInformations = this.getLondrinaCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
        })

      await this.sleep(5)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        const information = this.getInformationLondrina(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)
        // console.log(information);
        
      } catch (error) {
        console.log(error)
      }
    }

    let imageDate = await this.getDateInformation(filename, cropedFilename, 150, 14, 115, 4)    

    console.log('OCR --> atualizando no banco de dados - Londrina')
    await this.updateInDatabase(formattedInformations, 'PR', 'Londrina', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Londrina')
  }

  private getMaringa = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/9a0f375c9823a19fcf1f0fa0c6f744ca/mgf/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }

    const cropedInformations = this.getMaringaCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
        })

      await this.sleep(5)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        const information = this.getMaringaInformation(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)
      } catch (error) {
        console.log(error)
      }  
    }

    const imageDate = await this.getDateInformation(filename, cropedFilename, 147, 16, 112, 4)

    console.log('OCR --> atualizando no banco de dados - Maringa')
    await this.updateInDatabase(formattedInformations, 'PR', 'Maringa', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Maringa')
  }

  private getPortoAlegre = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/2c04290547384e55840a47bef077c673/rs/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', 'file.png')
    let cropedFilename =  path.resolve(__dirname, '..', '..', 'croped.jpg')
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', 'croped.jpg')
    }

    const cropedInformations = this.getPortoAlegreCropedInformations()
    const cropedKeys = Object.keys(cropedInformations)
    let formattedInformations: {
      serviceName: string;
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
    }[] = []

    for (let index = 0; index < cropedKeys.length; index++) {
      const key = cropedKeys[index]

      await gm(filename)
        .crop(
          cropedInformations[key].width, 
          cropedInformations[key].height, 
          cropedInformations[key].initialPointX, 
          cropedInformations[key].initialPointY
          )
        .write(cropedFilename, function(err) {
          if (err) return console.dir(arguments)
        })

      await this.sleep(5)

      try {
        const [ result ] = await client.textDetection(cropedFilename)
        const texts = result.textAnnotations
        let arrayString: Array<string> = []
  
        if (!!texts) {
          texts.forEach(text => {
            arrayString.push(String(text.description))
          })
        }
  
        // console.log(key, arrayString)
        const information = this.getPortoAlegreInformation(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)        
      } catch (error) {
        console.log(error)
      }  
    }

    const imageDate = await this.getDateInformation(filename, cropedFilename, 156, 10, 238, 457)

    console.log('OCR --> atualizando no banco de dados - Porto Alegre')
    await this.updateInDatabase(formattedInformations, 'RS', 'Porto Alegre', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Porto Alegre')
  }

  public updateManually = async (req: Request, res: Response) => {
    // await this.getRJ(false)
    await this.getFortaleza(false)
    // await this.getCascavel(false)
    // await this.getCuritiba(false)
    // await this.getLondrina(false)
    // await this.getMaringa(false)
    await this.getPortoAlegre(false)

    return res.status(200).json({
      data: {}
    })
  }

  public runRoutine = async () => {
    await this.getRJ(true)
    await this.getFortaleza(true)
    await this.getCascavel(true)
    await this.getCuritiba(true)
    await this.getLondrina(true)
    await this.getMaringa(true)
    await this.getPortoAlegre(true)
  }

  public getAllData = async (req: Request, res: Response) => {
    const data = await ocrDataRepository.index()

    const formattedData = data.map((orcData) => {
      return {
        ...orcData,
        up_percent: Number(orcData.up_percent.slice(0, orcData.up_percent.length - 1)),
        down_percent: Number(orcData.down_percent.slice(0, orcData.down_percent.length - 1))
      }
    })

    return res.status(200).json({
      data: formattedData
    })
  }
}