var express = require('express');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var unzip = require('unzip');
var walk = require('walk');
var router = express.Router();
var sizeOf = require('image-size');
var events = require('events');
var webshot = require('webshot');

/* GET users listing. */

router.post('/', function(req, res) {
    var sessionKey = req.secret;
    var VDPath = __outputPath + "VD/";
    var screenshotPath = __outputPath + "screenshot/";
    var fileOptions = req.files.decompress;
    var extension = fileOptions.extension;
    var path = fileOptions.path;
    var aliasFileName = fileOptions.name;
    var fileName = fileOptions.originalname;
    var that = this;


    function extractFiles() {
  
            //move the zip file into the appropriate folder and rename it from alias name to the original name.
            fs.renameSync(__outputPath + aliasFileName, VDPath + fileName, function(err) {
                if (err) {
                    return err;
                }


            });
            if (extension === 'zip') {
                //unzip the folder
                fs.createReadStream(VDPath + fileName).pipe(unzip.Extract({
                    path: VDPath
                }).on('close', extractFilestoFolder));
            } else {
                extractFilestoFolder();
            }


        
    };
  
    //take multiple screenshots depending on the VD image(s) uploaded
  function fetchScreenShot(image,next)
    {
        
           
            var options = {
               windowSize:{width:image.width,height:image.height},
               shotSize:{width:image.width,height:image.height}
        };
             webshot(req.session.screenShotURL, screenshotPath +image.name,options, function(err) {
             if (err) throw err
             next();
                 });
       
        
    }
    //write files in the destined folder
    function extractFilestoFolder() {
        //when unzip is complete send the image info to the user
        var path = {};
        //get the folder name 
        path.root = sessionKey;
        var images = [];
        //remove the zip file, from the VD folder
        if (extension === 'zip') {
            fs.unlinkSync(VDPath + fileName);
        }
     //remove the files in screenshot folder
        walk.walk(screenshotPath).on("file", function(root, fileStats, next) {
              fs.unlinkSync(root + fileStats.name);
              next();
         }).on('end', function(err) { 
              if (err) throw err;
        walker = walk.walk(VDPath);
        //traverse the files
        walker.on("file", function(root, fileStats, next) {
            var image = {};

            if (fileStats.name.indexOf(".zip") === -1) {
                var imageBasePath = root.substring(root.indexOf("/result"));
                image.src = imageBasePath + fileStats.name;
                image.name = fileStats.name;
                var dimensions = sizeOf(root + '/' + fileStats.name);
                image.width = dimensions.width;
                image.height = dimensions.height;
                images.push(image);
                fetchScreenShot(image,next);
            }
            else{
                next();
            }
           
                
            
            });
         
       
        walker.on('end', function() {
            path.images = images;
         
          
             //send the response back to ui
                 res.send({
                "images": images
                });
            
        });

});
    }



    //check whether the directory already exists else create new directory 
    if (fs.existsSync(VDPath) === false) {

        fs.mkdirSync(VDPath);
        extractFiles();
    } else {

        //deleted the already existing files
          walk.walk(VDPath).on("file", function(root, fileStats, next) {
              fs.unlinkSync(root + fileStats.name);
              next();
         }).on('end', function() {      
            extractFiles();
          });
      


    }


    




});

module.exports = router;
