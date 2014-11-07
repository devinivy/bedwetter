/**
 * Module dependencies
 */
var actionUtil = require('../actionUtil');
var Boom = require('boom');

/**
 * Find One Record
 *
 * get /:modelIdentity/:id
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified id.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to look up *
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findOneRecord (route, options) {
  
  return function(request, reply) {
    
    var Model = actionUtil.parseModel(request, options);
    var pk;
    
    try {
      pk = actionUtil.requirePk(request, options);
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    var query = Model.findOne(pk);
    
    query = actionUtil.populateEach(query, request, options);
    
    query.exec(function found(err, matchingRecord) {
      
      if (err)
        return reply(Boom.wrap(err));
      
      if (!matchingRecord)
        return reply(Boom.notFound('No record found with the specified `id`.'));
      
      if (!actionUtil.validOwnership(matchingRecord, false, request, options))
        return reply(Boom.unauthorized());
      
      reply(matchingRecord);
      
    });
    
  }
  
}
