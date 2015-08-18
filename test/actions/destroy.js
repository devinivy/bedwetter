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
    
    // This will be a hapi server for each test.
    var server = new Hapi.Server();
    var errors = [];
    server.connection();

    // Setup hapi server to register the plugin
    before(function(done){
        
        ServerSetup(server, {}, function(err) {
            
            if (err) done(err);
            
            server.route([
            { // destroy
                method: 'DELETE',
                path: '/treat/{id}',
                handler: {
                    bedwetter: {}
                }
            },
            { // destroy
                method: 'DELETE',
                path: '/failures/{id}',
                handler: {
                    bedwetter: {}
                }
            }]);
            
            server.on('request-error', function (request, error) {
                errors.push({
                    request: request,
                    error: error
                });
            });
            
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
        });
        
    });

    test('serves 404 when trying to delete a non-existent record.', function (done) {
        
        server.inject({
            method: 'DELETE',
            url: '/treat/42'
        }, function(res) {
            
            expect(res.statusCode).to.equal(404);
            
            // Make sure the bedwetter sets request state
            var RequestState = res.request.plugins.bedwetter;
            expect(RequestState).to.be.an.object;
            expect(RequestState).to.have.keys(['action', 'options']);
            expect(RequestState.action).to.equal('destroy');
            expect(RequestState.options).to.be.an.object;
            expect(RequestState.primaryRecord).to.not.exist();
            //console.log(res.statusCode, res.result);
            
            done();
        })
        
    });


    /*test('wraps Waterline errors when initial find fails.', function (done) {
        
        server.ext('onPreHandler', function(request, reply) {

            request.model.treat.findOne = function() {
                return {
                    exec: function(cb) {
                        cb(new Error('findOne error.'))
                    }
                }
            };
            reply.continue();
        });

        server.inject({
            method: 'DELETE',
            url: '/treat/2'
        }, function(res) {

            expect(res.statusCode).to.equal(500);
            expect(res.result.message).to.equal('An internal server error occurred');

            expect(errors).to.have.length(1);
            expect(errors[0].request).to.equal(res.request);
            console.log(errors[0].error);
            expect(errors[0].error.message).to.contain('findOne error.');
            
            done();
        })
        
    });*/

    after(function(done) {
        Memory.teardown(done);
    });
    
});

