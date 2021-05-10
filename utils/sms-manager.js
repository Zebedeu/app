const config = require('../../config/config');
const twilio = require('twilio');
const client = new twilio(config.twilio.accountSid, config.twilio.authToken);

const sendSMS = (requestParam) => {
    console.log(requestParam);
    client.messages.create({
        body: requestParam.message,
        to: `${requestParam.mobile}`,
        from: config.twilio.mobileNo
    })
    .then((message) => console.log(message.sid));
    return;
};

module.exports = {
    sendSMS
};