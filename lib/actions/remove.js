/**
 * Module dependencies
 */
var Boom = require('boom');
var Hoek = require('hoek');
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
    
    var RequestState = request.plugins.bedwetter = {
      action: 'remove',
      options: options
    };
    
    var actionUtil = require('../actionUtil')(request, options);
    
    // Ensure a model and alias can be deduced from the request.
    var Model = actionUtil.parseModel();
    var relation = options.associationAttr;
    
    if (!relation) {
      return reply(Boom.wrap(new Error('Missing required route option, `options.associationAttr`.')));
    }
  
    var associationAttr = _.findWhere(options.associations, { alias: relation });
    Hoek.assert(_.isObject(associationAttr), 'Bad association.');
  
    var ChildModel = request.model[associationAttr.collection];
    var childPkAttr = ChildModel.primaryKey;
  
    // The primary key of the parent record
    var parentPk;
    
    try {
      parentPk = actionUtil.requirePk();
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
  
    // The primary key of the child record to remove
    // from the aliased collection
    var childPk;
    
    try {
      childPk = actionUtil.requirePk(true);
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    Model
    .findOne(parentPk).populate(relation, childPk).exec(function found(err, parentRecord) {
      
      if (err)
        return reply(WL2Boom(err));
      
      // That parent record wasn't found
      if (!parentRecord)
        return reply(Boom.notFound());
      
      // Check parent record owner
      if (!actionUtil.validOwnership(parentRecord, false))
        return reply(Boom.unauthorized());
      
      // That child record wasn't found.
      if (!parentRecord[relation] || !parentRecord[relation][0])
        return reply(Boom.notFound());
      
      // Check child record owner
      if (!actionUtil.validOwnership(parentRecord[relation][0], true))
        return reply(Boom.unauthorized());
      
      parentRecord[relation].remove(parentRecord[relation][0][childPkAttr]);
      
      parentRecord.save(function(err, parentRecordSaved) {
        
        if (err) return reply(WL2Boom(err));
        
        // Share primary and secondary records
        RequestState.primaryRecord   = parentRecordSaved;
        RequestState.secondaryRecord = parentRecord[relation][0];
        
        // "HTTP 204 / No Content" means success
        return reply().code(204);
        
      });
    });
  
  }
};
