'use strict';

const express = require('express');
const fs = require('fs');
const url = require('url');
const bodyParser = require('body-parser');

const expressServer = express();

// Express-Middleware
expressServer.use(express.static('public'));
expressServer.use(bodyParser.json());

// HTTP
const http = require('http');
const httpServer = http.Server(expressServer);

// Websocket
const socketIo = require('socket.io');
const io = socketIo(httpServer);

io.on('connect', socket => {
    // Die individuelle Verbindung ist im socket abgelegt
    console.log(socket.id);

    // Sofortige Antwort
    socket.emit('nachricht', JSON.stringify('Du hast die ID ' + socket.id));
});

// virtuelle Pfade, z.B. /rechne
expressServer.get('/rechne', (req, res) => {
    const query = url.parse(req.url, true).query;
    // Rückgabe muß ein String sein, da eine Number als Status fehlinterpretiert werden würde
    res.send(String(Number(query.x) * Number(query.y)));
});

expressServer.post('/multipliziere', (req, res) => {
    res.send(String(Number(req.body.x) * Number(req.body.y)));
});

httpServer.listen(8080, err => console.group(err || 'Server läuft'));