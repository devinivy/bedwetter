var Hapi = require('hapi');
var Hoek = require('hoek');
var Path = require('path');

module.exports = function(server, pluginOpts, cb) {
        
        // Connection is for late hapi v7
        Hoek.assert(server instanceof Hapi.Server || server instanceof require('hapi/lib/connection'), 'You\'re setting up something that is not a hapi server.');
        
        if (typeof pluginOpts == 'function') {
            cb = pluginOpts;
            pluginOpts = {};
        }
        
        // Setup dummy connections/adapters.
        var connections = {
            'testing': {
                adapter: 'memory'
            }
        };
        
        // Setup adapters for testing fixtures.
        var adapters = { memory: require('sails-memory') };
        var modelsFile = './models.definition.js';
        var fixturesFile = './models.fixtures.json';
    
        // Setup 
        server.auth.scheme('custom', require('./auth.scheme.js'));
        server.auth.strategy('default', 'custom', false, { animals: { Doggie: {id:1}, Kitty: {id:2} } });
        
        var plugins = [
        {
           plugin: require('..'),
           options: pluginOpts
        },
        {
            plugin: require('dogwater'),
            options: {
                connections: connections,
                adapters: adapters,
                models: Path.normalize(__dirname + '/' + modelsFile),
                data: {
                    fixtures: require('./models.fixtures.json')
                }
            }
        }];
        
        server.pack.register(plugins, function (err) {
            
            cb(err);
        });
        
}