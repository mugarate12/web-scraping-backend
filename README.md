## Web Scraping API
- [Overview](#overview)
- [Requerimentos](#requerimentos)
- [Instalação](#instalação)
- [Executar servidor](#executar-servidor)

## Overview

RESTful API criada em NodeJS para execução de rotinas para realização de monitoramento das informações geradas pelo Down Detector.

## Requerimentos

- **[Node.js e NPM](https://www.nodejs.org/)** (suportadas versões: 10.x.x)
- **[Maria Db](https://mariadb.org/)**

## Instalação

### MySQL Configuration

#### Se você for rodar a aplicação em modo de homologação
1. create "web_scraping" database

#### Se vou quer rodar a aplicação em modo de produção
- ** Crie um banco de dados com o mesmo nome informado no arquivo .env
- All configurations included in env variables

### Env variáveis
1. crie um arquivo `.env` como o arquivo `.env.example`
2. mude essas configurações de acordo com os dados do seu banco de dados

### Instalar todas as dependências/módulos
```bash
$ npm install 
```

## Executar servidor

### Desenvolvimento
```bash
$ npm run dev
```

### Produção
```bash
$ npm start
```