var Bluebird = require('bluebird');
var Base = require('./base');

var request = require('request');
var _ = require('lodash');

/**
 * An HTTP transport for the Beam API.
 * @implements {TransportInterface}
 */
function HttpTransport (client) {
    Base.call(this, client);
    this.request = request;
}

/**
 * Builds a path to the Beam API by concating it with the address.
 * @private
 * @param  {String} path
 * @return {String}
 */
HttpTransport.prototype.buildAddress = function (path) {
    return 'http' + (this.client.secure ? 's' : '') + '://' +
        this.client.host + (path.charAt(0) === '/' ? '' : '/') + path;
};

/**
 * @inheritDoc
 */
HttpTransport.prototype.run = function (method, path, data) {
    var run = this.request;
    var req = _.extend(
        { method: method, url: this.buildAddress(path) },
        this.client.provider.getRequest(), data
    );

    return new Bluebird(function (resolve, reject) {
        run(req, function (err, res) {
            if (err) {
                return reject(err);
            }

            try {
                res.body = JSON.parse(res.body);
            } catch (e) {
                // ignore
            }

            resolve(res);
        });
    });
};

module.exports = HttpTransport;
