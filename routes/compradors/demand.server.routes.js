let demand = require('../../controllers/compradors/demand.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/demands', authenticate_compradors, demand.list);
};