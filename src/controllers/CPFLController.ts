import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import fs from 'fs'
import moment from 'moment'
import dotenv from 'dotenv'

import {
  cpflDataRepository
} from './../repositories'

import { AppError, errorHandler } from './../utils/handleError'

import { CPFLDataInterface as CPFLDataDatabaseInterface } from './../repositories/CPFLDataRepository'

dotenv.config()

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
  }>,
  reason: string
}

interface CPFLFormattedDataInterface {
  date: string,
  contents: Array<{
    bairro: string,
    ruas: Array<string>
  }>,
  initialHour: string,
  finalHour: string,
  reason: string
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

type statusCountInterface = Array<{
  name: string,
  state: string,
  status_agendamento: number,
  status_emAndamento: number,
  status_concluidas: number
}>

type reasonsCountInterface = Array<{
  name: string,
  state: string,
  total_manutencao: number,
  total_obra: number,
  total_melhorias: number,
  total_preventivas: number,
  total_obraDeTerceiros: number,
  total_documentoReserva: number,
  total_outros: number
}>

export default class CPFLController {
  public states = ['paulista', 'santa cruz', 'piratininga', 'rio grande do sul']

  public SPcities: citiesInterface = [{'value': '203', 'label': 'Aguas De Lindoia'}, {'value': '309', 'label': 'Aguas De Sao Pedro'}, {'value': '78', 'label': 'Agudos'}, {'value': '280', 'label': 'Altair'}, {'value': '120', 'label': 'Altinopolis'}, {'value': '520', 'label': 'Alto Alegre'}, {'value': '212', 'label': 'Alvaro De Carvalho'}, {'value': '10', 'label': 'Alvinlandia'}, {'value': '535', 'label': 'Americana'}, {'value': '337', 'label': 'Americo Brasiliense'}, {'value': '424', 'label': 'Amparo'}, {'value': '144', 'label': 'Analandia'}, {'value': '109', 'label': 'Aracatuba'}, {'value': '240', 'label': 'Aramina'}, {'value': '287', 'label': 'Araraquara'}, {'value': '505', 'label': 'Arealva'}, {'value': '339', 'label': 'Areiopolis'}, {'value': '234', 'label': 'Ariranha'}, {'value': '551', 'label': 'Avai'}, {'value': '23', 'label': 'Avanhandava'}, {'value': '369', 'label': 'Bady Bassitt'}, {'value': '402', 'label': 'Balbinos'}, {'value': '25', 'label': 'Balsamo'}, {'value': '108', 'label': 'Barbosa'}, {'value': '266', 'label': 'Bariri'}, {'value': '482', 'label': 'Barra Bonita'}, {'value': '453', 'label': 'Barretos'}, {'value': '361', 'label': 'Barrinha'}, {'value': '127', 'label': 'Batatais'}, {'value': '484', 'label': 'Bauru'}, {'value': '267', 'label': 'Bebedouro'}, {'value': '257', 'label': 'Bento De Abreu'}, {'value': '543', 'label': 'Bilac'}, {'value': '97', 'label': 'Birigui'}, {'value': '326', 'label': 'Boa Esperanca Do Sul'}, {'value': '386', 'label': 'Bocaina'}, {'value': '492', 'label': 'Bofete'}, {'value': '304', 'label': 'Boraceia'}, {'value': '111', 'label': 'Borebi'}, {'value': '293', 'label': 'Botucatu'}, {'value': '256', 'label': 'Brauna'}, {'value': '22', 'label': 'Brejo Alegre'}, {'value': '528', 'label': 'Brodowski'}, {'value': '341', 'label': 'Brotas'}, {'value': '474', 'label': 'Buritizal'}, {'value': '405', 'label': 'Cabralia Paulista'}, {'value': '392', 'label': 'Cafelandia'}, {'value': '165', 'label': 'Cajobi'}, {'value': '302', 'label': 'Cajuru'}, {'value': '58', 'label': 'Campinas'}, {'value': '133', 'label': 'Campos Novos Paulista'}, {'value': '455', 'label': 'Candido Rodrigues'}, {'value': '69', 'label': 'Capivari'}, {'value': '65', 'label': 'Cassia Dos Coqueiros'}, {'value': '389', 'label': 'Cedral'}, {'value': '425', 'label': 'Charqueada'}, {'value': '1091', 'label': 'Claraval'}, {'value': '355', 'label': 'Clementina'}, {'value': '319', 'label': 'Colina'}, {'value': '511', 'label': 'Colombia'}, {'value': '233', 'label': 'Coroados'}, {'value': '59', 'label': 'Cosmopolis'}, {'value': '199', 'label': 'Cravinhos'}, {'value': '330', 'label': 'Cristais Paulista'}, {'value': '564', 'label': 'Descalvado'}, {'value': '147', 'label': 'Dobrada'}, {'value': '445', 'label': 'Dois Corregos'}, {'value': '163', 'label': 'Dourado'}, {'value': '154', 'label': 'Duartina'}, {'value': '56', 'label': 'Dumont'}, {'value': '143', 'label': 'Elias Fausto'}, {'value': '106', 'label': 'Embauba'}, {'value': '119', 'label': 'Espirito Santo Do Pinhal'}, {'value': '420', 'label': 'Fernando Prestes'}, {'value': '414', 'label': 'Fernao'}, {'value': '253', 'label': 'Franca'}, {'value': '284', 'label': 'Gabriel Monteiro'}, {'value': '4', 'label': 'Galia'}, {'value': '221', 'label': 'Garca'}, {'value': '509', 'label': 'Gaviao Peixoto'}, {'value': '308', 'label': 'Getulina'}, {'value': '241', 'label': 'Glicerio'}, {'value': '268', 'label': 'Guaicara'}, {'value': '427', 'label': 'Guaimbe'}, {'value': '15', 'label': 'Guaira'}, {'value': '85', 'label': 'Guapiacu'}, {'value': '170', 'label': 'Guara'}, {'value': '408', 'label': 'Guaraci'}, {'value': '394', 'label': 'Guaranta'}, {'value': '262', 'label': 'Guararapes'}, {'value': '464', 'label': 'Guariba'}, {'value': '382', 'label': 'Guatapara'}, {'value': '409', 'label': 'Herculandia'}, {'value': '534', 'label': 'Hortolandia'}, {'value': '90', 'label': 'Iacanga'}, {'value': '510', 'label': 'Ibate'}, {'value': '242', 'label': 'Ibira'}, {'value': '406', 'label': 'Ibitinga'}, {'value': '158', 'label': 'Icem'}, {'value': '504', 'label': 'Igaracu Do Tiete'}, {'value': '148', 'label': 'Igarapava'}, {'value': '694', 'label': 'IHM'}, {'value': '411', 'label': 'Ipigua'}, {'value': '275', 'label': 'Ipua'}, {'value': '3', 'label': 'Itaju'}, {'value': '271', 'label': 'Itapira'}, {'value': '230', 'label': 'Itapolis'}, {'value': '131', 'label': 'Itapui'}, {'value': '67', 'label': 'Itatiba'}, {'value': '82', 'label': 'Itatinga'}, {'value': '128', 'label': 'Itirapua'}, {'value': '494', 'label': 'Ituverava'}, {'value': '76', 'label': 'Jaborandi'}, {'value': '47', 'label': 'Jaboticabal'}, {'value': '94', 'label': 'Jaci'}, {'value': '362', 'label': 'Jardinopolis'}, {'value': '223', 'label': 'Jau'}, {'value': '225', 'label': 'Jeriquara'}, {'value': '62', 'label': 'Jose Bonifacio'}, {'value': '105', 'label': 'Julio Mesquita'}, {'value': '347', 'label': 'Lencois Paulista'}, {'value': '245', 'label': 'Lindoia'}, {'value': '452', 'label': 'Lins'}, {'value': '70', 'label': 'Lucianopolis'}, {'value': '430', 'label': 'Luis Antonio'}, {'value': '398', 'label': 'Luiziania'}, {'value': '426', 'label': 'Lupercio'}, {'value': '114', 'label': 'Macatuba'}, {'value': '138', 'label': 'Marilia'}, {'value': '310', 'label': 'Matao'}, {'value': '17', 'label': 'Miguelopolis'}, {'value': '542', 'label': 'Mineiros Do Tiete'}, {'value': '328', 'label': 'Mirassol'}, {'value': '377', 'label': 'Mirassolandia'}, {'value': '456', 'label': 'Mombuca'}, {'value': '376', 'label': 'Monte Alegre Do Sul'}, {'value': '454', 'label': 'Monte Alto'}, {'value': '558', 'label': 'Monte Aprazivel'}, {'value': '299', 'label': 'Monte Azul Paulista'}, {'value': '375', 'label': 'Monte Mor'}, {'value': '479', 'label': 'Morro Agudo'}, {'value': '517', 'label': 'Morungaba'}, {'value': '335', 'label': 'Motuca'}, {'value': '541', 'label': 'Neves Paulista'}, {'value': '72', 'label': 'Nova Europa'}, {'value': '99', 'label': 'Nova Granada'}, {'value': '298', 'label': 'Nova Odessa'}, {'value': '161', 'label': 'Nuporanga'}, {'value': '545', 'label': 'Ocaucu'}, {'value': '49', 'label': 'Olimpia'}, {'value': '503', 'label': 'Onda Verde'}, {'value': '87', 'label': 'Oriente'}, {'value': '318', 'label': 'Orlandia'}, {'value': '334', 'label': 'Palestina'}, {'value': '498', 'label': 'Palmares Paulista'}, {'value': '448', 'label': 'Paraiso'}, {'value': '44', 'label': 'Pardinho'}, {'value': '404', 'label': 'Patrocinio Paulista'}, {'value': '116', 'label': 'Paulinia'}, {'value': '192', 'label': 'Paulistania'}, {'value': '466', 'label': 'Pederneiras'}, {'value': '259', 'label': 'Pedregulho'}, {'value': '418', 'label': 'Penapolis'}, {'value': '248', 'label': 'Piacatu'}, {'value': '31', 'label': 'Pindorama'}, {'value': '204', 'label': 'Piracicaba'}, {'value': '52', 'label': 'Pirajui'}, {'value': '270', 'label': 'Pirangi'}, {'value': '395', 'label': 'Piratininga'}, {'value': '100', 'label': 'Pitangueiras'}, {'value': '291', 'label': 'Poloni'}, {'value': '193', 'label': 'Pompeia'}, {'value': '447', 'label': 'Pongai'}, {'value': '401', 'label': 'Pontal'}, {'value': '372', 'label': 'Potirendaba'}, {'value': '368', 'label': 'Pradopolis'}, {'value': '206', 'label': 'Pratania'}, {'value': '399', 'label': 'Presidente Alves'}, {'value': '490', 'label': 'Promissao'}, {'value': '180', 'label': 'Queiroz'}, {'value': '469', 'label': 'Quintana'}, {'value': '45', 'label': 'Rafard'}, {'value': '433', 'label': 'Reginopolis'}, {'value': '50', 'label': 'Restinga'}, {'value': '396', 'label': 'Ribeirao Bonito'}, {'value': '64', 'label': 'Ribeirao Corrente'}, {'value': '516', 'label': 'Ribeirao Preto'}, {'value': '403', 'label': 'Rifaina'}, {'value': '53', 'label': 'Rincao'}, {'value': '276', 'label': 'Rio Das Pedras'}, {'value': '512', 'label': 'Rubiacea'}, {'value': '146', 'label': 'Sabino'}, {'value': '173', 'label': 'Sales Oliveira'}, {'value': '338', 'label': 'Saltinho'}, {'value': '329', 'label': 'Santa Adelia'}, {'value': '521', 'label': "Santa Barbara D'Oeste"}, {'value': '110', 'label': 'Santa Cruz Da Esperanca'}, {'value': '550', 'label': 'Santa Ernestina'}, {'value': '213', 'label': 'Santa Lucia'}, {'value': '216', 'label': 'Santa Maria Da Serra'}, {'value': '470', 'label': 'Santa Rosa De Viterbo'}, {'value': '157', 'label': 'Santo Antonio Da Alegria'}, {'value': '340', 'label': 'Santo Antonio Do Aracangua'}, {'value': '140', 'label': 'Santo Antonio Do Jardim'}, {'value': '261', 'label': 'Santopolis Do Aguapei'}, {'value': '202', 'label': 'Sao Carlos'}, {'value': '150', 'label': 'Sao Joaquim Da Barra'}, {'value': '460', 'label': 'Sao Jose Da Bela Vista'}, {'value': '168', 'label': 'Sao Jose Do Rio Preto'}, {'value': '523', 'label': 'Sao Manuel'}, {'value': '169', 'label': 'Sao Pedro'}, {'value': '461', 'label': 'Sao Simao'}, {'value': '145', 'label': 'Serra Azul'}, {'value': '265', 'label': 'Serra Negra'}, {'value': '529', 'label': 'Serrana'}, {'value': '289', 'label': 'Sertaozinho'}, {'value': '562', 'label': 'Severinia'}, {'value': '415', 'label': 'Socorro'}, {'value': '177', 'label': 'Sumare'}, {'value': '11', 'label': 'Tabatinga'}, {'value': '226', 'label': 'Taiacu'}, {'value': '467', 'label': 'Taiuva'}, {'value': '96', 'label': 'Tanabi'}, {'value': '531', 'label': 'Taquaral'}, {'value': '524', 'label': 'Taquaritinga'}, {'value': '135', 'label': 'Terra Roxa'}, {'value': '132', 'label': 'Torrinha'}, {'value': '73', 'label': 'Trabiju'}, {'value': '350', 'label': 'Ubarana'}, {'value': '182', 'label': 'Uchoa'}, {'value': '80', 'label': 'Uru'}, {'value': '434', 'label': 'Valinhos'}, {'value': '156', 'label': 'Valparaiso'}, {'value': '530', 'label': 'Vera Cruz - Sp'}, {'value': '323', 'label': 'Viradouro'}, {'value': '364', 'label': 'Vista Alegre Do Alto'}]
  public RScities: citiesInterface = [{'value': '854', 'label': 'Água Santa'}, {'value': '802', 'label': 'Agudo'}, {'value': '1074', 'label': 'Ajuricaba'}, {'value': '999', 'label': 'Alecrim'}, {'value': '894', 'label': 'Alegrete'}, {'value': '991', 'label': 'Alegria'}, {'value': '975', 'label': 'Alpestre'}, {'value': '728', 'label': 'Alto Feliz'}, {'value': '969', 'label': 'Ametista do Sul'}, {'value': '832', 'label': 'André da Rocha'}, {'value': '912', 'label': 'Anta Gorda'}, {'value': '713', 'label': 'Antônio Prado'}, {'value': '776', 'label': 'Araricá'}, {'value': '867', 'label': 'Aratiba'}, {'value': '764', 'label': 'Arroio do Meio'}, {'value': '807', 'label': 'Arroio do Tigre'}, {'value': '848', 'label': 'Arvorezinha'}, {'value': '1072', 'label': 'Augusto Pestana'}, {'value': '898', 'label': 'Áurea'}, {'value': '750', 'label': 'Barão'}, {'value': '866', 'label': 'Barão do Cotegipe'}, {'value': '1053', 'label': 'Barra do Guarita'}, {'value': '892', 'label': 'Barra do Quaraí'}, {'value': '920', 'label': 'Barra do Rio Azul'}, {'value': '1028', 'label': 'Barra Funda'}, {'value': '910', 'label': 'Barracão'}, {'value': '913', 'label': 'Barros Cassal'}, {'value': '957', 'label': 'Benjamin Constant do Sul'}, {'value': '753', 'label': 'Bento Gonçalves'}, {'value': '1040', 'label': 'Boa Vista das Missões'}, {'value': '1059', 'label': 'Boa Vista do Buricá'}, {'value': '946', 'label': 'Boa Vista do Cadeado'}, {'value': '744', 'label': 'Boa Vista do Sul'}, {'value': '702', 'label': 'Bom Jesus'}, {'value': '1007', 'label': 'Bom Princípio'}, {'value': '1048', 'label': 'Bom Progresso'}, {'value': '766', 'label': 'Bom Retiro do Sul'}, {'value': '791', 'label': 'Boqueirão do Leão'}, {'value': '886', 'label': 'Bossoroca'}, {'value': '941', 'label': 'Bozano'}, {'value': '1052', 'label': 'Braga'}, {'value': '747', 'label': 'Brochier'}, {'value': '1025', 'label': 'Caçapava do Sul'}, {'value': '874', 'label': 'Cacequi'}, {'value': '812', 'label': 'Cachoeira do Sul'}, {'value': '1011', 'label': 'Cachoeirinha'}, {'value': '907', 'label': 'Cacique Doble'}, {'value': '974', 'label': 'Caiçara'}, {'value': '846', 'label': 'Camargo'}, {'value': '699', 'label': 'Cambará do Sul'}, {'value': '716', 'label': 'Campestre da Serra'}, {'value': '992', 'label': 'Campina das Missões'}, {'value': '954', 'label': 'Campinas do Sul'}, {'value': '774', 'label': 'Campo Bom'}, {'value': '1049', 'label': 'Campo Novo'}, {'value': '816', 'label': 'Candelária'}, {'value': '994', 'label': 'Cândido Godói'}, {'value': '698', 'label': 'Canela'}, {'value': '785', 'label': 'Canoas'}, {'value': '838', 'label': 'Capão Bonito do Sul'}, {'value': '883', 'label': 'Capão do Cipó'}, {'value': '720', 'label': 'Capela de Santana'}, {'value': '762', 'label': 'Capitão'}, {'value': '729', 'label': 'Carlos Barbosa'}, {'value': '901', 'label': 'Carlos Gomes'}, {'value': '858', 'label': 'Casca'}, {'value': '828', 'label': 'Caseiros'}, {'value': '1071', 'label': 'Catuípe'}, {'value': '707', 'label': 'Caxias do Sul'}, {'value': '900', 'label': 'Centenário'}, {'value': '810', 'label': 'Cerro Branco'}, {'value': '1041', 'label': 'Cerro Grande'}, {'value': '1078', 'label': 'Cerro Largo'}, {'value': '855', 'label': 'Charrua'}, {'value': '1045', 'label': 'Chiapetta'}, {'value': '862', 'label': 'Ciríaco'}, {'value': '733', 'label': 'Colinas'}, {'value': '1036', 'label': 'Constantina'}, {'value': '756', 'label': 'Coqueiro Baixo'}, {'value': '1055', 'label': 'Coronel Bicaco'}, {'value': '743', 'label': 'Coronel Pilar'}, {'value': '841', 'label': 'Cotiporã'}, {'value': '842', 'label': 'Coxilha'}, {'value': '1061', 'label': 'Crissiumal'}, {'value': '965', 'label': 'Cristal do Sul'}, {'value': '947', 'label': 'Cruz Alta'}, {'value': '959', 'label': 'Cruzaltense'}, {'value': '760', 'label': 'Cruzeiro do Sul'}, {'value': '863', 'label': 'David Canabarro'}, {'value': '1047', 'label': 'Derrubadas'}, {'value': '1017', 'label': 'Dezesseis de Novembro'}, {'value': '932', 'label': 'Dilermando de Aguiar'}, {'value': '778', 'label': 'Dois Irmãos'}, {'value': '1058', 'label': 'Dois Irmãos das Missões'}, {'value': '839', 'label': 'Dois Lajeados'}, {'value': '986', 'label': 'Doutor Maurício Cardoso'}, {'value': '763', 'label': 'Doutor Ricardo'}, {'value': '765', 'label': 'Encantado'}, {'value': '1038', 'label': 'Engenho Velho'}, {'value': '961', 'label': 'Entre Rios do Sul'}, {'value': '1069', 'label': 'Entre-Ijuís'}, {'value': '868', 'label': 'Erebango'}, {'value': '869', 'label': 'Erechim'}, {'value': '916', 'label': 'Ernestina'}, {'value': '958', 'label': 'Erval Grande'}, {'value': '980', 'label': 'Erval Seco'}, {'value': '714', 'label': 'Esmeralda'}, {'value': '1064', 'label': 'Esperança do Sul'}, {'value': '925', 'label': 'Espumoso'}, {'value': '844', 'label': 'Estação'}, {'value': '722', 'label': 'Estância Velha'}, {'value': '786', 'label': 'Esteio'}, {'value': '732', 'label': 'Estrela'}, {'value': '804', 'label': 'Estrela Velha'}, {'value': '1075', 'label': 'Eugênio de Castro'}, {'value': '827', 'label': 'Fagundes Varela'}, {'value': '730', 'label': 'Farroupilha'}, {'value': '966', 'label': 'Faxinalzinho'}, {'value': '735', 'label': 'Fazenda Vilanova'}, {'value': '726', 'label': 'Feliz'}, {'value': '708', 'label': 'Flores da Cunha'}, {'value': '897', 'label': 'Floriano Peixoto'}, {'value': '1085', 'label': 'Fontoura Xavier'}, {'value': '1024', 'label': 'Formigueiro'}, {'value': '948', 'label': 'Fortaleza dos Valos'}, {'value': '971', 'label': 'Frederico Westphalen'}, {'value': '751', 'label': 'Garibaldi'}, {'value': '888', 'label': 'Garruchos'}, {'value': '896', 'label': 'Gaurama'}, {'value': '789', 'label': 'General Câmara'}, {'value': '853', 'label': 'Gentil'}, {'value': '870', 'label': 'Getúlio Vargas'}, {'value': '981', 'label': 'Giruá'}, {'value': '1009', 'label': 'Glorinha'}, {'value': '705', 'label': 'Gramado'}, {'value': '964', 'label': 'Gramado dos Loureiros'}, {'value': '801', 'label': 'Gramado Xavier'}, {'value': '1012', 'label': 'Gravataí'}, {'value': '829', 'label': 'Guabiju'}, {'value': '860', 'label': 'Guaporé'}, {'value': '1079', 'label': 'Guarani das Missões'}, {'value': '1004', 'label': 'Harmonia'}, {'value': '819', 'label': 'Herveiras'}, {'value': '987', 'label': 'Horizontina'}, {'value': '1065', 'label': 'Humaitá'}, {'value': '805', 'label': 'Ibarama'}, {'value': '1084', 'label': 'Ibiaçá'}, {'value': '830', 'label': 'Ibiraiaras'}, {'value': '915', 'label': 'Ibirapuitã'}, {'value': '950', 'label': 'Ibirubá'}, {'value': '770', 'label': 'Igrejinha'}, {'value': '1073', 'label': 'Ijuí'}, {'value': '851', 'label': 'Ilópolis'}, {'value': '739', 'label': 'Imigrante'}, {'value': '989', 'label': 'Independência'}, {'value': '1063', 'label': 'Inhacorá'}, {'value': '712', 'label': 'Ipê'}, {'value': '918', 'label': 'Ipiranga do Sul'}, {'value': '976', 'label': 'Iraí'}, {'value': '937', 'label': 'Itaara'}, {'value': '884', 'label': 'Itacurubi'}, {'value': '847', 'label': 'Itapuca'}, {'value': '879', 'label': 'Itaqui'}, {'value': '921', 'label': 'Itatiba do Sul'}, {'value': '939', 'label': 'Ivorá'}, {'value': '781', 'label': 'Ivoti'}, {'value': '953', 'label': 'Jacutinga'}, {'value': '877', 'label': 'Jaguari'}, {'value': '700', 'label': 'Jaquirana'}, {'value': '931', 'label': 'Jari'}, {'value': '1076', 'label': 'Jóia'}, {'value': '938', 'label': 'Júlio de Castilhos'}, {'value': '808', 'label': 'Lagoa Bonita do Sul'}, {'value': '924', 'label': 'Lagoa dos Três Cantos'}, {'value': '836', 'label': 'Lagoa Vermelha'}, {'value': '817', 'label': 'Lagoão'}, {'value': '761', 'label': 'Lajeado'}, {'value': '1037', 'label': 'Lajeado do Bugre'}, {'value': '1042', 'label': 'Liberato Salzano'}, {'value': '780', 'label': 'Lindolfo Collor'}, {'value': '725', 'label': 'Linha Nova'}, {'value': '881', 'label': 'Maçambará'}, {'value': '906', 'label': 'Machadinho'}, {'value': '895', 'label': 'Manoel Viana'}, {'value': '749', 'label': 'Maratá'}, {'value': '843', 'label': 'Marau'}, {'value': '902', 'label': 'Marcelino Ramos'}, {'value': '871', 'label': 'Mariano Moro'}, {'value': '755', 'label': 'Marques de Souza'}, {'value': '1001', 'label': 'Mata'}, {'value': '796', 'label': 'Mato Leitão'}, {'value': '904', 'label': 'Maximiliano de Almeida'}, {'value': '1056', 'label': 'Miraguaí'}, {'value': '852', 'label': 'Montauri'}, {'value': '703', 'label': 'Monte Alegre dos Campos'}, {'value': '746', 'label': 'Monte Belo do Sul'}, {'value': '719', 'label': 'Montenegro'}, {'value': '927', 'label': 'Mormaço'}, {'value': '783', 'label': 'Morro Reuter'}, {'value': '737', 'label': 'Muçum'}, {'value': '715', 'label': 'Muitos Capões'}, {'value': '823', 'label': 'Muliterno'}, {'value': '922', 'label': 'Não-Me-Toque'}, {'value': '970', 'label': 'Nonoai'}, {'value': '849', 'label': 'Nova Alvorada'}, {'value': '824', 'label': 'Nova Araçá'}, {'value': '826', 'label': 'Nova Bassano'}, {'value': '1026', 'label': 'Nova Boa Vista'}, {'value': '759', 'label': 'Nova Bréscia'}, {'value': '1060', 'label': 'Nova Candelária'}, {'value': '878', 'label': 'Nova Esperança do Sul'}, {'value': '779', 'label': 'Nova Hartz'}, {'value': '709', 'label': 'Nova Pádua'}, {'value': '1087', 'label': 'Nova Palma'}, {'value': '706', 'label': 'Nova Petrópolis'}, {'value': '831', 'label': 'Nova Prata'}, {'value': '710', 'label': 'Nova Roma do Sul'}, {'value': '787', 'label': 'Nova Santa Rita'}, {'value': '1029', 'label': 'Novo Barreiro'}, {'value': '811', 'label': 'Novo Cabrais'}, {'value': '773', 'label': 'Novo Hamburgo'}, {'value': '982', 'label': 'Novo Machado'}, {'value': '1035', 'label': 'Novo Xingú'}, {'value': '905', 'label': 'Paim Filho'}, {'value': '1030', 'label': 'Palmeira das Missões'}, {'value': '979', 'label': 'Palmitinho'}, {'value': '943', 'label': 'Panambi'}, {'value': '821', 'label': 'Paraí'}, {'value': '806', 'label': 'Paraíso do Sul'}, {'value': '723', 'label': 'Pareci Novo'}, {'value': '775', 'label': 'Parobé'}, {'value': '815', 'label': 'Passa Sete'}, {'value': '794', 'label': 'Passo do Sobrado'}, {'value': '917', 'label': 'Passo Fundo'}, {'value': '919', 'label': 'Paulo Bento'}, {'value': '742', 'label': 'Paverama'}, {'value': '942', 'label': 'Pejuçara'}, {'value': '704', 'label': 'Picada Café'}, {'value': '718', 'label': 'Pinhal da Serra'}, {'value': '928', 'label': 'Pinhal Grande'}, {'value': '978', 'label': 'Pinheirinho do Vale'}, {'value': '731', 'label': 'Pinto Bandeira'}, {'value': '1013', 'label': 'Pirapó'}, {'value': '972', 'label': 'Planalto'}, {'value': '745', 'label': 'Poço das Antas'}, {'value': '955', 'label': 'Ponte Preta'}, {'value': '721', 'label': 'Portão'}, {'value': '996', 'label': 'Porto Lucena'}, {'value': '1000', 'label': 'Porto Mauá'}, {'value': '998', 'label': 'Porto Vera Cruz'}, {'value': '995', 'label': 'Porto Xavier'}, {'value': '782', 'label': 'Presidente Lucena'}, {'value': '837', 'label': 'Protásio Alves'}, {'value': '911', 'label': 'Putinga'}, {'value': '891', 'label': 'Quaraí'}, {'value': '952', 'label': 'Quatro Irmãos'}, {'value': '933', 'label': 'Quevedos'}, {'value': '951', 'label': 'Quinze de Novembro'}, {'value': '1057', 'label': 'Redentora'}, {'value': '758', 'label': 'Relvado'}, {'value': '803', 'label': 'Restinga Seca'}, {'value': '973', 'label': 'Rio dos Índios'}, {'value': '798', 'label': 'Rio Pardo'}, {'value': '769', 'label': 'Riozinho'}, {'value': '736', 'label': 'Roca Sales'}, {'value': '1018', 'label': 'Rolador'}, {'value': '768', 'label': 'Rolante'}, {'value': '1033', 'label': 'Ronda Alta'}, {'value': '1031', 'label': 'Rondinha'}, {'value': '1080', 'label': 'Roque Gonzales'}, {'value': '890', 'label': 'Rosário do Sul'}, {'value': '1039', 'label': 'Sagrada Família'}, {'value': '945', 'label': 'Saldanha Marinho'}, {'value': '949', 'label': 'Salto do Jacuí'}, {'value': '1082', 'label': 'Salvador das Missões'}, {'value': '752', 'label': 'Salvador do Sul'}, {'value': '865', 'label': 'Sananduva'}, {'value': '944', 'label': 'Santa Bárbara do Sul'}, {'value': '754', 'label': 'Santa Clara do Sul'}, {'value': '792', 'label': 'Santa Cruz do Sul'}, {'value': '1021', 'label': 'Santa Margarida do Sul'}, {'value': '936', 'label': 'Santa Maria'}, {'value': '784', 'label': 'Santa Maria do Herval'}, {'value': '984', 'label': 'Santa Rosa'}, {'value': '740', 'label': 'Santa Tereza'}, {'value': '1019', 'label': 'Santana da Boa Vista'}, {'value': '889', 'label': 'Santana do Livramento'}, {'value': '880', 'label': 'Santiago'}, {'value': '1070', 'label': 'Santo Ângelo'}, {'value': '1010', 'label': 'Santo Antônio da Patrulha'}, {'value': '887', 'label': 'Santo Antônio das Missões'}, {'value': '856', 'label': 'Santo Antônio do Palma'}, {'value': '1050', 'label': 'Santo Augusto'}, {'value': '997', 'label': 'Santo Cristo'}, {'value': '908', 'label': 'Santo Expedito do Sul'}, {'value': '885', 'label': 'São Borja'}, {'value': '861', 'label': 'São Domingos do Sul'}, {'value': '876', 'label': 'São Francisco de Assis'}, {'value': '697', 'label': 'São Francisco de Paula'}, {'value': '1020', 'label': 'São Gabriel'}, {'value': '903', 'label': 'São João da Urtiga'}, {'value': '820', 'label': 'São João do Polêsine'}, {'value': '825', 'label': 'São Jorge'}, {'value': '1032', 'label': 'São José das Missões'}, {'value': '1005', 'label': 'São José do Hortêncio'}, {'value': '990', 'label': 'São José do Inhacorá'}, {'value': '909', 'label': 'São José do Ouro'}, {'value': '724', 'label': 'São José do Sul'}, {'value': '701', 'label': 'São José dos Ausentes'}, {'value': '772', 'label': 'São Leopoldo'}, {'value': '1016', 'label': 'São Luiz Gonzaga'}, {'value': '711', 'label': 'São Marcos'}, {'value': '1066', 'label': 'São Martinho'}, {'value': '934', 'label': 'São Martinho da Serra'}, {'value': '1002', 'label': 'São Miguel das Missões'}, {'value': '1077', 'label': 'São Nicolau'}, {'value': '1015', 'label': 'São Paulo das Missões'}, {'value': '1034', 'label': 'São Pedro das Missões'}, {'value': '1081', 'label': 'São Pedro do Butiá'}, {'value': '930', 'label': 'São Pedro do Sul'}, {'value': '1003', 'label': 'São Sebastião do Caí'}, {'value': '1023', 'label': 'São Sepé'}, {'value': '956', 'label': 'São Valentim'}, {'value': '840', 'label': 'São Valentim do Sul'}, {'value': '1046', 'label': 'São Valério do Sul'}, {'value': '1008', 'label': 'São Vendelino'}, {'value': '875', 'label': 'São Vicente do Sul'}, {'value': '777', 'label': 'Sapiranga'}, {'value': '788', 'label': 'Sapucaia do Sul'}, {'value': '1027', 'label': 'Sarandi'}, {'value': '963', 'label': 'Seberi'}, {'value': '1043', 'label': 'Sede Nova'}, {'value': '813', 'label': 'Segredo'}, {'value': '993', 'label': 'Senador Salgado Filho'}, {'value': '859', 'label': 'Serafina Corrêa'}, {'value': '793', 'label': 'Sério'}, {'value': '845', 'label': 'Sertão'}, {'value': '1067', 'label': 'Sete de Setembro'}, {'value': '873', 'label': 'Severiano de Almeida'}, {'value': '940', 'label': 'Silveira Martins'}, {'value': '800', 'label': 'Sinimbu'}, {'value': '809', 'label': 'Sobradinho'}, {'value': '914', 'label': 'Soledade'}, {'value': '741', 'label': 'Tabaí'}, {'value': '1083', 'label': 'Tapejara'}, {'value': '923', 'label': 'Tapera'}, {'value': '767', 'label': 'Taquara'}, {'value': '790', 'label': 'Taquari'}, {'value': '967', 'label': 'Taquaruçu do Sul'}, {'value': '1051', 'label': 'Tenente Portela'}, {'value': '738', 'label': 'Teutônia'}, {'value': '1086', 'label': 'Tio Hugo'}, {'value': '1062', 'label': 'Tiradentes do Sul'}, {'value': '929', 'label': 'Toropi'}, {'value': '757', 'label': 'Travesseiro'}, {'value': '872', 'label': 'Três Arroios'}, {'value': '771', 'label': 'Três Coroas'}, {'value': '988', 'label': 'Três de Maio'}, {'value': '960', 'label': 'Três Palmeiras'}, {'value': '1044', 'label': 'Três Passos'}, {'value': '962', 'label': 'Trindade do Sul'}, {'value': '748', 'label': 'Triunfo'}, {'value': '985', 'label': 'Tucunduva'}, {'value': '814', 'label': 'Tunas'}, {'value': '835', 'label': 'Tupanci do Sul'}, {'value': '935', 'label': 'Tupanciretã'}, {'value': '1006', 'label': 'Tupandi'}, {'value': '983', 'label': 'Tuparendi'}, {'value': '1014', 'label': 'Ubiretama'}, {'value': '857', 'label': 'União da Serra'}, {'value': '882', 'label': 'Unistalda'}, {'value': '893', 'label': 'Uruguaiana'}, {'value': '717', 'label': 'Vacaria'}, {'value': '818', 'label': 'Vale do Sol'}, {'value': '727', 'label': 'Vale Real'}, {'value': '797', 'label': 'Vale Verde'}, {'value': '864', 'label': 'Vanini'}, {'value': '795', 'label': 'Venâncio Aires'}, {'value': '799', 'label': 'Vera Cruz'}, {'value': '834', 'label': 'Veranópolis'}, {'value': '734', 'label': 'Vespasiano Correa'}, {'value': '899', 'label': 'Viadutos'}, {'value': '977', 'label': 'Vicente Dutra'}, {'value': '926', 'label': 'Victor Graeff'}, {'value': '833', 'label': 'Vila Flores'}, {'value': '850', 'label': 'Vila Maria'}, {'value': '1022', 'label': 'Vila Nova do Sul'}, {'value': '968', 'label': 'Vista Alegre'}, {'value': '822', 'label': 'Vista Alegre do Prata'}, {'value': '1054', 'label': 'Vista Gaúcha'}, {'value': '1068', 'label': 'Vitória das Missões'}]
  public SantaCruzCities: citiesInterface = [{'value': '184', 'label': 'Águas De Santa Bárbara'}, {'value': '317', 'label': 'Alambari'}, {'value': '235', 'label': 'Arandu'}, {'value': '218', 'label': 'Arceburgo'}, {'value': '518', 'label': 'Avaré'}, {'value': '449', 'label': 'Barra Do Jacaré'}, {'value': '419', 'label': 'Bernardino De Campos'}, {'value': '61', 'label': 'Caconde'}, {'value': '66', 'label': 'Canitar'}, {'value': '48', 'label': 'Casa Branca'}, {'value': '286', 'label': 'Cerqueira César'}, {'value': '24', 'label': 'Chavantes'}, {'value': '483', 'label': 'Divinolândia'}, {'value': '231', 'label': 'Espírito Santo Do Turvo'}, {'value': '5', 'label': 'Guareí'}, {'value': '477', 'label': 'Iaras'}, {'value': '696', 'label': 'IHM'}, {'value': '353', 'label': 'Ipaussu'}, {'value': '93', 'label': 'Itaí'}, {'value': '209', 'label': 'Itamogi'}, {'value': '374', 'label': 'Itapetininga'}, {'value': '346', 'label': 'Itobi'}, {'value': '363', 'label': 'Jacarezinho'}, {'value': '153', 'label': 'Jaguariúna'}, {'value': '390', 'label': 'Manduri'}, {'value': '288', 'label': 'Mococa'}, {'value': '41', 'label': 'Monte Santo De Minas'}, {'value': '1090', 'label': 'Muzambinho'}, {'value': '491', 'label': 'Óleo'}, {'value': '325', 'label': 'Ourinhos'}, {'value': '451', 'label': 'Paranapanema'}, {'value': '258', 'label': 'Pedreira'}, {'value': '272', 'label': 'Piraju'}, {'value': '14', 'label': 'Ribeirão Claro'}, {'value': '519', 'label': 'Santa Cruz Do Rio Pardo'}, {'value': '1088', 'label': 'Santo Antônio de Posse'}, {'value': '74', 'label': 'São José Do Rio Pardo'}, {'value': '489', 'label': 'São Miguel Arcanjo'}, {'value': '183', 'label': 'São Pedro Do Turvo'}, {'value': '423', 'label': 'São Sebastião Da Grama'}, {'value': '8', 'label': 'Sarapuí'}, {'value': '178', 'label': 'Sarutaiá'}, {'value': '34', 'label': 'Taguaí'}, {'value': '130', 'label': 'Tapiratiba'}, {'value': '327', 'label': 'Taquarituba'}, {'value': '1089', 'label': 'Tatuí'}, {'value': '365', 'label': 'Tejupá'}, {'value': '244', 'label': 'Timburi'}, {'value': '208', 'label': 'Ubirajara'}]
  public PiratiningaCities: citiesInterface = [{'value': '412', 'label': 'Alumínio'}, {'value': '285', 'label': 'Araçariguama'}, {'value': '39', 'label': 'Araçoiaba Da Serra'}, {'value': '442', 'label': 'Boituva'}, {'value': '179', 'label': 'Campo Limpo Paulista'}, {'value': '196', 'label': 'Capela Do Alto'}, {'value': '366', 'label': 'Cubatão'}, {'value': '443', 'label': 'Guarujá'}, {'value': '101', 'label': 'Ibiúna'}, {'value': '695', 'label': 'IHM'}, {'value': '84', 'label': 'Indaiatuba'}, {'value': '559', 'label': 'Iperó'}, {'value': '391', 'label': 'Itu'}, {'value': '441', 'label': 'Itupeva'}, {'value': '29', 'label': 'Jundiaí'}, {'value': '122', 'label': 'Louveira'}, {'value': '495', 'label': 'Mairinque'}, {'value': '354', 'label': 'Porto Feliz'}, {'value': '357', 'label': 'Praia Grande'}, {'value': '75', 'label': 'Salto'}, {'value': '336', 'label': 'Salto De Pirapora'}, {'value': '476', 'label': 'Santos'}, {'value': '149', 'label': 'São Roque'}, {'value': '527', 'label': 'São Vicente'}, {'value': '238', 'label': 'Sorocaba'}, {'value': '473', 'label': 'Várzea Paulista'}, {'value': '210', 'label': 'Vinhedo'}, {'value': '124', 'label': 'Votorantim'}]

