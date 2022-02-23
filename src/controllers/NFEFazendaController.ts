import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import fs from 'fs'
import dotenv from 'dotenv'

import {
  nfeFazendaPermissionsRepository,
  nfseFazendaRepository
} from './../repositories'

import { NFSEFazendaInterface } from './../repositories/NFSEFazendaRepository'

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

interface permissonInterface {
  nfe_fazenda_FK: number,
  client_FK: number
}

type dataArrayInterface = Array<dataInterface>

type permissionsInterface = Array<permissonInterface>

interface permissionsBodyInterface {
  permissions: permissionsInterface
}

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
  // amarelo = 2
  // vermelho = 3
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
          return 3
        } else if (element.includes(yellow)) {
          return 2
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

  public addPermissions = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    const { permissions } = req.body as permissionsBodyInterface
   
    for (let index = 0; index < permissions.length; index++) {
      const permission = permissions[index];
      
      await nfeFazendaPermissionsRepository.create({
        nfe_fazenda_FK: permission.nfe_fazenda_FK,
        client_FK: permission.client_FK
      })
        .catch(() => {})
    }

    return res.status(200).json({

    })
  }
 
  public removePermissions = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    const { permissions } = req.body as permissionsBodyInterface

    for (let index = 0; index < permissions.length; index++) {
      const permission = permissions[index];
      
      await nfeFazendaPermissionsRepository.delete({
        nfe_fazenda_FK: permission.nfe_fazenda_FK,
        client_FK: permission.client_FK
      })
        .catch(() => {})
    }

    return res.status(200).json({
      
    })
  }

  public getInformations = async (req: Request, res: Response) => {
    const data = await nfseFazendaRepository.index({})

    return res.status(200).json({
      data
    })
  }

  private getServicesOfUserHaveAccess = async (userID: number) => {
    const permissions = await nfeFazendaPermissionsRepository.index({ client_FK: userID })
    const ids = permissions.map(permission => {
      return permission.nfe_fazenda_FK
    })

    return ids
  }

  // status is 1 if not incidents
  // status is 2 if have incidents
  private countIncidents = (data: Array<NFSEFazendaInterface>) => {
    const incidents: Array<{
      autorizador: string,
      status: number  
    }> = []

    data.forEach(autorizador => {
      const haveIncidentiInAutorizacao = autorizador.autorizacao !== 1 && autorizador.autorizacao !== 4
      const haveIncidentiInRetornoAutorizacao = autorizador.retorno_autorizacao !== 1 && autorizador.retorno_autorizacao !== 4
      const haveIncidentiInInutilizacao = autorizador.inutilizacao !== 1 && autorizador.inutilizacao !== 4
      const haveIncidentiInConsultaProtocolo = autorizador.consulta_protocolo !== 1 && autorizador.consulta_protocolo !== 4
      const haveIncidentiInStatusServico = autorizador.status_servico !== 1 && autorizador.status_servico !== 4
      const haveIncidentiInConsultaCadastro = autorizador.consulta_cadastro !== 1 && autorizador.consulta_cadastro !== 4
      const haveIncidentiInRecepcaoEvento = autorizador.recepcao_evento !== 1 && autorizador.recepcao_evento !== 4

      if (haveIncidentiInAutorizacao || haveIncidentiInRetornoAutorizacao || haveIncidentiInInutilizacao || haveIncidentiInConsultaProtocolo || haveIncidentiInStatusServico || haveIncidentiInConsultaCadastro || haveIncidentiInRecepcaoEvento) {
        incidents.push({
          autorizador: autorizador.autorizador,
          status: 2
        })
      } else {
        incidents.push({
          autorizador: autorizador.autorizador,
          status: 1
        })
      }
    })

    return incidents
  }

  // valores
  // verde = 1
  // amarelo = 2
  // vermelho = 3
  // nulo = 4
  private statusByProperty = (property: number) => {
    const status = {
      Verde: 0,
      Amarelo: 0,
      Vermelho: 0,
      Nulo: 0
    }

    if (property === 1) {
      status.Verde = 1
    } else if (property === 2) {
      status.Amarelo = 1
    } else if (property === 3) {
      status.Vermelho = 1
    } else {
      status.Nulo = 1
    }

    return status
  }

  private countStatus = (data: Array<NFSEFazendaInterface>) => {
    const status = {
      Verde: 0,
      Amarelo: 0,
      Vermelho: 0,
      Nulo: 0
    }

    data.forEach(autorizador => {
      const autorizacao = this.statusByProperty(autorizador.autorizacao)
      const retorno_autorizacao = this.statusByProperty(autorizador.retorno_autorizacao)
      const inutilizacao = this.statusByProperty(autorizador.inutilizacao)
      const consulta_protocolo = this.statusByProperty(autorizador.consulta_protocolo)
      const status_servico = this.statusByProperty(autorizador.status_servico)
      const consulta_cadastro = this.statusByProperty(autorizador.consulta_cadastro)
      const recepcao_evento = this.statusByProperty(autorizador.recepcao_evento)
     
      status.Verde += autorizacao.Verde 
      status.Verde += retorno_autorizacao.Verde 
      status.Verde += inutilizacao.Verde 
      status.Verde += consulta_protocolo.Verde 
      status.Verde += status_servico.Verde 
      status.Verde += consulta_cadastro.Verde 
      status.Verde += recepcao_evento.Verde 
      
      status.Vermelho += autorizacao.Vermelho 
      status.Vermelho += retorno_autorizacao.Vermelho 
      status.Vermelho += inutilizacao.Vermelho 
      status.Vermelho += consulta_protocolo.Vermelho 
      status.Vermelho += status_servico.Vermelho 
      status.Vermelho += consulta_cadastro.Vermelho 
      status.Vermelho += recepcao_evento.Vermelho 
      
      status.Amarelo += autorizacao.Amarelo 
      status.Amarelo += retorno_autorizacao.Amarelo 
      status.Amarelo += inutilizacao.Amarelo 
      status.Amarelo += consulta_protocolo.Amarelo 
      status.Amarelo += status_servico.Amarelo 
      status.Amarelo += consulta_cadastro.Amarelo 
      status.Amarelo += recepcao_evento.Amarelo 
      
      status.Nulo += autorizacao.Nulo 
      status.Nulo += retorno_autorizacao.Nulo 
      status.Nulo += inutilizacao.Nulo 
      status.Nulo += consulta_protocolo.Nulo 
      status.Nulo += status_servico.Nulo 
      status.Nulo += consulta_cadastro.Nulo 
      status.Nulo += recepcao_evento.Nulo 
    })

    return status
  }

  public sendJson = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))

    const ids = await this.getServicesOfUserHaveAccess(userID)
    let data = await nfseFazendaRepository.index({
      ids
    })

    if (ids.length === 0) {
      data = []
    }

    const incidents = this.countIncidents(data)
    const status = this.countStatus(data)

    return res.status(200).json({
      data,
      incidents,
      status
    })
  }

  public test = async (req: Request, res: Response) => {
    await this.get()

    return res.status(200).json({})
  }
}