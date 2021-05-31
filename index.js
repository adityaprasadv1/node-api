const express = require('express')
const port = process.env.PORT;
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