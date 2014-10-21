// Load modules
var Lab = require('lab');
var Hapi = require('hapi');
var Path = require('path');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var experiment = lab.experiment;
var test = lab.test;


experiment('Bedwet', function () {
    
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
        
        var plugins = [
        {
           plugin: require('..'),
           options: {}
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
                    method: 'PUT',
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
                { // adds
                    method: 'POST',
                    path: '/zoo/{id}/treats/{child_id?}',
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
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('updates.', function (done) {
        
        server.inject({
            method: 'PUT',
            url: '/treat/2',
            payload: {
                name: "Fried Oreos"
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
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
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('adds.', function (done) {
        
        server.inject({
            method: 'POST',
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
            expect(res.result.treats).to.have.length(2);
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('populates one.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats/2',
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result.treats).to.have.length(1);
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
});