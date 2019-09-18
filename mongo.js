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
  await db.collection("nodes").insertOne({
    owner, nodeId, nodeType, sources
  });
}

mongo.nodeTransferred = async function(data) {
  let newOwner = data[1].toString();
  let nodeId = data[2].toString();
  let query = { nodeId: nodeId };
  let newValue = { $set: { owner: newOwner } };

  await db.collection("nodes").updateOne(query, newValue);
};

// ge
mongo.geCreated = async function(data) {
  let creator = data[0].toString();
  let geId = data[1].toString();
  let tcxIds = [];
  let totalStaked = 0;
  let invested = data[2].toNumber();
  let totalInvested = invested;
  let value = {
    geId, tcxIds, totalStaked, totalInvested, members: {
      [creator]: { invested: invested }
    }
  }
  await db.collection("ges").insertOne(value);
};
mongo.geStaked = async function(data) {
  let staker = data[0].toString();
  let geId = data[1].toString();
  let staked = data[2].toNumber();
  let query = { geId: geId };
  let newValue = { "$inc": { totalStaked: staked, [`members.${staker}.staked`]: staked}};
  await db.collection("ges").updateOne(query, newValue);
};
mongo.geInvested = async function(data) {
  let investor = data[0].toString();
  let geId = data[1].toString();
  let invested = data[2].toNumber();
  let query = { geId: geId };
  let newValue = {
    $inc: { totalInvested: invested, [`members.${investor}.invested`]: invested }
  };
  await db.collection("ges").updateOne(query, newValue);
};

mongo.tcxCreated = async function(data) {
  let geId = data[0].toString();
  let tcxId = data[1].toString();
  let tcxType = data[2].toString(); 

  let value = {
    owner: geId,
    tcxId,
    nodeIds: [],
    tcxType
  };
  await db.collection("tcxs").insertOne(value);

  // update ge
  let query = { geId: geId };
  let newValue = {
    $push: { tcxIds: tcxId }
  };
  await db.collection("ges").updateOne(query, newValue);

}

mongo.tcxProposed = async function(data) {
  let proposer = data[0].toString();
  let tcxId = data[1].toString();
  let nodeId = data[2].toString();
  let amount = data[3].toNumber();
  let quota = data[4].toNumber();
  let actionId = data[5].toString();

  // proposed amount like stake not invest? where money go?

  let value = {
    proposer,
    tcxId,
    nodeId,
    amountLeft: amount,
    quotaLeft: quota,
    amountRight: 0,
    quotaRight: 0,
    actionId,
    status: 0
  };

  await db.collection("proposals").insertOne(value);
};

// TODO: possible to update old challenges instead?
mongo.tcxChallenged = async function(data) {
  let challenger = data[0].toString();
  let challengeId = data[1].toString();
  let tcxId = data[2].toString();
  let nodeId = data[3].toString();
  let amount = data[4].toNumber();
  let quota = data[5].toNumber();

  let query = {
    tcxId: tcxId,
    nodeId: nodeId,
    status: 0
  };

  let newValue = {
    $set: {
      status: 1,
      challenger,
      challengeId,
      amountRight: amount,
      quotaRight: quota,
      voters: []
    }
  };

  await db.collection("proposals").updateOne(query, newValue);
};;

mongo.tcxVoted = async function(data) {
  let voter = data[0].toString();
  let challengeId = data[1].toString();
  let amount = data[2].toNumber();
  let quota = data[3].toNumber();
  let whitelist = data[4].toNumber();
  
  let query = {
    challengeId: challengeId,
    status: 1
  };

  let newValue;
  if(whitelist) {
    newValue = {
      $inc: { amountLeft: amount, quotaLeft: quota },
      $push: { voters: voter }
    }
  } else {
    newValue = {
      $inc: { amountRight: amount, quotaRight: quota },
      $push: { voters: voter }
    };
  }

  await db.collection("proposals").updateOne(query, newValue);

};

mongo.tcxAccepted = async function(data) {
  let tcxId = data[0].toString();
  let nodeId = data[1].toString();
  
  let tcxQuery = {
    tcxId: tcxId
  };

  let tcxNewValue = {
    $push: { nodeIds: nodeId }
  };

  let proposalQuery = {
    tcxId: tcxId,
    nodeId: nodeId,
    $or: [{status: 0}, {status: 1}]
  }
  
  let proposalNewValue = {
    $set: { status: 3}
  }

  await db.collection("tcxs").updateOne(tcxQuery, tcxNewValue);
  await db.collection("proposals").updateOne(proposalQuery, proposalNewValue);
};

mongo.tcxRejected = async function(data) {
  let tcxId = data[0].toString();
  let nodeId = data[1].toString();

  let query = {
    tcxId: tcxId,
    nodeId: nodeId,
    status: 1
  };

  let newValue = {
    $set: { status: 4, whitelist: false }
  }

  await db.collection("proposals").updateOne(query, newValue);

};

mongo.tcxResolved = async function(data) {
  // let challengedId = data[0].toString();
  
};

mongo.tcxClaimed = async function(data) {
  let claimer = data[0].toString();
  let challengedId = data[1].toString();
  // TODO: claim prize
};




module.exports = mongo;