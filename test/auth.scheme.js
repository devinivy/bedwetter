var Hoek = require('hoek');
var Boom = require('boom');

var internals = {};

module.exports = function (server, options) {

    var settings = Hoek.clone(options);

    var scheme = {
        authenticate: function (request, reply) {

            var req = request.raw.req;
            var authorization = req.headers.authorization;
            if (!authorization) {
                return reply(Boom.unauthorized(null, 'Custom'));
            }

            var parts = authorization.split(/\s+/);
            if (parts.length !== 2) {
                return reply(true);
            }

            var username = parts[1];
            var credentials = {};
            
            credentials.animal = settings.animals[username];

            if (!credentials) {
                return reply(Boom.unauthorized('Missing credentials', 'Custom'));
            }

            if (typeof credentials === 'string') {
                return reply(credentials);
            }

            return reply.continue({ credentials: credentials });
        }
    };

    return scheme;
};