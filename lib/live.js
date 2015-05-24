var EventEmitter = require('events').EventEmitter;
var Bluebird = require('bluebird');
var _ = require('lodash');

/**
 * This handles liveloading on the socket. It provides the same
 * interface as a standard Node.js EventEmitter.
 * @param {SocketTransport} socket
 */
function Live (socket) {
    EventEmitter.call(this);

    this.socket = socket;
    socket.on('connect', this.resubscribe.bind(this));

    this.on('removeListener', this.prepareSubscribe.bind(this, false));
    this.on('newListener', this.prepareSubscribe.bind(this, true));

    this.adds = [];
    this.removes = [];
    this.prepared = false;
}

Live.prototype = Object.create(EventEmitter.prototype);

/**
 * Resubscribes to events we're listening on to the socket.
 */
Live.prototype.resubscribe = function () {
    for (var event in this._events) {
        this.prepareSubscribe(true, event);
    }
};

/**
 * Prepares to subscribe or unsubscribe from a liveloading event.
 * Defers the action to the next event loop tick so we can group
 * things.
 *
 * @param {Bool} subscribed `true` for sub, `false` for unsub
 * @param {String} event
 */
Live.prototype.prepareSubscribe = function (subscribed, event) {
    if (this.listeners(event).length !== 0) {
        return;
    }

    var shouldPrepare = false;
    if (subscribed) {
        if (this.removes.indexOf(event) === -1) {
            this.adds.push(event);
            shouldPrepare = true;
        } else {
            _.pull(this.removes, event);
        }
    } else {
        if (this.adds.indexOf(event) === -1) {
            this.removes.push(event);
            shouldPrepare = true;
        } else {
            _.pull(this.adds, event);
        }
    }

    if (!this.prepared && shouldPrepare) {
        this.prepared = true;

        var self = this;
        setImmediate(function () {
            self.runSubscribe();
        });
    }
};

/**
 * Updates subscriptions on the server to match the eventemitter.
 */
Live.prototype.runSubscribe = function (event) {
    var todo = [];
    if (this.adds.length) {
        todo.push(this.socket.run('put', '/api/v1/live', { form: { slug: this.adds }}));
    }
    if (this.removes.length) {
        todo.push(this.socket.run('delete', '/api/v1/live', { form: { slug: this.removes }}));
    }

    this.adds = this.removes = [];
    this.prepared = false;

    var self = this;
    Bluebird.all(todo).catch(function (err) {
        self.emit('error', err);
    });
};

module.exports = Live;
