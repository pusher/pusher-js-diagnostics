var express = require('express');
var Pusher = require('node-pusher');
var crypto = require('crypto');

Pusher.prototype.auth = function(socketId, channel, channelData) {
  var returnHash = {}
  var channelDataStr = ''
  if (channelData) {
    channelData = JSON.stringify(channelData);
    channelDataStr = ':' + channelData;
    returnHash['channel_data'] = channelData;
  }
  var stringToSign = socketId + ':' + channel + channelDataStr;
  returnHash['auth'] = this.options.key + ':' + crypto.createHmac('sha256', this.options.secret).update(stringToSign).digest('hex');
  return(returnHash);
};

var CONFIG = require('config').Pusher;

var app = express.createServer(express.logger());

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/trigger/:channel', function(request, response) {

  var pusher = new Pusher({
    appId: CONFIG.appId,
    key: CONFIG.appKey,
    secret: CONFIG.appSecret
  });
  
  var channel = request.params.channel;

  pusher.trigger(channel, 'test_event', {"message": "hello world"});
  
  response.end();
});

app.post('/pusher/auth', function(request, response) {
  
  console.log(request.body);
  
  var channelName = request.body.channel_name;
  var socketId = request.body.socket_id;
  
  var channnelData;
  
  if(channelName.indexOf('private-') === 0) {
    channelData = null;
  }
  else if(channelName.indexOf('presence-') === 0) {
    channelData = {
      user_id: "some_id",
      user_info: {
        name: "some_name"
      }
    };
  }
  else {
    response.end();
  }

  var pusher = new Pusher({
    appId: CONFIG.appId,
    key: CONFIG.appKey,
    secret: CONFIG.appSecret
  });
  
  var auth = pusher.auth(socketId, channelName, channelData);
  console.log(auth);
  response.send(auth);
  
  response.end();
});

app.post('/results', function(request, response) {
  // TODO: email results
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});