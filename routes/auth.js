var express = require("express");
var router  = express.Router();
var passport  = require("passport");
var User = require("../models/user");
var catchAsync = require("../utils/catchAsync");

router.get("/register",function(req,res){
    res.render("register");
 });
  
router.post("/register",catchAsync(async function(req, res, next){
    try{
      var {email, username, password} = req.body;
      var user = new User({email, username});
      var rUser = await User.register(user, password);
      req.login(rUser, function(err){
        if(err) return next(err);
        console.log(rUser);
        res.redirect("/purchase");
      });
    } catch(e){
      console.log(e);
      res.redirect("/register");
    }  
}));
  
router.get("/login", function(req, res){
    res.render('login');
});
  
router.post("/login", passport.authenticate('local', {failureRedirect: '/login' }), function(req, res){
    res.redirect("/purchase");
});
  
router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});
  

module.exports = router;