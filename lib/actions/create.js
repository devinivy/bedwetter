/**
 * Module dependencies
 */
var Boom = require('boom');
var WL2Boom = require('waterline-to-boom');
var GeneralUtil = require('../generalUtil');

/**
 * Create Record
 *
 * post /:modelIdentity
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified criteria.  If an id was specified, just the instance with
 * that unique id will be returned.
 * 
 */

module.exports = function createRecord (route, origOptions) {
	
	return function(request, reply) {
		
	        // Transform the original options using options hook
		var options = GeneralUtil.applyOptionsHook(request, origOptions);
		
		var RequestState = request.plugins.bedwetter = {
			action: 'create',
			options: options
		};
		
		var actionUtil = require('../actionUtil')(request, options);
		
		var Model = actionUtil.parseModel();
		
		// Create data object (monolithic combination of all parameters)
		// Omit the blacklisted params (like JSONP callback param, etc.)
		var data = actionUtil.parseValues();
		
		// Create new instance of model using data from params
		Model.create(data).exec(function created (err, newInstance) {
			
			// Differentiate between waterline-originated validation errors
			// and serious underlying issues. Respond with badRequest if a
			// validation error is encountered, w/ validation info.
			if (err) return reply(WL2Boom(err));
			
			var location = actionUtil.getCreatedLocation(newInstance.id);
			
			// Omit fields if necessary
			actionUtil.omitFields(newInstance);
			
			// "HTTP 201 / Created"
			reply(newInstance).created(location);
		});
	}
  
};
