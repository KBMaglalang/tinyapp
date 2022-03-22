// express_server.js

const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

app.get('/', (req, res) => {
  res.send("Hello");
});

// app.get("/hello", (req, res) => {
//   const templateVars = { greeting: '' };
//   res.render("hello_world", templateVars);
// });

app.get("/urls", (req, res) => {
  // res.send('url');
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send("ok");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req,res) => {
  res.render('urls_new');
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});