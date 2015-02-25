Script loader
=========

Simple DOM script loader function


Installation
--------------
This library has been declined as a bower component. In order to use it, just add it to your project's bower.json dependencies :

```json
"dependencies": {
    ...
    "scriptloader": "https://github.com/francetv/scriptloader.git"
    ...
}
```

How to use it
--------------

This library implements [UMD](http://bob.yexley.net/umd-javascript-that-runs-anywhere/), so you can import it with AMD or browser globals

```javascript
require.config({
    ...
    paths: {
        'scriptloader': './bower_components/scriptloader/scriptloader.min.js'
    }
})
require(['scriptloader', ...], function (scriptloader, ...) {
    ...
});
```

or

```html
<script type="text/javascript" src="./bower_components/scriptloader/scriptloader.min.js" />
```

