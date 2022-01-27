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

import { 
  ocrDataRepository,
  ocrPermissionsRepository
} from './../repositories'
import { AppError, errorHandler } from '../utils/handleError'

import { ocrDataInterface } from './../repositories/OCRDataRepository'

let clientKey = path.resolve(__dirname, '..', '..', 'googleJSONCredentials.json')

if (process.env.NODE_ENV === 'production') {
  clientKey = path.resolve(__dirname, '..', '..', '..', 'googleJSONCredentials.json')
}

const client = new vision.ImageAnnotatorClient({
  keyFilename: clientKey,
  projectId: "fifth-repeater-335914"
})


export default class OCRController {
  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  private formatValue = (value: string) => {
    let formattedValue = value
    
    if (formattedValue[0] === '-') {
      formattedValue = formattedValue.slice(1, formattedValue.length)
    }
    
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
    if (percent === undefined) {
      return '0%'
    }

    let formattedPercent = percent

    if (formattedPercent[0] === '-') {
      formattedPercent = formattedPercent.slice(1, formattedPercent.length)
    }

    const lastLetterOfPercent = formattedPercent[formattedPercent.length - 1]
    if (lastLetterOfPercent !== '%') {
      formattedPercent = formattedPercent.slice(0, formattedPercent.length - 1) + '%'
    }

    return formattedPercent
  }

  private validatePercent = (percent: string) => {
    const percentWithoutIndicator = percent.slice(0, percent.length - 1)

    if (
      (Number(percentWithoutIndicator) === 0 || !!Number(percentWithoutIndicator))
      && (Number(percentWithoutIndicator) > -1 && Number(percentWithoutIndicator) < 100)
    ) {
      return true
    } else {
      return false
    }
  }

  private validateValue = (value: string) => {
    const lastLetterOfValue = value[value.length - 1]
    const valueWithoutDescriptionIndicator = value.slice(0, value.length - 1)

    if (
      (Number(valueWithoutDescriptionIndicator) === 0 || !!Number(valueWithoutDescriptionIndicator))
      && (lastLetterOfValue === 'G' || lastLetterOfValue === 'M' || lastLetterOfValue === 'T' || lastLetterOfValue === 'B')
      ) {
      return true
    } else {
      return false
    }
  }

