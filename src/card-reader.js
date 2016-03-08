import {EventEmitter} from 'events';
import pcsclite from 'pcsclite';
import hexify from 'hexify';


const device = new EventEmitter();
const pcsc = pcsclite();
let cardReader;


const cardInserted = (reader, status) => {
    reader.connect((err, protocol) => {
        if (err) {
            device.emit('error', err);
        } else {
            cardReader = reader;
            console.log('Protocol(', reader.name, '):', protocol);
            device.emit('card-inserted', reader, status);
        }
    });
};


const cardRemoved = (reader) => {
    reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
        if (err) {
            device.emit('error', err);
        } else {
            device.emit('card-removed', reader);
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
    device.emit('device-activated', reader);

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
        device.emit('device-deactivated', this);
    });

    reader.on('error', (err) => {
        device.emit('error', err);
    });
};


pcsc.on('reader', (reader) => {
    deviceActivated(reader);
});


pcsc.on('error', (err) => {
    device.emit('error', err);
});



device.issueCommand = (command, fn) => {
    var buffer;
    if (Array.isArray(command)) {
        console.log('command is an Array', hexify.toHexString(command));
        buffer = new Buffer(command);
    } else if (typeof command === 'string') {
        console.log('command is a String', command);
        buffer = new Buffer(hexify.toByteArray(command));
    } else if (Buffer.isBuffer(command)) {
        console.log('command is a Buffer', command);
        buffer = command;
    } else {
        throw 'Unable to recognise command type';
    }

    var protocol = 1;
    console.log('issue command', buffer);
    if (fn) {
        cardReader.transmit(buffer, 0xFF, protocol, fn);
    } else {
        return new Promise((resolve, reject) => {
            cardReader.transmit(buffer, 0xFF, protocol, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });

    }
};


module.exports = device;

