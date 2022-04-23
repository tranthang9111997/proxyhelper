

var express = require('express');
var router = express.Router();
const proxy_model = require("../model/proxy");
const proxy_custom=require("../model/proxy_custom");
const port_main=require("../model/port_custom");
const ProxyChain = require('proxy-chain');
const kill = require('kill-port');
var net = require('net');
var http = require('http');
const proxyTypeList = ["auth","none","custom"];

router.get("/", async(req,res) => {
    // const {type} = req.query;
    // if (proxyTypeList.indexOf(type) < 0) return res.status(400).send("Specific proxies type");

    // const proxies = await Proxy.find({type: type});

    // if (proxies.length == 0) return res.send("No proxies"); 

    // let minNumber = proxies[0].numberOfConnection;
    // let selectedProxy = proxies[0];
    // for (let i = 0; i < proxies.length ; i ++){
        
    //     if (proxies[i].numberOfConnection < minNumber){
    //         minNumber = proxies[i].numberOfConnection;
    //         selectedProxy = proxies[i];
    //     } 
        
    // }
    // const updatedProxy = await Proxy.findOneAndUpdate({_id: selectedProxy._id},{numberOfConnection: selectedProxy.numberOfConnection + 1});

    // return res.send(updatedProxy); 
    const proxies = await Proxy.find({});
    return res.send(proxies);
})
router.post("/",async  (req,res,next) => {
  const {proxy,type} = req.body;

  if (proxyTypeList.indexOf(type) < 0) return res.status(400).send("Bad Request");

  const props = proxy.split(':');

  if (type == "auth"){
    const newCreatedProxy = await Proxy.create({
      host: props[0],
      port: props[1],
      username: props[2],
      password: props[3],
      type: type,
      fowardPort: 0
    })
    return res.send(newCreatedProxy);
  } 
  if (type == "none"){
    const newCreatedProxy = await Proxy.create({
        host: props[0],
        port: props[1],
        type: type,
        fowardPort: 0
    })
    return res.send(newCreatedProxy);
  }

  return res.send("Invalid parameters");

})

router.get("/view", async(req,res)=>{
    res.render("proxy",{"title": "Proxy Manager"});
})

function createProxy(proxy,port){
  const server = new ProxyChain.Server({
      // Port where the server will listen. By default 8000.
      port: port,
      // Enables verbose logging
      verbose: true,
      prepareRequestFunction: ({ request, username, password, hostname, port, isHttp, connectionId }) => {
            let proxyUrl = null;
            if (proxy.type == "auth"){
                proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
            }
            if (proxy.type == "none"||proxy.type == "custom"){
                proxyUrl = `http://${proxy.host}:${proxy.port}`;
            }
            if (proxyUrl == null) return;
            return {
              upstreamProxyUrl: proxyUrl ,
              failMsg: 'Bad username or password, please try again.',
            };
      },
  });
  server.listen(() => {
    console.log(`Proxy server is listening on port ${server.port}`);
  });
  server.on('connectionClosed', ({ connectionId, stats }) => {
    console.log(`Connection ${connectionId} closed`);
    console.dir(stats);
  });
  // Emitted when HTTP request fails
  server.on('requestFailed', ({ request, error }) => {
    console.log(`Request ${request.url} failed`);
    console.error(error);
  });
}
// function request(){
//   http.get('http://localhost:8000/proxies/reloadcustom?type=custom', function(response) {
//   console.log('Status:', response.statusCode);
//   console.log('Headers: ', response.headers);
//   response.pipe(process.stdout);
// });
// }
router.loadProxies = async function loadProxies(proxies){

  for (let i = 0; i < proxies.length; i ++){
    createProxy(proxies[i], 1710 + i);
    await Proxy.findOneAndUpdate({"_id": proxies[i]._id},{fowardPort: 1710+i})
  }
}
  router.get("/reloadcustom", async(req,res) => {
    
    const {type} = req.query;
    if (proxyTypeList.indexOf(type) < 0) return res.status(400).send("Specific proxies type");
    const port = await port_main.find({});
    port.forEach(async proxie => {
        const proxies_change = await proxy_custom.aggregate([{ $sample: { size: 1 } }]);
         await port_main.updateOne({fowardPort: proxie.fowardPort},{$set:{host:proxies_change[0].host,port:proxies_change[0].port}})
          await createProxy(proxies_change[0], proxie.fowardPort);
      });
    res.send("Reloaded done");
  })


router.get("/reload", async(req,res) => {
    const {type} = req.query;
    if (proxyTypeList.indexOf(type) < 0) return res.status(400).send("Specific proxies type");
    const proxies = await Proxy.find({type: type});
    loadProxies(proxies);
    return res.send("Reloaded done")
})


router.get("/reloadAll", async(req,res) => {
    const proxies = await Proxy.find({});
    for (let i = 0; i < proxies.length; i ++){
      createProxy(proxies[i], 1710 + i);
      await Proxy.findOneAndUpdate({"_id": proxies[i]._id},{fowardPort: 1710+i})
    }
    return res.send("Reloaded All Done")
})
router.get("/pac", async(req,res) => {
  const {host,port} = req.query;
    if (!host || !port) return res.send("Invalid configuration");

    res.send(`function FindProxyForURL(url,host){
       url = url.toLowerCase();
       host = host.toLowerCase();
      if (shExpMatch (url, "*ip-api.com*") 
          || shExpMatch (url, "*api.textnow.me*") 
          || shExpMatch (url, "*event.textnow.me*") 
          || shExpMatch (url, "*collector-pxk56wkc4o.perimeterx.net*") 
          || shExpMatch (url, "*icanhazip.com*") 
          || shExpMatch (url, "*safebrowsing.googleapis.com*")){ 
          return 'PROXY ${host}:${port}';
      }
      return 'DIRECT';

  }`);
})
module.exports = router;
