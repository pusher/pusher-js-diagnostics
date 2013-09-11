var fs = require('fs');

exports.home = function (req, res) {
  var stream = fs.createReadStream('./views/index.html', { encoding: 'utf-8' });

  stream.on('error', function (err) {
    res.statusCode = 500;
    res.end(String(err));
  });

  res.writeHead(200, { 'Content-Type' : 'text/html' });
  stream.pipe(res);
};
