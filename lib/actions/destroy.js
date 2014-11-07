/**
 * Module dependencies
 */
var actionUtil = require('../actionUtil');
var Boom = require('boom');

/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *    *    /:modelIdentity/destroy/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to delete
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */
module.exports = function destroyOneRecord (route, options) {
  
  return function(request, reply) {
      
    var Model = actionUtil.parseModel(request, options);
    var pk;
    
    try {
      pk = actionUtil.requirePk(request, options);
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    Model.findOne(pk).exec(function foundRecord (err, record) {
      
      if (err)
        return reply(Boom.wrap(err));
      
      if(!record)
        return reply(Boom.notFound('No record found with the specified `id`.'));
      
      if(!actionUtil.validOwnership(record, false, request, options))
        return reply(Boom.unauthorized());
  
      Model.destroy(pk).exec(function destroyedRecord (err) {
        
        if (err) return reply(Boom.wrap(err));
        
        // "HTTP 204 / No Content" means success
        reply().code(204);
        
      });
    });
    
  }
};
