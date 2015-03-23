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
    prefix: '',
    createdLocation: false,
    //pluralize: false, TODO: support on opts.associationAttr and opts.model
    
    actAsUser: false,
    userUrlPrefix: 'user', // this is in the url in lieu of /users/{id}
    userModel: 'users', // since it's not in the url
    userIdProperty: 'id', // on auth credentials
    
    setOwner: false,
    requireOwner: false,
    ownerAttr: 'owner',
    ownerAttrs: {},
    childOwnerAttr: 'owner',
    childOwnerAttrs: {},

    // Setting a deleted flag rather than destroying
    deletedFlag: false, // destroy by default
    deletedAttr: 'deleted',
    deletedValue: 1,
    
    // Change pk field
    pkAttr: false,
    childPkAttr: false,
    
    // Omit, later also pick, etc.
    omit: [],
    
    // A place for hooks
    hooks: {
        options: _.identity
    },
    
    // A place for private info to get passed around
    _private: {
        actAsUserModifiedPath: false,
        count: false
    }
    
}

/**
 * BedWet
 *
 * (see http://nodejs.org/api/documentation.html#documentation_stability_index)
 */

exports.register = function(server, options, next) {

    server.dependency('dogwater');
    
    server.handler('bedwetter', function(route, handlerOptions) {
        
        // handlerOptions come user-defined in route definition
        // nothing should override these!
        
        var Dogwater = server.plugins.dogwater;
    
        var thisRouteOpts = _.cloneDeep(internals.defaults);
        
        // Plugin-level user-defined options
        _.merge(thisRouteOpts, options)
        
        // Route-level user-defined options
        _.merge(thisRouteOpts, handlerOptions);
        
        // Route-level info (should not override plugin options & handler options)
        internals.setOptionsFromRouteInfo(route, thisRouteOpts);
        
        // Set associations now that the model is locked-down
        // TODO: figure out why these don't stick when model grabbed from parseModel
        var Model = Dogwater[thisRouteOpts.model];
        
        Hoek.assert(Model, 'Model `' + thisRouteOpts.model + '` must exist to build route.');
        
        // Don't overwrite associations if they've been set as an option for some reason
        _.defaults(thisRouteOpts, {associations: internals.getAssociationsFromModel(Model)});
        
        thisRouteOpts = internals.normalizeOptions(thisRouteOpts);
        
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
    
    path = internals.normalizePath(path, thisRouteOpts);
    
    var pathInfo = internals.Router.analyze(path);
    var pathSegments = pathInfo.segments.length;
    var err;
    
    // Account for `update` allowing POST or PATCH
    if (_.isArray(method) &&
        method.length == 2 &&
        _.intersection(method, ['post', 'patch']).length == 2) {
        
        method = 'patch';
    }
    
    var countIsOkay = false;
    var bedwetter;
    switch (method) {
        
        case 'post':
            
            if (pathSegments == 1 &&
                pathInfo.segments[0].literal) {         // model
                
                // Create
                bedwetter = BedWetters.create;
            
            } else if (pathSegments == 2 &&
                pathInfo.segments[0].literal &&         // model
                pathInfo.segments[1].name) {            // record
                
                // Patched update
                bedwetter = BedWetters.update;
            
            } else if (pathSegments == 3 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal) {   // association
                
                // Create and add to relation
                bedwetter = BedWetters.add;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        case 'patch':
            
            if (pathSegments == 2 &&
                pathInfo.segments[0].literal &&   // model
                pathInfo.segments[1].name) {      // record
                
                // Patched update
                bedwetter = BedWetters.update;
            
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
                bedwetter = BedWetters.add;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
            
        case 'get':
            
            if (pathSegments == 1 &&
                pathInfo.segments[0].literal) {         // model
                
                countIsOkay = true;
                
                // Find with criteria
                bedwetter = BedWetters.find;
            
            } else if (pathSegments == 2 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name) {      // record
                
                // Find one by id
                bedwetter = BedWetters.findone;
            
            } else if (pathSegments == 3 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal) {   // association
                
                countIsOkay = true;
                
                // Get associated records
                bedwetter = BedWetters.populate;
            
            } else if (pathSegments == 4 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal &&   // association
                      pathInfo.segments[3].name) {      // record_to_check
                
                // Check for an association between records
                bedwetter = BedWetters.populate;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        case 'delete':
            
            if (pathSegments == 2 &&
                pathInfo.segments[0].literal &&   // model
                pathInfo.segments[1].name) {      // record
                
                bedwetter = BedWetters.destroy;
            
            } else if (pathSegments == 4 &&
                      pathInfo.segments[0].literal &&   // model
                      pathInfo.segments[1].name &&      // record
                      pathInfo.segments[2].literal &&   // association
                      pathInfo.segments[3].name) {      // record_to_remove
                
                bedwetter = BedWetters.remove;
            
            } else {
                err = new Error('This ' + method + ' route does not match a BedWetting pattern.');
            }
            
            break;
        
        default:
            err = new Error('Method isn\'t a BedWetter.  Must be POST, GET, DELETE, PUT, or PATCH.');
            break;
    }
    
    // Only allow counting on find and array populate
    if (thisRouteOpts._private.count && !countIsOkay) {
        err = new Error('This bedwetter can\'t count!');
    }
    
    if (err) {
        throw err;
    } else {
        return bedwetter;
    }
    
}

internals.setOptionsFromRouteInfo = function(route, thisRouteOpts) {
    
    var routeInfo = {};
    
    var path = internals.normalizePath(route.path, thisRouteOpts);
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

internals.normalizePath = function(path, thisRouteOpts) {
    
    Hoek.assert(_.isString(thisRouteOpts.userUrlPrefix) || !thisRouteOpts.userUrlPrefix, 'Option userUrlPrefix should only have a string or a falsy value.');
    Hoek.assert(_.isString(thisRouteOpts.userModel) || !thisRouteOpts.userModel, 'Option userModel should only have a string or a falsy value.');
    
    // Deal with prefix option
    path = internals.removePrefixFromPath(path, thisRouteOpts.prefix);
    
    // TODO: adjust bedwetters!
    if (internals.pathEndsWith(path, '/count')) {
        thisRouteOpts._private.count = true;
        path = internals.removeSuffixFromPath(path, '/count');
    }
    
    // Deal with user creds options.
    if (thisRouteOpts.actAsUser &&
        thisRouteOpts.userUrlPrefix &&
        thisRouteOpts.userModel &&
        internals.pathBeginsWith(path, thisRouteOpts.userUrlPrefix)) {
        
        thisRouteOpts._private.actAsUserModifiedPath = true;
        
        // Transform path to seem like it's of the form /users/{userId}...
        path = internals.removePrefixFromPath(path, thisRouteOpts.userUrlPrefix);
        path = '/' + thisRouteOpts.userModel + '/{userId}' + path;
    }
    
    return path;
}

internals.pathEndsWith = function(path, needle) {
    
    if (path.indexOf(needle) !== -1 &&
        path.indexOf(needle) === path.length-needle.length) {
        return true;
    } else {
        return false;
    }
    
}

internals.removeSuffixFromPath = function(path, suffix) {
    
    if (internals.pathEndsWith(path, suffix)) {
        return path.slice(0, path.length-suffix.length);
    } else {
        return path;
    }
    
}

internals.pathBeginsWith = function(path, needle) {
    
    // Remove trailing slashes from needle
    needle = needle.replace(/\/+$/, '');
    
    // path begins with needle
    var softBegins = (path.indexOf(needle) === 0);
    
    if (!softBegins) return false;
    
    // Assuming path begins with needle,
    // make sure it takes up enitre query parts.
    // We check this by seeing if removing needle would leave an empty string (they have equal lengths)
    // or if removing needle would leave a '/' as the first character in the newly constructed path.
    var hardBegins = (path.length == needle.length) || path[needle.length] === '/';
    
    if (!hardBegins) return false;
    
    // Passed the tests
    return true;
    
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

internals.normalizeOptions = function(options) {
    
    var partial = {
        ownerAttrs: {},
        childOwnerAttrs: {}
    };
    
    // Currently just map *ownerAttr strings to *ownerAttrs objects, if not already set.
    if (options.ownerAttr && options.userIdProperty && !options.ownerAttrs[options.ownerAttr]) {
        partial.ownerAttrs[options.ownerAttr] = options.userIdProperty;
    }
    
    delete options.ownerAttr;
    
    if (options.childOwnerAttr && options.userIdProperty && !options.childOwnerAttrs[options.childOwnerAttr]) {
        partial.childOwnerAttrs[options.childOwnerAttr] = options.userIdProperty;
    }
    
    delete options.childOwnerAttr;
    
    _.merge(options, partial);
    
    return options;
    
}

