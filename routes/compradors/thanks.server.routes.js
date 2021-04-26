var thanks = require('../../controllers/compradors/thanks.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/thanks/list/:id', authenticate_compradors, thanks.list);
};