var morphdom = require('morphdom');
var objectAssign = require('object-assign');
var helpers = require('./helpers');

var Morphed = function(node, renderFunc, options) {
    if (!node) {
        throw new Error('Node is required.');
    }
    if (!node.nodeName) {
        throw new Error('First argument must be a Node.');
    }
    if (!renderFunc) {
        throw new Error('Render function is required.');
    }

    var defaultOpts = {
        clone: true,
        ignoredAttribute: 'morphed-ignore',
        morphdom: {}
    };

    this.node = node;
    this.renderFunc = renderFunc;
    this.options = objectAssign({}, defaultOpts, options);

    // set up the custom ignore handler
    var passedOBME = this.options.morphdom.onBeforeMorphEl;
    this.options.morphdom.onBeforeMorphEl = function(fromNode, toNode) {
            var shouldRender = helpers.shouldRerender(fromNode, this.options.ignoredAttribute);
            if (shouldRender && passedOBME) passedOBME(fromNode, toNode);
            return shouldRender;
    }.bind(this);

    // set up initial state
    if (this.options.clone) {
        // set ids on ignored elements
        helpers.setupIgnored(this.node, this.options.ignoredAttribute);

        // clone the initial dom node
        this.initialDom = this.node.cloneNode(true);
    }
    this.state = objectAssign({}, this.options.initialState);

    // force an initial render
    this.render();
};

Morphed.prototype.render = function() {
    var newNode;
    if (this.options.clone) {
        // Morphed renders do clone the initial dom and allow mutations
        newNode = this.initialDom.cloneNode(true);
        this.renderFunc(newNode, this.state);
    } else {
        // pure renders do not clone, just return an element
        newNode = this.renderFunc(this.state);
    }
    this.node = morphdom(this.node, newNode, this.options.morphdom);
};

Morphed.prototype.setState = function(state) {
    this.state = objectAssign({}, this.state, state);
    this.render();
};

Morphed.prototype.replaceState = function(state) {
    this.state = objectAssign({}, state);
    this.render();
};

module.exports = Morphed;
