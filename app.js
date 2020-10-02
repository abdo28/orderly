var express = require("express");
var bodyParser  = require("body-parser");
var mongoose = require("mongoose");

app = express();

// local mongod
mongoose.connect("mongodb://127.0.0.1:27017/orderly_v1" );
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));


var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String
 });

 var Campground = mongoose.model("Campground", campgroundSchema);
 
Campground.create(
     {
         name: "سارة خليل", 
         image: "رأس الجورة ",
         description: "5 أصفر 6 أحمر "
         
     },
     function(err, campground){
      if(err){
          console.log(err);
      } else {
          console.log("NEWLY CREATED CAMPGROUND: ");
          console.log(campground);
      }
    });

app.get("/", function(req,res){
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
           res.render("index",{campgrounds:allCampgrounds});
        }
     });
}); 




/*const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});
*/
app.listen(3000, '127.0.0.1', () => {
  console.log(`Server running at http://${'127.0.0.1'}:${3000}/`);
});