/**
 * The TransportInterface defines a blueprint for functionality
 * to hit the Beam API. Currently we allow both HTTP and websocket
 * requests to the API.
 *
 * @param {Client} client
 */
function TransportInterface (client) {
    this.client = client;
}

/**
 * Attempts to run a given request.
 *
 * @access public
 * @param  {String} method Request method, such as GET, POST, etc.
 * @param  {Strig}  path   Relative path on Beam, such as /users/current
 * @param  {Object} data   An object with data to be extended into request.
 * @return {Promise} Resolved in 200 OK, otherwise rejected.
 */
TransportInterface.prototype.run = function () {
    throw new Error('`run` must be implemented');
};

module.exports = TransportInterface;
