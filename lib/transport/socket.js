var Bluebird = require('bluebird');
var Live = require('../live');
var Base = require('./base');

var socket = require('socket.io-client');

/**
 * A WebSocket transport for the Beam API. This is basically
 * a thin implementation of sails.io.js.
 * @implements {TransportInterface}
 */
function SocketTransport (client) {
    Base.call(this, client);

    this.socket = socket;
    this.spool = [];
    this.cnx = null;
    this.ll = null;
}

/**
 * Establishes a websocket connection is one has not yet been made.
 * @private
 */
SocketTransport.prototype.ensureSocket = function () {
    if (this.cnx) {
        return;
    }

    var addr = 'http' + (this.client.secure ? 's' : '') + '://' + this.client.host;
    this.cnx = this.socket(addr);

    this.cnx.on('connect', (function () {
        for (var i = 0; i < this.spool.length; i++) {
            this.baseRun(this.spool[i]);
        }
        this.spool = [];
    }).bind(this));

    this.live = new Live(this.cnx);
};

/**
 * Checks if the transport is in a state where requests should
 * be spooled, and opens a connection if we've not yet done so.
 * @private
 * @return {Bool}
 */
SocketTransport.prototype.needSpool = function () {
    this.ensureSocket();
    return !this.cnx.connected;
};

/**
 * @inheritDoc
 */
SocketTransport.prototype.run = function (method, path, data) {
    var datum = {
        method: method.toLowerCase(),
        path: path,
        data: data
    };

    // Make a deferred promise. `resolve` is provided synchronously.
    datum.promise = new Bluebird(function (resolve) {
        datum.resolve = resolve;
    });

    if (this.needSpool()) {
        this.spool.push(datum);
    } else {
        this.baseRun(datum);
    }

    return datum.promise;
};

/**
 * Dispatches a datum on the socket, resolving with the ACK
 * callback.
 *
 * @private
 * @param  {Object} datum
 */
SocketTransport.prototype.baseRun = function (datum) {
    this.cnx.emit(datum.method, {
        url: datum.path,
        headers: datum.data.headers,
        data: datum.data.form
    }, datum.resolve);
};

module.exports = SocketTransport;
