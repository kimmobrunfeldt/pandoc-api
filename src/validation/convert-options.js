var Joi = require('joi');
var urlRegex = require('url-regex');

var schema = {
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

module.exports = schema;
