exports.rules = [{
	condition: function({ when }) {
		when(this.value == 2)
	},
	consequence: function({ stop, next }) {
		this.abc = 'hello';
		stop();
	}
}];


exports.columns = ['value', 'abc'];
