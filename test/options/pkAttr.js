// Load modules
var Lab = require('lab');
var Hapi = require('hapi')
var Memory = require('sails-memory')
var Async = require('async')
var ServerSetup = require('../server.setup.js');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var experiment = lab.experiment;
var test = lab.test;

experiment('pkField option', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();

    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {
            pkAttr: 'name',
            childPkAttr: 'name'
        }, function(err) {
            
            if (err) done(err);
            
            server.route([
            { // Get a treat
                method: 'GET',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            },
            {
                method: 'GET',
                path: '/treat/{id}/place/{childId}',
                handler: {
                    bedwetter: {}
                }
            },
            {
                method: 'PATCH',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            },
            {
                method: 'DELETE',
                path: '/treat/{id}/place/{childId}',
                handler: {
                    bedwetter: {}
                }
            },
            {
                method: 'PUT',
                path: '/treat/{id}/place/{childId}',
                handler: {
                    bedwetter: {}
                }
            },
            {
                method: 'DELETE',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            }]);
            
            done();
        });
    });
    
    test('(findOne).', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/French%20Fries',
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal("French Fries");
            expect(res.result.id).to.equal(1);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(populate).', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/French%20Fries/place/Portland,%20ME%20Zoo',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(update).', function (done) {
        
        server.inject({
            method: 'PATCH',
            url: '/treat/French%20Fries',
            payload: {
                name: "Onion Rings"
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal("Onion Rings");
            expect(res.result.id).to.equal(1);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    
    test('(remove).', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/Onion%20Rings/place/Portland,%20ME%20Zoo',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(add).', function (done) {
        
        server.inject({
            method: 'PUT',
            url: '/treat/Onion%20Rings/place/Portland,%20ME%20Zoo',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(destroy).', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/Onion%20Rings',
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            server.inject({
                method: 'GET',
                url: '/treat/Onion%20Rings',
            }, function(res) {
                
                expect(res.statusCode).to.equal(404);
                
                done();
            });
            
        });
        
    });
    
    after(function(done) {
        Memory.teardown(done);
    });
    
});


