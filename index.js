const { default: axios } = require("axios");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

app.use(express.json());

const baseUrl = "https://api.binance.com";

const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run(`CREATE TABLE candles (
    Id INTEGER PRIMARY KEY,
    date INT, high REAL, low REAL, open REAL, close REAL, volume REAL)`);

  db.run(`CREATE TABLE full_data (
    Id INTEGER PRIMARY KEY,
    uuid TEXT, traded_crypto REAL, price REAL,
    created_at_int INT, side TEXT)`);

  db.run(`CREATE TABLE last_checks (
    Id INTEGER PRIMARY KEY,
    exchange TEXT, trading_pair TEXT, duration TEXT,
    table_name TEXT, last_check INT, startdate INT, last_id INT)`);
});

const updateCandleData = (data) => {
  const stmt =
    db.prepare(`INSERT INTO candles (date, high, low, open, close, volume)
                           VALUES (?, ?, ?, ?, ?, ?)`);
  data.forEach((candle) => {
    stmt.run(candle[0], candle[2], candle[3], candle[1], candle[4], candle[5]);
  });
  stmt.finalize();
};

const storeTradeData = (data) => {
  const stmt =
    db.prepare(`INSERT INTO full_data (uuid, traded_crypto, price, created_at_int, side)
                           VALUES (?, ?, ?, ?, ?)`);
  data.forEach((trade) => {
    stmt.run(
      trade.uuid,
      trade.traded_crypto,
      trade.price,
      trade.created_at_int,
      trade.side
    );
  });
  stmt.finalize();
};

const updateLastCheck = (
  exchange,
  tradingPair,
  duration,
  tableName,
  lastCheck,
  startDate,
  lastId
) => {
  db.run(
    `INSERT INTO last_checks (exchange, trading_pair, duration, table_name, last_check, startdate, last_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    exchange,
    tradingPair,
    duration,
    tableName,
    lastCheck,
    startDate,
    lastId
  );
};

app.get("/tickers", async (req, res) => {
  try {
    const url = `${baseUrl}/api/v3/ticker/24hr`;
    const response = await axios.get(url);
    const tickers = [];
    response.data.forEach((ticker) => {
      tickers.push(ticker.symbol);
    });
    res.send(tickers);
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.get("/depth", async (req, res) => {
  try {
    const { direction, symbol } = req.query;
    const url = `${baseUrl}/api/v3/depth?symbol=${symbol}&limit=1`;
    const response = await axios.get(url);
    if (direction === "bid") {
      res.send(response.data.bids[0][0]);
    } else if (direction === "ask") {
      res.send(response.data.asks[0][0]);
    } else {
      res.status(400).send("Bad Request");
    }
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.get("/orderbook", async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = `${baseUrl}/api/v3/depth?symbol=${symbol}&limit=1000`;
    const response = await axios.get(url);
    res.send(response.data);
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.get("/candles", async (req, res) => {
  try {
    const { symbol, duration } = req.query;
    const startTime = Date.now() - duration * 60 * 1000;
    const endTime = Date.now();
    const url = `${baseUrl}/api/v3/uiKlines?symbol=${symbol}&interval=1m&startTime=${startTime}&endTime=${endTime}`;
    const response = await axios.get(url);

    updateCandleData(response.data);

    updateLastCheck(
      "Binance",
      symbol,
      duration,
      "candles",
      Date.now(),
      startTime,
      null
    );

    res.send(response.data);
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.get("/trades", async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = `${baseUrl}/api/v3/trades?symbol=${symbol}`;
    const response = await axios.get(url);

    storeTradeData(response.data);

    res.send(response.data);
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.post("/order/create", async (req, res) => {
  try {
    const { symbol, side, type, quantity } = req.body;
    const url = `${baseUrl}/api/v3/order/test?symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}`;
    const response = await axios.post(url);
    res.send(response.data);
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.post("/order/cancel", async (req, res) => {
  try {
    const { symbol, orderId } = req.body;
    const url = `${baseUrl}/api/v3/order?symbol=${symbol}&orderId=${orderId}`;
    const response = await axios.delete(url);
    res.send(response.data);
  } catch (error) {
    res.status(400).send(error.response.data);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
