const authenticate = require('./chef/authenticate'),
    request = require('request'),
    methods = ['delete', 'get', 'post', 'put'];

const os = require('os');
const url = require('url');
const https = require('https');

function Chef(user, key, options) {
    this.user = user;
    this.key = key;

    options = options || {};
    options.version = options.version || '12.8.0';
    options.timeout = options.timeout || 30000;
    this.options = options;
    this.version = options.version;
}

function req(method, uri, body, opts) {
    method = method.toUpperCase();

    opts = opts || {};

    // Add the base property of the client if the request does not specify the
    // full URL.
    if (this.options.base && this.options.base.length && uri.substr(0, this.options.base.length) != this.options.base) {
        uri = this.options.base + uri;
    }

    let my_url = url.parse(uri);

    let headers = Object.assign(opts.headers ? opts.headers : {}, authenticate(this, method, uri, body));

    if (body) {
        headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    return new Promise((resolve, reject) => {
        let body = "";
        let client = https.request(my_url, (res) => {
            try {
                console.log('statusCode:', res.statusCode);
                console.log('headers:', res.headers);
              
                res.on('data', (d) => {
                    body += d;
                });
                
                ///////////
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode <= 299) {
                            console.log(`PASS: ${my_url.href}`);
                            result = {};
                            resolve(result, data, res);
                        }
                        else {
                            console.warn(`FAIL: ${my_url.href} HTTP ${res.statusCode}`);
                            reject(new Error("HTTP Result Code not OK"), data, res);
                        }
                    } catch (err) {
                        console.error(`Error caught inside response end closure: ${err}`);
                        reject(err, body, res);
                    }
                });
                ///////////
            }
            catch (ex) {
                reject(ex);
            }
        }).on('error', (e) => {
            console.error(`Failed to make request to ${my_url.href} -- ${e}`);
            reject(e);
        });
        if (body) {
            client.write(body);
        }
        client.end();
    });

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
