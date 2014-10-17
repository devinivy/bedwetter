bedwetter
===
Auto-generated, RESTful, CRUDdy route handlers...

...to be used with [hapi 7](https://github.com/hapijs/hapi) and its [Waterline](https://github.com/balderdashy/waterline) plugin, [dogwater](https://github.com/devinivy/dogwater).

## What it does
Bedwetter registers route handlers based upon the `method` and `path` of your route.  It turns them into RESTful API endpoints that automatically interact with the model defined using dogwater.  The route handler is based on one of eight bedwetters:

- `POST` is used for `create` and `add` (add a record to a relation)
- `GET` is used for `find`, `findOne`, and `populate` (populate a relation on a record)
- `PUT` is used for `update`
- `DELETE` is used for `destroy` and `remove` (remove a record from a relation)

For now, see SailsJs's [documentation on Blueprints](http://sailsjs.org/#/documentation/reference/blueprint-api) for info about parameters for the bedwetters.

## Bedwetting Patterns
Suppose users are associated with comments via dogwater/Waterline.  The user model associates comments in an attribute named `comments`.  Here are some examples as to how the plugin will deduce which of the eight bedwetters to use, based upon route method and path definition.

* `GET /user` ↦ `find`

    Returns an array of users with an `HTTP 200 OK` response.

* `GET /user/{id}` ↦ `findOne`

    Returns user `id` with an `HTTP 200 OK` response.  Responds with an `HTTP 404 Not Found` response if the user is not found.

* `GET /user/{id}/comments` ↦ `populate`

    Returns user `id` with its associated comments populated in an array.  Returns `HTTP 200 OK` if that user is found.  Returns an `HTTP 404 Not Found` response if that user is not found.

* `GET /user/{id}/comments/{childId}` ↦ `populate`

    Returns user `id` with comment `childId` populated in an array if it is associated with the user (otherwise the array is empty).  Returns `HTTP 200 OK` if that user and comment are found.  Returns an `HTTP 404 Not Found` response if that user is not found.

* `POST /user` ↦ `create`

    Creates a new user using the request payload and returns it with an `HTTP 201 Created` response.

* `POST /user/{id}/comments` ↦ `add`

    Creates a new comment using the request payload and associates that comment with user `id`.  Returns that comment with an `HTTP 201 Created response`.  If that user is not found, returns an `HTTP 404 Not Found` response.

* `POST /user/{id}/comments/{childId}` ↦ `add`

    Associates comment `childId` with user `id`.  Returns an `HTTP 204 No Content` response on success.  If the user or comment are not found, returns an `HTTP 404 Not Found` response.

* `DELETE /user/{id}` ↦ `destroy`

    Destroys user `id`.  Returns an `HTTP 204 No Content` response on success.  If the user doesn't exist, returns an `HTTP 404 Not Found` response.

* `DELETE /user/{id}/comment/{childId}` ↦ `remove`

    Removes association between user `id` and comment `childId`.  Returns an `HTTP 204 No Content` response on success.  If the user or comment doesn't exist, returns an `HTTP 404 Not Found` response.
    
* `PUT /user/{id}` ↦ `update`
    
    Updates user `id` using the request payload and responds with the updated user.  Returns an `HTTP 200 OK` response on success.  If the user doesn't exist, returns an `HTTP 404 Not Found` response.


## Options
Options can be passed to the plugin when registered or defined directly on the route handler.  Those defined on the route handler override those passed to the plugin on a per-route basis.

* `prefix` (string).  Applies to `findOne`, `find`, `create`, `update`, `destroy`, `add`, `remove`, and `populate`.

    Allows one to specify a prefix to the route path that will be ignored when determining which bedwetter to apply.

* `model` (string). Applies to `findOne`, `find`, `create`, `update`, `destroy`, `add`, `remove`, and `populate`.

    Name of the model's Waterline identity.  If not provided as an option, it is deduced from the route path.
    
    Ex: `/user/1/files/3` has the model `user`.

* `associationAttr` (string). Applies to `add`, `remove`, and `populate`

    Name of the association's Waterline attribute.  If not provided as an option, it is deduced from the route path.
    
    Ex: `/user/1/files/3` has the association attribute `files` (i.e., the Waterline model `user` has an attribute, `files` containing records in a one-to-many relationship).

* `criteria` (object). Applies to `find` and `populate`.
  * `blacklist` (array)
        
        An array of attribute names.  The criteria blacklist disallows searching by certain attribute criteria.

* `where` (object). Applies to `find` and `populate`.  When `where.id` is specified, also applies to `findOne`, `update`, `destroy`, `add`, and `remove`.

    Typically sets default criteria for the records in a list.  Keys represent are attribute names and values represent values for those attributes.  This can be overridden by query parameters.  When `where.id` is set, this is is used instead of the primary key path parameter (similarly to the `id` option), but does not override the `id` option.

* `id` (string or integer). Applies to `findOne`, `update`, `destroy`, `add`, `remove`, and `populate`.

    Fixes a supplied primary key to a certain value.  Typically this primary key would be pulled from the route parameter.  In most cases this will cause a confusing implementation, but may be worth keeping to interact with future features.

* `limit` (positive integer). Applies to `find` and `populate`.

    Set default limit of records returned in a list.  If not provided, this defaults to 30.

* `maxLimit` (positive integer). Applies to `find` and `populate`.

    If a user requests a certain number of records to be returned in a list (using the `limit` query parameter), it cannot exceed this maximum limit.

* `populate` (boolean). Applies to `find` and `findOne`.

    Determines if all association attributes are by default populated (overridden by `populate` query parameter, which contains a comma-separated list of attributes).  Defaults to false.

* `skip` (positive integer). Applies to `find` and `populate`.

    Sets default number of records to skip in a list (overridden by `skip` query parameter).  Defaults to 0.

* `sort` (string). Applies to `find` and `populate`.

    Sets default sorting criteria (i.e. `createdDate ASC`) (overridden by `sort` query parameter).  Defaults to no sort applied.

* `values` (object).  Applies to `create`, `update`, and sometimes to `add`.  Sets default attribute values in key-value pairs for records to be created or updated.  Also includes a `blacklist` parameter:
  * `blacklist` (array)
        
        An array of attribute names to be omitted when creating or updating a record.


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
