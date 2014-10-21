/**
 * Module dependencies
 */
var Boom = require('boom');
var actionUtil = require('../actionUtil');


/**
 * Populate (or "expand") an association
 *
 * get /model/:parentid/relation
 * get /model/:parentid/relation/:id
 *
 * @param {Integer|String} parentid  - the unique id of the parent instance
 * @param {Integer|String} id  - the unique id of the particular child instance you'd like to look up within this relation
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 *
 * @option {String} model  - the identity of the model
 * @option {String} alias  - the name of the association attribute (aka "alias")
 */

module.exports = function expand(route, options) {
  
  return function(request, reply) {
    
    var Model = actionUtil.parseModel(request, options);
    var relation = options.associationAttr;
    
    if (!relation || !Model) return reply(Boom.notFound());
    
    var parentPk = actionUtil.requirePk(request, options);

    // Determine whether to populate using a criteria, or the
    // specified primary key of the child record, or with no
    // filter at all.
    var childPk = actionUtil.parsePk(request, options, true);
    var criteria;
    
    if (childPk) {
      
      criteria = childPk;
      
    } else {
      
      criteria = {
        where:  actionUtil.parseCriteria(request, options),
        skip:   actionUtil.parseSkip(request, options),
        limit:  actionUtil.parseLimit(request, options),
        sort:   actionUtil.parseSort(request, options)
      };
      
    }
    
    Model
      .findOne(parentPk)
      .populate(relation, criteria)
      .exec(function found(err, matchingRecord) {
        
        if (err) return reply(Boom.wrap(err));
        if (!matchingRecord) return reply(Boom.notFound('No record found with the specified id.'));
        if (!matchingRecord[relation]) return reply(Boom.notFound(util.format('Specified record (%s) is missing relation `%s`', parentPk, relation)));
        
        return reply(matchingRecord);
      
      });
    
  }
  
};
