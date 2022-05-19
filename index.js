const fs = require('fs');;
const app = require('express')();
const port = +process.argv[2] || 3000;

const client = require('redis').createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', () => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`);
    });
});

const defaultMessage = {id: 'ALL CARDS'};
const cards = (() => {
    const output = JSON.parse(fs.readFileSync('./cards.json'));
    output.unshift({id: 'NEVER USED'});
    return output;
})();

const getMissingCard = async (key) => cards[await client.incr(key)] || defaultMessage

app.get('/card_add', async (req, res) => res.send(await getMissingCard(req.query.id)) );

app.get('/ready', async (req, res) => {
    await client.ping();
    res.send({ready: true});
});

client.connect();