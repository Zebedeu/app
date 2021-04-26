var order = require('../../controllers/producers/order.server.controller.js');
const {
     authenticate_producers
} = require('../../utils/session.js');

module.exports = function (app) {
     app.get('/producers/order/list', authenticate_producers, order.list);
     app.get('/producers/order/filter-list', authenticate_producers, order.filterList);
     app.get('/producers/order/details/:id', authenticate_producers, order.details);
     app.get('/producers/order/change-shipment-status/:id/:productID', authenticate_producers, order.changeShipmentStatus);
};