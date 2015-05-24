var _ = require('lodash');
var BaseProvider = require('./providers/base');

/**
 * The primary Beam client, repsonsible for storing authentication state
 * and dispatching requests to the API.
 * @access public
 */
function Client () {
    this.provider = new BaseProvider();
    this.host = 'beam.pro';
    this.secure = true;
    this.user = null;

    this.setTransport('socket');
}

/**
 * Gets information about the user, which was given when we authed.
 * @access public
 * @return {Object}
 */
Client.prototype.getUser = function () {
    return this.user;
};

/**
 * Sets the host the client should look for the API at.
 * @access public
 * @param {String} host
 * @return {Client}
 */
Client.prototype.setHost = function (host) {
    this.host = host;
    return this;
};

/**
 * Sets the API transport to use.
 * @param {String} transport One of "http", "socket".
 */
Client.prototype.setTransport = function (transport) {
    var Transport = require('./transport/' + transport);
    this.transport = new Transport(this);
    return this;
};

/**
 * Attempts to set up authentication with the given provider instance.
 * It returns a promise, which is rejected if authentication fails.
 * @access public
 * @param  {Provider} provider
 * @return {Promise}
 */
Client.prototype.auth = function (provider) {
    this.provider = provider;
    provider.use(this);

    return provider.attempt().bind(this).then(function (res) {
        this.user = res.body;
    });
};

/**
 * "Uses" a Service by injecting the current client into its constructor.
 * @param  {Object} Service
 * @return {Service}
 */
Client.prototype.use = function (Service) {
    return new Service(this);
};

/**
 * Attempts to run a given request.
 * @access public
 * @param  {String} method Request method, such as GET, POST, etc.
 * @param  {Strig}  path   Relative path on Beam, such as /users/current
 * @param  {Object} data   An object with data to be extended into request.
 * @return {Promise} Resolved in 200 OK, otherwise rejected.
 */
Client.prototype.request = function (method, path, data) {
    return this.transport.run.apply(this.transport, arguments);
};

module.exports = Client;
