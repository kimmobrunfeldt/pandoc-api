var createRouter = require('koa-router')
var pandoc = require('./http/pandoc');

var router = createRouter({
    prefix: '/api/v1'
});

router.get('/pandoc', pandoc.getPandoc);

module.exports = router;
