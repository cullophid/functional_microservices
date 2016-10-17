const reciever = require('./lib/reciever');
const EventEmitter = require('events');

const R = require('ramda');
const { map, compose, pipe, curry, tap, chain, always } = require('ramda');
const { Future } = require('ramda-fantasy');

class Broker extends EventEmitter {}

const broker = new Broker();

const handle = pipe(
    tap(val => console.log('broker', val.json)),
    tap(val => broker.emit(val.json.correlationId, val.json)),
    Future.of
)

reciever('broker', handle);

module.exports = broker;