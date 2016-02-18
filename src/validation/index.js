var Joi = require('joi');

function validateObject(obj, schema) {
    var validation = Joi.validate(obj, schema);
    if (validation.error) {
        throw validation.error;
    } else {
        return validation.value;
    }
}

module.exports = {
    validateObject: validateObject
};
