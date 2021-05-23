var order = require('../../controllers/farmer/order.server.controller.js');
const {
     authenticate_farmers
} = require('../../utils/session.js');

module.exports = function (app) {
     app.get('/farmer/order/list', authenticate_farmers, order.list);
     app.get('/farmer/order/filter-list', authenticate_farmers, order.filterList);
};