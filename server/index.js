const express = require("express");
const consola = require("consola");
const { Nuxt, Builder } = require("nuxt");
const data = require("./wordsPosition");
const pinyin = require("pinyin");
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let currData = data.DATA;
let wordData;

// Import and Set Nuxt.js options
let config = require("../nuxt.config.js");
config.dev = !(process.env.NODE_ENV === "production");

app.get("/api/getposition", (req, res) => {
  const zh = req.query.q || "";
  const pys = pinyin(zh);
  const list = pys.map(p => wordData[p[0]]);
  res.send(list);
});

app.get("/api/getcurrdata", (req, res) => {
  res.send(currData);
});

// we won't do this after all data collected
app.post("/api/update", (req, res) => {
  const data = req.body.data;
  currData = data;
  wordData = parseWordPositionData();
  res.send(currData);
});

async function start() {
  wordData = parseWordPositionData();

  // Init Nuxt.js
  const nuxt = new Nuxt(config);

  const { host, port } = nuxt.options.server;

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  } else {
    await nuxt.ready();
  }

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  });
}

function parseWordPositionData() {
  const resultDict = {};
  // Load data for word position
  try {
    const list = currData;
    list.split(",").forEach(word => {
      try {
        const ws = word.split("=");
        const zh = ws[0];
        const tStr = ws[1];
        const tss = tStr.split(":");
        const minute = parseInt(tss[0]);
        const seconds = parseFloat(tss[1]);
        const tSec = minute * 60 + seconds;
        const py = pinyin(zh)[0][0];
        resultDict[py] = tSec;
      } catch (e) {
        // ignore
      }
    });
  } catch (e) {
    consola.warn(e);
  }
  return resultDict;
}

start();
