var pandocCore = require('../core/pandoc');

function* getPandoc(next) {
    var result = yield pandocCore.addJob({
        test: true
    });

    this.body = result.data;
}

module.exports = {
    getPandoc: getPandoc
};
