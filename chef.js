var authenticate = require('./chef/authenticate'),
    request = require('request'),
    methods = ['delete', 'get', 'post', 'put'];

function Chef(user, key, options) {
    this.user = user;
    this.key = key;

    options = options || {};
    options.version = options.version || '12.8.0';
    options.timeout = options.timeout || 30000;
    this.options = options;
}

function req(method, uri, body, opts, callback) {
    method = method.toUpperCase();

    // Add the base property of the client if the request does not specify the
    // full URL.
    if (this.options.base && this.options.base.length && uri.substr(0, this.options.base.length) != this.options.base) {
        uri = this.options.base + uri;
    }

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
        uri: uri,
        timeout: this.options.timeout
    }), callback);
}

methods.forEach(function (method) {
    Chef.prototype[method] = function (uri, body, opts, callback) {
        return req.call(this, method, uri, body, opts, callback);
    };
});

exports.createClient = function (user, key, options) {
    return new Chef(user, key, options);
};
