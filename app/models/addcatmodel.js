var mongoose=require('mongoose');  
var Schema=mongoose.Schema; 

var catSchema=new Schema({
	category:String,
	subcategory:[
		{type:String}]
});
  
module.exports=mongoose.model('categories', catSchema);