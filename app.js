var express        =require('express');
var app            =express();
var bodyParser     =require('body-parser');
var morgan         =require('morgan');
var mongoose       =require('mongoose');
var passport       =require('passport');
var port           =process.env.PORT||3000;
var jwt            =require('jwt-simple'); 
var bcrypt         =require('bcryptjs');
var mime           =require('mime-types');
var session        = require('express-session');
var cookieParser   = require('cookie-parser');
var path           =require('path');
var busboy         =require('connect-busboy');
var multipart      = require('connect-multiparty');
var fs             =require('fs-extra');
var csv            =require('fast-csv');
var json2csv       = require('json2csv');
var config         =require('./config/database');
var User           =require('./app/models/usermodel');
var Lead           =require('./app/models/leadmodel');
var Contact           =require('./app/models/contactmodel');


//get our request parameters
app.use(express.bodyParser());
app.use(bodyParser.urlencoded({extended:false})); 
app.use(bodyParser.json()); 
 
//log to console
app.use(morgan('dev'));
//use the passport package in our app
app.use(passport.initialize());
//demo route(http://localhost:3000)
app.use(express.static(__dirname+ "/public"));
app.use(express.static(__dirname + '/public/file'));

//connect to database
mongoose.connect(config.database);

//pass passport for config
require('./config/passport')(passport);
//bunddle route
var apiRoutes=express(); 
app.use(busboy());
app.use(cookieParser());
app.use(session({ secret: 'thisisthesecretfortoken', saveUninitialized: true,resave: true,  cookie: { secure: true }  })); 
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
 


//New User registration
apiRoutes.post('/register', function(req, res, next) {
 if (!req.body.email || !req.body.password) {
     res.json({success: false, msg: 'Please Enter Email and Password.'});
     } else {
      var newUser=new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password
      });
      newUser.save(function(err, data){
        if(err){
          return res.json(err);
          res.json({success: false, msg: 'Please try again'});
        }
          else{
            console.log(data);
            res.json({success: true, msg: 'Successfully User registered'});
          }
      })
      }     
});

// user login
apiRoutes.put('/login', function(req, res, next){
  User.findOne({email:req.body.email}, function(err, user){
    bcrypt.compare(req.body.password, user.password, function(err, result){
       if(result){
        var token=jwt.encode(user,config.secret); 
        return res.json({success: true, token:token});         
      }else{ 
        return res.json("Incorrect Email and Password");
	 
      }
    })
  })
});
 
 

//user dashboard
  apiRoutes.get('/authentication', function(req, res) {
  var token=getToken(req.headers);  
  if(token){
    var decode=jwt.decode(token, config.secret); 
    User.findOne({_id:decode._id},{password:0}, function(err, user){
      if(err){res.json(err)}
        if(!user){
          return res.send({success:false, msg:'Authentication Failed'})
        }else{
          res.json(user);
        }
    })
  }else{
    return res.json({success:false, msg:'No Token Found'})
  } 
  });

getToken = function (headers) { 
if (headers && headers.authorization) { 
return headers.authorization; 
} else { 
return null; 
} 
};
 

//create Lead
apiRoutes.post('/createlead', function(req, res){  
   var token=getToken(req.headers);
   var owner=jwt.decode(token, config.secret);
              var createLead=new Lead({
                  lead:req.body.lead,
                  salutation:req.body.salutation,
                  fname:req.body.fname,
                  lname:req.body.lname,
                  title:req.body.title,
                  email:req.body.email,
                  mobile:req.body.mobile,
                  rating:req.body.rating,
                  address:req.body.address,
                  city:req.body.city,
                  state:req.body.state,
                  zcode:req.body.zcode,
                  company:req.body.company,
                  industry:req.body.industry,
                  empSize:req.body.empSize,
                  lsource:req.body.lsource,
                   ownerId:owner._id,
                   date:Date.now()
              });
            createLead.save(function(err, data){
              if(err){res.json(err)}
                else{
                  res.json(data);
                  console.log(data);
                }
            });
 
});
apiRoutes.get('/edit-leads/:id', function(req, res){
  Lead.findOne({_id:req.params.id}, function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data);
      }
  })
});
apiRoutes.put('/edit-leads/:id', function(req, res){
  Lead.update({_id:req.params.id},{lead:req.body.lead,
                  salutation:req.body.salutation,
                  fname:req.body.fname,
                  lname:req.body.lname,
                  title:req.body.title,
                  email:req.body.email,
                  mobile:req.body.mobile,
                  rating:req.body.rating,
                  address:req.body.address,
                  city:req.body.city,
                  state:req.body.state,
                  zcode:req.body.zcode,
                  company:req.body.company,
                  industry:req.body.industry,
                  empSize:req.body.empSize,
                  lsource:req.body.lsource}, function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data);
      }
  })
})
/*=================Get Lead===================*/
apiRoutes.get('/getlead', function(req, res){
  var token=getToken(req.headers);
   var owner=jwt.decode(token, config.secret);
  Lead.find({ownerId:owner._id}, function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data);  
      }
      
  });
});
//==================generate report================//
apiRoutes.post('/generatereport', function(req, res){
  var token=getToken(req.headers);
   var owner=jwt.decode(token, config.secret);
   var check= req.body;
   var c=JSON.stringify(check); 
   if((c.length)==2){
          Lead.find({ownerId:owner._id}, function(err, data){
            if(err){res.json(err)}
              else{
                res.json(data);  
                  var fields = ['lead', 'salutation', 'fname','lname','title','email','mobile','rating','address','city','state','zcode','company','industry','empSize','lsource'];
                  var csv = json2csv({ data: data, fields: fields });
                  var path='./public/csv/file'+Date.now()+'.csv'; 
                   fs.writeFile(path, csv, function(err) {
                    if (err) {throw err;}
                    else{ 
                      console.log('file Created');
                    }
                }); 
              }
              
          });
  }else{
  var from =req.body.from; 
  var to =req.body.to; 
 var fr=JSON.stringify(from);
 var too=JSON.stringify(to); 
    Lead.find({ownerId:owner._id,date:{$gte :new Date(fr), $lte:new Date(too)}},function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data); 
          var fields = ['lead', 'salutation', 'fname','lname','title','email','mobile','rating','address','city','state','zcode','company','industry','empSize','lsource'];
                  var csv = json2csv({ data: data, fields: fields });
                  var path='./public/csv/file'+Date.now()+'.csv'; 
                   fs.writeFile(path, csv, function(err) {
                    if (err) {throw err;}
                    else{ 
                      console.log('file Created');
                    }
                });  
      }
      
  });
 
}
});
/*=================Get Lead B/w dates===================*/
apiRoutes.post('/getleaddate', function(req, res){
  var token=getToken(req.headers);
  var owner=jwt.decode(token, config.secret); 
 var from =req.body.from; 
  var to =req.body.to; 
 var fr=JSON.stringify(from);
 var too=JSON.stringify(to); 
    Lead.find({ownerId:owner._id,date:{$gte :new Date(fr), $lte:new Date(too)}},function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data);  
      }
      
  });
});
//=================Delete lead
apiRoutes.delete('/dleads/:id', function(req, res){ 
Lead.remove({_id:req.params.id}, function(err, data){
  if(err){res.json(err)}
    else{
      res.json(data);
    }
})
});
 // upload user profile image
