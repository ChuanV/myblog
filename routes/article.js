var express = require('express')
var router = express.Router()
var Article = require('../models/article')
var path = require('path')
var fs = require('fs')
var filterXSS = require('xss')
//主页面渲染
router.get('/',function (req, res) {
    function total(){
      return new Promise(function (resolve) {
          Article.estimatedDocumentCount({},function (err,data) {
              if(err) {
                  return next(err)
              }
              resolve(data)
          })
      })
    }
   total().then(function (totalPage) {
       totalPage = Math.ceil((totalPage/5))
       let page = req.query.page
       page = page || "1"
       if(page<1){
           page = 1
       }else if (page>totalPage) {
           page = totalPage
       }
       // console.log(page)
       // console.log(totalPage)
       Article.find({})
           .skip((page-1)* 5)
           .limit(5)
           .sort({'_id':-1})
           .exec(function (err,data) {
               if(err) {
                   return next(err)
               }
               for (let i =0;i<data.length;i++){
                   data[i].created_time = formTime(data[i].created_time)
               }
               // console.log(typeof data[0]._id)
               // console.log(req.session.article.PV)
               // for (var i =0 ;i<data.length;i++){
               //     if (data[i]._id == req.session.article._id){
               //         console.log('----------')
               //         data[i].PV = req.session.article.PV || data[i].PV
               //     }
               // }

               res.render('index.html',{
                   user:req.session.user,
                   article:data,
                   totalPage:totalPage,
                   page:page
               })
           });
    })

})

//新建文章页面渲染
router.get('/topics/new',function (req,res,next) {
    if(!req.session.user) return res.redirect('/login')
    res.render('./topic/new.html',{
        user:req.session.user
    })
})

//文章发表
router.post('/topics/new',function (req,res,next) {
    if(!req.session.user) return res.redirect('/login')
    req.body.content = filterXSS(req.body.content)
    var saveTo = path.join(__dirname.replace('routes', 'static'),"./article/"+Date.now()+".txt");
    var fileUrl = "/static/article/" + path.parse(saveTo).base
    fs.writeFile(saveTo,req.body.content,function (err) {
        if(err) {
            return next(err)
        }
        let msg ={}
        msg.contentTitle = req.body.title
        msg.contentUrl = fileUrl
        msg.email =req.session.user.email
        msg.nickname =req.session.user.nickname
        msg.avatar = req.session.user.avatar
        new Article(msg).save(function (err,raw) {
            if(err) {
                return next(err)
            }
            res.status(200).json({
                err_code:1,
                message:'OK'
            })
        })
    })
})


//文章展示
router.get('/topics/show',function (req,res,next) {
    res.render('./topic/show.html',{
        id:req.query.id
    })
})

//文章加载
router.post('/topics/show',function (req,res,next) {
    req.body.id = req.body.id.replace(/\"/g,"")
    // console.log(req.body.id)
    function findId() {
        return new Promise(function (resolve,reject) {
            Article.findById(req.body.id,function (err,data) {
                if (err){
                    return next(err)
                }
                if (!data){
                    res.status(200).json({
                        err_code:0,
                        message:'Not this article'
                    })
                }
                resolve(data)
            })
        })
    }

    function addPV(data) {
        // console.log(data)
        return new Promise(function (resolve,reject){
            req.session.PV = data.PV
            data.PV++
            Article.update({_id:data._id},{$set:{PV:data.PV}},{multi:true},function (err,raw) {
                if (err){
                    return next(err)
                }
                if (raw) {
                    resolve(data)
                }
            })
        })
    }

    findId()
        .then(addPV)
        .then(function (data) {
            // console.log(data)
        fs.readFile(path.join(__dirname.replace('routes', ''),data.contentUrl),'utf-8',function (err,data) {
            if (err){
                req.session.article.PV--
                return next(err)
            }
            res.status(200).json({
                err_code:1,
                message:data
            })
        })
    })
})





//时间格式化
function formTime(createTime){
    let time =new Date()
    let apartTime = time - createTime
    let mytime = new Date()
    mytime.setTime(createTime)
    if (apartTime>86400000){
        return mytime.toLocaleDateString();
    }else if (apartTime>=3600000&&apartTime<86400000){
        return parseInt(apartTime/3600000)+'小时前';
    }else if (apartTime<3600000&&apartTime>=60000) {
        return parseInt(apartTime/60000)+'分钟前';
    }else {
        return parseInt(apartTime/1000)+'秒前';
    }
}



module.exports = router