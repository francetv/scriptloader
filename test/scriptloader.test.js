/* global describe it */

var chai = require('chai');
var sinon = require('sinon');
var scriptloader = require('../src');

function stubLoadScript (options) {
  // options:
  //     withEventListener: true/false (true)
  //     yieldsSuccess: true/false (true)
  //     scriptAction: function

  options = options || {};
  options.withEventListener = options.withEventListener !== false;
  options.yieldsSuccess = options.yieldsSuccess !== false;

  if (options.scriptAction && typeof options.scriptAction !== 'function') {
    throw new TypeError('Option scriptAction should be a function');
  }

  var scriptNode = {
    parentNode: {
      removeChild: sinon.stub()
    }
  };

  var stubObject = {
    options: options,
    scriptNode: scriptNode,
    stubs: {
      scriptSearch: sinon.stub(),
      scriptCreate: sinon.stub(),
      scriptInsert: sinon.stub(),
      scriptRemove: scriptNode.parentNode.removeChild
    },
    backups: {
      documentGetElementsByTagName: document.getElementsByTagName,
      documentCreateElement: document.createElement
    },
    restore: function restore() {
      document.createElement = stubObject.backups.documentCreateElement;
      document.getElementsByTagName = stubObject.backups.documentGetElementsByTagName;
      clearTimeout(stubObject.createTimeout);
      clearTimeout(stubObject.yieldTimeout);
    },
    setLoaded: function setLoaded(success) {
      clearTimeout(stubObject.yieldTimeout);
      var callback = success ? stubObject.successCallback : stubObject.errorCallback;

      if (!callback) {
        throw new Error('not currently loading script');
      }

      delete stubObject.successCallback;
      delete stubObject.errorCallback;

      if (success && options.scriptAction) {
        options.scriptAction();
      }

      callback.call(scriptNode);
    }
  };

  stubObject.stubs.scriptCreate.returns(scriptNode);
  stubObject.stubs.scriptSearch.returns([{
    parentNode: {
      insertBefore: stubObject.stubs.scriptInsert
    }
  }]);

  document.getElementsByTagName = function(name) {
    if (name === 'script') {
      return stubObject.stubs.scriptSearch.apply(this, arguments);
    }
    return stubObject.backups.documentGetElementsByTagName.apply(this, arguments);
  };

  document.createElement = function(name) {
    if (name === 'script') {
      if (options.withEventListener) {
        scriptNode.addEventListener = function addEventListener(event, callback) {
          if (event === 'load') {
            stubObject.successCallback = callback;
          }
          else if (event === 'error') {
            stubObject.errorCallback = callback;
          }
        };
      }

      stubObject.createTimeout = setTimeout(function() {
        if (!options.withEventListener) {
          stubObject.successCallback = scriptNode.onload;
          stubObject.errorCallback = scriptNode.onerror;
        }

        if (options.yieldsSuccess !== undefined) {
          stubObject.yieldTimeout = setTimeout(function() {
            stubObject.setLoaded(!!options.yieldsSuccess);
          }, 0);
        }
      }, 0);

      var scriptMock = stubObject.stubs.scriptCreate.apply(this, arguments);

      // document.createElement = stubObject.backups.documentCreateElement;

      return scriptMock;
    }
    return stubObject.backups.documentCreateElement.apply(this, arguments);
  };

  return stubObject;
}

describe('scriptloader', function() {

  before(function () {
    this.jsdom = require('jsdom-global')();
  });

  after(function () {
    this.jsdom();
  });

  var loadScriptStub;
  beforeEach(function() {
    loadScriptStub = stubLoadScript();
  });

  afterEach(function() {
    loadScriptStub.restore();
  });

  it ('should load scripts and success callback', function(done) {
    loadScriptStub.options.yieldsSuccess = true;

    scriptloader('path/to/script', function(error) {
      chai.expect(error).to.be.null;
      done();
    });
  });

  it ('should load scripts and error callback', function(done) {
    loadScriptStub.options.yieldsSuccess = false;

    scriptloader('path/to/script', function(error) {
      chai.expect(error).not.to.be.null;
      done();
    });
  });

  it ('should load scripts and success callback (without eventlisteners)', function(done) {
    loadScriptStub.options.yieldsSuccess = true;
    loadScriptStub.options.withEventListener = false;

    scriptloader('path/to/script', function(error) {
      chai.expect(error).to.be.null;
      done();
    });
  });

  it ('should load scripts and error callback (without eventlisteners)', function(done) {
    loadScriptStub.options.yieldsSuccess = false;
    loadScriptStub.options.withEventListener = false;

    scriptloader('path/to/script', function(error) {
      chai.expect(error).not.to.be.null;
      done();
    });
  });

  it ('should not call twice given callback', function(done) {
    delete loadScriptStub.options.yieldsSuccess;
    var count = 0;

    function callback() {
      count++;
      if (count === 1) {
        triggerSuccess();
      }
    }

    scriptloader('path/to/script', callback);

    var triggerSuccess = loadScriptStub.successCallback;

    loadScriptStub.setLoaded(true);

    setTimeout(function() {
      chai.expect(count).to.equal(1);
      done();
    }, 100);
  });
});
