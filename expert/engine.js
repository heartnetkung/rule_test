const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const RuleEngine = require('node-rules');
const fs = require('fs');
const path = require('path');


exports.readCsv = function(file) {
	var text = fs.readFileSync(file, 'utf8');
	return parse(text, { trim: true, columns: true, auto_parse: true });
};


exports.writeCsv = function(file, object, columns) {
	var result = stringify(object, { trim: true, columns, header: true });
	fs.writeFileSync(file, result);
};


exports.run = function(rules, facts) {
	var error = null;
	var errorCatch = function(func) {
		return function() {
			try {
				return func.apply(this, arguments);
			} catch (e) { error = e; }
		};
	};
	for (var rule of rules) {
		if (!rule.condition || !rule.consequence)
			throw new Error('incomplete rule');
		rule.condition = errorCatch(rule.condition);
		rule.consequence = errorCatch(rule.consequence);
	}
	return new Promise(function(res, rej) {
		try {
			var R = new RuleEngine(rules, { ignoreFactChanges: true });
			var i = 0;
			var ii = facts.length;
			var ans = [];
			var cb = (result) => {
				if (!result.result)
					return rej(result.reason);
				if (error)
					return rej(error);
				ans.push(result);
				if (i >= ii)
					return res(ans);
			};
			for (; i < ii; i++)
				R.execute(facts[i], cb);
		} catch (e) {
			return rej(err);
		}
	});
};


if (require.main === module) {
	var [ruleFile, inputFile, outputFile] = process.argv.slice(2);
	var facts = exports.readCsv(inputFile);
	var imports = require(ruleFile);
	exports.run(imports.rules, facts).then(function(result) {
		exports.writeCsv(outputFile, result, imports.columns);
	}).catch(function(err) {
		console.error(err);
	});
}
