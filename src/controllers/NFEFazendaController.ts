import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import fs from 'fs'
import dotenv from 'dotenv'

import {
  nfseFazendaRepository
} from './../repositories'

dotenv.config()

interface dataInterface {
  Autorizador: string,

  'update_time': string,

  'Autorização': number,
  'Retorno Autorização': number,
  'Inutilização': number,
  'Consulta Protocolo': number,
  'Status Serviço': number,
  'Tempo Médio': string,
  'Consulta Cadastro': number,
  'Recepção Evento': number
}

type dataArrayInterface = Array<dataInterface>

export default class NFSEFazendaController {
  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
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

  // valores
  // verde = 1
  // vermelho = 2
  // amarelo = 3
  // nulo = 4
  private getData = async (page: puppeteer.Page) => {
    let result: dataArrayInterface = []
    
    result = await page.evaluate(() => {
      function validateSRC(element) {
        let yellow = 'bola_amarela'
        let green = 'bola_verde'
        let red = 'bola_vermelho'

        if (!element) {
          return 4
        } else if (element.includes(red)) {
          return 2
        } else if (element.includes(yellow)) {
          return 3
        } else {
          return 1
        }
      }

      // let table = document.getElementById('ctl00_ContentPlaceHolder1_gdvDisponibilidade2')
      let table = document.getElementById('ctl00_ContentPlaceHolder1_gdvDisponibilidade2')

      if (!!table) {
        let tableChildren = table.children

        let caption = table.children[0]
        // ex: ' - Última Verificação: 17/02/2022 10:23:00 - WebServices Versão 4.00'
        let time = String(caption.children[1].textContent).split(' ')
        let updateTime = `${time[4]} ${time[5]}`

        let tableBody = table.children[1]
        const tableBodyChildren = tableBody.children

        return Object.keys(tableBodyChildren).slice(0, Object.keys(tableBodyChildren).length - 1).map((_, index) => {
          let indexIgnoreTableColumnsDescription = index + 1

          let tableTr = tableBodyChildren.item(indexIgnoreTableColumnsDescription)
          if (!!tableTr) {
            let tableTrChildren = tableTr.children

            // nove elementos
            let autorizador = tableTrChildren.item(0)?.textContent
            // if undefined reference to td is empty
            let autorizacao = tableTrChildren.item(1)?.children[0]['src']
            let retornoAutorizacao = tableTrChildren.item(2)?.children[0]['src']
            let inutilizacao = tableTrChildren.item(3)?.children[0]['src']
            let consultaProtocolo = tableTrChildren.item(4)?.children[0]['src']
            let statusServico = tableTrChildren.item(5)?.children[0]['src']
            //  tempo médio
            // if return '-' reference to field is empty
            let tempoMedio = tableTrChildren.item(6)?.textContent
            
            let consultaCadastro = tableTrChildren.item(7)?.children[0]['src']
            let recepcaoEvento = tableTrChildren.item(8)?.children[0]['src']
            
            return {
              Autorizador: String(autorizador),

              update_time: updateTime,

              'Autorização': validateSRC(autorizacao),
              'Retorno Autorização': validateSRC(retornoAutorizacao),
              'Inutilização': validateSRC(inutilizacao),
              'Consulta Protocolo': validateSRC(consultaProtocolo),
              'Status Serviço': validateSRC(statusServico),
              'Tempo Médio': String(tempoMedio),
              'Consulta Cadastro': validateSRC(consultaCadastro),
              'Recepção Evento': validateSRC(recepcaoEvento)
            }
          } else {
            return {
              Autorizador: '',

              update_time: '',

              'Autorização': 0,
              'Retorno Autorização': 0,
              'Inutilização': 0,
              'Consulta Protocolo': 0,
              'Status Serviço': 0,
              'Tempo Médio': '',
              'Consulta Cadastro': 0,
              'Recepção Evento': 0
            }
          }
        })
      } else {
        return []
      }
    })

    result = result.filter(r => r.Autorizador.length > 0)

    return result
  }
  
  private updateData = async (dataArray: dataArrayInterface) => {
    for (let index = 0; index < dataArray.length; index++) {
      const data = dataArray[index]

      await nfseFazendaRepository.create({
        autorizador: data.Autorizador,

        update_time: data.update_time,
        
        autorizacao: data.Autorização,
        retorno_autorizacao: data['Retorno Autorização'],
        inutilizacao: data.Inutilização,
        consulta_protocolo: data['Consulta Protocolo'],
        status_servico: data['Status Serviço'],
        tempo_medio: data['Tempo Médio'],
        consulta_cadastro: data['Consulta Cadastro'],
        recepcao_evento: data['Recepção Evento']
      })
        .catch(async () => {
          await nfseFazendaRepository.update({
            identifiers: { autorizador: data.Autorizador },
            payload: {
              update_time: data.update_time,
        
              autorizacao: data.Autorização,
              retorno_autorizacao: data['Retorno Autorização'],
              inutilizacao: data.Inutilização,
              consulta_protocolo: data['Consulta Protocolo'],
              status_servico: data['Status Serviço'],
              tempo_medio: data['Tempo Médio'],
              consulta_cadastro: data['Consulta Cadastro'],
              recepcao_evento: data['Recepção Evento']
            }
          })
            .catch(() => {})
        })
    }
  }

  private get = async () => {
    const url = 'https://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx'

    const browser = await this.runBrowser()
    const page = await this.newPage(browser)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
      .catch(error => {})

    const dataArray = await this.getData(page)
    await this.updateData(dataArray)

    await this.closeBrowser(browser)
  }

  public runRoutine = async () => {
    await this.get()
  }

  public test = async (req: Request, res: Response) => {
    await this.get()

    return res.status(200).json({})
  }
}