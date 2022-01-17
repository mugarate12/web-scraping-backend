import { Request, Response } from 'express'
import Tesseract from 'tesseract.js'
import vision, { v1 } from '@google-cloud/vision'
import path from 'path'
import https from 'https'
import fs from 'fs'

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.resolve(__dirname, '..', '..', 'googleJSONCredentials.json'),
  projectId: 'image-text-338511'
})


export default class OCRController {
  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  private switchLetter = (value: string) => {
    let formattedValue = value

    // switch o to 9
    for (let index = 0; index < formattedValue.length; index++) {
      const letter = formattedValue[index]
      
      if (letter === 'o') {
        formattedValue = `${formattedValue.slice(0, index)}9${formattedValue.slice(index+1, formattedValue.length)}`
      }

      if (letter === '&') {
        formattedValue = `${formattedValue.slice(0, index)}8${formattedValue.slice(index+1, formattedValue.length)}`
      }
    }

    if (formattedValue[formattedValue.length - 1] === '6') {
      formattedValue = `${formattedValue.slice(0, formattedValue.length)}G`
    }

    return formattedValue
  }

  private formatValue = (value: string) => {
    let formattedValue = value
    
    if (value[0] === '.' || value [0] === ',') {
      formattedValue = `3${value}`
    }
    
    formattedValue = this.switchLetter(formattedValue)

    return formattedValue
  }
  
  private getUpsideImageData = (textWithBreakLines: Array<string>) => {
    if (textWithBreakLines.length > 0) {
      const services = textWithBreakLines[1].split(' ')
      
      const upsideArrowValues = textWithBreakLines[2].split(' ')
      const upsideArrowPercents = textWithBreakLines[3].split(' ')

      // se esse valor vier 5.5 porque não conseguiu pegar a dezena, pegar o valor anterior
      const downsideArrowValues = textWithBreakLines[4].split(' ')
      const downsideArrowPercents = textWithBreakLines[5].split(' ')

      console.log(`
        servico: ${services[4]}
        
        valor da seta de cima: ${this.formatValue(upsideArrowValues[4])}
        valor da porcentagem: ${upsideArrowPercents[4]}

        valor da seta de baixo: ${this.formatValue(downsideArrowValues[4])}
        valor da porcentagem: ${downsideArrowPercents[4]}
      `)
    }
  }

  private get = async () => {
    let imageText = ''

    let example = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'
    let example2 = 'https://old.ix.br/stats/93a90de78413c1557bf553404bea9c14/sp/images/setas01.png'
    let example3 = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'

    await Tesseract.recognize(
      example,
      'eng',
      // { logger: m => console.log(m) }
      { logger: m => {} }
    ).then(({ data: { text } }) => {
      // console.log(text);
      imageText = text
    })

    // console.log(imageText.split('\n'))
    const breakLines = imageText.split('\n')
    console.log(breakLines)

    // parte de cima da imagem
    // this.getUpsideImageData(breakLines)


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

    console.log('upside: ', upsideValues)
    console.log('downside: ', downsideValues.filter(value => value.value !== '/').slice(0, downsideValues.length - 1))
    console.log(Number(upsideValuesLimit) - 2)

    return {
      upsideValues,
      downsideValues: downsideValues.filter(value => value.value !== '/').slice(0, downsideValues.length - 1),
      upsideValuesLimit: upsideValuesLimit !== undefined ? upsideValuesLimit - 2 : undefined
    }
  }

  private getWithGoogleCloudVision = async () => {
    let example = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'
    let example2 = 'https://old.ix.br/stats/93a90de78413c1557bf553404bea9c14/sp/images/setas01.png'
    let example3 = 'https://old.ix.br/stats/3047274b0830e6f8371d5d14b0970580/rj/images/setas01.png'

    const file = fs.createWriteStream('file.jpg', { encoding: 'base64' })
    const request = https.get(example, function(response) {
      response.pipe(file)
    })

    await this.sleep(5)

   const filename = path.resolve(__dirname, '..', '..', 'file.jpg')

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
        const upsideValues = upsideServicesValues.upsideValues
        const downsideValues = upsideServicesValues.downsideValues
        const upsideValuesLimit = upsideServicesValues.upsideValuesLimit
        
        const excludeUpsideServicesValues = excludeUpsideServicesTitles.slice(upsideValuesLimit, excludeUpsideServicesTitles.length)
        excludeUpsideServicesValues.forEach(text => console.log(text.description))

        // vai pegar um de cima, tirar ele e alterar o index
      }

      return data
    } catch (error) {
      console.log(error)
    }
  }

  public updateManually = async (req: Request, res: Response) => {
    // await this.get()
    const data = await this.getWithGoogleCloudVision()

    return res.status(200).json({
      data
    })
  }
}