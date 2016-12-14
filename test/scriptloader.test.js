/* global describe it before after beforeEach afterEach */

var chai = require('chai');
var sinon = require('sinon');
var scriptloader = require('../src');

function stubLoadScript (options) {
  // options:
  //     withEventListener: true/false (true)
  //     yieldsSuccess: true/false (true)
  //     scriptAction: function
  //     withReadyState: true/false (false)
  //     withNotReadyState: true/false (false)

  options = options || {};
  options.withEventListener = options.withEventListener !== false;
  options.yieldsSuccess = options.yieldsSuccess !== false;
  options.withReadyState = !!options.withReadyState;
  options.withNotReadyState = !!options.withNotReadyState;

  if (options.scriptAction && typeof options.scriptAction !== 'function') {
    throw new TypeError('Option scriptAction should be a function');
  }

  var scriptNode = {
    get onload () {
      return stubObject.successCallback;
    },

    set onload (callback) {
      stubObject.successCallback = callback;
      stubObject.checkReadyForYield();
    },

    get onerror () {
      return stubObject.errorCallback;
    },

    set onerror (callback) {
      stubObject.errorCallback = callback;
      stubObject.checkReadyForYield();
    },

    parentNode: {
      removeChild: sinon.stub()
    }
  };

  var stubObject = {
    options: options,
    scriptNode: scriptNode,
    stubs: {
      scriptSearch: sinon.stub(),
      scriptInsert: sinon.stub(),
      scriptRemove: scriptNode.parentNode.removeChild
    },
    backups: {
      documentGetElementsByTagName: document.getElementsByTagName,
      documentCreateElement: document.createElement
    },
    checkReadyForYield: function () {
      if (options.yieldsSuccess !== undefined && stubObject.successCallback && stubObject.errorCallback) {
        stubObject.setLoaded(!!options.yieldsSuccess);
      }
    },
    restore: function restore () {
      document.createElement = stubObject.backups.documentCreateElement;
      document.getElementsByTagName = stubObject.backups.documentGetElementsByTagName;
    },
    setLoaded: function setLoaded (success) {
      var callback = success ? stubObject.successCallback : stubObject.errorCallback;

      if (!callback) {
        throw new Error('not currently loading script');
      }

      delete stubObject.successCallback;
      delete stubObject.errorCallback;

      if (success && options.scriptAction) {
        options.scriptAction();
      }

      if (!options.withEventListener && options.withNotReadyState) {
        scriptNode.readyState = options.withNotReadyState;
        callback.call(scriptNode);
        delete scriptNode.readyState;
      }

      if (!options.withEventListener && success && options.withReadyState) {
        scriptNode.readyState = options.withReadyState;
      }

      callback.call(scriptNode);
    }
  };

  stubObject.stubs.scriptSearch.returns([{
    parentNode: {
      insertBefore: stubObject.stubs.scriptInsert
    }
  }]);

  document.getElementsByTagName = function (name) {
    if (name === 'script') {
      return stubObject.stubs.scriptSearch.apply(this, arguments);
    }
    return stubObject.backups.documentGetElementsByTagName.apply(this, arguments);
  };

  document.createElement = function (name) {
    if (name === 'script') {
      if (options.withEventListener) {
        scriptNode.addEventListener = function addEventListener (event, callback) {
          if (event === 'load') {
            scriptNode.onload = callback;
          } else if (event === 'error') {
            scriptNode.onerror = callback;
          }
        };
      }

      return scriptNode;
    }

    return stubObject.backups.documentCreateElement.apply(this, arguments);
  };

  return stubObject;
}

describe('scriptloader', function () {
  before(function () {
    this.jsdom = require('jsdom-global')();
  });

  after(function () {
    this.jsdom();
  });

  var loadScriptStub;
  beforeEach(function () {
    loadScriptStub = stubLoadScript();
  });

  afterEach(function () {
    loadScriptStub.restore();
  });

  it('should load scripts and success callback', function () {
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.firstCall.args[0]).to.be.null;
  });

  it('should load scripts and error callback', function () {
    loadScriptStub.options.yieldsSuccess = false;
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.firstCall.args[0]).not.to.be.null;
  });

  it('should load scripts and success callback (without eventlisteners)', function () {
    loadScriptStub.options.withEventListener = false;
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.firstCall.args[0]).to.be.null;
  });

  it('should load scripts and error callback (without eventlisteners)', function () {
    loadScriptStub.options.yieldsSuccess = false;
    loadScriptStub.options.withEventListener = false;
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.firstCall.args[0]).not.to.be.null;
  });

  it('should load scripts and success callback (without eventlisteners & with readyState to "loaded")', function () {
    loadScriptStub.options.withEventListener = false;
    loadScriptStub.options.withReadyState = 'loaded';
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.firstCall.args[0]).to.be.null;
  });

  it('should load scripts and success callback (without eventlisteners & with readyState to "complete")', function () {
    loadScriptStub.options.withEventListener = false;
    loadScriptStub.options.withReadyState = 'complete';
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.firstCall.args[0]).to.be.null;
  });

  it('should load scripts and success callback (without eventlisteners & with notreadyState to "loading")', function () {
    loadScriptStub.options.withEventListener = false;
    loadScriptStub.options.withNotReadyState = 'loading';

    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    chai.expect(spy.callCount).to.eql(1);
    chai.expect(spy.firstCall.args[0]).to.be.null;
  });

  it('should not call twice given callback', function () {
    delete loadScriptStub.options.yieldsSuccess;
    var spy = sinon.spy();

    scriptloader('path/to/script', spy);

    // get reference to callbacks
    var triggerSuccess = loadScriptStub.successCallback;
    var triggerError = loadScriptStub.errorCallback;

    loadScriptStub.setLoaded(true);

    chai.expect(spy.callCount).to.eql(1);

    // we manually trigger script load callback a second time
    triggerSuccess();
    triggerError();

    // spy should not have been called again
    chai.expect(spy.callCount).to.eql(1);
  });
});
