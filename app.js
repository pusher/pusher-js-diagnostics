var http = require('http'),
    path = require('path');

var express = require('express'),
    app = express();

var domain = require('domain'),
    serverDomain = domain.create();

var routes = {
  html: require('./routes/static'),
  pusher: require('./routes/pusher')
};

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('pusher'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

// Routes!
app.get('/', routes.html.home);
app.get('/trigger/:channel', routes.pusher.trigger);
app.post('/pusher/auth', routes.pusher.auth);

// Wrap server in domain to prevent memory leaks in Node core v0.8.20
// http://clock.co.uk/tech-blogs/preventing-http-raise-hangup-error-on-destroyed-socket-write-from-crashing-your-nodejs-server

serverDomain.run(function () {
  http.createServer(function (req, res) {

    var reqd = domain.create();
    reqd.add(req);
    reqd.add(res);

    // On error dispose of the domain
    reqd.on('error', function (error) {
      console.error('Error', error.code, error.message, req.url);
      reqd.dispose();
    });

    // Pass the request to express
    app(req, res);

  }).listen(app.get('port'));
});

// Error "handling"

process.on('uncaughtException', function (err) {
  console.error('uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});

