/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');
var Async = require('async');


/**
 * Update One Record
 *
 * An API call to update a model instance with the specified `id`,
 * treating the other unbound parameters as attributes.
 *
 */

module.exports = function updateOneRecord (route, options) {
  
  return function(request, reply) {
    
    var actionUtil = require('../actionUtil')(request, options);
    
    // Look up the model
    var Model = actionUtil.parseModel();
  
    // Locate and validate the required `id` parameter.
    var pk;
    
    try {
      pk = actionUtil.requirePk();
    } catch(e) {
      return reply(Boom.wrap(e)); 
    }
    
    // Create `values` object (monolithic combination of all parameters)
    // But omit the blacklisted params (like JSONP callback param, etc.)
    var values = actionUtil.parseValues();
  
    // Find, update, then reply
    Async.series([
      
      // Find
      function(cb) {
        
        // TODO: DRY this up with findOne?
        Model.findOne(pk).exec(function found(err, matchingRecord) {
          
          if (err)
            return cb(err);
          
          if (!matchingRecord)
            return cb(Boom.notFound('No record found with the specified `id`.'));
          
          if (!actionUtil.validOwnership(matchingRecord, false))
            return cb(Boom.unauthorized());
          
          return cb(null, matchingRecord);
          
        });
      },
      
      // Update
      function(cb) {
        
        Model.update(pk, values).exec(function updated(err, records) {
            
            // Differentiate between waterline-originated validation errors
            // and serious underlying issues. Respond with badRequest if a
            // validation error is encountered, w/ validation info.
            if (err) return cb(err);
      
            // Because this should only update a single record and update
            // returns an array, just use the first item.
            if (!records || !records.length) {
              return cb(Boom.notFound());
            }
            
            var updatedRecord = records[0];
            
            //If more than one record was returned, something is amiss.
            if (records.length > 1) {
              // TODO: Log it
            }
            
            return cb(null, updatedRecord);
            
        });
        
      }],
      
      // Reply
      function(err, results) {
      
        if (err) return reply(WL2Boom(err));
        
        var updatedRecord = results[1];
        
        // Omit fields if necessary
        actionUtil.omitFields(updatedRecord);
        
        return reply(updatedRecord); 
        
    });
    
  }
};
