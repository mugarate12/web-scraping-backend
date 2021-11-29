## Web Scraping API
- [Overview](#overview)
- [Requerimentos](#requerimentos)
- [Instalação](#instalação)
- [Executar servidor](#executar-servidor)

## Overview

RESTful API criada em NodeJS para execução de rotinas para realização de monitoramento das informações geradas pelo Down Detector.

## Requerimentos

A instalação das ferramentas para Debian está descrita abaixo na sessão **[Instalação](#instalação)**

- **[Node.js e NPM](https://www.nodejs.org/)** (suportadas versões: 10.x.x)
- **[Maria Db](https://mariadb.org/)**
- **[Redis](https://redis.io/)**
- **[PM2](https://pm2.io/docs/plus/overview/)**

## Instalação

### NodeJS and NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
```
```bash
apt-get install -y nodejs
```

### Crominium
1. na raiz do projeto, vá até cd ./node_modules/puppeteer
```bash
$ cd ./node_modules/puppeteer
```

2. instale todas as dependências dele
```bash
$ npm run install
```

3. caso necessário, instale todas as dependências necessárias no Debian para execução do navegador (Chromium)
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

### Install PM2

#### One way: Curl Method
```bash
apt update && apt install sudo curl && curl -sL https://raw.githubusercontent.com/Unitech/pm2/master/packager/setup.deb.sh | sudo -E bash -
```

#### Two way yarn or npm:
```bash
npm install pm2 -g
```

#### Install auto complete of PM2
```bash
pm2 completion install
```

#### Update PM2
```bash
npm install pm2 -g && pm2 update
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

Você pode executar todos os comandos manualmente, ou executar um único comando composto

### Manual

#### Execute o Redis server
```bash
$ redis-sever
```

#### Altere as variavéis de update das rotinas para true
```bash
$ redis-cli set finished_routine_1 1
```
```bash
$ redis-cli set finished_routine_3 1
```
```bash
$ redis-cli set finished_routine_5 1
```
```bash
$ redis-cli set finished_routine_10 1
```
```bash
$ redis-cli set finished_routine_15 1
```

#### Limpe os logs anteriores
```bash
$ pm2 flush
```

#### Execute a compilação dos arquivos para produção
```bash
$ npm run build
```

#### Desenvolvimento

Por padrão, o servidor de desenvolvimento vai usar um banco local com as variaveis listadas no `.env` como descritas em `.env.example` e excluirá todos os dados anteriores, para esse comportamento, execute:
```bash
$ npm run dev
```

Caso queira executar sem excluir as informações já presentes, execute:
```bash
$ npm run dev-without-rollback
```

#### Produção
1. rode o build do projeto e aguarde a compilação
```bash
$ npm start
```

2. execute o projeto, ele ficará escutando na porta 3333
```bash
$ npm start
```

### Automático
Caso queria executar todos os processos listados acima com um único comando

#### Desenvolvimento com rollback
Essa rotina vai executar a api em homologação apagando todos os atuais dados no banco local:
```bash
$ npm run development
```

#### Desenvolvimento sem rollback
Para não apagar os atuais dados do banco local:
```bash
$ npm run development-without-rollback
```

#### Produção
```bash
$ npm run production
```

## Logs

Para ver os logs da aplicação, execute:
```bash
$ npm run show-logs
```

#### Parar a execução da API em produção
Para fazer o pm2 para a execução do servidor, execute:
```bash
$ npm run stop-production
```
