import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import fs from 'fs'
import moment from 'moment'
import dotenv from 'dotenv'

import { AppError, errorHandler } from './../utils/handleError'

import {
  equatorialDataRepository
} from './../repositories'

dotenv.config()

type citiesInterface = Array<{
  value: string;
  label: string;
}>

interface EquatorialDataInterface {
  street: string,
  district: string,

  afectedClients: number,
  
  initialDate: string,
  finalDate: string,

  initialHour: string,
  finalHour: string
}

interface EquatorialDataRSInterface {
  date: string,
  initialHour: string,
  finalHour: string,
  districts: Array<string>,
  streets: Array<string>,
  reasons: string,
  affectedClients: number
}

interface EquatorialFormattedData {
  date: string,

  state: string,
  city: string,
  district: string,
  street: string,

  status: number,

  initialHour: string,
  finalHour: string,

  duration: number,
  finalSeconds: number,
  finalMaintenance: number,

  reason: string,
  affectedClients: number
}

type EquatorialArrayData = Array<EquatorialDataInterface>
type EuqatorialRSArrayData = Array<EquatorialDataRSInterface>
type EquatorialFormattedArrayData = Array<EquatorialFormattedData>

type statusCountInterface = Array<{
  name: string,
  state: string,
  status_agendamento: number,
  status_emAndamento: number,
  status_concluidas: number
}>


export default class EquatorialController {
  public states = ['alagoas', 'maranhão', 'pará', 'piauí', 'rio grande do sul']

