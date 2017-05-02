/* global require,console,__dirname */

/* Node script to validate caniuse feature JSONs */
(function () {
    var fs = require('fs');
    var path = __dirname + '/../features-json';
    var sampleData;
    var w3cStatusArr = ['rec', 'pr', 'cr', 'wd'];
    var statusArr = w3cStatusArr.concat(['ls', 'other', 'unoff']);
    var categoryArr = ['HTML5', 'CSS', 'CSS2', 'CSS3', 'SVG', 'PNG', 'JS API', 'Canvas', 'DOM', 'Other', 'JS', 'Security'];
    // Support string MUST have one of these (optionally others)
    var supportValues = ['y', 'a', 'n', 'u', 'p'];

    var validationFn = {
        isString: function (val) {
            return typeof val === 'string';
        },
        isObject: function (val) {
            return typeof val === 'object';
        },
        isArray: function (val) {
            return val instanceof Array;
        },
        isURL: function (val) {
            // Source: https://gist.github.com/dperini/729294
            var pattern = new RegExp(
                "^" +
                // protocol identifier
                "(?:(?:https?|ftp)://)" +
                // user:pass authentication
                "(?:\\S+(?::\\S*)?@)?" +
                "(?:" +
                // IP address exclusion
                // private & local networks
                "(?!10(?:\\.\\d{1,3}){3})" +
                "(?!127(?:\\.\\d{1,3}){3})" +
                "(?!169\\.254(?:\\.\\d{1,3}){2})" +
                "(?!192\\.168(?:\\.\\d{1,3}){2})" +
                "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
                // IP address dotted notation octets
                // excludes loopback network 0.0.0.0
                // excludes reserved space >= 224.0.0.0
                // excludes network & broadcast addresses
                // (first & last IP address of each class)
                "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                "|" +
                // host name
                "(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" +
                // domain name
                "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" +
                // TLD identifier
                "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
                ")" +
                // port number
                "(?::\\d{2,5})?" +
                // resource path
                "(?:/[^\\s]*)?" +
                "$", "i"
            );
            return pattern.test(val);
        },
        isStatus: function (val) {
            return statusArr.indexOf(val) > -1;
        },
        atLeastOne: function (arr) {
            return arr.length >= 1;
        },
        hasCategories: function (arr) {
            for (var i = 0; i < arr.length; i++) {
                if (categoryArr.indexOf(arr[i]) === -1) {
                    return false;
                }
            }
            return true;
        },
        isNumber: function (val) {
            return typeof val === 'number';
        },
        isBoolean: function (val) {
            return typeof val === 'boolean';
        }
    };

    var Validator = function (type, id, data) {

        this.throwError = function (message) {
            var pre = '[' + id;
            if( this.currentBrowser ) {
                pre += ':' + this.currentBrowser;
            }
            if( this.currentVersion ) {
                pre += ':' + this.currentVersion;
            }
            pre += '] ';
            throw Error(pre + message);
        };
        
        this.warn = function (message) {
            try {
                console.warn('[' + id + '] WARNING: ' + message);
            } catch(e){}
        };

        this.validateArray = function (template, arr) {
            for (var i = 0; i < arr.length; i++) {
                var itemToValidate = arr[i];
                for (var key in template) {
                    var itemRules = template[key];
                    this.validate(key, itemRules, itemToValidate);
                }
                this.validateKeys('array', template, itemToValidate);
            }
        };

        this.validate = function (key, rules, altObject) {
            var object = altObject || data;
            if (!(key in object)) {
                this.throwError('"' + key + '" missing in data');
            }
            var val = object[key];
            if (typeof rules === 'function') {
                var validatorFn = rules;
                validatorFn(val);
                return;
            }
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                if (typeof rule == 'string') {
                    if (!validationFn[rule](val)) {
                        this.throwError('Failed ' + rule + ' validation on "' + key + '". Got this: ' + val);
                    }
                } else if (rule instanceof Array) {
                    this.validateArray(rule[0], val);
                }
            }
        };

        this.validateToken = function (token) {
            // Must be any of these letters or #1, #2, etc.
            if (!/^(y|a|n|u|p|x|d|(\#\d+))$/.test(token)) {
                this.throwError('Invalid token: ' + token);
            }
        };

        this.validateSupportValue = function (val) {
            if (!validationFn.isString(val)) {
                this.throwError('Expected ' + val + ' to be a string');
            }
            var tokens = val.split(' ');
            var doneTokens = {};
            // Must have exactly one of these
            var gotSupportToken = false;

            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                if (doneTokens[token]) {
                    this.throwError('Duplicate token: ' + token);
                }
                doneTokens[token] = true;
                this.validateToken(token);

                if (supportValues.indexOf(token) > -1) {
                    if (gotSupportToken) {
                        this.throwError('Duplicate support token: ' + token);
                    }
                    gotSupportToken = true;
                }
            }
            if (!gotSupportToken) {
                this.throwError('No support token found');
            }
        };

        this.validateStatusOfSpec = function () {
            if (/^https?:\/\/(?:[^.]+)\.spec\.whatwg\.org\//.test(data.spec)) {
                if (w3cStatusArr.indexOf(data.status) > -1) {
                    this.throwError('W3C status "' + data.status + '" not valid for WHATWG spec "' + data.spec + '"')
                }
            }
        };

        this.validateKeys = function(parentKey, refObject, object) {
            for( var key in object ) {
                if( !(key in refObject) ) {
                    this.throwError('Extra key found in ' + parentKey + ': "' + key + '"');
                }
            }
        };

        this.validateSupportData = function () {
            var sampleStats = sampleData.stats;
            var stats = data.stats;
            for (var browserId in sampleStats) {
                this.currentBrowser = browserId;
                // Check if browser exists
                if (!(browserId in stats)) {
                    this.throwError('No data found for browser "' + browserId + '"');
                }
                var sampleSupportByVersion = sampleStats[browserId];
                var supportByVersion = stats[browserId];
                for (var version in sampleSupportByVersion) {
                    this.currentVersion = version;
                    if (!(version in supportByVersion)) {
                        this.throwError('Browser version missing: ' + browserId + ' ' + version);
                    }
                    var support = supportByVersion[version];
                    this.currentVersion = null;
                    this.validateSupportValue(support);
                }
                this.validateKeys(browserId, sampleSupportByVersion, supportByVersion);
            }
            this.currentBrowser = null;
            this.currentVersion = null;
            this.validateKeys('stats', sampleStats, stats);
        };

        this.validateFeature = function () {
            this.validate('title', ['isString']);
            this.validate('description', ['isString']);
            this.validate('spec', ['isString', 'isURL']);
            this.validate('status', ['isString', 'isStatus']);
            this.validateStatusOfSpec();
            this.validate('links', ['isArray', [{
                        url: ['isString', 'isURL'],
                        title: ['isString']
            }]]);
            this.validate('bugs', ['isArray', [{
                        description: ['isString']
            }]]);
            this.validate('categories', ['isArray', 'hasCategories']);
            this.validate('notes', ['isString']);
            this.validate('notes_by_num', ['isObject']);
            this.validate('usage_perc_y', ['isNumber']);
            this.validate('ucprefix', ['isBoolean']);
            this.validate('parent', ['isString']);
            this.validate('parent', function(featureid) {
            	// TODO: Check if existing feature
                if (featureid === 'parentfeatureid' && id !== 'sample-data') {
                    this.throwError('"parent" value is invalid, got: ' + featureid);
                }
            }.bind(this));
            this.validate('keywords', ['isString']);
            this.validate('ie_id', ['isString']);
            this.validate('chrome_id', ['isString']);
            this.validate('firefox_id', ['isString']);
            this.validate('webkit_id', ['isString']);
            this.validate('shown', ['isBoolean']);
            this.validateSupportData();
        };
        
        this.validateUsage = function () {
            this.validate('id', ['isString']);
            this.validate('name', ['isString']);
            this.validate('month', ['isString']);
            this.validate('month', function(month) {
                if (!/^\d{4}-\d{2}$/.test(month)) {
                    this.throwError('Format for month is invalid, got: ' + month);
                }
            }.bind(this));
            this.validate('access_date', ['isString']);
            this.validate('access_date', function(date) {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    this.throwError('Format for access_date is invalid, got: ' + date);
                }
            }.bind(this));
            this.validate('data', ['isObject']);
            this.validate('total', ['isNumber']);
            this.validate('total', function(total) {
                // Total amount should be 100 - untracked usage
                // If total is too low (especially for US) something is probably wrong
                if (total < 80) {
                    this.warn('Expected total usage to be > 80, was ' + total);
                }
                if (id === 'US.json' && total < 95) {
                    this.warn('Expected US total usage to be > 95, was ' + total);
                }
            }.bind(this));
        };
        
        switch(type) {
            case 'feature':
                this.validateFeature();
                break;
            case 'usage':
                this.validateUsage();
                break;
        }
        
    };

    var processFile = function (type, error, data, fileName) {
        if (error) {
            throw Error('Error: ' + error);
        }
        try {
            data = JSON.parse(data);
        } catch(e) {
            throw Error('Error in file "' + fileName + '": ' + e);
        }
        if (type === 'feature') {
            var matches = fileName.match(/([a-z0-9-]+)\.json$/);
            if( !matches || matches.length < 2  ) {
                console.log('Skipping file: ' + fileName);
                return;
            }
            var featureId = matches[1];
            new Validator('feature', featureId, data);
        } else {
            var id = /[^\/]+\.json/.exec(fileName)[0];
            new Validator(type, id, data);
        }
        
    };

    var readFile = function (file, type) {
        fs.readFile(file, function (error, data) {
            processFile(type, error, data, file);
        });
    };

    fs.readFile(__dirname + '/../sample-data.json', function (error, data) {
        if (error) {
            throw Error('Error: ' + error);
        }
        sampleData = JSON.parse(data);
        var files = fs.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (/[.]json$/.test(file)) {
                readFile(path + '/' + file, 'feature');
            } else {
                throw Error('File "' + file + '" does not have ".json" extension');
            }
        }
    });
	
    var regionPath = __dirname + '/../region-usage-json';
    var regionFiles = fs.readdirSync(regionPath);
    for (var i = 0; i < regionFiles.length; i++) {
        var file = regionFiles[i];
        if (file.indexOf('.json') > -1) {
            readFile(regionPath + '/' + file, 'usage');
        }
    }
}());
