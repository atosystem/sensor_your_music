const WS_PORT = 3005
const WebServer_PORT = 3006
const UDP_PORT = 9999
const express = require('express');
const app = express();
const udp = require("dgram")

// serve localhost webpage
app.use(express.static(__dirname + "/dist"));

const buffer = require("buffer")
const udpClient = udp.createSocket("udp4")


app.listen(WebServer_PORT);

console.log(`Webserver Running at Port ${WebServer_PORT}`);
console.log(`Localhost server page at http://localhost:${WebServer_PORT}`)

// websocket
const SocketServer = require('ws').Server
const server = express()
    .listen(WS_PORT, () => console.log(`[ws]Listening on ${WS_PORT}`))
const wss = new SocketServer({ server })

wss.on('connection', ws => {
  console.log('Client connected')

  ws.on('message', data => {
      // console.log(`[ws] from client : ${data}`)
      data = String(data)
      let _udpPort = data.split(":")[0]
      let _d = Buffer.from(`${data.split(":")[1]}\n`)
      udpClient.send(_d,_udpPort,'localhost',function(error){
        if(error){
          console.log("[udp] error")
          client.close();
        }else{
          // console.log('Data sent !!!');
        }
      });
  })

  ws.on('close', () => {
      console.log('[ws]Close connected')
  })
})