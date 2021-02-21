let notification = require('../controllers/notification.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = function(app) {
	app.get('/notification', authenticate_common, notification.list);
    app.post('/note/:id', authenticate_common, notification.deleteNotifiy);
    }
    
 