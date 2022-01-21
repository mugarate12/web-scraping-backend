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

  private getServicesTitles = (visionTexts: any) => {
    let upsideServices: Array<string> = []
    let upsideServicesLimit: number | undefined = undefined

    if (!!visionTexts) {
      visionTexts.forEach((text, index) => {        
        if (upsideServicesLimit === undefined) {
          if (text.description === 'PIX') {
            upsideServices.push(String(visionTexts[index + 1].description))
            
            if (String(visionTexts[index + 2].description) !== 'PIX') {
              upsideServicesLimit = index + 2
            } 
          }
        }
      })
    }

    return {
      upsideServices,
      upsideServicesLimit
    }
  }

  private formatValue = (value: string) => {
    let formattedValue = value
    const lastLetterOfValue = formattedValue[formattedValue.length - 1]

    if (lastLetterOfValue === ']' || lastLetterOfValue === '|') {
      formattedValue = formattedValue.slice(0, formattedValue.length - 1)
    }

    if (lastLetterOfValue === '6') {
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

  private formatValuesAndPercents = (values: Array<{
    value: string,
    percent: string
  }>) => {
    return values.map((value) => {
      let formattedValue = value.value
      let formattedPercent = value.percent
            
      formattedValue = this.formatValue(formattedValue)
      formattedPercent = this.formatPercent(formattedPercent)

      return {
        value: formattedValue,
        percent: formattedPercent
      }
    })
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
      console.log(informationsArray)
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
          console.log('created')
        })

      await this.sleep(5)
      console.log('timming ok')
      console.log(key)

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
        console.log('created')
      })

    await this.sleep(5)
    console.log('timming  date ok')
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

      console.log(arrayString.slice(1, arrayString.length))
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
    
    console.log('imageDate: ', imageDate)

    console.log('atualizando no banco de dados')
    await this.updateInDatabase(formattedInformations, 'RJ', 'Rio de Janeiro', imageDate, isRoutine)
    console.log('atualizado!')
  }

  public updateManually = async (req: Request, res: Response) => {
    await this.getRJ(false)

    return res.status(200).json({
      data: {}
    })
  }

  public runRoutine = async () => {
    await this.getRJ(true)
  }

  public getAllData = async (req: Request, res: Response) => {
    const data = await ocrDataRepository.index()

    return res.status(200).json({
      data: data
    })
  }
}