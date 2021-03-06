# Jass Challenge [![Build Status](https://travis-ci.org/JoelNiklaus/jass-server.svg?branch=master)](https://travis-ci.org/JoelNiklaus/jass-server)

### Deployment

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

If this Server should be used with the JassTheRipper bot, at least 2GB RAM and multiple CPUs are recommended.

### Wiki
https://github.com/webplatformz/challenge/wiki

### Styleguide
https://github.com/RisingStack/node-style-guide

### Build Server
https://travis-ci.org/webplatformz/challenge

## What is it?
The idea of this project is to run as a server whilst bots or humans play Jass (Schieber) against each other. It has two basic modes that clients can select to play.

Single Game Mode: Just one game that will start as soon as 4 players are connected to it. When one team reaches 2500 points it will be finished and every client of this session will be disconnected.

Tournament Mode: This mode has to be started over the Web Frontend of the server. Any number of bots can join this tournament. Since Schieber Jass is always played as a team, you have to connect two instances of every bot. This is validated with the name of the bot. When every bot has two instances connected, you can start the tournament over the UI and then every bot will be matched against all other bots at least once. Depending on your setting of rounds in the tournament (see [Environment Section](#environment-variables)) it can be more than once.

## Installation

You only need NodeJS to run this server. If you don't want to install NodeJS on your machine see: [Docker Section](#docker-container)

### NodeJS
Installing node.js: 

See http://nodejs.org/download/

Install node modules:
```sh
$ npm install
```

Start the server:
```sh
$ npm start
```

Add any environment variables with 'env' (check environmentUtil.js for available ENV variables):
```sh
$ env TOURNAMENT_LOGGING=true PORT=80 MAX_POINTS=1000 npm start
```

Run the server as a background process on a production server:
```sh
$ sudo npm run start # this has to be run first in order to build the app
$ sudo nohup sh start_https.sh &
```

### Docker Container
If you want to run the server in a docker container you can find a Dockerfile in this repo.

Build it and run it with:
```sh
docker build . -t jasschallenge # '.' is the directory of the repo
docker run -it --rm --name cs -p 3000:3000 jasschallenge
```
### Environment Variables
There are some env variables you can set to alter the behaviour of the server.

* TOURNAMENT_ROUNDS

  A number that represents the amount of rounds a tournament will run. Each round all bots will play once against all other bots. Defaults to 1.
  
  The Dockerfile already contains this environment variable and sets it to 5. So if you start the server with docker, default will be 5. To change this, simply edit the Dockerfile and build the image again like shown above.
* TOURNAMENT_LOGGING

  Boolean, if set to true, the server will store a json file for each game (Bot vs. Bot) with all the messages for parsing. These messages will be stored to the base directory of this repo.
* TOURNAMENT_COUNTING

  Boolean, if set to true, the server will count all modes without any multiplications (e.g. factor 3 for obenabe or undenufe will not be used).
  
* PORT

  Integer, the port to run the server on

## Development
While developing you might want to run the server with a watch task. You can either use:
```sh
npm run start:watch
```

This task will start all the other tasks in watch mode. You can also start them directly. E.g.:

```sh
npm run build:js:frontend:watch
```
For more information check the package.json

To get more debug output there is a 'debug' task too:
```
<-- Start Broadcast: 
<-- Send Message: {"type":"BROADCAST_WINNER_TEAM","data":{"name":"Team 2","points":0,"currentRoundPoints":0}}
<-- Send Message: {"type":"REQUEST_PLAYER_NAME"}
<-- Received Message: {"type":"CHOOSE_PLAYER_NAME","data":"PlayerName"}
<-- Send Message: {"type":"REQUEST_SESSION_CHOICE","data":[]}
<-- Received Message: {"type":"CHOOSE_SESSION","data":{"sessionChoice":"AUTOJOIN"}}
<-- Start Broadcast: 
<-- Send Message: {"type":"BROADCAST_SESSION_JOINED","data":{"name":"PlayerName","id":0}}
End Broadcast -->
```

or if you just want to start the server without watching and debug output use:

```sh
$ npm start
```

## Experiments
In order to see how many times the bots lost navigate into the folder with the results and run the following command:
```sh
$ grep -or "BROADCAST_WINNER_TEAM\",\"data\":{\"name\":\"Team 1\",\"points\":.*" .
```

## TechStack
- ECMA Script 6
- NodeJs
- Mocha
- Karma
- Express
- WebSockets
- React
- Flux


## SSH certificates
- run server with `node server/certbot_server.js`
- on client system run `sudo certbot certonly --manual`
- make sure the filename and the file's content in certbot/.well-known/acme-challenge match with the output of the above command!
- auto renewal every 60 minutes: run `sudo crontab -e` and add: `59 * * * * sudo certbot renew`
- stop certbot_server