/**
 * Module dependencies
 */
var Boom        = require('boom');
var _           = require('lodash');

/**
 * Find Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/find
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
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findRecords (route, options) {
  
  return function(request, reply) {
    
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
      
      if (err) return reply(Boom.wrap(err));
      
      // If count is set, this this an integer.  Otherwise, it's an array of matching records.
      return reply(matchingRecords);
      
    });
    
  }
};
