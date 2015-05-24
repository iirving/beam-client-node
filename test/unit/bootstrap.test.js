var request = require('../../lib/request');
var Client = require('../../lib/client');
var sinon = require('sinon');

beforeEach(function () {
    this.client = new Client();
    this.client.transport = { run: sinon.stub() };
});

afterEach(function () {
    request.restore();
});
