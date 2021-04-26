const moment = require('moment');
const momentTimezone = require('moment-timezone');
const config = require('../../config/config');

const getMonthDateRange = (year, month) => {
    let startDate = moment([year, month - 1]).format('YYYY-MM-DD');
    let endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

    return { start: startDate, end: endDate };
};

const dateRange = (startDate, endDate) => {
	const dateArray = [];
	let currentDate = moment(startDate);
	endDate = moment(endDate);
	
	while (currentDate <= endDate) {
		dateArray.push(moment(currentDate).format('YYYY-MM-DD'));
		currentDate = moment(currentDate).clone().add(1, 'days');
	}
	
	return dateArray;
};

const dayQuarter = (date) => {
	let today = new Date(date)
	let curHr = today.getHours()
	let caption = "";
	if (curHr < 12) {
		caption = "morning";
	} else if (curHr < 18) {
	  caption = "afternoon";
	} else {
		caption = "evening";
	}
	return caption;
};

module.exports = {
	dayQuarter,
	dateRange,
    getMonthDateRange,
};