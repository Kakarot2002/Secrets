//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(express.static("public"));


app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id,function(err, user){
        done(err, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res) =>{
    res.render("home");
});


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get("/login", (req, res) =>{
    res.render("login");
});

app.get("/register", (req, res) =>{
    res.render("register");
});

app.get("/secrets", (req, res) =>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.render("/login");
    }
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

})

app.get("/logout", (req, res) =>{
    req.logOut();
    res.redirect("/");
});

app.post("/register", (req, res) =>{

    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res, ()=> {
                res.redirect("/secrets");
            });
            
        }
    })

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     })
    
    //     newUser.save()
    //     .then(()=>{
    //         res.render("secrets");
    //     })
    //     .catch((err)=>{
    //         console.log(err);
    //     })
    // });
    

});

app.post("/login", (req, res) =>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
            
        }
    })
    // const username = req.body.username;
    // const password = req.body.password;


    // User.findOne({email:username})
    // .then((foundUser)=>{
    //     bcrypt.compare(password, foundUser.password, function(err, result) {
    //         if(result === true){
    //             res.render("secrets");
    //         }
    //     });
    // })
    // .catch((err)=>{
    //     console.log(err);
    // })

});





app.listen(5000, () =>{
    console.log("Server started on port 5000");
})