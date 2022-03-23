// express_server.js

const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com/"
};


const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

// root page
app.get('/', (req, res) => {
  res.send("Hello");
});

// return the urls available in the database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// login endpoint
app.post('/login', (req, res) => {
  res.cookie('username', req.body["username"]);
  res.redirect('/urls');
});

// logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// create a new shortened url web form
app.get('/urls/new', (req,res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render('urls_new', templateVars);
});

// show the list of urls that is stored
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// add new url to the database
app.post('/urls', (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// delete the url
app.post('/urls/:shortURL/delete', (req, res)=> {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// edit the url
app.post('/urls/:shortURL', (req, res)=> {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// showing the user their newly created link
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.send(`Provided shortURL [${req.params.shortURL}] not found in database`);
  }
  const templateVars = { shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]  };
  res.render("urls_show", templateVars);
});

// redirect to the new web form
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.send(`Provided shortURL [${req.params.shortURL}] not found in database`);
  }
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});