const express = require("express");
const consola = require("consola");
const { Nuxt, Builder } = require("nuxt");
const data = require("./wordsPosition");
const pinyin = require("pinyin");
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const sampleData =
  "八=1:11.4,拔=1:12,把=1:13,爸=1:14,播=1:15.8,博=1:16.5,跛=1:17.5,擘=1:18.3";
let wordData = data.DATA;

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
  res.send({ sampleData, wordData });
});

// we won't do this after all data collected
app.post("/api/update", (req, res) => {
  const data = req.body.data;
  const tempData = data;
  parseWordPositionData(tempData);
  res.send({ wordData });
});

async function start() {
  //parseWordPositionData(currData);

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

function parseWordPositionData(data) {
  //const resultDict = {};
  // Load data for word position
  try {
    const list = data;
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
        wordData[py] = tSec;
        //resultDict[py] = tSec;
      } catch (e) {
        // ignore
      }
    });
  } catch (e) {
    consola.warn(e);
  }
  //return resultDict;
}

start();
