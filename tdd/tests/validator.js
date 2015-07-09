/*validator test*/



	TDD.add({
		group:	'plugins',
		name:	'Validation',
		tests:	{
			'string': function(complete) {
				var form = $().modelSetType('value', 'number').modelSet({value:'qwerty'});

				$.Validator(form).setProperties({
					'path: my.path.*.prop`incorrect_type rule: myrule`incorrect_length type: int':	{ required: true, bindToRef: 'value', instant: false }
				});

				$.Validator(form).validate();
				complete(true);
			}
		}
	});

