const { ApiPromise } = require("@polkadot/api");
const mongo = require("./mongo");

require("dotenv").config();


async function main() {
  // Connect MongoDB
  await mongo.connect();

  // Create our API with a default connection to the local node
  const api = await ApiPromise.create({
    types: {
      Kitty: "[u8; 16]",
      KittyIndex: "u32",
      KittyLinkedItem: {
        prev: "Option<KittyIndex>",
        next: "Option<KittyIndex>"
      }
    }
  });

  api.query.system.events(events => {
    console.log(`\nReceived ${events.length} events:`);

    // loop through the Vec<EventRecord>
    events.forEach(record => {
      // extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;

      // show what we are busy with
      console.log(
        `\t${event.section}:${event.method}:: (phase=${phase.toString()})`
      );
      console.log(`\t\t${event.meta.documentation.toString()}`);

      // loop through each of the parameters, displaying the type and data
      event.data.forEach((data, index) => {
        console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
      });
    });
  });
}

main().catch(error => {
  console.error(error);
  process.exit(-1);
});