var order = require('../../controllers/aggregators/order.server.controller.js');
const {
     authenticate_aggregators
} = require('../../utils/session.js');

module.exports = function (app) {
     app.get('/aggregators/order/list', authenticate_aggregators, order.list);
     app.get('/aggregators/order/filter-list', authenticate_aggregators, order.filterList);
     app.get('/aggregators/order/details/:id', authenticate_aggregators, order.details);
     app.get('/aggregators/order/change-shipment-status/:id/:productID', authenticate_aggregators, order.changeShipmentStatus);
     app.post('/aggregators/order/add-invoice/:id', authenticate_aggregators, order.addInvoice);

};