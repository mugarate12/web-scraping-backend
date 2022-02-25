import { Request, Response } from 'express'
import puppeteer from 'puppeteer'

export default class EnelController {
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
      headless: false, 
      args: minimal_args,
      slowMo: 200
      // userDataDir: false
    })
    
    return browser
  }

  public closeBrowser = async (browser: puppeteer.Browser) => {
    await browser.close()
  }

  private newPage = async (browser: puppeteer.Browser) => {
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.setDefaultNavigationTimeout(0)

    return page
  }
  
  private getStatesData = async (page: puppeteer.Page) => {
    const result = await page.evaluate(() => {
      const statesUl = document.getElementsByClassName('selectboxit-options selectboxit-list')[0]
      const statesUlChildren = statesUl.children
      const statesUlChildrenKeys = Object.keys(statesUlChildren)

      return statesUlChildrenKeys.slice(1, statesUlChildrenKeys.length - 1).map((_, index) => {
        const valueIndex = index + 1

        // tag <a></a> inside a children to li of ul 
        const a = statesUlChildren[valueIndex].getElementsByClassName('selectboxit-option-anchor')[0]
        const state = String(a.textContent)

        return state
      })
    })

    return result
  }

  public getStates = async () => {
    const browser = await this.runBrowser()
    const page = await this.newPage(browser)

    await page.goto('https://www.enel.com.br/pt-saopaulo/desligamento-programado.html')

    const arrayOfStates = await this.getStatesData(page)

    await this.closeBrowser(browser)
    return arrayOfStates
  }

  public test = async(req: Request, res: Response) => {
    const states = await this.getStates()

    return res.status(200).json({
      states
    })
  }
}