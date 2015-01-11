// Load modules
var Lab = require('lab');
var Hoek = require('hoek');
var Path = require('path');
var Hapi = require('hapi')
var Memory = require('sails-memory');
var Async = require('async')
var ServerSetup = require('../server.setup.js');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var experiment = lab.experiment;
var test = lab.test;


experiment('createdLocation option', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();

    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {
            userModel: 'animals',
            userIdProperty: 'animal.id',
            userUrlPrefix: '/animal'
        }, function(err) {
            
            if (err) done(err);
            
            server.route([
            { // create
                method: 'POST',
                path: '/zoo',
                handler: {
                    bedwetter: {
                        createdLocation: '/zoo/%s'
                    }
                }
            },
            { // adds and creates
                method: 'POST',
                path: '/zoo/{id}/treats',
                handler: {
                    bedwetter: {
                        createdLocation: '/treats/%s'
                    }
                }
            }]);
            
            done();
        });
    });
        
    test('sets the location header on create.', function (done) {
        
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
            expect(res.headers.location).to.exist;
            expect(res.headers.location).to.match(new RegExp('/zoo/'+res.result.id+'$'));
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('sets the location header on add+create.', function (done) {
        
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
            expect(res.headers.location).to.exist;
            expect(res.headers.location).to.match(new RegExp('/treats/'+res.result.id+'$'));
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    after(function(done) {
        Memory.teardown(done);
    });
    
});


