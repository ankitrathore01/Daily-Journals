//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate');

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// ////////////
 
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
//////////////////////////
const uri = process.env.MONGO_URI;
mongoose.connect("mongodb+srv://admin-ankit:"password"@cluster0.8omox.mongodb.net/blogDB", {useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true});
//////////user schema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
//////user schema end




const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

////////GOOGLE STRATEGEY and FACEBOOK STARATEGY////////////////////////

passport.use(new GoogleStrategy({
  clientID: "887677183146-1hbpqmq73mrrmiv7jedc5mnkmui10t76.apps.googleusercontent.com",
  clientSecret: "ReUp2hoN1qFHf31tc-oWcKIh",
  callbackURL: "http://localhost:3000/auth/google/compose",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);

  User.findOrCreate({ googleId: profile.id }, function (err, user) {
     return cb(err, user);
  });
}
));
////////////////////////end

////////////new route
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
); 

app.get("/auth/google/compose",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/");
  });
//////////new route end

app.get("/login", function(req, res){
  res.render("login");
});



app.get("/register", function(req, res){
  res.render("register");
});




app.get("/", function(req, res){
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });

});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});




///////////////end of the above



app.get("/compose", function(req, res){
  if (req.isAuthenticated()){
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function(req, res){

  const post = new Post ({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  post.save(function(err){
    if(!err)
    {
      res.redirect("/");
    }
  });

});
// app.post("/compose", function(req, res){
//   const submittedSecret = req.body.home;
// //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
//   // console.log(req.user.id);

//   User.findById(req.user.id, function(err, foundUser){
//     if (err) {
//       console.log(err);
//     } else {
//       if (foundUser) {
//         foundUser.secret = submittedSecret;
//         foundUser.save(function(){
//           res.redirect("/");
//         });
//       }
//     }
//   });
// });

app.get("/posts/:postId", function(req, res){

  const reqpostid = req.params.postId;
  Post.findOne({_id:reqpostid},function(err,post){
    if(!err)
    {
      res.render("post",{
        title:post.title,
        content: post.content
      });
    }
  });
});

app.get("/posts/:postName", function(req, res){
  const requestedTitle = _.lowerCase(req.params.postName);

  posts.forEach(function(post){
    const storedTitle = _.lowerCase(post.title);

    if (storedTitle === requestedTitle) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    }
  });

});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      res.redirect("/register");
      // console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server started on port 3000");
});






