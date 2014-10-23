/**
 * Module dependencies
 */

var _ = require('lodash');
var mergeDefaults = require('merge-defaults');
var Boom = require('boom');
var Hoek = require('hoek');
var util = require('util');


/**
 * Utility methods used in built-in blueprint actions.
 *
 * @type {Object}
 */
module.exports = {

  /** 
   * Given a Waterline query, populate the appropriate/specified
   * association attributes and return it so it can be chained
   * further ( i.e. so you can .exec() it )
   *
   * @param  {Query} query         [waterline query object]
   * @param  {Request} request
   * @param  {Object} options
   * @return {Query}
   */
  populateEach: function (query, request, options) {
    var DEFAULT_POPULATE_LIMIT = 30;
    var _options = options;
    var aliasFilter = request.query.populate;
    var shouldPopulate = _options.populate;

    // Convert the string representation of the filter list to an Array. We
    // need this to provide flexibility in the request param. This way both
    // list string representations are supported:
    //   /model?populate=alias1,alias2,alias3
    //   /model?populate=[alias1,alias2,alias3]
    if (typeof aliasFilter === 'string') {
      aliasFilter = aliasFilter.replace(/\[|\]/g, '');
      aliasFilter = (aliasFilter) ? aliasFilter.split(',') : [];
    }
    
    return _(_options.associations).reduce(function populateEachAssociation (query, association) {

      // If an alias filter was provided, override the blueprint config.
      if (aliasFilter) {
        shouldPopulate = _.contains(aliasFilter, association.alias);
      }
      
      // TODO: use max limit!
      // Only populate associations if a population filter has been supplied
      // with the request or if `populate` is set within the blueprint config.
      // Population filters will override any value stored in the config.
      //
      // Additionally, allow an object to be specified, where the key is the
      // name of the association attribute, and value is true/false
      // (true to populate, false to not)
      if (shouldPopulate) {
        
        var populationLimit =
          _options['populate_'+association.alias+'_limit'] ||
          _options.populateLimit ||
          _options.limit ||
          DEFAULT_POPULATE_LIMIT;
          
        return query.populate(association.alias, {limit: populationLimit});
      
      } else {
        
        return query;
        
      }
      
    }, query);
  },
  
  

  /**
   * Parse primary key value for use in a Waterline criteria
   * (e.g. for `find`, `update`, or `destroy`)
   *
   * @param  {Request} request
   * @param  {Object} options
   * @param  {Boolean} child
   * @return {Integer|String}
   */
  parsePk: function (request, options, child) {
    
    var primaryKeyParam;
    
    child = child || false;
    
    if (child) {
      primaryKeyParam = options.associatedPkName;
    }  else {
      primaryKeyParam = options.pkName;
    }
    
    //TODO: support these options..id for parent and child
    var pk;
    
    // If we're acting as the user and the model is the users model, grab the user's pk from auth credentials.
    if (!child &&
        options.actAsUser &&
        options.model === options.userModel) {
      
      pk = this.getUserId(request, options);
      
    } else { // Otherwise, grab it as per usual.
      
      pk = options.id || (options.where && options.where.id) || request.params[primaryKeyParam];
    }
    
    // TODO: make this smarter...
    // (e.g. look for actual primary key of model and look for it
    //  in the absence of `id`.)
    // See coercePK for reference (although be aware it is not currently in use)

    // exclude criteria on id field
    pk = _.isPlainObject(pk) ? undefined : pk;
    
    // If this really looks like an integer, it probably is.
    // We now use id criteria in a way that waterline will do any seemingly-necessary number casting
    /*if (pk == parseInt(pk)) {
      pk = parseInt(pk);
    }*/
    
    return pk;
  },

  /** 
   * Parse primary key value from parameters.
   * Throw an error if it cannot be retrieved.
   *
   * @param  {Request} request
   * @param  {Object} options
   * @param  {Boolean} child
   * @return {Integer|String}
   */
  requirePk: function (request, options, child) {
    
    child = child || false;
    
    var pk = this.parsePk(request, options, child);

    // Validate the required `id` parameter
    if ( !pk ) {
      
      var err;
      
      // Acting as user, model is the user model, so pk came from credentials.
      if (!child &&
          options.actAsUser &&
          options.model === options.userModel) {
        
        err = Boom.unauthorized();
        
      } else {
        
        // TODO: error message here.
        err = Boom.notFound();
      }
      
      throw err;
    }

    return pk;
  },



  /** 
   * Parse `criteria` for a Waterline `find` or `populate` from query parameters.
   *
   * @param  {Request} request
   * @param  {Object} options
   * @return {Object}            the WHERE criteria object
   */
  parseCriteria: function (request, options, child) {

    // Allow customizable blacklist for params NOT to include as criteria.
    options.criteria = options.criteria || {};
    options.criteria.blacklist = options.criteria.blacklist || ['limit', 'skip', 'sort', 'populate'];

    // Validate blacklist to provide a more helpful error msg.
    var blacklist = options.criteria && options.criteria.blacklist;
    
    Hoek.assert(_.isArray(blacklist), 'Invalid `options.criteria.blacklist`. Should be an array of strings (parameter names.)');

    // Look for explicitly specified `where` parameter.
    var where = request.query.where;

    // If `where` parameter is a string, try to interpret it as JSON
    if (_.isString(where)) {
      where = tryToParseJSON(where);
    }

    // If `where` has not been specified, but other unbound parameter variables
    // **ARE** specified, build the `where` option using them.
    if (!where) {

      // Prune params which aren't fit to be used as `where` criteria
      // to build a proper where query
      where = request.query;

      // Omit built-in runtime config (like query modifiers)
      where = _.omit(where, blacklist || ['limit', 'skip', 'sort']);

      // Omit any params w/ undefined values
      where = _.omit(where, function (p){ return _.isUndefined(p); });

      // Omit jsonp callback param (but only if jsonp is enabled)
      if (request.route.jsonp) {
        delete where[request.route.jsonp]
      }
    }

    // Merge w/ options.where and return
    where = _.merge({}, options.where || {}, where) || undefined;
    
    // Deal with ownership
    if (options.actAsUser && options.requireOwner) {
      
      // Grab appropriate attribute name for primary or child model
      var ownerAttrName = child ? options.childOwnerAttr : options.ownerAttr;
      Hoek.assert(_.isString(ownerAttrName) || !ownerAttrName, 'Owner attribute option (`options.childOwnerAttr` or `options.ownerAttr`) must be a string or falsy.');
      
      // If there's an owner attribute set, set it as criteria
      if (ownerAttrName) {
        where[ownerAttrName] = this.getUserId(request, options);
      } 
      
    }
    
    return where;
  },


  /** TODO
   * Parse `values` for a Waterline `create` or `update` from all
   * request parameters.
   *
   * @param  {Request} req
   * @return {Object}
   */
  parseValues: function (request, options, child) {

    // Allow customizable blacklist for params NOT to include as values.
    options.values = options.values || {};

    // Validate blacklist to provide a more helpful error msg.
    var blacklist = options.values.blacklist || [];
    Hoek.assert(_.isArray(blacklist), 'Invalid `options.values.blacklist`. Should be an array of strings (parameter names.)');

    // Merge payload into req.options.values, omitting the blacklist.
    var values = mergeDefaults(_.cloneDeep(request.payload), _.omit(options.values, 'blacklist'));

    // Omit values that are in the blacklist (like query modifiers)
    values = _.omit(values, blacklist);

    // Omit any values w/ undefined values
    values = _.omit(values, function (p){ return _.isUndefined(p); });
    
    // Set owner value if we ought
    if (options.actAsUser &&
        options.setOwner) {
      
      // Grab appropriate attribute name for primary or child model
      var ownerAttrName = child ? options.childOwnerAttr : options.ownerAttr;
      Hoek.assert(_.isString(ownerAttrName), 'Owner attribute option (`options.childOwnerAttr` or `options.ownerAttr`) must be a string.');
      
      // Don't override if owner is set explicitly
      if (_.isUndefined(values[ownerAttrName]) || _.isNull(values[ownerAttrName])) {
        
        values[ownerAttrName] = this.getUserId(request, options);
        
      }
      
    }
    
    return values;
  },



  /**
   * Determine the model class to use w/ this blueprint action.
   * @param  {Request} request
   * @param  {Object} options
   * @return {WLCollection}
   */
  parseModel: function (request, options) {

    // Ensure a model can be deduced from the request options.
    
    var model = options.model;
    if (!model) throw new Error(util.format('No `model` specified in route options.'));

    var Model = request.model[model];
    if (!Model) throw new Error(util.format('Invalid route option, `model`.\nI don\'t know about any models named: `%s`',model));

    return Model;
  },



  /** 
   * @param  {Request} request
   * @param  {Object} options
   */
  parseSort: function (request, options) {
    return request.query.sort || options.sort || undefined;
  },

  /**
   * @param  {Request} request
   * @param  {Object} options
   */
  parseLimit: function (request, options) {
    
    var DEFAULT_LIMIT = 30;
    var DEFAULT_MAX_LIMIT = 30;
    
    var requestedLimit = request.query.limit ?
                          Math.abs(request.query.limit) || false :
                          false;
    
    var maxLimit       = (typeof options.maxLimit !== 'undefined') ?
                          options.maxLimit :
                          DEFAULT_MAX_LIMIT;
    
    var limit;
    
    if (requestedLimit) {
      
      if (requestedLimit <= maxLimit) {
        limit = requestedLimit;
      } else {
        limit = DEFAULT_LIMIT;
      }
      
    } else if (typeof options.limit !== 'undefined') {
      
      limit = options.limit;
    } else {
      
      limit = DEFAULT_LIMIT;
    }
    
    // This is from sails.  What does it do?
    // I suppose it would cast skip to something falsy if it were not a number.
    if (limit) { limit = +limit; }
    
    return limit;
  },


  /** 
   * @param  {Request} request
   * @param  {Object} options
   */
  parseSkip: function (request, options) {
    var DEFAULT_SKIP = 0;
    var skip = request.query.skip || (typeof options.skip !== 'undefined' ? options.skip : DEFAULT_SKIP);
    
    // This is from sails.  What does it do?
    // I suppose it would cast skip to something falsy if it were not a number.
    if (skip) { skip = +skip; }
    
    return skip;
  },
  
  getUserId: function(request, options) {
    
    Hoek.assert(options.actAsUser, 'Not currently acting as user, per `options.actAsUser`.');
    Hoek.assert(_.isString, '`options.userIdProperty` must be a string.');
    
    // No creds, no user id.
    if (!_.isObject(request.auth.credentials)) {
      return false;
    }
    
    var userId = Hoek.reach(request.auth.credentials, options.userIdProperty);
    
    return userId;
  },
  
  validOwnership: function(record, child, request, options) {
    
    if (!options.actAsUser || !options.requireOwner) {
      return true;
    }
    
    // Grab appropriate attribute name for primary or child model
    var attributeName = child ? options.childOwnerAttr : options.ownerAttr;
    Hoek.assert(_.isString(attributeName) || !attributeName, 'Owner attribute option (`options.childOwnerAttr` or `options.ownerAttr`) must be a string or falsy.');
    
    // There's no owner set for this record
    if (!attributeName) {
      return true;
    }
    
    var recordOwner = record[attributeName];
    Hoek.assert(!_.isUndefined(recordOwner), 'Record does not have provided owner attribute.')
    
    var actingUser = this.getUserId(request, options);
    
    return (recordOwner == actingUser);
    
  }
  
};


// Attempt to parse JSON
// If the parse fails, return the error object
// If JSON is falsey, return null
// (this is so that it will be ignored if not specified)
function tryToParseJSON (json) {
  if (!_.isString(json)) return null;
  try {
    return JSON.parse(json);
  }
  catch (e) { return e; }
}
