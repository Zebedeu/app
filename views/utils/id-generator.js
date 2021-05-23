const moment = require('moment');
const dbConstants = require('./../constants/db-constants');

const randomStr = () => {
    let length = 3;
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

const generateInviteCode = (length) => {
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };
  
const randomNo = () => {
    return (Math.floor(Math.random() * (999999999 - 111111111 + 1) + 111111111));
};

const generateRandom = (label) => {
    let generatedId = '';
    if (label) {
        generatedId = (Math.floor(Math.random() * (999999 - 111111 + 1) + 111111));
    } else {
        generatedId = `${moment().unix()}${Math.floor((Math.random() * 99) + 11)}`;
    }

    return generatedId;
};

const generateReference = () => {
    return `${moment().unix()}${Math.floor((Math.random() * 99999) + 11111)}`;
};

const generateId = (label, done) => {
    done(null, generateRandom(label));
};

module.exports = {
    randomNo,
    randomStr,
    generateId,
    generateRandom,
    generateReference,
    generateInviteCode
};