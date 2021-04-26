var explore = require('../../controllers/transporters/explore.server.controller.js');

module.exports = function(app) {
	app.get('/transporters/explore/list', explore.list);
};