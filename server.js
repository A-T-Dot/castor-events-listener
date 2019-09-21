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
      Listing: {
        id: "ListingId",
        node_id: "ContentHash",
        amount: "Balance",
        application_expiry: "Moment",
        whitelisted: "bool",
        challenge_id: "ChallengeId",
        owner: "AccountId"
      },
      ListingId: "u64",
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
      Like: {
        from: "AccountId",
        to: "ContentHash"
      },
      Admire: {
        from: "AccountId",
        to: "ContentHash"
      },
      Grant: {
        from: "AccountId",
        to: "ContentHash",
        amount: "Balance"
      },
      Report: {
        from: "AccountId",
        target: "ContentHash",
        reason: "ContentHash"
      },
      VecContentHash: "Vec<ContentHash>",
      ReasonHash: "ContentHash",
      AdmireId: "u64",
      GrantId: "u64",
      LikeId: "u64",
      ReportId: "u64",
      Quota: "u64",
      ActionPoint: "Balance",
      Energy: "Balance",
      Reputation: "Balance"
    },
    provider
  });

  // Event Filter
  let eventsFilter;
  if (process.env.SUBSTRATE_EVENT_SECTIONS) {
    eventsFilter = process.env.SUBSTRATE_EVENT_SECTIONS.split(",");
  } else {
    eventsFilter = ["all"];
  }

  if(process.env.DEBUG_MODE == "ON") {
    // Alice
    await mongo.balancesMint(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      1152921504606846976
    );
    // Bob
    await mongo.balancesMint(
      "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      1152921504606846976
    );
    // Charlie
    await mongo.balancesMint(
      "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
      1152921504606846976
    );
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
        // return;
      }

      // show what we are busy with
      console.log(
        `\n${event.section}:${event.method}:: (phase=${phase.toString()})`
      );
      console.log(`\t${event.meta.documentation.toString()}`);

      // loop through each of the parameters, displaying the type and data
      // event.data.forEach((data, index) => {
      //   console.log(`\t\t${types[index].type}: ${data.toString()}`);
      // });
      if (event.section == "node") {
        switch (event.method) {
          case "Created":
            mongo.nodeCreated(event.data);
            break;
          case "Transferred":
            mongo.nodeTransferred(event.data);
            break;
        }
      } else if (event.section == "ge") {
        switch (event.method) {
          case "Created":
            mongo.geCreated(event.data);
            break;
          case "Staked":
            mongo.geStaked(event.data);
            break;
          case "Invested":
            mongo.geInvested(event.data);
            break;
        }
      } else if (event.section == "tcx") {
        switch (event.method) {
          case "Created":
            mongo.tcxCreated(event.data);
            break;
          case "Proposed":
            mongo.tcxProposed(event.data);
            break;
          case "Challenged":
            mongo.tcxChallenged(event.data);
            break;
          case "Voted":
            mongo.tcxVoted(event.data);
            break;
          case "Accepted":
            mongo.tcxAccepted(event.data);
            break;
          case "Rejected":
            mongo.tcxRejected(event.data);
            break;
          case "Resolved":
            mongo.tcxResolved(event.data);
            break;
          case "Claimed":
            mongo.tcxClaimed(event.data);
            break;
        }
      } else if (event.section == "nonTransferAssets") {
        switch (event.method) {
          case "Created":
            mongo.nonTransferAssetsCreated(event.data);
            break;
          case "Minted":
            mongo.nonTransferAssetsMinted(event.data);
            break;
          case "Burned":
            mongo.nonTransferAssetsBurned(event.data);
            break;
        }
      } else if (event.section == "balances") {
        switch (event.method) {
          case "NewAccount":
            mongo.balancesNewAccount(event.data);
            break;
          case "ReapedAccount":
            mongo.balancesReapedAccount(event.data);
            break;
          case "Transfer":
            mongo.balancesTransfer(event.data);
            break;
        }
      } else if (event.section == "interaction") {
        switch (event.method) {
          case "Liked":
            mongo.interactionLiked(event.data);
            break;
          case "Admired":
            mongo.interactionAdmired(event.data);
            break;
          case "Granted":
            mongo.interactionGranted(event.data);
            break;
          case "Reported":
            mongo.interactionReported(event.data);
            break;
        }
      } else if (event.section == "activity") {
        switch (event.method) {
          case "FeePayed":
            mongo.activityFeePayed(event.data);
            break;
          case "EnergyRecovered":
            mongo.activtyEnergyRecovered(event.data);
            break;
        }
      }



      // log to events
      let data = event.data.map((parameter, index) => {
        console.log(`\t\t${types[index].type}: ${parameter.toString()}`);
        if(types[index].type == "VecContentHash") {
          return parameter.map((x) => x.toString());
        } else {
          return parameter.toString();
        }
      })

      const eventObj = {
        section: event.section,
        method: event.method,
        meta: event.meta.documentation.toString(),
        data
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