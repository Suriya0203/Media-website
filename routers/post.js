var router=require("express").Router()
var user_details=require('../model/user_db')
var mongo=require('../config/db')
var image=require('../model/post')
const comments_data=require('../model/comments')
const { StatusCodes } = require('http-status-codes');
//const multer = require('multer')
//const { mutateExecOptions } = require('nodemon/lib/config/load')
//mongo();
var Mongoose=require("mongoose")
const multer=require('multer')
var auth=require("../middleware/auth");
//const comment = require("../model/comments");
let name='1234'
const Storage=multer.diskStorage({
    destination: "uploads",
    fileame:(req,res,cb)=>{
        cb(null,file.originalname);
    }
})

const upload=multer({
    storage:Storage
}).single('image')
router.post('/createpost',auth,async(req,res)=>{
  //console.log(req.user)  
  try{
   upload(req,res,(err)=>{
        if (err){
            console.log(err)
        }
        else{
            const newImage= new image({
                name:req.body.name,
                image:{
                    data:req.filename,
                    contentType:'image/jpg' || 'image/png' || 'image/jpeg'
                },
                createdBy:req.user.id//req.body.createrid
                //user:getUser()
            })
            newImage.save()
            if(newImage){
              res.status(200).json({
                message:"Post created successfully"
              })
            }
            else{
              res.status(401)
            }
        }
    })}
    catch(err){
      console.log(err.message)
    }
})
router.get('/getpost/:id',auth,async(req,res)=>{
    id=req.params.id
    //console.log(req.auth.email)
    try{
    const data=await image.findById(id)
        if(data){
            //res.send(data)
            res.status(200).json({
              data:data
            })
        }
        else{
           // console.log(err)
           res.status(404).json({
             message:"Post not found"
           })
        }
    }
    catch(err){
      res.status(500).json({
        message:"server error"
      })
    }
})
router.delete('/deletepost/:id',auth,async(req,res)=>{
  try{  
    const check=await image.findById(req.params.id)
    if (check){
      if(check.createdBy.toString()==req.user.id.toString()){
        await check.remove()
        return res.status(200).json({
          message:"post deleted successfully"
        })
      }
      else{
        res.status(401).json({
          message:"User Unauthorised"
        })

      }
    }

}
  catch(err){
    res.status(500).json({
      message:"Server Error"
    })
  }
}


  )



router.put('/addlike',auth,async(req,res)=>{
    // console.log(req.body.id)
    try{
    let posts = await image.findById(req.body.id);
    console.log(posts)
    if (!posts){
      res.status(404).json({
        message:`No post with id${req.body.id}`
      })
    }
    // throw new NotFoundError(`No post with id${req.body.id}`);
    //console.log(posts.likes)
    else if ( posts.likes.includes(req.user.id.toString())){
      res.json({
        message:"you'r already liked"
      })
    }
    else{
  
    posts = await image.findByIdAndUpdate(
      req.body.id,
      {
        $push: { likes: req.user.id },
      },
      { new: true, runValidators: true }
    );
    res.status(StatusCodes.OK).json({ posts });
  }
}catch(err){
  res.status(500).json({
    message:"Server error"
  })
}
})
router.delete('/removelike',auth,async(req,res)=>{
    try{
    let posts = await image.findById(req.body.id);
    console.log(posts)
    if (!posts){
      res.status(404).json({
        message:`No post with id${req.body.id}`
      })
    }
    // throw new NotFoundError(`No post with id${req.body.id}`);
    //console.log(posts.likes)
    else if ( posts.likes.includes(req.user.id.toString())){
      posts = await image.findByIdAndUpdate(
        req.body.id,
        {
          $pull: { likes: req.user.id },
        },
        { new: true, runValidators: true }
      );
      res.status(StatusCodes.OK).json({
        message:"Like removed successfully",
        post: posts });
    } 
    else{
      res.json({
        message:"you'r not liked this post"
      })}
    }
    catch(err){
      res.status(500).json({
        message:"Server error"
      })
    }
  })
router.post('/addcomment', auth,async(req,res)=>{
    try{
    var post=await image.findById(req.body.postId)
    console.log(post)
    if (post=="null"){
      res.status(404).json({
        messsage:"NO post in this id"
      })
    }
    else{
    var newComment = new comments_data({
      comment: req.body.comment,
      commentedBy: req.user.id,
      postId:req.body.postid
    })
    newComment.save().then(result=>{
      res.status(200).json({
        message:"comment added successfully",
        result:result
      })
    }).catch(err=>{
      res.json({
        error:err
      })
    })}}
  catch(err){
    res.status(500).json({
      message:"Server error"
    })
  }
})
router.get('/viewpost',auth,async(req,res)=>{
  try{
  const data=await image.find({createdBy:req.user.id})
  if(data){
    res.status(200).json({
      data:data
    })
    console.log(data)
  }
  else{
    res.status(401).json({
      message:"No post in this ID"
    })
  }
}
  catch(err){
    res.status(500).json({
      message:"Server error"
    })
  }

})
router.delete('/deletecomment',auth,async(req,res)=>{
  try{
  var post=await comments_data.findById({_id:req.body.id})
  console.log(post)
  if(post!="null"){
    //res.send(post.commentedBy)
    if(post.commentedBy.toString()==req.user.id.toString()){
        var del=await comments_data.findByIdAndDelete({_id:req.body.id})
        if(del){
            res.status(200).json({
              message:"comment deleted succesfully"
            })
        }
        else{
          res.status(401).json({
            message:"User Unauthorized"
          })
        }
    }
  else{
      res.status(401).json({
        message:"you'r not comment this post"
      })
    }
    
  }}
  catch(err){
    res.status(500).json({
      message:"Server error"
    })
  }
})
router.put('/editcomment',auth,async(req,res)=>{
  try{
  var post=await comments_data.findById({_id:req.body.id})
  console.log(post)
  if(post!="null"){
    //res.send(post.commentedBy)
    if(post.commentedBy.toString()==req.user.id.toString()){
        var del=await comments_data.findByIdAndUpdate({_id:req.body.id},{
          $set:{comment:req.body.comment}
        })
        if(del){
          res.status(200).json({
            message:"comment edited successfully "
          })
        }
        else{
          res.status(401).json({
            message:"User unauthorized"
          })
        }
    }
    else{
      res.json({
        message:"you'r not comment this post"
      })
    }
  }
  else{
    res.json({
      message:"Your not comment this post"
    })
  }}
  catch(err){
    res.status(500).json({
      message:"Server error"
    })
  }
})
router.put('/editpost',auth,async(req,res)=>{
  console.log(req.body.id)
  try{
  var post=await image.findById({_id:req.body.id})
  console.log(post)
  if(post!="null"){
    //res.send(post.commentedBy)
    if(post.createdBy.toString()==req.user.id.toString()){
        var del=await image.findByIdAndUpdate({_id:req.body.id},{
          $set:{name:req.body.name}
        })
        if(del){
          res.status(200).json({
            message:"Post edited successfully"
          })
        }
        else{
          res.status(401).json({
            message:"User unauthorized"
          })
        }
    }
    else{
      res.json({
        message:"you'r not cretaed this post"
      })
    }
  }
  else{
    res.json({
      message:"Your not created this post"
    })
  }
}
catch(err){
  res.status(500).json({
    message:"Server error"
  })
}
})



module.exports = router;        
  