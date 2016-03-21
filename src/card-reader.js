import {EventEmitter} from 'events';
import pcsclite from 'pcsclite';
import hexify from 'hexify';


const devices = new EventEmitter();
const pcsc = pcsclite();
let cardReader;
let protocol;


const cardInserted = (reader, status) => {
    reader.connect((err, readerProtocol) => {
        if (err) {
            devices.emit('error', err);
        } else {
            cardReader = reader;
            protocol = readerProtocol;
            devices.emit('debug', `Device '${reader.name}' has protocol '${protocol}'`);
            devices.emit('card-inserted', reader, status);
        }
    });
};


const cardRemoved = (reader) => {
    reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
        if (err) {
            devices.emit('error', err);
        } else {
            if (cardReader) {
                devices.emit('card-removed', reader);
            }
        }
    });
    cardReader = null;
    protocol = null;
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
        devices.emit('device-deactivated', reader);
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
    let buffer;
    if (Array.isArray(command)) {
        buffer = new Buffer(command);
    } else if (typeof command === 'string') {
        buffer = new Buffer(hexify.toByteArray(command));
    } else if (Buffer.isBuffer(command)) {
        buffer = command;
    } else {
        throw 'Unable to recognise command type (' + typeof command + ')';
    }

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
                    devices.emit('receive-response', cardReader, new Buffer(response.toString('hex')), new Buffer(command.toLowerCase()));
                    resolve(response);
                }
            });
        });

    }
};


module.exports = devices;

