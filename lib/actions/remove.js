/**
 * Module dependencies
 */
var actionUtil = require('../actionUtil');
var Boom = require('boom');
var _ = require('lodash');


/**
 * Remove a member from an association
 *
 * @param {Integer|String} parentid  - the unique id of the parent record
 * @param {Integer|String} id  - the unique id of the child record to remove
 *
 * @option {String} model  - the identity of the model
 * @option {String} alias  - the name of the association attribute (aka "alias")
 */

module.exports = function remove(route, options) {
  
  return function(request, reply) {
  
    // Ensure a model and alias can be deduced from the request.
    var Model = actionUtil.parseModel(request, options);
    var relation = options.associationAttr;
    
    if (!relation) {
      return reply(Boom.wrap(new Error('Missing required route option, `options.associationAttr`.')));
    }
  
    // The primary key of the parent record
    var parentPk = actionUtil.parsePk(request, options);
  
    // The primary key of the child record to remove
    // from the aliased collection
    var childPk = actionUtil.parsePk(request, options, true);
    
    Model
    .findOne(parentPk).populate(relation, childPk).exec(function found(err, parentRecord) {
      
      if (err) return reply(Boom.wrap(err));
      
      // That parent record wasn't found
      if (!parentRecord) return reply(Boom.notFound());
      
      // Check parent record owner
      if (!actionUtil.validOwnership(parentRecord, false, request, options))
        return reply(Boom.unauthorized());
      
      // That child record wasn't found.
      if (!parentRecord[relation] || !parentRecord[relation][0]) return reply(Boom.notFound());
  
      // Check child record owner
      if (!actionUtil.validOwnership(parentRecord[relation][0], true, request, options))
        return reply(Boom.unauthorized());
  
      parentRecord[relation].remove(childPk);
      
      parentRecord.save(function(err, parentRecord) {
        
        if (err) return reply(Boom.wrap(err));
        
        // "HTTP 204 / No Content" means success
        reply().code(204);
        
      });
    });
  
  }
};
