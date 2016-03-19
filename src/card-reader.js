import {EventEmitter} from 'events';
import pcsclite from 'pcsclite';
import hexify from 'hexify';


const devices = new EventEmitter();
const pcsc = pcsclite();
let cardReader;


const cardInserted = (reader, status) => {
    reader.connect((err, protocol) => {
        if (err) {
            devices.emit('error', err);
        } else {
            cardReader = reader;
            console.log(`Device '${reader.name}' has protocol '${protocol}'`);
            devices.emit('card-inserted', reader, status);
        }
    });
};


const cardRemoved = (reader) => {
    reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
        if (err) {
            devices.emit('error', err);
        } else {
            devices.emit('card-removed', reader);
        }
    });
    cardReader = null;
};


const isCardInserted = (changes, reader, status) => {
    return (changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT);
};


const isCardRemoved = (changes, reader, status) => {
    return (changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY);
};


const deviceActivated = (reader) => {
    devices.emit('device-activated', reader);

    reader.on('status', (status) => {
        var changes = reader.state ^ status.state;
        if (changes) {
            if (isCardRemoved(changes, reader, status)) {
                cardRemoved(reader);
            } else if (isCardInserted(changes, reader, status)) {
                cardInserted(reader, status);
            }
        }
    });

    reader.on('end', () => {
        devices.emit('device-deactivated', this);
    });

    reader.on('error', (err) => {
        devices.emit('error', err);
    });
};


pcsc.on('reader', (reader) => {
    deviceActivated(reader);
});


pcsc.on('error', (err) => {
    devices.emit('error', err);
});


devices.issueCommand = (command, callback) => {
    var buffer;
    if (Array.isArray(command)) {
        //console.debug('command is an Array', hexify.toHexString(command));
        buffer = new Buffer(command);
    } else if (typeof command === 'string') {
        //console.debug('command is a String', command);
        buffer = new Buffer(hexify.toByteArray(command));
    } else if (Buffer.isBuffer(command)) {
        //console.debug('command is a Buffer', command);
        buffer = command;
    } else {
        throw 'Unable to recognise command type (' + typeof command + ')';
    }

    var protocol = 1;
    devices.emit('issue-command', cardReader, buffer);
    if (callback) {
        cardReader.transmit(buffer, 0xFF, protocol, (err, response) => {
            devices.emit('receive-response', cardReader, new Buffer(response.toString('hex')));
            callback(err, response);
        });
    } else {
        return new Promise((resolve, reject) => {
            cardReader.transmit(buffer, 0xFF, protocol, (err, response) => {
                if (err) reject(err);
                else {
                    devices.emit('receive-response', cardReader, new Buffer(response.toString('hex')));
                    resolve(response);
                }
            });
        });

    }
};


module.exports = devices;

