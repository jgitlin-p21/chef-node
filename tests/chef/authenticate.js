var authenticate = require('../../chef/authenticate'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    key = require('fs').readFileSync(__dirname + '/../fixtures/example.pem');

describe('authenticate', function () {
    beforeEach(function () {
        this.clock = sinon.useFakeTimers(0);
        this.api_version = '11.6.0'
        this.client = {
            user: 'test',
            key: key,
            version: this.api_version
        };
        this.options = {
            body: '',
            uri: 'https://example.com/test?query=string',
            method: 'GET'
        };
        this.headers = authenticate(this.client, this.options.method, this.options.uri, this.options.body)
    });

    afterEach(function () {
        this.clock.restore();
    });

    it('should return an object', function () {
        expect(this.headers).to.be.an('object');
    });

    it('should have an X-Chef-Version property', function () {
        expect(this.headers).to.have.property('X-Chef-Version', this.api_version);
    });

    it('should have an X-Ops-Content-Hash property', function () {
        expect(this.headers).to.have.property('X-Ops-Content-Hash',
                                              '2jmj7l5rSw0yVb/vlWAYkK/YBwk=');
    });

    it('should have an X-Ops-Sign property', function () {
        expect(this.headers).to.have.property('X-Ops-Sign', 'version=1.0');
    });

    it('should have an X-Ops-Timestamp property', function () {
        expect(this.headers).to.have.property('X-Ops-Timestamp',
                                              '1970-01-01T00:00:00Z');
    });

    it('should have an X-Ops-UserId property', function () {
        expect(this.headers).to.have.property('X-Ops-UserId', this.client.user);
    });

    it('should have X-Ops-Authorization-N properites', function () {
        expect(this.headers).to.have.property('X-Ops-Authorization-1',
            'iew4uHprBFtiCwPLMje8Szfkd6FSDZVJJ5P8SuKJpmMKEDwyD/P8/JtMaokw');
        expect(this.headers).to.have.property('X-Ops-Authorization-2',
            'eBeCgRp7VYnkjq+djg1YlXX5rBJoH0FawjIa6dI98LeFyNZ7+WJDHZDi4EcW');
        expect(this.headers).to.have.property('X-Ops-Authorization-3',
            'k9wKXFRiHtoMnabviq5u94yHyuf/bFvOWI7GLh0E7nwJiMdqNWVFSruD6T55');
        expect(this.headers).to.have.property('X-Ops-Authorization-4',
            '+jHu8p6hEO6Vh7PUQKkupLvVM1AGZS10ycecPuPgqENagn2Ble17med74fRC');
        expect(this.headers).to.have.property('X-Ops-Authorization-5',
            '7wOpHWuaUsWXFyn8/K1Qqi9O8yG0NJE05p9F91lgBKmip0ei08b7H6f1DeiA');
        expect(this.headers).to.have.property('X-Ops-Authorization-6',
            'iVZWvWTqwU3q6d+bSN20S6OaIT6zdlgjj9WfDnlaEw==');
    });
});
