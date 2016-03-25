'use strict';

let cardreader = require('../lib/card-reader');

cardreader.on('device-activated', function (event) {
    console.log(`Device '${event.reader.name}' activated, devices: ${cardreader.listDevices()}`);
});

cardreader.on('device-deactivated', function (event) {
    console.log(`Device '${event.reader.name}' deactivated, devices: ${cardreader.listDevices()}`);
});

cardreader.on('card-removed', function (event) {
    console.log(`Card removed from '${event.reader.name}' `);
});

cardreader.on('command-issued', function (event) {
    console.log(`Command '${event.command}' issued to '${event.reader.name}' `);
});

cardreader.on('response-received', function (event) {
    console.log(`Response '${event.response}' received from '${event.reader.name}' in response to '${event.command}'`);
});

cardreader.on('error', function (event) {
    console.log(`Error '${event.error}' received`);
});

cardreader.on('card-inserted', function (event) {

    console.log(`devices: ${cardreader.listDevices()}`);

    var reader = event.reader;
    console.log(`Card inserted into '${reader.name}' `);

    cardreader
        .issueCommand(reader, '00A404000E315041592E5359532E4444463031')
        .then(function (response) {
            console.log(`Response '${response.toString('hex')}`);
        }).catch(function (error) {
            console.error(error);
        });
});
