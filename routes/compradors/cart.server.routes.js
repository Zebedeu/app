var cart = require('../../controllers/compradors/cart.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/cart/list', authenticate_compradors, cart.list);
	app.post('/compradors/cart/update', authenticate_compradors, cart.update);
};