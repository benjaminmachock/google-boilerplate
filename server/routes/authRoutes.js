const passport = require("passport");
//2nd argument is code to be executed whenever a request comes into this route. kick the user into OAuth flow which is being managed by passport. google strategy has code in it that knows a strategy called string google, when passport loads, if anyone attempts to authenticate and with string google, use this strategy. this is how passport knows to go find the strategy. 2nd argument is an options object and we passed in scope. the scope specifies to google what access we want to have inside of the users profile. the 2 strings passed in are not made up.

//exporting a function from this file, we will call this function with our express app object
module.exports = app => {
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"]
    })
  );

  //handles the case where user visits auth/google/callback. turn the code into an actual profile. exchange the code for the user profile
  app.get("/auth/google/callback", passport.authenticate("google"));

  //takes the cookie, and it kills the id in there. req.user is destroyed by passport
  app.get("/api/logout", (req, res) => {
    req.logout();
    res.send(req.user);
  });

  //req represents incoming request, res represents outgoing response
  app.get("/api/current_user", (req, res) => {
    res.send(req.user);
  });
};
