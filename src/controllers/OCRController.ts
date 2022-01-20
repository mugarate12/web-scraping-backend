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

  // private switchLetter = (value: string) => {
  //   let formattedValue = value

  //   // switch o to 9
  //   for (let index = 0; index < formattedValue.length; index++) {
  //     const letter = formattedValue[index]
      
  //     if (letter === 'o') {
  //       formattedValue = `${formattedValue.slice(0, index)}9${formattedValue.slice(index+1, formattedValue.length)}`
  //     }

  //     if (letter === '&') {
  //       formattedValue = `${formattedValue.slice(0, index)}8${formattedValue.slice(index+1, formattedValue.length)}`
  //     }
  //   }

  //   if (formattedValue[formattedValue.length - 1] === '6') {
  //     formattedValue = `${formattedValue.slice(0, formattedValue.length)}G`
  //   }

  //   return formattedValue
  // }

  // private formatValue = (value: string) => {
  //   let formattedValue = value
    
  //   if (value[0] === '.' || value [0] === ',') {
  //     formattedValue = `3${value}`
  //   }
    
  //   formattedValue = this.switchLetter(formattedValue)

  //   return formattedValue
  // }
  
  // private getUpsideImageData = (textWithBreakLines: Array<string>) => {
  //   if (textWithBreakLines.length > 0) {
  //     const services = textWithBreakLines[1].split(' ')
      
  //     const upsideArrowValues = textWithBreakLines[2].split(' ')
  //     const upsideArrowPercents = textWithBreakLines[3].split(' ')

  //     // se esse valor vier 5.5 porque não conseguiu pegar a dezena, pegar o valor anterior
  //     const downsideArrowValues = textWithBreakLines[4].split(' ')
  //     const downsideArrowPercents = textWithBreakLines[5].split(' ')

  //     console.log(`
  //       servico: ${services[4]}
        
  //       valor da seta de cima: ${this.formatValue(upsideArrowValues[4])}
  //       valor da porcentagem: ${upsideArrowPercents[4]}

  //       valor da seta de baixo: ${this.formatValue(downsideArrowValues[4])}
  //       valor da porcentagem: ${downsideArrowPercents[4]}
  //     `)
  //   }
  // }

  // private get = async () => {
  //   let imageText = ''

  //   let example = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'
  //   let example2 = 'https://old.ix.br/stats/93a90de78413c1557bf553404bea9c14/sp/images/setas01.png'
  //   let example3 = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'

  //   await Tesseract.recognize(
  //     example,
  //     'eng',
  //     // { logger: m => console.log(m) }
  //     { logger: m => {} }
  //   ).then(({ data: { text } }) => {
  //     // console.log(text);
  //     imageText = text
  //   })

  //   // console.log(imageText.split('\n'))
  //   const breakLines = imageText.split('\n')
  //   console.log(breakLines)

  //   // parte de cima da imagem
  //   // this.getUpsideImageData(breakLines)


  // }

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

  // decrepted
  private getServicesValues = (visionTexts: any, totalOfServices: number) => {
    let upsideValuesLimit: number | undefined = undefined
    let upsideValues: Array<{
      value: string,
      percent: string
    }> = []
    let downsideValues: Array<{
      value: string,
      percent: string
    }> = []
    

    visionTexts.forEach((text, index) => {
      if (upsideValuesLimit === undefined) {
        if (visionTexts[index + 2].description === 'PIX') {
          upsideValuesLimit = index + 2

          const value = String(text.description)
          let description = String(visionTexts[index + 1].description)

          if (String(visionTexts[index + 1].description) === '/') {
            description = String(visionTexts[index + 2].description)
          }

         if (upsideValues.length !== 6) {
            upsideValues.push({
              value: value,
              percent: description
            })
          } else {
            downsideValues.push({
              value: value,
              percent: description
            })
         }
        } else if (index % 2 === 0) {
          const value = String(text.description)
          let description = String(visionTexts[index + 1].description)
          
          if (String(visionTexts[index + 1].description) === '/') {
            description = String(visionTexts[index + 2].description)
          }

          if (upsideValues.length !== 6) {
            upsideValues.push({
              value: value,
              percent: description
            })
          } else {
            downsideValues.push({
              value: value,
              percent: description
            })
         }
        }
      }
    })

    downsideValues = downsideValues.filter(value => value.value !== '/').slice(0, downsideValues.length - 1)

    let haveNonValue = false
    let valueWithNonValue: number | undefined = undefined
    downsideValues.forEach((value, index) => {
      if (value.value.includes('%')) {
        haveNonValue = true
        valueWithNonValue = index
      }
    })
    
    if (haveNonValue && valueWithNonValue !== undefined) {
      let newDownsideValues: Array<{
        value: string,
        percent: string
      }> = []

      downsideValues.forEach((value, index) => {
        if (Number(valueWithNonValue) - 1 === index) {
          newDownsideValues.push({
            value: value.value,
            percent: '1%'
          })
        }

        if (index > 0 && index < downsideValues.length - 1) {
          newDownsideValues.push({
            value: downsideValues[index -1].percent,
            percent: value.value
          })
        }
      })
    }

    return {
      upsideValues,
      downsideValues: downsideValues,
      upsideValuesLimit: upsideValuesLimit !== undefined ? upsideValuesLimit - 3: undefined
    }
  }

  private getDownsideValues = (visionTexts: any) => {
    let values: Array<{
      value: string,
      percent: string
    }> = []
    let breakIndex: number | undefined = undefined

    visionTexts.forEach((text, index) => {
      if (breakIndex === undefined) {
        if (String(text.description) === 'PIX') {
          breakIndex = index
        }
        
        if (index % 2 !== 0 && String(text.description) !== 'PIX') {
          values.push({
            value: this.formatValue(String(visionTexts[index - 1].description)),
            percent: this.formatPercent(String(text.description))
          })
        }
      }
    })

    let haveNonValue = false
    let valueWithNonValue: number | undefined = undefined
    values.forEach((value, index) => {
      if (value.value.includes('%')) {
        haveNonValue = true
        valueWithNonValue = index
      }
    })

    if (haveNonValue && valueWithNonValue !== undefined) {
      let newDownsideValues: Array<{
        value: string,
        percent: string
      }> = []

      values.forEach((value, index) => {
        if (Number(valueWithNonValue) - 1 === index) {
          newDownsideValues.push({
            value: value.value,
            percent: '1%'
          })
        }

        if (index > 0 && index < values.length - 1) {
          newDownsideValues.push({
            value: values[index -1].percent,
            percent: value.value
          })
        }
      })

      values = newDownsideValues
    }

    return {
      values,
      breakIndex
    }
  }

  private updateInDatabase = async (dataArray: {
    serviceName: string;
    up_value: string;
    up_percent: string;
    down_value: string;
    down_percent: string;
  }[], state: string, city: string) => {
    for (let index = 0; index < dataArray.length; index++) {
      const data = dataArray[index]

      const ocrData = await ocrDataRepository.get({ state, city, service: data.serviceName })
      if (!!ocrData) {
        await ocrDataRepository.update({
          identifiers: {
            state,
            city,
            service: data.serviceName
          },
          payload: {
            up_value: data.up_value,
            up_percent: data.up_percent,
            down_value: data.down_value,
            down_percent: data.down_percent
          }
        })
      } else {
        await ocrDataRepository.create({
          state,
          city,
          service: data.serviceName,
          up_value: data.up_value,
          up_percent: data.up_percent,
          down_value: data.down_value,
          down_percent: data.down_percent
        })
      }
    }
  }

  private getWithGoogleCloudVision = async () => {
    let example = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'

    let example2 = 'https://old.ix.br/stats/93a90de78413c1557bf553404bea9c14/sp/images/setas01.png'
    let example3 = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'
    let example4 = 'https://old.ix.br/stats/cbff2f8aa74c6b3a283048e31b56576d/ce/images/setas01.png'

    const file = fs.createWriteStream('file.png', { encoding: 'base64' })
    const request = https.get(example, function(response) {
      response.pipe(file)
    })

    await this.sleep(5)

   let filename = path.resolve(__dirname, '..', '..', 'file.png')
   if (process.env.NODE_ENV === 'production') {
      filename = path.resolve(__dirname, '..', '..', '..', 'file.png')
   }

    try {
      const [ result ] = await client.textDetection(filename)
      const texts = result.textAnnotations
      const data: Array<string> = []

      if (!!texts) {
        texts.forEach(text => {
          data.push(String(text.description))
        })
      }

      if (!!texts) {
        const upsideServices = this.getServicesTitles(texts)
        const upsideServicesTitles = upsideServices.upsideServices
        const upsideServicesLimit = upsideServices.upsideServicesLimit

        const excludeUpsideServicesTitles = texts.slice(upsideServicesLimit, texts.length)
        
        const upsideServicesValues = this.getServicesValues(excludeUpsideServicesTitles, upsideServicesTitles.length)
        const upsideValues = this.formatValuesAndPercents(upsideServicesValues.upsideValues) 
        const downsideValues = this.formatValuesAndPercents(upsideServicesValues.downsideValues)
        const upsideValuesLimit = upsideServicesValues.upsideValuesLimit

        let upsideFormattedValues: Array<{
          serviceName: string,
          up_value: string,
          up_percent: string,
          down_value: string,
          down_percent: string
        }> = []

        upsideServicesTitles.forEach((_, index) => {
          upsideFormattedValues.push({
            serviceName: upsideServicesTitles[index],
            up_value: upsideValues[index].value,
            up_percent: upsideValues[index].percent,
            down_value: downsideValues[index].value,
            down_percent: downsideValues[index].percent
          })
        }) 
        
        const excludeUpsideServicesValues = excludeUpsideServicesTitles.slice(upsideValuesLimit, excludeUpsideServicesTitles.length)

        let indexToMiddle = 10
        let middlesValues: Array<{
          serviceName: string,
          value: string,
          percent: string
        }> = []

        middlesValues.push({
          serviceName: String(excludeUpsideServicesValues[4].description),
          value: this.formatValue(String(excludeUpsideServicesValues[0].description)),
          percent: this.formatPercent(String(excludeUpsideServicesValues[2].description))
        })

        middlesValues.push({
          serviceName: String(excludeUpsideServicesValues[6].description),
          value: this.formatValue(String(excludeUpsideServicesValues[7].description)),
          percent: this.formatPercent(String(excludeUpsideServicesValues[9].description))
        })

        let middleFormattedValues: Array<{
          serviceName: string,
          up_value: string,
          up_percent: string,
          down_value: string,
          down_percent: string
        }> = []

        middleFormattedValues.push({
          serviceName: middlesValues[0].serviceName,
          up_value: middlesValues[0].value,
          up_percent: middlesValues[0].percent,
          down_value: middlesValues[1].value,
          down_percent: middlesValues[1].percent
        })
        middleFormattedValues.push({
          serviceName: middlesValues[1].serviceName,
          up_value: middlesValues[1].value,
          up_percent: middlesValues[1].percent,
          down_value: middlesValues[0].value,
          down_percent: middlesValues[0].percent
        })

        const excludeMiddleValues = excludeUpsideServicesValues.slice(indexToMiddle, excludeUpsideServicesValues.length)

        const downside = this.getDownsideValues(excludeMiddleValues)
        const middleIndexLimit = downside.breakIndex
        const downsideSValues = downside.values

        const downsideServicesValues = excludeMiddleValues.slice(middleIndexLimit, excludeMiddleValues.length) 

        const actualYear = moment().format('YYYY')        
        let downsideServices: Array<string> = []
        let breakIndex: number | undefined = undefined
        downsideServicesValues.forEach((text, index) => {
          if (breakIndex === undefined) {
            if (String(text.description).includes(actualYear)) {
              breakIndex =  index
            } else {
              if (String(text.description) !== 'PIX') {
                downsideServices.push(String(text.description))
              }
            }
          }
        })

        let downsideFormattedValues: Array<{
          serviceName: string,
          up_value: string,
          up_percent: string,
          down_value: string,
          down_percent: string
        }> = []
        if ((downsideSValues.length / 2) === downsideServices.length) {
          downsideServices.forEach((_, index) => {
            let downIndex = index === 0 ? 6 : index * 2

            downsideFormattedValues.push({
              serviceName: downsideServices[index],
              up_value: downsideSValues[index].value,
              up_percent: downsideSValues[index].percent,
              down_value: downsideSValues[downIndex].value,
              down_percent: downsideSValues[downIndex].percent
            })
          })
        }

        // upsideFormattedValues
        // middleFormattedValues
        // downsideFormattedValues
        // console.log(object)

        this.updateInDatabase(upsideFormattedValues, 'RJ', 'Rio de Janeiro')
        this.updateInDatabase(middleFormattedValues, 'RJ', 'Rio de Janeiro')
        this.updateInDatabase(downsideFormattedValues, 'RJ', 'Rio de Janeiro')
      }

      return data
    } catch (error) {
      console.log(error)
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

  private getRJ = async () => {
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

    await this.updateInDatabase(formattedInformations, 'RJ', 'Rio de Janeiro')
  }

  public updateManually = async (req: Request, res: Response) => {
    await this.getRJ()

    return res.status(200).json({
      data: {}
    })
  }

  public runRoutine = async () => {
    await this.getRJ()
  }

  public getAllData = async (req: Request, res: Response) => {
    const data = await ocrDataRepository.index()

    return res.status(200).json({
      data: data
    })
  }
}