// Load modules
var Lab = require('lab');
var Hoek = require('hoek');
var Path = require('path');
var Hapi = require('hapi');
var Memory = require('sails-memory');
var Async = require('async')
var ServerSetup = require('./server.setup.js');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var experiment = lab.experiment;
var test = lab.test;


experiment('Bedwetter patterns', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();
        
    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {}, done);
    });

    test('throw when number of path segments is too large.', function (done) {

        expect(function() {
            server.route({
                method: 'POST',
                path: '/model/{id}/assoc/{childId}/oops',
                handler: { bedwetter: { model: 'animals' } }
            });
        }).to.throw('Number of core path segments should be between 1 and 4.');

        done();
        
    });

    test('throw when methods don\'t match.', function (done) {

        expect(function() {
            server.route({
                method: 'OPTIONS',
                path: '/model/{id}',
                handler: { bedwetter: { model: 'animals' } }
            });
        }).to.throw('Method isn\'t a BedWetter.  Must be POST, GET, DELETE, PUT, or PATCH.');
        
        done();
        
    });

    test('throw when methods match but paths don\'t.', function (done) {
        
        var badRoutes = {
            post: [
                '/{id}',
                '/{id}/model',
                '/{id}/model/{childId}',
                '/model/assoc/{babyId}',
            ],
            patch: [
                '/{id}/model'
            ],
            get: [
                '/model/assoc',
                '/{id}/assoc',
                '/model/{id}/{childId}',
                '/model/assoc/{childId}',
                '/{id}/assoc/{childId}',
                '/model/{id}/assoc/assoc',
                '/model/{id}/{childId}/{babyId}',
                '/model/assoc/{childId}/{babyId}',
                '/{id}/assoc/{childId}/{babyId}'
            ],
            delete: [
                '/model/assoc',
                '/{id}/assoc',
                '/model/{id}/assoc/assoc',
                '/model/{id}/{childId}/{babyId}',
                '/model/assoc/{childId}/{babyId}',
                '/{id}/assoc/{childId}/{babyId}'
            ],
            put: [
                '/model/{id}/assoc/assoc',
                '/model/{id}/{childId}/{babyId}',
                '/model/assoc/{childId}/{babyId}',
                '/{id}/assoc/{childId}/{babyId}'
            ]
        };

        var path;
        var method;
        var methods = Object.keys(badRoutes);
        for (var i = 0; i < methods.length; ++i) {
        
            method = methods[i];
            
            for (var j = 0; j < badRoutes[method].length; ++j) {
            
                path = badRoutes[method][j];

                expect(function() {
                    server.route({
                        method: method,
                        path: path,
                        handler: { bedwetter: { model: 'animals' } }
                    });
                }).to.throw('This ' + method + ' route does not match a BedWetting pattern.');
            }

        }
        
        done();
        
    });

    test('throw when user options are neither strings nor falsy.', function (done) {

        expect(function() {
            server.route({
                method: 'POST',
                path: '/animals',
                handler: {
                    bedwetter: {
                        userUrlPrefix: ['bad']
                    }
                }
            });
        }).to.throw('Option userUrlPrefix should only have a string or a falsy value.');

        expect(function() {
            server.route({
                method: 'POST',
                path: '/animals',
                handler: {
                    bedwetter: {
                        userModel: ['bad']
                    }
                }
            });
        }).to.throw('Option userModel should only have a string or a falsy value.');

        done();
        
    });

    after(function(done) {
        Memory.teardown(done);
    });
    
});




