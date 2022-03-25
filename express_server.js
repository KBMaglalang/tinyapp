// express_server.js

// modules used in project
const {urlsForUser, getUserByEmail, generateRandomString} = require('./helper');
const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const PORT = 8080;
const app = express();

/*****************************
 *
 *         MIDDLEWARE
 *
******************************/

app.use(morgan('dev'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['LHL', 'Cat', 'Dog'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

/*****************************
 *
 *    DATABASE INFORMATION
 *
******************************/

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
  },
  asdfqw: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("test1")
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("test2")
  }
};

/*****************************
 *
 *        SERVER ROUTES
 *
******************************/

// root route
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});

// logout the user
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// show user login page
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user };
  res.render("urls_login", templateVars);
});

// login an existing user to the serveice
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if the user doesn't exist in the datbase
  if (!email || !password) {
    return res.status(400).send(`Cannot Leave Email and Password Empty. Please <a href="/login">Login</a>`);
  }
  
  // const userData = isUserEmailInDatabase(email);
  const userData = getUserByEmail(email, users);
  if (!userData) {
    return res.status(400).send(`The username or password is incorrect. Please <a href="/login">Login</a>`);
  }

  // check if the password matches with the one stored in the datbase
  bcrypt.compare(password, userData.password, (err, result) => {
    if (!result) {
      return res.status(400).send(`The username or password is incorrect. Please <a href="/login">Login</a>`);
    }
    req.session.user_id = userData.id;
    res.redirect('/urls');
  });
});

// show user registration page
app.get('/register', (req,res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const user = users[req.session.user_id];
  const templateVars = { user };
  res.render('urls_register', templateVars);
});

// register new user into user database
app.post('/register', (req,res)=>{
  // bad input check
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot Leave Email and Password Empty. Please <a href="/register">Register</a>`);
  }
  // user already exists in datbase
  if (getUserByEmail(req.body.email, users) !== undefined) {
    return res.status(400).send(`User Already Exists in Database. Please <a href="/register">Register</a>`);
  }
  // setup new user
  const newUserRandomID = generateRandomString();
  users[newUserRandomID] = {
    id: newUserRandomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = newUserRandomID;
  res.redirect('/urls');
});

// create a new shortened url web form
app.get('/urls/new', (req,res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  
  const user = users[req.session.user_id];
  const templateVars = { user };
  res.render('urls_new', templateVars);
});

// show the list of urls that is stored
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send('Please <a href="/login">Login</a> or <a href="/register">Register</a>');
    return;
  }
  const user = users[req.session.user_id];
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

// add new url to the database
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(400).send('Unable to create shortURLs. Please <a href="/login">Login</a>');
  }
  if (!longURL) {
    return res.status(406).send('Invalid URL');
  }
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL , userID };
  res.redirect(`/urls/${newShortURL}`);
});

// delete the url
app.post('/urls/:shortURL/delete', (req, res)=> {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status(400).send('Unable to Delete shortURLs. Please <a href="/login">Login</a>');
  }
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.status(403).send('Unable to Delete Another Users shortURLs');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// edit the url
app.post('/urls/:shortURL', (req, res)=> {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status(400).send('Unable to Edit shortURLs. Please <a href="/login">Login</a>');
  }
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.status(403).send('Unable to Edit Another Users shortURLs');
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

// showing the user their newly created link
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (!req.session.user_id) {
    return res.status(400).send('Please <a href="/login">Login</a>');
  }
  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`Provided shortURL [${shortURL}] not found in database`);
  }
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.status(403).send('Unable to See Another Users shortURLs');
  }
  const longURL = urlDatabase[shortURL].longURL;
  const user = users[req.session.user_id];
  const templateVars = {shortURL, longURL, user};
  res.render("urls_show", templateVars);
});

// redirect to the new web form
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`Provided shortURL [${shortURL}] not found in database`);
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});



// setup server to list on PORT
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});