  public ALCities: citiesInterface = [{'label': "ARAPIRACA", value: "ARAPIRACA"}, {label: "BARRA DE SAO MIGUEL", value: "BARRA DE SAO MIGUEL"}, {label: "BELO MONTE", value: "BELO MONTE"}, {label: "ANADIA", value: "ANADIA"}, {label: "BOCA DA MATA", value: "BOCA DA MATA"}, {label: "BRANQUINHA", value: "BRANQUINHA"}, {label: "CAJUEIRO", value: "CAJUEIRO"}, {label: "CAMPESTRE", value: "CAMPESTRE"}, {label: "CHA PRETA", value: "CHA PRETA"}, {label: "COLONIA DE LEOPOLDINA", value: "COLONIA DE LEOPOLDINA"}, {label: "COQUEIRO SECO", value: "COQUEIRO SECO"}, {label: "CORURIPE", value: "CORURIPE"}, {label: "DELMIRO GOUVEIA", value: "DELMIRO GOUVEIA"}, {label: "IBATEGUARA", value: "IBATEGUARA"}, {label: "INHAPI", value: "INHAPI"}, {label: "JAPARATINGA", value: "JAPARATINGA"}, {label: "JUNDIA", value: "JUNDIA"}, {label: "LIMOEIRO DE ANADIA", value: "LIMOEIRO DE ANADIA"}, {label: "MACEIO", value: "MACEIO"}, {label: "MARAGOGI", value: "MARAGOGI"}, {label: "MARECHAL DEODORO", value: "MARECHAL DEODORO"}, {label: "MATRIZ DE CAMARAGIBE", value: "MATRIZ DE CAMARAGIBE"}, {label: "MURICI", value: "MURICI"}, {label: "NOVO LINO", value: "NOVO LINO"}, {label: "PALMEIRA DOS INDIOS", value: "PALMEIRA DOS INDIOS"}, {label: "PARICONHA", value: "PARICONHA"}, {label: "POCO DAS TRINCHEIRAS", value: "POCO DAS TRINCHEIRAS"}, {label: "PORTO CALVO", value: "PORTO CALVO"}, {label: "PORTO DE PEDRAS", value: "PORTO DE PEDRAS"}, {label: "PORTO REAL DO COLEGIO", value: "PORTO REAL DO COLEGIO"}, {label: "RIO LARGO", value: "RIO LARGO"}, {label: "SANTANA DO IPANEMA", value: "SANTANA DO IPANEMA"}, {label: "SAO JOSE DA LAGE", value: "SAO JOSE DA LAGE"}, {label: "SAO LUIZ DO QUITUNDE", value: "SAO LUIZ DO QUITUNDE"}, {label: "SAO MIGUEL DOS CAMPOS", value: "SAO MIGUEL DOS CAMPOS"}, {label: "SAO MIGUEL DOS MILAGRES", value: "SAO MIGUEL DOS MILAGRES"}, {label: "SAO SEBASTIAO", value: "SAO SEBASTIAO"}, {label: "UNIAO DOS PALMARES", value: "UNIAO DOS PALMARES"}, {label: "VICOSA", value: "VICOSA"}]
  public PICities: citiesInterface = [{label: "Água Branca", value: "Água Branca"}, {label: "Altos", value: "Altos"}, {label: "Baixa Grande do Ribeiro", value: "Baixa Grande do Ribeiro"}, {label: "Barras", value: "Barras"}, {label: "Bertolínia", value: "Bertolínia"}, {label: "Campo Maior", value: "Campo Maior"}, {label: "Canto do Buriti", value: "Canto do Buriti"}, {label: "Castelo do Piauí", value: "Castelo do Piauí"}, {label: "Floriano", value: "Floriano"}, {label: "Itaueira", value: "Itaueira"}, {label: "Landri Sales", value: "Landri Sales"}, {label: "Luís Correia", value: "Luís Correia"}, {label: "Marcos Parente", value: "Marcos Parente"}, {label: "Nazaré do Piauí", value: "Nazaré do Piauí"}, {label: "Oeiras", value: "Oeiras"}, {label: "Pedro II", value: "Pedro II"}, {label: "Picos", value: "Picos"}, {label: "São João da Serra", value: "São João da Serra"}, {label: "São José do Divino", value: "São José do Divino"}, {label: "Socorro do Piauí", value: "Socorro do Piauí"}, {label: "Teresina", value: "Teresina"}]
  public PACities: citiesInterface = [{label: "ALENQUER", value: "ALENQUER"}, {label: "ALTAMIRA", value: "ALTAMIRA"}, {label: "ANANINDEUA", value: "ANANINDEUA"}, {label: "ANAPU", value: "ANAPU"}, {label: "BELÉM", value: "BELÉM"}, {label: "BELTERRA", value: "BELTERRA"}, {label: "BENEVIDES", value: "BENEVIDES"}, {label: "BRAGANÇA", value: "BRAGANÇA"}, {label: "BREU BRANCO", value: "BREU BRANCO"}, {label: "BREVES", value: "BREVES"}, {label: "CURIONOPOLIS", value: "CURIONOPOLIS"}, {label: "DOM ELISEU", value: "DOM ELISEU"}, {label: "GOIANÉSIA DO PARA", value: "GOIANÉSIA DO PARA"}, {label: "GURUPA", value: "GURUPA"}, {label: "ITAITUBA", value: "ITAITUBA"}, {label: "MARABA", value: "MARABA"}, {label: "MARAPANIM", value: "MARAPANIM"}, {label: "MARITUBA", value: "MARITUBA"}, {label: "MEDICILANDIA", value: "MEDICILANDIA"}, {label: "OBIDOS", value: "OBIDOS"}, {label: "PARAGOMINAS", value: "PARAGOMINAS"}, {label: "PARAUAPEBAS", value: "PARAUAPEBAS"}, {label: "PORTO DE MOZ", value: "PORTO DE MOZ"}, {label: "REDENÇAO", value: "REDENÇAO"}, {label: "RONDON DO PARA", value: "RONDON DO PARA"}, {label: "SALINOPOLIS", value: "SALINOPOLIS"}, {label: "SANTA MARIA DO PARA", value: "SANTA MARIA DO PARA"}, {label: "SANTARÉM", value: "SANTARÉM"}, {label: "SAO JOAO DO ARAGUAIA", value: "SAO JOAO DO ARAGUAIA"}, {label: "TOMÉ-AÇU", value: "TOMÉ-AÇU"}, {label: "TUCUMA", value: "TUCUMA"}, {label: "TUCURUI", value: "TUCURUI"}, {label: "XINGUARA", value: "XINGUARA"}]
  public MACities: citiesInterface = [{label: "ACAILANDIA", value: "ACAILANDIA"}, {label: "ANAJATUBA", value: "ANAJATUBA"}, {label: "BACABAL", value: "BACABAL"}, {label: "BALSAS", value: "BALSAS"}, {label: "BARÃO DE GRAJAÚ", value: "BARÃO DE GRAJAÚ"}, {label: "BURITICUPU", value: "BURITICUPU"}, {label: "BURITIRANA", value: "BURITIRANA"}, {label: "CAXIAS", value: "CAXIAS"}, {label: "CENTRO DO GUILHERME", value: "CENTRO DO GUILHERME"}, {label: "CODÓ", value: "CODÓ"}, {label: "COELHO NETO", value: "COELHO NETO"}, {label: "CONCEIÇÃO DO LAGO-AÇU", value: "CONCEIÇÃO DO LAGO-AÇU"}, {label: "FORTALEZA DOS NOGUEIRAS", value: "FORTALEZA DOS NOGUEIRAS"}, {label: "GOVERNADOR EDISON LOBÃO", value: "GOVERNADOR EDISON LOBÃO"}, {label: "GRAJAÚ", value: "GRAJAÚ"}, {label: "HUMBERTO DE CAMPOS", value: "HUMBERTO DE CAMPOS"}, {label: "IMPERATRIZ", value: "IMPERATRIZ"}, {label: "JOÃO LISBOA", value: "JOÃO LISBOA"}, {label: "LIMA CAMPOS", value: "LIMA CAMPOS"}, {label: "MATA ROMA", value: "MATA ROMA"}, {label: "MONTES ALTOS", value: "MONTES ALTOS"}, {label: "PAÇO DO LUMIAR", value: "PAÇO DO LUMIAR"}, {label: "PARNARAMA", value: "PARNARAMA"}, {label: "PASTOS BONS", value: "PASTOS BONS"}, {label: "PERITORÓ", value: "PERITORÓ"}, {label: "PINDARÉ-MIRIM", value: "PINDARÉ-MIRIM"}, {label: "PINHEIRO", value: "PINHEIRO"}, {label: "PIO XII", value: "PIO XII"}, {label: "PRESIDENTE DUTRA", value: "PRESIDENTE DUTRA"}, {label: "RAPOSA", value: "RAPOSA"}, {label: "ROSÁRIO", value: "ROSÁRIO"}, {label: "SANTA INÊS", value: "SANTA INÊS"}, {label: "SÃO BERNARDO", value: "SÃO BERNARDO"}, {label: "SÃO DOMINGOS DO AZEITÃO", value: "SÃO DOMINGOS DO AZEITÃO"}, {label: "SÃO JOSÉ DE RIBAMAR", value: "SÃO JOSÉ DE RIBAMAR"}, {label: "SAO LUÍS", value: "SAO LUÍS"}, {label: "SENADOR LA ROCQUE", value: "SENADOR LA ROCQUE"}, {label: "TIMBIRAS", value: "TIMBIRAS"}, {label: "TIMON", value: "TIMON"}, {label: "TUTÓIA", value: "TUTÓIA"}]
  public RSCities: citiesInterface = [{label: 'ALVORADA', value: 'ALVORADA'}, {label: 'AMARAL FERRADOR', value: 'AMARAL FERRADOR'}, {label: 'ARAMBARÉ', value: 'ARAMBARÉ'}, {label: 'ARROIO DO PADRE', value: 'ARROIO DO PADRE'}, {label: 'ARROIO DO SAL', value: 'ARROIO DO SAL'}, {'label': 'ARROIO DOS RATOS', 'value': 'ARROIO DOS RATOS'}, {'label': 'ARROIO GRANDE', 'value': 'ARROIO GRANDE'}, {'label': 'BAGÉ', 'value': 'BAGÉ'}, {'label': 'BALNEÁRIO PINHAL', 'value': 'BALNEÁRIO PINHAL'}, {'label': 'BARRA DO RIBEIRO', 'value': 'BARRA DO RIBEIRO'}, {'label': 'BARÃO DO TRIUNFO', 'value': 'BARÃO DO TRIUNFO'}, {'label': 'BUTIÁ', 'value': 'BUTIÁ'}, {'label': 'CAMAQUÃ', 'value': 'CAMAQUÃ'}, {'label': 'CANDIOTA', 'value': 'CANDIOTA'}, {'label': 'CANGUÇU', 'value': 'CANGUÇU'}, {'label': 'CAPIVARI DO SUL', 'value': 'CAPIVARI DO SUL'}, {'label': 'CAPÃO DA CANOA', 'value': 'CAPÃO DA CANOA'}, {'label': 'CAPÃO DO LEAO', 'value': 'CAPÃO DO LEAO'}, {'label': 'CARAÁ', 'value': 'CARAÁ'}, {'label': 'CERRITO', 'value': 'CERRITO'}, {'label': 'CERRO GRANDE DO SUL', 'value': 'CERRO GRANDE DO SUL'}, {'label': 'CHARQUEADAS', 'value': 'CHARQUEADAS'}, {'label': 'CHUVISCA', 'value': 'CHUVISCA'}, {'label': 'CHUÍ', 'value': 'CHUÍ'}, {'label': 'CIDREIRA', 'value': 'CIDREIRA'}, {'label': 'CRISTAL', 'value': 'CRISTAL'}, {'label': 'DOM FELICIANO', 'value': 'DOM FELICIANO'}, {'label': 'DOM PEDRITO', 'value': 'DOM PEDRITO'}, {'label': 'DOM PEDRO DE ALCÂNTARA', 'value': 'DOM PEDRO DE ALCÂNTARA'}, {'label': 'ELDORADO DO SUL', 'value': 'ELDORADO DO SUL'}, {'label': 'ENCRUZILHADA DO SUL', 'value': 'ENCRUZILHADA DO SUL'}, {'label': 'GUAÍBA', 'value': 'GUAÍBA'}, {'label': 'HERVAL', 'value': 'HERVAL'}, {'label': 'HULHA NEGRA', 'value': 'HULHA NEGRA'}, {'label': 'IMBÉ', 'value': 'IMBÉ'}, {'label': 'ITATI', 'value': 'ITATI'}, {'label': 'JAGUARÃO', 'value': 'JAGUARÃO'}, {'label': 'LAVRAS DO SUL', 'value': 'LAVRAS DO SUL'}, {'label': 'MAMPITUBA', 'value': 'MAMPITUBA'}, {'label': 'MAQUINÉ', 'value': 'MAQUINÉ'}, {'label': 'MARIANA PIMENTEL', 'value': 'MARIANA PIMENTEL'}, {'label': 'MINAS DO LEÃO', 'value': 'MINAS DO LEÃO'}, {'label': 'MORRINHOS DO SUL', 'value': 'MORRINHOS DO SUL'}, {'label': 'MORRO REDONDO', 'value': 'MORRO REDONDO'}, {'label': 'MOSTARDAS', 'value': 'MOSTARDAS'}, {'label': 'OSÓRIO', 'value': 'OSÓRIO'}, {'label': 'PALMARES DO SUL', 'value': 'PALMARES DO SUL'}, {'label': 'PANTANO GRANDE', 'value': 'PANTANO GRANDE'}, {'label': 'PEDRAS ALTAS', 'value': 'PEDRAS ALTAS'}, {'label': 'PEDRO OSÓRIO', 'value': 'PEDRO OSÓRIO'}, {'label': 'PELOTAS', 'value': 'PELOTAS'}, {'label': 'PINHEIRO MACHADO', 'value': 'PINHEIRO MACHADO'}, {'label': 'PIRATINI', 'value': 'PIRATINI'}, {'label': 'PORTO ALEGRE', 'value': 'PORTO ALEGRE'}, {'label': 'RIO GRANDE', 'value': 'RIO GRANDE'}, {'label': 'ROLANTE', 'value': 'ROLANTE'}, {'label': 'SANTA VITÓRIA DO PALMAR', 'value': 'SANTA VITÓRIA DO PALMAR'}, {'label': 'SANTO ANTÔNIO DA PATRULHA', 'value': 'SANTO ANTÔNIO DA PATRULHA'}, {'label': 'SENTINELA DO SUL', 'value': 'SENTINELA DO SUL'}, {'label': 'SERTÃO SANTANA', 'value': 'SERTÃO SANTANA'}, {'label': 'SÃO JERÔNIMO', 'value': 'SÃO JERÔNIMO'}, {'label': 'SÃO JOSÉ DO NORTE', 'value': 'SÃO JOSÉ DO NORTE'}, {'label': 'SÃO LOURENÇO DO SUL', 'value': 'SÃO LOURENÇO DO SUL'}, {'label': 'TAPES', 'value': 'TAPES'}, {'label': 'TAVARES', 'value': 'TAVARES'}, {'label': 'TERRA DE AREIA', 'value': 'TERRA DE AREIA'}, {'label': 'TORRES', 'value': 'TORRES'}, {'label': 'TRAMANDAÍ', 'value': 'TRAMANDAÍ'}, {'label': 'TRÊS CACHOEIRAS', 'value': 'TRÊS CACHOEIRAS'}, {'label': 'TRÊS FORQUILHAS', 'value': 'TRÊS FORQUILHAS'}, {'label': 'TURUÇU', 'value': 'TURUÇU'}, {'label': 'VIAMÃO', 'value': 'VIAMÃO'}, {'label': 'XANGRI-LÁ', 'value': 'XANGRI-LÁ'}]

