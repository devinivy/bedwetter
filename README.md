bedwetter
===
Docs coming soon.  This is meant to be used with [hapi 7](https://github.com/hapijs/hapi) and its [Waterline](https://github.com/balderdashy/waterline) plugin, [dogwater](https://github.com/devinivy/dogwater).
For now, see SailsJs's [documentation on Blueprints](http://sailsjs.org/#/documentation/reference/blueprint-api).  Much of the code has been adapted from the SailsJs Blueprints hook, but the features/options do differ a bit.

## What it does
Bedwetter registers route handlers based upon the `method` and `path` of your route.  It turns them into RESTful API endpoints that automatically interact with the model defined using dogwater.

- `POST` is used for `create` and `add` (add a record to a relation)
- `GET` is used for `find`, `findOne`, and `populate` (populate a relation on a record)
- `PUT` is used for `update`
- `DELETE` is used for `destroy` and `remove` (remove a record from a relation)

Short, crappy example of usage:
```javascript
// Assume `server` is a hapi server with the bedwetter plugin registered.
// Models with identities "zoo" and "treat" exist via dogwater.
// zoos and treats are in a many-to-many correspondence with each other.
// I suggest checking out ./test

server.route([
{ // findOne
    method: 'GET',
    path: '/zoo/{id}',
    handler: {
        bedwetter: {}
    }
},
{ // find
    method: 'GET',
    path: '/treat',
    handler: {
        bedwetter: {}
    }
},
{ // find with prefix
    method: 'GET',
    path: '/v1/treat',
    handler: {
        bedwetter: {
            prefix: '/v1'
        }
    }
},
{ // destroy
    method: 'DELETE',
    path: '/treat/{id}',
    handler: {
        bedwetter: {}
    }
},
{ // create
    method: 'POST',
    path: '/zoo',
    handler: {
        bedwetter: {}
    }
},
{ // update
    method: 'PUT',
    path: '/treat/{id}',
    handler: {
        bedwetter: {}
    }
},
{ // remove
    method: 'DELETE',
    path: '/zoo/{id}/treats/{child_id}',
    handler: {
        bedwetter: {}
    }
},
{ // adds
    method: 'POST',
    path: '/zoo/{id}/treats/{child_id?}',
    handler: {
        bedwetter: {}
    }
},
{ // populates
    method: 'GET',
    path: '/zoo/{id}/treats/{child_id?}',
    handler: {
        bedwetter: {}
    }
}]);
```