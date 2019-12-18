'use strict';

const express = require('express');
const fs = require('fs');
const url = require('url');
const bodyParser = require('body-parser');

const server = express();

// Express-Middleware
server.use(express.static('public'));
server.use(bodyParser.json());

// virtuelle Pfade, z.B. /rechne
server.get('/rechne', (req, res) => {
    const query = url.parse(req.url, true).query;
    // Rückgabe muß ein String sein, da eine Number als Status fehlinterpretiert werden würde
    res.send(String(Number(query.x) * Number(query.y)));
});

server.post('/multipliziere', (req, res) => {
    res.send(String(Number(req.body.x) * Number(req.body.y)));
});

server.listen(8080, err => console.group(err || 'Server läuft'));