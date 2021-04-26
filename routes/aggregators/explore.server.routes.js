const explore = require('../../controllers/aggregators/explore.server.controller.js');
const {
    authenticate_aggregators
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/aggregators/explore/list', authenticate_aggregators, explore.list);
};