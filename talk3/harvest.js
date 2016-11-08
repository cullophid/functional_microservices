const { addIndex, pluck, curry, filter, propSatisfies, test, reduce, sequence, assoc, compose, map, tap, chain, objOf, prop } = require('ramda');
const { Future } = require('ramda-fantasy');
const logger = require('./lib/logger');
const request = require('request-json');
const futureFromPromise = require('./lib/futureFromPromise');

var elasticsearch = require('./elasticsearch');

var requestFn = (url, endpoint) => compose(
    futureFromPromise,
    client => () => client.get(endpoint),
    request.createClient
)(url)

var elasticSearchDocumentify = (index, type) => compose(
    map(assoc('index', index)),
    map(assoc('type', type)),
    addIndex(map)((val, idx) => assoc('id', idx, val)),
    map(objOf('body'))
)

var mapOverSpeakers = curry((event, acc, speaker) => {
    var v = assoc('date', event.date, speaker);
    acc.push(v);
    return acc;
});

var mapOverEvents = (acc, event) => reduce(mapOverSpeakers(event), acc, event.speakers);

var extractSpeakers = reduce(mapOverEvents, []);

var upsertAndReturn = val => compose(
    map(() => val),
    elasticsearch.upsert
)(val);

var filterForGithub = filter(
    propSatisfies(test(/github/), 'url')
)

var delay = time => v => Future((reject, resolve) => setTimeout(() => resolve(v), time));

var uploadAllTalks = compose(
    //sequence(Future.of),
    //map(upsertAndReturn),
    Future.of,
    elasticSearchDocumentify('lnug_speakers', 'lnug_speakers'),
    logger('speakers'),
    filterForGithub,
    extractSpeakers,
    prop('body')
)

module.exports = compose(
    chain(delay(200)),
    map(tap(v => console.log('elasticsearch seed complete'))),
    chain(uploadAllTalks),
    () => requestFn('https://raw.githubusercontent.com/', 'lnug/website/master/data/archive.json')
)();