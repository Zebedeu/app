let index = require('../controllers/kepyaindex.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = function(app) {
	app.get('/kepyaindex', authenticate_common, index.kepyaIndex);
	app.get('/get-kepya-index/:dateTo', authenticate_common, index.getKepyaIndex);


};