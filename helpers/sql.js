const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * Generate SQL query for partial update based on provided data and column mappings.
 * 
 * @param {Object} dataToUpdate - The data to be updated, represented as an object where keys are column names and values are the new values.
 * @param {Object} jsToSql - An object that maps JavaScript object keys to SQL column names. If a key is not found in this mapping, it will be used as is.
 * @returns {Object} An object containing the set clause of the SQL query and an array of corresponding values.
 * @throws {BadRequestError} Throws BadRequestError if no data is provided for update.
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
