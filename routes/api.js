var express = require('express');
var router = express.Router();
const proxy_model = require("../model/proxy");
const proxy_custom=require("../model/proxy_custom");
const port=require("../model/port_custom");
const ProxyChain = require('proxy-chain');
var http = require('http');
/* GET home page. */
const proxyTypeList = ["auth","none","custom"];
router.get('/view/custom', function(req, res, next) {
    port.find()
    .then(proxys => {
        res.json({
            confirmation:'success',
            data:proxys
        })
    })
    .catch(err => {
        res.json({
            confirmation:'error',
            data:err
        })
    })
});
router.get("/creat",async  (req,res,next) => {
    for(var i=9000;i<9051;i++){
        const newCreatedProxy = await port.create({
            host: "1",
            port: "1",
            fowardPort: i
          })
        
    }
})
router.post("/addproxy",async  (req,res,next) => {
    const {proxy,type} = req.body;
    console.log(type);
    if (proxyTypeList.indexOf(type) < 0) return res.status(400).send("Bad Request");
  
    const props = proxy.split(':');
  
    if (type == "auth"){
      const newCreatedProxy = await proxy_model.create({
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
      const newCreatedProxy = await proxy_model.create({
          host: props[0],
          port: props[1],
          type: type,
          fowardPort: 0
      })
      return res.send(newCreatedProxy);
    }
    if(type=="custom"){
        const newCreatedProxy = await proxy_custom.create({
            host: props[0],
            port: props[1],
            type: type,
            fowardPort: 0
        })
        return res.send(newCreatedProxy);
    }
    return res.send("Invalid parameters");
  
  });




module.exports = router;