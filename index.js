const express = require("express");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");

const port = process.env.PORT;
const env = process.env.SERVER_ENV;
const issuerBaseUrl = process.env.ISSUER_BASE_URL;

const authorizeAccessToken = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${issuerBaseUrl}/.well-known/jwks.json`,
  }),
  audience: "node-api",
  issuer: `${issuerBaseUrl}/`,
  algorithms: ["RS256"],
});

const app = express();

app.use(helmet());

// Public API
app.get("/", (req, res) => {
  res.send({
    version: "0.0.1",
    message: "Hello Client, Server here!",
  });
});

app.listen(port, () => {
  console.log(`Listening at ${port} in ${env}`);
});
