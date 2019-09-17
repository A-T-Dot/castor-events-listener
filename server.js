const { ApiPromise, WsProvider } = require("@polkadot/api");
const mongo = require("./mongo");

require("dotenv").config();


async function main() {
  // Connect MongoDB
  await mongo.connect();

  // Initialise the provider to connect to the local node
  const provider = new WsProvider(`ws://${process.env.SUBSTRATE_HOST}:${process.env.SUBSTRATE_PORT}`);

  // Create our API with a default connection to the local node
  const api = await ApiPromise.create({
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
      ChallengeId: "u64",
      ListingId: "u64",
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
      VecContentHash: "Vec<ContentHash>"
    },
    provider
  });

  // Event Filter
  let eventsFilter;
  if(process.env.SUBSTRTAE_EVENT_SECTIONS) {
    eventsFilter = process.env.SUBSTRTAE_EVENT_SECTIONS.split(',')
  } else {
    eventsFilter = ["all"]
  }

  
  api.query.system.events(async (events) => {

    // loop through the Vec<EventRecord>
    events.forEach(async (record) => {
      // extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;

      // filter event section
      if (
        !(eventsFilter.includes(event.section.toString()) ||
        eventsFilter.includes("all"))
      ) {
        return;
      }

      // show what we are busy with
      console.log(
        `\n${event.section}:${event.method}:: (phase=${phase.toString()})`
      );
      console.log(`\t${event.meta.documentation.toString()}`);

      // loop through each of the parameters, displaying the type and data
      event.data.forEach((data, index) => {
        console.log(`\t\t${types[index].type}: ${data.toString()}`);
      });

      const eventObj = {
        section: event.section,
        method: event.method,
        meta: event.meta.documentation.toString(),
        data: event.data.toString()
      }

      // insert to mongo db
      await mongo.insert(eventObj)
    });
  });
}

main().catch(error => {
  console.error(error);
  process.exit(-1);
});