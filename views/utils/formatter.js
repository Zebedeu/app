let moment = require('moment');

const separators = (num) => {
	num = parseFloat(num).toFixed(2)
    let num_parts = num.toString().split(".");
    num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return num_parts.join(",");
};

const separatorsWD = (num) => {
	let num_parts = num.toString().split(".");
    num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return num_parts.join(",");
};


const removePointerInCurrence = (number) => {
    let regex = /([+-]?[0-9|^.|^,]+)[\.|,]([0-9]+)$/igm
    let result = regex.exec(number);

    let floatResult = result? result[1].replace(/[.,]/g, "")+ "." + result[2] : number.replace(/[^0-9-+]/g, "");
    return floatResult
} 

const convert_date = (date, language) => {
    return (language == 'PT') ? moment(date).format('DD/MM/YYYY') : moment(date).format('MM/DD/YYYY')
};

module.exports = {
	separators,
	separatorsWD,
  	convert_date,
    removePointerInCurrence
};