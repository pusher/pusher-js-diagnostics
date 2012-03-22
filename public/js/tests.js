$(document).ready(defineTests);

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

var testsRan = 0;
var lastState = 'initialising';
function updateTestState(state) {
  var text = 'Initialising';
  switch(state) {
    case 'running':
      text = 'Running...';
      break;
    case 'complete':
      text = 'Completed';
      break;
  }
  
  $(document.body).removeClass(lastState);
  $(document.body).addClass(state);
  $('.test-state').text(text);
  
  lastState = state;
}

function defineTests() {
  updateTestState('initialising');
  
  var apiKey = '3c79040b291f29899811';
  var defaultWS = Pusher.ws_port;
  var defaultWSS = Pusher.wss_port;
  
  var browserInfo = {}
  var testResults = {};
  
  QUnit.begin(function() {
    updateTestState('running');
  });
  
  QUnit.done(function(result) {
    updateTestState('complete');
    
    var fullResults = {
      summary: result,
      results: testResults,
      browser: browserInfo
    };
    
    console.log(fullResults);
    
    $('#result-json').val( JSON.stringify(fullResults) );
    
    if( fullResults.summary.failed === 0 ) {
      $("#results").addClass('alert alert-success');
    }
    else {
      $("#results").addClass('alert alert-error');
    }
    
    // TODO: email results
    // $.ajax({
    //       url: '/results',
    //       type: 'post'
    //       data: fullResults
    //     });
  });

  var timeout = null;
  QUnit.testStart(function() {
      Pusher.wss_port = defaultWSS;
      Pusher.ws_port = defaultWS;
      
      Pusher.log = function(msg) {
          if (console && console.log) {
              console.log(msg);
          }
      };
  });

  QUnit.testDone(function(result) {
    ++testsRan;
    testResults[result.name] = result;
    
    if( timeout !== null ) {
      clearTimeout(timeout);
    }
  
    for (var i = 0, l = Pusher.instances.length; i < l; ++i) {
        var instance = Pusher.instances[i];
        if (instance.connection.state !== 'disconnected') {
            try {
                instance.disconnect();
            }
            catch (e) {}
        }
    }
    Pusher.instances = [];
  });
  
  function testTimeout(state) {
    timeout = setTimeout(function() {
        equal(pusher.connection.state, state);
        start();
    }, 20000);
  };
  
  test('Browser Vendor', function(){
    var browser = BrowserDetect.browser;
    ok(browser !== undefined);
    $("#browser-vendor").text(browser);
  });
  
  test('Browser Version', function(){
    browserInfo.version = BrowserDetect.version;
    ok(browserInfo.version !== undefined);        
    $("#browser-version").text(browserInfo.version);
  });
  
  test('Operating System', function(){
    browserInfo.os = BrowserDetect.OS;
    ok(browserInfo.os !== undefined);       
    $("#browser-os").text(browserInfo.os);
  });
  
  test('Flash installed?', function(){    
    browserInfo.flashVersion = undefined;
    if(swfobject.hasFlashPlayerVersion("10.0.0")) {
        browserInfo.flashVersion = swfobject.getFlashPlayerVersion();
    }
    
    var flashText = "Flash not installed or minimum version of Flash (10.0.0) not found";
    if(browserInfo.flashVersion !== undefined) {
        flashText = browserInfo.flashVersion.major + "." +
                    browserInfo.flashVersion.minor + "." + 
                    browserInfo.flashVersion.release;
    }
    
    ok(browserInfo.flashVersion !== undefined);
    
    $("#flash-info").text(flashText);
  });
  
  asyncTest('Can I connect to Pusher?', 1, function() {

    var pusher = new Pusher(apiKey);
    pusher.connection.bind('connected', function() {
        equal(pusher.connection.state, 'connected');

        start();
    });

    testTimeout('connected');
  });
  
  asyncTest('How long did it take to connect using our standard connection strategy and how did the connection succeed?', 1, function() {
      
    var startTime = new Date();
    
    var pusher = new Pusher(apiKey, {
        encrypted: true
    });
    pusher.connection.bind('connected', function() {
        
        var endTime = new Date();
        
        var timeToConnect = (endTime - startTime);
        $("#time-to-connect").text(timeToConnect);
        
        equal(pusher.connection.state, 'connected');

        start();
    });

    testTimeout('connected');
  });
  
  asyncTest('Can the user connect over WSS://', 1, function() {

    var pusher = new Pusher(apiKey, {
        encrypted: true
    });
    pusher.connection.bind('connected', function() {
        equal(pusher.connection.state, 'connected');

        start();
    });

    testTimeout('connected');
  });

  asyncTest('Can the user connect over WS://', function() {

    var pusher = new Pusher(apiKey, {
        encrypted: false
    });
    pusher.connection.bind('connected', function() {
        equal(pusher.connection.connectionSecure, false, 'Connected over WSS (non-secure)');

        start();
    });

    testTimeout('connected');
    
  });

  asyncTest('Can I disconnect from Pusher?', 1, function() {

    var pusher = new Pusher(apiKey);
    pusher.connection.bind('connected', function() {
        pusher.disconnect();
    });

    pusher.connection.bind('disconnected', function() {
        equal(pusher.connection.state, 'disconnected');
        start();
    });

    testTimeout('disconnected');
  });
  
  asyncTest('Can I disconnect and then reconnect?', 1, function() {
      
    var pusher = new Pusher(apiKey);
    var disconnectOnConnect = true;
    pusher.connection.bind('connected', function() {
        //console.log('>>> connected');
        if(disconnectOnConnect) {
            disconnectOnConnect = false;
            setTimeout(function() {
                //console.log('>>> disconnecting');
                pusher.disconnect();
            }, 100);
        }
        else {
            console.log('>>> test complete');
            equal(pusher.connection.state, 'connected');
            start();
        }
    });

    pusher.connection.bind('disconnected', function() {
        //console.log('>>> disconnected');
        setTimeout(function() {
            //console.log('>>> reconnecting');
            pusher.connect();
        }, 1000);
    });

    testTimeout('connected');
  });
  
  test('Connection method (WebSocket, MozWebSocket, Flash fallback)', function(){
    var transportType = Pusher.TransportType;
    var transportText = transportType;
    if(transportText === 'native') {
        transportText += " (" +
                         (window["WebSocket"]?"WebSocket":"MozWebSocket") +
                         ")";
    }
    
    ok(transportType !== undefined);
    
    $("#transport-type").text(transportText);
  });
      
  asyncTest('Can subscribe to a public channel?', 1, function() {
    var pusher = new Pusher(apiKey);
    var channel = pusher.subscribe('test-channel');
    channel.bind('pusher:subscription_succeeded', function() {
      ok(true);
      
      start();
    });
  });
  
  asyncTest('Can subscribe to a private channel?', 1, function() {
    var randomChannel = 'private-' + guidGenerator();
    var pusher = new Pusher(apiKey);
    var channel = pusher.subscribe(randomChannel);
    channel.bind('pusher:subscription_succeeded', function() {
      ok(true);
      
      start();
    });
  });
  
  asyncTest('Can subscribe to a presence channel?', function() {
    var randomChannel = 'presence-' + guidGenerator();
    var pusher = new Pusher(apiKey);
    var channel = pusher.subscribe(randomChannel);
    channel.bind('pusher:subscription_succeeded', function() {
      ok(true);
      
      start();
    });
  });
  
  asyncTest('Can I receive events from Pusher?', function() {
    var randomChannel = guidGenerator();
    var pusher = new Pusher(apiKey);
    var channel = pusher.subscribe(randomChannel);
    channel.bind('pusher:subscription_succeeded', function() {
      
      $.ajax({
          url: '/trigger/',
          data: {
            channel: randomChannel
          }
        });
    });
    
    channel.bind('test_event', function(data) {
      equal( data.message, "hello world" );
      
      start();
    });
  });
  
  asyncTest('Can I trigger client events?', function() {
    var randomChannel = 'private-' + guidGenerator();
    var pusher = new Pusher(apiKey);
    var channel = pusher.subscribe(randomChannel);
    channel.bind('pusher:subscription_succeeded', function() {
      
      var triggered = channel.trigger('client-test', {some:'data'});
      ok(triggered);
      
      start();
    });
  });     
}