  public formatStatesToFrontend = (states: Array<string>) => {
    return states.map((state) => {
      switch (state) {
        case 'paulista':
          return { value: state, label: 'sp' }
        case 'santa cruz':
          return { value: state, label: 'sc'}
        case 'piratininga':
          return { value: state, label: 'pt'}
        case 'rio grande do sul':
          return { value: state, label: 'rs'}
        default:
          return { value: '', label: ''}
      }
    })
  }

  private getStateNumber = (state: string) => {
    if (state === 'santa cruz') {
      return 1
    } else if (state === 'piratininga') {
      return 2
    } else if (state === 'rio grande do sul') {
      return 3
    } else if (state === 'paulista') {
      return 4
    }
  }

  private citiesToState = (stateNumber: number) => {
    let cities: citiesInterface = []

    if (stateNumber === 4) {
      // const cities: citiesInterface = [{'value': '203', 'label': 'Aguas De Lindoia'}, {'value': '309', 'label': 'Aguas De Sao Pedro'}, {'value': '78', 'label': 'Agudos'}, {'value': '280', 'label': 'Altair'}, {'value': '120', 'label': 'Altinopolis'}, {'value': '520', 'label': 'Alto Alegre'}, {'value': '212', 'label': 'Alvaro De Carvalho'}, {'value': '10', 'label': 'Alvinlandia'}, {'value': '535', 'label': 'Americana'}, {'value': '337', 'label': 'Americo Brasiliense'}, {'value': '424', 'label': 'Amparo'}, {'value': '144', 'label': 'Analandia'}, {'value': '109', 'label': 'Aracatuba'}, {'value': '240', 'label': 'Aramina'}, {'value': '287', 'label': 'Araraquara'}, {'value': '505', 'label': 'Arealva'}, {'value': '339', 'label': 'Areiopolis'}, {'value': '234', 'label': 'Ariranha'}, {'value': '551', 'label': 'Avai'}, {'value': '23', 'label': 'Avanhandava'}, {'value': '369', 'label': 'Bady Bassitt'}, {'value': '402', 'label': 'Balbinos'}, {'value': '25', 'label': 'Balsamo'}, {'value': '108', 'label': 'Barbosa'}, {'value': '266', 'label': 'Bariri'}, {'value': '482', 'label': 'Barra Bonita'}, {'value': '453', 'label': 'Barretos'}, {'value': '361', 'label': 'Barrinha'}, {'value': '127', 'label': 'Batatais'}, {'value': '484', 'label': 'Bauru'}, {'value': '267', 'label': 'Bebedouro'}, {'value': '257', 'label': 'Bento De Abreu'}, {'value': '543', 'label': 'Bilac'}, {'value': '97', 'label': 'Birigui'}, {'value': '326', 'label': 'Boa Esperanca Do Sul'}, {'value': '386', 'label': 'Bocaina'}, {'value': '492', 'label': 'Bofete'}, {'value': '304', 'label': 'Boraceia'}, {'value': '111', 'label': 'Borebi'}, {'value': '293', 'label': 'Botucatu'}, {'value': '256', 'label': 'Brauna'}, {'value': '22', 'label': 'Brejo Alegre'}, {'value': '528', 'label': 'Brodowski'}, {'value': '341', 'label': 'Brotas'}, {'value': '474', 'label': 'Buritizal'}, {'value': '405', 'label': 'Cabralia Paulista'}, {'value': '392', 'label': 'Cafelandia'}, {'value': '165', 'label': 'Cajobi'}, {'value': '302', 'label': 'Cajuru'}, {'value': '58', 'label': 'Campinas'}, {'value': '133', 'label': 'Campos Novos Paulista'}, {'value': '455', 'label': 'Candido Rodrigues'}, {'value': '69', 'label': 'Capivari'}, {'value': '65', 'label': 'Cassia Dos Coqueiros'}, {'value': '389', 'label': 'Cedral'}, {'value': '425', 'label': 'Charqueada'}, {'value': '1091', 'label': 'Claraval'}, {'value': '355', 'label': 'Clementina'}, {'value': '319', 'label': 'Colina'}, {'value': '511', 'label': 'Colombia'}, {'value': '233', 'label': 'Coroados'}, {'value': '59', 'label': 'Cosmopolis'}, {'value': '199', 'label': 'Cravinhos'}, {'value': '330', 'label': 'Cristais Paulista'}, {'value': '564', 'label': 'Descalvado'}, {'value': '147', 'label': 'Dobrada'}, {'value': '445', 'label': 'Dois Corregos'}, {'value': '163', 'label': 'Dourado'}, {'value': '154', 'label': 'Duartina'}, {'value': '56', 'label': 'Dumont'}, {'value': '143', 'label': 'Elias Fausto'}, {'value': '106', 'label': 'Embauba'}, {'value': '119', 'label': 'Espirito Santo Do Pinhal'}, {'value': '420', 'label': 'Fernando Prestes'}, {'value': '414', 'label': 'Fernao'}, {'value': '253', 'label': 'Franca'}, {'value': '284', 'label': 'Gabriel Monteiro'}, {'value': '4', 'label': 'Galia'}, {'value': '221', 'label': 'Garca'}, {'value': '509', 'label': 'Gaviao Peixoto'}, {'value': '308', 'label': 'Getulina'}, {'value': '241', 'label': 'Glicerio'}, {'value': '268', 'label': 'Guaicara'}, {'value': '427', 'label': 'Guaimbe'}, {'value': '15', 'label': 'Guaira'}, {'value': '85', 'label': 'Guapiacu'}, {'value': '170', 'label': 'Guara'}, {'value': '408', 'label': 'Guaraci'}, {'value': '394', 'label': 'Guaranta'}, {'value': '262', 'label': 'Guararapes'}, {'value': '464', 'label': 'Guariba'}, {'value': '382', 'label': 'Guatapara'}, {'value': '409', 'label': 'Herculandia'}, {'value': '534', 'label': 'Hortolandia'}, {'value': '90', 'label': 'Iacanga'}, {'value': '510', 'label': 'Ibate'}, {'value': '242', 'label': 'Ibira'}, {'value': '406', 'label': 'Ibitinga'}, {'value': '158', 'label': 'Icem'}, {'value': '504', 'label': 'Igaracu Do Tiete'}, {'value': '148', 'label': 'Igarapava'}, {'value': '694', 'label': 'IHM'}, {'value': '411', 'label': 'Ipigua'}, {'value': '275', 'label': 'Ipua'}, {'value': '3', 'label': 'Itaju'}, {'value': '271', 'label': 'Itapira'}, {'value': '230', 'label': 'Itapolis'}, {'value': '131', 'label': 'Itapui'}, {'value': '67', 'label': 'Itatiba'}, {'value': '82', 'label': 'Itatinga'}, {'value': '128', 'label': 'Itirapua'}, {'value': '494', 'label': 'Ituverava'}, {'value': '76', 'label': 'Jaborandi'}, {'value': '47', 'label': 'Jaboticabal'}, {'value': '94', 'label': 'Jaci'}, {'value': '362', 'label': 'Jardinopolis'}, {'value': '223', 'label': 'Jau'}, {'value': '225', 'label': 'Jeriquara'}, {'value': '62', 'label': 'Jose Bonifacio'}, {'value': '105', 'label': 'Julio Mesquita'}, {'value': '347', 'label': 'Lencois Paulista'}, {'value': '245', 'label': 'Lindoia'}, {'value': '452', 'label': 'Lins'}, {'value': '70', 'label': 'Lucianopolis'}, {'value': '430', 'label': 'Luis Antonio'}, {'value': '398', 'label': 'Luiziania'}, {'value': '426', 'label': 'Lupercio'}, {'value': '114', 'label': 'Macatuba'}, {'value': '138', 'label': 'Marilia'}, {'value': '310', 'label': 'Matao'}, {'value': '17', 'label': 'Miguelopolis'}, {'value': '542', 'label': 'Mineiros Do Tiete'}, {'value': '328', 'label': 'Mirassol'}, {'value': '377', 'label': 'Mirassolandia'}, {'value': '456', 'label': 'Mombuca'}, {'value': '376', 'label': 'Monte Alegre Do Sul'}, {'value': '454', 'label': 'Monte Alto'}, {'value': '558', 'label': 'Monte Aprazivel'}, {'value': '299', 'label': 'Monte Azul Paulista'}, {'value': '375', 'label': 'Monte Mor'}, {'value': '479', 'label': 'Morro Agudo'}, {'value': '517', 'label': 'Morungaba'}, {'value': '335', 'label': 'Motuca'}, {'value': '541', 'label': 'Neves Paulista'}, {'value': '72', 'label': 'Nova Europa'}, {'value': '99', 'label': 'Nova Granada'}, {'value': '298', 'label': 'Nova Odessa'}, {'value': '161', 'label': 'Nuporanga'}, {'value': '545', 'label': 'Ocaucu'}, {'value': '49', 'label': 'Olimpia'}, {'value': '503', 'label': 'Onda Verde'}, {'value': '87', 'label': 'Oriente'}, {'value': '318', 'label': 'Orlandia'}, {'value': '334', 'label': 'Palestina'}, {'value': '498', 'label': 'Palmares Paulista'}, {'value': '448', 'label': 'Paraiso'}, {'value': '44', 'label': 'Pardinho'}, {'value': '404', 'label': 'Patrocinio Paulista'}, {'value': '116', 'label': 'Paulinia'}, {'value': '192', 'label': 'Paulistania'}, {'value': '466', 'label': 'Pederneiras'}, {'value': '259', 'label': 'Pedregulho'}, {'value': '418', 'label': 'Penapolis'}, {'value': '248', 'label': 'Piacatu'}, {'value': '31', 'label': 'Pindorama'}, {'value': '204', 'label': 'Piracicaba'}, {'value': '52', 'label': 'Pirajui'}, {'value': '270', 'label': 'Pirangi'}, {'value': '395', 'label': 'Piratininga'}, {'value': '100', 'label': 'Pitangueiras'}, {'value': '291', 'label': 'Poloni'}, {'value': '193', 'label': 'Pompeia'}, {'value': '447', 'label': 'Pongai'}, {'value': '401', 'label': 'Pontal'}, {'value': '372', 'label': 'Potirendaba'}, {'value': '368', 'label': 'Pradopolis'}, {'value': '206', 'label': 'Pratania'}, {'value': '399', 'label': 'Presidente Alves'}, {'value': '490', 'label': 'Promissao'}, {'value': '180', 'label': 'Queiroz'}, {'value': '469', 'label': 'Quintana'}, {'value': '45', 'label': 'Rafard'}, {'value': '433', 'label': 'Reginopolis'}, {'value': '50', 'label': 'Restinga'}, {'value': '396', 'label': 'Ribeirao Bonito'}, {'value': '64', 'label': 'Ribeirao Corrente'}, {'value': '516', 'label': 'Ribeirao Preto'}, {'value': '403', 'label': 'Rifaina'}, {'value': '53', 'label': 'Rincao'}, {'value': '276', 'label': 'Rio Das Pedras'}, {'value': '512', 'label': 'Rubiacea'}, {'value': '146', 'label': 'Sabino'}, {'value': '173', 'label': 'Sales Oliveira'}, {'value': '338', 'label': 'Saltinho'}, {'value': '329', 'label': 'Santa Adelia'}, {'value': '521', 'label': "Santa Barbara D'Oeste"}, {'value': '110', 'label': 'Santa Cruz Da Esperanca'}, {'value': '550', 'label': 'Santa Ernestina'}, {'value': '213', 'label': 'Santa Lucia'}, {'value': '216', 'label': 'Santa Maria Da Serra'}, {'value': '470', 'label': 'Santa Rosa De Viterbo'}, {'value': '157', 'label': 'Santo Antonio Da Alegria'}, {'value': '340', 'label': 'Santo Antonio Do Aracangua'}, {'value': '140', 'label': 'Santo Antonio Do Jardim'}, {'value': '261', 'label': 'Santopolis Do Aguapei'}, {'value': '202', 'label': 'Sao Carlos'}, {'value': '150', 'label': 'Sao Joaquim Da Barra'}, {'value': '460', 'label': 'Sao Jose Da Bela Vista'}, {'value': '168', 'label': 'Sao Jose Do Rio Preto'}, {'value': '523', 'label': 'Sao Manuel'}, {'value': '169', 'label': 'Sao Pedro'}, {'value': '461', 'label': 'Sao Simao'}, {'value': '145', 'label': 'Serra Azul'}, {'value': '265', 'label': 'Serra Negra'}, {'value': '529', 'label': 'Serrana'}, {'value': '289', 'label': 'Sertaozinho'}, {'value': '562', 'label': 'Severinia'}, {'value': '415', 'label': 'Socorro'}, {'value': '177', 'label': 'Sumare'}, {'value': '11', 'label': 'Tabatinga'}, {'value': '226', 'label': 'Taiacu'}, {'value': '467', 'label': 'Taiuva'}, {'value': '96', 'label': 'Tanabi'}, {'value': '531', 'label': 'Taquaral'}, {'value': '524', 'label': 'Taquaritinga'}, {'value': '135', 'label': 'Terra Roxa'}, {'value': '132', 'label': 'Torrinha'}, {'value': '73', 'label': 'Trabiju'}, {'value': '350', 'label': 'Ubarana'}, {'value': '182', 'label': 'Uchoa'}, {'value': '80', 'label': 'Uru'}, {'value': '434', 'label': 'Valinhos'}, {'value': '156', 'label': 'Valparaiso'}, {'value': '530', 'label': 'Vera Cruz - Sp'}, {'value': '323', 'label': 'Viradouro'}, {'value': '364', 'label': 'Vista Alegre Do Alto'}]
      cities = this.SPcities
    } else if (stateNumber === 1) {
      cities = this.SantaCruzCities
    } else if (stateNumber === 2) {
      cities = this.PiratiningaCities
    } else if (stateNumber === 3) {
      cities = this.RScities
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

  private setDate = async (page: puppeteer.Page) => {
    const endOfMonth = moment().add(1, 'month').endOf('month').format('DD/MM/YYYY')

    await page.evaluate((endOfMonth) => {
      const dateSelector = document.getElementById('PeriodoDesligamento')
      const limitInput = dateSelector?.children[2]
    
      if (!!limitInput) {
        limitInput['value'] = endOfMonth
      }
    }, endOfMonth)
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
    // let resultWithUndefined: Array<CPFLDataInterface | undefined> = []

    let resultWithUndefined = await page.evaluate(() => {
      let classes = document.getElementsByClassName('consulta__listagem__resultados__timeline')

      const results = classes[0].children
      let date = ''

      let result = Object.keys(results).slice(1, Object.keys(results).length).map((result => {
        const isDateDiv = Number(result) % 2 !== 0
        
        if (isDateDiv) {
          date = String(results[Number(result)].children[1].textContent)
        
          return undefined
        } else {
          const content = results[Number(result)].children

          // add return of this
          const data = Object.keys(content).map((key, index) => {
            const hour = content[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__horario')[0].textContent
            const reason = content[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__necessidade')[0].textContent?.split(', ')[1]

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

            const districts = content[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__content__item')
            Object.keys(districts).forEach((district, index) => {
              const content = districts[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__content__bairro__descricao')[0]
              const districtContent = String(content.children[1].textContent)
              
              districtsContents.push(String(districtContent))
              data['bairro'] = String(districtContent)

              const streets = districts[index].getElementsByClassName('consulta__listagem__resultados__timeline__item__content__accordion__content__bairro__content')[0].children
              Object.keys(streets).forEach((street, index) => {
                const streetContent = String(streets[index].children[1].textContent)
                
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
              contents: contents.slice(1, contents.length),
              reason: String(reason)
            }
          })

          return data
        }
      }))

      return result
    })
      .catch(error => {
        return []
      })

    resultWithUndefined.forEach((possibleResult) => {
      if (!!possibleResult) {
        result = [ ...result, ...possibleResult ]
      }
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
        finalHour: hours[2],
        reason: cpflData.reason
      }

      return cpflFormattedData
    })

    return data
  }

  private get = async (browser: puppeteer.Browser, { state, city }: getInterface) => {
    const url = this.makeURL(Number(this.getStateNumber(state)))

    const page = await this.newPage(browser)

    await page.goto(url, { waitUntil: 'load' })
      .catch(error => {})
    
    await this.selectToCity(page)
    await this.setDate(page)

    const cities = this.citiesToState(Number(this.getStateNumber(state)))
    if (!!cities) {
      await this.searchWithCity(page, this.getCityCode(cities, city))
    }

    const result = await this.getData(page)
    const dataFormatted = this.formatData(result)

    await page.close()
      .catch(error => {})

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
    let duration = this.getDurationInSeconds(
      this.formatDateToGetDuration(data.date, data.initialHour),
      this.formatDateToGetDuration(data.date, data.finalHour)
    )

    const moreThanHalfDay = Number(data.initialHour.split(':')[0]) > 12
    const nextDayhour  = Number(data.finalHour.split(':')[0]) < 12
    let finalDate = data.date

    if (moreThanHalfDay && nextDayhour) {
      const newDate = moment(this.formatDateToGetDuration(data.date, data.finalHour)).add(1, 'day').format('DD/MM/YYYY HH:mm')
      const date = newDate.split(' ')[0]

      duration = this.getDurationInSeconds(
        this.formatDateToGetDuration(data.date, data.initialHour),
        this.formatDateToGetDuration(date, data.finalHour)
      )

      finalDate = moment(this.formatDateToGetDuration(data.date, data.finalHour)).add(1, 'day').format('DD/MM/YYYY')
    }

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
            reason: data.reason,
            
            initial_hour: `${data.date} - ${data.initialHour}`,
            final_hour: `${finalDate} - ${data.finalHour}`,
            duration: duration,

            final_maintenance: finalMaintenance,
            final_seconds: finalSeconds,
          })
        }
      }
    }
  }

  private updateTime = async ({ state, city }: updateCPFLTimeInterface) => {
    const convertHour = Number(process.env.CONVERT_TO_TIMEZONE)

    const CPFLDataOfStateAndCity = await cpflDataRepository.index({
      state,
      city
    })

    for (let index = 0; index < CPFLDataOfStateAndCity.length; index++) {
      const cpflData = CPFLDataOfStateAndCity[index]
      
      if (cpflData.status !== this.convertStatusStringToNumber('finished')) {
        const actualDate = moment().subtract(convertHour, 'hours').format('DD/MM/YYYY HH:mm')

        let finalSeconds = this.getDurationInSeconds(
          this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
          this.formatDateToGetDuration(cpflData.date, cpflData.initial_hour.split(' ')[2])
        )
        let finalMaintenance = this.getDurationInSeconds(
          this.formatDateToGetDuration(actualDate.split(' ')[0], actualDate.split(' ')[1]),
          this.formatDateToGetDuration(cpflData.date, cpflData.final_hour.split(' ')[2])
        )

        if (finalSeconds < 0) {
          finalSeconds = 0
        }

        if (finalMaintenance < 0) {
          finalMaintenance = 0
        }

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

  private formatCPFLDataToPublicAccess = (CPFLDataArray: Array<CPFLDataDatabaseInterface>) => {
    return CPFLDataArray.map((registry) => {
      const initalDate = registry.initial_hour.split(' - ')
      const finalDate = registry.final_hour.split(' - ')

      const duration = this.getDuration(
        this.formatDateToGetDuration(initalDate[0], initalDate[1]),
        this.formatDateToGetDuration(finalDate[0], finalDate[1])
      )

      // ['paulista', 'santa cruz', 'piratininga', 'rio grande do sul']

      return {
        ...registry,
        duration: duration,
        state: registry.state !== 'rio grande do sul' ? 'São Paulo' : 'Rio Grande do Sul'
      }
    })
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
    const browser = await this.runBrowser()
    const dataFormatted = await this.get(browser, { state: 'paulista', city: 'Araraquara' })

    const requests = dataFormatted.map(async (data) => {
      await this.updateCPFLData({ data, state: 'paulista', city: 'Aguas De Lindoia' })
    })
    await Promise.all(requests)

    await this.closeBrowser(browser)

    return res.status(200).json({
      message: 'ok',
      data: dataFormatted
    })
  }

  public runCpflRoutine = async (browser: puppeteer.Browser, state: string, city: string) => {
    const dataFormatted = await this.get(browser, { state: state, city: city })
    
    const requests = dataFormatted.map(async (data) => {
      await this.updateCPFLData({ data, state: state, city: city })
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

  public getCPFLStateJson = async (req: Request, res: Response) => {
    const { state } = req.params

    let stateFormatted = ''

    switch (state) {
      case 'sp':
        stateFormatted = 'paulista'
        break;
      case 'sc':
        stateFormatted = 'santa cruz'
        break;
      case 'pt':
        stateFormatted = 'piratininga'
        break;
      case 'rs':
        stateFormatted = 'rio grande do sul'
        break;
      default:
        break;
    }

    let data = await cpflDataRepository.index({ state: stateFormatted })
    let formattedData = this.formatCPFLDataToPublicAccess(data)

    if (state === 'all') {
      data = await cpflDataRepository.index({})
      formattedData = this.formatCPFLDataToPublicAccess(data)
    }

    return res.status(200).json({
      data: formattedData
    })
  }

  public getCPFLCityJson = async (req: Request, res: Response) => {
    const { state, city } = req.params

    const data = await cpflDataRepository.index({ state, city })
    const formattedData = this.formatCPFLDataToPublicAccess(data)

    return res.status(200).json({
      data: formattedData
    })
  }

  private convertStateString = (state: string) => {
    let stateFormatted = state

    switch (state) {
      case 'sp':
        stateFormatted = 'paulista'
        break;
      case 'sc':
        stateFormatted = 'santa cruz'
        break;
      case 'pt':
        stateFormatted = 'piratininga'
        break;
      case 'rs':
        stateFormatted = 'rio grande do sul'
        break;
      default:
        break;
    }

    return stateFormatted
  }

  private haveCityInDataFormatted = (array: statusCountInterface, cityName: string) => {
    let have = false

    array.forEach((data => {
      if (data.name === cityName) {
        have = true
      }
    }))

    return have
  }
  
  private haveCityInDataFormattedReasons = (array: reasonsCountInterface, cityName: string) => {
    let have = false

    array.forEach((data => {
      if (data.name === cityName) {
        have = true
      }
    }))

    return have
  }

  private convertState = (state: string) => {
    let stateFormatted = ''

    switch (state) {
      case 'paulista':
        stateFormatted = 'Paulista'
        break;
      case 'santa cruz':
        stateFormatted = 'Santa Cruz'
        break;
      case 'piratininga':
        stateFormatted = 'Piratininga'
        break;
      case 'rio grande do sul':
        stateFormatted = 'Rio Grande do Sul'
        break;
      default:
        break;
    }

    return stateFormatted
  }

  public getCountStatus = async (req: Request, res: Response) => {
    const { state } = req.params
    const { bairro, rua } = req.query

    const formattedState = this.convertStateString(state)
    const convertHour = Number(process.env.CONVERT_TO_TIMEZONE)
    const actualDate = moment().subtract(convertHour, 'hours').format('DD/MM/YYYY')

    const data = await cpflDataRepository.indexPerDate({ 
      date: actualDate, 
      state: formattedState !== 'undefined' && formattedState !== 'all' && formattedState.length > 0 ? formattedState : undefined,
      district: String(bairro) !== 'undefined' ? String(bairro) : undefined,
      street: String(rua) !== 'undefined' ? String(rua) : undefined,
    })
    let dataFormatted: statusCountInterface = []

    data.forEach((cpflData) => {
      const haveCity = this.haveCityInDataFormatted(dataFormatted, cpflData.city)

      if (haveCity) {
        dataFormatted.forEach((formattedData) => {
          if (formattedData.name === cpflData.city) {
            if (cpflData.status === 2) {
              formattedData.status_agendamento = formattedData.status_agendamento + 1
            } else if (cpflData.status === 3) {
              formattedData.status_emAndamento = formattedData.status_emAndamento + 1
            } else  {
              formattedData.status_concluidas = formattedData.status_concluidas+ 1
            }
          }
        })
      } else {
        if (cpflData.status === 2) {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            status_agendamento: 1,
            status_emAndamento: 0,
            status_concluidas: 0
          })
        } else if (cpflData.status === 3) {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            status_agendamento: 0,
            status_emAndamento: 1,
            status_concluidas: 0
          })
        } else  {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            status_agendamento: 0,
            status_emAndamento: 0,
            status_concluidas: 1
          })
        }
      }
    })

    return res.status(200).json({
      data: dataFormatted
    })
  }

  public getCountReasons = async (req: Request, res: Response) => {
    const { state } = req.params
    const { bairro, rua } = req.query

    const formattedState = this.convertStateString(state)
    const convertHour = Number(process.env.CONVERT_TO_TIMEZONE)
    const actualDate = moment().subtract(convertHour, 'hours').format('DD/MM/YYYY')

    const data = await cpflDataRepository.indexPerDate({ 
      date: actualDate,
      state: formattedState !== 'undefined' && formattedState !== 'all' && formattedState.length > 0 ? formattedState : undefined,
      district: String(bairro) !== 'undefined' ? String(bairro) : undefined,
      street: String(rua) !== 'undefined' ? String(rua) : undefined,
    })
    let dataFormatted: reasonsCountInterface = []

    data.forEach((cpflData) => {
      const haveCity = this.haveCityInDataFormattedReasons(dataFormatted, cpflData.city)

      if (haveCity) {
        dataFormatted.forEach((formattedData) => {
          if (formattedData.name === cpflData.city) {
            if (cpflData.reason === 'Manutencao') {
              formattedData.total_manutencao += 1
            } else if (cpflData.reason === 'Obra') {
              formattedData.total_obra += 1
            } else if (cpflData.reason === 'Preventivo') {
              formattedData.total_preventivas += 1
            } else if (cpflData.reason === 'Melhoria') {
              formattedData.total_melhorias += 1
            } else if (cpflData.reason === 'Documento Reserva') {
              formattedData.total_documentoReserva += 1
            } else if (cpflData.reason === 'Obra de Terceiros') {
              formattedData.total_obraDeTerceiros += 1
            } else {
              formattedData.total_outros += 1
            }
          }
        })
      } else {
        if (cpflData.reason === 'Manutencao') {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 1,
            total_obra: 0,
            total_melhorias: 0,
            total_preventivas: 0,
            total_obraDeTerceiros: 0,
            total_documentoReserva: 0,
            total_outros: 0
          })
        } else if (cpflData.reason === 'Obra') {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 0,
            total_obra: 1,
            total_melhorias: 0,
            total_preventivas: 0,
            total_obraDeTerceiros: 0,
            total_documentoReserva: 0,
            total_outros: 0
          })
        } else if (cpflData.reason === 'Preventivo') {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 0,
            total_obra: 0,
            total_melhorias: 0,
            total_preventivas: 1,
            total_obraDeTerceiros: 0,
            total_documentoReserva: 0,
            total_outros: 0
          })
        } else if (cpflData.reason === 'Melhoria') {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 0,
            total_obra: 0,
            total_melhorias: 1,
            total_preventivas: 0,
            total_obraDeTerceiros: 0,
            total_documentoReserva: 0,
            total_outros: 0
          })
        } else if (cpflData.reason === 'Obra de Terceiros') {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 0,
            total_obra: 0,
            total_melhorias: 0,
            total_preventivas: 0,
            total_obraDeTerceiros: 1,
            total_documentoReserva: 0,
            total_outros: 0
          })
        } else if (cpflData.reason === 'Documento Reserva') {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 0,
            total_obra: 0,
            total_melhorias: 0,
            total_preventivas: 0,
            total_obraDeTerceiros: 0,
            total_documentoReserva: 1,
            total_outros: 0
          })
        } else {
          dataFormatted.push({
            name: cpflData.city,
            state: this.convertState(cpflData.state),
            total_manutencao: 0,
            total_obra: 0,
            total_melhorias: 0,
            total_preventivas: 0,
            total_obraDeTerceiros: 0,
            total_documentoReserva: 0,
            total_outros: 1
          })
        }
      }
    })

    return res.status(200).json({
      data: dataFormatted
    })
  }

  public getSummary = async (req: Request, res: Response) => {
    const tomorrowDayDate = moment().subtract(1, 'days').format('DD/MM/YYYY')
    const actualDate = moment().format('DD/MM/YYYY')
    const nextDayDate = moment().add(1, 'days').format('DD/MM/YYYY')

    const onSchedule = await cpflDataRepository.indexPerDate({
      date: actualDate,
      status: 2
    })

    const executeIn20Minutes = await cpflDataRepository.index({
      date: actualDate,
      status: 5
    })

    const inMaintenance = await cpflDataRepository.index({
      status: 3,
      date: actualDate
    })

    const maintanceSchedulein24h = await cpflDataRepository.indexPerDateWithLimit({
      status: 2,
      lowerLimit: actualDate,
      higherLimit: nextDayDate
    })
    
    const finishedIn24h = await cpflDataRepository.indexPerDateWithLimit({
      status: 4,
      lowerLimit: tomorrowDayDate,
      higherLimit: actualDate
    })

    return res.status(200).json({
      data: {
        totalDeAgendamentos: onSchedule.length,
        manutencoesAgora: inMaintenance.length,
        manutencoesEm24h: maintanceSchedulein24h.length,
        concluidasEm24h: finishedIn24h.length,
        paraIniciaremEm20min: executeIn20Minutes.length
      }
    })
  }

  public updateManually = async (req: Request, res: Response) => {
    const { state, city } = req.params

    console.log('object')

    const browser = await this.runBrowser()

    await this.runCpflRoutine(browser, String(state), String(city))
      .catch(error => {})

    await this.closeBrowser(browser)

    return res.status(200).json({
      message: 'serviço atualizado com sucesso!'
    })
  }
}