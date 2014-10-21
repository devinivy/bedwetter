/**
 * Module dependencies
 */

var _ = require('lodash');
var Call = require('call');
var Hoek = require('hoek');
// var pluralize = require('pluralize');
var BedWetters = {
    create  : require('./actions/create'),
    find    : require('./actions/find'),
    findone : require('./actions/findOne'),
    update  : require('./actions/update'),
    destroy : require('./actions/destroy'),
    populate: require('./actions/populate'),
    add     : require('./actions/add'),
    remove  : require('./actions/remove'),
}


var internals = {};

internals.defaults = {
    populate: false,
    prefix: '', // TODO: test support (there's one test for this)
    pluralize: false // TODO: support on opts.associationAttr and opts.model
}

/**
 * BedWet
 *
 * (see http://nodejs.org/api/documentation.html#documentation_stability_index)
 */

exports.register = function(plugin, options, next) {

    plugin.dependency('dogwater');
    
    plugin.handler('bedwetter', function(route, handlerOptions) {
        
        // handlerOptions come user-defined in route definition
        // nothing should override these!
        
        var Dogwater = plugin.plugins.dogwater;
    
        var thisRouteOpts = _.clone(internals.defaults);
        
        // Plugin-level user-defined options
        _.merge(thisRouteOpts, options)
        
        // Route-level user-defined options
        _.merge(thisRouteOpts, handlerOptions);
        
        // Route-level info (should not override plugin options & handler options)
        internals.setOptionsFromRouteInfo(route, thisRouteOpts);
        
        // Set associations now that the model is locked-down
        // TODO: figure out why these don't stick when model grabbed from parseModel
        var Model = Dogwater[thisRouteOpts.model];
        
        // For now, associations don't need to live on Model 
        /*
        if (!Model._wetbed) {
            Model._wetbed = {};
        }
        
        if (!Model._wetbed.associations) {
            Model._wetbed.associations = internals.getAssociationsFromModel(Model);
        }
        */
        
        // Don't overwrite associations if they've been set as an option
        _.defaults(thisRouteOpts, {associations: internals.getAssociationsFromModel(Model)});
        
        // Here's our little bed wetter!
        var bedWetter = internals.determineBedWetter(route, thisRouteOpts);

        return bedWetter(route, thisRouteOpts);
        
    });
    
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};


internals.Router = new Call.Router({});

internals.determineBedWetter = function(route, thisRouteOpts) {
    
    var method  = route.method;
    var path    = route.path;
    
    path = internals.removePrefixFromPath(path, thisRouteOpts.prefix);
    
    var pathInfo = internals.Router.analyze(path);
    var pathSegments = pathInfo.segments.length;
    var err;
    
    // Account for `update` allowing POST or PATCH
    if (_.isArray(method) &&
        method.length == 2 &&
        _.intersection(method, ['post', 'patch']).length == 2) {
        
        method = 'patch';
    }
    
    switch (method) {
        
        case 'post':
            
            if (pathSegments == 1 &&
                pathInfo.segments[0].literal) {         // model
                
                // Create
                return BedWetters.create;
            
            } else if (pathSegments == 2 &&
                pathInfo.segments[0].literal &&         // model
                pathInfo.segments[1].name) {            // record
                
                // Patched update
                return BedWetters.update;
            
            } else if (pathSegments == 3 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal) {   // association
                
                // Create and add to relation
                return BedWetters.add;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        case 'patch':
            
            if (pathSegments == 2 &&
                pathInfo.segments[0].literal &&   // model
                pathInfo.segments[1].name) {      // record
                
                // Patched update
                return BedWetters.update;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        case 'put':
            
            if (pathSegments == 4 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal &&   // association
                      pathInfo.segments[3].name) {      // record_to_add
                
                // Add to a relation
                return BedWetters.add;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
            
        case 'get':
            
            if (pathSegments == 1 &&
                pathInfo.segments[0].literal) {         // model
                
                // Find with criteria
                return BedWetters.find;
            
            } else if (pathSegments == 2 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name) {      // record
                
                // Find one by id
                return BedWetters.findone;
            
            } else if (pathSegments == 3 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal) {   // association
                
                // Get associated records
                return BedWetters.populate;
            
            } else if (pathSegments == 4 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal &&   // association
                      pathInfo.segments[3].name) {      // record_to_check
                
                // Check for an association between records
                return BedWetters.populate;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        case 'delete':
            
            if (pathSegments == 2 &&
                pathInfo.segments[0].literal &&   // model
                pathInfo.segments[1].name) {      // record
                
                return BedWetters.destroy;
            
            } else if (pathSegments == 4 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal &&   // association
                      pathInfo.segments[3].name) {      // record_to_remove
                
                return BedWetters.remove;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        default:
            err = new Error('Method isn\'t a BedWetter.  Must be POST, GET, DELETE, or PUT.');
            break;
    }
    
    // A BedWetter ought to have been returned by now.
    if (!err) {
        err = new Error('Something went pretty wrong while trying to determine a BedWetter.');
    }
    
    throw err;
    
}

internals.setOptionsFromRouteInfo = function(route, thisRouteOpts) {
    
    var routeInfo = {};
    
    var path = internals.removePrefixFromPath(route.path, thisRouteOpts.prefix);
    var pathInfo = internals.Router.analyze(path);
    var pathSegments = pathInfo.segments.length;
    
    Hoek.assert(1 <= pathSegments && pathSegments <= 4, 'Number of path segments should be between 1 and 4.');
    
    switch (pathSegments) {
        case 4:
            routeInfo.associatedPkName = pathInfo.segments[3].name;
        case 3:
            routeInfo.associationAttr = pathInfo.segments[2].literal;
        case 2:
            routeInfo.pkName = pathInfo.segments[1].name;
        case 1:
            routeInfo.model = pathInfo.segments[0].literal;
    }
    
    _.defaults(thisRouteOpts, routeInfo);
    
}

// See https://github.com/balderdashy/sails/blob/master/lib/hooks/orm/build-orm.js#L65 [waterline v0.10.11]
internals.getAssociationsFromModel = function(thisModel) {
    
    return _.reduce(thisModel.attributes, function (associatedWith, attrDef, attrName) {
        
        if (typeof attrDef === 'object' && (attrDef.model || attrDef.collection)) {
          var assoc = {
            alias: attrName,
            type: attrDef.model ? 'model' : 'collection'
          };
          if (attrDef.model) {
            assoc.model = attrDef.model;
          }
          if (attrDef.collection) {
            assoc.collection = attrDef.collection;
          }
          if (attrDef.via) {
            assoc.via = attrDef.via;
          }

          associatedWith.push(assoc);
        }
        
        return associatedWith;
    
    }, []);

}

internals.removePrefixFromPath = function(path, prefix) {
    
    Hoek.assert(_.isString(path), 'Path parameter should be a string')
    Hoek.assert(!prefix || _.isString(prefix), 'Prefix parameter should be a string or falsy.')
    
    if (!prefix) {
        return path;
    }
    
    // Remove trailing slashes from prefix
    prefix = prefix.replace(/\/+$/, '');
    
    // If the path begins with the prefix, chop it off!
    if (path.indexOf(prefix) === 0) {
        path = path.slice(prefix.length);
    }
    
    return path;
    
}


