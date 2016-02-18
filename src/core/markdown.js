var url = require('url');
var BPromise = require('bluebird');
var _ = require('lodash');
var visit = require('unist-util-visit');
var logger = require('../logger')(__filename);
var remark = require('remark');

// Takes markdown text, and converts all relative links to full urls
function resolveLinks(rootUrl, text) {
    var customRemark = remark().use(() => function transformer(tree) {
        visit(tree, 'image', function(node) {
            console.log(node);
            var components = url.parse(node.url);
            if (components.protocol === null) {
                node.url = url.resolve(rootUrl, node.url);
            }
        });

        visit(tree, 'link', function(node) {
            console.log(node);

            // TODO: handle e.g. relative js file links
            var components = url.parse(node.url);
            if (_.endsWith(components.path, '.md')) {
                var fullUrl = url.resolve(rootUrl, node.url);
                node.url = url.format({
                    hostname: 'localhost',
                    port: 9000,
                    protocol: 'http',
                    pathname: 'convert',
                    search: '?url=' + fullUrl
                });
            }
        });
    });

    return customRemark.process(text);
}

module.exports = {
    resolveLinks: resolveLinks
};
