# castor-events-listener
- Store castor network events to MongoDB.

## Setup
```
1. yarn install
```

## Run
```
1. start mongodb daemon
2. run substrate castor
3. yarn start
```

## .env Configuration
```
# MongoDB config
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_DB=castor_events
MONGO_COLLECTION=event_data

# Substrate Node Config
SUBSTRATE_HOST=localhost
SUBSTRATE_PORT=9944
SUBSTRATE_EVENT_SECTIONS=all
# SUBSTRATE_EVENT_SECTIONS=balances,assets,token,kitties
```

## mongdo - view all events
```
mongo
use castor_events
db.event_data.find()
```

### TODO
- Maintain block height, deal with sync issues.
- Integer might overflow in mongodb.
- check if challenging multiple times might cause bug

### Notes
- uses string for integers that do not need to be compared


