var mongoose=require('mongoose');  
var Schema=mongoose.Schema; 

var leadSchema=new Schema({ 
  lead:{type:String},
    salutation:{type:String},
    fname:{type:String},
    lname:{type:String},
    title:{type:String},
    email:{type:String},
    mobile:{type:String},
    rating:{type:String},
    address:{type:String},
    city:{type:String},
    state:{type:String},
    zcode:{type:String},
    company:{type:String},
    industry:{type:String},
    empSize:{type:String},
    lsource:{type:String},
    ownerId:{type:String},
    date: { type: Date, default: Date.now }
});
  
module.exports=mongoose.model('leads', leadSchema);