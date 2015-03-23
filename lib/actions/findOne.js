/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');
var GeneralUtil = require('../generalUtil');

/**
 * Find One Record
 *
 * get /:modelIdentity/:id
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified id.
 *
 */

module.exports = function findOneRecord (route, origOptions) {
  
  return function(request, reply) {
    
    // Transform the original options using options hook
    var options = GeneralUtil.applyOptionsHook(request, origOptions);
    
    var actionUtil = require('../actionUtil')(request, options);
    
    var Model = actionUtil.parseModel();
    var pk;
    
    try {
      pk = actionUtil.requirePk();
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    var query = Model.findOne(pk).where(actionUtil.checkDeletedFlag());
    
    query = actionUtil.populateEach(query);
    
    query.exec(function found(err, matchingRecord) {
      
      if (err)
        return reply(WL2Boom(err));
      
      if (!matchingRecord)
        return reply(Boom.notFound('No record found with the specified `id`.'));
      
      if (!actionUtil.validOwnership(matchingRecord, false))
        return reply(Boom.unauthorized());
      
      // Omit fields if necessary
      actionUtil.omitFields(matchingRecord);
      
      reply(matchingRecord);
      
    });
    
  }
  
}
