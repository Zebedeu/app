var product = require('../../controllers/aggregators/product.server.controller.js');
const {
	authenticate_aggregators
} = require('../../utils/session.js');

module.exports = function (app) {
	app.get('/aggregators/product/list', authenticate_aggregators, product.list);
	app.route('/aggregators/product/add')
		.get(authenticate_aggregators, product.add)
		.post(authenticate_aggregators, product.add);
	app.get('/aggregators/product/display/:id', authenticate_aggregators, product.display);
	app.post('/aggregators/product/edit', authenticate_aggregators, product.edit);
	app.get('/aggregators/product/remove/:id', authenticate_aggregators, product.remove);
	app.get('/aggregators/product/filter-list', authenticate_aggregators, product.filterList);
	app.get('/aggregators/product/sold-list', authenticate_aggregators, product.soldList);
	app.get('/aggregators/product/unsold-list', authenticate_aggregators, product.unsoldList);
	app.get('/aggregators/product/order/:id', authenticate_aggregators, product.order);
};