/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');
var _ = require('lodash');
var GeneralUtil = require('../generalUtil');

/**
 * Populate an association
 *
 * get /model/:parentid/relation
 * get /model/:parentid/relation/:id
 *
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 *
 */

module.exports = function expand(route, origOptions) {
  
  return function(request, reply) {
    
    // Transform the original options using options hook
    var options = GeneralUtil.applyOptionsHook(request, origOptions);
    
    var RequestState = request.plugins.bedwetter = {
      action: 'populate',
      options: options
    };
    
    var actionUtil = require('../actionUtil')(request, options);
    
    var Model = actionUtil.parseModel();
    var relation = options.associationAttr;
    
    if (!relation || !Model) return reply(Boom.notFound());
    
    var parentPk;
    
    try {
      parentPk = actionUtil.requirePk();
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    // Determine whether to populate using a criteria, or the
    // specified primary key of the child record, or with no
    // filter at all.
    var childPk = actionUtil.parsePk(true);
    var criteria;
    
    if (childPk) {
      
      criteria = childPk;
      
    } else {
      
      if (options._private.count) {
        
        criteria = {
          where:  actionUtil.parseCriteria(true)
        };
        
      } else {
      
        criteria = {
          where:  actionUtil.parseCriteria(true),
          skip:   actionUtil.parseSkip(),
          limit:  actionUtil.parseLimit(),
          sort:   actionUtil.parseSort()
        };  
      
      }
    }
    
    Model
      .findOne(parentPk)
      .populate(relation, criteria)
      .exec(function found(err, matchingRecord) {
        
        if (err)
          return reply(WL2Boom(err));
        
        if (!matchingRecord)
          return reply(Boom.notFound('No record found with the specified id.'));
        
        if (!actionUtil.validOwnership(matchingRecord, false))
          return reply(Boom.unauthorized());
        
        if (!matchingRecord[relation])
          return reply(Boom.notFound(util.format('Specified record (%s) is missing relation `%s`', GeneralUtil.pkToString(parentPk), relation)));
        
        // Share primary record
        RequestState.primaryRecord = matchingRecord;
        
        // If looking for a particular relation, return that it exists or that it does not.
        // Otherwise, just return the results.
        if (childPk) {
          
          if (matchingRecord[relation].length) {
            
            if (actionUtil.validOwnership(matchingRecord[relation][0], true)) {
              
              // Share secondary record
              RequestState.secondaryRecord = matchingRecord[relation][0];
              
              // The relation exists.  Acknowledge with "204 No Content"
              return reply().code(204);
            
            } else {
              
              // Not authorized to check, didn't own child record
              return reply(Boom.unauthorized());
              
            }
            
          } else {
            
            // The relation does not exist.  That's a 404!
            return reply(Boom.notFound());
          }
          
        } else {
          
          if (options._private.count) {
            
            // Here's your count!
            return reply(matchingRecord[relation].length);
            
          } else {
            
            // Omit fields if necessary
            actionUtil.omitFields(matchingRecord[relation]);
            
            // Here are your results
            return reply(matchingRecord[relation]);
          
          }
          
        }
        
      
      });
    
  }
  
};
