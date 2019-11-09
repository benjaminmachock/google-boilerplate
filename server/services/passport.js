const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const keys = require("../config/keys");

//fetch out of mongoose. 1 argument means we are trying to fetch, 2 arguments means we are trying to load something into mongoose
//this user object is our model class
const User = mongoose.model("users");

//user is what we get out of the database, take that model and generate a piece of identifying information from it and return from this function and will be used by passport to set up cookie for us.
passport.serializeUser((user, done) => {
  //done is a callback that we have to call after we have done some work to nudge passport along. 1st arg is an error object, we say null. 2nd arg is the identifying piece of information that identifies user in follow up requests. this id is not the profile id. this is the id in mongo db. this is what we use in the cookie. we can assume every user will have an id assigned by Mongo.
  done(null, user.id);
});

//take the id we stuffed into cookie and turn it into a user model instance. 1st arg is the exact token we stuck in the cookie. user model instance added to req object as req.user
passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  });
});

//inside of function call new GoogleStrategy creates a new instance of the Google passport strategy, app needs to authenticate my users with Google, inside of this constructor we are going to pass in some configuration that tells this google strategy how to authenticate our users inside of application. passport.use. passport knows how to handle authentication in general, will be aware there is a new strategy available and will use it.  have to give the strategy a client id and a client secret, provided to us directly from google OAuth service. we need to sign up with GoogleOauth api. 1st argument to google strategy is our keys object.  pass those keys. the callbackURL property will be where the user is sent after granting permissions. 2nd argument to googleStrategy pass an arrow function
passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientId,
      clientSecret: keys.googleClientSecret,
      callbackURL: "/auth/google/callback"
    },
    //opportunity to take identifying information and save it to our database
    //if we had asked for permission to read users contact list, or read emails, that is the purpose of the access token. refresh token would allow us to refresh the access token, done is a function when we call it tells passport we are done proceed with the authentication flow
    (accessToken, refreshToken, profile, done) => {
      //in callback function we are going to use model class to create a new instance of a user and pass in object with all the properties that this user will have. profile.id is the id coming from the users google profile. to get the model instance saved to the database we have to call the method .save(). this will automatically take this model instance and save it to the database.
      //look in users collection find the first record inside the collection with a google id of profile id. this will initiate a query. we are initiating an async action, the query returns a promise. chain on a .then and we will add arrow function, and the arrow function will be called with whatever user was found if one exists
      User.findOne({ googleId: profile.id }).then(existingUser => {
        if (existingUser) {
          //we already have a record with the given profile id. pass 2 args to done, 1st is null there is no error here, 2nd arg is the user record, this tells passport here is the user we found, we are finished
          done(null, existingUser);
        } else {
          //we don't have a user record with this ID, make a new record. this creates a new model instance, we then save that instance and in the callback we get another model instance, both represent the same record inside of our collection, by convention we always make use of the one provided to us inside of the promise callback
          new User({
            googleId: profile.id
          })
            //we don't want to call done until we know for a fact that a user has been saved to database
            .save()
            //this .then will be called with the user that has just been saved
            .then(user => done(null, user));
        }
      });

      // console.log("access token", accessToken);
      // console.log("refresh token", refreshToken);
      // console.log("profile", profile);
    }
  )
);
