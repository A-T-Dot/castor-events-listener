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
mongo.geCreated = async function(data) {
  let creator = data[0].toString();
  let geId = data[1].toString();
  let tcxs = [];
  let totalStaked = 0;
  let invested = data[2].toNumber();
  let totalInvested = invested;
  let value = {
    geId, tcxs, totalStaked, totalInvested, members: {
      [creator]: { staked: 0, invested: invested }
    }
  }
  await db.collection("ge").insertOne(value);
};
mongo.geStaked = async function(data) {
  let staker = data[0].toString();
  let geId = data[1].toString();
  let staked = data[2].toNumber();
  let query = { geId: geId };
  let newValue = { "$inc": { totalStaked: staked, [`members.${staker}.staked`]: staked}};
  await db.collection("ge").updateOne(query, newValue);
};
mongo.geInvested = async function(data) {
  let investor = data[0].toString();
  let geId = data[1].toString();
  let invested = data[2].toNumber();
  let query = { geId: geId };
  let newValue = {
    $inc: { totalInvested: invested, [`members.${staker}.invested`]: invested }
  };
  await db.collection("ge").updateOne(query, newValue);
};





module.exports = mongo;