  private makeURL = (state: string) => {
    let url = ''

    switch (state) {
      case 'alagoas':
        url = 'https://al.equatorialenergia.com.br/desligamento-programado'
        return url
      case 'maranhão':
        url = 'https://ma.equatorialenergia.com.br/desligamento-programado'
        return url
      case 'pará':
        url = 'https://pa.equatorialenergia.com.br/desligamento-programado'
        return url
      case 'piauí':
        url = 'https://pi.equatorialenergia.com.br/desligamento-programado'
        return url
      case 'rio grande do sul':
        url = 'https://ceee.equatorialenergia.com.br/desligamentos-programados'
        return url
      default:
        return url
    }
  }

  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  public formatStatesToFrontend = (states: Array<string>) => {
    return states.map((state) => {
      switch (state) {
        case 'alagoas':
          return { value: state, label: 'AL'}
        case 'maranhão':
          return { value: state, label: 'MA'}
        case 'pará':
          return { value: state, label: 'PA'}
        case 'piauí':
          return { value: state, label: 'PI'}
        case 'rio grande do sul':
          return { value: state, label: 'RS'}
        default:
          return { value: '', label: ''}
      }
    })
  }

  public formatState = (state: string) => {
    if (state === 'al' || state === 'alagoas') {
      return 'alagoas'
    } else if (state === 'maranhão' || state === 'ma') {
      return 'maranhão'
    } else if (state === 'pará' || state === 'pa') {
      return 'pará'
    } else if (state === 'piauí' || state === 'pi') {
      return 'piauí'
    } else if (state === 'rio grande do sul' || state === 'rs') {
      return 'rio grande do sul'
    }
  }

