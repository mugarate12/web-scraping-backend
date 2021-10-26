import puppeteer from 'puppeteer'

export interface pageInstanceInterface {
  serviceName: string,
  pageInstance: puppeteer.Page
}