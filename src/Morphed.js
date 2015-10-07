var morphdom = require('morphdom');
var objectAssign = require('object-assign');
var helpers = require('./helpers');

var Morphed = function(node, updateFunc, options) {
    if (!node) {
        throw new Error('Node is required.');
    }
    if (!node.nodeName) {
        throw new Error('First argument must be a Node.');
    }
    if (!updateFunc) {
        throw new Error('Update function is required.');
    }

    var defaultOpts = {
        clone: true,
        ignoredAttribute: 'morphed-ignore',
        morphdom: {}
    };

    this.node = node;
    this.updateFunc = updateFunc;
    this.options = objectAssign({}, defaultOpts, options);

    // set up the custom ignore handler
    var passedOBME = this.options.morphdom.onBeforeMorphEl;
    this.options.morphdom.onBeforeMorphEl = function(fromNode, toNode) {
            var shouldUpdate = helpers.shouldUpdate(fromNode, this.options.ignoredAttribute);
            if (shouldUpdate && passedOBME) passedOBME(fromNode, toNode);
            return shouldUpdate;
    }.bind(this);

    // set up initial state
    if (this.options.clone) {
        // set ids on ignored elements
        helpers.setupIgnored(this.node, this.options.ignoredAttribute);

        // clone the initial dom node
        this.initialDom = this.node.cloneNode(true);
    }
    this.state = objectAssign({}, this.options.initialState);

    // force an initial update
    this.update();
};

Morphed.prototype.update = function() {
    var newNode;
    if (this.options.clone) {
        // Morphed updates do clone the initial dom and allow mutations
        newNode = this.initialDom.cloneNode(true);
        this.updateFunc(newNode, this.state);
    } else {
        // pure udpates do not clone, just return an element
        newNode = this.updateFunc(this.state);
    }
    this.node = morphdom(this.node, newNode, this.options.morphdom);
};

Morphed.prototype.setState = function(state) {
    this.state = objectAssign({}, this.state, state);
    this.update();
};

Morphed.prototype.replaceState = function(state) {
    this.state = objectAssign({}, state);
    this.update();
};

module.exports = Morphed;