  public runBrowser = async () => {
    const minimal_args = [
      '--incognito',
  
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
    ]
  
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: minimal_args,
      slowMo: 200
      // userDataDir: false
    })
    
    return browser
  }

  public closeBrowser = async (browser: puppeteer.Browser) => {
    let chromeTmpDataDir: string = ''

    let chromeSpawnArgs = browser.process()?.spawnargs

    if (!!chromeSpawnArgs) {
      for (let i = 0; i < chromeSpawnArgs.length; i++) {
        if (chromeSpawnArgs[i].indexOf("--user-data-dir=") === 0) {
            chromeTmpDataDir = chromeSpawnArgs[i].replace("--user-data-dir=", "");
        }
      }
    }

    await browser.close()

    fs.rmSync(chromeTmpDataDir, { recursive: true, force: true })
  }

  private newPage = async (browser: puppeteer.Browser) => {
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.setDefaultNavigationTimeout(0)

    return page
  }

  private setCity = async (page: puppeteer.Page, city: string) => {
    await page.select('#lista-municipio', city)
    await this.sleep(3)
  }

  private setCityToRs = async (page: puppeteer.Page, city: string) => {
    await page.evaluate((city) => {
      const iframe = document.getElementById('desligamentos')

      if (!!iframe) {
        const content = iframe['contentDocument']
        const iframeBody = content.children[0].children[1]

        const options = iframeBody.getElementsByClassName('ui-selectonemenu-item ui-selectonemenu-list-item ui-corner-all')
        for (let index = 0; index < options.length; index++) {
          const option = options[index]
          
          if (!!option && option.textContent === city) {
            option['click']()
          }
        }
      }
    }, city)

    await this.sleep(5)
  }

  private getData = async (page: puppeteer.Page) => {
    let result: EquatorialArrayData = []

    let resultWithUndefined = await page.evaluate(() => {
      let table = document.getElementById('desligamento-municipio')
      
      if (!!table) {
        let tbody = table.children[1]

        let ArrayOfTr = tbody.children

        return Object.keys(ArrayOfTr).map((itemIndex, index) => {
          let tr = ArrayOfTr.item(index)

          if (!!tr) {
            const date = String(tr.children[0].textContent)
            
            const street = String(tr.children[1].textContent)
            const district = String(tr.children[2].textContent)
            
            const initial = String(tr.children[3].textContent)
            const initialDate = initial.slice(0, 10)
            const initialHour = initial.slice(10, initial.length)
            
            const final = String(tr.children[4].textContent)
            const finalDate = final.slice(0, 10)
            const finalHour = final.slice(10, final.length)

            const afectedClientsString = String(tr.children[5].textContent)
            const afectedClients = Number(afectedClientsString.split(': ')[1])

            return {
              street,
              district,
              
              initialDate,
              finalDate,
            
              initialHour,
              finalHour,

              afectedClients
            }
          } else {
            return undefined
          }
        })
      } else {
        return undefined
      }
    })

    if (!!resultWithUndefined) {
      resultWithUndefined.forEach(item => {
        if (!!item) {
          result.push(item)
        }
      })
    }

    return result
  }

  private getDataToRs = async (page: puppeteer.Page) => {
    let result: EuqatorialRSArrayData = []

    result = await page.evaluate(() => {
      let r = [{
        date: '',
        initialHour: '',
        finalHour: '',
        districts: [''],
        streets: [''],
        reasons: '',
        affectedClients: 0
      }]

      const iframe = document.getElementById('desligamentos')

      if (!!iframe) {
        const content = iframe['contentDocument']
        const iframeBody = content.children[0].children[1]
        let contentBody = iframeBody.children[1]

        const ul = contentBody.getElementsByClassName('ui-datalist-data')[0]
  
        if (!!ul) {
          const items = ul.children
  
          for (let index = 0; index < items.length; index++) {
            const li = items[index]
            const liItems = li.children
  
            // const date = liItems[0].textContent.split(' - ')[0]
            const date = String(liItems[0].textContent).split(' - ')[0]
            const hours = String(liItems[2].textContent)
  
            const initialHour = hours.split(' - ')[0]
            const finalHour = hours.split(' - ')[1]
  
            const table = liItems[3]
            const tbody = table.children[0]
  
            const districtsField = tbody.children[2]
            const districts = String(districtsField.children[1].textContent).split(';')
  
            let streets = ['']
            const streetsField = tbody.children[3]
            const streetsli = streetsField.children[1].getElementsByClassName('ui-datalist-item itens-listas')
            for (let index = 0; index < streetsli.length; index++) {
              const streetLi = streetsli[index]
  
              streets.push(String(streetLi.textContent))
            }
  
            let reasons = ''
            const reasonField = tbody.children[4]
            const reasonsLi = reasonField.getElementsByClassName('ui-datalist-item itens-listas')
            for (let index = 0; index < reasonsLi.length; index++) {
              const reasonLi = reasonsLi[index]
              
              if (index === 0) {
                reasons += `${String(reasonLi.textContent)}`
              } else {
                reasons += `; ${String(reasonLi.textContent)}`
              }
            }
  
            const affectedClientsField = tbody.children[5]
            const affectedClients = Number(affectedClientsField.children[1].textContent)
  
            r.push({
              date,
              initialHour,
              finalHour,
              districts,
              streets,
              reasons,
              affectedClients
            })
          }
        }
      }


      return r
    })

    // inside of evaluate function is a exemple null element to typescript type check
    return result.slice(1, result.length)
  }

  /**
   * format date to 'month/day/year'
   * @param  {String} hour have format 'day/month/year hour:minutes'
   */
   private formatDateToGetDuration = (date: string, hour: string) => {
    const dateSplitted = date.split('/')
    const dateFormatted = `${dateSplitted[1]}-${dateSplitted[0]}-${dateSplitted[2]}`

    return `${dateFormatted} ${hour}`
  }

  /**
   * get difference in format 'hour:minutes' to initialHour and finalHour
   * @param  {String} initialHour have format 'month/day/year hour:minutes'
   * @param  {String} finalHour have format 'month/day/year hour:minutes'
   */
  private getDuration = (initialHour: string, finalHour: string) => {
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
  private getDurationInSeconds = (initialHour: string, finalHour: string) => {
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
  private getStatus = (finalSeconds: number, finalMaintenence: number) => {
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

  private formattDataToUpdate = (data: EquatorialDataInterface, state: string, city: string) => {
    const actualDate = moment().format('DD/MM/YYYY HH:mm')
    
    let duration = this.getDurationInSeconds(
      this.formatDateToGetDuration(data.initialDate, data.initialHour),
      this.formatDateToGetDuration(data.finalDate, data.finalHour)
    )

    let finalSeconds = this.getDurationInSeconds(
      this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
      this.formatDateToGetDuration(data.initialDate, data.initialHour)
    )

    let finalMaintenance = this.getDurationInSeconds(
      this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
      this.formatDateToGetDuration(data.finalDate, data.finalHour)
    )

    const status = this.getStatus(finalSeconds, finalMaintenance)

    const formattedData: EquatorialFormattedData = {
      date: data.initialDate,
      
      state,
      city,
      district: data.district,
      street: data.street,
      
      status,

      initialHour: data.initialHour,
      finalHour: data.finalHour,

      duration,
      finalSeconds,
      finalMaintenance,

      reason: '',
      affectedClients: data.afectedClients
    }

    return formattedData
  }

  private formatRSDataToUpdate = (data: EquatorialDataRSInterface, state: string, city: string, district: string, street: string) => {
    const actualDate = moment().format('DD/MM/YYYY HH:mm')

    let duration = this.getDurationInSeconds(
      this.formatDateToGetDuration(data.date, data.initialHour),
      this.formatDateToGetDuration(data.date, data.finalHour)
    )

    let finalSeconds = this.getDurationInSeconds(
      this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
      this.formatDateToGetDuration(data.date, data.initialHour)
    )

    let finalMaintenance = this.getDurationInSeconds(
      this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
      this.formatDateToGetDuration(data.date, data.finalHour)
    )

    const status = this.getStatus(finalSeconds, finalMaintenance)

    const formattedData: EquatorialFormattedData = {
      date: data. date,
      
      state,
      city,
      district,
      street,

      status,

      initialHour: data.initialHour,
      finalHour: data.finalHour,

      duration,
      finalSeconds,
      finalMaintenance,

      reason: data.reasons,
      affectedClients: data.affectedClients
    }
    return formattedData
  }

  private updateData = async (data: EquatorialFormattedArrayData) => {
    for (let index = 0; index < data.length; index++) {
      const item = data[index]

      const equatorialData = await equatorialDataRepository.get({
        date: item.date,

        state: item.state,
        city: item.city,
        district: item.district,
        street: item.street
      })

      if (!equatorialData) {
        await equatorialDataRepository.create({
          date: item.date,
  
          state: item.state,
          city: item.city,
          district: item.district,
          street: item.street,
  
          status: item.status,
  
          initial_hour: item.initialHour,
          final_hour: item.finalHour,
  
          duration: item.duration,
          final_seconds: item.finalSeconds,
          final_maintenance: item.finalMaintenance,
  
          reason: item.reason,
          affected_clients: item.affectedClients
        })
      }
    }
  }

  // get data and create this in database
  public get = async (browser: puppeteer.Browser, state: string, city: string) => {
    const url = this.makeURL(state)

    const pages = await browser.pages()
    pages[0].close()

    const page = await this.newPage(browser)
    await page.goto(url, { waitUntil: 'load' })
      .catch(error => {})

    let formattedArrayData: EquatorialFormattedArrayData = []

    if (state !== 'rio grande do sul') {
      await this.setCity(page, city)
      const data = await this.getData(page)
  
      for (let index = 0; index < data.length; index++) {
        const dataItem = data[index]
        
        const formattedData = this.formattDataToUpdate(dataItem, state, city)
        formattedArrayData.push(formattedData)
      }
    } else {
      await this.setCityToRs(page, city)
      const data = await this.getDataToRs(page)

      data.forEach((dataItem) => {

        dataItem.districts.forEach((district) => {

          dataItem.streets.forEach(street => {
            const formattedData = this.formatRSDataToUpdate(dataItem, state, city, district, street)

            if (formattedData.street !== '') {
              formattedArrayData.push(formattedData)
            }
          })

        })
      })
    }

    page.close()
      .catch(error => {})

    this.updateData(formattedArrayData)
  }

  public updateTime = async (state: string, city: string) => {
    const convertHour = Number(process.env.CONVERT_TO_TIMEZONE)

    const equatorialData = await equatorialDataRepository.index({
      state,
      city
    })

    for (let index = 0; index < equatorialData.length; index++) {
      const data = equatorialData[index]
      
      const actualDate = moment().subtract(convertHour, 'hours').format('DD/MM/YYYY HH:mm')

      let finalSeconds = this.getDurationInSeconds(
        this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
        this.formatDateToGetDuration(data.date, data.initial_hour)
      )
      let finalMaintenance = this.getDurationInSeconds(
        this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
        this.formatDateToGetDuration(data.date, data.final_hour)
      )

      if (finalSeconds < 0) {
        finalSeconds = 0
      }

      if (finalMaintenance < 0) {
        finalMaintenance = 0
      }

      const status = this.getStatus(finalSeconds, finalMaintenance)

      await equatorialDataRepository.update({
        identifiers: { id: data.id },
        payload: {
          final_maintenance: finalMaintenance,
          final_seconds: finalSeconds,
          status
        }
      })
    }
  }

  public runRoutine = async (browser: puppeteer.Browser, state: string, city: string) => {
    await this.get(browser, String(this.formatState(state)), city)
  }

  public updateManually = async (req: Request, res: Response) => {
    const { state, city } = req.params
    
    const browser = await this.runBrowser()

    await this.get(browser, String(this.formatState(state)), city)

    await this.closeBrowser(browser)

    return res.status(200).json({
      message: 'ok'
    })
  }
}