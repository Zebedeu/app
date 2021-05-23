let reference = require('../controllers/reference.server.controller.js');
const {
    authenticate_compradors
} = require('../utils/session.js');

module.exports = function(app) {
	//app.get('/reference/generate', authenticate_compradors, reference.generate);
	app.get('/reference/generate', reference.generate);
};