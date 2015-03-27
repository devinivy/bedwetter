/**
 * Module dependencies
 */
var Boom        = require('boom');
var WL2Boom     = require('waterline-to-boom');
var _           = require('lodash');
var GeneralUtil = require('../generalUtil');

/**
 * Find Records
 *
 *  get   /:modelIdentity
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.  If an id was specified, just the instance
 * with that unique id will be returned.
 *
 * Optional:
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 * 
 */

module.exports = function findRecords (route, origOptions) {
  
  return function(request, reply) {
    
    // Transform the original options using options hook
    var options = GeneralUtil.applyOptionsHook(request, origOptions);
    
    var RequestState = request.plugins.bedwetter = {
      action: 'find',
      options: options
    };
    
    var actionUtil  = require('../actionUtil')(request, options);
    
    // Look up the model
    var Model = actionUtil.parseModel();
    
    // Lookup for records that match the specified criteria.  Are we just counting?
    var query;
    if (options._private.count) {
      
      query = Model.count()
      .where( actionUtil.parseCriteria() );
      
    } else {
      
      query = Model.find()
      .where( actionUtil.parseCriteria() )
      .limit( actionUtil.parseLimit() )
      .skip( actionUtil.parseSkip() )
      .sort( actionUtil.parseSort() );
      
      // TODO: .populateEach(req.options);
      query = actionUtil.populateEach(query);
      
    }
    
    query.exec(function found(err, matchingRecords) {
      
      if (err) return reply(WL2Boom(err));
      
      // Omit fields if necessary
      if (!options._private.count) {
        
        actionUtil.omitFields(matchingRecords);
      }
      
      // If count is set, this this an integer.  Otherwise, it's an array of matching records.
      return reply(matchingRecords);
      
    });
    
  }
};
