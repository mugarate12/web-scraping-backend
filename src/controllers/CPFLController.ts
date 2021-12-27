import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import fs from 'fs'
import moment from 'moment'

import {
  cpflDataRepository
} from './../repositories'

type citiesInterface = Array<{
  value: string;
  label: string;
}>

interface CPFLDataInterface {
  date: string,
  hour: string,
  contents: Array<{
    bairro: string,
    ruas: Array<string>
  }>
}

interface CPFLFormattedDataInterface {
  date: string,
  contents: Array<{
    bairro: string,
    ruas: Array<string>
  }>,
  initialHour: string,
  finalHour: string
}

interface updateCPFLDataInterface {
  data: CPFLFormattedDataInterface,
  state: string,
  city: string
}

interface updateCPFLTimeInterface {
  state: string,
  city: string
}

interface getInterface {
  state: string,
  city: string
}

export default class CPFLController {
  private states = ['sp']

  private SPcities: citiesInterface = [{'value': '203', 'label': 'Aguas De Lindoia'}, {'value': '309', 'label': 'Aguas De Sao Pedro'}, {'value': '78', 'label': 'Agudos'}, {'value': '280', 'label': 'Altair'}, {'value': '120', 'label': 'Altinopolis'}, {'value': '520', 'label': 'Alto Alegre'}, {'value': '212', 'label': 'Alvaro De Carvalho'}, {'value': '10', 'label': 'Alvinlandia'}, {'value': '535', 'label': 'Americana'}, {'value': '337', 'label': 'Americo Brasiliense'}, {'value': '424', 'label': 'Amparo'}, {'value': '144', 'label': 'Analandia'}, {'value': '109', 'label': 'Aracatuba'}, {'value': '240', 'label': 'Aramina'}, {'value': '287', 'label': 'Araraquara'}, {'value': '505', 'label': 'Arealva'}, {'value': '339', 'label': 'Areiopolis'}, {'value': '234', 'label': 'Ariranha'}, {'value': '551', 'label': 'Avai'}, {'value': '23', 'label': 'Avanhandava'}, {'value': '369', 'label': 'Bady Bassitt'}, {'value': '402', 'label': 'Balbinos'}, {'value': '25', 'label': 'Balsamo'}, {'value': '108', 'label': 'Barbosa'}, {'value': '266', 'label': 'Bariri'}, {'value': '482', 'label': 'Barra Bonita'}, {'value': '453', 'label': 'Barretos'}, {'value': '361', 'label': 'Barrinha'}, {'value': '127', 'label': 'Batatais'}, {'value': '484', 'label': 'Bauru'}, {'value': '267', 'label': 'Bebedouro'}, {'value': '257', 'label': 'Bento De Abreu'}, {'value': '543', 'label': 'Bilac'}, {'value': '97', 'label': 'Birigui'}, {'value': '326', 'label': 'Boa Esperanca Do Sul'}, {'value': '386', 'label': 'Bocaina'}, {'value': '492', 'label': 'Bofete'}, {'value': '304', 'label': 'Boraceia'}, {'value': '111', 'label': 'Borebi'}, {'value': '293', 'label': 'Botucatu'}, {'value': '256', 'label': 'Brauna'}, {'value': '22', 'label': 'Brejo Alegre'}, {'value': '528', 'label': 'Brodowski'}, {'value': '341', 'label': 'Brotas'}, {'value': '474', 'label': 'Buritizal'}, {'value': '405', 'label': 'Cabralia Paulista'}, {'value': '392', 'label': 'Cafelandia'}, {'value': '165', 'label': 'Cajobi'}, {'value': '302', 'label': 'Cajuru'}, {'value': '58', 'label': 'Campinas'}, {'value': '133', 'label': 'Campos Novos Paulista'}, {'value': '455', 'label': 'Candido Rodrigues'}, {'value': '69', 'label': 'Capivari'}, {'value': '65', 'label': 'Cassia Dos Coqueiros'}, {'value': '389', 'label': 'Cedral'}, {'value': '425', 'label': 'Charqueada'}, {'value': '1091', 'label': 'Claraval'}, {'value': '355', 'label': 'Clementina'}, {'value': '319', 'label': 'Colina'}, {'value': '511', 'label': 'Colombia'}, {'value': '233', 'label': 'Coroados'}, {'value': '59', 'label': 'Cosmopolis'}, {'value': '199', 'label': 'Cravinhos'}, {'value': '330', 'label': 'Cristais Paulista'}, {'value': '564', 'label': 'Descalvado'}, {'value': '147', 'label': 'Dobrada'}, {'value': '445', 'label': 'Dois Corregos'}, {'value': '163', 'label': 'Dourado'}, {'value': '154', 'label': 'Duartina'}, {'value': '56', 'label': 'Dumont'}, {'value': '143', 'label': 'Elias Fausto'}, {'value': '106', 'label': 'Embauba'}, {'value': '119', 'label': 'Espirito Santo Do Pinhal'}, {'value': '420', 'label': 'Fernando Prestes'}, {'value': '414', 'label': 'Fernao'}, {'value': '253', 'label': 'Franca'}, {'value': '284', 'label': 'Gabriel Monteiro'}, {'value': '4', 'label': 'Galia'}, {'value': '221', 'label': 'Garca'}, {'value': '509', 'label': 'Gaviao Peixoto'}, {'value': '308', 'label': 'Getulina'}, {'value': '241', 'label': 'Glicerio'}, {'value': '268', 'label': 'Guaicara'}, {'value': '427', 'label': 'Guaimbe'}, {'value': '15', 'label': 'Guaira'}, {'value': '85', 'label': 'Guapiacu'}, {'value': '170', 'label': 'Guara'}, {'value': '408', 'label': 'Guaraci'}, {'value': '394', 'label': 'Guaranta'}, {'value': '262', 'label': 'Guararapes'}, {'value': '464', 'label': 'Guariba'}, {'value': '382', 'label': 'Guatapara'}, {'value': '409', 'label': 'Herculandia'}, {'value': '534', 'label': 'Hortolandia'}, {'value': '90', 'label': 'Iacanga'}, {'value': '510', 'label': 'Ibate'}, {'value': '242', 'label': 'Ibira'}, {'value': '406', 'label': 'Ibitinga'}, {'value': '158', 'label': 'Icem'}, {'value': '504', 'label': 'Igaracu Do Tiete'}, {'value': '148', 'label': 'Igarapava'}, {'value': '694', 'label': 'IHM'}, {'value': '411', 'label': 'Ipigua'}, {'value': '275', 'label': 'Ipua'}, {'value': '3', 'label': 'Itaju'}, {'value': '271', 'label': 'Itapira'}, {'value': '230', 'label': 'Itapolis'}, {'value': '131', 'label': 'Itapui'}, {'value': '67', 'label': 'Itatiba'}, {'value': '82', 'label': 'Itatinga'}, {'value': '128', 'label': 'Itirapua'}, {'value': '494', 'label': 'Ituverava'}, {'value': '76', 'label': 'Jaborandi'}, {'value': '47', 'label': 'Jaboticabal'}, {'value': '94', 'label': 'Jaci'}, {'value': '362', 'label': 'Jardinopolis'}, {'value': '223', 'label': 'Jau'}, {'value': '225', 'label': 'Jeriquara'}, {'value': '62', 'label': 'Jose Bonifacio'}, {'value': '105', 'label': 'Julio Mesquita'}, {'value': '347', 'label': 'Lencois Paulista'}, {'value': '245', 'label': 'Lindoia'}, {'value': '452', 'label': 'Lins'}, {'value': '70', 'label': 'Lucianopolis'}, {'value': '430', 'label': 'Luis Antonio'}, {'value': '398', 'label': 'Luiziania'}, {'value': '426', 'label': 'Lupercio'}, {'value': '114', 'label': 'Macatuba'}, {'value': '138', 'label': 'Marilia'}, {'value': '310', 'label': 'Matao'}, {'value': '17', 'label': 'Miguelopolis'}, {'value': '542', 'label': 'Mineiros Do Tiete'}, {'value': '328', 'label': 'Mirassol'}, {'value': '377', 'label': 'Mirassolandia'}, {'value': '456', 'label': 'Mombuca'}, {'value': '376', 'label': 'Monte Alegre Do Sul'}, {'value': '454', 'label': 'Monte Alto'}, {'value': '558', 'label': 'Monte Aprazivel'}, {'value': '299', 'label': 'Monte Azul Paulista'}, {'value': '375', 'label': 'Monte Mor'}, {'value': '479', 'label': 'Morro Agudo'}, {'value': '517', 'label': 'Morungaba'}, {'value': '335', 'label': 'Motuca'}, {'value': '541', 'label': 'Neves Paulista'}, {'value': '72', 'label': 'Nova Europa'}, {'value': '99', 'label': 'Nova Granada'}, {'value': '298', 'label': 'Nova Odessa'}, {'value': '161', 'label': 'Nuporanga'}, {'value': '545', 'label': 'Ocaucu'}, {'value': '49', 'label': 'Olimpia'}, {'value': '503', 'label': 'Onda Verde'}, {'value': '87', 'label': 'Oriente'}, {'value': '318', 'label': 'Orlandia'}, {'value': '334', 'label': 'Palestina'}, {'value': '498', 'label': 'Palmares Paulista'}, {'value': '448', 'label': 'Paraiso'}, {'value': '44', 'label': 'Pardinho'}, {'value': '404', 'label': 'Patrocinio Paulista'}, {'value': '116', 'label': 'Paulinia'}, {'value': '192', 'label': 'Paulistania'}, {'value': '466', 'label': 'Pederneiras'}, {'value': '259', 'label': 'Pedregulho'}, {'value': '418', 'label': 'Penapolis'}, {'value': '248', 'label': 'Piacatu'}, {'value': '31', 'label': 'Pindorama'}, {'value': '204', 'label': 'Piracicaba'}, {'value': '52', 'label': 'Pirajui'}, {'value': '270', 'label': 'Pirangi'}, {'value': '395', 'label': 'Piratininga'}, {'value': '100', 'label': 'Pitangueiras'}, {'value': '291', 'label': 'Poloni'}, {'value': '193', 'label': 'Pompeia'}, {'value': '447', 'label': 'Pongai'}, {'value': '401', 'label': 'Pontal'}, {'value': '372', 'label': 'Potirendaba'}, {'value': '368', 'label': 'Pradopolis'}, {'value': '206', 'label': 'Pratania'}, {'value': '399', 'label': 'Presidente Alves'}, {'value': '490', 'label': 'Promissao'}, {'value': '180', 'label': 'Queiroz'}, {'value': '469', 'label': 'Quintana'}, {'value': '45', 'label': 'Rafard'}, {'value': '433', 'label': 'Reginopolis'}, {'value': '50', 'label': 'Restinga'}, {'value': '396', 'label': 'Ribeirao Bonito'}, {'value': '64', 'label': 'Ribeirao Corrente'}, {'value': '516', 'label': 'Ribeirao Preto'}, {'value': '403', 'label': 'Rifaina'}, {'value': '53', 'label': 'Rincao'}, {'value': '276', 'label': 'Rio Das Pedras'}, {'value': '512', 'label': 'Rubiacea'}, {'value': '146', 'label': 'Sabino'}, {'value': '173', 'label': 'Sales Oliveira'}, {'value': '338', 'label': 'Saltinho'}, {'value': '329', 'label': 'Santa Adelia'}, {'value': '521', 'label': "Santa Barbara D'Oeste"}, {'value': '110', 'label': 'Santa Cruz Da Esperanca'}, {'value': '550', 'label': 'Santa Ernestina'}, {'value': '213', 'label': 'Santa Lucia'}, {'value': '216', 'label': 'Santa Maria Da Serra'}, {'value': '470', 'label': 'Santa Rosa De Viterbo'}, {'value': '157', 'label': 'Santo Antonio Da Alegria'}, {'value': '340', 'label': 'Santo Antonio Do Aracangua'}, {'value': '140', 'label': 'Santo Antonio Do Jardim'}, {'value': '261', 'label': 'Santopolis Do Aguapei'}, {'value': '202', 'label': 'Sao Carlos'}, {'value': '150', 'label': 'Sao Joaquim Da Barra'}, {'value': '460', 'label': 'Sao Jose Da Bela Vista'}, {'value': '168', 'label': 'Sao Jose Do Rio Preto'}, {'value': '523', 'label': 'Sao Manuel'}, {'value': '169', 'label': 'Sao Pedro'}, {'value': '461', 'label': 'Sao Simao'}, {'value': '145', 'label': 'Serra Azul'}, {'value': '265', 'label': 'Serra Negra'}, {'value': '529', 'label': 'Serrana'}, {'value': '289', 'label': 'Sertaozinho'}, {'value': '562', 'label': 'Severinia'}, {'value': '415', 'label': 'Socorro'}, {'value': '177', 'label': 'Sumare'}, {'value': '11', 'label': 'Tabatinga'}, {'value': '226', 'label': 'Taiacu'}, {'value': '467', 'label': 'Taiuva'}, {'value': '96', 'label': 'Tanabi'}, {'value': '531', 'label': 'Taquaral'}, {'value': '524', 'label': 'Taquaritinga'}, {'value': '135', 'label': 'Terra Roxa'}, {'value': '132', 'label': 'Torrinha'}, {'value': '73', 'label': 'Trabiju'}, {'value': '350', 'label': 'Ubarana'}, {'value': '182', 'label': 'Uchoa'}, {'value': '80', 'label': 'Uru'}, {'value': '434', 'label': 'Valinhos'}, {'value': '156', 'label': 'Valparaiso'}, {'value': '530', 'label': 'Vera Cruz - Sp'}, {'value': '323', 'label': 'Viradouro'}, {'value': '364', 'label': 'Vista Alegre Do Alto'}]

