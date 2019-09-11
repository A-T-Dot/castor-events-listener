# castor-events-listener

## Usage
```
1. yarn install
2. start mongodb daemon
3. start substrate chain
4. yarn start
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
- 


