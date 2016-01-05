# Google Alerts exporter & importer
A tool to export and import Google Alerts in your account

### Why this tool?

This tool enables you to export and import massively Google Alerts in your Google account to set up a good internet monitoring system. As Google Alerts does not have any API, this script aims at providing an easy way to import/export from Google Alerts.


### Why CasperJS?

The script has been made using CasperJS, which should be the most reliable solution to automate Google things, as they use massively Javascript. Another project has been made here using Python/URLlib/BeautifulSoup:

https://github.com/jab/galerts

It does not work/is not maintained anymore, and studying the source code it seems that CasperJS (or something similar) is far way better to automate complex things, as it simulates a browser. 

### Features

* Import Google Alerts from file (CSV type)
* Export Google Alerts to file (CSV)
* Custom delimiter character for CSV
* List all RSS feeds from your alerts
* Delete all your alerts
* Synchronize from file to Google Alerts (delete automatically alerts from your account if needed)
* Shortcuts (instead of using native Google Alerts labels, use your own to simplify your CSV file(s))

### Installation

1. Install CasperJS first. 
http://docs.casperjs.org/en/latest/installation.html

2. Then, clone this Git


### Configuration

Enter your Google email and password in the config.js file. 

### Usage
```
casperjs galerts.js - version 1.1
Usage:
	casperjs galerts.js <command> <options>
	casperjs galerts.js export [--file=filename] [--force]
	casperjs galerts.js import --file=filename [--delete-others]
	casperjs galerts.js deleteall
	casperjs galerts.js listrss

Commands:

export		Export your Google Alerts to a file (or print to the screen if no file is specified
import		Import Google Alerts from a CSV file to your account
deleteall	Delete all Google Alerts from your account
listrss		List all RSS feeds from your account
help		Print this help

Options:

--force			Overwrite local file if it exists
--delete-others	Delete remote Google alerts if they are not in the imported file
```

### CSV Format by default
By default, the format of your CSV file is as follows:

> keyword;howoften;sources;language;region;howmany;deliverto;rssFeedAddress 

The last field is only appended to exported alerts when there is a RSS address, so do not include it your import file. 

To know which value each field can take, please have a look in the file "galertsData.js", which contains all possible values of each Google Alerts. 

So for instance, the two following lines are correct:

> Apple;At most once a week;Blogs;English;Argentina;All results;RSS feed

> iPhone;At most once a day;Web//Video;French;Any Region;All results;test@youremail.com

There is only one multiselect field: the "sources" one, which can take several values. To separate each one, use the separator '//' (eg Web//Video as above). 

**IMPORTANT NOTE: Type correctly each label. Labels are case sensitive. Refer to the file galertsData.js to get the exact possible value of each value.**

### Custom CSV Format
You can customize the CSV format by choosing the separators in the config file. 
Furthermore, as it can be boring to find the enter the right label for each field, you can also configure some shortcuts, eg:

In galertsData.js, get the value you want to overload:
> ga['language'][18] = "French";

Then in config.js:
> ga['language'][18] = "fr";

By adding the line above in your config file, you can type "fr" for the language field in your CSV file. Furthermore, when your alerts are exported, the field will automatically take the label of your config file, so the line below:

> iPhone;At most once a day;Web//Video;French;Any Region;All results;test@youremail.com

will become:

> iPhone;At most once a day;Web//Video;fr;Any Region;All results;test@youremail.com


### Debug & Contribute

* If you want to contribute, clone the GIT file and customize the config file with the name "config.mine.js" - without editing the default config.js — and exclude config.mine.js from GIT

* To enable debugging/verbose logs, change log level in config.js or config.mine.js

```
conf['loglevel'] = "error";
// or
conf['loglevel'] = "debug";
```

* One of the best way to debug is to take screenshots:

```
this.wait(2000, function() {
 	this.capture('test.jpg');
});
```


### Bugs/Limitations

* When you import alerts, consider the keyword as a "primary key". Only the keyword of a Google Alert is used to see if the alert is already existing on your account. 

* Do not use quote in the keyword of Google Alerts, use double-quote (")

* When you manage a lot of alerts, operations are slow as we simulate a real browser with each click performed. In addition, we have several "sleep" in the code to avoid being detected as a bot by Google. 

* If you have a warning "Unsafe JavaScript attempt to access frame with URL about:blank", do not take it into account, this seems to be a bug in PhantomJS. 

* If you have some SSL errors, try the option casperjs --ssl-protocol=tlsv1 --ignore-ssl-errors=yes galerts.js

### Responsability

Use at your own risk. I take no responsability for the usage of this tool. 

### Contact me

**Julien Rambeau**

Please ask any question/feedback through [Linkedin](https://www.linkedin.com/in/julienrambeau)