  private getStateNumber = (state: string) => {
    if (state === 'sp') {
      return 4
    }
  }

  private citiesToState = (stateNumber: number) => {
    let cities: citiesInterface = []

    if (stateNumber === 4) {
      // const cities: citiesInterface = [{'value': '203', 'label': 'Aguas De Lindoia'}, {'value': '309', 'label': 'Aguas De Sao Pedro'}, {'value': '78', 'label': 'Agudos'}, {'value': '280', 'label': 'Altair'}, {'value': '120', 'label': 'Altinopolis'}, {'value': '520', 'label': 'Alto Alegre'}, {'value': '212', 'label': 'Alvaro De Carvalho'}, {'value': '10', 'label': 'Alvinlandia'}, {'value': '535', 'label': 'Americana'}, {'value': '337', 'label': 'Americo Brasiliense'}, {'value': '424', 'label': 'Amparo'}, {'value': '144', 'label': 'Analandia'}, {'value': '109', 'label': 'Aracatuba'}, {'value': '240', 'label': 'Aramina'}, {'value': '287', 'label': 'Araraquara'}, {'value': '505', 'label': 'Arealva'}, {'value': '339', 'label': 'Areiopolis'}, {'value': '234', 'label': 'Ariranha'}, {'value': '551', 'label': 'Avai'}, {'value': '23', 'label': 'Avanhandava'}, {'value': '369', 'label': 'Bady Bassitt'}, {'value': '402', 'label': 'Balbinos'}, {'value': '25', 'label': 'Balsamo'}, {'value': '108', 'label': 'Barbosa'}, {'value': '266', 'label': 'Bariri'}, {'value': '482', 'label': 'Barra Bonita'}, {'value': '453', 'label': 'Barretos'}, {'value': '361', 'label': 'Barrinha'}, {'value': '127', 'label': 'Batatais'}, {'value': '484', 'label': 'Bauru'}, {'value': '267', 'label': 'Bebedouro'}, {'value': '257', 'label': 'Bento De Abreu'}, {'value': '543', 'label': 'Bilac'}, {'value': '97', 'label': 'Birigui'}, {'value': '326', 'label': 'Boa Esperanca Do Sul'}, {'value': '386', 'label': 'Bocaina'}, {'value': '492', 'label': 'Bofete'}, {'value': '304', 'label': 'Boraceia'}, {'value': '111', 'label': 'Borebi'}, {'value': '293', 'label': 'Botucatu'}, {'value': '256', 'label': 'Brauna'}, {'value': '22', 'label': 'Brejo Alegre'}, {'value': '528', 'label': 'Brodowski'}, {'value': '341', 'label': 'Brotas'}, {'value': '474', 'label': 'Buritizal'}, {'value': '405', 'label': 'Cabralia Paulista'}, {'value': '392', 'label': 'Cafelandia'}, {'value': '165', 'label': 'Cajobi'}, {'value': '302', 'label': 'Cajuru'}, {'value': '58', 'label': 'Campinas'}, {'value': '133', 'label': 'Campos Novos Paulista'}, {'value': '455', 'label': 'Candido Rodrigues'}, {'value': '69', 'label': 'Capivari'}, {'value': '65', 'label': 'Cassia Dos Coqueiros'}, {'value': '389', 'label': 'Cedral'}, {'value': '425', 'label': 'Charqueada'}, {'value': '1091', 'label': 'Claraval'}, {'value': '355', 'label': 'Clementina'}, {'value': '319', 'label': 'Colina'}, {'value': '511', 'label': 'Colombia'}, {'value': '233', 'label': 'Coroados'}, {'value': '59', 'label': 'Cosmopolis'}, {'value': '199', 'label': 'Cravinhos'}, {'value': '330', 'label': 'Cristais Paulista'}, {'value': '564', 'label': 'Descalvado'}, {'value': '147', 'label': 'Dobrada'}, {'value': '445', 'label': 'Dois Corregos'}, {'value': '163', 'label': 'Dourado'}, {'value': '154', 'label': 'Duartina'}, {'value': '56', 'label': 'Dumont'}, {'value': '143', 'label': 'Elias Fausto'}, {'value': '106', 'label': 'Embauba'}, {'value': '119', 'label': 'Espirito Santo Do Pinhal'}, {'value': '420', 'label': 'Fernando Prestes'}, {'value': '414', 'label': 'Fernao'}, {'value': '253', 'label': 'Franca'}, {'value': '284', 'label': 'Gabriel Monteiro'}, {'value': '4', 'label': 'Galia'}, {'value': '221', 'label': 'Garca'}, {'value': '509', 'label': 'Gaviao Peixoto'}, {'value': '308', 'label': 'Getulina'}, {'value': '241', 'label': 'Glicerio'}, {'value': '268', 'label': 'Guaicara'}, {'value': '427', 'label': 'Guaimbe'}, {'value': '15', 'label': 'Guaira'}, {'value': '85', 'label': 'Guapiacu'}, {'value': '170', 'label': 'Guara'}, {'value': '408', 'label': 'Guaraci'}, {'value': '394', 'label': 'Guaranta'}, {'value': '262', 'label': 'Guararapes'}, {'value': '464', 'label': 'Guariba'}, {'value': '382', 'label': 'Guatapara'}, {'value': '409', 'label': 'Herculandia'}, {'value': '534', 'label': 'Hortolandia'}, {'value': '90', 'label': 'Iacanga'}, {'value': '510', 'label': 'Ibate'}, {'value': '242', 'label': 'Ibira'}, {'value': '406', 'label': 'Ibitinga'}, {'value': '158', 'label': 'Icem'}, {'value': '504', 'label': 'Igaracu Do Tiete'}, {'value': '148', 'label': 'Igarapava'}, {'value': '694', 'label': 'IHM'}, {'value': '411', 'label': 'Ipigua'}, {'value': '275', 'label': 'Ipua'}, {'value': '3', 'label': 'Itaju'}, {'value': '271', 'label': 'Itapira'}, {'value': '230', 'label': 'Itapolis'}, {'value': '131', 'label': 'Itapui'}, {'value': '67', 'label': 'Itatiba'}, {'value': '82', 'label': 'Itatinga'}, {'value': '128', 'label': 'Itirapua'}, {'value': '494', 'label': 'Ituverava'}, {'value': '76', 'label': 'Jaborandi'}, {'value': '47', 'label': 'Jaboticabal'}, {'value': '94', 'label': 'Jaci'}, {'value': '362', 'label': 'Jardinopolis'}, {'value': '223', 'label': 'Jau'}, {'value': '225', 'label': 'Jeriquara'}, {'value': '62', 'label': 'Jose Bonifacio'}, {'value': '105', 'label': 'Julio Mesquita'}, {'value': '347', 'label': 'Lencois Paulista'}, {'value': '245', 'label': 'Lindoia'}, {'value': '452', 'label': 'Lins'}, {'value': '70', 'label': 'Lucianopolis'}, {'value': '430', 'label': 'Luis Antonio'}, {'value': '398', 'label': 'Luiziania'}, {'value': '426', 'label': 'Lupercio'}, {'value': '114', 'label': 'Macatuba'}, {'value': '138', 'label': 'Marilia'}, {'value': '310', 'label': 'Matao'}, {'value': '17', 'label': 'Miguelopolis'}, {'value': '542', 'label': 'Mineiros Do Tiete'}, {'value': '328', 'label': 'Mirassol'}, {'value': '377', 'label': 'Mirassolandia'}, {'value': '456', 'label': 'Mombuca'}, {'value': '376', 'label': 'Monte Alegre Do Sul'}, {'value': '454', 'label': 'Monte Alto'}, {'value': '558', 'label': 'Monte Aprazivel'}, {'value': '299', 'label': 'Monte Azul Paulista'}, {'value': '375', 'label': 'Monte Mor'}, {'value': '479', 'label': 'Morro Agudo'}, {'value': '517', 'label': 'Morungaba'}, {'value': '335', 'label': 'Motuca'}, {'value': '541', 'label': 'Neves Paulista'}, {'value': '72', 'label': 'Nova Europa'}, {'value': '99', 'label': 'Nova Granada'}, {'value': '298', 'label': 'Nova Odessa'}, {'value': '161', 'label': 'Nuporanga'}, {'value': '545', 'label': 'Ocaucu'}, {'value': '49', 'label': 'Olimpia'}, {'value': '503', 'label': 'Onda Verde'}, {'value': '87', 'label': 'Oriente'}, {'value': '318', 'label': 'Orlandia'}, {'value': '334', 'label': 'Palestina'}, {'value': '498', 'label': 'Palmares Paulista'}, {'value': '448', 'label': 'Paraiso'}, {'value': '44', 'label': 'Pardinho'}, {'value': '404', 'label': 'Patrocinio Paulista'}, {'value': '116', 'label': 'Paulinia'}, {'value': '192', 'label': 'Paulistania'}, {'value': '466', 'label': 'Pederneiras'}, {'value': '259', 'label': 'Pedregulho'}, {'value': '418', 'label': 'Penapolis'}, {'value': '248', 'label': 'Piacatu'}, {'value': '31', 'label': 'Pindorama'}, {'value': '204', 'label': 'Piracicaba'}, {'value': '52', 'label': 'Pirajui'}, {'value': '270', 'label': 'Pirangi'}, {'value': '395', 'label': 'Piratininga'}, {'value': '100', 'label': 'Pitangueiras'}, {'value': '291', 'label': 'Poloni'}, {'value': '193', 'label': 'Pompeia'}, {'value': '447', 'label': 'Pongai'}, {'value': '401', 'label': 'Pontal'}, {'value': '372', 'label': 'Potirendaba'}, {'value': '368', 'label': 'Pradopolis'}, {'value': '206', 'label': 'Pratania'}, {'value': '399', 'label': 'Presidente Alves'}, {'value': '490', 'label': 'Promissao'}, {'value': '180', 'label': 'Queiroz'}, {'value': '469', 'label': 'Quintana'}, {'value': '45', 'label': 'Rafard'}, {'value': '433', 'label': 'Reginopolis'}, {'value': '50', 'label': 'Restinga'}, {'value': '396', 'label': 'Ribeirao Bonito'}, {'value': '64', 'label': 'Ribeirao Corrente'}, {'value': '516', 'label': 'Ribeirao Preto'}, {'value': '403', 'label': 'Rifaina'}, {'value': '53', 'label': 'Rincao'}, {'value': '276', 'label': 'Rio Das Pedras'}, {'value': '512', 'label': 'Rubiacea'}, {'value': '146', 'label': 'Sabino'}, {'value': '173', 'label': 'Sales Oliveira'}, {'value': '338', 'label': 'Saltinho'}, {'value': '329', 'label': 'Santa Adelia'}, {'value': '521', 'label': "Santa Barbara D'Oeste"}, {'value': '110', 'label': 'Santa Cruz Da Esperanca'}, {'value': '550', 'label': 'Santa Ernestina'}, {'value': '213', 'label': 'Santa Lucia'}, {'value': '216', 'label': 'Santa Maria Da Serra'}, {'value': '470', 'label': 'Santa Rosa De Viterbo'}, {'value': '157', 'label': 'Santo Antonio Da Alegria'}, {'value': '340', 'label': 'Santo Antonio Do Aracangua'}, {'value': '140', 'label': 'Santo Antonio Do Jardim'}, {'value': '261', 'label': 'Santopolis Do Aguapei'}, {'value': '202', 'label': 'Sao Carlos'}, {'value': '150', 'label': 'Sao Joaquim Da Barra'}, {'value': '460', 'label': 'Sao Jose Da Bela Vista'}, {'value': '168', 'label': 'Sao Jose Do Rio Preto'}, {'value': '523', 'label': 'Sao Manuel'}, {'value': '169', 'label': 'Sao Pedro'}, {'value': '461', 'label': 'Sao Simao'}, {'value': '145', 'label': 'Serra Azul'}, {'value': '265', 'label': 'Serra Negra'}, {'value': '529', 'label': 'Serrana'}, {'value': '289', 'label': 'Sertaozinho'}, {'value': '562', 'label': 'Severinia'}, {'value': '415', 'label': 'Socorro'}, {'value': '177', 'label': 'Sumare'}, {'value': '11', 'label': 'Tabatinga'}, {'value': '226', 'label': 'Taiacu'}, {'value': '467', 'label': 'Taiuva'}, {'value': '96', 'label': 'Tanabi'}, {'value': '531', 'label': 'Taquaral'}, {'value': '524', 'label': 'Taquaritinga'}, {'value': '135', 'label': 'Terra Roxa'}, {'value': '132', 'label': 'Torrinha'}, {'value': '73', 'label': 'Trabiju'}, {'value': '350', 'label': 'Ubarana'}, {'value': '182', 'label': 'Uchoa'}, {'value': '80', 'label': 'Uru'}, {'value': '434', 'label': 'Valinhos'}, {'value': '156', 'label': 'Valparaiso'}, {'value': '530', 'label': 'Vera Cruz - Sp'}, {'value': '323', 'label': 'Viradouro'}, {'value': '364', 'label': 'Vista Alegre Do Alto'}]
      cities = this.SPcities
    }

    return cities
  }

