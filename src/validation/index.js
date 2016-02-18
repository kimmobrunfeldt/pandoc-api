var Joi = require('joi');

function assertObject(obj, schema) {
    var validation = Joi.validate(obj, schema);
    if (validation.error) {
        throw validation.error;
    } else {
        return validation.value;
    }
}

module.exports = {
    assertObject
};
