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


experiment('FindOne bedwetter', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();;

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
            }]);
            
            done();
        });
    });
    
    test('finds one.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.treats).to.not.be.an.array;
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });
    
    test('finds one and populates.', function (done) {
        
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
    
    after(function(done) {
        
        var orm = server.plugins.dogwater.zoo.waterline;
        
        // Take each connection used by the orm...
        Async.each(Object.keys(orm.connections), function(key, cbDone) {
            
            var adapter = orm.connections[key]._adapter;
            
            // ... and use the relevant adapter to kill it.
            if (typeof adapter.teardown === "function") {
                
                adapter.teardown(function(err) {
                    cbDone(err);
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


