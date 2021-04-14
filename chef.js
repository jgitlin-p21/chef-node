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
    // Add the base property of the client if the request does not specify the
    // full URL.
    if (this.options.base && this.options.base.length && uri.substr(0, this.options.base.length) != this.options.base) {
        uri = this.options.base + uri;
    }

    let my_url = url.parse(uri);

    opts = Object.assign(opts || {}, {
        headers: {},
        method: method.toUpperCase(),
        path: my_url.path,
        host: my_url.hostname,
        port: my_url.port
    });

    if (body) {
        body = JSON.stringify(body) + "\r\n";
        opts.headers["Content-Type"] = "application/json";
        opts.headers["Content-Length"] = Buffer.byteLength(body);
    } else {
        body = "";
    }

    opts.headers = Object.assign(opts.headers, authenticate(this, opts.method, uri, body));

    //console.log('REQUEST Headers:');
    //console.dir(opts.headers);

    return new Promise((resolve, reject) => {
        let response_body = "";
        let client = https.request(opts, (res) => {
            try {
                //console.log(`DEBUG ${my_url.href} statusCode: ${res.statusCode}`);
                //console.log(`DEBUG ${my_url.href} headers: `);
                //console.dir(res.headers);
              
                res.on('data', (d) => {
                    response_body += d;
                });
                
                ///////////
                res.on('end', () => {
                    //console.log(`DEBUG ${my_url.href} complete. Body: ${response_body}`);
                    try {
                        let result = response_body;
                        if (res.statusCode >= 200 && res.statusCode <= 299) {
                            //console.log(`PASS: ${my_url.href}`);
                            //console.log(`DEBUG: body: ${body}`);
                            if (res.headers["content-type"] === 'application/json') {
                                result = JSON.parse(response_body);
                            }
                            resolve(result, response_body, res);
                        }
                        else {
                            console.warn(`FAIL: ${my_url.href} HTTP ${res.statusCode}`);
                            reject(new Error("HTTP Result Code not OK"), response_body, res);
                        }
                    } catch (err) {
                        console.error(`Error caught inside response end closure: ${err}`);
                        reject(err, response_body, res);
                    }
                });
                ///////////
            }
            catch (ex) {
                console.error("ERROR in https request", ex);
                reject(ex);
            }
        });
        client.on('error', (e) => {
            console.error(`Failed to make request to ${my_url.href} -- ${e}`);
            reject(e);
        });
        if (body && body.length) {
            //console.log(`DEBUG: SEND: ${body}`);
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
