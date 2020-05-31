const express = require("express");
const consola = require("consola");
const { Nuxt, Builder } = require("nuxt");
const data = require("./wordsPosition");
const pinyin = require("pinyin");
const app = express();

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
    const list = data.DATA;
    list.split(",").forEach(word => {
      const ws = word.split("=");
      const zh = ws[0];
      const tStr = ws[1];
      const tss = tStr.split(":");
      const minute = parseInt(tss[0]);
      const seconds = parseFloat(tss[1]);
      const tSec = minute * 60 + seconds;
      const py = pinyin(zh)[0][0];
      resultDict[py] = tSec;
      consola.info("load data: ", zh, py, tSec);
    });
  } catch (e) {
    consola.warn(e);
  }
  return resultDict;
}

start();
