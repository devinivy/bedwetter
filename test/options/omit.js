// Load modules
var Lab = require('lab');
var Hapi = require('hapi')
var Memory = require('sails-memory')
var Async = require('async')
var ServerSetup = require('../server.setup.js');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var experiment = lab.experiment;
var test = lab.test;

experiment('omit option', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();

    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {
            omit: ['name']
        }, function(err) {
            
            if (err) done(err);
            
            server.route([
            { // Get a treat if it's owned by the user
                method: 'GET',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            },
            { // Get treats owned by user
                method: 'GET',
                path: '/treat',
                handler: {
                    bedwetter: {}
                }
            },
            { // Get associated records
                method: 'GET',
                path: '/zoo/{id}/treats',
                handler: {
                    bedwetter: {}
                }
            },
            { // Update a record
                method: 'PATCH',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            },
            { // Create a record
                method: 'POST',
                path: '/treat',
                handler: {
                    bedwetter: {}
                }
            },
            { // Create/add a record
                method: 'POST',
                path: '/zoo/{id}/treats',
                handler: {
                    bedwetter: {}
                }
            },
            { // Get a zoo
                method: 'GET',
                path: '/zoo/{id}',
                handler: {
                    bedwetter: {
                        omit: 'id'
                    }
                }
            },
            { // Get zoos
                method: 'GET',
                path: '/zoo',
                handler: {
                    bedwetter: {
                        omit: ['treats.dd']
                    }
                }
            }]);
            
            done();
        });
    });
    
    test('omits on findOne.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result).to.contain.keys(['id', 'animalOwner']);
            expect(res.result).to.not.contain.keys(['name']);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });

    test('omits on find.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(3);
            
            res.result.forEach(function(item) {
                
                expect(item).to.contain.keys(['id', 'animalOwner']);
                expect(item).to.not.contain.keys(['name']);
            });
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('omits on populated array.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            
            res.result.forEach(function(item) {
                
                expect(item).to.contain.keys(['id', 'animalOwner']);
                expect(item).to.not.contain.keys(['name']);
            });
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('omits on update.', function (done) {
        
        server.inject({
            method: 'PATCH',
            url: '/treat/2',
            payload: {
                animalOwner: 2
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result).to.contain.keys(['id', 'animalOwner']);
            expect(res.result.animalOwner).to.equal(2);
            expect(res.result).to.not.contain.keys(['name']);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('omits on create.', function (done) {
        
        server.inject({
            method: 'POST',
            url: '/treat',
            payload: {
                name: "Wings",
                animalOwner: 1
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(201);
            expect(res.result).to.be.an.object;
            expect(res.result).to.contain.keys(['id', 'animalOwner']);
            expect(res.result.animalOwner).to.equal(1);
            expect(res.result).to.not.contain.keys(['name']);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('omits on adding a created record.', function (done) {
        
        server.inject({
            method: 'POST',
            url: '/zoo/1/treats',
            payload: {
                name: "Brisket",
                animalOwner: 2
            }
        }, function(res) {
            
            expect(res.statusCode).to.equal(201);
            expect(res.result).to.be.an.object;
            expect(res.result).to.contain.keys(['id', 'animalOwner']);
            expect(res.result.animalOwner).to.equal(2);
            expect(res.result).to.not.contain.keys(['name']);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('omits using route options, allows string as option.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result).to.contain.keys(['name']);
            expect(res.result.name).to.equal("Portland, ME Zoo");
            expect(res.result).to.not.contain.keys(['id']);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('omits deeply when populating a field.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo?populate=treats'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            
            res.result.forEach(function(item) {
                
                expect(item).to.contain.keys(['id', 'treats']);
                expect(item.treats).to.not.contain.keys(['name']);
            });
            
            done();
        });
        
    });
    
    test('does not fail when omitting deeply, but not populating a field.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo'
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            
            res.result.forEach(function(item) {
                
                expect(item.treats).to.not.contain.keys(['treats']);
            });
            
            done();
        });
        
    });
    
    test('omits using query and options.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/1?omit[]=id'
        }, function(res) {
            
            expect(res.result).to.be.an.object;
            expect(res.result).to.contain.keys(['animalOwner']);
            expect(res.result.animalOwner).to.equal(2);
            expect(res.result).to.not.contain.keys(['id', 'name']);
            
            done();
        });
        
    });
    
    after(function(done) {
        
        Memory.teardown(done);
    });
    
});


