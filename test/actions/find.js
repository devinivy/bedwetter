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


experiment('Find bedwetter', function () {
    
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
            { // find
                method: 'GET',
                path: '/treat',
                handler: {
                    bedwetter: {}
                }
            }]);
            
            done();
        });
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

    after(function(done) {
        Memory.teardown(done);
    });
    
});


