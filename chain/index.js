const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { stringToU8a } = require('@polkadot/util');

let api = null;

const init = async (wsp, callback, subscribe, WS) => {
  const provider = new WsProvider(wsp);

  api = await ApiPromise.create({
    types: {
      ContentHash: "[u8; 32]",
      NodeType: "u32",
      Node: {
        id: "ContentHash",
        node_type: "NodeType",
        sources: "Vec<ContentHash>"
      },
      GeId: "u64",
      ActionId: "u64",
      TcxId: "u64",
      GovernanceEntity: {
        threshold: "u64",
        min_deposit: "Balance",
        apply_stage_len: "Moment",
        commit_stage_len: "Moment"
      },
      Challenge: {
        amount: "Balance",
        voting_ends: "Moment",
        resolved: "bool",
        reward_pool: "Balance",
        total_tokens: "Balance",
        owner: "AccountId"
      },
      ListingId: "u64",
      ChallengeId: "u64",
      Listing: {
        id: "ListingId",
        node_id: "ContentHash",
        amount: "Balance",
        application_expiry: "Moment",
        whitelisted: "bool",
        challenge_id: "ChallengeId",
        owner: "AccountId"
      },
      Poll: {
        votes_for: "Balance",
        votes_against: "Balance",
        passed: "bool"
      },
      Tcx: {
        tcx_type: "u64"
      },
      TcxType: "u64",
      Link: {
        source: "u32",
        target: "u32"
      },
      VecContentHash: "Vec<ContentHash>",
      // server diff from fe
      DispatchError: "u64", 
      SetId: "u64"
    },
    provider
  });

  console.log(api.rpc.system.chain())
  api.rpc.chain.subscribeNewHeads((header) => {
    subscribe(header, WS);
  });

  callback(api);
};

const getBalance = async (address, callback) => {
  const currentBalance = await api.query.balances.freeBalance(address);
  callback(currentBalance.toString());
};

const getBalances = async (addresses, callback) => {
  const currentBalances = await api.query.balances.freeBalance.multi(addresses);
  const balancesMap = {};
  currentBalances.forEach((item, index) => {
    balancesMap[addresses[index]] = item.toString();
  });
  callback(balancesMap);
};

const getKeysFromSeed = _seed => {
  if (!_seed) {
    throw new Error('Seed not valid.');
  }

  const keyring = new Keyring({ type: 'sr25519' });
  const paddedSeed = _seed.padEnd(32);
  return keyring.addFromSeed(stringToU8a(paddedSeed));
};

// terminal console:

// Start.
// 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY balance: 1130921504606846966
// Chain is at #6189
// Chain is at #6190
// Chain is at #6191

module.exports = {
  init,
  getBalance,
  getBalances,
  getKeysFromSeed
}

