const _ = require('lodash');

const Product = require('./product');

function matchesType(val, type) {
  return type === Object.prototype.toString.call(val).match(/[^\[object\s](\w*)/)[0];
}

function mapToModel(model, obj) {
  const clone = _.clone(model);
  return _.mapValues(clone, (val, key) => {
    if ( matchesType(obj[key], val) ) {
      return obj[key];
    }
  });
}

function transform(data) {
  // Custom code, abstract later
  const transformed = _.pick(
    Object.assign(data, data.info, {
      model_number: data.description.model_number
    }),
    Object.keys(Product)
  );
  delete data.description.model_number;
  return mapToModel(Product, transformed);
}

module.exports = {
  transform
};
