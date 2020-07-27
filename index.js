
//in future write a funtion for retriving sockid by paisng a user name to reduce code
app = require("express");
server = app();


session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true
});
server.use(session);                             //ses for managing users

sharedsession = require("express-socket.io-session");
var ser = server.listen(5000)
io = require('socket.io').listen(ser);
io.use(sharedsession(session));

require("ejs");
//Set View Engine To EJS
server.set("view engine", "ejs");
//Set Static Directory
server.use(app.static(__dirname + '/views'));
const bodyParser = require('body-parser');
server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json());
var db
var socid
var io

MongoClient = require('mongodb').MongoClient

MongoClient.connect("mongodb://localhost:27017/", function (err, database) {
  db = database.db("videochat");
});



io.on("connection", socket => {

  socid = socket.id
  console.log("socket hai bhai", socket.handshake.session.uname)
  socket.emit("connected", socid)

  if (socket.handshake.session.uname != undefined)
    db.collection("users").update({ "username": socket.handshake.session.uname }, { $set: { 'sockid': socid } })

  socket.on("isclientonline", towhomcall => {
    console.log(socket.handshake.session.sestowhomcall)
    console.log("to call", towhomcall)
    db.collection("users").find({ username: towhomcall }, { fields: { _id: 0, sockid: 1 } }).toArray(function (err, result) {
      console.log("sock id of", towhomcall, result[0]["sockid"])
      sockidoftowhomcall = result[0]["sockid"]


      if (io.sockets.sockets[sockidoftowhomcall] != undefined) {
        console.log("client is online",sockidoftowhomcall)       //request call   from one client to another
        socket.handshake.session.sestowhomcall = towhomcall
        socket.to(sockidoftowhomcall).emit("requestcall", socket.handshake.session.uname)
      }                                   //before calling check if client is offline
      else {
        console.log("adf")
        console.log(socket.id)
        socket.to(socket.id).emit("clientoffline")         //send msg to front end that client is offline 
      }
    })
  })

  socket.on("callaccepted",  (whoiscalling)=> {  
    //yaha pe security dalna hai ke inspect element me ja ke user ne change kar diya
    ///jis ne call kiya us ko responce bhej raha ho ke accept kar liya mai ne
      db.collection("users").find({ username: whoiscalling }, { fields: { _id: 0, sockid: 1 } }).toArray(function (err, result) {
      console.log("same hai accepted")      //if client changed the front end
      sockidoftowhomcall = result[0]["sockid"]
      socket.to(sockidoftowhomcall).emit("callaccepted")
      })
  
  })
  socket.on("callrejected", (whoiscalling) => { ///jis ne call kiya us ko responce bhej raha ho ke reject kar diya mai ne
//yaha pe security dana hai
    console.log("call rejected")
    db.collection("users").find({ username: whoiscalling }, { fields: { _id: 0, sockid: 1 } }).toArray(function (err, result) {
      console.log("alag hai",socket.handshake.session.sestowhomcall,whoiscalling)
      sockidoftowhomcall = result[0]["sockid"]
      socket.to(sockidoftowhomcall).emit("callrejected")
      })
    socket.to().emit("callrejected")

  })
  socket.on("peerid",(pid)=>{
    console.log("peer id of initializer",pid)

    socket.broadcast.emit("peerid",pid);

  })

});

server.get('/', (err, res) => {
  res.render('login')
});
server.get('/register', (err, res) => {
  res.render('register')
});

server.post('/onlogin', (req, res) => {
  db.collection("users").find({ "username": req.body.username, "password": req.body.password }, { fields: { _id: 1 } }).toArray(
    function (err, result) {
      if (result.length >= 1) {
        ses = req.session
        ses.uname = req.body.username
        res.redirect("/mainscreen")

      }
      else
        res.redirect('/')
    }

  )



});


server.post('/onregister', (req, res) => {
  db.collection("users").insert({ 'username': req.body.username, 'email': req.body.email, 'password': req.body.password, 'sockid': undefined })
  ses = req.session
  ses.uname = req.body.username
  res.redirect("/mainscreen")
});

server.get("/mainscreen", (req, res) => {

  ses = req.session
  if (ses.uname != undefined) {
    db.collection("users").find({ "username": { $ne: ses.uname } }, { username: 1, password: 0, _id: 0, email: 1 }).toArray(function (err, result) {
      allusers = result
      console.log(ses.uname, allusers)
      res.render('mainscreen', { "users": allusers })
    })
  }
  else
    res.redirect('/')

});

server.post("/oncall",(req,res)=>{   //i will reuse this function form inconming and outgoing call for the client
  console.log("tocall",req.body.tocall)
res.render("oncall",{'tocall':req.body.tocall})

})
