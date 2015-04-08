![bedwetter](http://i.imgur.com/Emheg8o.png)

####Auto-generated, RESTful, CRUDdy route handlers
to be used with [hapi 8](https://github.com/hapijs/hapi) (and 7) and its [Waterline](https://github.com/balderdashy/waterline) plugin, [dogwater](https://github.com/devinivy/dogwater).

---

## What it does
Bedwetter registers route handlers based upon the `method` and `path` of your route.  It turns them into RESTful API endpoints that automatically interact with the model defined using dogwater.  The route handler is based on one of eight bedwetters:

- `POST` is used for `create`, `add` when `add` is used to create a record then add it to a relation, and for `update`
- `PATCH` is also used for `update`
- `PUT` is used for `add` when it's used to simply add a record to a relation
- `GET` is used for `find`, `findOne`, and `populate` (get related records or check an association)
- `DELETE` is used for `destroy` and `remove` (remove a record from a relation)

For now, see SailsJs's [documentation on Blueprints](http://sailsjs.org/#!/documentation/reference/blueprint-api) for info about parameters for the bedwetters.  A portion of the code is adapted from this SailsJs hook.

Bedwetter also allows you to manage resources/records with owners.  There are options to act on behalf of a user via hapi authentication.  You can set owners automatically on new records, only display records when owned by the authenticated user, and make bedwetters behave like the primary record is the authenticated user.


## Bedwetting Patterns
Suppose users are associated with comments via dogwater/Waterline.  The user model associates comments in an attribute named `comments`.  Here are some examples as to how the plugin will deduce which of the eight bedwetters to use, based upon route method and path definition.

* `GET /users` ↦ `find`

    Returns an array of users with an `HTTP 200 OK` response.

* `GET /users/count` ↦ `find` with `/count`

    Returns the integer number of users matched with an `HTTP 200 OK` response.

* `GET /users/{id}` ↦ `findOne`

    Returns user `id` with an `HTTP 200 OK` response.  Responds with an `HTTP 404 Not Found` response if the user is not found.

* `GET /users/{id}/comments` ↦ `populate`

    Returns an array of comments associated with user `id`.  Returns `HTTP 200 OK` if that user is found.  Returns an `HTTP 404 Not Found` response if that user is not found.

* `GET /users/{id}/comments/count` ↦ `populate` with `/count`

    Returns the integer number of comments associated with user `id`.  Returns `HTTP 200 OK` if that user is found.  Returns an `HTTP 404 Not Found` response if that user is not found.

* `GET /users/{id}/comments/{childId}` ↦ `populate`

    Returns `HTTP 204 No Content` if comment `childId` is associated with user `id`.  Returns an `HTTP 404 Not Found` response if that user is not found or that comment is not associated with the user.

* `POST /users` ↦ `create`

    Creates a new user using the request payload and returns it with an `HTTP 201 Created` response.

* `POST /users/{id}/comments` ↦ `add`

    Creates a new comment using the request payload and associates that comment with user `id`.  Returns that comment with an `HTTP 201 Created response`.  If that user is not found, returns an `HTTP 404 Not Found` response.

* `PUT /users/{id}/comments/{childId}` ↦ `add`

    Associates comment `childId` with user `id`.  Returns an `HTTP 204 No Content` response on success.  If the user or comment are not found, returns an `HTTP 404 Not Found` response.

* `DELETE /users/{id}` ↦ `destroy`

    Destroys user `id`.  Returns an `HTTP 204 No Content` response on success.  If the user doesn't exist, returns an `HTTP 404 Not Found` response.

* `DELETE /users/{id}/comment/{childId}` ↦ `remove`

    Removes association between user `id` and comment `childId`.  Returns an `HTTP 204 No Content` response on success.  If the user or comment doesn't exist, returns an `HTTP 404 Not Found` response.
    
* `PATCH /users/{id}` or `POST /user/{id}` ↦ `update`
    
    Updates user `id` using the request payload (which will typically only contain the attributes to update) and responds with the updated user.  Returns an `HTTP 200 OK` response on success.  If the user doesn't exist, returns an `HTTP 404 Not Found` response.


## Options
Options can be passed to the plugin when registered or defined directly on the route handler.  Those defined on the route handler override those passed to the plugin on a per-route basis.

### Acting as a User
These options allow you to act on behalf of the authenticated user.  Typically the user info is taken directly off the credentials object without checking the `Request.auth.isAuthenticated` flag.  This allows you to use authentication modes however you wish.  For examples, for now please see tests at `test/options/actAsUser.js`.

* `actAsUser` (boolean, defaults `false`).  Applies to `findOne`, `find`, `create`, `update`, `destroy`, `add`, `remove`, and `populate`.

    This must be set to `true` for the following options in the section to take effect.  The acting user is defined by hapi authentication credentials and the `userIdProperty` option.

* `userIdProperty` (string, defaults `"id"`).  Applies to `findOne`, `find`, `create`, `update`, `destroy`, `add`, `remove`, and `populate`.

    When `actAsUser` is `true` this option takes effect.  It defines a path into `Request.auth.credentials` to determine the acting user's id.  For example, if the credentials object equals `{user: {info: {id: 17}}}` then `"user.info.id"` would grab user id `17`.  See [`Hoek.reach`](https://github.com/hapijs/hoek#reachobj-chain-options), which is used to convert the string to a deep property in the hapi credentials object.

* `userUrlPrefix` (string, defaults `"/user"`).  Applies to `findOne`, `update`, `destroy`, `add`, `remove`, and `populate`.

    When `actAsUser` is `true` this option takes effect.  This option works in tandem with `userModel`.  When a route path begins with `userUrlPrefix` (after any other inert prefix has been stripped via the `prefix` option), the URL is transformed to begin `/:userModel/:actingUserId` before matching for a bedwetter; it essentially sets the primary record to the acting user.

* `userModel` (string, defaults `"users"`).  Applies to `findOne`, `update`, `destroy`, `add`, `remove`, and `populate`.

    When `actAsUser` is `true` this option takes effect.  This option works in tandem with `userUrlPrefix`.  When a route path begins with `userUrlPrefix` (after any other inert prefix has been stripped via the `prefix` option), the URL is transformed to begin `/:userModel/:actingUserId` before matching for a bedwetter; it essentially sets the primary record to the acting user.  E.g., by default when `actAsUser` is enabled, route path `PUT /user/following/10` would internally be considered as `PUT /users/17/following/10`, which corresponds to the `add` bedwetter applied to the authenticated user.

* `requireOwner` (boolean, defaults `false`). Applies to `findOne`, `find`, `create`, `update`, `destroy`, `add`, `remove`, and `populate`.

    When `actAsUser` is `true` this option takes effect.  The option forces any record to that's being viewed or modified (including associations) to be owned by the user.  Ownership is determined by matching the acting user's id against the attribute of the record determined by `ownerAttr` or `childOwnerAttr`.

* `setOwner` (boolean, defaults `false`). Applies to `create`, `update`, `add`.

    When `actAsUser` is `true` this option takes effect.  The option forces any record to that's being created or updated (including associated records) to be owned by the acting user.  The owner is set on the  record's attribute determined by `ownerAttr` or `childOwnerAttr`.

* `ownerAttr` (string or `false`, defaults `"owner"`).  Applies to `findOne`, `find`, `update`, `destroy`, `add`, `remove`, and `populate`.

    When `actAsUser` is `true` this option takes effect.  If `false`, `requireOwner` and `setOwner` are disabled on the primary record.  Otherwise, `requireOwner` and `setOwner` options act using the primary record's attribute with name specified by `ownerAttr`.

* `childOwnerAttr` (string or `false`, defaults `"owner"`).  Applies to `add`, `remove`, and `populate`.

    When `actAsUser` is `true` this option takes effect.  If `false`, `requireOwner` and `setOwner` are disabled on the child record.  Otherwise, `requireOwner` and `setOwner` options act using the child record's attribute with name specified by `childOwnerAttr`.

### Other Options

* `prefix` (string).  Applies to `findOne`, `find`, `create`, `update`, `destroy`, `add`, `remove`, and `populate`.

    Allows one to specify a prefix to the route path that will be ignored when determining which bedwetter to apply.

* `createdLocation` (string).  Applies to `create` and sometimes to `add`.

    When this set (typically as a route-level option rather than a plugin-level option), a `Location` header will be added to responses with a URL pointing to the created record.  This option will act as the first argument to [`util.format`](http://nodejs.org/api/util.html#util_util_format_format) when set, and there should be a single placeholder for the created record's id.

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

* `deletedFlag` (boolean, defaults `false`). Applies to `destroy`.

    Rather than destroying the object, this will simply set a flag on the object using the `deletedAttr` and `deletedValue` options.

* `deletedAttr` (string, defaults `"deleted"`). Applies to `destroy`.

    Model attribute to be updated with the `deletedValue`.

* `deletedValue` (string|int, defaults `1`). Applies to `destroy`.

    Value to be updated on the model attribute specified `deletedAttr` when the `deletedFlag` option is enabled.

* `omit` (string|array, defaults `[]`). Applies to `add`, `create`, `find`, `findOne`, `populate`, `update`.

    When returning a record or array of records, the list of fields will not be included in the response per record.  When populating a record association, you may use [`Hoek.reach`](https://github.com/hapijs/hoek#reachobj-chain-options style key identifiers to omit deep properties.  If the property holds an array, deep omissions will omit the property from each record in the array.

* `pkAttr` (string or `false`, defaults `false`).  Applies to `add`, `destroy`, `findOne`, `populate`, `remove`, `update`.

    This overrides which attribute used for looking-up the primary/parent record.  By default bedwetter uses the model's primary key.  This option can be used to look-up records by a unique identifier other than the primary key.
    
    Ex: To look users up by their `username` attribute rather than their numeric primary key `id`, set `pkAttr` to `"username"`.  Then `GET /users/john-doe` will return the user with username `"john-doe"`.

* `childPkAttr` (string or `false`, defaults `false`).  Applies to `add`, `populate`, `remove`.

    This overrides which attribute used for looking-up the secondary/child record.  By default bedwetter uses the model's primary key.  This option can be used to look-up records by a unique identifier other than the primary key.


## Request State
The bedwetter request state can be accessed on `Request.plugins.bedwetter`.  It it an object containing the following properties:

* `action` (string).  Indicates which one of the eight bedwetter actions was used.  It is one of `find`, `findone`, `update`, `create`, `destroy`, `populate`, `add`, or `remove`.
* `options` (object).  These are active bedwetter options used for the request.  If any hooks modified the options, that will be reflected here. 
* `primaryRecord` (Waterline model).  This provides access to any primary record associated with this request.  This will not be set if there is no primary record.
* `secondaryRecord` (Waterline model).  This provides access to any secondary record associated with this request.  This will not be set if there is no secondary record.


## Usage
Here's a sort of crappy example.

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
        bedwetter: options
    }
},
{ // find
    method: 'GET',
    path: '/treat',
    handler: {
        bedwetter: options
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
        bedwetter: options
    }
},
{ // create
    method: 'POST',
    path: '/zoo',
    handler: {
        bedwetter: options
    }
},
{ // update
    method: ['PATCH', 'POST'],
    path: '/treat/{id}',
    handler: {
        bedwetter: options
    }
},
{ // remove
    method: 'DELETE',
    path: '/zoo/{id}/treats/{childId}',
    handler: {
        bedwetter: options
    }
},
{ // create then add
    method: 'POST',
    path: '/zoo/{id}/treats',
    handler: {
        bedwetter: options
    }
},
{ // add
    method: 'PUT',
    path: '/zoo/{id}/treats/{childId}',
    handler: {
        bedwetter: options
    }
},
{ // populate
    method: 'GET',
    path: '/zoo/{id}/treats/{childId?}',
    handler: {
        bedwetter: options
    }
}]);
```
