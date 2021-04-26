var explore = require('../../controllers/compradors/explore.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	
	app.get('/compradors', authenticate_compradors, explore.toExplore);
     app.get('/compradors/order', authenticate_compradors, explore.toExplore);
     app.get('/compradors/order/details', authenticate_compradors, explore.toExplore);
	 app.get('/compradors/explore', authenticate_compradors, explore.toExplore);
	app.get('/compradors/explore/list',  explore.list);
	app.get('/compradors/explore/demand', authenticate_compradors, explore.demand);
	app.get('/compradors/explore/filter_product_items', authenticate_compradors, explore.filter_product_items);
	app.get('/compradors/explore/details/:id', explore.details);
	app.post('/compradors/explore/details', explore.authenticate);
	app.post('/compradors/explore/details/:id', explore.signUp);
	app.post('/compradors/explore/checkEmailExist', explore.checkEmailExist);
	app.post('/compradors/explore/cart', authenticate_compradors, explore.cart);
	app.post('/compradors/explore/save-search', authenticate_compradors, explore.saveSearch);
};