const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const jwtAuthz = require("express-jwt-authz");
const axios = require("axios");
const cheerio = require("cheerio");

const port = process.env.PORT;
const env = process.env.SERVER_ENV;
const issuerBaseUrl = process.env.ISSUER_BASE_URL;
const QuoteBaseUrl = process.env.QUOTE_BASE_URL;
const QuoteSelector = process.env.QUOTE_SELECTOR;

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

const options = { customScopeKey: "permissions" };
const authorizePermission = jwtAuthz(["api:admin"], options);

const schema = buildSchema(`
  type Query {
    version: String
  }
`);

const resolvers = {
  version: () => "0.0.1",
};

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",
        "'sha256-dPTixT5RV0MaHwkHXbrPucUY5LMChKMmDlpH1RL8SoA='",
        "'sha256-hQ+Q7rQmBisyaau7M1CHR11Q413kMUpYoTSVdXlgzLM='",
        "'sha256-HlNgqwkvTNoQqMCFRai8lszKmMjDG8gk5MsvxMrSrPs='",
        "'sha256-g+UP/vt9mFqolp4Cub83kTo3tCFSrr4HGdkDDILeKlU='",
        "'sha256-K/P4vySSqAL7Jr8YdHhzMcc45ilQnfENZTH5hN+mrI4='",
        "'sha256-yl6bksMOnBDEarIhlOKXAsJ4uKcIsFCIF9/B1d2eijs='",
        "http://localhost:5000/unfetch.umd.js.map",
      ],
      styleSrc: [
        "'sha256-V0UyiQHqFDE5wbdbh2pF2po6spi3uBNG0LVgNav5Cb8='",
        "'sha256-EbykEYX2PKg+68rjjcGnQneocvc1RKr7BGbi1DExwzo='",
      ],
    },
  })
);
app.use(cors());

// GraphQL API
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true,
  })
);

// Public API
app.get("/", (req, res) => {
  res.send({
    version: "0.0.1",
    message: `Hello Client, Server here from ${env}!`,
  });
});

// Public API
app.get("/quote", (req, res) => {
  // date=september-21-2021
  const date = req.query.date;
  const url = QuoteBaseUrl + `/${date}`;
  const datePattern =
    /^((january|february|march|april|may|june|july|august|september|october|november|december)-(0[1-9]|[12]\d|3[01])-[12]\d{3})$/;

  if (datePattern.test(date)) {
    axios(url)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        const quote = $(QuoteSelector).html().trim();
        return res.status(200).json({
          date,
          quote,
        });
      })
      .catch((error) =>
        res.status(500).json({
          message: error,
        })
      );
  } else {
    return res.status(400).json({
      message: "date parameter not valid! Example: date?=september-21-2021",
    });
  }
});

// Protected API
app.get("/protected", authorizeAccessToken, (req, res) => {
  res.send({
    message: "Protected api, authorized only!",
  });
});

// Protected API with Permissions
app.get(
  "/moreprotected",
  authorizeAccessToken,
  authorizePermission,
  (req, res) => {
    res.send({
      message: "Protected api, authorized and has permissions!",
    });
  }
);

app.listen(port, () => {
  console.log(`Listening at ${port} in ${env}`);
});
