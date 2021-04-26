var order = require('../../controllers/trading/order.server.controller.js');
const {
     authenticate_trading
} = require('../../utils/session.js');

module.exports = function (app) {
     app.get('/trading/order/list', authenticate_trading, order.list);
     app.get('/trading/order/filter-list', authenticate_trading, order.filterList);
     app.get('/trading/order/details/:id', authenticate_trading, order.details);
     app.get('/trading/order/payment', authenticate_trading, order.payment);
     app.get('/trading/order/cancel', authenticate_trading, order.cancel);
     app.get('/trading/order/action-bidders', authenticate_trading, order.actionBidders);
     app.get('/trading/order/rating', authenticate_trading, order.rating);
     app.get('/trading/order/confirm', authenticate_trading, order.confirm);
};   