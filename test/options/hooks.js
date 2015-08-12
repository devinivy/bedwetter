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


experiment('hooks option', function () {
    
    // This will be a hapi server for each test.
    var server = new Hapi.Server();
    server.connection();

    // Setup hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {}, function(err) {
            
            if (err) done(err);
            
            server.route([
            { // findone
                method: 'GET',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {
                        omit: ['name'],
                        hooks: {
                            options: function(options, request) {
                                if (request.params.id == 2) {
                                    options.omit = ['id'];
                                }
                                return options;
                            }
                        }
                    }
                }
            },
            { // find
                method: 'GET',
                path: '/treat',
                handler: {
                    bedwetter: {
                        hooks: false
                    }
                }
            }]);
            
            done();
        });
    });
    
    test('`options` can modify options based upon request.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.contain.keys(['id']);
            expect(res.result).to.not.contain.keys(['name']);
            
            server.inject({
                method: 'GET',
                url: '/treat/2'
            }, function(res) {
                
                expect(res.statusCode).to.equal(200);
                expect(res.result).to.contain.keys(['name']);
                expect(res.result).to.not.contain.keys(['id']);
                
                done();
            });
            
        });
        
    });

    test('can be empty.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            done();
            
        });
        
    });

    after(function(done) {
        Memory.teardown(done);
    });
    
});

