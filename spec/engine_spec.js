require('jasmine-co').install();
const engine = require('../expert/engine');

describe('engine.run', function() {
	var facts = [{ value: 2 }, { value: 3 }];

	it('without rules', function*() {
		var rules = [];
		var ans = yield engine.run(rules, facts);
		expect(ans.length).toBe(2);
		expect(ans[0].value).toBe(2);
		expect(ans[0].result).toBe(true);
	});

	it('basic rules', function*() {
		var rules = [{
			condition: function({ when }) {
				when(this.value == 2)
			},
			consequence: function({ stop, next }) {
				this.abc = 'hello';
				stop();
			}
		}];
		var ans = yield engine.run(rules, facts);
		expect(ans.length).toBe(2);
		expect(ans[0].value).toBe(2);
		expect(ans[0].result).toBe(true);
		expect(ans[0].abc).toBe('hello');
		expect(ans[1].abc).toBeFalsy();
	});

	it('throw exception', function*() {
		var rules = [{
			condition: function({ when }) {
				when(this.value == 2)
			},
			consequence: function({ stop, next }) {
				throw new Error('error')
			}
		}];
		try {
			var ans = yield engine.run(rules, facts);
			fail();
		} catch (e) {
			expect(e.message).toBe('error');
		}
	});

	it('chain rule', function*() {
		var rules = [{
			condition: function({ when }) {
				when(this.value == 2)
			},
			consequence: function({ stop, next }) {
				this.abc = 'hello';
				next();
			},
			name: 'rule1'
		}, {
			condition: function({ when }) {
				when(this.abc == 'hello')
			},
			consequence: function({ stop, next }) {
				this.def = 'hello';
				stop();
			},
			name: 'rule2'
		}];
		var ans = yield engine.run(rules, facts);
		expect(ans.length).toBe(2);
		expect(ans[0].abc).toBe('hello');
		expect(ans[0].def).toBe('hello');
		expect(ans[0].matchPath).toEqual(['rule1', 'rule2']);
	});
});
