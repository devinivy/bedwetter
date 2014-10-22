/**
 * Module dependencies
 */

var actionUtil = require('../actionUtil');
var Boom = require('boom');
var Async = require('async');


/**
 * Update One Record
 *
 * An API call to update a model instance with the specified `id`,
 * treating the other unbound parameters as attributes.
 *
 * @param {Integer|String} id  - the unique id of the particular record you'd like to update  (Note: this param should be specified even if primary key is not `id`!!)
 * @param *                    - values to set on the record
 *
 */
module.exports = function updateOneRecord (route, options) {
  
  return function(request, reply) {
    
    // Look up the model
    var Model = actionUtil.parseModel(request, options);
  
    // Locate and validate the required `id` parameter.
    var pk = actionUtil.requirePk(request, options);
  
    // Create `values` object (monolithic combination of all parameters)
    // But omit the blacklisted params (like JSONP callback param, etc.)
    var values = actionUtil.parseValues(request, options);
  
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
          
          if (!actionUtil.validOwnership(matchingRecord, false, request, options))
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
      
        if (err) {
          return reply(Boom.wrap(err));
        }
        
        var updatedRecord = results[1];
        
        return reply(updatedRecord); 
        
    });
    
  }
};
