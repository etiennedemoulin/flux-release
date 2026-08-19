export function updateSchema(schema, key, values) {
  const update = {};
  const oldValues = schema.get(key);
  update[key] = Object.assign(oldValues, values);
  schema.set(update);
}