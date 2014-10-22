// Load modules
var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Path = require('path');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var experiment = lab.experiment;
var test = lab.test;


experiment('Bedwetter', function () {
    
    // This will be a Hapi server for each test.
    var server;
    
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

    // Setup Hapi server to register the plugin
    before(function(done){
        
        server = new Hapi.Server();
        
        // Setup 
        server.auth.scheme('custom', internals.implementation);
        server.auth.strategy('default', 'custom', false, { animals: { steve: { id: 1 } } });
        
        var plugins = [
        {
           plugin: require('..'),
           options: {
                userModel: 'animals',
                userIdProperty: 'animal.id',
                userUrlPrefix: '/animal'
           }
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
            
            expect(err).to.not.exist;
            
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
                
                server.route([
                { // findOne acting as user
                    method: 'GET',
                    path: '/animal',
                    config: {auth: 'default'},
                    handler: {
                        bedwetter: {
                            actAsUser: true
                        }
                    }
                },
                { // findOne
                    method: 'GET',
                    path: '/zoo/{id}',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // find
                    method: 'GET',
                    path: '/treat',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // find with prefix
                    method: 'GET',
                    path: '/v1/treat',
                    handler: {
                        bedwetter: {
                            prefix: '/v1'
                        }
                    }
                },
                { // destroy
                    method: 'DELETE',
                    path: '/treat/{id}',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // create
                    method: 'POST',
                    path: '/zoo',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // update
                    method: ['PATCH', 'POST'],
                    path: '/treat/{id}',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // remove
                    method: 'DELETE',
                    path: '/zoo/{id}/treats/{child_id}',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // adds a relation
                    method: 'PUT',
                    path: '/zoo/{id}/treats/{child_id}',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // adds and creates
                    method: 'POST',
                    path: '/zoo/{id}/treats',
                    handler: {
                        bedwetter: {}
                    }
                },
                { // populates
                    method: 'GET',
                    path: '/zoo/{id}/treats/{child_id?}',
                    handler: {
                        bedwetter: {}
                    }
                }]);
                
                done();
                
            })
            .fail(function(err) {
                
                done(err);
            });
            

        });
    });
    
    test('finds one.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1?populate=treats'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.treats).to.be.an.array;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('finds one acting as user.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/animal',
            headers: { authorization: 'Custom steve' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.id).to.equal(1);
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('finds.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat?sort=id ASC&skip=1&limit=3&where={"id":[1,2]}'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('finds with prefix.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/v1/treat?limit=1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            // console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('destroys.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('creates.', function (done) {
        
        server.inject({
            method: 'POST',
            url: '/zoo',
            payload: {
                name: "Big Room Studios"
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(201);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal("Big Room Studios");
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('updates with post.', function (done) {
        
        server.inject({
            method: 'PATCH',
            url: '/treat/2',
            payload: {
                name: "Fried BOreos"
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal("Fried BOreos");
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('updates with patch.', function (done) {
        
        server.inject({
            method: 'PATCH',
            url: '/treat/2',
            payload: {
                name: "Fried Oreos"
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal("Fried Oreos");
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('removes.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/zoo/2/treats/2',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('adds and creates.', function (done) {
        
        server.inject({
            method: 'POST',
            url: '/zoo/1/treats',
            payload: {
                name: "Fig Newtons"
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(201);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal("Fig Newtons");
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('adds.', function (done) {
        
        server.inject({
            method: 'PUT',
            url: '/zoo/2/treats/1',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('populates.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats',
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('acknowledges an association.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats/2',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('acknowledges a non-association.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats/666',
        }, function(res) {
            
            expect(res.statusCode).to.equal(404);
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    
});

var internals = {};


internals.implementation = function (server, options) {

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

            return reply(null, { credentials: credentials });
        }
    };

    return scheme;
};
