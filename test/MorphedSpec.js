var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var rewire = require('rewire');
var jsdom = require('mocha-jsdom');
var Morphed = require('../src/Morphed');

var noop = function() {};

describe('Morphed', function() {
    jsdom();
    var root;
    beforeEach(function() {
        var el = document.createElement('div');
        el.innerHTML = 'Old Text';
        root = el;
    });

    describe('#constructor', function() {
        it('can be instantiated', function() {
            expect(new Morphed(root, noop)).to.not.be.undefined;
        });

        it('should copy input parameters', function() {
            var f = new Morphed(root, noop);
            expect(f.node).to.not.be.undefined;
            expect(f.renderFunc).to.be.a('function');
            expect(f.options).to.be.an('object');
        });

        it('should throw if node is not passed', function() {
            expect(function() {
                new Morphed();
            }).to.throw('Node is required');
        });

        it('should throw if node is not a Node', function() {
            expect(function() {
                new Morphed('test');
            }).to.throw('First argument must be a Node');
        });

        it('should throw if render function is not passed', function() {
            expect(function() {
                new Morphed(root);
            }).to.throw('Render function is required');
        });

        it('should set up initial state', function() {
            var f = new Morphed(root, noop, {initialState: {test: 'test'}});
            expect(f.state).to.eql({test: 'test'});
        });
    });

    describe('#render', function() {
        var morphed;
        var render;
        beforeEach(function() {
            render = sinon.spy(function(node) {
                node.innerHTML = 'New Text';
            });
            morphed = new Morphed(root, render, {initialState: {test: 'testing'}});
        });

        it('should provide a render function', function() {
            expect(morphed.render).to.be.a('function');
        });

        it('should invoke the passed renderFunc', function() {
            morphed.render();
            expect(render).to.have.been.called;
        });

        it('should apply the results of the renderFunc', function() {
            morphed.render();
            expect(root.innerHTML).to.equal('New Text');
        });

        it('should not replace the original element', function() {
            var oldRoot = root;
            morphed.render();
            expect(root).to.equal(oldRoot);
        });

        it('should always pass the original node to the renderFunc', function() {
            var el = document.createElement('div');
            el.innerHTML = 'Old Text';

            var morphed = new Morphed(el, function(node) {
                expect(node.innerHTML).to.equal('Old Text');
                node.innerHTML = 'New Text';
            });

            // render multiple times
            expect(el.innerHTML).to.equal('New Text');
            morphed.render();
        });

        it('should pass the current state to the render function', function() {
            morphed.render();
            expect(render.args[0][1]).to.eql({test: 'testing'});
        });

        describe('render without clone', function() {
            beforeEach(function() {
                render = sinon.spy(function() {
                    var el = document.createElement('div');
                    el.innerHTML = 'New Text';
                    return el;
                });
                morphed = new Morphed(root, render, {initialState: {test: 'testing'}, clone: false});
            });

            it('should pass the state as the first parameter to the renderFunc', function() {
                morphed.render();
                expect(render.args[0][0]).to.eql({test: 'testing'});
            });

            it('should render returned element', function() {
                morphed.render();
                expect(root.innerHTML).to.equal('New Text');
            });
        });

        describe('ignored', function() {
            var complexRoot;
            beforeEach(function() {
                var el = document.createElement('div');
                el.innerHTML = '<div>Normal</div>' +
                    '<div morphed-ignore>Ignored</div>' +
                    '<div custom-ignore>Ignored</div>' +
                    '<div existing-id id="test">Ignored</div>';
                complexRoot = el;
            });
            var renderFunc = function(node) {
                node.querySelector('[morphed-ignore]').innerHTML = 'Changed';
                node.querySelector('[custom-ignore]').innerHTML = 'Changed';
            };

            it('should attach ids to ignored elements', function() {
                morphed = new Morphed(complexRoot, noop);
                expect(complexRoot.querySelector('[morphed-ignore]').id).to.not.be.empty;
            });

            it('should not attach ids to ignored elements that already have ids', function() {
                morphed = new Morphed(complexRoot, noop, {ignoredAttribute: 'existing-id'});
                expect(complexRoot.querySelector('[existing-id]').id).to.equal('test');
            });

            it('should not apply modifications to ignored elements', function() {
                morphed = new Morphed(complexRoot, renderFunc);
                expect(complexRoot.querySelector('[morphed-ignore]').innerHTML).to.equal('Ignored');
                expect(complexRoot.querySelector('[custom-ignore]').innerHTML).to.equal('Changed');
            });

            it('should allow the ignored data attribute to be overridden', function() {
                morphed = new Morphed(complexRoot, renderFunc, {
                    ignoredAttribute: 'custom-ignore'
                });
                expect(complexRoot.querySelector('[morphed-ignore]').innerHTML).to.equal('Changed');
                expect(complexRoot.querySelector('[custom-ignore]').innerHTML).to.equal('Ignored');
            });

            it('should still invoke a custom onBeforeMorphEl', function() {
                var obme = sinon.spy(function() {
                    return true;
                });
                morphed = new Morphed(complexRoot, renderFunc, {
                    morphdom: {
                        onBeforeMorphEl: obme
                    }
                });
                expect(complexRoot.querySelector('[morphed-ignore]').innerHTML).to.equal('Ignored');
                expect(complexRoot.querySelector('[custom-ignore]').innerHTML).to.equal('Changed');
                expect(obme).to.have.been.called;
            });
        });

        describe('morphdom args', function() {
            var morphedr;
            var morphdom;
            beforeEach(function() {
                var MorphedRewired = rewire('../src/Morphed');
                morphdom = sinon.spy();
                MorphedRewired.__set__('morphdom', morphdom);
                morphedr = new MorphedRewired(root, noop, {morphdom: {test: 'test'}});
            });

            it('should pass morphdom arguments to morphdom', function() {
                morphedr.render();
                expect(morphdom).to.have.been.called;
                expect(morphdom.args[0][2].test).to.not.be.undefined;
            });
        });
    });

    describe('#setState', function() {
        var morphed, render;
        beforeEach(function() {
            render = sinon.spy();
            morphed = new Morphed(root, render, {initialState: {test: 'testing'}});
        });

        it('should extend the current state with the new state', function() {
            morphed.setState({foo: 'bar'});
            expect(morphed.state).to.eql({test: 'testing', foo: 'bar'});
        });

        it('should replace keys on the current state', function() {
            morphed.setState({test: 'again'});
            expect(morphed.state).to.eql({test: 'again'});
        });

        it('should cause a rerender when the state is changed', function() {
            morphed.setState({});
            expect(render).to.have.been.called;
        });
    });

    describe('#replaceState', function() {
        var morphed, render;
        beforeEach(function() {
            render = sinon.spy();
            morphed = new Morphed(root, render, {initialState: {test: 'testing'}});
        });

        it('should replace the current state with the new state', function() {
            morphed.replaceState({foo: 'bar'});
            expect(morphed.state).to.eql({foo: 'bar'});
        });

        it('should cause a rerender when the state is changed', function() {
            morphed.replaceState({});
            expect(render).to.have.been.called;
        });
    });
});
