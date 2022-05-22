const fs = require('fs');
const app = require('turbo-http');
const port = +process.argv[2] || 3000;

const client = require('redis').createClient();
const server = app.createServer(serveApp);
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', async () => {
    await client.ping();
    console.log(`Challenge app listening at http://0.0.0.0:${port}`);
    server.listen(port);
});

const readyMessage = '{"ready": true}';
const defaultMessage = '{"id":"ALL CARDS"}';
const cards = (() => {
    let output = JSON.parse(fs.readFileSync('./cards.json'));
    output.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
    output.unshift({ id: 'NEVER USED' });
    output = output.map(card => Buffer.from(JSON.stringify(card)));
    return output;
})();

async function serveApp(req, res) {
    if (req.url[1] === 'c') {
        const card = cards[await client.incr(req.url)] || defaultMessage;
        res.end(card);
        return;
    }

    res.end(readyMessage);
    return;
}

client.connect();
