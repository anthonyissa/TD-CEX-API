const { default: axios } = require("axios");
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

const baseUrl = "https://api.binance.com";

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
