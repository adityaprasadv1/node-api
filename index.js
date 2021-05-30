const express = require('express')
const dotenv = require('dotenv')
const result = dotenv.config()
if (result.error) {
  throw result.error
}
// console.log(result.parsed)

const port = process.env.SERVER_PORT;
const env = process.env.SERVER_ENV;

const app = express()

app.get('/', (req, res) => {
  res.send({
      version: "0.0.1",
      message: "Hello Client, Server here!"
  })
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port} at ${env}`)
})