let session = require('../controllers/session.server.controller.js');

module.exports = function(app) {
	app.get('/set-session/:id', session.set);
};