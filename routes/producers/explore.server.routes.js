var explore = require('../../controllers/producers/explore.server.controller.js');

module.exports = function(app) {
	app.get('/producers/explore/list', explore.list);
};