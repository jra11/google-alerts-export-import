var require = patchRequire(require);
var conf = {};

conf['loglevel'] = "error";

conf['email'] = "";
conf['password'] = "";

conf['csv_separator'] = ";";
conf['csv_separator_list'] = "//";



var ga = {};
ga['howoften'] = new Array(3);
ga['sources'] = new Array(8);
ga['language'] = new Array(46);
ga['region'] = new Array(120);
ga['howmany'] = new Array(2); 
ga['deliverto'] =  new Array(2);

/* Read the doc before editing this */ 
ga['howoften'][0] = "now";
ga['howoften'][1] = "daily";
ga['howoften'][2] = "weekly";

ga['sources'][0] = "auto";


ga['language'][0] = "any";
ga['language'][1] = "en";
ga['language'][18] = "fr";
ga['region'][0] = "any";
ga['region'][1] = "us";
ga['region'][75] = "fr";

ga['howmany'][0] = "all";
ga['howmany'][1] = "best";

ga['deliverto'][1] = "rss";


exports.getConfig = function() { 
	conf['ga'] = ga;
	return conf; 
}