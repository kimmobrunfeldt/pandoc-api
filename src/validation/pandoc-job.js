var Joi = require('joi');
var urlRegex = require('url-regex');
var validationUtils = require('./validation-utils');

var schema = {
    id:
        Joi
        .number()
        .integer(),

    url:
        Joi
        .string()
        .regex(urlRegex({exact: true}))
        .required(),

    toFormat:
        Joi
        .string()
        .valid(['html'])
        .optional()
};

function validate(pandocJob) {
    validationUtils.validateObject(pandocJob, schema);
}

module.exports = {
    validate
};
