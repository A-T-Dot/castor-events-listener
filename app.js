const Koa = require('koa'),
  route = require('koa-route'),
  // https://github.com/kudos/koa-websocket
  websockify = require('koa-websocket');
const chain = require('./chain');

const app = websockify(new Koa());

let WS = null;

const PROVIDER = 'ws://127.0.0.1:9944';
// const PROVIDER = 'wss://polkadot:9944';

function run () {
  console.log('Start.');
  // get balance or other function
  const demoAddr = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
  chain.getBalance(
    demoAddr,
    (balance) => {
      console.log(`${demoAddr} balance: ${balance}`);
    }
  );
}

function subscribe (header, WS) {
  // TODO save to db
  WS.send(`{"data": "Chain is at #${header.number}"}`);
  console.log(`Chain is at #${header.number}`)
}

app.ws.use(route.all('/ws', (ctx) => {
  // TODO query from db, ws push
  WS = ctx.websocket 
  WS.send('{"data": "Hello Castor"}');
  chain.init(PROVIDER, run, subscribe, WS);

  WS.on('message', function (message) {
    console.log(message);
  });
}));

app.use(route
  .get('/call', (ctx) => {
    ctx.body = 'Hello Castor';
  })
);

app.listen(7000);