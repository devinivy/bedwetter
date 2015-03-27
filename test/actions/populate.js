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



experiment('Populate bedwetter', function () {
    
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
            { // populates
                method: 'GET',
                path: '/zoo/{id}/treats/{childId?}',
                handler: {
                    bedwetter: {}
                }
            }]);
            
            done();
        });
    });
    
    test('populates.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats',
        }, function(res) {
            
            //console.log(res.statusCode, res.result);
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            
            // Make sure the bedwetter sets request state
            var RequestState = res.request.plugins.bedwetter;
            expect(RequestState).to.be.an.object;
            expect(RequestState).to.have.keys(['action', 'options', 'primaryRecord']);
            expect(RequestState.action).to.equal('populate');
            expect(RequestState.options).to.be.an.object;
            expect(RequestState.primaryRecord).to.be.an.object;
            
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
            
            // Make sure the bedwetter sets request state
            var RequestState = res.request.plugins.bedwetter;
            expect(RequestState).to.be.an.object;
            expect(RequestState).to.have.keys(['action', 'options', 'primaryRecord', 'secondaryRecord']);
            expect(RequestState.action).to.equal('populate');
            expect(RequestState.options).to.be.an.object;
            expect(RequestState.primaryRecord).to.be.an.object;
            expect(RequestState.secondaryRecord).to.be.an.object;
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
            
            // Make sure the bedwetter sets request state
            var RequestState = res.request.plugins.bedwetter;
            expect(RequestState).to.be.an.object;
            expect(RequestState).to.have.keys(['action', 'options', 'primaryRecord']);
            expect(RequestState.action).to.equal('populate');
            expect(RequestState.options).to.be.an.object;
            expect(RequestState.primaryRecord).to.be.an.object;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    after(function(done) {
        Memory.teardown(done);
    });
    
});

