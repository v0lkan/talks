/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */

function ListView(el, options) {
    this.el = el;

    var defaults = {
        itemNodeName : 'li',
        maxSize      : 25,
        isCompact    : true
    };

    this.options = _.extend(defaults, options||{});
}

ListView.prototype.initialize = function() {};
ListView.prototype.destroy    = function() {};

function TreeListView() {}

// Very simple inheritance
TreeListView.prototype        = new ListView();
TreeListView.prototype.parent = ListView;
TreeListView.constructor      = TreeListView;

TreeListView.prototype.initialize = function() {
    doInitialization();

    this.parent.prototype.initialize.call(this, arguments);
};
