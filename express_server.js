// express_server.js

const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const PORT = 8080;
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());



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
    password: "test1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "test2"
  }
};



const urlsForUser = function(id) {
  let userURL = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURL[key] = urlDatabase[key];
    }
  }
  return userURL;
};

const isUserEmailInDatabase = function(userEmail) {
  for (const key in users) {
    if (users[key].email === userEmail) {
      return users[key];
    }
  }
  return false;
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
  if (users[req.cookies.user_id]) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});

// user logout page
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// user login page
app.get("/login", (req, res) => {
  if (users[req.cookies.user_id]) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_login", templateVars);
});
app.post('/login', (req, res) => {
  // check if the user doesn't exist in the datbase
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot Leave Email and Password Empty`);
  }
  
  let userData = isUserEmailInDatabase(req.body.email);
  if (userData === false) {
    return res.status(403).send(`User Does Not Exist in Database`);
  }

  // check if the password matches with the one stored in the datbase
  if (userData.password !== req.body.password) {
    return res.status(403).send(`Incorrect Password`);
  }
  
  //set the appropriate cookie
  res.cookie('user_id', userData.id);
  res.redirect('/urls');
});

// user registration page
app.get('/register', (req,res) => {
  if (users[req.cookies.user_id]) {
    res.redirect('/urls');
    return;
  }
  const templateVars = {user: users[req.cookies.user_id]};
  res.render('urls_register', templateVars);
});
app.post('/register', (req,res)=>{
  // bad input check
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot Leave Email and Password Empty`);
  }
  
  // user already exists in datbase
  if (isUserEmailInDatabase(req.body.email) !== false) {
    return res.status(400).send(`User Already Exists in Database`);
  }
  
  // setup new user
  let newUserRandomID = generateRandomString();
  users[newUserRandomID] = {
    id: newUserRandomID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', newUserRandomID);
  res.redirect('/urls');
});

// create a new shortened url web form
app.get('/urls/new', (req,res) => {
  if (!users[req.cookies.user_id]) {
    res.redirect('/login');
    return;
  }
  
  const templateVars = {user: users[req.cookies.user_id]};
  res.render('urls_new', templateVars);
});

// show the list of urls that is stored
app.get("/urls", (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.status(401).send('Please Login or Register');
    return;
  }

  let usersURL = urlsForUser(req.cookies.user_id);
  const templateVars = { urls: usersURL, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});
// add new url to the database
app.post('/urls', (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Unable to create shortURLs. Please Login');
  }
  
  if (!req.body.longURL) {
    return res.status(400).send('Invalid URL');
  }

  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  };
  res.redirect(`/urls/${newShortURL}`);
});

// delete the url
app.post('/urls/:shortURL/delete', (req, res)=> {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Unable to Delete shortURLs');
  }
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    return res.status(403).send('Unable to Delete Another Users shortURLs');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// edit the url
app.post('/urls/:shortURL', (req, res)=> {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Unable to Edit shortURLs');
  }
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    return res.status(403).send('Unable to Edit Another Users shortURLs');
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  // res.redirect(`/urls/${req.params.shortURL}`);
  res.redirect(`/urls`);
});

// showing the user their newly created link
app.get("/urls/:shortURL", (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Please Login');
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send(`Provided shortURL [${req.params.shortURL}] not found in database`);
  }
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    return res.status(403).send('Forbidden');
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

// redirect to the new web form
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send(`Provided shortURL [${req.params.shortURL}] not found in database`);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("*", (req, res) => {
  return res.status(404).send(`Not Found`);
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});