  private formatColorToPercent = (
    red: number | undefined | null,
    green: number | undefined | null,
    blue: number | undefined | null
  ) => {
    let value = '0%'
    
    if (red === 0 && green === 0 && blue === 254) {
      value = '25%'
    }

    return value
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

      if (!!data.serviceName && this.validateValue(data.up_value) && this.validatePercent(data.up_percent) && this.validateValue(data.down_value) && this.validatePercent(data.down_percent)) {        
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
      // LUMEN: {
      //   width: 117,
      //   height: 167,
      //   initialPointX: 273,
      //   initialPointY: 0
      // },
      // ELETRONET: {
      //   width: 97,
      //   height: 167,
      //   initialPointX: 404,
      //   initialPointY: 0
      // },
      // DURAND: {
      //   width: 110,
      //   height: 167,
      //   initialPointX: 522,
      //   initialPointY: 0
      // },
      GLOBO: {
        width: 104,
        height: 167,
        initialPointX: 652,
        initialPointY: 0
      },
      // 'UFINET-SC': {
      //   width: 116,
      //   height: 167,
      //   initialPointX: 774,
      //   initialPointY: 0
      // },
      // CBPF: {
      //   width: 650,
      //   height: 90,
      //   initialPointX: 190,
      //   initialPointY: 170
      // },
      // 'EQUINIX-RJ1': {
      //   width: 650,
      //   height: 90,
      //   initialPointX: 190,
      //   initialPointY: 170
      // },
      // 'UFINET-JB': {
      //   width: 119,
      //   height: 169,
      //   initialPointX: 146,
      //   initialPointY: 271
      // },
      // MUNDIVOX: {
      //   width: 98,
      //   height: 169,
      //   initialPointX: 280,
      //   initialPointY: 271
      // },
      // COMMCORP: {
      //   width: 104,
      //   height: 169,
      //   initialPointX: 402,
      //   initialPointY: 271
      // },
      // INTERNEXA: {
      //   width: 104,
      //   height: 169,
      //   initialPointX: 526,
      //   initialPointY: 271
      // },
      // LINKFULL: {
      //   width: 101,
      //   height: 169,
      //   initialPointX: 656,
      //   initialPointY: 271
      // },
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
      // OI: {
      //   width: 100,
      //   height: 85,
      //   initialPointX: 36,
      //   initialPointY: 93
      // },
      // NovaFibra: {
      //   width: 96,
      //   height: 85,
      //   initialPointX: 267,
      //   initialPointY: 93
      // },
      // CenturyLink: {
      //   width: 105,
      //   height: 85,
      //   initialPointX: 392,
      //   initialPointY: 93
      // },
      // CELEPAR: {
      //   width: 105,
      //   height: 85,
      //   initialPointX: 637,
      //   initialPointY: 93
      // },
      // UFPR: {
      //   width: 115,
      //   height: 87,
      //   initialPointX: 37,
      //   initialPointY: 283
      // },
      // GVT: {
      //   width: 108,
      //   height: 87,
      //   initialPointX: 170,
      //   initialPointY: 283
      // },
      // COPEL: {
      //   width: 108,
      //   height: 87,
      //   initialPointX: 320,
      //   initialPointY: 283
      // },
      // COMMCORP: {
      //   width: 110,
      //   height: 87,
      //   initialPointX: 465,
      //   initialPointY: 283
      // },
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
        initialPointY: 86,
        colors: {
          UP: {
            width: 4,
            height: 4,
            initialPointX: 75,
            initialPointY: 86,
          },
          DOWN: {
            width: 4,
            height: 4,
            initialPointX: 147,
            initialPointY: 177,
          }
        }
      },
      // SERCOMTEL: {
      //   width: 65,
      //   height: 103,
      //   initialPointX: 231,
      //   initialPointY: 86
      // },
      // UEL: {
      //   width: 59,
      //   height: 106,
      //   initialPointX: 238,
      //   initialPointY: 229
      // }
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
      // SYGO: {
      //   width: 86,
      //   height: 92,
      //   initialPointX: 43,
      //   initialPointY: 93
      // },
      // COMMCORP: {
      //   width: 94,
      //   height: 92,
      //   initialPointX: 141,
      //   initialPointY: 93
      // },
      // OI: {
      //   width: 102,
      //   height: 92,
      //   initialPointX: 236,
      //   initialPointY: 93
      // },
      'Nossa Telecom': {
        width: 89,
        height: 92,
        initialPointX: 343,
        initialPointY: 93
      },
      // GVT: {
      //   width: 91,
      //   height: 92,
      //   initialPointX: 439,
      //   initialPointY: 93
      // },
      // Defferrari: {
      //   width: 93,
      //   height: 92,
      //   initialPointX: 536,
      //   initialPointY: 93
      // },
      // CenturyLink: {
      //   width: 109,
      //   height: 92,
      //   initialPointX: 630,
      //   initialPointY: 93
      // },
      // VOGEL: {
      //   width: 93,
      //   height: 88,
      //   initialPointX: 42,
      //   initialPointY: 286
      // },
      // 'RNP UFRGS': {
      //   width: 100,
      //   height: 88,
      //   initialPointX: 134,
      //   initialPointY: 286
      // },
      // LVT: {
      //   width: 92,
      //   height: 88,
      //   initialPointX: 241,
      //   initialPointY: 286
      // },
      // ADYLNET: {
      //   width: 101,
      //   height: 88,
      //   initialPointX: 336,
      //   initialPointY: 286
      // },
      // RENOVARE: {
      //   width: 92,
      //   height: 88,
      //   initialPointX: 440,
      //   initialPointY: 286
      // },
      // RedeISP: {
      //   width: 102,
      //   height: 88,
      //   initialPointX: 535,
      //   initialPointY: 286
      // },
      // METROLAN: {
      //   width: 101,
      //   height: 88,
      //   initialPointX: 637,
      //   initialPointY: 286
      // },
    }

