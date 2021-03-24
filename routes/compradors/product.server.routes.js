var product = require('../../controllers/compradors/product.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {

	app.get('/compradors/product', authenticate_compradors, product.toDashboard);
	app.get('/compradors/display', authenticate_compradors, product.toDashboard);
	app.get('/compradors/product/list', authenticate_compradors, product.list);
	app.route('/compradors/product/add')
		.get(authenticate_compradors, product.add)
		.post(authenticate_compradors, product.add);
	app.get('/compradors/product/display/:id', authenticate_compradors, product.display);
	app.post('/compradors/product/edit', authenticate_compradors, product.edit);
	app.get('/compradors/product/remove/:id', authenticate_compradors, product.remove);
	app.get('/compradors/product/filter-list', authenticate_compradors, product.filterList);
};