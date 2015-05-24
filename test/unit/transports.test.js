var expect = require('chai').expect;
var sinon = require('sinon');

describe('transports', function () {

    describe('http', function () {
        var HttpTransport = require('../../lib/transport/http');
        var t;

        beforeEach(function () {
            t = new HttpTransport(this.client);
            t.request = sinon.stub();
        });

        it('builds urls correctly', function () {
            expect(t.buildAddress('/foo/bar')).to.equal('https://beam.pro/foo/bar');
            expect(t.buildAddress('foo/bar')).to.equal('https://beam.pro/foo/bar');
            this.client.secure = false;
            expect(t.buildAddress('/foo/bar')).to.equal('http://beam.pro/foo/bar');
            expect(t.buildAddress('foo/bar')).to.equal('http://beam.pro/foo/bar');
            this.client.host = 'localhost:1337';
            expect(t.buildAddress('/foo/bar')).to.equal('http://localhost:1337/foo/bar');
            expect(t.buildAddress('foo/bar')).to.equal('http://localhost:1337/foo/bar');
        });

        it('resolves good requests', function (done) {
            t.request.yields(undefined, { body: 'ok!' });
            t.run('get', '/foo/bar', { a: 'b' }).then(function (res) {
                expect(res.body).to.equal('ok!');
                sinon.assert.calledWith(t.request, {
                    method: 'get',
                    url: 'https://beam.pro/foo/bar',
                    a: 'b'
                });
                done();
            });
        });

        it('parses json', function (done) {
            t.request.yields(undefined, { body: '{"a":"b"}' });
            t.run('get', '/foo/bar').then(function (res) {
                expect(res.body).to.deep.equal({ a: 'b' });
                done();
            });
        });
    });

    describe('socket', function () {
        var SocketTransport = require('../../lib/transport/socket');
        var Emitter = require('events').EventEmitter;
        var t;

        beforeEach(function () {
            t = new SocketTransport(this.client);
            var cnx = new Emitter();
            t.socket = sinon.stub().returns(cnx);
            t.ensureSocket();
            cnx.connected = true;
        });

        it('establishes connection', function () {
            sinon.assert.calledWith(t.socket, 'https://beam.pro');
        });

        it('runs when connected', function (done) {
            t.cnx.on('get', function (o, cb) {
                expect(o).to.deep.equal({
                    url: '/foo/bar',
                    headers: undefined,
                    data: { a: 'b' }
                });
                cb('asdf');
            });

            t.run('get', '/foo/bar', { form: { a: 'b' }}).then(function (r) {
                expect(r).to.equal('asdf');
                done();
            });
        });

        it('spools when not connected', function (done) {
            t.cnx.connected = false;
            t.run('get', '/foo/bar', { form: { a: 'b' }}).then(function (r) {
                expect(r).to.equal('asdf');
                done();
            });

            t.cnx.connected = true;
            t.cnx.on('get', function (o, cb) {
                expect(o).to.deep.equal({
                    url: '/foo/bar',
                    headers: undefined,
                    data: { a: 'b' }
                });
                cb('asdf');
            });
            t.cnx.emit('connect');
        });
    });
});
