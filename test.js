// TODO: Set up real tests
"use strict";

var RU = require('./index');
var switcher = RU.makeRegExpSwitch([
        /arsta(sat((sarsdta)))/,
        'arsda()arstao[3424]',
        [/fo(o)/, 'foo matched!'],
        ['bar', 'bar matched!']
]);

function assert (a, b) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
        console.error('FAILURE: Expected' , JSON.stringify(a),
                ', saw', JSON.stringify(b));
        process.exit(1);
    }
}

assert( switcher('foo'),
    { match: ['foo', 'o'],
      value: 'foo matched!' } );

assert( switcher('bar'),
    { match: ['bar', 'bar'],
          value: 'bar matched!' } );

console.log('All tests passed.');
