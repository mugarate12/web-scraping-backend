import { Request, Response } from 'express'
import dotenv from 'dotenv'
import path from 'path'

import fs from 'fs'
import readline from 'readline'
const { google } = require('googleapis')

dotenv.config()

export default class ZabbixController {
  private TOKEN_PATH = 'token.json'
  private SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

  private worksheetID = ''

  private rows: Array<Array<string>> = []

  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  // is here where receive worksheet ID
  private listMajors = async (auth) => {
    const sheets = google.sheets({version: 'v4', auth})
    
    sheets.spreadsheets.values.get({
      spreadsheetId: this.worksheetID,
      range: 'A2:F',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err)

      const rows = res.data.values
      if (rows.length) {
        this.rows = rows
        // rows.map((row) => {
        //   console.log(row)
        //   console.log(`${row[0]}, ${row[4]}`)
        // })
      } else {
        console.log('No data found.')
      }
  });
  }

  private getNewToken = (oAuth2Client, callback) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    })

    console.log('Authorize this app by visiting this url:', authUrl)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token', err)

        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', this.TOKEN_PATH)
        })

        callback(oAuth2Client)
      })
    })
  }

  private authorize = (credentials, callback) => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(this.TOKEN_PATH, (err, token) => {
      if (err) return this.getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(String(token)));
      callback(oAuth2Client);
    });
  }

  public google = async () => { 
    // 4/1AX4XfWjlVT73onaruOrEmCqRi1mIcllvanHfN6OeHK8XySe5PpiWfr8qZNo
    let credentialsPath  = path.resolve(__dirname, '..', '..', 'testAuthIDGoogle.json')

    if (process.env.NODE_ENV === 'production') {
      credentialsPath  = path.resolve(__dirname, '..', '..', '..', 'testAuthIDGoogle.json')
    }

    // this.TOKEN_PATH = credentialsPath

    fs.readFile(credentialsPath, (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.

      const a = this.authorize(JSON.parse(String(content)), this.listMajors);
    })
  }
  
  public getWorksheetRowsData = async (req: Request, res: Response) => {
    const { worksheetID } = req.params
    // const worksheetLink = 'https://docs.google.com/spreadsheets/d/1gy-tg3lNgEVJtj_UTVJ5x_6-3PynpZaA3dL8MftGFDA/edit?usp=sharing'
    // const worksheetID = '1gy-tg3lNgEVJtj_UTVJ5x_6-3PynpZaA3dL8MftGFDA'

    this.worksheetID = worksheetID

    await this.google()
    await this.sleep(10)
    
    // await this.lib()
    const data = this.rows

    return res.status(200).json({
      data: data
    })
  }
}