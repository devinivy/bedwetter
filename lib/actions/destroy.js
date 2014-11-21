/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');

/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 */
module.exports = function destroyOneRecord (route, options) {
  
  return function(request, reply) {
    
    var actionUtil = require('../actionUtil')(request, options);
    
    var Model = actionUtil.parseModel();
    var pk;
    
    try {
      pk = actionUtil.requirePk();
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    Model.findOne(pk).exec(function foundRecord (err, record) {
      
      if (err)
        return reply(WL2Boom(err));
      
      if(!record)
        return reply(Boom.notFound('No record found with the specified `id`.'));
      
      if(!actionUtil.validOwnership(record, false))
        return reply(Boom.unauthorized());
  
      Model.destroy(pk).exec(function destroyedRecord (err) {
        
        if (err) return reply(WL2Boom(err));
        
        // "HTTP 204 / No Content" means success
        reply().code(204);
        
      });
    });
    
  }
  
};
