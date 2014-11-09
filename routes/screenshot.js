var express = require('express');
var url = require('url');
var webshot = require('webshot');
var fs      = require('fs');
var walk = require('walk');
var router = express.Router();

router.get('/', function(req, res) {

    var screenshotPath = __outputPath + "screenshot/";
 
var url_parts = url.parse(req.url, true);

     var screenShotURL = url_parts.query.url;


    if (screenShotURL === undefined || screenShotURL == '') {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end("404 Not Found");
  }
   	var filename = screenShotURL.replace(/\W/g, '_') + ".png"
     var options = {
       windowSize:{width:480,height:320},
       shotSize:{width:'all',height:'all'}
};
  function saveScreenshot(){
      webshot(screenShotURL, screenshotPath +filename,options, function(err) {
             if (err) throw err
               /*save the URL in session which can be taken later*/
             req.session.screenShotURL = screenShotURL;
             /*send the filename as response*/
             var imageBasePath=screenshotPath.substring(screenshotPath.indexOf("/result"));
      res.send({"path":imageBasePath+filename});

});
  }
    
    if (fs.existsSync(screenshotPath) === false) {

        fs.mkdirSync(screenshotPath);
        saveScreenshot();
    }
    else{
        
         walk.walk(screenshotPath).on("file", function(root, fileStats, next) {
              fs.unlinkSync(root + fileStats.name);
              next();
         }).on('end', function() {      
            saveScreenshot();
          });
   
    
        
    }
 
  
});
 
module.exports = router;