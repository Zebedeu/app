let index_k = require('../controllers/kepyaindex.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = function(app) {

	app.post('/kepyaindex/authenticate', index_k.authenticate);
	app.get('/kepyaindex', index_k.kepyaIndex);
	app.get('/get-kepya-index/:dateTo', index_k.getKepyaIndex);


};