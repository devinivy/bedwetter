// Load modules
var Lab = require('lab');
var Hoek = require('hoek');
var Path = require('path');
var Hapi = require('hapi')
var ServerSetup = require('./server.setup.js');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var experiment = lab.experiment;
var test = lab.test;


experiment('Bedwetter', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();

    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {
            userModel: 'animals',
            userIdProperty: 'animal.id',
            userUrlPrefix: '/animal'
        }, function(err) {
            
            if (err) done(err);
            
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


