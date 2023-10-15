var fs = require('fs')
var ini = require('ini')

var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'))

// auth settings
// fill out user_id and client_id in the config.ini file
const PORT = 3000
const USER_ID = config.api.user_id || '';
const CLIENT_ID = config.api.client_id || '';
var OAUTH_TOKEN = config.api.oauth_token || '';

const redirect_uri = 'http://localhost:' + PORT + '/token&force_verify=true&scope=chat:edit+chat:read';
const server_api_url = 'https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=' + CLIENT_ID + '&redirect_uri=' + redirect_uri;

const express = require('express');

const app = express();
const { createServer } = require("http");

// serve static content from the project's public folder:
app.use('/static', express.static('public'));

// make an instance of http server using express instance:
const server = createServer(app);

// this runs after the http server successfully starts:
function serverStart() {
    var port = this.address().port;
    console.log("this Server listening on port " + port);
}

app.get('/', (req, res, next) => {
    console.log(config.foo);
    if (typeof OAUTH_TOKEN !== 'undefined' && OAUTH_TOKEN) {
        res.send('OAUTH_TOKEN is configured.<br/>You can renew here <a href="' + server_api_url + '">' + server_api_url + '</a> to reconfigure oauth token.');
    } else {
        res.send('OAUTH_TOKEN is not configured.<br/>Please visit <a href="' + server_api_url + '">' + server_api_url + '</a> to configure oauth token.');
    }
})

app.all('/token', (req, res, next) => {
    console.log('function - token')
    res.sendFile(__dirname + '/public/redirect-access-token.html');
})

app.get('/store-token/:token', (req, res, next) => {
    console.log('function - store-token')
    config.api.oauth_key = req.params.token;
    fs.writeFile('./config.ini', ini.stringify(config), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Config file updated with token.");
    });

    //twitchChat(req.params.token)
    res.sendFile(__dirname + '/public/token-success.html');
})

server.listen(process.env.PORT || PORT, serverStart);

function twitchChat(token) {
    const tmi = require('tmi.js');

    const client = new tmi.Client({
        options: { debug: true },
        identity: {
            username: USER_ID,
            password: 'oauth:' + token
        },
        channels: [USER_ID]
    });

    client.on('join', (channel, username, isSelf) => {
        if (!isSelf) {
            return;
        }
        client.say(channel, 'Hello, the time is : ' + new Date())
            .then(data => {
                console.log(`Sent "${data[1]}" to`, data[0].slice(1));
            })
            .catch(err => {
                console.log('[ERR]', err);
            });
    });

    client.connect();
}

