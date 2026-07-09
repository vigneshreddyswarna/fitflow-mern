function devOnlyCode(name, value) {
  return process.env.NODE_ENV !== 'production' ? { [name]: value } : {};
}

module.exports = { devOnlyCode };
