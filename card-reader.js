var EventEmitter = require('events').EventEmitter;

var pcsclite = require('pcsclite');
var hexify = require('hexify');

var device = new EventEmitter();
var pcsc = pcsclite();
var cardReader;


function cardInserted(reader, status) {
    reader.connect(function (err, protocol) {
        if (err) {
            device.emit('error', err);
        } else {
            cardReader = reader;
            console.log('Protocol(', reader.name, '):', protocol);
            device.emit('card-inserted', reader, status);
        }
    });
}


function cardRemoved(reader) {
    reader.disconnect(reader.SCARD_LEAVE_CARD, function (err) {
        if (err) {
            device.emit('error', err);
        } else {
            device.emit('card-removed', reader);
        }
    });
    cardReader = null;
}


function isCardInserted(changes, reader, status) {
    return (changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT);
}


function isCardRemoved(changes, reader, status) {
    return (changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY);
}


function deviceActivated(reader) {
    device.emit('device-activated', reader);

    reader.on('status', function (status) {
        var changes = this.state ^ status.state;
        if (changes) {
            if (isCardRemoved(changes, reader, status)) {
                cardRemoved(reader);
            } else if (isCardInserted(changes, reader, status)) {
                cardInserted(reader, status);
            }
        }
    });

    reader.on('end', function () {
        self.reader = null;
        device.emit('device-deactivated', this);
    });

    reader.on('error', function (err) {
        device.emit('error', err);
    });
}


pcsc.on('reader', function (reader) {
    deviceActivated(reader);
});


pcsc.on('error', function (err) {
    device.emit('error', err);
});


device.issueCommand = function issueCommand(command, fn) {
    var buffer;
    if (Array.isArray(command)) {
        console.info('command is an Array', hexify.toHexString(command));
        buffer = new Buffer(command);
    } else if (typeof command === 'string') {
        console.info('command is a String', command);
        buffer = new Buffer(hexify.toByteArray(command));
    } else if (Buffer.isBuffer(command)) {
        console.info('command is a Buffer', command);
        buffer = command;
    } else {
        throw 'Unable to recognise command type';
    }

    var protocol = 1;
    console.info('issue command', buffer);
    cardReader.transmit(buffer, 0xFF, protocol, fn);
};


module.exports = device;

