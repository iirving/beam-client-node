var expect = require('chai').expect;
var sinon = require('sinon');

describe('live loading', function () {
    var Emitter = require('events').EventEmitter;
    var Live = require('../../lib/live');
    var l, r, s;

    beforeEach(function () {
        s = new Emitter();
        r = s.run = sinon.stub();
        l = new Live(s);
    });

    it('subscribes once', function (done) {
        l.on('channel:2:update', function () {});
        setTimeout(function () {
            sinon.assert.calledWith(r, 'put', '/api/v1/live', { form: { slug: ['channel:2:update'] }});
            done();
        }, 1);
    });

    it('subscribes many', function (done) {
        l.on('channel:2:update', function () {});
        l.on('channel:3:update', function () {});
        setTimeout(function () {
            sinon.assert.calledWith(r, 'put', '/api/v1/live', { form: { slug: ['channel:2:update', 'channel:3:update'] }});
            done();
        }, 2);
    });

    it('subscribes without duplicates', function (done) {
        l.on('channel:2:update', function () {});
        l.on('channel:2:update', function () {});
        setTimeout(function () {
            sinon.assert.calledWith(r, 'put', '/api/v1/live', { form: { slug: ['channel:2:update'] }});

            l.on('channel:2:update', function () {});
            setTimeout(function () {
                expect(r.callCount).to.equal(1);
                done();
            }, 2);
        }, 2);
    });

    it('handles subscribe and unsubscribe', function (done) {
        l.on('channel:2:update', function () {});
        l.removeAllListeners('channel:2:update');

        setTimeout(function () {
            sinon.assert.notCalled(r);
            done();
        }, 2);
    });

    it('handles unsubscribe and subscribe', function (done) {
        l.removeAllListeners('channel:2:update');
        l.on('channel:2:update', function () {});

        setTimeout(function () {
            sinon.assert.calledWith(r, 'put', '/api/v1/live', { form: { slug: ['channel:2:update'] }});
            expect(r.callCount).to.equal(1);
            done();
        }, 2);
    });

    it('unsubscribes from single event', function (done) {
        var f = function () {};
        l.on('channel:2:update', f);

        setTimeout(function () {
            l.removeListener('channel:2:update', f);
            setTimeout(function () {
                sinon.assert.calledWith(r, 'delete', '/api/v1/live', { form: { slug: ['channel:2:update'] }});
                done();
            }, 2);
        }, 2);
    });

    it('unsubscribes from multiple events', function (done) {
        l.on('channel:2:update', function () {});
        l.on('channel:3:update', function () {});

        setTimeout(function () {
            l.removeAllListeners('channel:2:update');
            l.removeAllListeners('channel:3:update');

            setTimeout(function () {
                sinon.assert.calledWith(r, 'delete', '/api/v1/live', { form: { slug: ['channel:2:update', 'channel:3:update'] }});
                done();
            }, 2);
        }, 2);
    });

    it('unsubscribes from duplicate events 1', function (done) {
        var f = function () {};
        l.on('channel:2:update', f);
        l.on('channel:2:update', function () {});

        setTimeout(function () {
            l.removeListener('channel:2:update', f);
            setTimeout(function () {
                sinon.assert.neverCalledWith(r, 'delete');
                done();
            }, 2);
        }, 2);
    });

    it('unsubscribes from duplicate events 2', function (done) {
        l.on('channel:2:update', function () {});
        l.on('channel:2:update', function () {});

        setTimeout(function () {
            l.removeAllListeners('channel:2:update');
            setTimeout(function () {
                sinon.assert.calledWith(r, 'delete', '/api/v1/live', { form: { slug: ['channel:2:update'] }});
                done();
            }, 2);
        }, 2);
    });
});
