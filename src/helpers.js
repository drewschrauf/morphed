// set an ID on every ignored element
exports.setupIgnored = function(node, attribute) {
    var ignored = node.querySelectorAll('[' + attribute + ']');
    if (ignored.length) {
        for (var i = 0; i < ignored.length; i++) {
            var el = ignored[i];
            if (!el.id) {
                el.id = 'morphed-' + Math.ceil(Math.random() * 10000);
            }
        }
    }
};

exports.shouldUpdate = function(node, attribute) {
    return !node.attributes.hasOwnProperty(attribute);
};
