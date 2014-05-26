"use strict";

var RU = {};

RU.isRegExp = function (re) {
    return re && re.constructor === RegExp;
};

/**
 * Return the regexp source of either a regexp or a regexp matching a
 * passed-in string.
 */
RU.toSource = function (re) {
    if (RU.isRegExp(re)) {
        return re.source;
    } else {
        return RU.escapeRegExp(re);
    }
};

/**
 * Escape special regexp characters in a string used to build a regexp
 */
RU.escapeRegExp = function(re) {
	return re.replace(/[\^\\$*+?.()|{}\[\]\/]/g, '\\$&');
};

var OPEN_GROUP = /(^|[^\\])\((?!\?:)/;
/**
 * Convert all capturing groups in a regexp string into non-capturing ones
 *
 * FIXME: Don't match parens in char classes
 */
RU.makeGroupsNonCapturing = function (re) {
    // Make capturing groups non-capturing
    var match = re.match(OPEN_GROUP);
    while (match) {
        re = re.replace(OPEN_GROUP, '$1(?:');
        match = re.match(OPEN_GROUP);
    }
    return re;
};

/**
 * Determine how many capturing groups a regexp contains
 */
RU.countCapturingGroups = function numberOfGroups (re) {
    // Construct a regexp that always matches
    var testRe = new RegExp('|' + re);
    // And use the length of the result to determine the number of groups
    return ''.match(testRe).length - 1;
};

/**
 * Build a regexp-based switch
 *
 * Creates a matcher from an array of a mix of
 * - a regexp
 * - a string
 * - an array of [regexp or string, value]
 *
 * The matcher can then be applied to an input string, and yields either null
 * if nothing matched, or a result object like this:
 *
 * { match: [ 'foo', 'o', index: 0, input: 'foo' ],
 *   value: 'foo matched!' }
 *
 * The value is the optional value passed in as the second member in the
 * array, or undefined.
 * */
RU.makeRegExpSwitch = function (regexps) {
    var reBits = [],
        matchers = {},
        values = {},
        reOffset = 0,
        reBit;
    regexps.forEach(function(re) {
        if (Array.isArray(re)) {
            values[reOffset] = re[1];
            re = re[0];
        }
        if (RU.isRegExp(re)) {
            reBit = RU.toSource(re);
            if (re.length === undefined) {
                re.length = RU.countCapturingGroups(reBit);
            }
            matchers[reOffset] = re;
            reOffset += re.length + 1;
        } else {
            reBit = RU.escapeRegExp(re);
            reOffset++;
        }
        reBits.push('(' + reBit + ')');
    });
    var switchRe = new RegExp(reBits.join('|'));
    return function regExpSwitcher (s) {
        var match = s.match(switchRe);
        if (match) {
            var i = 1, l = match.length;
            for (; i < l; i++) {
                if (match[i]) {
                    break;
                }
            }
            if (matchers[i-1]) {
                // extract the capturing group results
                var newMatch = match.slice(i, i + matchers[i-1].length + 1);
                newMatch.index = match.index;
                newMatch.input = s;
                match = newMatch;
            } else {
                match = [match[0], match[i]];
                match.index = 0;
                match.input = s;
            }
            return {
                match: match,
                value: values[i-1]
            };
        } else {
            return null;
        }
    };
};


module.exports = RU;
