console.log('Recursively scraping current folder for contact details.');

/*
 Author: Anthony Rawlins
     ID: s3392244
  Email: s3392244@student.rmit.edu.au
   Date: 4/7/16
*/

var fs = require('fs');
var http = require('http');
var nano = require('nano')('http://127.0.0.1:5984');
var cheerio = require('cheerio');
var path = require('path');
var jsonminify = require("jsonminify");

var db_name = "test_ingest";

nano.db.destroy(db_name, function() {
	nano.db.create(db_name, function(err, body) {
		
		var ingest = nano.db.use(db_name);
		
		var listOfFiles = [];
		walkSync(__dirname,listOfFiles);
		
		if(err) {
			console.log(err.message);
		} else {
			console.log(body);
		}
	});
});



/* Begin 3rd party code */
/* kethinov/walksync.js
   https://gist.github.com/kethinov/6658166 */
   
var walkSync = function(dir, filelist) {
  var fs = fs || require('fs'),
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
	
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
	  console.log('Searching Folder: ' + file);
    } else {
	    var ext = file.split('.').pop();
	    if(ext == 'html') {
		    console.log('Scraping File: ' + file);
		    scrape(dir + "/" + file);
    	}
    }
  });
  return filelist;
};
/* End of 3rd party code */




function scrape(html) {
       
    /* Upload to CouchDB */
    
	var $ = cheerio.load(fs.readFileSync(html));
	
	$('.js-integration-data-src').each(function() {
		var plaintext = $(this).text().trim();
		var json = {};
		
 		try {
	 		json = JSON.parse(plaintext);

			console.log(">> Sending the JSON[ " + JSON.stringify(json) + " ]\n>> found in: "+ html +"\n>> to CouchDB.");
			nano.use(db_name).insert(json, function(err, body, header) {
	        	if (err) {
		    	    console.log(err.message + "**Sending JSON to CouchDB failed.**"); 
	        	} else {
		        	console.log("Inserted.");
					console.log(body);
	        	}
        	}); 
		} catch(err) {
			console.log("Parsing JSON failed, won't send. " + err.message);
		}
	});
}