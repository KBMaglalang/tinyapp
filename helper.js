// Gather URLs that belongs to a user
const urlsForUser = function(id, urlDatabase) {
  const userURL = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURL[key] = urlDatabase[key];
    }
  }
  return userURL;
};

// Check if a user is exists in the database from their email
const getUserByEmail = function(email, database) {
  const values = Object.values(database);
  for (const user of values) {
    if (user.email === email) {
      return user;
    }
  }
};

//  Generate a string of 6 random characters
const generateRandomString = function() {
  return Math.random().toString(32).substring(2,8);
};

module.exports = {
  urlsForUser,
  getUserByEmail,
  generateRandomString
};