apiRoutes.put('/upload', function(req, res){  
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function(fieldname,file,filename){
    console.log(filename);
    var filePath=path.join(__dirname, './public/file', filename);
    fstream=fs.createWriteStream(filePath);
    file.pipe(fstream);
    fstream.on('close', function(){
      console.log("File Saved...........");
      var token=getToken(req.headers);
   var owner=jwt.decode(token, config.secret);
   console.log(owner._id);
   User.update({_id:owner._id},{images:filename},function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data);
      }

   })
    });
  }); 


});
/*==============Import CSV==============*/
apiRoutes.post('/parsecsv', function(req, res){ 
var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function(fieldname,file,filename){
    console.log(filename);
    var filePath=path.join(__dirname, './public/csv', filename);
    fstream=fs.createWriteStream(filePath);
    file.pipe(fstream);
    fstream.on('close', function(){
      console.log("File Saved...........");
      fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', function(data){
    console.log(data);
    console.log("Now Insert Array data into db.............");
var token=getToken(req.headers);
   var owner=jwt.decode(token, config.secret);
     var createLead=new Lead({
                  lead:data[0], salutation:data[1], fname:data[2], lname:data[3], title:data[4], email:data[5],  mobile:data[6], rating:data[7], address:data[8], city:data[9], state:data[10],
                  zcode:data[11], company:data[12], industry:data[13], empSize:data[14], lsource:data[15], ownerId:owner._id,date:Date.now()
              });
            createLead.save(function(err, data){
              if(err){return res.json(err)}
                else{
                  //return  res.json({success: true, msg: 'Successfully User registered'});
                }
            });
  })
  .on('end', function(data){
    console.log('Read Finished........');
  });
    });
  });  
  
});

//update user profile data..
apiRoutes.put('/updateprofile', function(req, res){  
var token=getToken(req.headers);
   var owner=jwt.decode(token, config.secret);
   User.update({_id:owner._id},{name:req.body.name, email:req.body.email,status:req.body.status},function(err, data){
    if(err){res.json(err)}
      else{
        res.json(data);
      }
   })
});

 //==============================add contacts==============================================//
 apiRoutes.post('/addcontacts', function(req, res){
  var token=getToken(req.headers);
  var owner=jwt.decode(token,config.secret);
  var addcontact=new Contact({name:req.body.name,email:req.body.email,contact_no:req.body.contact_no, ownerId:owner._id});
  addcontact.save(function(err, data){
    if(err){res.json(err)}
      else{res.json(data)}
  });
 });
  //==============================Get contacts==============================================//
 apiRoutes.get('/getcontacts', function(req, res){
  var token=getToken(req.headers);
  var owner=jwt.decode(token,config.secret);
  Contact.find({ownerId:owner._id}, function(err, data){
     if(err){res.json(err)}
      else{res.json(data)}
  })
 });
  //==============================Edit contacts==============================================//
 apiRoutes.get('/editcontacts/:id', function(req, res){ 
  Contact.findOne({_id:req.params.id}, function(err, data){
     if(err){res.json(err)}
      else{res.json(data)}
  })
 });
 
  //==============================update contacts==============================================//
 apiRoutes.put('/updatecontacts/:id', function(req, res){ 
 var token=getToken(req.headers);
  var owner=jwt.decode(token,config.secret);
  Contact.update({_id:req.params.id},{name:req.body.name,email:req.body.email,contact_no:req.body.contact_no}, function(err, data){
       if(err){res.json(err)}
      else{res.json(data)}
  })
 });
  

// connect the api routes under /api/*
app.use('/api', apiRoutes);


//start server
app.listen(port)
console.log('Server strated:' +port );
