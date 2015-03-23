/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');
var _ = require('lodash');
var GeneralUtil = require('../generalUtil');

/**
 * delete /model/:parentid/relation/:id
 * 
 * Remove a member from an association
 *
 */

module.exports = function remove(route, origOptions) {
  
  return function(request, reply) {
    
    // Transform the original options using options hook
    var options = GeneralUtil.applyOptionsHook(request, origOptions);
    
    var actionUtil = require('../actionUtil')(request, options);
    
    // Ensure a model and alias can be deduced from the request.
    var Model = actionUtil.parseModel();
    var relation = options.associationAttr;
    
    if (!relation) {
      return reply(Boom.wrap(new Error('Missing required route option, `options.associationAttr`.')));
    }
  
    // The primary key of the parent record
    var parentPk = actionUtil.parsePk();
  
    // The primary key of the child record to remove
    // from the aliased collection
    var childPk = actionUtil.parsePk(true);
    
    Model
    .findOne(parentPk).populate(relation, childPk).exec(function found(err, parentRecord) {
      
      if (err) return reply(WL2Boom(err));
      
      // That parent record wasn't found
      if (!parentRecord) return reply(Boom.notFound());
      
      // Check parent record owner
      if (!actionUtil.validOwnership(parentRecord, false))
        return reply(Boom.unauthorized());
      
      // That child record wasn't found.
      if (!parentRecord[relation] || !parentRecord[relation][0])
        return reply(Boom.notFound());
      
      // Check child record owner
      if (!actionUtil.validOwnership(parentRecord[relation][0], true))
        return reply(Boom.unauthorized());
      
      parentRecord[relation].remove(childPk);
      
      parentRecord.save(function(err, parentRecord) {
        
        if (err) return reply(WL2Boom(err));
        
        // "HTTP 204 / No Content" means success
        reply().code(204);
        
      });
    });
  
  }
};
