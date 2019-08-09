const express = require("express");
const morgan = require("morgan");

const app = express();

app.use(morgan("tiny"));

const staticDir = process.argv.length === 3 ? "publicMt" : "public";

app.use(express.static(staticDir));

const port = process.env.PORT || 8080;
app.listen(port, () =>
  console.log(`Serving data on port ${port} from directory ${staticDir}.`)
);
