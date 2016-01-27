var version = 1.1;
var fs = require('fs');
var utils = require('utils');
var gaData = require('./galertsData.js').getVars();
var conf = require('./config.js').getConfig();
gaData['deliverto'][0] = conf['email'];

if (fs.exists("config.mine.js")) {
	conf = require('./config.mine.js').getConfig();
	gaData['deliverto'][0] = conf['email'];
}
var columns_csv = ["keyword", "howoften", "sources", "language", "region", "howmany", "deliverto", "rss"];


var url = "https://www.google.com/alerts";
var urllogin = "https://accounts.google.com/ServiceLogin";
var loginString = "ServiceLogin";


var casper = require('casper').create({
	verbose: true,
    logLevel: conf['loglevel'],
});

casper.start("", function() {});
casper.page.customHeaders = {
	'Accept-Language': 'en'
};


if (conf['email'] == "") {
	casper.log("Galerts is not configured. Please edit the config file before use", "error");
	casper.exit();
}


casper.options.viewportSize = {width: 800, height: 600};
// casper.on("page.error", function(msg, trace) {
//     this.echo("Error: " + msg, "ERROR");
// });
// casper.on("resource.error", function(resourceError) {
//     this.echo("ResourceError: " + JSON.stringify(resourceError, undefined, 4));
// });
// casper.on("remote.message", function(msg) {
//     this.echo("Error Client Side: " + msg, "warning");
// });


casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)');
var mouse = require("mouse").create(casper);
var x = require('casper').selectXPath;
var alerts = [];

// **************************************************
// Main actions
// **************************************************

casper.parseCommandLine = function() {
	casper.cli.drop("cli");
	casper.cli.drop("casper-path");
	
	if (casper.cli.args.length === 0) {
		help();
		casper.exit();
	} 

	if (casper.cli.has("h")) {
		help(); casper.exit();
	}
	if (casper.cli.has(0)) {
		switch(casper.cli.get(0)) {
			case "export":
				var force = casper.cli.has("force");
				if (casper.cli.has('file')) {
					casper.launchExport(casper.cli.get('file'), force);
				} else {
					casper.launchExport("none", force);
				}
				break;
			
			case "import":
				if (! casper.cli.has('file')) {
					casper.echo("Select the file to be imported with --file=<yourfile>");
					casper.exit();
				} else {
					var deleteOthers = casper.cli.has("delete-others");
					casper.launchImport(casper.cli.get('file'), deleteOthers);
				}
				break;

			case "listrss":
				casper.listRss();
				break;

			case "deleteall":
				casper.deleteAll();
				break;

			case "help":
				help();
				casper.exit();
				break;
			default:
				help();
				casper.exit();
		}
	}
}


casper.launchImport = function(file, deleteOthers) {
	if (! fs.exists(file)) {
		casper.log("Error: Filename "+file+" does not exists", "error");	
		casper.exit();
	}
	loadAlertsFromCSV(file, function(csv_alerts) {
		casper.login();
		casper.showAllAlerts();

		// var alert = [];
		// 	alert['keyword'] = "test";
		// casper.then(function() {
		// 	casper.deleteAlert(alert);
		// });
		// casper.then(function() {
		// casper.exit();
		// });

		casper.getAllAlerts(function(online_alerts) {

			csv_alerts.forEach(function(alert1, index1) {
				var found = -1;
				online_alerts.forEach(function(alert2, index2) {
					if (alert1['keyword'] == alert2['keyword']) {
						found = index2+1;
					}
				});
				if (found > -1) {
					casper.updateAlertIfNeeded(found, alert1);
				} else {
					casper.addAlert(alert1);
					casper.showAllAlerts();
				}
				casper.wait(2000, function() {});
			});

			if (deleteOthers) {
				casper.log("Deleting other alerts...", "debug");
				online_alerts.forEach(function(alert2, index2) {
					var found = false;
					csv_alerts.forEach(function(alert1, index1) {
						if (alert1['keyword'] == alert2['keyword']) {
							found = true;
						}
					});
					if (! found) {
						casper.log("Deleting alert "+alert2['keyword']);
						casper.deleteAlert(alert2);
					}
				});
			}
		});
	});
}

