Script loader
=========

Simple DOM script loader function


Installation
--------------
```json
npm i --save-dev git@gitlab.ftven.net:bower-component/scriptloader.git
```

How to use it
--------------

```js
var scriptloader = require('scriptloader');

scriptloader(`${url}`, (err) => {
  if (err) {
    // err when load your script
  } else {
    // script has been loaded!
  }
});
```

