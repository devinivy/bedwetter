var _ = require('lodash');

var internals = {};

module.exports = {
    
    applyOptionsHook: function(request, origOptions) {
        
        if (origOptions.hooks && typeof origOptions.hooks.options === "function") {
            
            return origOptions.hooks.options(_.cloneDeep(origOptions), request);
        } else {
            
            return _.cloneDeep(origOptions);
        }
        
    },
    
    // This pk comes in the form of waterline criteria: object, string, or int
    pkToString: function(pk) {
        
        if (_.isObject(pk) && Object.keys(pk).length) {
            
            return String(pk[Object.keys(pk)[0]]);
        } else {
            
            return String(pk);
        }
    }
    
}
