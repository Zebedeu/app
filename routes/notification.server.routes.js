let notification = require('../controllers/notification.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = function(app) {
	app.get('/notification', authenticate_common, notification.list);
	app.get('/notification/remove/:notification_log_id', authenticate_common, notification.remove);
    }
    
 