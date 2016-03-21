'use strict';
import {EventEmitter} from 'events';

function Card(reader) {
    this.reader = reader;
    this.events = new EventEmitter();
}


function create() {
    return new Card;
}

export default create;