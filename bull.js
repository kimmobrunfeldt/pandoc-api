var app = require('bull-ui/app')({
    redis: {
    host: 'localhost',
    port: 6379
  }
});
  app.listen(1337, function(){
    console.log('bull-ui started listening on port', this.address().port);
  });
