const { BadRequestError } = require("../expressError");
const {sqlForPartialUpdate }= require("./sql")


describe("sql For partial update",  function(){
    test("correct data provided", function(){
        const dataToUpdate = {firstName: 'Aliya', age: 32};
        const jsToSql = {firstName: 'first_name', age: "age"}
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result.setCols).toEqual('"first_name"=$1, "age"=$2');
        expect(result.values).toEqual(['Aliya', 32])
    })
    test("incorrect data provided", function(){
        const dataToUpdate = {firstName: 'Aliya', age: '32'};
        const jsToSql = {firstName: 'first_name', age: "age"}
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    
        expect(result.setCols).toEqual('"first_name"=$1, "age"=$2');
        expect(result.values).not.toEqual(['Aliya', 32])
    })

    test("No data provided", function(){
        const dataToUpdate = {};
        const jsToSql = {firstName: 'first_name', age: "age"}
        expect(()=>sqlForPartialUpdate(dataToUpdate,jsToSql)).toThrowError(BadRequestError);
    })

    test("Invalid input provided", function(){
        const dataToUpdate = { firstName: null, age: null }; // Invalid null values provided
        const jsToSql = { firstName: null, age: null };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        
        // Assert that setCols and values are generated based on keys, even if values are null
        expect(result.setCols).toEqual('"firstName"=$1, "age"=$2');
        expect(result.values).toEqual([null, null]);
    })
})