// express_server.js

const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());



// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com/"
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
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
  res.render("login", templateVars);
});
app.post('/login', (req, res) => {
  // check if the user doesn't exist in the datbase
  let userData = isUserEmailInDatabase(req.body.email);
  if (userData === false) {
    res.statusCode = 403;
    res.statusMessage = 'Forbidden';
    return res.send(`User Does Not Exist in Database`);
  }

  // check if the password matches with the one stored in the datbase
  if (userData.password !== req.body.password) {
    res.statusCode = 403;
    res.statusMessage = 'Forbidden';
    return res.send(`Incorrect Password`);
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
  res.render('register', templateVars);
});
app.post('/register', (req,res)=>{
  // bad input check
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.statusMessage = 'Bad Request';
    return res.send(`Cannot Leave Email and Password Empty`);
  }
  
  // user already exists in datbase
  if (isUserEmailInDatabase(req.body.email) !== false) {
    res.statusCode = 400;
    res.statusMessage = 'Bad Request';
    return res.send(`User Already Exists in Database`);
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
    res.redirect('/login');
    return;
  }
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});
// add new url to the database
app.post('/urls', (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.redirect('/login');
    return;
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
    res.redirect('/login');
    return;
  }
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    res.redirect('/login');
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// edit the url
app.post('/urls/:shortURL', (req, res)=> {
  if (!users[req.cookies.user_id]) {
    res.redirect('/login');
    return;
  }
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    res.redirect('/login');
    return;
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// showing the user their newly created link
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.send(`Provided shortURL [${req.params.shortURL}] not found in database`);
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
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.send(`Provided shortURL [${req.params.shortURL}] not found in database`);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});







app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});