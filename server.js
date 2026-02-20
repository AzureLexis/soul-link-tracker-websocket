const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clientCounter = 0;

wss.on('connection', function connection(ws) {
  
  ws.id = 'ws-id-'+clientCounter;
  clientCounter++;
  
  ws.on('message', function message(data) {
    let msg = JSON.parse(data);
    
    if(typeof msg['type'] !== 'undefined'){
      switch (msg['type']) {
        case 'ping':
          ws.send('pong');
          break;
        case 'startSession':
          if(typeof msg['uuid'] !== 'undefined'){
            handleSessionJoin(ws,msg['uuid']);
            ws.send('pong');
          }
          break;
        default:
            [...wss.clients].filter(client => client.session_id === ws.session_id && client.id !== ws.id).forEach(client => {
              client.send(JSON.stringify(msg));
            });
          break;
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WS error:', err);
  });

  ws.on('close', function message(data) {
    console.log('Connection closed: ', data);
    let clients = [...wss.clients].filter(client => client.session_id === ws.session_id && client.id !== ws.id);
    if(typeof clients[0] !== 'undefined'){
      clients[0].send(JSON.stringify({'type':'setHost'}));
    }
  });

  ws.send('Welcome to the WebSocket server!');
});

function handleSessionJoin(ws, uuid) {
  ws.session_id = uuid;
  if([...wss.clients].filter( client => client.session_id === uuid).length === 1) {
    ws.send(JSON.stringify({'type':'setHost'}));
  }else{
    [...wss.clients].forEach(client => {
      client.send({'type':'syncRequest'});
    });
  }
}