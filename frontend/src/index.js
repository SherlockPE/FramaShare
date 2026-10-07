import { Pool } from 'pg'


async function TestDB() {
  const pool = new Pool({
    user: 'dbuser',
    password: 'secretpassword',
    host: 'database.server.com',
    port: 3211,
    database: 'mydb',
  })
  console.log(await pool.query('SELECT NOW()'))
  try {
    const res = await pool.query('SELECT $1::text as message', ['Hello world!'])
    console.log(res.rows[0].message) // Hello world!
    try {
      const client = await pool.connect()
      await client.query('BEGIN')
      const queryText = 'INSERT INTO users(name, email) VALUES($1,$2) RETURNING id'
      const res = await client.query(queryText, ['brianc', 'test@email.com'])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (err) {
    console.error(err)
  } finally {
    await pool.end()
  }
}

async function createUser(name, email) {
  const res = await pool.query(
    'INSERT INTO users(name, email) VALUES($1,$2) RETURNING id',
    [name, email]
  );
  return res.rows[0].id;
}

async function readUsers() {
  const res = await pool.query(
    'SELECT * FROM users'
  );
  return res.rows;
}

async function updateUser(id, name) {
  const res = await pool.query(
    "UPDATE users SET name = $1 WHERE $2 RETURNING *",
    [name, id]
  );
  return res.rows[0];
}

async function deleteUser(id) {
  const res = await pool.query(
    'DELETE FROM users where id = $1',
    [name]
  );
  return res.rows[0].id;
}





/*

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({
  host: "postgres",
  database: "cruddb",
  user: "postgres",
  password: "password",
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

// CREATE
app.post("/items", async (req, res) => {
  const { name } = req.body;
  const result = await pool.query("INSERT INTO items (name) VALUES ($1) RETURNING *", [name]);
  res.json(result.rows[0]);
});

// READ
app.get("/items", async (req, res) => {
  const result = await pool.query("SELECT * FROM items");
  res.json(result.rows);
});

// UPDATE
app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const result = await pool.query("UPDATE items SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
  res.json(result.rows[0]);
});

// DELETE
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM items WHERE id = $1", [id]);
  res.json({ message: "Item deleted" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
*/


