function create() {
    var counter = 0;

    // Adds requestId to Koa request context
    return function* requestId(next) {
        this.requestId = this.headers['x-request-id'];

        if (!this.headers['x-request-id']) {
            this.requestId = counter;
            counter++;
        }

        yield next;
    }
}

module.exports = create;
