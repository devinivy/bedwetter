/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');
var Async = require('async');
var GeneralUtil = require('../generalUtil');


/**
 * Update One Record
 *
 * An API call to update a model instance with the specified `id`,
 * treating the other unbound parameters as attributes.
 *
 */

module.exports = function updateOneRecord (route, origOptions) {
  
  return function(request, reply) {
    
    // Transform the original options using options hook
    var options = GeneralUtil.applyOptionsHook(request, origOptions);
    
    var RequestState = request.plugins.bedwetter = {
      action: 'update',
      options: options
    };
    
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
    Async.waterfall([
      
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
      function(matchingRecord, cb) {
        
        Model.update(matchingRecord[Model.primaryKey], values).exec(function updated(err, records) {
            
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
      function(err, updatedRecord) {
      
        if (err) return reply(WL2Boom(err));
        
        // Share primary record
        RequestState.primaryRecord = updatedRecord;
        
        // Omit fields if necessary
        actionUtil.omitFields(updatedRecord);
        
        return reply(updatedRecord); 
        
    });
    
  }
};