  private getCityCode = (cities: citiesInterface, cityName: string) => {
    let code = ''

    cities.forEach((city) => {
      if (city.label === cityName) {
        code = city.value
      }
    })

    return code
  }

  private makeURL = (stateNumber: number) => {
    const url = `https://spir.cpfl.com.br/Publico/ConsultaDesligamentoProgramado/Visualizar/${stateNumber}`

    return url
  }

  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  private newPage = async (browser: puppeteer.Browser) => {
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.setDefaultNavigationTimeout(0)

    return page
  }

  private selectToCity = async (page: puppeteer.Page) => {
    await page.evaluate(() => {
      document.getElementById('card-tipo-consulta-localizacao')?.click()
    })

    await this.sleep(3)
  }

  private searchWithCity = async (page: puppeteer.Page, code: string) => {

    await page.evaluate((code) => {
      let select = document.getElementById('IdMunicipio')
      if (!!select) {
        select['value'] = code
      }

      let btn = document.getElementById('btn-pesquisar')
      if (!!btn) {
        btn.click()
      }
    }, code)

    await this.sleep(5)
  }

  private getData = async (page: puppeteer.Page) => {
    // let r: CPFLDataInterface = []
    let result: Array<CPFLDataInterface> = []

    result = await page.evaluate(() => {
      let r = [{}]
      let classes = document.getElementsByClassName('consulta__listagem__resultados__timeline')

      const results = classes[0].children
      const date = results[1].children[1].textContent

      const groupsData = results[2]

      const firstContent = results[2].children
      return Object.keys(firstContent).map((content, index) => {
        const hour = firstContent[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__horario')[0].textContent
        let districtsContents = ['']
        let streetsContents = ['']
        let contents = [{
          bairro: 'exemplo',
          ruas: ['']
        }]
        
        let data = {
          bairro: '',
          ruas: ['']
        }
        
        const districts = firstContent[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__content__item')
        Object.keys(districts).forEach((district, index) => {
          const content = districts[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__content__bairro__descricao')[0]
          const districtContent = content.children[1].textContent
          
          districtsContents.push(String(districtContent))
          data['bairro'] = String(districtContent)

          const streets = districts[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__content__bairro__content')[0].children
          Object.keys(streets).forEach((street, index) => {
            const streetContent = streets[index].children[1].textContent

            streetsContents.push(String(streetContent))
          })

          data['ruas'] = streetsContents.slice(1, streetsContents.length)
        })

        contents.push(data)
        data = {
          bairro: '',
          ruas: ['']
        }

        return {
          date: String(date),
          hour: String(hour),
          contents: contents.slice(1, contents.length)
        }
      })
    })
      .catch(error => {
        return []
      })
    
    return result
  }

  private formatData = (cpflDataArray: Array<CPFLDataInterface>) => {
    const data = cpflDataArray.map((cpflData) => {
      const hours = cpflData.hour.split(' ')

      const cpflFormattedData: CPFLFormattedDataInterface = {
        date: cpflData.date,
        contents: cpflData.contents,
        initialHour: hours[0],
        finalHour: hours[2]
      }

      return cpflFormattedData
    })

    return data
  }

  private get = async ({ state, city }: getInterface) => {
    const url = this.makeURL(Number(this.getStateNumber(state)))

    const browser = await this.runBrowser()
    const page = await this.newPage(browser)

    await page.goto(url, { waitUntil: 'load' })
    
    await this.selectToCity(page)

    const cities = this.citiesToState(Number(this.getStateNumber(state)))
    if (!!cities) {
      await this.searchWithCity(page, this.getCityCode(cities, city))
    }

    const result = await this.getData(page)
    const dataFormatted = this.formatData(result)

    this.closeBrowser(browser)

    return dataFormatted
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
   * @param  {number} finalSeconds is a number is seconds to actual time at time to maintenence
   * @param  {number} finalMaintenence is a number is seconds to actual time at time to final of maintenence
   */
  private getStatus = (finalSeconds: number, finalMaintenence: number) => {
    let status = 2

    if (finalSeconds <= 0 && finalMaintenence > 0) {
      status = 3
    }

    if (finalSeconds <= 0 && finalMaintenence <= 0) {
      status = 4
    }

    return status
  }

  private convertStatusStringToNumber = (status: 'waiting' | 'maintenence' | 'finished') => {
    switch (status) {
      case 'waiting':
        return 2
      case 'maintenence':
        return 3
      default:
        return 4
    }
  }

  private updateCPFLData = async ({ data, state, city }: updateCPFLDataInterface) => {
    const duration = this.getDurationInSeconds(
      this.formatDateToGetDuration(data.date, data.initialHour),
      this.formatDateToGetDuration(data.date, data.finalHour)
    )

    const actualDate = moment().format('DD/MM/YYYY HH:mm')

    const finalSeconds = this.getDurationInSeconds(
      this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
      this.formatDateToGetDuration(data.date, data.initialHour)
    )
    const finalMaintenance = this.getDurationInSeconds(
      this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
      this.formatDateToGetDuration(data.date, data.finalHour)
    )

    const status = this.getStatus(finalSeconds, finalMaintenance)

    for (let index = 0; index < data.contents.length; index++) {
      const content = data.contents[index]

      for (let index = 0; index < content.ruas.length; index++) {
        const street = content.ruas[index]
        
        const cpflData = await cpflDataRepository.get({
          state,
          city,
          district: content.bairro,
          street: street,

          date: data.date
        })

        const haveRegistry =  !!cpflData
        if (haveRegistry) {
          if (cpflData.status !== this.convertStatusStringToNumber('finished')) {
            await cpflDataRepository.update({
              identifiers: { id: cpflData.id },
              payload: {
                final_maintenance: finalMaintenance,
                final_seconds: finalSeconds,
                status
              }
            })
          }
        } else {
          await cpflDataRepository.create({
            state,
            city,
            district: content.bairro,
            street: street,

            date: data.date,

            status,
            
            initial_hour: `${data.date} - ${data.initialHour}`,
            final_hour: `${data.date} - ${data.finalHour}`,
            duration: duration,

            final_maintenance: finalMaintenance,
            final_seconds: finalSeconds,
          })
        }
      }
    }
  }

  private updateTime = async ({ state, city }: updateCPFLTimeInterface) => {
    const CPFLDataOfStateAndCity = await cpflDataRepository.index({
      state,
      city
    })

    for (let index = 0; index < CPFLDataOfStateAndCity.length; index++) {
      const cpflData = CPFLDataOfStateAndCity[index]
      
      if (cpflData.status !== this.convertStatusStringToNumber('finished')) {
        const actualDate = moment().format('DD/MM/YYYY HH:mm')

        const finalSeconds = this.getDurationInSeconds(
          this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
          this.formatDateToGetDuration(cpflData.date, cpflData.initial_hour.split(' ')[2])
        )
        const finalMaintenance = this.getDurationInSeconds(
          this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
          this.formatDateToGetDuration(cpflData.date, cpflData.final_hour.split(' ')[2])
        )

        const status = this.getStatus(finalSeconds, finalMaintenance)

        await cpflDataRepository.update({
          identifiers: { id: cpflData.id },
          payload: {
            final_maintenance: finalMaintenance,
            final_seconds: finalSeconds,
            status
          }
        })
      }
    }
  }

  private getCitiesWithState = (state: string) => {
    let cities: citiesInterface = []
    
    cities = this.citiesToState(Number(this.getStateNumber(state)))

    return cities
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

  public getCPFL = async (req: Request, res: Response) => {
    const dataFormatted = await this.get({ state: 'sp', city: 'Araraquara' })

    const requests = dataFormatted.map(async (data) => {
      await this.updateCPFLData({ data, state: 'sp', city: 'Araraquara' })
    })
    await Promise.all(requests)

    return res.status(200).json({
      message: 'ok',
      data: dataFormatted
    })
  }

  public runCpflRoutine = async (state: string, city: string) => {
    const dataFormatted = await this.get({ state: state, city: city })
    
    const requests = dataFormatted.map(async (data) => {
      await this.updateCPFLData({ data, state: 'sp', city: 'Araraquara' })
    })
    await Promise.all(requests)
  }

  public runUpdateTimeRoutine = async (state: string, city: string) => {
    await this.updateTime({ state, city })
  }

  public getStatesRequest = async (req: Request, res: Response) => {
    const data = this.states

    return res.status(200).json({
      message: 'estados recuperados com sucesso!',
      data
    })
  }

  public getCitiesRequest = async (req: Request, res: Response) => {
    const { state } = req.params

    const data = this.getCitiesWithState(String(state))

    return res.status(200).json({
      message: 'cidades recuperadas com sucesso!',
      data
    })
  }
}