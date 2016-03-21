# Card Reader

A simple wrapper around [Santiago Gimeno's](https://www.npmjs.org/~sgimeno) great [pcsclite](https://github.com/santigimeno/node-pcsclite) library.


Emits events for:

* device-activated
* device-deactivated
* card-inserted
* card-removed
* issue-command
* receive-response
* error


## Examples

```javascript
var cardreader = require('../lib/card-reader');

cardreader.on('device-activated', function (reader) {
    console.info(`Device '${reader.name}' activated`);
});

cardreader.on('device-deactivated', function (reader) {
    console.info(`Device '${reader.name}' deactivated`);
});

cardreader.on('card-removed', function (reader) {
    console.info(`Card removed from '${reader.name}' `);
});

cardreader.on('issue-command', function (reader, command) {
    console.info(`Command '${command}' issued to '${reader.name}' `);
});

cardreader.on('receive-response', function (reader, response) {
    console.info(`Response '${response}' received from '${reader.name}' `);
});


cardreader.on('card-inserted', function (reader, status) {
    
    console.info(`Card inserted into '${reader.name}' `);

    // issue a command...

    // ...either callback style
    cardreader.issueCommand('00A404000E315041592E5359532E4444463031', function (err, data) {
        if (err) {
            console.error(err);
        } else {
            console.info('data-received', data.toString('hex'));
        }
    });

    // ...or as a promise
    cardreader
        .issueCommand('00A404000E315041592E5359532E4444463031')
        .then(function(response) {
            console.info('data-received', response.toString('hex'));
        }).catch(function(error) {
        console.error(error);
    });
});

```
