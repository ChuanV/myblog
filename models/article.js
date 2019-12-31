var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/test',{ useNewUrlParser: true })

var Schema = mongoose.Schema

var userSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    nickname:{
        type: String,
        required:true
    },
    created_time:{
        type:String,
        default:currentTime()
    },
    contentTitle:{
        type:String,
        default:''
    },
    contentUrl:{
        type:String,
        default:''
    },
    classify:{
        type:Number,
        enum: [0,1,2],
        default:0
    },
    like:{
        type:Number,
        default:0
    },
    unlike:{
        type:Number,
        default:0
    },
    PV:{
        type:Number,
        default:0
    },
    avatar:{
        type:String,
        default:'/public/img/avatar-default.png'
    },
    comment:{
        type:Number,
        default:0
    }


})

function currentTime(){
    return (new Date()).getTime().toString();
}

module.exports = mongoose.model('Article',userSchema)