const fs = require('fs');
const app = require('turbo-http');
const port = +process.argv[2] || 3000;

const client = require('redis').createClient();
const server = app.createServer(serveApp);
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', () => {
    console.log(`Challenge app listening at http://0.0.0.0:${port}`);
    server.listen(port);
});

const readyMessage = '{"ready": true}';
const defaultMessage = '{"id":"ALL CARDS"}';
const cards = (() => {
    let output = JSON.parse(fs.readFileSync('./cards.json'));
    output.unshift({ id: 'NEVER USED' });
    output = output.map(card => Buffer.from(JSON.stringify(card)));
    return output;
})();

async function serveApp(req, res) {
    if (req.url.startsWith('/c')) {
        const card = cards[await client.incr(req.url.substr(13))] || defaultMessage;
        res.setHeader('Content-Length', card.length);
        res.end(card);
        return;
    }

    res.setHeader('Content-Length', readyMessage.length);
    res.end(readyMessage);
    return;
}

client.connect();
