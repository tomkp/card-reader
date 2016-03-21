var cardreader = require('../lib/card-reader');

cardreader.on('device-activated', function (reader) {
    console.info(`Device '${reader.name}' activated`);
});

cardreader.on('device-deactivated', function (reader) {
    console.info(`Device '${reader}' deactivated`);
});

cardreader.on('card-removed', function (reader) {
    console.info(`Card removed from '${reader.name}' `);
});

cardreader.on('issue-command', function (reader, command) {
    console.info(`Command '${command}' issued to '${reader.name}' `);
});

cardreader.on('receive-response', function (reader, response, command) {
    console.info(`Response '${response}' received from '${reader.name}' in response to '${command}'`);
});


cardreader.on('card-inserted', function (reader, status) {

    console.info(`Card inserted into '${reader.name}' `);

    // ...or as a promise
    cardreader
        .issueCommand('00A404000E315041592E5359532E4444463031')
        .then(function (response) {
            console.info('data-received', response.toString('hex'));
        }).catch(function (error) {
            console.error(error);
        });
});
