/**
 * Module dependencies
 */
var _ = require('lodash');
var Boom = require('boom');
var Hoek = require('hoek');
var Async = require('async');

/**
 * Add Record To Collection
 *
 * post  /:modelIdentity/:id/:collectionAttr/:childid
 *  *    /:modelIdentity/:id/:collectionAttr/add/:childid
 *
 * Associate one record with the collection attribute of another.
 * e.g. add a Horse named "Jimmy" to a Farm's "animals".
 * If the record being added has a primary key value already, it will
 * just be linked.  If it doesn't, a new record will be created, then
 * linked appropriately.  In either case, the association is bidirectional.
 *
 * @param {Integer|String} parentid  - the unique id of the parent record
 * @param {Integer|String} id    [optional]
 *        - the unique id of the child record to add
 *        Alternatively, an object WITHOUT a primary key may be POSTed
 *        to this endpoint to create a new child record, then associate
 *        it with the parent.
 *
 * @option {String} model  - the identity of the model
 * @option {String} alias  - the name of the association attribute (aka "alias")
 */

module.exports = function addToCollection (route, options) {

  return function (request, reply) {
    
    var actionUtil = require('../actionUtil')(request, options);
    
    // Ensure a model and alias can be deduced from the request.
    var Model = actionUtil.parseModel();
    var relation = options.associationAttr;
    
    if (!relation) {
      return reply(Boom.wrap(new Error('Missing required route option, `options.associationAttr`.')));
    }

    // The primary key of the parent record
    var parentPk = actionUtil.parsePk();
  
    // Get the model class of the child in order to figure out the name of
    // the primary key attribute.
    
    var associationAttr = _.findWhere(options.associations, { alias: relation });
    Hoek.assert(_.isObject(associationAttr), 'Bad association.');
    
    var ChildModel = request.model[associationAttr.collection];
    var childPkAttr = ChildModel.primaryKey;
  
  
    // The child record to associate is defined by either...
    var child;
  
    // ...a primary key:
    var supposedChildPk = actionUtil.parsePk(true);
    if (supposedChildPk) {
      
      child = {};
      child[childPkAttr] = supposedChildPk;
      
    } else { // ...or an object of values:
      
      options.values = options.values || {};
      options.values.blacklist = options.values.blacklist || [];
      // Make sure nobody can specify the id of the child.
      
      // You either link a record with the id in the URL or create an enitrely new record without specifying the id!
      options.values.blacklist.push(childPkAttr);
      child = actionUtil.parseValues(true);
      
    }
  
    if (!child) {
      return reply(Boom.badRequest('You must specify the record to add (either the primary key of an existing record to link, or a new object without a primary key which will be used to create a record then link it.)'));
    }
  
    var createdChild = false;
  
    Async.auto({
  
      // Look up the parent record
      parent: function (cb) {
        
        Model.findOne(parentPk).exec(function foundParent(err, parentRecord) {
          
          if (err) return cb(err);
          if (!parentRecord) return cb(Boom.notFound());
          if (!actionUtil.validOwnership(parentRecord, false)) return cb(Boom.unauthorized());
          if (!parentRecord[relation] || !parentRecord[relation].add) return cb(Boom.notFound());
          
          cb(null, parentRecord);
          
        });
      },
  
      // If a primary key was specified in the `child` object we parsed
      // from the request, look it up to make sure it exists.  Send back its primary key value.
      // This is here because, although you can do this with `.save()`, you can't actually
      // get ahold of the created child record data, unless you create it first.
      actualChild: ['parent', function(cb) {
  
        // Below, we use the primary key attribute to pull out the primary key value
        // (which might not have existed until now, if the .add() resulted in a `create()`)
  
        // If the primary key was specified for the child record, we should try to find it
        if (child[childPkAttr]) {
          
          ChildModel.findOne(child[childPkAttr]).exec(function foundChild(err, childRecord) {
            
            if (err) return cb(err);
            
            // Trying to associate a record that does not exist
            if (!childRecord)
              return cb(Boom.notFound());
            
            if (!actionUtil.validOwnership(childRecord, true))
              return cb(Boom.unauthorized());
            
            // Otherwise use the one we found.
            return cb(null, childRecord);
          });
          
        } else { // Otherwise, it must be referring to a new thing, so create it.
          
          ChildModel.create(child).exec(function createdNewChild (err, newChildRecord) {
            
            if (err) return cb(err);
            createdChild = true;
            
            return cb(null, newChildRecord);
          });
          
        }
        
      }],
  
      // Add the child record to the parent's collection
      add: ['parent', 'actualChild', function(cb, async_data) {
        
        try {
          
          // `collection` is the parent record's collection we
          // want to add the child to.
          var collection = async_data.parent[relation];
          collection.add(async_data.actualChild[childPkAttr]);
          
          return cb();
        
        } catch (err) {
          
          // TODO: could all this be simplified?  do we need try/catch for record.add?
          // I think not.  It's just an Array.push: https://github.com/balderdashy/waterline/blob/4653f8a18016d2bcde9a70c90dd63a7c69381935/lib/waterline/model/lib/association.js
          // On the flipside, what if this relation doesn't exist?  Test!!  Should this err be turned into a notFound, similarly to in the parent function?
          // Okay now this relation is properly tested for in the parent function
          if (err) {
            return cb(err);
          }
          
          return cb();
        }
        
      }]
    },
  
    // Finally, save the parent record
    function readyToSave (err, asyncResults) {
  
      if (err) return reply(Boom.wrap(err));
      
      asyncResults.parent.save(function saved(err) {
  
        // Ignore `insert` errors for duplicate adds, as add is idempotent.
        var isDuplicateInsertError = (err && typeof err === 'object' && err.length && err[0] && err[0].type === 'insert');
        if (err && !isDuplicateInsertError) return reply(Boom.wrap(err));
        
        if (createdChild) {
          
          var location = actionUtil.getCreatedLocation(asyncResults.actualChild.id);
          
          return reply(asyncResults.actualChild).created(location);
        } else {
          
          // "HTTP 204 / No Content" means success
          return reply().code(204);
        }
        
      });
  
    }); // end async.auto
    
  }
  
};
