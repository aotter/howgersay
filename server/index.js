const express = require("express");
const consola = require("consola");
const { Nuxt, Builder } = require("nuxt");
const data = require("./wordsPosition");
const pinyin = require("pinyin");

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const getStream = require("get-stream");

const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let wordData = data.DATA;
let wordData_csv = {};

// Import and Set Nuxt.js options
let config = require("../nuxt.config.js");
config.dev = !(process.env.NODE_ENV === "production");

// app.get("/api/getposition", (req, res) => {
//   const zh = req.query.q || "";
//   const pys = pinyin(zh);
//   const list = pys.map(p => {
//     const pinyin = p[0];
//     return { pinyin, startSec: wordData[pinyin], duration: 0.8 };
//   });
//   res.send(list);
// });

app.get("/api/getposition", (req, res) => {
  const zh = req.query.q || "";
  const pys = pinyin(zh, { style: pinyin.STYLE_TONE2 });
  const list = pys.map(p => {
    const pinyin = p[0];
    return { pinyin, startSec: wordData_csv[pinyin], duration: 0.8 };
  });
  res.send(list);
});

app.get("/api/getcurrdata", (req, res) => {
  res.send({ wordData });
});

// we won't do this after all data collected
app.post("/api/update", (req, res) => {
  const { pinyin, startSec, duration } = req.body;
  wordData[pinyin] = startSec;
  res.send({ wordData });
});

async function start() {
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

  await loadWordPositionDataFromCsv();

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  });
}

const readCSVData = async filePath =>
  await getStream.array(
    fs
      .createReadStream(
        path.join(__dirname, ".", "HowHow 發音標註眾包 - 發音表.csv")
      )
      .pipe(parse({ delimiter: "," }))
  );
async function loadWordPositionDataFromCsv() {
  for (let [pinyin, startTime, endTime] of await readCSVData(
    "HowHow 發音標註眾包 - 發音表.csv"
  )) {
    wordData_csv[pinyin] = startTime;
    //console.log(pinyin, startTime, endTime);
  }
}

start();
