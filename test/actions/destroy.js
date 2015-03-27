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



experiment('Destroy bedwetter', function () {
    
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
            { // destroy
                method: 'DELETE',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            }]);
            
            done();
        });
    });
    
    test('destroys.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            
            // Make sure the bedwetter sets request state
            var RequestState = res.request.plugins.bedwetter;
            expect(RequestState).to.be.an.object;
            expect(RequestState).to.have.keys(['action', 'options', 'primaryRecord']);
            expect(RequestState.action).to.equal('destroy');
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

