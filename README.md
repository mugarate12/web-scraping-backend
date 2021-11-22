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
- **[Redis](https://redis.io/)**

## Instalação

### Crominium
1. na raiz do projeto, vá até cd ./node_modules/puppeteer
```bash
$ cd ./node_modules/puppeteer
```

2. instale todas as dependências dele
```bash
$ npm run install
```

3. caso necessário, instale todas as dependências necessárias no Debian
```bash
$ Sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Install Redis:
```bash
$ curl https://packages.redis.io/gpg | sudo apt-key add -
```
```bash
$ echo "deb https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
```
```bash
$ sudo apt-get update
```
```bash
$ sudo apt-get install redis
```

### Configuração do Bando de dados

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

### Execute o Redis server
```bash
$ redis-sever
```

### Desenvolvimento
```bash
$ npm run dev
```

### Produção
1. rode o build do projeto e aguarde a compilação
```bash
$ npm start
```

2. execute o projeto, ele ficará escutando na porta 3333
```bash
$ npm start
```