casper.launchExport = function(file, force) {
	if (fs.exists(file) && (! force) ) {
		casper.log("Filename "+file+" already exists. Use --force to overwrite it", "error");
		casper.exit();
	}
	// casper.start("", function() {});
	this.login();
	this.showAllAlerts();
	casper.then(function() {
		casper.getAllAlerts(function(alerts) {
			casper.echo(alerts.length +" alerts retrieved.");
			if (file == "none") {
				casper.printAlerts(alerts);
			} else {
				casper.saveAlertsToCSVFile(alerts,file, force);
			}
		});
	});

	casper.then(function() {
		casper.exit();
	});
}

casper.listRss = function() {
	this.login();
	this.showAllAlerts();
	casper.then(function() {
		var links = this.getElementsInfo(x('//*/div[@class="alert_buttons"]/a'));
		links.forEach(function(el) {
			var rel = el['attributes']['href'];
			casper.echo("https://www.google.com"+rel);
		});
	});
}

casper.deleteAll = function() {
	this.login();
	this.showAllAlerts();
	casper.then(function() {
		var all = this.getElementsInfo(x('//*/div[@class="query_div"]/span'));
		all.forEach(function(el) {
			var alert = [];
			alert['keyword'] = el['text'];
			casper.deleteAlert(alert);
		});
	});
}

// **************************************************
// Google interaction
// **************************************************

casper.login = function() {
	casper.start(urllogin, function() {
	    this.log("Login page loaded", "debug");  
	});

	casper.then(function() {
		this.wait(3000, function() { });
	});
	
	casper.then(function() {
		this.fillSelectors('form#gaia_loginform', {
	    	'input[name=Email]': conf['email'],
	    	'input[name=Passwd]': conf['password']
	    });
	});
	casper.then(function(){
		this.wait(1000, function() {
			this.mouse.click("#signIn");
			
		});
	});
	casper.then(function() { this.wait(3000, function() { }); });
	casper.thenOpen(url, function() { });
	casper.then(function() { this.wait(2000, function() { }); });
}

casper.showAllAlerts = function() {
	this.then(function() {
		if (this.exists('.show_all_alerts')) {
			this.click('.show_all_alerts');
			this.then(function() {
				this.wait(1000, function() { });
			});
		}
	});
}

casper.goToAlertPage = function(id) {
	this.showAllAlerts();
	casper.log("Going to page of alert "+id, 'debug');
	this.click('#manage-alerts-div li:nth-child('+id+') .edit_button');
}

casper.getCurrentAlert = function(id, keyword, rssLink, callback) {

	casper.goToAlertPage(id);
	var alert = casper.wait(1000, function() {
		casper.log("Getting info for the alert "+keyword, 'debug');
		rows = this.getElementsInfo('.goog-flat-menu-button-caption');

		var alert = {};
		alert['howoften'] = rows[0].html;
		alert['sources'] = rows[1].html.split(', ');
		alert['language'] = rows[2].html;
		alert['region'] = rows[3].html;
		alert['howmany'] = rows[4].html;
		alert['deliverto'] = rows[5].html;
		alert['keyword'] = keyword;
		alert['rss'] = rssLink;

		var alert_str = Object.keys(alert).map(function(x){return alert[x];}).join(',');

		casper.log("Getting info for the alert "+id+ " - Keyword: "+keyword+": "+alert_str, 'debug');
		callback(alert);
		//alerts.push(alert);
	});

	this.then(function() {
		this.click('.close_icon');
	});
	this.wait(2000, function() {});
	return this;
}

