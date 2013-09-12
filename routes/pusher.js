var CONF_FILE = require('../config/pusher'),
    Pusher = require('pusher'),
    pusher = new Pusher({
      appId: CONF_FILE.app_id,
      key: CONF_FILE.app_key,
      secret: CONF_FILE.app_secret
    });

exports.trigger = function (req, res) {

  var channel = req.params.channel;

  pusher.trigger(channel, 'test_event', { "message": "hello world" });

  return res.send(200, 'Triggered!');

}

exports.auth = function (req, res) {

  var channelName = req.body.channel_name,
      socketId = req.body.socket_id,
      channnelData;

  if (channelName.indexOf('private-') === 0) {
    channelData = null;
  }
  else if (channelName.indexOf('presence-') === 0) {
    channelData = {
      user_id: 'some_id',
      user_info: {
        name: 'some_name'
      }
    };
  }
  else {
    return res.end();
  }

  return res.send(200, pusher.auth(socketId, channelName, channelData));

}