var Bluebird = require('bluebird');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('beam client', function () {
    var request = require('../../lib/request');

    it('makes a request', function (done) {
        this.client.transport.run.returns(Bluebird.resolve('ok!'));
        this.client.request('get', '/users/current', { a: 'b' }).bind(this).then(function (res) {
            sinon.assert.calledWith(this.client.transport.run, 'get', '/users/current', { a: 'b' });
            expect(res).to.deep.equal('ok!');
            done();
        });
    });
});
