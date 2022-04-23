const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let port= new Schema(
  {
    host: {
      type: String
        },
    port: {
      type: Number
    },
    numberOfConnection:{    
      type: Number,
      default: 0
    },
    type:{
      type: String,
      default: "custom"
    },
    fowardPort:{
      type: Number,
      default: 0
    }
}
);

module.exports = mongoose.model("port", port);