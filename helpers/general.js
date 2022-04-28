const createQueryObjects = (body, defaults) => {
  const query = {
    ...defaults,
  };
  for (const key in body) {
    if (body[key]) {
      query[key] = body[key];
    }
  }
  return query;
};
module.exports = {
  createQueryObjects,
};
