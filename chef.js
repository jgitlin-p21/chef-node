var authenticate = require('./chef/authenticate'),
    request = require('request'),
    methods = ['delete', 'get', 'post', 'put'];

function Chef(user, key, base) {
    this.user = user;
    this.key = key;
    this.base = base ? base : '';
}

function req(method, uri, body, opts, callback) {
    method = method.toUpperCase();

    // Add the base property of the client if the request does not specify the
    // full URL.
    if (uri.indexOf(this.base) !== 0) { uri = this.base + uri; }

    // Use the third parameter as the callback if a body was not given (like for
    // a GET request.)
    if (typeof body === 'function') { callback = body; body = undefined; }
    if (body === null) { body = undefined; } // null is handled differently to undefined.
    if (typeof opts === 'function') { callback = opts; opts = undefined; }

    return request(Object.assign(Object.create(null), opts, {
        body: body,
        headers: authenticate(this, { body: body, method: method, uri: uri }),
        json: true,
        method: method,
        uri: uri
    }), callback);
}

methods.forEach(function (method) {
    Chef.prototype[method] = function (uri, body, opts, callback) {
        return req.call(this, method, uri, body, opts, callback);
    };
});

exports.createClient = function (user, key, server) {
    return new Chef(user, key, server);
};
