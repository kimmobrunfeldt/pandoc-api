var createRouter = require('koa-router')
var pandoc = require('./http/pandoc');

var router = createRouter();
router.get('/convert', pandoc.getDocument);

module.exports = router;
