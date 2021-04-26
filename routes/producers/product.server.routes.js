let product = require('../../controllers/producers/product.server.controller.js');
const {
	authenticate_producers
} = require('../../utils/session.js');

module.exports = function (app) {
	app.get('/producers/product/list', authenticate_producers, product.list);
	app.route('/producers/product/add')
		.get(authenticate_producers, product.add)
		.post(authenticate_producers, product.add);
	app.get('/producers/product/display/:id', authenticate_producers, product.display);
	app.post('/producers/product/edit', authenticate_producers, product.edit);
	app.get('/producers/product/remove/:id', authenticate_producers, product.remove);
	app.get('/producers/product/filter-list', authenticate_producers, product.filterList);
	app.get('/producers/product/sold-list', authenticate_producers, product.soldList);
	app.get('/producers/product/unsold-list', authenticate_producers, product.unsoldList);
	app.get('/producers/product/order/:id', authenticate_producers, product.order);
};