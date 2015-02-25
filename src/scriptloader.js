(function(global, document) {
    "use strict";

    function factory() {
        return function scriptloader(url, callback) {
            var script = document.createElement('script');
            var done = false;

            function finish(error) {
                if (done) {
                    return;
                }
                done = true;

                script.parentNode.removeChild(script);

                callback(error);
            }

            function abort() {
                finish(new Error('script load error'));
            }

            if (script.addEventListener) {
                script.addEventListener('load', finish.bind(null, null), true);
                script.addEventListener('error', abort, true);
            } else {
                script.onload = script.onreadystatechange = function() {
                    if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                        finish(null);
                    }
                };
                script.onerror = abort;
            }

            script.async = true;
            script.src = url;

            var firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(script, firstScript);
        };
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        global.scriptloader = factory();
    }
}(this, this.document));