/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */
 
var user = {
    id: 1,
    name: 'Volkan Özçelik',
    location: 'Proxima Centauri'
};

// warning: Avoid modifying objects, if possible.
user.knowsKungFu = true;

// warning: Using delete means hidden class change.
delete user.location;

// this is better:
user.location = undefined;

var items = [1,2,3,4];

// warning: A holey array is slower.
items[1] = undefined;
