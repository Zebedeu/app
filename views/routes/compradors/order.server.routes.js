var order = require('../../controllers/compradors/order.server.controller.js');
const {
     authenticate_compradors
} = require('../../utils/session.js');

module.exports = function (app) {
     app.get('/compradors', authenticate_compradors, order.toDashboard);
     app.get('/compradors/order', authenticate_compradors, order.toDashboard);
     app.get('/compradors/order/details', authenticate_compradors, order.toDashboard);
     app.get('/compradors/order/list', authenticate_compradors, order.list);
     app.get('/compradors/order/filter-list', authenticate_compradors, order.filterList);
     app.get('/compradors/order/details/:id', authenticate_compradors, order.details);
     app.get('/compradors/order/payment', authenticate_compradors, order.payment);
     app.get('/compradors/order/cancel', authenticate_compradors, order.cancel);
     app.get('/compradors/order/action-bidders', authenticate_compradors, order.actionBidders);
     app.get('/compradors/order/rating', authenticate_compradors, order.rating);
     app.get('/compradors/order/confirm', authenticate_compradors, order.confirm);
     app.get('/compradors/order/download', authenticate_compradors, order.downloadInvoice);

};