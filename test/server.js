// Load modules
var Lab = require('lab');
var Hapi = require('hapi')
var Async = require('async')
var ServerSetup = require('./server.setup.js'); /* Adjust this path as necessary */

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var experiment = lab.experiment;
var test = lab.test;

/* ^^^ Get rid of aliases you don't use ^^^ */

experiment('Server', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();
    
    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {/* Plugin options */}, function(err) {
            
            if (err) done(err);
            
            done();
        });
    });
    
    test('errors when bedwetter has a /count postfix inappropriately.', function (done) {
        
        expect(function(){
            server.route({
                method: 'GET',
                path: '/zoo/{id1}/treats/{id2}/count',
                handler: {
                    bedwetter: {}
                }
            });
        }).to.throw(/count/);
        done();
    });
    
    test('errors when bedwetter doesn\'t match GET verb/path pattern requirement.', function (done) {
        
        expect(function(){
            server.route({
                method: 'GET',
                path: '/zoo/{id1}/{id2}',
                handler: {
                    bedwetter: {}
                }
            });
        }).to.throw(/get/i);
        
        done();
    });
    
    test('errors when bedwetter doesn\'t match POST verb/path pattern requirement.', function (done) {
        
        expect(function(){
            server.route({
                method: 'POST',
                path: '/zoo/{id1}/{id2}',
                handler: {
                    bedwetter: {}
                }
            });
        }).to.throw(/post/i);
        
        done();
    });
    
    test('errors when bedwetter doesn\'t match PUT verb/path pattern requirement.', function (done) {
        
        expect(function(){
            server.route({
                method: 'PUT',
                path: '/zoo/{id1}/{id2}',
                handler: {
                    bedwetter: {}
                }
            });
        }).to.throw(/put/i);
        
        done();
    });

    test('errors when bedwetter doesn\'t match PATCH verb/path pattern requirement.', function (done) {
        
        expect(function(){
            server.route({
                method: 'PATCH',
                path: '/zoo/{id1}/{id2}',
                handler: {
                    bedwetter: {}
                }
            });
        }).to.throw(/patch/i);
        
        done();
    });
    
    test('errors when bedwetter doesn\'t match DELETE verb/path pattern requirement.', function (done) {
        
        expect(function(){
            server.route({
                method: 'DELETE',
                path: '/zoo/{id1}/{id2}',
                handler: {
                    bedwetter: {}
                }
            });
        }).to.throw(/delete/i);
        
        done();
    });
    
    after(function(done) {
        
        var orm = server.plugins.dogwater.zoo.waterline;
        
        /* Take each connection used by the orm... */
        Async.each(Object.keys(orm.connections), function(key, cbDone) {
            
            var adapter = orm.connections[key]._adapter;
            
            /* ... and use the relevant adapter to kill it. */
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


