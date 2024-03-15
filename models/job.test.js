"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "SoFtWaRe EnGineer",
    salary: 90000,
    equity: 0,
    company_handle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
        id: expect.any(Number),
        title: "SoFtWaRe EnGineer",
        salary: 90000,
        equity: "0",
        companyHandle: 'c1'
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'SoFtWaRe EnGineer'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "SoFtWaRe EnGineer",
        salary: 90000,
        equity: "0",
        company_handle: 'c1'
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});



/************************************** findAll */
describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "Boss",
            salary: 300000,
            equity: "0.5",
            companyHandle: 'c1',
            companyName:"C1"
        },
        {
            id: expect.any(Number),

            title: "Manager",
            salary: 100000,
            equity: "0.3",
            companyHandle: 'c2',
            companyName:"C2"
        },
        {
            id: expect.any(Number),
            title: "Worker",
            salary: 30000,
            equity: "0.5",
            companyHandle: 'c3',
            companyName: 'C3'

        },
      ]);
    });

    test("works: minSalary filter", async function () {
        const filteredData ={minSalary: 100000}
        let jobs = await Job.findAll(filteredData);
        expect(jobs).toEqual([
          {
              id: expect.any(Number),
              title: "Boss",
              salary: 300000,
              equity: "0.5",
              companyHandle: 'c1',
              companyName:"C1"
          },
          {
              id: expect.any(Number),
  
              title: "Manager",
              salary: 100000,
              equity: "0.3",
              companyHandle: 'c2',
              companyName:"C2"
          }
        ]);
      });
      test("works: title filter", async function () {
        const filteredData = {title: "er"}
        let jobs = await Job.findAll(filteredData);
        expect(jobs).toEqual([
          {
              id: expect.any(Number),
              title: "Manager",
              salary: 100000,
              equity: "0.3",
              companyHandle: 'c2',
              companyName:"C2"
          },
          {
            id: expect.any(Number),
            title: "Worker",
            salary: 30000,
            equity: "0.5",
            companyHandle: 'c3',
            companyName: 'C3'
            }
        ]);
      });
      
  });
  


/************************************** get */

// ('Boss', 300000, 0.5, 'c1'),
//   ('Manager', 100000, 0.3, 'c2'),
//   ('Worker', 30000, 0.5, 'c3')`);

describe("get", function () {
    test("works", async function () {

      let job = await Job.get(testJobIds[0]);
      expect(job).toEqual({
        id : testJobIds[0],
        title: "Boss",
        salary: 300000,
        equity : "0.5", 
        companyHandle : "c1",
        company:{
            handle: 'c1',
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img"
        }
      });
    });
  
    test("not found if no such company", async function () {
      try {
        await Job.get("nope");
        fail();
      } catch (err) {
        expect(err.name).toBe('error')
      }
    });
  });
  

/************************************** update */
describe("update", function () {
    const updateData = {
      title: "Boss2",
      salary: 400000,
      equity: "0.6",
    };
  
    test("works", async function () {
      let job = await Job.update(testJobIds[0], updateData);
      expect(job).toEqual({
        id: testJobIds[0],
        ...updateData,
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id = ${testJobIds[0]}`);
      expect(result.rows).toEqual([{
        id: testJobIds[0],
        title: "Boss2",
        salary: 400000,
        equity: "0.6",
        companyHandle : "c1",
      }]);
    });
  
    test("works: null fields", async function () {
      const updateDataSetNulls = {
        title: "Boss2",
      salary: null,
      equity: "0.6",
      };
  
      let job = await Job.update(testJobIds[0], updateDataSetNulls);
      expect(job).toEqual({
        id: testJobIds[0],
        ...updateDataSetNulls,
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id = ${testJobIds[0]}`);
      expect(result.rows).toEqual([{
        id: testJobIds[0],
        title: "Boss2",
        salary: null,
        equity: "0.6",
        companyHandle : "c1",
      }]);
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.update("nope", updateData);
        fail();
      } catch (err) {
        expect(err.name).toBe('error');
      }
    });
  
    test("bad request with no data", async function () {
      try {
        await Job.update(testJobIds[0], {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });
  

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
      await Job.remove(testJobIds[0]);
      const res = await db.query(
          `SELECT id FROM jobs WHERE id=${testJobIds[0]}`);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such company", async function () {
      try {
        await Job.remove("nope");
        fail();
      } catch (err) {
        expect(err.name).toBe('error');
    }
    });
  });
  