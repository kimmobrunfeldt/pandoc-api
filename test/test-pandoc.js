var chai = require('chai');
var utils = require('./utils');
var createRequest = require('./utils/request');
var request = createRequest();

function testPandoc() {
    describe('/convert', function() {
        this.timeout(5000);

        it('markdown to html', () => {
            return request
            .get('/convert')
            .query({url: utils.createTestUrl('basic.md')})
            .expect(200)
            .expect(res => {
                chai.expect(res.text).to.equal(utils.expectedContent('basic.html'));
            });
        });
    });
}

module.exports = testPandoc;