    return services
  }

  private getSaoPauloCropedInformations = () => {
    const services = {
      // UP VALUES
      // 'NIC-NU': {
      //   UP: {
      //     width: 40,
      //     height: 27,
      //     initialPointX: 64,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 41,
      //     height: 28,
      //     initialPointX: 1,
      //     initialPointY: 144
      //   }
      // },
      // 'Telium': {
      //   UP: {
      //     width: 42,
      //     height: 27,
      //     initialPointX: 130,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 39,
      //     height: 28,
      //     initialPointX: 70,
      //     initialPointY: 144
      //   }
      // },
      // 'SAMMCCR': {
      //   UP: {
      //     width: 43,
      //     height: 27,
      //     initialPointX: 199,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 39,
      //     height: 28,
      //     initialPointX: 140,
      //     initialPointY: 144
      //   }
      // },
      // 'USP': {
      //   UP: {
      //     width: 41,
      //     height: 27,
      //     initialPointX: 268,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 39,
      //     height: 28,
      //     initialPointX: 201,
      //     initialPointY: 144
      //   }
      // },
      // 'Embratel': {
      //   UP: {
      //     width: 43,
      //     height: 27,
      //     initialPointX: 328,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 41,
      //     height: 28,
      //     initialPointX: 265,
      //     initialPointY: 144
      //   }
      // },
      // 'Telefônica': {
      //   UP: {
      //     width: 43,
      //     height: 27,
      //     initialPointX: 395,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 44,
      //     height: 28,
      //     initialPointX: 330,
      //     initialPointY: 144
      //   }
      // },
      // 'Algar-PIAF': {
      //   UP: {
      //     width: 42,
      //     height: 27,
      //     initialPointX: 461,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 43,
      //     height: 28,
      //     initialPointX: 397,
      //     initialPointY: 144
      //   }
      // },
      // 'Commcorp': {
      //   UP: {
      //     width: 50,
      //     height: 27,
      //     initialPointX: 524,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 43,
      //     height: 28,
      //     initialPointX: 462,
      //     initialPointY: 144
      //   }
      // },
      // 'Americanet': {
      //   UP: {
      //     width: 50,
      //     height: 27,
      //     initialPointX: 600,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 44,
      //     height: 28,
      //     initialPointX: 534,
      //     initialPointY: 144
      //   }
      // },
      // 'G8': {
      //   UP: {
      //     width: 48,
      //     height: 27,
      //     initialPointX: 672,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 47,
      //     height: 28,
      //     initialPointX: 604,
      //     initialPointY: 144
      //   }
      // },
      // 'Matrix': {
      //   UP: {
      //     width: 48,
      //     height: 27,
      //     initialPointX: 741,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 45,
      //     height: 28,
      //     initialPointX: 676,
      //     initialPointY: 144
      //   }
      // },
      'Algar CENESP': {
        UP: {
          width: 45,
          height: 27,
          initialPointX: 816,
          initialPointY: 93
        },
        DOWN: {
          width: 45,
          height: 28,
          initialPointX: 745,
          initialPointY: 144
        }
      },
      'Equinox-SP4': {
        UP: {
          width: 45,
          height: 27,
          initialPointX: 885,
          initialPointY: 93
        },
        DOWN: {
          width: 43,
          height: 28,
          initialPointX: 820,
          initialPointY: 144
        }
      },
      // 'NIC-JD': {
      //   UP: {
      //     width: 44,
      //     height: 27,
      //     initialPointX: 955,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 42,
      //     height: 28,
      //     initialPointX: 891,
      //     initialPointY: 144
      //   }
      // },
      // 'Odata': {
      //   UP: {
      //     width: 52,
      //     height: 27,
      //     initialPointX: 1024,
      //     initialPointY: 93
      //   },
      //   DOWN: {
      //     width: 46,
      //     height: 30,
      //     initialPointX: 958,
      //     initialPointY: 143
      //   }
      // },
      // DOWN VALUES
      // 'Level 3 CenturyLink': {
      //   UP: {
      //     width: 36,
      //     height: 26,
      //     initialPointX: 66,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 42,
      //     height: 27,
      //     initialPointX: 1,
      //     initialPointY: 280
      //   }
      // },
      // 'OI': {
      //   UP: {
      //     width: 44,
      //     height: 26,
      //     initialPointX: 130,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 39,
      //     height: 27,
      //     initialPointX: 71,
      //     initialPointY: 280
      //   }
      // },
      // 'Equinix-SP1': {
      //   UP: {
      //     width: 44,
      //     height: 26,
      //     initialPointX: 199,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 46,
      //     height: 27,
      //     initialPointX: 130,
      //     initialPointY: 280
      //   }
      // },
      // 'GVT-JD': {
      //   UP: {
      //     width: 44,
      //     height: 26,
      //     initialPointX: 268,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 41,
      //     height: 27,
      //     initialPointX: 204,
      //     initialPointY: 280
      //   }
      // },
      // 'TIVIT': {
      //   UP: {
      //     width: 44,
      //     height: 26,
      //     initialPointX: 327,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 42,
      //     height: 27,
      //     initialPointX: 264,
      //     initialPointY: 280
      //   }
      // },
      // 'Scala': {
      //   UP: {
      //     width: 41,
      //     height: 26,
      //     initialPointX: 396,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 44,
      //     height: 29,
      //     initialPointX: 330,
      //     initialPointY: 280
      //   }
      // },
      // 'GVT-CENU': {
      //   UP: {
      //     width: 46,
      //     height: 26,
      //     initialPointX: 459,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 41,
      //     height: 27,
      //     initialPointX: 397,
      //     initialPointY: 280
      //   }
      // },
      // 'Vogel': {
      //   UP: {
      //     width: 49,
      //     height: 26,
      //     initialPointX: 527,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 43,
      //     height: 27,
      //     initialPointX: 461,
      //     initialPointY: 280
      //   }
      // },
      // 'Eletronet': {
      //   UP: {
      //     width: 47,
      //     height: 26,
      //     initialPointX: 600,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 48,
      //     height: 27,
      //     initialPointX: 530,
      //     initialPointY: 280
      //   }
      // },
      'Equinix-SP3': {
        UP: {
          width: 47,
          height: 26,
          initialPointX: 671,
          initialPointY: 314
        },
        DOWN: {
          width: 49,
          height: 27,
          initialPointX: 601,
          initialPointY: 280
        }
      },
      // 'Locaweb': {
      //   UP: {
      //     width: 47,
      //     height: 26,
      //     initialPointX: 741,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 46,
      //     height: 27,
      //     initialPointX: 674,
      //     initialPointY: 280
      //   }
      // },
      'Equinix-SP2': {
        UP: {
          width: 48,
          height: 26,
          initialPointX: 814,
          initialPointY: 314
        },
        DOWN: {
          width: 47,
          height: 27,
          initialPointX: 747,
          initialPointY: 280
        }
      },
      // 'Ufinet': {
      //   UP: {
      //     width: 47,
      //     height: 26,
      //     initialPointX: 885,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 46,
      //     height: 27,
      //     initialPointX: 817,
      //     initialPointY: 280
      //   }
      // },
      // 'TIM': {
      //   UP: {
      //     width: 41,
      //     height: 26,
      //     initialPointX: 955,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 47,
      //     height: 27,
      //     initialPointX: 886,
      //     initialPointY: 280
      //   }
      // },
      // 'Ascenty-SP2': {
      //   UP: {
      //     width: 46,
      //     height: 26,
      //     initialPointX: 1020,
      //     initialPointY: 314
      //   },
      //   DOWN: {
      //     width: 42,
      //     height: 27,
      //     initialPointX: 955,
      //     initialPointY: 280
      //   }
      // },
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
      
      up_value = this.formatValue(informationsArray[0])
      down_value = this.formatValue(informationsArray[1])

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

  private getSaoPauloInformation = (informations: {
    serviceName: string;
    up_value: string;
    up_percent: string;
    down_value: string;
    down_percent: string;
  }, type: 'up' | 'down', informationsArray: Array<string>, key: string) => {
    // console.log(key, informationsArray)
    
    if (key === 'NIC-NU' || key === 'Telium' || key === 'SAMMCCR' || key === 'USP' || key === 'Embratel' || key === 'Telefônica' || key === 'Algar-PIAF' || key === 'Commcorp' || key === 'Americanet' || key === 'G8' || key === 'Matrix' || key === 'CENESP' || key === 'Equinox-SP4' || key === 'NIC-JD' || key === 'Odata') {
      if (type === 'up') {
        informations.up_value = this.formatValue(informationsArray[1])
        informations.up_percent = this.formatPercent(informationsArray[2])
      } else {
        informations.down_value = this.formatValue(informationsArray[1])
        informations.down_percent = this.formatPercent(informationsArray[2])
      }
    } else {
      if (type === 'up') {
        informations.up_value = this.formatValue(informationsArray[1])
        informations.up_percent = this.formatPercent(informationsArray[2])
      } else {
        informations.down_value = this.formatValue(informationsArray[1])
        informations.down_percent = this.formatPercent(informationsArray[2])
      }
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
    const nameOfFile = 'file_rioDeJaneiro.png'
    const nameOfCropedFile = 'croped_rioDeJaneiro.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(example, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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
    // let imageDate = ''

    // try {
    //   const [ result ] = await client.textDetection(cropedFilename)
    //   const texts = result.textAnnotations
    //   let arrayString: Array<string> = []

    //   if (!!texts) {
    //     texts.forEach(text => {
    //       // console.log(text.description)
    //       arrayString.push(String(text.description))
    //     })
    //   }

    //   // console.log(arrayString.slice(1, arrayString.length))
    //   arrayString.slice(1, arrayString.length).forEach((content, index) => {
    //     if (index === 0) {
    //       imageDate += content
    //     } 

    //     if (index === 1) {
    //       imageDate += ` ${content}`
    //     }
    //   })

    // } catch (error) {
    //   console.log(error)
    // }


    // if (imageDate.includes('(')) {
    //   imageDate = imageDate.slice(0, imageDate.indexOf('('))
    // }
    console.log('OCR --> atualizando no banco de dados - Rio de Janeiro')
    await this.updateInDatabase(formattedInformations, 'RJ', 'Rio de Janeiro', '', isRoutine)
    console.log('OCR --> atualizado! - Rio de Janeiro')
  }

  private getFortaleza = async (isRoutine: boolean) => {
    let fortalezaURL = 'https://old.ix.br/stats/cbff2f8aa74c6b3a283048e31b56576d/ce/images/setas01.png'
    const nameOfFile = 'file_fortaleza.png'
    const nameOfCropedFile = 'croped_fortaleza.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(fortalezaURL, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)
    
    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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
    const nameOfFile = 'file_cascavel.png'
    const nameOfCropedFile = 'croped_cascavel.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(cascavelURL, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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
    const nameOfFile = 'file_curitiba.png'
    const nameOfCropedFile = 'croped_curitiba.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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

    // const imageDate = await this.getDateInformation(filename, cropedFilename, 161, 10, 236, 457)
    // console.log(imageDate)

    console.log('OCR --> atualizando no banco de dados - Curitiba')
    await this.updateInDatabase(formattedInformations, 'PR', 'Curitiba', '', isRoutine)
    console.log('OCR --> atualizado! - Curitiba')
  }

  private getLondrina = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/9e20a5fe27367d4880f8c781e90c810e/lda/images/setas01.png'
    const nameOfFile = 'file_londrina.png'
    const nameOfCropedFile = 'croped_londrina.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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
      } catch (error) {
        console.log(error)
      }

      // processamento das cores
    //   await gm(filename)
    //     .crop(
    //       cropedInformations[key].colors.UP.width, 
    //       cropedInformations[key].colors.UP.height, 
    //       cropedInformations[key].colors.UP.initialPointX, 
    //       cropedInformations[key].colors.UP.initialPointY
    //       )
    //     .write(cropedFilename, function(err) {
    //       if (err) return console.dir(arguments)
    //     })

    //   await this.sleep(5)

    //   try {
    //     const [ result ] = await client.imageProperties(cropedFilename)
    //     const colors = result.imagePropertiesAnnotation?.dominantColors?.colors

    //     if (!!colors) {
    //       const colorDetected = colors[0].color

    //       if (!!colorDetected) {
    //         formattedInformations.forEach((information, index) => {
    //           if (information.serviceName === key) {
    //             formattedInformations[index].up_percent = this.formatColorToPercent(
    //               colorDetected.red,
    //               colorDetected.green,
    //               colorDetected.blue
    //             )
    //           }
    //         })
    //       }
    //     }
    //   } catch (error) {
    //     console.log(error)
    //   }

    //   await gm(filename)
    //     .crop(
    //       cropedInformations[key].colors.DOWN.width, 
    //       cropedInformations[key].colors.DOWN.height, 
    //       cropedInformations[key].colors.DOWN.initialPointX, 
    //       cropedInformations[key].colors.DOWN.initialPointY
    //       )
    //     .write(cropedFilename, function(err) {
    //       if (err) return console.dir(arguments)
    //     })

    //   await this.sleep(5)

    //   try {
    //     const [ result ] = await client.imageProperties(cropedFilename)
    //     const colors = result.imagePropertiesAnnotation?.dominantColors?.colors

    //     if (!!colors) {
    //       const colorDetected = colors[0].color

    //       if (!!colorDetected) {
    //         formattedInformations.forEach((information, index) => {
    //           if (information.serviceName === key) {
    //             formattedInformations[index].down_percent = this.formatColorToPercent(
    //               colorDetected.red,
    //               colorDetected.green,
    //               colorDetected.blue
    //             )
    //           }
    //         })
    //       }
    //     }
    //   } catch (error) {
    //     console.log(error)
    //   }
    }

    // console.log(formattedInformations)

    let imageDate = await this.getDateInformation(filename, cropedFilename, 150, 14, 115, 4)    

    console.log('OCR --> atualizando no banco de dados - Londrina')
    await this.updateInDatabase(formattedInformations, 'PR', 'Londrina', imageDate, isRoutine)
    console.log('OCR --> atualizado! - Londrina')
  }

  private getMaringa = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/9a0f375c9823a19fcf1f0fa0c6f744ca/mgf/images/setas01.png'
    const nameOfFile = 'file_maringa.png'
    const nameOfCropedFile = 'croped_maringa.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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
    const nameOfFile = 'file_portoalegre.png'
    const nameOfCropedFile = 'croped_portoalegre.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
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
  
        const information = this.getPortoAlegreInformation(arrayString.slice(1, arrayString.length), key)
        formattedInformations.push(information)        
      } catch (error) {
        console.log(error)
      }  
    }

    // const imageDate = await this.getDateInformation(filename, cropedFilename, 156, 10, 238, 457)

    console.log('OCR --> atualizando no banco de dados - Porto Alegre')
    await this.updateInDatabase(formattedInformations, 'RS', 'Porto Alegre', '', isRoutine)
    console.log('OCR --> atualizado! - Porto Alegre')
  }

  private getSaoPaulo = async (isRoutine: boolean) => {
    const url = 'https://old.ix.br/stats/93a90de78413c1557bf553404bea9c14/sp/images/setas01.png'
    const nameOfFile = 'file_sp.png'
    const nameOfCropedFile = 'croped_sp.jpg'

    const file = fs.createWriteStream(nameOfFile, { encoding: 'base64' })
    const request = https.get(url, function(response) {
      response.pipe(file)
    })

    await this.sleep(7)

    let filename = path.resolve(__dirname, '..', '..', nameOfFile)
    let cropedFilename =  path.resolve(__dirname, '..', '..', nameOfCropedFile)
    if (process.env.NODE_ENV === 'production') {
        filename = path.resolve(__dirname, '..', '..', '..', nameOfFile)
        cropedFilename =  path.resolve(__dirname, '..', '..', '..', nameOfCropedFile)
    }

    const cropedInformations = this.getSaoPauloCropedInformations()
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
      let informations: {
        serviceName: string;
        up_value: string;
        up_percent: string;
        down_value: string;
        down_percent: string;
      } = {
        serviceName: '',
        up_value: '',
        up_percent: '',
        down_value: '',
        down_percent: ''
      }

      informations['serviceName'] = key

      gm(filename)
        .crop(
          cropedInformations[key]['UP'].width, 
          cropedInformations[key]['UP'].height, 
          cropedInformations[key]['UP'].initialPointX, 
          cropedInformations[key]['UP'].initialPointY
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
  
        this.getSaoPauloInformation(
          informations,
          'up',
          arrayString,
          key
        )
      } catch (error) {
        console.log(error)
      }
      
      gm(filename)
        .crop(
          cropedInformations[key]['DOWN'].width, 
          cropedInformations[key]['DOWN'].height, 
          cropedInformations[key]['DOWN'].initialPointX, 
          cropedInformations[key]['DOWN'].initialPointY
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
  
        this.getSaoPauloInformation(
          informations,
          'down',
          arrayString,
          key
        )
      } catch (error) {
        console.log(error)
      }  

      formattedInformations.push(informations)
    }

    // let imageDate = await this.getDateInformation(filename, cropedFilename, 158, 11, 469, 458)
    
    console.log('OCR --> atualizando no banco de dados - São Paulo (SP)')
    await this.updateInDatabase(formattedInformations, 'SP', 'São Paulo', '', isRoutine)
    console.log('OCR --> atualizado! - São Paulo (SP)')
  }

  public updateManually = async (req: Request, res: Response) => {
    // await this.getRJ(false)
    // await this.getFortaleza(false)
    // await this.getCascavel(false)
    // await this.getCuritiba(false)
    // await this.getLondrina(false)
    // await this.getMaringa(false)
    // await this.getPortoAlegre(false)
    // await this.getSaoPaulo(false)

    await Promise.all([
      // this.getRJ(false),
      // this.getFortaleza(false),
      // this.getCascavel(false),
      // this.getCuritiba(false),
      this.getLondrina(false),
      // this.getMaringa(false),
      // this.getPortoAlegre(false),
      // this.getSaoPaulo(false)
    ])

    return res.status(200).json({
      data: {}
    })
  }

  public runRoutine = async () => {
    await Promise.all([
      this.getRJ(true),
      // this.getFortaleza(true),
      // this.getCascavel(true),
      // this.getCuritiba(true),
      // this.getLondrina(true),
      // this.getMaringa(true),
      // this.getPortoAlegre(true)
    ])
  }

  public runRoutineTeenMinutes = async () => {
    await this.sleep(70)

    await Promise.all([
      this.getPortoAlegre(true),
      this.getCuritiba(true),
      this.getRJ(true),
      this.getSaoPaulo(true)
    ])
  }

  public addPermission = async (req: Request, res: Response) => {
    const { client_FK, state, city, pix_name } = req.body
    const {
      permissions
    } = req.body

    const requests = permissions.map(async (permission: {
      client_FK: number, 
      state: string, 
      city: string,
      service: string
    }) => {
      const search = await ocrPermissionsRepository.get({
        client_FK: Number(permission.client_FK),
        state: String(permission.state),
        city: String(permission.city),
        pix_name: String(permission.service)
      })

      if (!search) {
        await ocrPermissionsRepository.create({
          client_FK: Number(permission.client_FK),
          state: String(permission.state),
          city: String(permission.city),
          pix_name: String(permission.service)
        })
          .catch(error => {})
      }
    })

    await Promise.all(requests)

    return res.status(201).json({
      message: 'permissão criada com sucesso!'
    })
  }

  public removePermission = async  (req: Request, res: Response) => {
    const { client_FK, state, city, pix_name } = req.body
    const {
      permissions
    } = req.body

    const requests = permissions.map(async (permission: {
      client_FK: number, 
      state: string, 
      city: string,
      service: string
    }) => {
      await ocrPermissionsRepository.delete({
        client_FK: Number(permission.client_FK),
        state: String(permission.state),
        city: String(permission.city),
        pix_name: String(permission.service)
      })
        .catch(error => {})
    })

    await Promise.all(requests)

    return res.status(200).json({
      message: 'permissão removida com sucesso!'
    })
  }

  public getPermissions = async (clientID: number) => {
    let services: Array<string> = []
    let states: Array<string> = []
    let cities: Array<string> = []

    const permissions = await ocrPermissionsRepository.index({ client_FK: clientID })

    permissions.forEach((permission) => {
      if (!services.includes(permission.pix_name)) {
        services.push(permission.pix_name)
      }

      if (!states.includes(permission.state)) {
        states.push(permission.state)
      }

      if (!cities.includes(permission.city)) {
        cities.push(permission.city)
      }
    })

    return {
      services,
      states,
      cities
    }
  }

  public getRegistredStates = async (req: Request, res: Response) => {
    let states: Array<string> = []

    const ocrData = await ocrDataRepository.index({})
    ocrData.forEach((data) => {
      if (!states.includes(data.state)) {
        states.push(data.state)
      }
    })

    return res.status(200).json({
      states: states.map((state) => {
        return {
          label: state,
          value: state
        }
      })
    })
  }

  public getRegistredCities = async (req: Request, res: Response) => {
    const { state } = req.params

    let cities: Array<string> = []
    const ocrData = await ocrDataRepository.index({
      states: [ state ]
    })
    ocrData.forEach((data) => {
      if (!cities.includes(data.city)) {
        cities.push(data.city)
      }
    })

    return res.status(200).json({
      cities: cities.map((city) => {
        return {
          label: city,
          value: city
        }
      })
    })
  }

  public getRegistredServices = async (req: Request, res: Response) => {
    const { state, city } = req.params

    let services: Array<string> = []
    const ocrData = await ocrDataRepository.index({
      states: [ state ],
      cities: [ city ]
    })
    ocrData.forEach(data => {
      if (!services.includes(data.service)) {
        services.push(data.service)
      }
    })

    return res.status(200).json({
      services: services.map(service => {
        return {
          label: service,
          value: service
        }
      })
    })
  }

  public getAllData = async (req: Request, res: Response) => { 
    const userID = Number(res.getHeader('userID'))
    
    const { services, states, cities } = await this.getPermissions(userID)
    
    let data: Array<ocrDataInterface> = []
    if (services.length > 0 && states.length > 0 && cities.length > 0) {
      data = await ocrDataRepository.index({
        services,
        states,
        cities
      })
    }

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

  public getAllDataWithoutKey = async (req: Request, res: Response) => {
    const data = await ocrDataRepository.index({})

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