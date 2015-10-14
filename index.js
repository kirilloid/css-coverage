var cssParse = require('css').parse;
var glob = require("glob");
var fs = require('fs');

var options = {
    root: '',
    html: ['**/*.html', '**/*.hbs'],
    css:  '**/*.css'
};

var globOptions = {
    nosort: true
};


var classesDeclared = {};
function addDeclaredClass(className) {
    classesDeclared[className.replace(/^\./, '')] = true;
}

function processCSSFile (css) {
    var parsed = cssParse(css);
    parsed.stylesheet.rules.filter(function (rule) {
        return rule.type === 'rule';
    }).forEach(function (rule) {
        rule.selectors.forEach(function (selector) {
            [].forEach.call(selector.match(/\.[\w-]+/g) || [], addDeclaredClass);
        });
    });
}
[].concat(options.css).forEach(function (pattern) {
    glob.sync(options.root + pattern, options).forEach(function (fileName) {
        var fileContent = fs.readFileSync(fileName, 'utf8');
        try {
            processCSSFile(fileContent);
        } catch (e) {
            console.log("CSS syntax error in file %s: %s", fileName, e.message);
        }
    });
});
function extractClasses (html) {
    var m, re = /(^| )class="([\s\S]*?)"/g;
    var out = [];
    while (m = re.exec(html)) {
        out.push.apply(out, m[1].split(/[\s\n]+/));
    }
    return out;
}
function processHTMLFile(fileName) {
    var fileContent = fs.readFileSync(fileName, 'utf8');
    var classes = extractClasses(fileContent);
    classes.forEach(addUsedClass);
}

var classesUsed = {};
function addUsedClass (className) { classesUsed[className] = true; }
[].concat(options.html).forEach(function (pattern) {
    glob.sync(options.root + pattern, options).forEach(processHTMLFile);
});

var unused = [];
var className;
for (className in classesDeclared) {
    if (!(className in classesUsed)) {
        unused.push(className);
    }
}

var undeclared = [];
for (className in classesUsed) {
    if (!(className in classesDeclared)) {
        undeclared.push(className);
    }
}

if (unused.length) {
    console.log("%d classes declared, but never used:", unused.length);
    unused.forEach(function (className) {
        console.log("  " + className);
    });
}

if (undeclared.length) {
    console.log("%d classes used, but not mentioned in CSS:", undeclared.length);
    undeclared.forEach(function (className) {
        console.log("  " + className);
    });
}

if (!unused.length && !undeclared.length) {
    console.log("Yay! Evertyhing is in harmony");
}
