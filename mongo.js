const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

require("dotenv").config();

// Connection URL
const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;

// Database Name
const dbName = process.env.MONGO_DB;

// Collection Name
const collectionName = process.env.MONGO_COLLECTION;

let conn = null;
let db = null;

let mongo = {};

mongo.connect = async function(connectionUrl = url) {
  console.log(`MongoDB Connection URL: ${connectionUrl}`);

  let client = new MongoClient(connectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return new Promise( (resolve, reject) => {
    client.connect(function(err) {
      if(err) {
        reject(err);
      } else {
        console.log("Connected successfully to server");
        conn = client;
        db = conn.db(dbName);
        resolve(true)
      }
    });
  });
}

mongo.close = function() {
  if(conn){
    connn.close();
  }
}

mongo.insert = async function(data) {
  if(!conn) {
    await connect();
  }

  await db.collection(collectionName).insertOne(data);
}

// node
mongo.nodeCreated = async function(data) {
  let owner = data[0].toString();
  let nodeId = data[1].toString();
  let nodeType = data[2].toString();
  let sources = data[3].map(x => x.toString());
  await db.collection("node").insertOne({
    owner, nodeId, nodeType, sources
  });
}

mongo.nodeTransferred = async function(data) {
  let newOwner = data[1].toString();
  let nodeId = data[2].toString();
  let query = { nodeId: nodeId };
  let newValue = { $set: { owner: newOwner } };

  await db.collection("node").updateOne(query, newValue);
};

// ge
mongo.geCreated = async function(data) {};
mongo.geStaked = async function(data) {};
mongo.geInvested = async function(data) {};





module.exports = mongo;