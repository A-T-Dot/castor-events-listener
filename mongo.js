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

let connect = async function(connectionUrl = url) {
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
        resolve(true)
      }
    });
  });
}

let close = function() {
  if(conn){
    connn.close();
  }
}

let insert = async function(data) {
  if(!conn) {
    await connect();
  }

  const db = conn.db(dbName);
  await db.collection(collectionName).insertOne(data);
}

module.exports = { connect, close, insert };