//http://stackoverflow.com/questions/13482352/xquery-looking-for-text-with-single-quote
function cleanStringForXpath(str)  {
    var parts  = str.match(/[^'"]+|['"]/g);
    parts = parts.map(function(part){
        if (part === "'")  {
            return '"\'"'; // output "'"
        }

        if (part === '"') {
            return "'\"'"; // output '"'
        }
        return "'" + part + "'";
    });
    return "concat(" + parts.join(",") + ")";

}

casper.deleteAlert = function(alert) {
	this.then(function(){ 
		this.showAllAlerts();
	});
	this.then(function(){ 
		var xpath = '//*/div[@class="query_div"]/*[text()='+cleanStringForXpath(alert['keyword'])+']/../../div[@class="alert_buttons"]/span[contains(@class, "delete_button")]';		//utils.dump(this.getElementInfo(x(xpath)));
		this.click(x(xpath));
	});
	this.wait(2000, function() {});
}


casper.updateAlertIfNeeded = function(id, alert) {

	this.log("Updating alert "+id+ " - keyword: "+alert['keyword']);
	
	var updated = false;
	if (id != -1) {
		this.goToAlertPage(id);
	}
	this.wait(1000, function() {
		rows = this.getElementsInfo('.goog-flat-menu-button-caption');

		if (rows[5].html != alert['deliverto']) { this.changeDropDown(6, 'deliverto', alert['deliverto']); updated = true; }
		if (rows[0].html != alert['howoften']) { this.changeDropDown(1, 'howoften', alert['howoften']); updated = true; }
		if (rows[1].html != alert['sources'].join(', ')) { this.changeDropDownMultiSelect(2, alert['sources'], rows[1].html); updated = true; }
		if (rows[2].html != alert['language']) { this.changeDropDown(3, 'language', alert['language']); updated = true; }
		if (rows[3].html != alert['region']) { this.changeDropDown(4, 'region', alert['region']); updated = true; }
		if (rows[4].html != alert['howmany']) { this.changeDropDown(5, 'howmany', alert['howmany']); updated = true; }		
	});

	this.then(function() {
		if (updated) { 
			casper.saveModifiedAlert();
		}
	});
	
	return this;
}


casper.saveModifiedAlert = function() {
	this.then(function() {
		this.log("Saving alert", "debug");
		this.mouse.click("#save_alert");
	});
}

casper.saveCreatedAlert = function() {
	this.then(function() {
		this.log("Saving created alert", "debug");
		this.click("#create_alert");
	});
}

casper.changeDropDownMultiSelect = function(indexDropdownMenu, newvalues, oldvalue) {
	
	// reset to "automatic"
	if (oldvalue != "Automatic") {
		this.then(function() {
			this.log("Changing Dropdown "+indexDropdownMenu+ " of alert to "+newvalues.join(','), "debug");
			this.click(x('(//*/div[@class="goog-inline-block goog-flat-menu-button-caption"])['+indexDropdownMenu+']'));
		});
		

		this.then(function() {
			//this.mouse.move(x('(//body/div[@class="goog-menu goog-menu-noicon"])['+(indexDropdownMenu)+']/*[@class="goog-menuitem"]/*[text()="Automatic"]/..'));
			this.mouse.move(x('//*/div[contains(@class, "goog-menuitem")]/*[text()="Automatic"]/..'));
		});
		this.then(function() {
			//this.mouse.click(x('(//body/div[@class="goog-menu goog-menu-noicon"])['+(indexDropdownMenu)+']/*[@class="goog-menuitem goog-menuitem-highlight"]/*[text()="Automatic"]/..'));
			this.mouse.click(x('//*/div[contains(@class, "goog-menuitem")]/*[text()="Automatic"]/..'));
		});
	}

	newvalues.forEach(function(value) {
		casper.then(function(){
			casper.mouse.click('#search_box'); // to close the menu
		});
		casper.then(function() {
			casper.changeDropDown(indexDropdownMenu, value);
		});
		casper.then(function(){
			casper.mouse.click('#search_box'); // to close the menu
		});
	});
}

/**
* We "type" the first letter N times to get the right value from any dropdown list (more reliable than mouse manipulation)
*/
casper.getIndexItemByFirstLetter = function(menuname, itemwanted) {

	var firstletter = itemwanted.trimLeft().charAt(0);//trimLeft() will solve the 'space' prefix problem from 'All results'&"Only the best results"
	var index = 0;
	gaData[menuname].some(function(el){ 
		if (el.trimLeft().charAt(0) == firstletter) {
			index += 1;
		}    
        if (el==itemwanted) return true;//once we get the itemwanted we stop iterating gaData
        
        return false;        
	});

	return index;
}

casper.changeDropDown = function(indexDropdownMenu, menuName, newvalue) {
	// Short function, but really tricky... 

	//indexDropdownMenu = 3; menuName = "language"; newvalue = "Polish";
	if ((newvalue == "All results")||(newvalue == "Only the best results")) { newvalue = " "+newvalue; }

	//Click on the dropdown to display it
	this.then(function () {
		this.log("Changing Dropdown "+indexDropdownMenu+ " ("+ menuName+") of alert to "+newvalue, "debug");
		this.click(x('(//*/div[@class="goog-inline-block goog-flat-menu-button-caption"])['+indexDropdownMenu+']'));
	});

	// We use the keyboard - not the mouse
	this.then(function () {
		var nKeypressNeeded = casper.getIndexItemByFirstLetter(menuName, newvalue);
		var keyToPress = newvalue.trimLeft().charAt(0);
		this.log("Selecting right item in menu "+menuName+ " by pressing "+nKeypressNeeded+" time on "+keyToPress, "debug");
		for (var i=1; i<=nKeypressNeeded; i++) {
			this.sendKeys(x('(//*/div[@class="goog-inline-block goog-flat-menu-button-caption"])['+indexDropdownMenu+']'), keyToPress);
		}
	});

	// Enter to select the item
	this.then(function() {
		this.sendKeys(x('(//*/div[@class="goog-inline-block goog-flat-menu-button-caption"])['+indexDropdownMenu+']'), casper.page.event.key.Enter);
	});

	// this.wait(2000, function() {
	// 	this.capture('test'+menuName+'.jpg');
	// });

	// this.then(function() {
	// this.exit();
	// });
}

casper.addAlert = function(alert) {
	this.log("Adding alert "+alert['keyword'], "debug");
	this.then(function(){
		this.sendKeys('input[placeholder="Create an alert about..."]', alert['keyword']);
	});

	this.then(function() {
		this.click('.show_options');
	});
	this.then(function() {
		casper.updateAlertIfNeeded(-1, alert);
	});
	this.then(function() {
		casper.saveCreatedAlert();
	})
	this.wait(2000, function() {
	 	this.capture('test_dropdown2.jpg');
	});
}

casper.getAllAlerts = function(callback) {
	var alerts_n = [];
	var alerts = [];
	var n = 0;
	casper.log("Getting all alerts", 'debug');


	casper.then(function() {
		if (this.exists('.edit_button')) {
			buttons_edit = this.getElementsInfo('.edit_button');
			for (var i = 1; i <= buttons_edit.length; i++) {
	   			alerts_n.push(i);
			}
		}
	});
	
	
	casper.then(function() {
		casper.eachThen(alerts_n, function(index) {
			var currentalert = index.data;
			var keyword = this.getElementInfo('#manage-alerts-div li:nth-child('+currentalert+') .query_div span').html;
			var rssLink = "none";
			var rssLinkSelector = '#manage-alerts-div li:nth-child('+currentalert+') .alert_buttons a';
			if (this.exists(rssLinkSelector)) {
				var el = this.getElementInfo(rssLinkSelector);
				rssLink = el['attributes']['href'];
			}


			casper.getCurrentAlert(currentalert, keyword, rssLink, function(alert) {
				alerts.push(alert);
			});
			
			// casper.then(function(){
			// 	alerts.forEach(function(c) {
			// 		this.echo(c['deliverto']);
			// 	});
			// });
		});
	});
	casper.then(function() {
		casper.log(alerts_n.length, "debug");
		casper.log("Number of alerts identified: "+(alerts_n.length), 'debug');
		callback(alerts);
	});
	
}




// **************************************************
// CSV File Management
// **************************************************


function loadAlertsFromCSV(file, callback) {
	var alerts = []; 


	// var l = getGoogleLabel("howoften", "At most once a week")
	// casper.log("Titi "+l);

	var data = require('fs').read(file);
	var lines = data.split('\n');
	var regempty1 = new RegExp(/^\s*\#+/g);
	var regempty2 = new RegExp(/^\s*$/g);

	
	lines.forEach(function(line, index, array) {
		var alert = {};
		if ((! regempty1.exec(line)) && (! regempty2.exec(line))) {
			var fields = line.split(conf['csv_separator']);
			if (fields.length < 7) {
				casper.log("Error: invalid line "+(index+1)+ " in CSV file "+file, "error");
				casper.exit();
			}

			alert['keyword'] =  fields[0];
			
			for (var i = 1; i<fields.length; i+=1) {
				var shortcutFields = fields[i].split(conf['csv_separator_list']);
				var trueFields = [];
				shortcutFields.forEach(function(sf) {
					if (columns_csv[i] != "rss") {
						res = getGoogleLabel(columns_csv[i], sf);
						//utils.dump(res);
						if (res[0] == false) {
							casper.log("Error while parsing the CSV file: invalid line "+(index+1)+": "+sf+" is not a valid value", "error"); 
							casper.exit();
						} else {
							trueFields.push(res[1]);
						}
					}
				});
				if (columns_csv[i] == "sources") {
					alert[columns_csv[i]] = trueFields;
				} else {
					alert[columns_csv[i]] = trueFields[0];
				}
			}
			alerts.push(alert); 
		}
	});
	
	callback(alerts);
}

casper.saveAlertsToCSVFile = function(alerts,filename, force) {
	
	var allalerts = "";
	alerts.forEach(function(alert) {
		var alertstr = "";
		columns_csv.forEach(function(column) {
			if (column == "keyword") {
				alertstr += alert['keyword']+conf['csv_separator'];
			} else {
				if (column == "sources") {
					var easyColumn = [];
					alert[column].forEach(function(label) {
						var easyLabel = getEasyLabel("sources", label);
						easyColumn.push(easyLabel);
					});
					alertstr += easyColumn.join(conf['csv_separator_list'])+conf['csv_separator'];
				} else {
					if (column == "rss") {
						if (alert['rss'] != "none") {
							alertstr += "https://www.google.com"+alert['rss']+conf['csv_separator'];
						} else { alertstr += alert['rss']+conf['csv_separator']; }
					} else {
						alertstr += getEasyLabel(column, alert[column])+conf['csv_separator'];
					}
				}
			}
		}); 

		alertstr = alertstr.substring(0, alertstr.length-1);
		allalerts += alertstr+"\n";
	});
	fs.write(filename, allalerts, 'w');
	casper.echo(alerts.length + " alerts exported to "+filename);
}


// **************************************************
// TOOLS
// **************************************************

casper.printAlerts = function(alerts) {
	casper.echo("Your alerts:\n");
	if (alerts.length == 0) {
		casper.echo("No alert found");
	} else {
		alerts.forEach(function(a, index, array){
			casper.echo("\t"+(index+1)+" "+a['keyword']);
		});
	}
}

var getGoogleLabel = function (category, easyname) {
	//casper.log("Get google label: "+category+" - "+easyname);
	
	var found = false;
	var value = "Error: unknown field in "+category+" for "+easyname+" in getGoogleLabel";
	
	if (conf['ga'][category] != null) {
		conf['ga'][category].forEach(function(el, index, a) {
			// casper.log(el+" "+easyname, "debug");
			if (el == easyname) {
				found = true;
				//casper.log(gaData[category][index]);
				value = gaData[category][index];
			}
		});
	}
	if (! found) {
		if (gaData[category] != null) {
			gaData[category].forEach(function(el, index, a) {
				if (easyname == el) {
					found = true;
					value = easyname;
				}
			});
		} else {
			return (false, "");
		}
	}
	return [found, value];	
}

var getEasyLabel = function(category, googleLabel) {
	var indexLabel = -1;
	if (gaData[category] != null) {
		gaData[category].forEach(function(label, index) {
			if (label == googleLabel) {
				indexLabel = index;
			}
		});
		var easyLabel = googleLabel;
		if (conf['ga'][category] != null) {
			if (conf['ga'][category][indexLabel] != null) {
				easyLabel = conf['ga'][category][indexLabel];
			}
		}
	}
	return easyLabel;
}

function help() {
	casper.echo("casperjs galerts.js - version "+version);
	casper.echo("Usage:");
	casper.echo("\tcasperjs galerts.js <command> <options>");
	casper.echo("\tcasperjs galerts.js export [--file=filename] [--force]");
	casper.echo("\tcasperjs galerts.js import --file=filename [--delete-others]");
	casper.echo("\tcasperjs galerts.js deleteall");
	casper.echo("\tcasperjs galerts.js listrss");

	casper.echo("");
	casper.echo("Commands:");
	casper.echo("");
	casper.echo("export\t\tExport your Google Alerts to a file (or print to the screen if no file is specified");
	casper.echo("import\t\tImport Google Alerts from a CSV file to your account");
	casper.echo("deleteall\t\tDelete all Google Alerts from your account");
	casper.echo("listrss\t\tList all RSS feeds from your account");	
	casper.echo("help\t\tPrint this help");
	casper.echo("");
	casper.echo("Options:");
	casper.echo("");
	
	//casper.echo("");
	// casper.echo("--auth\tfile");
	// casper.echo("\tFile containing your email address and password");
	casper.echo("--force\t\tOverwrite local file if it exists");
	casper.echo("--delete-others\tDelete remote Google alerts if they are not in the imported file");
	casper.exit();

}

// login();
// //casper.then(function() { casper.getAllAlerts()} );
// casper.then(function() { casper.updateAlertIfNeeded(3)});
// casper.run(function() {
	
// 	casper.exit();
// });

// var file = "myalerts.dat";

// var alerts = loadAlertsFromCSV(file);

// **************************************************
// Launch
// **************************************************

casper.parseCommandLine();
casper.run(function() {
	casper.exit();
});



