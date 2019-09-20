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
    _id: nodeId,
    owner,
    nodeId,
    nodeType,
    sources,
    referredBy: []
  });

  // update referred nodes
  await sources.forEach(async (source) => {
    let query = { nodeId: source };
    let newValue = { $push: { referredBy: nodeId } };
    await db.collection("nodes").updateOne(query, newValue);
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
  let contentHash = data[3].toString();
  let totalInvested = invested;
  let value = {
    _id: geId,
    geId,
    tcxIds,
    totalStaked,
    totalInvested,
    members: {
      [creator]: { invested: invested }
    },
    contentHash
  };
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
  let contentHash = data[3].toString();

  let value = {
    _id: tcxId,
    owner: geId,
    tcxId,
    nodeIds: [],
    tcxType,
    contentHash,
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
  let now = Date.now();

  let proposer = data[0].toString();
  let tcxId = data[1].toString();
  let nodeId = data[2].toString();
  let amount = data[3].toNumber();
  let quota = data[4].toNumber();
  let actionId = data[5].toString();
  let challengeBefore = data[6].toNumber();

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
    challengeBefore,
    status: 0,
    updatedAt: now,
  };

  await db.collection("proposals").insertOne(value);
};

// TODO: possible to update old challenges instead?
mongo.tcxChallenged = async function(data) {
  let now = Date.now();

  let challenger = data[0].toString();
  let challengeId = data[1].toString();
  let tcxId = data[2].toString();
  let nodeId = data[3].toString();
  let amount = data[4].toNumber();
  let quota = data[5].toNumber();
  let voteBefore = data[6].toNumber();

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
      voteBefore,
      amountRight: amount,
      quotaRight: quota,
      voters: [],
      updatedAt: now
    }
  };

  await db.collection("proposals").updateOne(query, newValue);
};;

mongo.tcxVoted = async function(data) {
  let now = Date.now();

  let voter = data[0].toString();
  let challengeId = data[1].toString();
  let amount = data[2].toNumber();
  let quota = data[3].toNumber();
  let whitelist = data[4].toString();
  
  let query = {
    challengeId: challengeId,
    status: 1
  };

  let newValue;
  if(whitelist == "true") {
    newValue = {
      $inc: { amountLeft: amount, quotaLeft: quota },
      $push: { voters: voter },
      $set: { updatedAt: now}
    }
  } else {
    newValue = {
      $inc: { amountRight: amount, quotaRight: quota },
      $push: { voters: voter },
      $set: { updatedAt: now }
    };
  }

  await db.collection("proposals").updateOne(query, newValue);

};

mongo.tcxAccepted = async function(data) {
  let now = Date.now();

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
    $set: { status: 3, updatedAt: now, claimed: [] }
  }

  await db.collection("tcxs").updateOne(tcxQuery, tcxNewValue);
  await db.collection("proposals").updateOne(proposalQuery, proposalNewValue);
};

mongo.tcxRejected = async function(data) {
  let now = Date.now();

  let tcxId = data[0].toString();
  let nodeId = data[1].toString();

  let query = {
    tcxId: tcxId,
    nodeId: nodeId,
    status: 1
  };

  let newValue = {
    $set: { status: 4, updatedAt: now, claimed: [] }
  }

  await db.collection("proposals").updateOne(query, newValue);

};

mongo.tcxResolved = async function(data) {
  // let challengedId = data[0].toString();
  
};

mongo.tcxClaimed = async function(data) {
  let claimer = data[0].toString();
  let challengeId = data[1].toString();

  let query = {
    challengeId: challengeId,
  };

  // TODO: claim prize
  let newValue = {
    $push: { claimed: claimer },
  };

  await db.collection("proposals").updateOne(query, newValue);
};

mongo.nonTransferAssetsCreated = async function(data) {
  let assetId = data[0].toString();
  let accountId = data[1].toString();
  // let assetOptions = data[2].toString();

  // TODO: 
}

mongo.nonTransferAssetsMinted = async function(data) {
  let assetId = data[0].toString();
  let accountId = data[1].toString();
  let balance = data[2].toNumber();

  let query = {
    accountId: accountId
  };

  let newValue = {
    $inc: { [`${assetId}`]: balance }
  };

  await db.collection("accounts").updateOne(query, newValue, { upsert: true});
};

mongo.nonTransferAssetsBurned = async function(data) {
  let assetId = data[0].toString();
  let accountId = data[1].toString();
  let balance = data[2].toNumber();

  let query = {
    accountId: accountId
  };

  let newValue = {
    $set: { accountId: accountId},
    $inc: { [`${assetId}`]: -balance }
  };

  await db.collection("accounts").updateOne(query, newValue, { upsert: true });
};

mongo.balancesNewAccount = async function(data) {
  // TODO: Needed?
  // let accountId = data[0].toString();
  // let balance = data[1].toNumber();

  // let query = {
  //   accountId: accountId
  // };

  // let newValue = {
  //   $set: { accountId: accountId },
  //   $inc: { balance: balance }
  // };

  // await db.collection("accounts").updateOne(query, newValue, { upsert: true });

}

mongo.balancesReapedAccount = async function(data) {
  let accountId = data[0].toString();

  let query = {
    accountId: accountId
  };

  // TODO
};

mongo.balancesTransfer = async function(data) {
  let accountIdFrom = data[0].toString();
  let accountIdTo = data[1].toString();
  let value = data[2].toNumber();
  let fees = data[3].toNumber();

  let liability = value + fees;

  let queryFrom = {
    accountId: accountIdFrom
  };

  let newValueFrom = {
    $set: { accountId: accountIdFrom },
    $inc: { balance: -liability }
  };

  let queryTo = {
    accountId: accountIdTo
  };

  let newValueTo = {
    $set: { accountId: accountIdTo },
    $inc: { balance: value }
  };

  await db.collection("accounts").updateOne(queryFrom, newValueFrom, { upsert: true });
  await db.collection("accounts").updateOne(queryTo, newValueTo, { upsert: true });

};

mongo.balancesMint = async function(accountId, balance) {
  let query = {
    accountId: accountId
  };

  let newValue = {
    $set: { accountId: accountId, balance: balance }
  };

  await db
    .collection("accounts")
    .updateOne(query, newValue, { upsert: true });
}

module.exports = mongo;