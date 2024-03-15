"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job{
    /** Create a Job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create(data) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1`,
        [data.title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${data.title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title,
          data.salary,
          data.equity,
          data.company_handle,
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs with filteredData.
   * 
   * filtered Data
   * - title
   * - minSalary
   * - hasEquity
   *
   * Returns [{  id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll(filteredData= {}) {
    let query = `
    SELECT 
    j.id, j.title, j.salary, j.equity, company_handle AS "companyHandle",
    c.name AS "companyName"
    FROM jobs j
    LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    const {title, minSalary, hasEquity } = filteredData;
    const whereQuery = [];
    const queryValues = [];

    

    if (title !==undefined){
      queryValues.push(`%${title}%`);
      whereQuery.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !==undefined){
      queryValues.push(minSalary);
      whereQuery.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity){
      whereQuery.push(`equity > 0`);
    }
    if(whereQuery.length > 0){
      query += " WHERE " + whereQuery.join(" AND ");
    }
    query += " ORDER BY title";
    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }
  
  /** Given a job id, return data about job.
   *
   * Returns {id, title, salary, equity, company_handle, companies }
   *   where company is [{ handle, name, description, numEmployees, logoUrl, jobs }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
                FROM jobs
           WHERE id = $1`,
        [id]);
    console.log(jobRes);
    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
    const companyRes = await db.query(
        `SELECT handle, name, description, 
        num_employees AS "numEmployees",
        logo_url AS "logoUrl"
        FROM companies 
        WHERE handle = $1`, [job.companyHandle]
    );
    job.company = companyRes.rows[0];

    return job;
  }



  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

    static async remove(id) {
        const result = await db.query(
              `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No company: ${id}`);
    }
}
    


module.exports = Job