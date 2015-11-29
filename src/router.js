var createRouter = require('koa-router')
var pandocApi = require('./api/pandoc');

var router = createRouter({
    prefix: '/api/v1'
});

router.get('/pandoc', pandocApi.getPandoc);

module.exports = router;
