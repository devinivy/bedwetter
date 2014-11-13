// Load modules
var Lab = require('lab');
var Hoek = require('hoek');
var Path = require('path');
var Hapi = require('hapi')
var Async = require('async')
var ServerSetup = require('../server.setup.js');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var experiment = lab.experiment;
var test = lab.test;



experiment('deletedFlag option', function () {
    
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
            { // destroy
                method: 'DELETE',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {
                        deletedFlag: true
                    }
                }
            }]);
            
            done();
        });
    });
    
    test('destroys with deleted flag.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);
            
            done();
        });

        server.inject({
            method: 'GET',
            url: '/treat/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result.deleted).to.equal(1);
            
            done();
        })
        
    });
    
    after(function(done) {
        
        var orm = server.plugins.dogwater.zoo.waterline;
        
        // Take each connection used by the orm... 
        Async.each(Object.keys(orm.connections), function(key, cbDone) {
            
            var adapter = orm.connections[key]._adapter;
            
            // ... and use the relevant adapter to kill it. 
            if (typeof adapter.teardown === "function") {
                
                adapter.teardown(function() {
                    cbDone();
                });
                
            } else {
                cbDone();
            }
            
        },
        function (err) {
            done(err);
        });
        
    });
    
});

