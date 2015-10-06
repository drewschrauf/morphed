# Morphed

Morphed lets you mimic pure rendering of a DOM node while still letting you use your favourite DOM manipulation library. Each time your `render` callback is invoked it receives a fresh copy of the initial node, allowing you to make your changes from scratch each time. Behind the scenes, [morphdom](https://github.com/patrick-steele-idem/morphdom) is used to perform the minimal set of DOM manipulations between the current state and the new state.

Morphed expects to be running in a Browserify, Webpack or similar environment.

## Basic Usage

jQuery is used here for demonstration purposes but it is not required by Morphed.

    var $ = require('jquery');
    var Morphed = require('morphed');

    // get our element and set up some state
    var $module = $('#my-module');
    var counter = 0;

    // set up an instance of Morphed with the DOM node and a render function
    var morphed = new Morphed($module[0], function(node) {
        $('.display', node).text('Count: ' + counter);
    });

    // attach a click handler to an increment button
    $module.on('click', '.increment', function() {
        counter++;
        morphed.render(); // invoke the rerender
    });

## Motivation

Working with DOM manipulation libraries can let state get out of hand very quickly. jQuery and friends make it simple to toggle a class here or add add a few nodes there, but before long it's impossible to separate out the business logic from the UI code. Some frameworks work around this issue by rendering the entire app to a virtual DOM and  only updating the real DOM with the differences. This is great for many cases but sometimes you're working with a prerendered element (say, from a CMS) and just want to be able to tweak what's already there.

Morphed attempts to get the best of both worlds by passing a copy of the same initial node to your render function every time it is invoked. You can manipulate this element as required to get it to reflect your application's current state and Morphed will replace the old node with this up to date version. This means that you never need to try and "reverse" a DOM manipulation, you simply don't perform it in your render function. Using morphdom behind the scenes allows Morphed to swap out this new version of the node for the old version with the fewest manipulations possible.

## API

### new Morphed(node, renderFunction, options) : Morphed

The `Morphed` constructor supports the following arguments:

- _node_ (`Node`, required) - The node to be updated on each call to `render`.
- _renderFunction_ (`Function(Node[, state])`, required) - The render function to be invoked on each call to render. The first parameter, `Node`, will be always be the initial node. The second parameter, `state`, is optional and its usage is described in the State API section. All manipulations applied to the passed `Node` will be applied to the DOM.
- _options_ (`Object`, optional) - See below for supported options.

Supported options:

- _morphdom_ (`Object`) - This object gets passed through to morphdom. See the [morphdom API documentation](https://github.com/patrick-steele-idem/morphdom#api) for supported options.
- _ignoreAttribute_ (`String`, default `morphed-ignore`) - Change the attribute used to flag a node to be ignored by morphdom. See the Caveats section for the usage of the parameter.
- _initialState_ (`Object`) - Provide an initial state for use with the State API. See the State API section for details.
- _clone_ (`Boolean`, default `true`) - Set this to false to avoid the overhead of cloning DOM nodes. You must instead return a node from the `renderFunction`. Use this with a templating library to generate elements that don't need to be prerendered in the page's source. The `renderFunction` callback will not be passed a node, the state becomes the first parameter.

### render()

Invokes the `renderFunction` callback with a copy of the initial DOM node and the current state. All manipulations applied to the node will be rendered to the DOM using morphdom.

## State API

Morphed provides a simple state API to handle state tracking for you. It is modeled on the React Component State API and will cause a rerender each time a state function is called. You can access the Morphed instance's current state with `.state`.

### setState(state)

Merges the passed state with the current state. This will add any new keys and replace existing keys. Old keys will be kept. Calling this function will trigger a rerender.

- _state_ (`Object`) - The new state to merge into the current state.

### replaceState(state)

Replaces the current state with the passed state. Calling this function will trigger a rerender.

- _state_ (`Object`) - The new state.

## State API Usage

Here is the same example as above using `setState` to track the count.

    var $ = require('jquery');
    var Morphed = require('morphed');

    var $module = $('#my-module');

    var morphed = new Morphed($module[0], function(node, state) {
        $('.display', node).text('Count: ' + state.count);
    }, {
        initialState: {
            count: 0
        }
    });

    $module.on('click', '.increment', function() {
        morphed.setState({count: morphed.state.count + 1});
    });

## Caveats

Using Morphed isn't without its pitfalls but many of them have simple workarounds.

Depending on the type of DOM manipulations you are making, some cached queries or event handlers may be pointing to nodes that are no longer rendered. The key here is to use event delegation to handle events. In jQuery, this can be achieved using `.on` and attaching the handler to the same node that is passed to Morphed, or one wrapping it. For example:

    $myNode = $('#my-node');
    var morphed = new Morphed($myNode[0], function() {...});

    // this could break if the button node is morphed
    $('button', $myNode).on('click', function() {...}));

    // this should continue to work regardless of what happens to the DOM
    $myNode.on('click', 'button', function() {...});

Some elements are stateful and will lose their current value if they are rerendered. The most obvious examples of this are form input controls. There are two things you can do here to work around this issue. The first is to add a `change` listener to the input and store the value yourself. This is a common (in fact, required) pattern in React and allows you to simply update the element with the real value on each render callback. If you don't want to add a host of callbacks for your inputs, you can tell Morphed to ignore any manipulations made to a particular element by adding the attribute `morphed-ignore`. Any changes made in the render callback to an element with this attribute will not be reflected in the real DOM. All modifications to this element will need to be performed outside of the Morphed render callback.

Due to the way morphdom works, jQuery animations will no longer work. Most of the time these animations can be replaced with CSS animations triggered by a class change. When you find yourself in a situation where this won't work and absoloutely must use a javascript animation, make sure you ignore the animated node with `morphed-ignore`. Be aware, children of this node will be ignored too.

## Contribute

Pull Requests welcome. Please make sure tests pass with:

    npm test
