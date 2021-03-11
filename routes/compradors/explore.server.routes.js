var explore = require('../../controllers/compradors/explore.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/explore/list', authenticate_compradors, explore.list);
	app.get('/compradors/explore/demand', authenticate_compradors, explore.demand);
	app.get('/compradors/explore/filter_product_items', authenticate_compradors, explore.filter_product_items);
	app.get('/compradors/explore/details/:id', authenticate_compradors, explore.details);
	app.post('/compradors/explore/cart', authenticate_compradors, explore.cart);
	app.post('/compradors/explore/save-search', authenticate_compradors, explore.saveSearch);
};