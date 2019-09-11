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
      Kitty: "[u8; 16]",
      KittyIndex: "u32",
      KittyLinkedItem: {
        prev: "Option<KittyIndex>",
        next: "Option<KittyIndex>"
      }
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