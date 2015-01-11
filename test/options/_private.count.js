// Load modules
var Lab = require('lab');
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


experiment('Count postfix', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();

    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {/* Plugin options */}, function(err) {
            
            if (err) done(err);
            
            server.route([
            {
                method: 'GET',
                path: '/zoo/count',
                handler: {
                    bedwetter: {}
                }
            },
            {
                method: 'GET',
                path: '/zoo/{id}/treats/count',
                handler: {
                    bedwetter: {}
                }
            }]);
            
            done();
        });
    });
    
    test('(populate) counts populated items.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/count',
        }, function(res) {
            
            //console.log(res.statusCode, res.result);
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(2);
            
            done();
        });
        
    });
    
    test('(find) counts find items.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/2/treats/count',
        }, function(res) {
            
            //console.log(res.statusCode, res.result);
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(2);
            
            done();
        });
        
    });
    
    after(function(done) {
        Memory.teardown(done);
    });
    
});


