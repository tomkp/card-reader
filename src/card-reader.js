import {EventEmitter} from 'events';
import pcsclite from 'pcsclite';
import hexify from 'hexify';


const events = new EventEmitter();
const pcsc = pcsclite();


let devices = {};


events.listDevices = () => {
  return Object.keys(devices);
};

events.fetchDevice = () => {
    return Object.keys(devices);
};


const cardInserted = (reader, status) => {
    reader.connect((err, protocol) => {
        if (err) {
            events.emit('error', err);
        } else {
            devices[reader.name] = { reader, protocol};
            events.emit('debug', `Device '${reader.name}' has protocol '${protocol}'`);
            events.emit('card-inserted', {reader, status, protocol});
        }
    });
};


const cardRemoved = (reader) => {
    reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
        if (err) {
            events.emit('error', err);
        } else {
            devices[reader.name] = {};
            events.emit('card-removed', {reader});
        }
    });

};


const isCardInserted = (changes, reader, status) => {
    return (changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT);
};


const isCardRemoved = (changes, reader, status) => {
    return (changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY);
};


const deviceActivated = (reader) => {
    devices[reader.name] = {};
    events.emit('device-activated', {reader});

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
        delete devices[reader.name];
        events.emit('device-deactivated', {reader});
    });

    reader.on('error', (error) => {
        events.emit('error', {reader, error});
    });
};


pcsc.on('reader', (reader) => {
    deviceActivated(reader);
});


pcsc.on('error', (err) => {
    events.emit('error', {error});
});


events.issueCommand = (reader, command, callback) => {

    let commandBuffer;
    if (Array.isArray(command)) {
        commandBuffer = new Buffer(command);
    } else if (typeof command === 'string') {
        commandBuffer = new Buffer(hexify.toByteArray(command));
    } else if (Buffer.isBuffer(command)) {
        commandBuffer = command;
    } else {
        throw 'Unable to recognise command type (' + typeof command + ')';
    }


    const protocol = devices[reader.name].protocol;

    events.emit('command-issued', {reader, command: commandBuffer});
    if (callback) {
        reader.transmit(commandBuffer, 0xFF, protocol, (err, response) => {
            events.emit('response-received', {reader, command: commandBuffer, response: new Buffer(response.toString('hex'))});
            callback(err, response);
        });
    } else {
        return new Promise((resolve, reject) => {
            reader.transmit(commandBuffer, 0xFF, protocol, (err, response) => {
                if (err) reject(err);
                else {
                    events.emit('response-received', {reader, command: commandBuffer, response: new Buffer(response.toString('hex'))});
                    resolve(response);
                }
            });
        });
    }
};


module.exports = events;

