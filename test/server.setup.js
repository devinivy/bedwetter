var Hapi = require('hapi');
var Hoek = require('hoek');
var Path = require('path');

module.exports = function(server, pluginOpts, cb) {
        
        Hoek.assert(server instanceof Hapi.Server, 'You\'re setting up something that is not a hapi server.');
        
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
        server.auth.strategy('default', 'custom', false, { animals: { steve: { id: 1 } } });
        
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
            
            if (err) cb(err);
            
            var Zoo = server.plugins.dogwater.zoo;
            
            Zoo.find()
            .then(function(zoos) {
                
                // Create some associations
                zoos[0].treats.add(1);
                zoos[0].treats.add(2);
                zoos[1].treats.add(2);
                zoos[1].treats.add(3);
                
                return [zoos[0].save(), zoos[1].save()];
                
            })
            .spread(function(maineZoo, oregonZoo) {
                //console.log(maineZoo, oregonZoo);
                cb();
            })
            .catch(function(err) {
                
                cb(err);
            });
            
        });
        
}