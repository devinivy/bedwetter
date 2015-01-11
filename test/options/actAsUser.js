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

experiment('actAsUser option', function () {
    
    // This will be a Hapi server for each test.
    var server = new Hapi.Server();
    server.connection();

    // Setup Hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {
            actAsUser: true,
            userModel: 'animals',
            userIdProperty: 'animal.id',
            userUrlPrefix: '/animal'
        }, function(err) {
            
            if (err) done(err);
            
            server.route([
            { // Get a treat if it's owned by the user
                method: 'GET',
                path: '/treat/{id}',
                config: {
                    auth: {
                        strategy: 'default',
                        mode: 'try'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        ownerAttr: 'animalOwner'
                    }
                }
            },
            { // Get treats owned by user
                method: 'GET',
                path: '/treat',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        ownerAttr: 'animalOwner'
                    }
                }
            },
            { // Check record association
                method: 'GET',
                path: '/zoo/{id}/treats/{childId}',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        childOwnerAttr: 'animalOwner',
                        ownerAttr: false
                    }
                }
            },
            { // Add record association
                method: 'PUT',
                path: '/zoo/{id}/treats/{childId}',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        childOwnerAttr: 'animalOwner',
                        ownerAttr: false
                    }
                }
            },
            { // Remove record association
                method: 'DELETE',
                path: '/zoo/{id}/treats/{childId}',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        childOwnerAttr: 'animalOwner',
                        ownerAttr: false
                    }
                }
            },
            { // Update a record
                method: 'PATCH',
                path: '/treat/{id}',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        ownerAttr: 'animalOwner'
                    }
                }
            },
            { // Remove a record
                method: 'DELETE',
                path: '/treat/{id}',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        requireOwner: true,
                        ownerAttr: 'animalOwner'
                    }
                }
            },
            { // Create a record
                method: 'POST',
                path: '/treat',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        setOwner: true,
                        ownerAttr: 'animalOwner'
                    }
                }
            },
            { // Create/add a record
                method: 'POST',
                path: '/zoo/{id}/treats',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {
                        setOwner: true,
                        childOwnerAttr: 'animalOwner'
                    }
                }
            },
            { // Get this user's treats
                method: 'GET',
                path: '/animal/treats',
                config: {
                    auth: {
                        strategy: 'default',
                        mode: 'try'
                    }
                },
                handler: {
                    bedwetter: {}
                }
            },
            { // Get a particular animal (user)
                method: 'GET',
                path: '/animals/{id}',
                config: {
                    auth: {
                        strategy: 'default'
                    }
                },
                handler: {
                    bedwetter: {}
                }
            }]);
            
            done();
        });
    });
    
    test('(populate) allows a prefix signifying the the primary model is user and and primary model id is that of the logged-in user.', function (done) {
        
        server.inject({ /* Test a route! */
            method: 'GET',
            url: '/animal/treats',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    // TODO: reconcile when creds are set but user is unauthorized, i.e. with try mode.
    test('(populate) returns Unauthorized if there are no credentials when using prefix.', function (done) {
        
        server.inject({ /* Test a route! */
            method: 'GET',
            url: '/animal/treats',
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            expect(res.result).to.be.an.object;
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(findOne) with requireOwner and an ownerAttr, allows viewing a record that is owned by the user.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/2',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.id).to.equal(2);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(findOne) with requireOwner and an ownerAttr, rejects viewing a record that isn\'t owned by the user.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat/1',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(find) with requireOwner and an ownerAttr, only returns a list of records owned by the user.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/treat',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array;
            expect(res.result).to.have.length(2);
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(populate) with requireOwner and childOwnerAttr, will not display info about record association if bad credentials.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats/1',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            expect(res.result).to.be.an.object;
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });

    test('(populate) with requireOwner, childOwnerAttr, and false ownerAttr, will display info about record association if good credentials for only associated record.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/zoo/1/treats/2',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    test('(update) with requireOwner and ownerAttr, succeeds if good credentials.', function (done) {
        
        server.inject({
            method: 'PATCH',
            url: '/treat/2',
            payload: {
                name: 'Hot Dogs'
            },
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.name).to.equal('Hot Dogs');
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    test('(update) with requireOwner and ownerAttr, fails if bad credentials.', function (done) {
        
        server.inject({
            method: 'PATCH',
            url: '/treat/2',
            payload: {
                name: 'Hot Dogs'
            },
            headers: { authorization: 'Custom Kitty' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    test('(add) with requireOwner, childOwnerAttr, and false ownerAttr, succeeds if good credentials.', function (done) {
        
        server.inject({
            method: 'PUT',
            url: '/zoo/1/treats/1',
            payload: {
                name: 'Hot Dogs'
            },
            headers: { authorization: 'Custom Kitty' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    test('(add) with requireOwner, childOwnerAttr, and false ownerAttr, fails if bad credentials.', function (done) {
        
        server.inject({
            method: 'PUT',
            url: '/zoo/1/treats/1',
            payload: {
                name: 'Hot Dogs'
            },
            headers: { authorization: 'Custom Doggy' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    // TODO: decide whether 401s should be 404s.  the order of these next two tests affects the outcome of this test.
    // The outcome of the second test verifies this one is correct.
    test('(remove) with requireOwner, childOwnerAttr, and false ownerAttr, fails if bad credentials.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/zoo/1/treats/1',
            payload: {
                name: 'Hot Dogs'
            },
            headers: { authorization: 'Custom Doggy' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    test('(remove) with requireOwner, childOwnerAttr, and false ownerAttr, succeeds if good credentials.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/zoo/1/treats/1',
            payload: {
                name: 'Hot Dogs'
            },
            headers: { authorization: 'Custom Kitty' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    test('(destroy) with requireOwner and ownerAttr, fails if bad credentials.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/2',
            headers: { authorization: 'Custom Kitty' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(401);
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });

    test('(destroy) with requireOwner and ownerAttr, succeeds if good credentials.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/2',
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(204);
            expect(res.result).to.be.null;
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });

    test('(create) with setOwner and ownerAttr sets owner on record.', function (done) {
        
        server.inject({
            method: 'POST',
            url: '/treat',
            payload: {
                name: "Wings"
            },
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(201);
            expect(res.result).to.be.an.object;
            expect(res.result.animalOwner).to.equal(1);
            //console.log(res.statusCode, res.result);

            done();
        });
        
    });
    
    // TODO: do this with requireOwner too
    test('(add) with setOwner and childOwnerAttr sets owner on a to-be-associated record.', function (done) {
        
        server.inject({
            method: 'POST',
            url: '/zoo/1/treats',
            payload: {
                name: "Fried Pickles"
            },
            headers: { authorization: 'Custom Doggie' }
        }, function(res) {
            
            expect(res.statusCode).to.equal(201);
            expect(res.result).to.be.an.object;
            expect(res.result.animalOwner).to.equal(1);
            expect(res.result.name).to.equal("Fried Pickles");
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    test('(findOne) does not automatically set primary record on a normal users path.', function (done) {
        
        server.inject({
            method: 'GET',
            url: '/animals/1',
            headers: { authorization: 'Custom Kitty' } // id: 2
        }, function(res) {
            
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object;
            expect(res.result.id).to.equal(1);
            expect(res.result.species).to.equal("Doggie");
            //console.log(res.statusCode, res.result);
            
            done();
        });
        
    });
    
    after(function(done) {
        Memory.teardown(done);
    });
    
});


