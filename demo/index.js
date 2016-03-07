var cardreader = require('../lib/card-reader');

console.info('cardreader', cardreader);

cardreader.on('device-activated', function (reader) {
    console.info('Device activated', reader);
});

cardreader.on('device-deactivated', function (reader) {
    console.info('Device deactivated', reader);
});


cardreader.on('card-inserted', function (reader, status) {
    console.info('Card inserted', reader, status, this);

    // either callback style
    cardreader.issueCommand('00A404000E315041592E5359532E4444463031', function (err, data) {
        if (err) {
            console.error(err);
        } else {
            console.info('data-received', data.toString('hex'));
        }
    });

    // or as a promise
    cardreader
        .issueCommand('00A404000E315041592E5359532E4444463031')
        .then(function(response) {
            console.info('data-received', response.toString('hex'));
        }).catch(function(error) {
            console.error(error);
        });
});

cardreader.on('card-removed', function (reader) {
    console.info('Card removed', reader);
});

cardreader.on('data-received', function (data) {
    console.info('Data received', data.toString());
});

cardreader.on('error', function (error) {
    console.info('Error', error);
});