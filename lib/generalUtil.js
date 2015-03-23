var _ = require('lodash');

var internals = {};

module.exports = {
    
    applyOptionsHook: function(request, origOptions) {
        
        if (origOptions.hooks && typeof origOptions.hooks.options === "function") {
            
            return origOptions.hooks.options(_.cloneDeep(origOptions), request);
        } else {
            
            return _.cloneDeep(origOptions);
        }
        
    }
    
}
