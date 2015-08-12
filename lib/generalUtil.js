var Hoek = require('hoek');
var _ = require('lodash');

var internals = {};

module.exports = {
    
    applyOptionsHook: function(request, origOptions) {
        
        if (origOptions.hooks && origOptions.hooks.options) {
            
            Hoek.assert(typeof origOptions.hooks.options === "function", 'options hook must be a function.');

            return origOptions.hooks.options(_.cloneDeep(origOptions), request);
        } else {
            
            return _.cloneDeep(origOptions);
        }
        
    }
    
}
