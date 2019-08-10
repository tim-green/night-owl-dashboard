//! moment.js
//! version : 2.19.4
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

var hookCallback;

function hooks () {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback (callback) {
    hookCallback = callback;
}

function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
}

function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
}

function isObjectEmpty(obj) {
    if (Object.getOwnPropertyNames) {
        return (Object.getOwnPropertyNames(obj).length === 0);
    } else {
        var k;
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                return false;
            }
        }
        return true;
    }
}

function isUndefined(input) {
    return input === void 0;
}

function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
}

function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
    }
    return res;
}

function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
    for (var i in b) {
        if (hasOwnProp(b, i)) {
            a[i] = b[i];
        }
    }

    if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
    }

    return a;
}

function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null,
        rfc2822         : false,
        weekdayMismatch : false
    };
}

function getParsingFlags(m) {
    if (m._pf == null) {
        m._pf = defaultParsingFlags();
    }
    return m._pf;
}

var some;
if (Array.prototype.some) {
    some = Array.prototype.some;
} else {
    some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(this, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

function isValid(m) {
    if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some.call(flags.parsedDateParts, function (i) {
            return i != null;
        });
        var isNowValid = !isNaN(m._d.getTime()) &&
            flags.overflow < 0 &&
            !flags.empty &&
            !flags.invalidMonth &&
            !flags.invalidWeekday &&
            !flags.weekdayMismatch &&
            !flags.nullInput &&
            !flags.invalidFormat &&
            !flags.userInvalidated &&
            (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
            isNowValid = isNowValid &&
                flags.charsLeftOver === 0 &&
                flags.unusedTokens.length === 0 &&
                flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        }
        else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    }
    else {
        getParsingFlags(m).userInvalidated = true;
    }

    return m;
}

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
var momentProperties = hooks.momentProperties = [];

function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
        to._i = from._i;
    }
    if (!isUndefined(from._f)) {
        to._f = from._f;
    }
    if (!isUndefined(from._l)) {
        to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
        to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
        to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
        to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
        for (i = 0; i < momentProperties.length; i++) {
            prop = momentProperties[i];
            val = from[prop];
            if (!isUndefined(val)) {
                to[prop] = val;
            }
        }
    }

    return to;
}

var updateInProgress = false;

// Moment prototype object
function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
        this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
        updateInProgress = true;
        hooks.updateOffset(this);
        updateInProgress = false;
    }
}

function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
}

function absFloor (number) {
    if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
    } else {
        return Math.floor(number);
    }
}

function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
    }

    return value;
}

// compare two arrays, return the number of differences
function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
    for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
            (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
    }
}

function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
            var args = [];
            var arg;
            for (var i = 0; i < arguments.length; i++) {
                arg = '';
                if (typeof arguments[i] === 'object') {
                    arg += '\n[' + i + '] ';
                    for (var key in arguments[0]) {
                        arg += key + ': ' + arguments[0][key] + ', ';
                    }
                    arg = arg.slice(0, -2); // Remove trailing comma and space
                } else {
                    arg = arguments[i];
                }
                args.push(arg);
            }
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
            firstTime = false;
        }
        return fn.apply(this, arguments);
    }, fn);
}

var deprecations = {};

function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
    }
}

hooks.suppressDeprecationWarnings = false;
hooks.deprecationHandler = null;

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}

function set (config) {
    var prop, i;
    for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
            this[i] = prop;
        } else {
            this['_' + i] = prop;
        }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
    // TODO: Remove "ordinalParse" fallback in next major release.
    this._dayOfMonthOrdinalParseLenient = new RegExp(
        (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
            '|' + (/\d{1,2}/).source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                res[prop] = {};
                extend(res[prop], parentConfig[prop]);
                extend(res[prop], childConfig[prop]);
            } else if (childConfig[prop] != null) {
                res[prop] = childConfig[prop];
            } else {
                delete res[prop];
            }
        }
    }
    for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])) {
            // make sure changes to properties don't modify parent config
            res[prop] = extend({}, res[prop]);
        }
    }
    return res;
}

function Locale(config) {
    if (config != null) {
        this.set(config);
    }
}

var keys;

if (Object.keys) {
    keys = Object.keys;
} else {
    keys = function (obj) {
        var i, res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
};

function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat (key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
        return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
    });

    return this._longDateFormat[key];
}

var defaultInvalidDate = 'Invalid date';

function invalidDate () {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

function ordinal (number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    ss : '%d seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
};

function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
}

function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
}

function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
}

function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
            normalizedProp = normalizeUnits(prop);
            if (normalizedProp) {
                normalizedInput[normalizedProp] = inputObject[prop];
            }
        }
    }

    return normalizedInput;
}

var priorities = {};

function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
}

function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function () {
            return this[callback]();
        };
    }
    if (token) {
        formatTokenFunctions[token] = func;
    }
    if (padded) {
        formatTokenFunctions[padded[0]] = function () {
            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
    }
    if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
            return this.localeData().ordinal(func.apply(this, arguments), token);
        };
    }
}

function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
}

function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
            output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
        }
        return output;
    };
}

// format date using native date object
function formatMoment(m, format) {
    if (!m.isValid()) {
        return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
}

function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
    }

    return format;
}

var match1         = /\d/;            //       0 - 9
var match2         = /\d\d/;          //      00 - 99
var match3         = /\d{3}/;         //     000 - 999
var match4         = /\d{4}/;         //    0000 - 9999
var match6         = /[+-]?\d{6}/;    // -999999 - 999999
var match1to2      = /\d\d?/;         //       0 - 99
var match3to4      = /\d\d\d\d?/;     //     999 - 9999
var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3      = /\d{1,3}/;       //       0 - 999
var match1to4      = /\d{1,4}/;       //       0 - 9999
var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

var matchUnsigned  = /\d+/;           //       0 - inf
var matchSigned    = /[+-]?\d+/;      //    -inf - inf

var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;


var regexes = {};

function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
    };
}

function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
}

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
    }));
}

function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var tokens = {};

function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function (input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
    });
}

function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
    }
}

var YEAR = 0;
var MONTH = 1;
var DATE = 2;
var HOUR = 3;
var MINUTE = 4;
var SECOND = 5;
var MILLISECOND = 6;
var WEEK = 7;
var WEEKDAY = 8;

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY',   4],       0, 'year');
addFormatToken(0, ['YYYYY',  5],       0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y',      matchSigned);
addRegexToken('YY',     match1to2, match2);
addRegexToken('YYYY',   match1to4, match4);
addRegexToken('YYYYY',  match1to6, match6);
addRegexToken('YYYYYY', match1to6, match6);

addParseToken(['YYYYY', 'YYYYYY'], YEAR);
addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
});
addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
});
addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
});

// HELPERS

function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear () {
    return isLeapYear(this.year());
}

function makeGetSet (unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$1(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get(this, unit);
        }
    };
}

function get (mom, unit) {
    return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$1 (mom, unit, value) {
    if (mom.isValid() && !isNaN(value)) {
        if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
        }
        else {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }
}

// MOMENTS

function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}


function stringSet (units, value) {
    if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
            this[prioritized[i].unit](units[prioritized[i].unit]);
        }
    } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units](value);
        }
    }
    return this;
}

function mod(n, x) {
    return ((n % x) + x) % x;
}

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
            if (this[i] === o) {
                return i;
            }
        }
        return -1;
    };
}

function daysInMonth(year, month) {
    if (isNaN(year) || isNaN(month)) {
        return NaN;
    }
    var modMonth = mod(month, 12);
    year += (month - modMonth) / 12;
    return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
}

// FORMATTING

addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
});

addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
});

addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
});

// ALIASES

addUnitAlias('month', 'M');

// PRIORITY

addUnitPriority('month', 8);

// PARSING

addRegexToken('M',    match1to2);
addRegexToken('MM',   match1to2, match2);
addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
});
addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
});

addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
});

addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
        array[MONTH] = month;
    } else {
        getParsingFlags(config).invalidMonth = input;
    }
});

// LOCALES

var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
function localeMonths (m, format) {
    if (!m) {
        return isArray(this._months) ? this._months :
            this._months['standalone'];
    }
    return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort (m, format) {
    if (!m) {
        return isArray(this._monthsShort) ? this._monthsShort :
            this._monthsShort['standalone'];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
            mom = createUTC([2000, i]);
            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'MMM') {
            ii = indexOf.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'MMM') {
            ii = indexOf.call(this._shortMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._longMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
        return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
        }
    }
}

// MOMENTS

function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
        // No op
        return mom;
    }

    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            value = toInt(value);
        } else {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (!isNumber(value)) {
                return mom;
            }
        }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
}

function getSetMonth (value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get(this, 'Month');
    }
}

function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsShortStrictRegex;
        } else {
            return this._monthsShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
            this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
            this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsStrictRegex;
        } else {
            return this._monthsRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
            this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
            this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
}

function createDate (y, m, d, h, M, s, ms) {
    // can't just apply() to create a date:
    // https://stackoverflow.com/q/181348
    var date = new Date(y, m, d, h, M, s, ms);

    // the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    // the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
    }
    return date;
}

// start-of-first-week - start-of-year
function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
}

// https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

    if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
    } else {
        resYear = year;
        resDayOfYear = dayOfYear;
    }

    return {
        year: resYear,
        dayOfYear: resDayOfYear
    };
}

function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

    if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
    } else {
        resYear = mom.year();
        resWeek = week;
    }

    return {
        week: resWeek,
        year: resYear
    };
}

function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
}

// FORMATTING

addFormatToken('w', ['ww', 2], 'wo', 'week');
addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

addUnitAlias('week', 'w');
addUnitAlias('isoWeek', 'W');

// PRIORITIES

addUnitPriority('week', 5);
addUnitPriority('isoWeek', 5);

// PARSING

addRegexToken('w',  match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W',  match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek () {
    return this._week.dow;
}

function localeFirstDayOfYear () {
    return this._week.doy;
}

// MOMENTS

function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
}

// FORMATTING

addFormatToken('d', 0, 'do', 'day');

addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
});

addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
});

addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
});

addFormatToken('e', 0, 0, 'weekday');
addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

addUnitAlias('day', 'd');
addUnitAlias('weekday', 'e');
addUnitAlias('isoWeekday', 'E');

// PRIORITY
addUnitPriority('day', 11);
addUnitPriority('weekday', 11);
addUnitPriority('isoWeekday', 11);

// PARSING

addRegexToken('d',    match1to2);
addRegexToken('e',    match1to2);
addRegexToken('E',    match1to2);
addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
});

addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
        week.d = weekday;
    } else {
        getParsingFlags(config).invalidWeekday = input;
    }
});

addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
});

// HELPERS

function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
        return input;
    }

    if (!isNaN(input)) {
        return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
        return input;
    }

    return null;
}

function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
}

// LOCALES

var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
function localeWeekdays (m, format) {
    if (!m) {
        return isArray(this._weekdays) ? this._weekdays :
            this._weekdays['standalone'];
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
            mom = createUTC([2000, 1]).day(i);
            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'dddd') {
            ii = indexOf.call(this._weekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'dddd') {
            ii = indexOf.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._minWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
        return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
            return i;
        }
    }
}

// MOMENTS

function getSetDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
    } else {
        return day;
    }
}

function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
        return this.day() || 7;
    }
}

var defaultWeekdaysRegex = matchWord;
function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysStrictRegex;
        } else {
            return this._weekdaysRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
            this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysShortStrictRegex;
        } else {
            return this._weekdaysShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysMinStrictRegex;
        } else {
            return this._weekdaysMinRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}


function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
}

// FORMATTING

function hFormat() {
    return this.hours() % 12 || 12;
}

function kFormat() {
    return this.hours() || 24;
}

addFormatToken('H', ['HH', 2], 0, 'hour');
addFormatToken('h', ['hh', 2], 0, hFormat);
addFormatToken('k', ['kk', 2], 0, kFormat);

addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
});

addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
}

meridiem('a', true);
meridiem('A', false);

// ALIASES

addUnitAlias('hour', 'h');

// PRIORITY
addUnitPriority('hour', 13);

// PARSING

function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a',  matchMeridiem);
addRegexToken('A',  matchMeridiem);
addRegexToken('H',  match1to2);
addRegexToken('h',  match1to2);
addRegexToken('k',  match1to2);
addRegexToken('HH', match1to2, match2);
addRegexToken('hh', match1to2, match2);
addRegexToken('kk', match1to2, match2);

addRegexToken('hmm', match3to4);
addRegexToken('hmmss', match5to6);
addRegexToken('Hmm', match3to4);
addRegexToken('Hmmss', match5to6);

addParseToken(['H', 'HH'], HOUR);
addParseToken(['k', 'kk'], function (input, array, config) {
    var kInput = toInt(input);
    array[HOUR] = kInput === 24 ? 0 : kInput;
});
addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
});
addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
});
addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
});
addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
});

// LOCALES

function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
};

// internal storage for locale config files
var locales = {};
var localeFamilies = {};
var globalLocale;

function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
}

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
            locale = loadLocale(split.slice(0, j).join('-'));
            if (locale) {
                return locale;
            }
            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                //the next array item is better than a shallower substring of this one
                break;
            }
            j--;
        }
        i++;
    }
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
            module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            var aliasedRequire = require;
            aliasedRequire('./locale/' + name);
            getSetGlobalLocale(oldLocale);
        } catch (e) {}
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        }
        else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale (name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
            } else {
                if (!localeFamilies[config.parentLocale]) {
                    localeFamilies[config.parentLocale] = [];
                }
                localeFamilies[config.parentLocale].push({
                    name: name,
                    config: config
                });
                return null;
            }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        if (localeFamilies[name]) {
            localeFamilies[name].forEach(function (x) {
                defineLocale(x.name, x.config);
            });
        }

        // backwards compat for now: also set the locale
        // make sure we set the locale AFTER all child locales have been
        // created, so we won't end up with the child locale set.
        getSetGlobalLocale(name);


        return locales[name];
    } else {
        // useful for testing
        delete locales[name];
        return null;
    }
}

function updateLocale(name, config) {
    if (config != null) {
        var locale, tmpLocale, parentConfig = baseConfig;
        // MERGE
        tmpLocale = loadLocale(name);
        if (tmpLocale != null) {
            parentConfig = tmpLocale._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        getSetGlobalLocale(name);
    } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
            if (locales[name].parentLocale != null) {
                locales[name] = locales[name].parentLocale;
            } else if (locales[name] != null) {
                delete locales[name];
            }
        }
    }
    return locales[name];
}

// returns locale data
function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
    }

    if (!key) {
        return globalLocale;
    }

    if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
            return locale;
        }
        key = [key];
    }

    return chooseLocale(key);
}

function listLocales() {
    return keys(locales);
}

function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow =
            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
            -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
            overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
            overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
            overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
    }

    return m;
}

// Pick the first defined of two or three arguments.
function defaults(a, b, c) {
    if (a != null) {
        return a;
    }
    if (b != null) {
        return b;
    }
    return c;
}

function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
}

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
function configFromArray (config) {
    var i, date, input = [], currentDate, expectedWeekday, yearToUse;

    if (config._d) {
        return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear != null) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
            getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
    }

    // check for mismatching day of week
    if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
        getParsingFlags(config).weekdayMismatch = true;
    }
}

function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults(w.w, curWeek.week);

        if (w.d != null) {
            // weekday -- low day numbers are considered next week
            weekday = w.d;
            if (weekday < 0 || weekday > 6) {
                weekdayOverflow = true;
            }
        } else if (w.e != null) {
            // local weekday -- counting starts from begining of week
            weekday = w.e + dow;
            if (w.e < 0 || w.e > 6) {
                weekdayOverflow = true;
            }
        } else {
            // default to begining of week
            weekday = dow;
        }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
    } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }
}

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                dateFormat = isoDates[i][0];
                allowTime = isoDates[i][2] !== false;
                break;
            }
        }
        if (dateFormat == null) {
            config._isValid = false;
            return;
        }
        if (match[3]) {
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(match[3])) {
                    // match[2] should be 'T' or space
                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (timeFormat == null) {
                config._isValid = false;
                return;
            }
        }
        if (!allowTime && timeFormat != null) {
            config._isValid = false;
            return;
        }
        if (match[4]) {
            if (tzRegex.exec(match[4])) {
                tzFormat = 'Z';
            } else {
                config._isValid = false;
                return;
            }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
    var result = [
        untruncateYear(yearStr),
        defaultLocaleMonthsShort.indexOf(monthStr),
        parseInt(dayStr, 10),
        parseInt(hourStr, 10),
        parseInt(minuteStr, 10)
    ];

    if (secondStr) {
        result.push(parseInt(secondStr, 10));
    }

    return result;
}

function untruncateYear(yearStr) {
    var year = parseInt(yearStr, 10);
    if (year <= 49) {
        return 2000 + year;
    } else if (year <= 999) {
        return 1900 + year;
    }
    return year;
}

function preprocessRFC2822(s) {
    // Remove comments and folding whitespace and replace multiple-spaces with a single space
    return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').trim();
}

function checkWeekday(weekdayStr, parsedInput, config) {
    if (weekdayStr) {
        // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
        var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
            weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
        if (weekdayProvided !== weekdayActual) {
            getParsingFlags(config).weekdayMismatch = true;
            config._isValid = false;
            return false;
        }
    }
    return true;
}

var obsOffsets = {
    UT: 0,
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60
};

function calculateOffset(obsOffset, militaryOffset, numOffset) {
    if (obsOffset) {
        return obsOffsets[obsOffset];
    } else if (militaryOffset) {
        // the only allowed military tz is Z
        return 0;
    } else {
        var hm = parseInt(numOffset, 10);
        var m = hm % 100, h = (hm - m) / 100;
        return h * 60 + m;
    }
}

// date and time from ref 2822 format
function configFromRFC2822(config) {
    var match = rfc2822.exec(preprocessRFC2822(config._i));
    if (match) {
        var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
        if (!checkWeekday(match[1], parsedArray, config)) {
            return;
        }

        config._a = parsedArray;
        config._tzm = calculateOffset(match[8], match[9], match[10]);

        config._d = createUTCDate.apply(null, config._a);
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

        getParsingFlags(config).rfc2822 = true;
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
    } else {
        return;
    }

    configFromRFC2822(config);
    if (config._isValid === false) {
        delete config._isValid;
    } else {
        return;
    }

    // Final attempt, use Input Fallback
    hooks.createFromInputFallback(config);
}

hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);

// constant that refers to the ISO standard
hooks.ISO_8601 = function () {};

// constant that refers to the RFC 2822 form
hooks.RFC_2822 = function () {};

// date from string and format string
function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
    }
    if (config._f === hooks.RFC_2822) {
        configFromRFC2822(config);
        return;
    }
    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
            skipped = string.substr(0, string.indexOf(parsedInput));
            if (skipped.length > 0) {
                getParsingFlags(config).unusedInput.push(skipped);
            }
            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
            if (parsedInput) {
                getParsingFlags(config).empty = false;
            }
            else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}


function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
        // nothing to do
        return hour;
    }
    if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
            hour += 12;
        }
        if (!isPm && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // this is not supposed to happen
        return hour;
    }
}

// date from string and array of format strings
function configFromStringAndArray(config) {
    var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

    if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
    }

    for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
            tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!isValid(tempConfig)) {
            continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
            scoreToBeat = currentScore;
            bestMoment = tempConfig;
        }
    }

    extend(config, bestMoment || tempConfig);
}

function configFromObject(config) {
    if (config._d) {
        return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
    });

    configFromArray(config);
}

function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig (config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
        return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
        return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
        config._d = input;
    } else if (isArray(format)) {
        configFromStringAndArray(config);
    } else if (format) {
        configFromStringAndFormat(config);
    }  else {
        configFromInput(config);
    }

    if (!isValid(config)) {
        config._d = null;
    }

    return config;
}

function configFromInput(config) {
    var input = config._i;
    if (isUndefined(input)) {
        config._d = new Date(hooks.now());
    } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
        configFromString(config);
    } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
            return parseInt(obj, 10);
        });
        configFromArray(config);
    } else if (isObject(input)) {
        configFromObject(config);
    } else if (isNumber(input)) {
        // from milliseconds
        config._d = new Date(input);
    } else {
        hooks.createFromInputFallback(config);
    }
}

function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)) {
        input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
}

function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other < this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other > this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
    }
    if (!moments.length) {
        return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
            res = moments[i];
        }
    }
    return res;
}

// TODO: Use [].sort instead?
function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function () {
    return Date.now ? Date.now() : +(new Date());
};

var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

function isDurationValid(m) {
    for (var key in m) {
        if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
            return false;
        }
    }

    var unitHasDecimal = false;
    for (var i = 0; i < ordering.length; ++i) {
        if (m[ordering[i]]) {
            if (unitHasDecimal) {
                return false; // only allow non-integers for smallest unit
            }
            if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                unitHasDecimal = true;
            }
        }
    }

    return true;
}

function isValid$1() {
    return this._isValid;
}

function createInvalid$1() {
    return createDuration(NaN);
}

function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

    this._isValid = isDurationValid(normalizedInput);

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
        weeks * 7;
    // It is impossible to translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
        quarters * 3 +
        years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration (obj) {
    return obj instanceof Duration;
}

function absRound (number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z',  matchShortOffset);
addRegexToken('ZZ', matchShortOffset);
addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
});

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
var chunkOffset = /([\+\-]|\d\d)/gi;

function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
        return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
}

// Return a moment from input, that is local/utc/zone equivalent to model.
function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        hooks.updateOffset(res, false);
        return res;
    } else {
        return createLocal(input).local();
    }
}

function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
}

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
function getSetOffset (input, keepLocalTime, keepMinutes) {
    var offset = this._offset || 0,
        localAdjust;
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    if (input != null) {
        if (typeof input === 'string') {
            input = offsetFromString(matchShortOffset, input);
            if (input === null) {
                return this;
            }
        } else if (Math.abs(input) < 16 && !keepMinutes) {
            input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
            localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
            this.add(localAdjust, 'm');
        }
        if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
                this._changeInProgress = true;
                hooks.updateOffset(this, true);
                this._changeInProgress = null;
            }
        }
        return this;
    } else {
        return this._isUTC ? offset : getDateOffset(this);
    }
}

function getSetZone (input, keepLocalTime) {
    if (input != null) {
        if (typeof input !== 'string') {
            input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
    } else {
        return -this.utcOffset();
    }
}

function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset () {
    if (this._tzm != null) {
        this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        }
        else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime () {
    return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
    );
}

function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
            compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal () {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
}

function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

function createDuration (input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms : input._milliseconds,
            d  : input._days,
            M  : input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y  : 0,
            d  : toInt(match[DATE])                         * sign,
            h  : toInt(match[HOUR])                         * sign,
            m  : toInt(match[MINUTE])                       * sign,
            s  : toInt(match[SECOND])                       * sign,
            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : (match[1] === '+') ? 1 : 1;
        duration = {
            y : parseIso(match[2], sign),
            M : parseIso(match[3], sign),
            w : parseIso(match[4], sign),
            d : parseIso(match[5], sign),
            h : parseIso(match[6], sign),
            m : parseIso(match[7], sign),
            s : parseIso(match[8], sign)
        };
    } else if (duration == null) {// checks for null or undefined
        duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
    }

    return ret;
}

createDuration.fn = Duration.prototype;
createDuration.invalid = createInvalid$1;

function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
    } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
    }

    return res;
}

// TODO: remove 'name' arg after deprecation is removed
function createAdder(direction, name) {
    return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (months) {
        setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (days) {
        set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add      = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
            diff < -1 ? 'lastWeek' :
            diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
            diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone () {
    return new Moment(this);
}

function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
    } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
}

function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
    } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
}

function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
    } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
}

function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
}

function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
}

function diff (input, units, asFloat) {
    var that,
        zoneDelta,
        delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    switch (units) {
        case 'year': output = monthDiff(this, that) / 12; break;
        case 'month': output = monthDiff(this, that); break;
        case 'quarter': output = monthDiff(this, that) / 3; break;
        case 'second': output = (this - that) / 1e3; break; // 1000
        case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
        case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
        case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
        case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
        default: output = this - that;
    }

    return asFloat ? output : absFloor(output);
}

function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

    if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
    } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
}

hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString() {
    if (!this.isValid()) {
        return null;
    }
    var m = this.clone().utc();
    if (m.year() < 0 || m.year() > 9999) {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
    if (isFunction(Date.prototype.toISOString)) {
        // native implementation is ~50x faster, use it when we can
        return this.toDate().toISOString();
    }
    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect () {
    if (!this.isValid()) {
        return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
        zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format (inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale (key) {
    var newLocaleData;

    if (key === undefined) {
        return this._locale._abbr;
    } else {
        newLocaleData = getLocale(key);
        if (newLocaleData != null) {
            this._locale = newLocaleData;
        }
        return this;
    }
}

var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
        if (key === undefined) {
            return this.localeData();
        } else {
            return this.locale(key);
        }
    }
);

function localeData () {
    return this._locale;
}

function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
        this.weekday(0);
    }
    if (units === 'isoWeek') {
        this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
}

function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
}

function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
}

function unix () {
    return Math.floor(this.valueOf() / 1000);
}

function toDate () {
    return new Date(this.valueOf());
}

function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject () {
    var m = this;
    return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
    };
}

function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$2 () {
    return isValid(this);
}

function parsingFlags () {
    return extend({}, getParsingFlags(this));
}

function invalidAt () {
    return getParsingFlags(this).overflow;
}

function creationData() {
    return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
    };
}

// FORMATTING

addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
});

addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
});

function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg',     'weekYear');
addWeekYearFormatToken('ggggg',    'weekYear');
addWeekYearFormatToken('GGGG',  'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);


// PARSING

addRegexToken('G',      matchSigned);
addRegexToken('g',      matchSigned);
addRegexToken('GG',     match1to2, match2);
addRegexToken('gg',     match1to2, match2);
addRegexToken('GGGG',   match1to4, match4);
addRegexToken('gggg',   match1to4, match4);
addRegexToken('GGGGG',  match1to6, match6);
addRegexToken('ggggg',  match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy);
}

function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
}

function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
        return weekOfYear(this, dow, doy).year;
    } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
            week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
}

function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
}

// FORMATTING

addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

addUnitAlias('quarter', 'Q');

// PRIORITY

addUnitPriority('quarter', 7);

// PARSING

addRegexToken('Q', match1);
addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
});

// MOMENTS

function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D',  match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    // TODO: Remove "ordinalParse" fallback in next major release.
    return isStrict ?
      (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
      locale._dayOfMonthOrdinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0]);
});

// MOMENTS

var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
addUnitPriority('dayOfYear', 4);

// PARSING

addRegexToken('DDD',  match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m',  match1to2);
addRegexToken('mm', match1to2, match2);
addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

addUnitAlias('second', 's');

// PRIORITY

addUnitPriority('second', 15);

// PARSING

addRegexToken('s',  match1to2);
addRegexToken('ss', match1to2, match2);
addParseToken(['s', 'ss'], SECOND);

// MOMENTS

var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
});

addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
});

addFormatToken(0, ['SSS', 3], 0, 'millisecond');
addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
});
addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
});
addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
});
addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
});
addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
});
addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
});


// ALIASES

addUnitAlias('millisecond', 'ms');

// PRIORITY

addUnitPriority('millisecond', 16);

// PARSING

addRegexToken('S',    match1to3, match1);
addRegexToken('SS',   match1to3, match2);
addRegexToken('SSS',  match1to3, match3);

var token;
for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
}

function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
}

for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
}
// MOMENTS

var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

addFormatToken('z',  0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add               = add;
proto.calendar          = calendar$1;
proto.clone             = clone;
proto.diff              = diff;
proto.endOf             = endOf;
proto.format            = format;
proto.from              = from;
proto.fromNow           = fromNow;
proto.to                = to;
proto.toNow             = toNow;
proto.get               = stringGet;
proto.invalidAt         = invalidAt;
proto.isAfter           = isAfter;
proto.isBefore          = isBefore;
proto.isBetween         = isBetween;
proto.isSame            = isSame;
proto.isSameOrAfter     = isSameOrAfter;
proto.isSameOrBefore    = isSameOrBefore;
proto.isValid           = isValid$2;
proto.lang              = lang;
proto.locale            = locale;
proto.localeData        = localeData;
proto.max               = prototypeMax;
proto.min               = prototypeMin;
proto.parsingFlags      = parsingFlags;
proto.set               = stringSet;
proto.startOf           = startOf;
proto.subtract          = subtract;
proto.toArray           = toArray;
proto.toObject          = toObject;
proto.toDate            = toDate;
proto.toISOString       = toISOString;
proto.inspect           = inspect;
proto.toJSON            = toJSON;
proto.toString          = toString;
proto.unix              = unix;
proto.valueOf           = valueOf;
proto.creationData      = creationData;

// Year
proto.year       = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear    = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month       = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week           = proto.weeks        = getSetWeek;
proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
proto.weeksInYear    = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date       = getSetDayOfMonth;
proto.day        = proto.days             = getSetDayOfWeek;
proto.weekday    = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear  = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset            = getSetOffset;
proto.utc                  = setOffsetToUTC;
proto.local                = setOffsetToLocal;
proto.parseZone            = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST                = isDaylightSavingTime;
proto.isLocal              = isLocal;
proto.isUtcOffset          = isUtcOffset;
proto.isUtc                = isUtc;
proto.isUTC                = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix (input) {
    return createLocal(input * 1000);
}

function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat (string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar        = calendar;
proto$1.longDateFormat  = longDateFormat;
proto$1.invalidDate     = invalidDate;
proto$1.ordinal         = ordinal;
proto$1.preparse        = preParsePostFormat;
proto$1.postformat      = preParsePostFormat;
proto$1.relativeTime    = relativeTime;
proto$1.pastFuture      = pastFuture;
proto$1.set             = set;

// Month
proto$1.months            =        localeMonths;
proto$1.monthsShort       =        localeMonthsShort;
proto$1.monthsParse       =        localeMonthsParse;
proto$1.monthsRegex       = monthsRegex;
proto$1.monthsShortRegex  = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays       =        localeWeekdays;
proto$1.weekdaysMin    =        localeWeekdaysMin;
proto$1.weekdaysShort  =        localeWeekdaysShort;
proto$1.weekdaysParse  =        localeWeekdaysParse;

proto$1.weekdaysRegex       =        weekdaysRegex;
proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$1(format, i, field, 'month');
    }
    return out;
}

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
        return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
}

function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil (number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as (units) {
    if (!this.isValid()) {
        return NaN;
    }
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week'   : return days / 7     + milliseconds / 6048e5;
            case 'day'    : return days         + milliseconds / 864e5;
            case 'hour'   : return days * 24    + milliseconds / 36e5;
            case 'minute' : return days * 1440  + milliseconds / 6e4;
            case 'second' : return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
            default: throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1 () {
    if (!this.isValid()) {
        return NaN;
    }
    return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
    );
}

function makeAs (alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds      = makeAs('s');
var asMinutes      = makeAs('m');
var asHours        = makeAs('h');
var asDays         = makeAs('d');
var asWeeks        = makeAs('w');
var asMonths       = makeAs('M');
var asYears        = makeAs('y');

function clone$1 () {
    return createDuration(this);
}

function get$2 (units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
}

function makeGetter(name) {
    return function () {
        return this.isValid() ? this._data[name] : NaN;
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds      = makeGetter('seconds');
var minutes      = makeGetter('minutes');
var hours        = makeGetter('hours');
var days         = makeGetter('days');
var months       = makeGetter('months');
var years        = makeGetter('years');

function weeks () {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    ss: 44,         // a few seconds to seconds
    s : 45,         // seconds to minute
    m : 45,         // minutes to hour
    h : 22,         // hours to day
    d : 26,         // days to month
    M : 11          // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds <= thresholds.ss && ['s', seconds]  ||
            seconds < thresholds.s   && ['ss', seconds] ||
            minutes <= 1             && ['m']           ||
            minutes < thresholds.m   && ['mm', minutes] ||
            hours   <= 1             && ['h']           ||
            hours   < thresholds.h   && ['hh', hours]   ||
            days    <= 1             && ['d']           ||
            days    < thresholds.d   && ['dd', days]    ||
            months  <= 1             && ['M']           ||
            months  < thresholds.M   && ['MM', months]  ||
            years   <= 1             && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
        return false;
    }
    if (limit === undefined) {
        return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    if (threshold === 's') {
        thresholds.ss = limit - 1;
    }
    return true;
}

function humanize (withSuffix) {
    if (!this.isValid()) {
        return this.localeData().invalidDate();
    }

    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
        output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
}

var abs$1 = Math.abs;

function sign(x) {
    return ((x > 0) - (x < 0)) || +x;
}

function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    if (!this.isValid()) {
        return this.localeData().invalidDate();
    }

    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    var totalSign = total < 0 ? '-' : '';
    var ymSign = sign(this._months) !== sign(total) ? '-' : '';
    var daysSign = sign(this._days) !== sign(total) ? '-' : '';
    var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

    return totalSign + 'P' +
        (Y ? ymSign + Y + 'Y' : '') +
        (M ? ymSign + M + 'M' : '') +
        (D ? daysSign + D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? hmsSign + h + 'H' : '') +
        (m ? hmsSign + m + 'M' : '') +
        (s ? hmsSign + s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.isValid        = isValid$1;
proto$2.abs            = abs;
proto$2.add            = add$1;
proto$2.subtract       = subtract$1;
proto$2.as             = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds      = asSeconds;
proto$2.asMinutes      = asMinutes;
proto$2.asHours        = asHours;
proto$2.asDays         = asDays;
proto$2.asWeeks        = asWeeks;
proto$2.asMonths       = asMonths;
proto$2.asYears        = asYears;
proto$2.valueOf        = valueOf$1;
proto$2._bubble        = bubble;
proto$2.clone          = clone$1;
proto$2.get            = get$2;
proto$2.milliseconds   = milliseconds;
proto$2.seconds        = seconds;
proto$2.minutes        = minutes;
proto$2.hours          = hours;
proto$2.days           = days;
proto$2.weeks          = weeks;
proto$2.months         = months;
proto$2.years          = years;
proto$2.humanize       = humanize;
proto$2.toISOString    = toISOString$1;
proto$2.toString       = toISOString$1;
proto$2.toJSON         = toISOString$1;
proto$2.locale         = locale;
proto$2.localeData     = localeData;

// Deprecations
proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
proto$2.lang = lang;

// Side effect imports

// FORMATTING

addFormatToken('X', 0, 0, 'unix');
addFormatToken('x', 0, 0, 'valueOf');

// PARSING

addRegexToken('x', matchSigned);
addRegexToken('X', matchTimestamp);
addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
});
addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
});

// Side effect imports


hooks.version = '2.19.4';

setHookCallback(createLocal);

hooks.fn                    = proto;
hooks.min                   = min;
hooks.max                   = max;
hooks.now                   = now;
hooks.utc                   = createUTC;
hooks.unix                  = createUnix;
hooks.months                = listMonths;
hooks.isDate                = isDate;
hooks.locale                = getSetGlobalLocale;
hooks.invalid               = createInvalid;
hooks.duration              = createDuration;
hooks.isMoment              = isMoment;
hooks.weekdays              = listWeekdays;
hooks.parseZone             = createInZone;
hooks.localeData            = getLocale;
hooks.isDuration            = isDuration;
hooks.monthsShort           = listMonthsShort;
hooks.weekdaysMin           = listWeekdaysMin;
hooks.defineLocale          = defineLocale;
hooks.updateLocale          = updateLocale;
hooks.locales               = listLocales;
hooks.weekdaysShort         = listWeekdaysShort;
hooks.normalizeUnits        = normalizeUnits;
hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat        = getCalendarFormat;
hooks.prototype             = proto;

return hooks;

})));

/*@preserve
 * Tempus Dominus Bootstrap4 v5.0.0-alpha14 (https://tempusdominus.github.io/bootstrap-4/)
 * Copyright 2016-2017 Jonathan Peterson
 * Licensed under MIT (https://github.com/tempusdominus/bootstrap-3/blob/master/LICENSE)
 */

if (typeof jQuery === 'undefined') {
  throw new Error('Tempus Dominus Bootstrap4\'s requires jQuery. jQuery must be included before Tempus Dominus Bootstrap4\'s JavaScript.');
}

+function ($) {
  var version = $.fn.jquery.split(' ')[0].split('.');
  if ((version[0] < 2 && version[1] < 9) || (version[0] === 1 && version[1] === 9 && version[2] < 1) || (version[0] >= 4)) {
    throw new Error('Tempus Dominus Bootstrap4\'s requires at least jQuery v1.9.1 but less than v4.0.0');
  }
}(jQuery);


if (typeof moment === 'undefined') {
  throw new Error('Tempus Dominus Bootstrap4\'s requires moment.js. Moment.js must be included before Tempus Dominus Bootstrap4\'s JavaScript.');
}

var version = moment.version.split('.')
if ((version[0] <= 2 && version[1] < 17) || (version[0] >= 3)) {
  throw new Error('Tempus Dominus Bootstrap4\'s requires at least moment.js v2.17.0 but less than v3.0.0');
}

+function () {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ReSharper disable once InconsistentNaming
var DateTimePicker = function ($, moment) {
    // ReSharper disable InconsistentNaming
    var NAME = 'datetimepicker',
        VERSION = '5.0.0-alpha12',
        DATA_KEY = '' + NAME,
        EVENT_KEY = '.' + DATA_KEY,
        EMIT_EVENT_KEY = DATA_KEY + '.',
        DATA_API_KEY = '.data-api',
        Selector = {
        DATA_TOGGLE: '[data-toggle="' + DATA_KEY + '"]'
    },
        ClassName = {
        INPUT: NAME + '-input'
    },
        Event = {
        CHANGE: 'change' + EVENT_KEY,
        BLUR: 'blur' + EVENT_KEY,
        KEYUP: 'keyup' + EVENT_KEY,
        KEYDOWN: 'keydown' + EVENT_KEY,
        FOCUS: 'focus' + EVENT_KEY,
        CLICK_DATA_API: 'click' + EVENT_KEY + DATA_API_KEY,
        //emitted
        UPDATE: EMIT_EVENT_KEY + 'update',
        ERROR: EMIT_EVENT_KEY + 'error',
        HIDE: EMIT_EVENT_KEY + 'hide',
        SHOW: EMIT_EVENT_KEY + 'show'
    },
        DatePickerModes = [{
        CLASS_NAME: 'days',
        NAV_FUNCTION: 'M',
        NAV_STEP: 1
    }, {
        CLASS_NAME: 'months',
        NAV_FUNCTION: 'y',
        NAV_STEP: 1
    }, {
        CLASS_NAME: 'years',
        NAV_FUNCTION: 'y',
        NAV_STEP: 10
    }, {
        CLASS_NAME: 'decades',
        NAV_FUNCTION: 'y',
        NAV_STEP: 100
    }],
        KeyMap = {
        'up': 38,
        38: 'up',
        'down': 40,
        40: 'down',
        'left': 37,
        37: 'left',
        'right': 39,
        39: 'right',
        'tab': 9,
        9: 'tab',
        'escape': 27,
        27: 'escape',
        'enter': 13,
        13: 'enter',
        'pageUp': 33,
        33: 'pageUp',
        'pageDown': 34,
        34: 'pageDown',
        'shift': 16,
        16: 'shift',
        'control': 17,
        17: 'control',
        'space': 32,
        32: 'space',
        't': 84,
        84: 't',
        'delete': 46,
        46: 'delete'
    },
        ViewModes = ['times', 'days', 'months', 'years', 'decades'],
        keyState = {},
        keyPressHandled = {};

    var MinViewModeNumber = 0,
        Default = {
        timeZone: '',
        format: false,
        dayViewHeaderFormat: 'MMMM YYYY',
        extraFormats: false,
        stepping: 1,
        minDate: false,
        maxDate: false,
        useCurrent: true,
        collapse: true,
        locale: moment.locale(),
        defaultDate: false,
        disabledDates: false,
        enabledDates: false,
        icons: {
            time: 'fa fa-clock-o',
            date: 'fa fa-calendar',
            up: 'fa fa-arrow-up',
            down: 'fa fa-arrow-down',
            previous: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            today: 'fa fa-calendar-check-o',
            clear: 'fa fa-delete',
            close: 'fa fa-times'
        },
        tooltips: {
            today: 'Go to today',
            clear: 'Clear selection',
            close: 'Close the picker',
            selectMonth: 'Select Month',
            prevMonth: 'Previous Month',
            nextMonth: 'Next Month',
            selectYear: 'Select Year',
            prevYear: 'Previous Year',
            nextYear: 'Next Year',
            selectDecade: 'Select Decade',
            prevDecade: 'Previous Decade',
            nextDecade: 'Next Decade',
            prevCentury: 'Previous Century',
            nextCentury: 'Next Century',
            pickHour: 'Pick Hour',
            incrementHour: 'Increment Hour',
            decrementHour: 'Decrement Hour',
            pickMinute: 'Pick Minute',
            incrementMinute: 'Increment Minute',
            decrementMinute: 'Decrement Minute',
            pickSecond: 'Pick Second',
            incrementSecond: 'Increment Second',
            decrementSecond: 'Decrement Second',
            togglePeriod: 'Toggle Period',
            selectTime: 'Select Time',
            selectDate: 'Select Date'
        },
        useStrict: false,
        sideBySide: false,
        daysOfWeekDisabled: false,
        calendarWeeks: false,
        viewMode: 'days',
        toolbarPlacement: 'default',
        buttons: {
            showToday: false,
            showClear: false,
            showClose: false
        },
        widgetPositioning: {
            horizontal: 'auto',
            vertical: 'auto'
        },
        widgetParent: null,
        ignoreReadonly: false,
        keepOpen: false,
        focusOnShow: true,
        inline: false,
        keepInvalid: false,
        keyBinds: {
            up: function up() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().subtract(7, 'd'));
                } else {
                    this.date(d.clone().add(this.stepping(), 'm'));
                }
                return true;
            },
            down: function down() {
                if (!this.widget) {
                    this.show();
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().add(7, 'd'));
                } else {
                    this.date(d.clone().subtract(this.stepping(), 'm'));
                }
                return true;
            },
            'control up': function controlUp() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().subtract(1, 'y'));
                } else {
                    this.date(d.clone().add(1, 'h'));
                }
                return true;
            },
            'control down': function controlDown() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().add(1, 'y'));
                } else {
                    this.date(d.clone().subtract(1, 'h'));
                }
                return true;
            },
            left: function left() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().subtract(1, 'd'));
                }
                return true;
            },
            right: function right() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().add(1, 'd'));
                }
                return true;
            },
            pageUp: function pageUp() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().subtract(1, 'M'));
                }
                return true;
            },
            pageDown: function pageDown() {
                if (!this.widget) {
                    return false;
                }
                var d = this._dates[0] || this.getMoment();
                if (this.widget.find('.datepicker').is(':visible')) {
                    this.date(d.clone().add(1, 'M'));
                }
                return true;
            },
            enter: function enter() {
                this.hide();
                return true;
            },
            escape: function escape() {
                if (!this.widget) {
                    return false;
                }
                this.hide();
                return true;
            },
            'control space': function controlSpace() {
                if (!this.widget) {
                    return false;
                }
                if (this.widget.find('.timepicker').is(':visible')) {
                    this.widget.find('.btn[data-action="togglePeriod"]').click();
                }
                return true;
            },
            t: function t() {
                this.date(this.getMoment());
                return true;
            },
            'delete': function _delete() {
                if (!this.widget) {
                    return false;
                }
                this.clear();
                return true;
            }
        },
        debug: false,
        allowInputToggle: false,
        disabledTimeIntervals: false,
        disabledHours: false,
        enabledHours: false,
        viewDate: false,
        allowMultidate: false,
        multidateSeparator: ','
    };

    // ReSharper restore InconsistentNaming

    // ReSharper disable once DeclarationHides
    // ReSharper disable once InconsistentNaming

    var DateTimePicker = function () {
        /** @namespace eData.dateOptions */
        /** @namespace moment.tz */

        function DateTimePicker(element, options) {
            _classCallCheck(this, DateTimePicker);

            this._options = this._getOptions(options);
            this._element = element;
            this._dates = [];
            this._datesFormatted = [];
            this._viewDate = null;
            this.unset = true;
            this.component = false;
            this.widget = false;
            this.use24Hours = null;
            this.actualFormat = null;
            this.parseFormats = null;
            this.currentViewMode = null;

            this._int();
        }

        /**
         * @return {string}
         */


        //private

        DateTimePicker.prototype._int = function _int() {
            var targetInput = this._element.data('target-input');
            if (this._element.is('input')) {
                this.input = this._element;
            } else if (targetInput !== undefined) {
                if (targetInput === 'nearest') {
                    this.input = this._element.find('input');
                } else {
                    this.input = $(targetInput);
                }
            }

            this._dates = [];
            this._dates[0] = this.getMoment();
            this._viewDate = this.getMoment().clone();

            $.extend(true, this._options, this._dataToOptions());

            this.options(this._options);

            this._initFormatting();

            if (this.input !== undefined && this.input.is('input') && this.input.val().trim().length !== 0) {
                this._setValue(this._parseInputDate(this.input.val().trim()), 0);
            } else if (this._options.defaultDate && this.input !== undefined && this.input.attr('placeholder') === undefined) {
                this._setValue(this._options.defaultDate, 0);
            }
            if (this._options.inline) {
                this.show();
            }
        };

        DateTimePicker.prototype._update = function _update() {
            if (!this.widget) {
                return;
            }
            this._fillDate();
            this._fillTime();
        };

        DateTimePicker.prototype._setValue = function _setValue(targetMoment, index) {
            var oldDate = this.unset ? null : this._dates[index];
            var outpValue = '';
            // case of calling setValue(null or false)
            if (!targetMoment) {
                if (!this._options.allowMultidate || this._dates.length === 1) {
                    this.unset = true;
                    this._dates = [];
                    this._datesFormatted = [];
                } else {
                    outpValue = this._element.data('date') + ',';
                    outpValue = outpValue.replace(oldDate.format(this.actualFormat) + ',', '').replace(',,', '').replace(/,\s*$/, '');
                    this._dates.splice(index, 1);
                    this._datesFormatted.splice(index, 1);
                }
                if (this.input !== undefined) {
                    this.input.val(outpValue);
                    this.input.trigger('input');
                }
                this._element.data('date', outpValue);
                this._notifyEvent({
                    type: DateTimePicker.Event.CHANGE,
                    date: false,
                    oldDate: oldDate
                });
                this._update();
                return;
            }

            targetMoment = targetMoment.clone().locale(this._options.locale);

            if (this._hasTimeZone()) {
                targetMoment.tz(this._options.timeZone);
            }

            if (this._options.stepping !== 1) {
                targetMoment.minutes(Math.round(targetMoment.minutes() / this._options.stepping) * this._options.stepping).seconds(0);
            }

            if (this._isValid(targetMoment)) {
                this._dates[index] = targetMoment;
                this._datesFormatted[index] = targetMoment.format('YYYY-MM-DD');
                this._viewDate = targetMoment.clone();
                if (this._options.allowMultidate && this._dates.length > 1) {
                    for (var i = 0; i < this._dates.length; i++) {
                        outpValue += '' + this._dates[i].format(this.actualFormat) + this._options.multidateSeparator;
                    }
                    outpValue = outpValue.replace(/,\s*$/, '');
                } else {
                    outpValue = this._dates[index].format(this.actualFormat);
                }
                if (this.input !== undefined) {
                    this.input.val(outpValue);
                    this.input.trigger('input');
                }
                this._element.data('date', outpValue);

                this.unset = false;
                this._update();
                this._notifyEvent({
                    type: DateTimePicker.Event.CHANGE,
                    date: this._dates[index].clone(),
                    oldDate: oldDate
                });
            } else {
                if (!this._options.keepInvalid) {
                    if (this.input !== undefined) {
                        this.input.val('' + (this.unset ? '' : this._dates[index].format(this.actualFormat)));
                        this.input.trigger('input');
                    }
                } else {
                    this._notifyEvent({
                        type: DateTimePicker.Event.CHANGE,
                        date: targetMoment,
                        oldDate: oldDate
                    });
                }
                this._notifyEvent({
                    type: DateTimePicker.Event.ERROR,
                    date: targetMoment,
                    oldDate: oldDate
                });
            }
        };

        DateTimePicker.prototype._change = function _change(e) {
            var val = $(e.target).val().trim(),
                parsedDate = val ? this._parseInputDate(val) : null;
            this._setValue(parsedDate);
            e.stopImmediatePropagation();
            return false;
        };

        //noinspection JSMethodCanBeStatic


        DateTimePicker.prototype._getOptions = function _getOptions(options) {
            options = $.extend(true, {}, Default, options);
            return options;
        };

        DateTimePicker.prototype._hasTimeZone = function _hasTimeZone() {
            return moment.tz !== undefined && this._options.timeZone !== undefined && this._options.timeZone !== null && this._options.timeZone !== '';
        };

        DateTimePicker.prototype._isEnabled = function _isEnabled(granularity) {
            if (typeof granularity !== 'string' || granularity.length > 1) {
                throw new TypeError('isEnabled expects a single character string parameter');
            }
            switch (granularity) {
                case 'y':
                    return this.actualFormat.indexOf('Y') !== -1;
                case 'M':
                    return this.actualFormat.indexOf('M') !== -1;
                case 'd':
                    return this.actualFormat.toLowerCase().indexOf('d') !== -1;
                case 'h':
                case 'H':
                    return this.actualFormat.toLowerCase().indexOf('h') !== -1;
                case 'm':
                    return this.actualFormat.indexOf('m') !== -1;
                case 's':
                    return this.actualFormat.indexOf('s') !== -1;
                default:
                    return false;
            }
        };

        DateTimePicker.prototype._hasTime = function _hasTime() {
            return this._isEnabled('h') || this._isEnabled('m') || this._isEnabled('s');
        };

        DateTimePicker.prototype._hasDate = function _hasDate() {
            return this._isEnabled('y') || this._isEnabled('M') || this._isEnabled('d');
        };

        DateTimePicker.prototype._dataToOptions = function _dataToOptions() {
            var eData = this._element.data();
            var dataOptions = {};

            if (eData.dateOptions && eData.dateOptions instanceof Object) {
                dataOptions = $.extend(true, dataOptions, eData.dateOptions);
            }

            $.each(this._options, function (key) {
                var attributeName = 'date' + key.charAt(0).toUpperCase() + key.slice(1); //todo data api key
                if (eData[attributeName] !== undefined) {
                    dataOptions[key] = eData[attributeName];
                } else {
                    delete dataOptions[key];
                }
            });
            return dataOptions;
        };

        DateTimePicker.prototype._notifyEvent = function _notifyEvent(e) {
            if (e.type === DateTimePicker.Event.CHANGE && e.date && e.date.isSame(e.oldDate) || !e.date && !e.oldDate) {
                return;
            }
            this._element.trigger(e);
        };

        DateTimePicker.prototype._viewUpdate = function _viewUpdate(e) {
            if (e === 'y') {
                e = 'YYYY';
            }
            this._notifyEvent({
                type: DateTimePicker.Event.UPDATE,
                change: e,
                viewDate: this._viewDate.clone()
            });
        };

        DateTimePicker.prototype._showMode = function _showMode(dir) {
            if (!this.widget) {
                return;
            }
            if (dir) {
                this.currentViewMode = Math.max(MinViewModeNumber, Math.min(3, this.currentViewMode + dir));
            }
            this.widget.find('.datepicker > div').hide().filter('.datepicker-' + DatePickerModes[this.currentViewMode].CLASS_NAME).show();
        };

        DateTimePicker.prototype._isInDisabledDates = function _isInDisabledDates(testDate) {
            return this._options.disabledDates[testDate.format('YYYY-MM-DD')] === true;
        };

        DateTimePicker.prototype._isInEnabledDates = function _isInEnabledDates(testDate) {
            return this._options.enabledDates[testDate.format('YYYY-MM-DD')] === true;
        };

        DateTimePicker.prototype._isInDisabledHours = function _isInDisabledHours(testDate) {
            return this._options.disabledHours[testDate.format('H')] === true;
        };

        DateTimePicker.prototype._isInEnabledHours = function _isInEnabledHours(testDate) {
            return this._options.enabledHours[testDate.format('H')] === true;
        };

        DateTimePicker.prototype._isValid = function _isValid(targetMoment, granularity) {
            if (!targetMoment.isValid()) {
                return false;
            }
            if (this._options.disabledDates && granularity === 'd' && this._isInDisabledDates(targetMoment)) {
                return false;
            }
            if (this._options.enabledDates && granularity === 'd' && !this._isInEnabledDates(targetMoment)) {
                return false;
            }
            if (this._options.minDate && targetMoment.isBefore(this._options.minDate, granularity)) {
                return false;
            }
            if (this._options.maxDate && targetMoment.isAfter(this._options.maxDate, granularity)) {
                return false;
            }
            if (this._options.daysOfWeekDisabled && granularity === 'd' && this._options.daysOfWeekDisabled.indexOf(targetMoment.day()) !== -1) {
                return false;
            }
            if (this._options.disabledHours && (granularity === 'h' || granularity === 'm' || granularity === 's') && this._isInDisabledHours(targetMoment)) {
                return false;
            }
            if (this._options.enabledHours && (granularity === 'h' || granularity === 'm' || granularity === 's') && !this._isInEnabledHours(targetMoment)) {
                return false;
            }
            if (this._options.disabledTimeIntervals && (granularity === 'h' || granularity === 'm' || granularity === 's')) {
                var found = false;
                $.each(this._options.disabledTimeIntervals, function () {
                    if (targetMoment.isBetween(this[0], this[1])) {
                        found = true;
                        return false;
                    }
                });
                if (found) {
                    return false;
                }
            }
            return true;
        };

        DateTimePicker.prototype._parseInputDate = function _parseInputDate(inputDate) {
            if (this._options.parseInputDate === undefined) {
                if (!moment.isMoment(inputDate)) {
                    inputDate = this.getMoment(inputDate);
                }
            } else {
                inputDate = this._options.parseInputDate(inputDate);
            }
            //inputDate.locale(this.options.locale);
            return inputDate;
        };

        DateTimePicker.prototype._keydown = function _keydown(e) {
            var handler = null,
                index = void 0,
                index2 = void 0,
                keyBindKeys = void 0,
                allModifiersPressed = void 0;
            var pressedKeys = [],
                pressedModifiers = {},
                currentKey = e.which,
                pressed = 'p';

            keyState[currentKey] = pressed;

            for (index in keyState) {
                if (keyState.hasOwnProperty(index) && keyState[index] === pressed) {
                    pressedKeys.push(index);
                    if (parseInt(index, 10) !== currentKey) {
                        pressedModifiers[index] = true;
                    }
                }
            }

            for (index in this._options.keyBinds) {
                if (this._options.keyBinds.hasOwnProperty(index) && typeof this._options.keyBinds[index] === 'function') {
                    keyBindKeys = index.split(' ');
                    if (keyBindKeys.length === pressedKeys.length && KeyMap[currentKey] === keyBindKeys[keyBindKeys.length - 1]) {
                        allModifiersPressed = true;
                        for (index2 = keyBindKeys.length - 2; index2 >= 0; index2--) {
                            if (!(KeyMap[keyBindKeys[index2]] in pressedModifiers)) {
                                allModifiersPressed = false;
                                break;
                            }
                        }
                        if (allModifiersPressed) {
                            handler = this._options.keyBinds[index];
                            break;
                        }
                    }
                }
            }

            if (handler) {
                if (handler.call(this.widget)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        };

        //noinspection JSMethodCanBeStatic,SpellCheckingInspection


        DateTimePicker.prototype._keyup = function _keyup(e) {
            keyState[e.which] = 'r';
            if (keyPressHandled[e.which]) {
                keyPressHandled[e.which] = false;
                e.stopPropagation();
                e.preventDefault();
            }
        };

        DateTimePicker.prototype._indexGivenDates = function _indexGivenDates(givenDatesArray) {
            // Store given enabledDates and disabledDates as keys.
            // This way we can check their existence in O(1) time instead of looping through whole array.
            // (for example: options.enabledDates['2014-02-27'] === true)
            var givenDatesIndexed = {},
                self = this;
            $.each(givenDatesArray, function () {
                var dDate = self._parseInputDate(this);
                if (dDate.isValid()) {
                    givenDatesIndexed[dDate.format('YYYY-MM-DD')] = true;
                }
            });
            return Object.keys(givenDatesIndexed).length ? givenDatesIndexed : false;
        };

        DateTimePicker.prototype._indexGivenHours = function _indexGivenHours(givenHoursArray) {
            // Store given enabledHours and disabledHours as keys.
            // This way we can check their existence in O(1) time instead of looping through whole array.
            // (for example: options.enabledHours['2014-02-27'] === true)
            var givenHoursIndexed = {};
            $.each(givenHoursArray, function () {
                givenHoursIndexed[this] = true;
            });
            return Object.keys(givenHoursIndexed).length ? givenHoursIndexed : false;
        };

        DateTimePicker.prototype._initFormatting = function _initFormatting() {
            var format = this._options.format || 'L LT',
                self = this;

            this.actualFormat = format.replace(/(\[[^\[]*])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, function (formatInput) {
                return self._dates[0].localeData().longDateFormat(formatInput) || formatInput; //todo taking the first date should be ok
            });

            this.parseFormats = this._options.extraFormats ? this._options.extraFormats.slice() : [];
            if (this.parseFormats.indexOf(format) < 0 && this.parseFormats.indexOf(this.actualFormat) < 0) {
                this.parseFormats.push(this.actualFormat);
            }

            this.use24Hours = this.actualFormat.toLowerCase().indexOf('a') < 1 && this.actualFormat.replace(/\[.*?]/g, '').indexOf('h') < 1;

            if (this._isEnabled('y')) {
                MinViewModeNumber = 2;
            }
            if (this._isEnabled('M')) {
                MinViewModeNumber = 1;
            }
            if (this._isEnabled('d')) {
                MinViewModeNumber = 0;
            }

            this.currentViewMode = Math.max(MinViewModeNumber, this.currentViewMode);

            if (!this.unset) {
                this._setValue(this._dates[0], 0);
            }
        };

        DateTimePicker.prototype._getLastPickedDate = function _getLastPickedDate() {
            return this._dates[this._getLastPickedDateIndex()];
        };

        DateTimePicker.prototype._getLastPickedDateIndex = function _getLastPickedDateIndex() {
            return this._dates.length - 1;
        };

        //public


        DateTimePicker.prototype.getMoment = function getMoment(d) {
            var returnMoment = void 0;

            if (d === undefined || d === null) {
                returnMoment = moment(); //TODO should this use format? and locale?
            } else if (this._hasTimeZone()) {
                // There is a string to parse and a default time zone
                // parse with the tz function which takes a default time zone if it is not in the format string
                returnMoment = moment.tz(d, this.parseFormats, this._options.useStrict, this._options.timeZone);
            } else {
                returnMoment = moment(d, this.parseFormats, this._options.useStrict);
            }

            if (this._hasTimeZone()) {
                returnMoment.tz(this._options.timeZone);
            }

            return returnMoment;
        };

        DateTimePicker.prototype.toggle = function toggle() {
            return this.widget ? this.hide() : this.show();
        };

        DateTimePicker.prototype.ignoreReadonly = function ignoreReadonly(_ignoreReadonly) {
            if (arguments.length === 0) {
                return this._options.ignoreReadonly;
            }
            if (typeof _ignoreReadonly !== 'boolean') {
                throw new TypeError('ignoreReadonly () expects a boolean parameter');
            }
            this._options.ignoreReadonly = _ignoreReadonly;
        };

        DateTimePicker.prototype.options = function options(newOptions) {
            if (arguments.length === 0) {
                return $.extend(true, {}, this._options);
            }

            if (!(newOptions instanceof Object)) {
                throw new TypeError('options() this.options parameter should be an object');
            }
            $.extend(true, this._options, newOptions);
            var self = this;
            $.each(this._options, function (key, value) {
                if (self[key] !== undefined) {
                    self[key](value);
                }
            });
        };

        DateTimePicker.prototype.date = function date(newDate, index) {
            index = index || 0;
            if (arguments.length === 0) {
                if (this.unset) {
                    return null;
                }
                if (this._options.allowMultidate) {
                    return this._dates.join(this._options.multidateSeparator);
                } else {
                    return this._dates[index].clone();
                }
            }

            if (newDate !== null && typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
                throw new TypeError('date() parameter must be one of [null, string, moment or Date]');
            }

            this._setValue(newDate === null ? null : this._parseInputDate(newDate), index);
        };

        DateTimePicker.prototype.format = function format(newFormat) {
            if (arguments.length === 0) {
                return this._options.format;
            }

            if (typeof newFormat !== 'string' && (typeof newFormat !== 'boolean' || newFormat !== false)) {
                throw new TypeError('format() expects a string or boolean:false parameter ' + newFormat);
            }

            this._options.format = newFormat;
            if (this.actualFormat) {
                this._initFormatting(); // reinitialize formatting
            }
        };

        DateTimePicker.prototype.timeZone = function timeZone(newZone) {
            if (arguments.length === 0) {
                return this._options.timeZone;
            }

            if (typeof newZone !== 'string') {
                throw new TypeError('newZone() expects a string parameter');
            }

            this._options.timeZone = newZone;
        };

        DateTimePicker.prototype.dayViewHeaderFormat = function dayViewHeaderFormat(newFormat) {
            if (arguments.length === 0) {
                return this._options.dayViewHeaderFormat;
            }

            if (typeof newFormat !== 'string') {
                throw new TypeError('dayViewHeaderFormat() expects a string parameter');
            }

            this._options.dayViewHeaderFormat = newFormat;
        };

        DateTimePicker.prototype.extraFormats = function extraFormats(formats) {
            if (arguments.length === 0) {
                return this._options.extraFormats;
            }

            if (formats !== false && !(formats instanceof Array)) {
                throw new TypeError('extraFormats() expects an array or false parameter');
            }

            this._options.extraFormats = formats;
            if (this.parseFormats) {
                this._initFormatting(); // reinit formatting
            }
        };

        DateTimePicker.prototype.disabledDates = function disabledDates(dates) {
            if (arguments.length === 0) {
                return this._options.disabledDates ? $.extend({}, this._options.disabledDates) : this._options.disabledDates;
            }

            if (!dates) {
                this._options.disabledDates = false;
                this._update();
                return true;
            }
            if (!(dates instanceof Array)) {
                throw new TypeError('disabledDates() expects an array parameter');
            }
            this._options.disabledDates = this._indexGivenDates(dates);
            this._options.enabledDates = false;
            this._update();
        };

        DateTimePicker.prototype.enabledDates = function enabledDates(dates) {
            if (arguments.length === 0) {
                return this._options.enabledDates ? $.extend({}, this._options.enabledDates) : this._options.enabledDates;
            }

            if (!dates) {
                this._options.enabledDates = false;
                this._update();
                return true;
            }
            if (!(dates instanceof Array)) {
                throw new TypeError('enabledDates() expects an array parameter');
            }
            this._options.enabledDates = this._indexGivenDates(dates);
            this._options.disabledDates = false;
            this._update();
        };

        DateTimePicker.prototype.daysOfWeekDisabled = function daysOfWeekDisabled(_daysOfWeekDisabled) {
            if (arguments.length === 0) {
                return this._options.daysOfWeekDisabled.splice(0);
            }

            if (typeof _daysOfWeekDisabled === 'boolean' && !_daysOfWeekDisabled) {
                this._options.daysOfWeekDisabled = false;
                this._update();
                return true;
            }

            if (!(_daysOfWeekDisabled instanceof Array)) {
                throw new TypeError('daysOfWeekDisabled() expects an array parameter');
            }
            this._options.daysOfWeekDisabled = _daysOfWeekDisabled.reduce(function (previousValue, currentValue) {
                currentValue = parseInt(currentValue, 10);
                if (currentValue > 6 || currentValue < 0 || isNaN(currentValue)) {
                    return previousValue;
                }
                if (previousValue.indexOf(currentValue) === -1) {
                    previousValue.push(currentValue);
                }
                return previousValue;
            }, []).sort();
            if (this._options.useCurrent && !this._options.keepInvalid) {
                for (var i = 0; i < this._dates.length; i++) {
                    var tries = 0;
                    while (!this._isValid(this._dates[i], 'd')) {
                        this._dates[i].add(1, 'd');
                        if (tries === 31) {
                            throw 'Tried 31 times to find a valid date';
                        }
                        tries++;
                    }
                    this._setValue(this._dates[i], i);
                }
            }
            this._update();
        };

        DateTimePicker.prototype.maxDate = function maxDate(_maxDate) {
            if (arguments.length === 0) {
                return this._options.maxDate ? this._options.maxDate.clone() : this._options.maxDate;
            }

            if (typeof _maxDate === 'boolean' && _maxDate === false) {
                this._options.maxDate = false;
                this._update();
                return true;
            }

            if (typeof _maxDate === 'string') {
                if (_maxDate === 'now' || _maxDate === 'moment') {
                    _maxDate = this.getMoment();
                }
            }

            var parsedDate = this._parseInputDate(_maxDate);

            if (!parsedDate.isValid()) {
                throw new TypeError('maxDate() Could not parse date parameter: ' + _maxDate);
            }
            if (this._options.minDate && parsedDate.isBefore(this._options.minDate)) {
                throw new TypeError('maxDate() date parameter is before this.options.minDate: ' + parsedDate.format(this.actualFormat));
            }
            this._options.maxDate = parsedDate;
            for (var i = 0; i < this._dates.length; i++) {
                if (this._options.useCurrent && !this._options.keepInvalid && this._dates[i].isAfter(_maxDate)) {
                    this._setValue(this._options.maxDate, i);
                }
            }
            if (this._viewDate.isAfter(parsedDate)) {
                this._viewDate = parsedDate.clone().subtract(this._options.stepping, 'm');
            }
            this._update();
        };

        DateTimePicker.prototype.minDate = function minDate(_minDate) {
            if (arguments.length === 0) {
                return this._options.minDate ? this._options.minDate.clone() : this._options.minDate;
            }

            if (typeof _minDate === 'boolean' && _minDate === false) {
                this._options.minDate = false;
                this._update();
                return true;
            }

            if (typeof _minDate === 'string') {
                if (_minDate === 'now' || _minDate === 'moment') {
                    _minDate = this.getMoment();
                }
            }

            var parsedDate = this._parseInputDate(_minDate);

            if (!parsedDate.isValid()) {
                throw new TypeError('minDate() Could not parse date parameter: ' + _minDate);
            }
            if (this._options.maxDate && parsedDate.isAfter(this._options.maxDate)) {
                throw new TypeError('minDate() date parameter is after this.options.maxDate: ' + parsedDate.format(this.actualFormat));
            }
            this._options.minDate = parsedDate;
            for (var i = 0; i < this._dates.length; i++) {
                if (this._options.useCurrent && !this._options.keepInvalid && this._dates[i].isBefore(_minDate)) {
                    this._setValue(this._options.minDate, i);
                }
            }
            if (this._viewDate.isBefore(parsedDate)) {
                this._viewDate = parsedDate.clone().add(this._options.stepping, 'm');
            }
            this._update();
        };

        DateTimePicker.prototype.defaultDate = function defaultDate(_defaultDate) {
            if (arguments.length === 0) {
                return this._options.defaultDate ? this._options.defaultDate.clone() : this._options.defaultDate;
            }
            if (!_defaultDate) {
                this._options.defaultDate = false;
                return true;
            }

            if (typeof _defaultDate === 'string') {
                if (_defaultDate === 'now' || _defaultDate === 'moment') {
                    _defaultDate = this.getMoment();
                } else {
                    _defaultDate = this.getMoment(_defaultDate);
                }
            }

            var parsedDate = this._parseInputDate(_defaultDate);
            if (!parsedDate.isValid()) {
                throw new TypeError('defaultDate() Could not parse date parameter: ' + _defaultDate);
            }
            if (!this._isValid(parsedDate)) {
                throw new TypeError('defaultDate() date passed is invalid according to component setup validations');
            }

            this._options.defaultDate = parsedDate;

            if (this._options.defaultDate && this._options.inline || this.input !== undefined && this.input.val().trim() === '') {
                this._setValue(this._options.defaultDate, 0);
            }
        };

        DateTimePicker.prototype.locale = function locale(_locale) {
            if (arguments.length === 0) {
                return this._options.locale;
            }

            if (!moment.localeData(_locale)) {
                throw new TypeError('locale() locale ' + _locale + ' is not loaded from moment locales!');
            }

            for (var i = 0; i < this._dates.length; i++) {
                this._dates[i].locale(this._options.locale);
            }
            this._viewDate.locale(this._options.locale);

            if (this.actualFormat) {
                this._initFormatting(); // reinitialize formatting
            }
            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        DateTimePicker.prototype.stepping = function stepping(_stepping) {
            if (arguments.length === 0) {
                return this._options.stepping;
            }

            _stepping = parseInt(_stepping, 10);
            if (isNaN(_stepping) || _stepping < 1) {
                _stepping = 1;
            }
            this._options.stepping = _stepping;
        };

        DateTimePicker.prototype.useCurrent = function useCurrent(_useCurrent) {
            var useCurrentOptions = ['year', 'month', 'day', 'hour', 'minute'];
            if (arguments.length === 0) {
                return this._options.useCurrent;
            }

            if (typeof _useCurrent !== 'boolean' && typeof _useCurrent !== 'string') {
                throw new TypeError('useCurrent() expects a boolean or string parameter');
            }
            if (typeof _useCurrent === 'string' && useCurrentOptions.indexOf(_useCurrent.toLowerCase()) === -1) {
                throw new TypeError('useCurrent() expects a string parameter of ' + useCurrentOptions.join(', '));
            }
            this._options.useCurrent = _useCurrent;
        };

        DateTimePicker.prototype.collapse = function collapse(_collapse) {
            if (arguments.length === 0) {
                return this._options.collapse;
            }

            if (typeof _collapse !== 'boolean') {
                throw new TypeError('collapse() expects a boolean parameter');
            }
            if (this._options.collapse === _collapse) {
                return true;
            }
            this._options.collapse = _collapse;
            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        DateTimePicker.prototype.icons = function icons(_icons) {
            if (arguments.length === 0) {
                return $.extend({}, this._options.icons);
            }

            if (!(_icons instanceof Object)) {
                throw new TypeError('icons() expects parameter to be an Object');
            }

            $.extend(this._options.icons, _icons);

            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        DateTimePicker.prototype.tooltips = function tooltips(_tooltips) {
            if (arguments.length === 0) {
                return $.extend({}, this._options.tooltips);
            }

            if (!(_tooltips instanceof Object)) {
                throw new TypeError('tooltips() expects parameter to be an Object');
            }
            $.extend(this._options.tooltips, _tooltips);
            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        DateTimePicker.prototype.useStrict = function useStrict(_useStrict) {
            if (arguments.length === 0) {
                return this._options.useStrict;
            }

            if (typeof _useStrict !== 'boolean') {
                throw new TypeError('useStrict() expects a boolean parameter');
            }
            this._options.useStrict = _useStrict;
        };

        DateTimePicker.prototype.sideBySide = function sideBySide(_sideBySide) {
            if (arguments.length === 0) {
                return this._options.sideBySide;
            }

            if (typeof _sideBySide !== 'boolean') {
                throw new TypeError('sideBySide() expects a boolean parameter');
            }
            this._options.sideBySide = _sideBySide;
            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        DateTimePicker.prototype.viewMode = function viewMode(_viewMode) {
            if (arguments.length === 0) {
                return this._options.viewMode;
            }

            if (typeof _viewMode !== 'string') {
                throw new TypeError('viewMode() expects a string parameter');
            }

            if (DateTimePicker.ViewModes.indexOf(_viewMode) === -1) {
                throw new TypeError('viewMode() parameter must be one of (' + DateTimePicker.ViewModes.join(', ') + ') value');
            }

            this._options.viewMode = _viewMode;
            this.currentViewMode = Math.max(DateTimePicker.ViewModes.indexOf(_viewMode) - 1, DateTimePicker.MinViewModeNumber);

            this._showMode();
        };

        DateTimePicker.prototype.calendarWeeks = function calendarWeeks(_calendarWeeks) {
            if (arguments.length === 0) {
                return this._options.calendarWeeks;
            }

            if (typeof _calendarWeeks !== 'boolean') {
                throw new TypeError('calendarWeeks() expects parameter to be a boolean value');
            }

            this._options.calendarWeeks = _calendarWeeks;
            this._update();
        };

        DateTimePicker.prototype.buttons = function buttons(_buttons) {
            if (arguments.length === 0) {
                return $.extend({}, this._options.buttons);
            }

            if (!(_buttons instanceof Object)) {
                throw new TypeError('buttons() expects parameter to be an Object');
            }

            $.extend(this._options.buttons, _buttons);

            if (typeof this._options.buttons.showToday !== 'boolean') {
                throw new TypeError('buttons.showToday expects a boolean parameter');
            }
            if (typeof this._options.buttons.showClear !== 'boolean') {
                throw new TypeError('buttons.showClear expects a boolean parameter');
            }
            if (typeof this._options.buttons.showClose !== 'boolean') {
                throw new TypeError('buttons.showClose expects a boolean parameter');
            }

            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        DateTimePicker.prototype.keepOpen = function keepOpen(_keepOpen) {
            if (arguments.length === 0) {
                return this._options.keepOpen;
            }

            if (typeof _keepOpen !== 'boolean') {
                throw new TypeError('keepOpen() expects a boolean parameter');
            }

            this._options.keepOpen = _keepOpen;
        };

        DateTimePicker.prototype.focusOnShow = function focusOnShow(_focusOnShow) {
            if (arguments.length === 0) {
                return this._options.focusOnShow;
            }

            if (typeof _focusOnShow !== 'boolean') {
                throw new TypeError('focusOnShow() expects a boolean parameter');
            }

            this._options.focusOnShow = _focusOnShow;
        };

        DateTimePicker.prototype.inline = function inline(_inline) {
            if (arguments.length === 0) {
                return this._options.inline;
            }

            if (typeof _inline !== 'boolean') {
                throw new TypeError('inline() expects a boolean parameter');
            }

            this._options.inline = _inline;
        };

        DateTimePicker.prototype.clear = function clear() {
            this._setValue(null); //todo
        };

        DateTimePicker.prototype.keyBinds = function keyBinds(_keyBinds) {
            if (arguments.length === 0) {
                return this._options.keyBinds;
            }

            this._options.keyBinds = _keyBinds;
        };

        DateTimePicker.prototype.debug = function debug(_debug) {
            if (typeof _debug !== 'boolean') {
                throw new TypeError('debug() expects a boolean parameter');
            }

            this._options.debug = _debug;
        };

        DateTimePicker.prototype.allowInputToggle = function allowInputToggle(_allowInputToggle) {
            if (arguments.length === 0) {
                return this._options.allowInputToggle;
            }

            if (typeof _allowInputToggle !== 'boolean') {
                throw new TypeError('allowInputToggle() expects a boolean parameter');
            }

            this._options.allowInputToggle = _allowInputToggle;
        };

        DateTimePicker.prototype.keepInvalid = function keepInvalid(_keepInvalid) {
            if (arguments.length === 0) {
                return this._options.keepInvalid;
            }

            if (typeof _keepInvalid !== 'boolean') {
                throw new TypeError('keepInvalid() expects a boolean parameter');
            }
            this._options.keepInvalid = _keepInvalid;
        };

        DateTimePicker.prototype.datepickerInput = function datepickerInput(_datepickerInput) {
            if (arguments.length === 0) {
                return this._options.datepickerInput;
            }

            if (typeof _datepickerInput !== 'string') {
                throw new TypeError('datepickerInput() expects a string parameter');
            }

            this._options.datepickerInput = _datepickerInput;
        };

        DateTimePicker.prototype.parseInputDate = function parseInputDate(_parseInputDate2) {
            if (arguments.length === 0) {
                return this._options.parseInputDate;
            }

            if (typeof _parseInputDate2 !== 'function') {
                throw new TypeError('parseInputDate() should be as function');
            }

            this._options.parseInputDate = _parseInputDate2;
        };

        DateTimePicker.prototype.disabledTimeIntervals = function disabledTimeIntervals(_disabledTimeIntervals) {
            if (arguments.length === 0) {
                return this._options.disabledTimeIntervals ? $.extend({}, this._options.disabledTimeIntervals) : this._options.disabledTimeIntervals;
            }

            if (!_disabledTimeIntervals) {
                this._options.disabledTimeIntervals = false;
                this._update();
                return true;
            }
            if (!(_disabledTimeIntervals instanceof Array)) {
                throw new TypeError('disabledTimeIntervals() expects an array parameter');
            }
            this._options.disabledTimeIntervals = _disabledTimeIntervals;
            this._update();
        };

        DateTimePicker.prototype.disabledHours = function disabledHours(hours) {
            if (arguments.length === 0) {
                return this._options.disabledHours ? $.extend({}, this._options.disabledHours) : this._options.disabledHours;
            }

            if (!hours) {
                this._options.disabledHours = false;
                this._update();
                return true;
            }
            if (!(hours instanceof Array)) {
                throw new TypeError('disabledHours() expects an array parameter');
            }
            this._options.disabledHours = this._indexGivenHours(hours);
            this._options.enabledHours = false;
            if (this._options.useCurrent && !this._options.keepInvalid) {
                for (var i = 0; i < this._dates.length; i++) {
                    var tries = 0;
                    while (!this._isValid(this._dates[i], 'h')) {
                        this._dates[i].add(1, 'h');
                        if (tries === 24) {
                            throw 'Tried 24 times to find a valid date';
                        }
                        tries++;
                    }
                    this._setValue(this._dates[i], i);
                }
            }
            this._update();
        };

        DateTimePicker.prototype.enabledHours = function enabledHours(hours) {
            if (arguments.length === 0) {
                return this._options.enabledHours ? $.extend({}, this._options.enabledHours) : this._options.enabledHours;
            }

            if (!hours) {
                this._options.enabledHours = false;
                this._update();
                return true;
            }
            if (!(hours instanceof Array)) {
                throw new TypeError('enabledHours() expects an array parameter');
            }
            this._options.enabledHours = this._indexGivenHours(hours);
            this._options.disabledHours = false;
            if (this._options.useCurrent && !this._options.keepInvalid) {
                for (var i = 0; i < this._dates.length; i++) {
                    var tries = 0;
                    while (!this._isValid(this._dates[i], 'h')) {
                        this._dates[i].add(1, 'h');
                        if (tries === 24) {
                            throw 'Tried 24 times to find a valid date';
                        }
                        tries++;
                    }
                    this._setValue(this._dates[i], i);
                }
            }
            this._update();
        };

        DateTimePicker.prototype.viewDate = function viewDate(newDate) {
            if (arguments.length === 0) {
                return this._viewDate.clone();
            }

            if (!newDate) {
                this._viewDate = (this._dates[0] || this.getMoment()).clone();
                return true;
            }

            if (typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
                throw new TypeError('viewDate() parameter must be one of [string, moment or Date]');
            }

            this._viewDate = this._parseInputDate(newDate);
            this._viewUpdate();
        };

        DateTimePicker.prototype.allowMultidate = function allowMultidate(_allowMultidate) {
            if (typeof _allowMultidate !== 'boolean') {
                throw new TypeError('allowMultidate() expects a boolean parameter');
            }

            this._options.allowMultidate = _allowMultidate;
        };

        DateTimePicker.prototype.multidateSeparator = function multidateSeparator(_multidateSeparator) {
            if (arguments.length === 0) {
                return this._options.multidateSeparator;
            }

            if (typeof _multidateSeparator !== 'string' || _multidateSeparator.length > 1) {
                throw new TypeError('multidateSeparator expects a single character string parameter');
            }

            this._options.multidateSeparator = _multidateSeparator;
        };

        _createClass(DateTimePicker, null, [{
            key: 'NAME',
            get: function get() {
                return NAME;
            }

            /**
             * @return {string}
             */

        }, {
            key: 'VERSION',
            get: function get() {
                return VERSION;
            }

            /**
             * @return {string}
             */

        }, {
            key: 'DATA_KEY',
            get: function get() {
                return DATA_KEY;
            }

            /**
             * @return {string}
             */

        }, {
            key: 'EVENT_KEY',
            get: function get() {
                return EVENT_KEY;
            }

            /**
             * @return {string}
             */

        }, {
            key: 'DATA_API_KEY',
            get: function get() {
                return DATA_API_KEY;
            }
        }, {
            key: 'DatePickerModes',
            get: function get() {
                return DatePickerModes;
            }
        }, {
            key: 'ViewModes',
            get: function get() {
                return ViewModes;
            }

            /**
             * @return {number}
             */

        }, {
            key: 'MinViewModeNumber',
            get: function get() {
                return MinViewModeNumber;
            }
        }, {
            key: 'Event',
            get: function get() {
                return Event;
            }
        }, {
            key: 'Selector',
            get: function get() {
                return Selector;
            }
        }, {
            key: 'Default',
            get: function get() {
                return Default;
            },
            set: function set(value) {
                Default = value;
            }
        }, {
            key: 'ClassName',
            get: function get() {
                return ClassName;
            }
        }]);

        return DateTimePicker;
    }();

    return DateTimePicker;
}(jQuery, moment);

//noinspection JSUnusedGlobalSymbols
/* global DateTimePicker */
var TempusDominusBootstrap4 = function ($) {
    // eslint-disable-line no-unused-vars
    // ReSharper disable once InconsistentNaming
    var JQUERY_NO_CONFLICT = $.fn[DateTimePicker.NAME],
        verticalModes = ['top', 'bottom', 'auto'],
        horizontalModes = ['left', 'right', 'auto'],
        toolbarPlacements = ['default', 'top', 'bottom'],
        getSelectorFromElement = function getSelectorFromElement($element) {
        var selector = $element.data('target'),
            $selector = void 0;

        if (!selector) {
            selector = $element.attr('href') || '';
            selector = /^#[a-z]/i.test(selector) ? selector : null;
        }
        $selector = $(selector);
        if ($selector.length === 0) {
            return $selector;
        }

        if (!$selector.data(DateTimePicker.DATA_KEY)) {
            $.extend({}, $selector.data(), $(this).data());
        }

        return $selector;
    };

    // ReSharper disable once InconsistentNaming

    var TempusDominusBootstrap4 = function (_DateTimePicker) {
        _inherits(TempusDominusBootstrap4, _DateTimePicker);

        function TempusDominusBootstrap4(element, options) {
            _classCallCheck(this, TempusDominusBootstrap4);

            var _this = _possibleConstructorReturn(this, _DateTimePicker.call(this, element, options));

            _this._init();
            return _this;
        }

        TempusDominusBootstrap4.prototype._init = function _init() {
            if (this._element.hasClass('input-group')) {
                // in case there is more then one 'input-group-addon' Issue #48
                var datepickerButton = this._element.find('.datepickerbutton');
                if (datepickerButton.length === 0) {
                    this.component = this._element.find('.input-group-append');
                } else {
                    this.component = datepickerButton;
                }
            }
        };

        TempusDominusBootstrap4.prototype._getDatePickerTemplate = function _getDatePickerTemplate() {
            var headTemplate = $('<thead>').append($('<tr>').append($('<th>').addClass('prev').attr('data-action', 'previous').append($('<span>').addClass(this._options.icons.previous))).append($('<th>').addClass('picker-switch').attr('data-action', 'pickerSwitch').attr('colspan', '' + (this._options.calendarWeeks ? '6' : '5'))).append($('<th>').addClass('next').attr('data-action', 'next').append($('<span>').addClass(this._options.icons.next)))),
                contTemplate = $('<tbody>').append($('<tr>').append($('<td>').attr('colspan', '' + (this._options.calendarWeeks ? '8' : '7'))));

            return [$('<div>').addClass('datepicker-days').append($('<table>').addClass('table table-sm').append(headTemplate).append($('<tbody>'))), $('<div>').addClass('datepicker-months').append($('<table>').addClass('table-condensed').append(headTemplate.clone()).append(contTemplate.clone())), $('<div>').addClass('datepicker-years').append($('<table>').addClass('table-condensed').append(headTemplate.clone()).append(contTemplate.clone())), $('<div>').addClass('datepicker-decades').append($('<table>').addClass('table-condensed').append(headTemplate.clone()).append(contTemplate.clone()))];
        };

        TempusDominusBootstrap4.prototype._getTimePickerMainTemplate = function _getTimePickerMainTemplate() {
            var topRow = $('<tr>'),
                middleRow = $('<tr>'),
                bottomRow = $('<tr>');

            if (this._isEnabled('h')) {
                topRow.append($('<td>').append($('<a>').attr({
                    href: '#',
                    tabindex: '-1',
                    'title': this._options.tooltips.incrementHour
                }).addClass('btn').attr('data-action', 'incrementHours').append($('<span>').addClass(this._options.icons.up))));
                middleRow.append($('<td>').append($('<span>').addClass('timepicker-hour').attr({
                    'data-time-component': 'hours',
                    'title': this._options.tooltips.pickHour
                }).attr('data-action', 'showHours')));
                bottomRow.append($('<td>').append($('<a>').attr({
                    href: '#',
                    tabindex: '-1',
                    'title': this._options.tooltips.decrementHour
                }).addClass('btn').attr('data-action', 'decrementHours').append($('<span>').addClass(this._options.icons.down))));
            }
            if (this._isEnabled('m')) {
                if (this._isEnabled('h')) {
                    topRow.append($('<td>').addClass('separator'));
                    middleRow.append($('<td>').addClass('separator').html(':'));
                    bottomRow.append($('<td>').addClass('separator'));
                }
                topRow.append($('<td>').append($('<a>').attr({
                    href: '#',
                    tabindex: '-1',
                    'title': this._options.tooltips.incrementMinute
                }).addClass('btn').attr('data-action', 'incrementMinutes').append($('<span>').addClass(this._options.icons.up))));
                middleRow.append($('<td>').append($('<span>').addClass('timepicker-minute').attr({
                    'data-time-component': 'minutes',
                    'title': this._options.tooltips.pickMinute
                }).attr('data-action', 'showMinutes')));
                bottomRow.append($('<td>').append($('<a>').attr({
                    href: '#',
                    tabindex: '-1',
                    'title': this._options.tooltips.decrementMinute
                }).addClass('btn').attr('data-action', 'decrementMinutes').append($('<span>').addClass(this._options.icons.down))));
            }
            if (this._isEnabled('s')) {
                if (this._isEnabled('m')) {
                    topRow.append($('<td>').addClass('separator'));
                    middleRow.append($('<td>').addClass('separator').html(':'));
                    bottomRow.append($('<td>').addClass('separator'));
                }
                topRow.append($('<td>').append($('<a>').attr({
                    href: '#',
                    tabindex: '-1',
                    'title': this._options.tooltips.incrementSecond
                }).addClass('btn').attr('data-action', 'incrementSeconds').append($('<span>').addClass(this._options.icons.up))));
                middleRow.append($('<td>').append($('<span>').addClass('timepicker-second').attr({
                    'data-time-component': 'seconds',
                    'title': this._options.tooltips.pickSecond
                }).attr('data-action', 'showSeconds')));
                bottomRow.append($('<td>').append($('<a>').attr({
                    href: '#',
                    tabindex: '-1',
                    'title': this._options.tooltips.decrementSecond
                }).addClass('btn').attr('data-action', 'decrementSeconds').append($('<span>').addClass(this._options.icons.down))));
            }

            if (!this.use24Hours) {
                topRow.append($('<td>').addClass('separator'));
                middleRow.append($('<td>').append($('<button>').addClass('btn btn-primary').attr({
                    'data-action': 'togglePeriod',
                    tabindex: '-1',
                    'title': this._options.tooltips.togglePeriod
                })));
                bottomRow.append($('<td>').addClass('separator'));
            }

            return $('<div>').addClass('timepicker-picker').append($('<table>').addClass('table-condensed').append([topRow, middleRow, bottomRow]));
        };

        TempusDominusBootstrap4.prototype._getTimePickerTemplate = function _getTimePickerTemplate() {
            var hoursView = $('<div>').addClass('timepicker-hours').append($('<table>').addClass('table-condensed')),
                minutesView = $('<div>').addClass('timepicker-minutes').append($('<table>').addClass('table-condensed')),
                secondsView = $('<div>').addClass('timepicker-seconds').append($('<table>').addClass('table-condensed')),
                ret = [this._getTimePickerMainTemplate()];

            if (this._isEnabled('h')) {
                ret.push(hoursView);
            }
            if (this._isEnabled('m')) {
                ret.push(minutesView);
            }
            if (this._isEnabled('s')) {
                ret.push(secondsView);
            }

            return ret;
        };

        TempusDominusBootstrap4.prototype._getToolbar = function _getToolbar() {
            var row = [];
            if (this._options.buttons.showToday) {
                row.push($('<td>').append($('<a>').attr({
                    'data-action': 'today',
                    'title': this._options.tooltips.today
                }).append($('<span>').addClass(this._options.icons.today))));
            }
            if (!this._options.sideBySide && this._hasDate() && this._hasTime()) {
                row.push($('<td>').append($('<a>').attr({
                    'data-action': 'togglePicker',
                    'title': this._options.tooltips.selectTime
                }).append($('<span>').addClass(this._options.icons.time))));
            }
            if (this._options.buttons.showClear) {
                row.push($('<td>').append($('<a>').attr({
                    'data-action': 'clear',
                    'title': this._options.tooltips.clear
                }).append($('<span>').addClass(this._options.icons.clear))));
            }
            if (this._options.buttons.showClose) {
                row.push($('<td>').append($('<a>').attr({
                    'data-action': 'close',
                    'title': this._options.tooltips.close
                }).append($('<span>').addClass(this._options.icons.close))));
            }
            return row.length === 0 ? '' : $('<table>').addClass('table-condensed').append($('<tbody>').append($('<tr>').append(row)));
        };

        TempusDominusBootstrap4.prototype._getTemplate = function _getTemplate() {
            var template = $('<div>').addClass('bootstrap-datetimepicker-widget dropdown-menu'),
                dateView = $('<div>').addClass('datepicker').append(this._getDatePickerTemplate()),
                timeView = $('<div>').addClass('timepicker').append(this._getTimePickerTemplate()),
                content = $('<ul>').addClass('list-unstyled'),
                toolbar = $('<li>').addClass('picker-switch' + (this._options.collapse ? ' accordion-toggle' : '')).append(this._getToolbar());

            if (this._options.inline) {
                template.removeClass('dropdown-menu');
            }

            if (this.use24Hours) {
                template.addClass('usetwentyfour');
            }
            if (this._isEnabled('s') && !this.use24Hours) {
                template.addClass('wider');
            }

            if (this._options.sideBySide && this._hasDate() && this._hasTime()) {
                template.addClass('timepicker-sbs');
                if (this._options.toolbarPlacement === 'top') {
                    template.append(toolbar);
                }
                template.append($('<div>').addClass('row').append(dateView.addClass('col-md-6')).append(timeView.addClass('col-md-6')));
                if (this._options.toolbarPlacement === 'bottom' || this._options.toolbarPlacement === 'default') {
                    template.append(toolbar);
                }
                return template;
            }

            if (this._options.toolbarPlacement === 'top') {
                content.append(toolbar);
            }
            if (this._hasDate()) {
                content.append($('<li>').addClass(this._options.collapse && this._hasTime() ? 'collapse' : '').addClass(this._options.collapse && this._hasTime() && this._options.viewMode === 'time' ? '' : 'show').append(dateView));
            }
            if (this._options.toolbarPlacement === 'default') {
                content.append(toolbar);
            }
            if (this._hasTime()) {
                content.append($('<li>').addClass(this._options.collapse && this._hasDate() ? 'collapse' : '').addClass(this._options.collapse && this._hasDate() && this._options.viewMode === 'time' ? 'show' : '').append(timeView));
            }
            if (this._options.toolbarPlacement === 'bottom') {
                content.append(toolbar);
            }
            return template.append(content);
        };

        TempusDominusBootstrap4.prototype._place = function _place(e) {
            var self = e && e.data && e.data.picker || this,
                vertical = self._options.widgetPositioning.vertical,
                horizontal = self._options.widgetPositioning.horizontal,
                parent = void 0;
            var position = (self.component || self._element).position(),
                offset = (self.component || self._element).offset();
            if (self._options.widgetParent) {
                parent = self._options.widgetParent.append(self.widget);
            } else if (self._element.is('input')) {
                parent = self._element.after(self.widget).parent();
            } else if (self._options.inline) {
                parent = self._element.append(self.widget);
                return;
            } else {
                parent = self._element;
                self._element.children().first().after(self.widget);
            }

            // Top and bottom logic
            if (vertical === 'auto') {
                //noinspection JSValidateTypes
                if (offset.top + self.widget.height() * 1.5 >= $(window).height() + $(window).scrollTop() && self.widget.height() + self._element.outerHeight() < offset.top) {
                    vertical = 'top';
                } else {
                    vertical = 'bottom';
                }
            }

            // Left and right logic
            if (horizontal === 'auto') {
                if (parent.width() < offset.left + self.widget.outerWidth() / 2 && offset.left + self.widget.outerWidth() > $(window).width()) {
                    horizontal = 'right';
                } else {
                    horizontal = 'left';
                }
            }

            if (vertical === 'top') {
                self.widget.addClass('top').removeClass('bottom');
            } else {
                self.widget.addClass('bottom').removeClass('top');
            }

            if (horizontal === 'right') {
                self.widget.addClass('float-right');
            } else {
                self.widget.removeClass('float-right');
            }

            // find the first parent element that has a relative css positioning
            if (parent.css('position') !== 'relative') {
                parent = parent.parents().filter(function () {
                    return $(this).css('position') === 'relative';
                }).first();
            }

            if (parent.length === 0) {
                throw new Error('datetimepicker component should be placed within a relative positioned container');
            }

            self.widget.css({
                top: vertical === 'top' ? 'auto' : position.top + self._element.outerHeight() + 'px',
                bottom: vertical === 'top' ? parent.outerHeight() - (parent === self._element ? 0 : position.top) + 'px' : 'auto',
                left: horizontal === 'left' ? (parent === self._element ? 0 : position.left) + 'px' : 'auto',
                right: horizontal === 'left' ? 'auto' : parent.outerWidth() - self._element.outerWidth() - (parent === self._element ? 0 : position.left) + 'px'
            });
        };

        TempusDominusBootstrap4.prototype._fillDow = function _fillDow() {
            var row = $('<tr>'),
                currentDate = this._viewDate.clone().startOf('w').startOf('d');

            if (this._options.calendarWeeks === true) {
                row.append($('<th>').addClass('cw').text('#'));
            }

            while (currentDate.isBefore(this._viewDate.clone().endOf('w'))) {
                row.append($('<th>').addClass('dow').text(currentDate.format('dd')));
                currentDate.add(1, 'd');
            }
            this.widget.find('.datepicker-days thead').append(row);
        };

        TempusDominusBootstrap4.prototype._fillMonths = function _fillMonths() {
            var spans = [],
                monthsShort = this._viewDate.clone().startOf('y').startOf('d');
            while (monthsShort.isSame(this._viewDate, 'y')) {
                spans.push($('<span>').attr('data-action', 'selectMonth').addClass('month').text(monthsShort.format('MMM')));
                monthsShort.add(1, 'M');
            }
            this.widget.find('.datepicker-months td').empty().append(spans);
        };

        TempusDominusBootstrap4.prototype._updateMonths = function _updateMonths() {
            var monthsView = this.widget.find('.datepicker-months'),
                monthsViewHeader = monthsView.find('th'),
                months = monthsView.find('tbody').find('span'),
                self = this;

            monthsViewHeader.eq(0).find('span').attr('title', this._options.tooltips.prevYear);
            monthsViewHeader.eq(1).attr('title', this._options.tooltips.selectYear);
            monthsViewHeader.eq(2).find('span').attr('title', this._options.tooltips.nextYear);

            monthsView.find('.disabled').removeClass('disabled');

            if (!this._isValid(this._viewDate.clone().subtract(1, 'y'), 'y')) {
                monthsViewHeader.eq(0).addClass('disabled');
            }

            monthsViewHeader.eq(1).text(this._viewDate.year());

            if (!this._isValid(this._viewDate.clone().add(1, 'y'), 'y')) {
                monthsViewHeader.eq(2).addClass('disabled');
            }

            months.removeClass('active');
            if (this._getLastPickedDate().isSame(this._viewDate, 'y') && !this.unset) {
                months.eq(this._getLastPickedDate().month()).addClass('active');
            }

            months.each(function (index) {
                if (!self._isValid(self._viewDate.clone().month(index), 'M')) {
                    $(this).addClass('disabled');
                }
            });
        };

        TempusDominusBootstrap4.prototype._getStartEndYear = function _getStartEndYear(factor, year) {
            var step = factor / 10,
                startYear = Math.floor(year / factor) * factor,
                endYear = startYear + step * 9,
                focusValue = Math.floor(year / step) * step;
            return [startYear, endYear, focusValue];
        };

        TempusDominusBootstrap4.prototype._updateYears = function _updateYears() {
            var yearsView = this.widget.find('.datepicker-years'),
                yearsViewHeader = yearsView.find('th'),
                yearCaps = this._getStartEndYear(10, this._viewDate.year()),
                startYear = this._viewDate.clone().year(yearCaps[0]),
                endYear = this._viewDate.clone().year(yearCaps[1]);
            var html = '';

            yearsViewHeader.eq(0).find('span').attr('title', this._options.tooltips.prevDecade);
            yearsViewHeader.eq(1).attr('title', this._options.tooltips.selectDecade);
            yearsViewHeader.eq(2).find('span').attr('title', this._options.tooltips.nextDecade);

            yearsView.find('.disabled').removeClass('disabled');

            if (this._options.minDate && this._options.minDate.isAfter(startYear, 'y')) {
                yearsViewHeader.eq(0).addClass('disabled');
            }

            yearsViewHeader.eq(1).text(startYear.year() + '-' + endYear.year());

            if (this._options.maxDate && this._options.maxDate.isBefore(endYear, 'y')) {
                yearsViewHeader.eq(2).addClass('disabled');
            }

            html += '<span data-action="selectYear" class="year old">' + (startYear.year() - 1) + '</span>';
            while (!startYear.isAfter(endYear, 'y')) {
                html += '<span data-action="selectYear" class="year' + (startYear.isSame(this._getLastPickedDate(), 'y') && !this.unset ? ' active' : '') + (!this._isValid(startYear, 'y') ? ' disabled' : '') + '">' + startYear.year() + '</span>';
                startYear.add(1, 'y');
            }
            html += '<span data-action="selectYear" class="year old">' + startYear.year() + '</span>';

            yearsView.find('td').html(html);
        };

        TempusDominusBootstrap4.prototype._updateDecades = function _updateDecades() {
            var decadesView = this.widget.find('.datepicker-decades'),
                decadesViewHeader = decadesView.find('th'),
                yearCaps = this._getStartEndYear(100, this._viewDate.year()),
                startDecade = this._viewDate.clone().year(yearCaps[0]),
                endDecade = this._viewDate.clone().year(yearCaps[1]);
            var minDateDecade = false,
                maxDateDecade = false,
                endDecadeYear = void 0,
                html = '';

            decadesViewHeader.eq(0).find('span').attr('title', this._options.tooltips.prevCentury);
            decadesViewHeader.eq(2).find('span').attr('title', this._options.tooltips.nextCentury);

            decadesView.find('.disabled').removeClass('disabled');

            if (startDecade.year() === 0 || this._options.minDate && this._options.minDate.isAfter(startDecade, 'y')) {
                decadesViewHeader.eq(0).addClass('disabled');
            }

            decadesViewHeader.eq(1).text(startDecade.year() + '-' + endDecade.year());

            if (this._options.maxDate && this._options.maxDate.isBefore(endDecade, 'y')) {
                decadesViewHeader.eq(2).addClass('disabled');
            }

            if (startDecade.year() - 10 < 0) {
                html += '<span>&nbsp;</span>';
            } else {
                html += '<span data-action="selectDecade" class="decade old" data-selection="' + (startDecade.year() + 6) + '">' + (startDecade.year() - 10) + '</span>';
            }

            while (!startDecade.isAfter(endDecade, 'y')) {
                endDecadeYear = startDecade.year() + 11;
                minDateDecade = this._options.minDate && this._options.minDate.isAfter(startDecade, 'y') && this._options.minDate.year() <= endDecadeYear;
                maxDateDecade = this._options.maxDate && this._options.maxDate.isAfter(startDecade, 'y') && this._options.maxDate.year() <= endDecadeYear;
                html += '<span data-action="selectDecade" class="decade' + (this._getLastPickedDate().isAfter(startDecade) && this._getLastPickedDate().year() <= endDecadeYear ? ' active' : '') + (!this._isValid(startDecade, 'y') && !minDateDecade && !maxDateDecade ? ' disabled' : '') + '" data-selection="' + (startDecade.year() + 6) + '">' + startDecade.year() + '</span>';
                startDecade.add(10, 'y');
            }
            html += '<span data-action="selectDecade" class="decade old" data-selection="' + (startDecade.year() + 6) + '">' + startDecade.year() + '</span>';

            decadesView.find('td').html(html);
        };

        TempusDominusBootstrap4.prototype._fillDate = function _fillDate() {
            var daysView = this.widget.find('.datepicker-days'),
                daysViewHeader = daysView.find('th'),
                html = [];
            var currentDate = void 0,
                row = void 0,
                clsName = void 0,
                i = void 0;

            if (!this._hasDate()) {
                return;
            }

            daysViewHeader.eq(0).find('span').attr('title', this._options.tooltips.prevMonth);
            daysViewHeader.eq(1).attr('title', this._options.tooltips.selectMonth);
            daysViewHeader.eq(2).find('span').attr('title', this._options.tooltips.nextMonth);

            daysView.find('.disabled').removeClass('disabled');
            daysViewHeader.eq(1).text(this._viewDate.format(this._options.dayViewHeaderFormat));

            if (!this._isValid(this._viewDate.clone().subtract(1, 'M'), 'M')) {
                daysViewHeader.eq(0).addClass('disabled');
            }
            if (!this._isValid(this._viewDate.clone().add(1, 'M'), 'M')) {
                daysViewHeader.eq(2).addClass('disabled');
            }

            currentDate = this._viewDate.clone().startOf('M').startOf('w').startOf('d');

            for (i = 0; i < 42; i++) {
                //always display 42 days (should show 6 weeks)
                if (currentDate.weekday() === 0) {
                    row = $('<tr>');
                    if (this._options.calendarWeeks) {
                        row.append('<td class="cw">' + currentDate.week() + '</td>');
                    }
                    html.push(row);
                }
                clsName = '';
                if (currentDate.isBefore(this._viewDate, 'M')) {
                    clsName += ' old';
                }
                if (currentDate.isAfter(this._viewDate, 'M')) {
                    clsName += ' new';
                }
                if (this._options.allowMultidate) {
                    var index = this._datesFormatted.indexOf(currentDate.format('YYYY-MM-DD'));
                    if (index !== -1) {
                        if (currentDate.isSame(this._datesFormatted[index], 'd') && !this.unset) {
                            clsName += ' active';
                        }
                    }
                } else {
                    if (currentDate.isSame(this._getLastPickedDate(), 'd') && !this.unset) {
                        clsName += ' active';
                    }
                }
                if (!this._isValid(currentDate, 'd')) {
                    clsName += ' disabled';
                }
                if (currentDate.isSame(this.getMoment(), 'd')) {
                    clsName += ' today';
                }
                if (currentDate.day() === 0 || currentDate.day() === 6) {
                    clsName += ' weekend';
                }
                row.append('<td data-action="selectDay" data-day="' + currentDate.format('L') + '" class="day' + clsName + '">' + currentDate.date() + '</td>');
                currentDate.add(1, 'd');
            }

            daysView.find('tbody').empty().append(html);

            this._updateMonths();

            this._updateYears();

            this._updateDecades();
        };

        TempusDominusBootstrap4.prototype._fillHours = function _fillHours() {
            var table = this.widget.find('.timepicker-hours table'),
                currentHour = this._viewDate.clone().startOf('d'),
                html = [];
            var row = $('<tr>');

            if (this._viewDate.hour() > 11 && !this.use24Hours) {
                currentHour.hour(12);
            }
            while (currentHour.isSame(this._viewDate, 'd') && (this.use24Hours || this._viewDate.hour() < 12 && currentHour.hour() < 12 || this._viewDate.hour() > 11)) {
                if (currentHour.hour() % 4 === 0) {
                    row = $('<tr>');
                    html.push(row);
                }
                row.append('<td data-action="selectHour" class="hour' + (!this._isValid(currentHour, 'h') ? ' disabled' : '') + '">' + currentHour.format(this.use24Hours ? 'HH' : 'hh') + '</td>');
                currentHour.add(1, 'h');
            }
            table.empty().append(html);
        };

        TempusDominusBootstrap4.prototype._fillMinutes = function _fillMinutes() {
            var table = this.widget.find('.timepicker-minutes table'),
                currentMinute = this._viewDate.clone().startOf('h'),
                html = [],
                step = this._options.stepping === 1 ? 5 : this._options.stepping;
            var row = $('<tr>');

            while (this._viewDate.isSame(currentMinute, 'h')) {
                if (currentMinute.minute() % (step * 4) === 0) {
                    row = $('<tr>');
                    html.push(row);
                }
                row.append('<td data-action="selectMinute" class="minute' + (!this._isValid(currentMinute, 'm') ? ' disabled' : '') + '">' + currentMinute.format('mm') + '</td>');
                currentMinute.add(step, 'm');
            }
            table.empty().append(html);
        };

        TempusDominusBootstrap4.prototype._fillSeconds = function _fillSeconds() {
            var table = this.widget.find('.timepicker-seconds table'),
                currentSecond = this._viewDate.clone().startOf('m'),
                html = [];
            var row = $('<tr>');

            while (this._viewDate.isSame(currentSecond, 'm')) {
                if (currentSecond.second() % 20 === 0) {
                    row = $('<tr>');
                    html.push(row);
                }
                row.append('<td data-action="selectSecond" class="second' + (!this._isValid(currentSecond, 's') ? ' disabled' : '') + '">' + currentSecond.format('ss') + '</td>');
                currentSecond.add(5, 's');
            }

            table.empty().append(html);
        };

        TempusDominusBootstrap4.prototype._fillTime = function _fillTime() {
            var toggle = void 0,
                newDate = void 0;
            var timeComponents = this.widget.find('.timepicker span[data-time-component]');

            if (!this.use24Hours) {
                toggle = this.widget.find('.timepicker [data-action=togglePeriod]');
                newDate = this._getLastPickedDate().clone().add(this._getLastPickedDate().hours() >= 12 ? -12 : 12, 'h');

                toggle.text(this._getLastPickedDate().format('A'));

                if (this._isValid(newDate, 'h')) {
                    toggle.removeClass('disabled');
                } else {
                    toggle.addClass('disabled');
                }
            }
            timeComponents.filter('[data-time-component=hours]').text(this._getLastPickedDate().format('' + (this.use24Hours ? 'HH' : 'hh')));
            timeComponents.filter('[data-time-component=minutes]').text(this._getLastPickedDate().format('mm'));
            timeComponents.filter('[data-time-component=seconds]').text(this._getLastPickedDate().format('ss'));

            this._fillHours();
            this._fillMinutes();
            this._fillSeconds();
        };

        TempusDominusBootstrap4.prototype._doAction = function _doAction(e, action) {
            var lastPicked = this._getLastPickedDate();
            if ($(e.currentTarget).is('.disabled')) {
                return false;
            }
            action = action || $(e.currentTarget).data('action');
            switch (action) {
                case 'next':
                    {
                        var navFnc = DateTimePicker.DatePickerModes[this.currentViewMode].NAV_FUNCTION;
                        this._viewDate.add(DateTimePicker.DatePickerModes[this.currentViewMode].NAV_STEP, navFnc);
                        this._fillDate();
                        this._viewUpdate(navFnc);
                        break;
                    }
                case 'previous':
                    {
                        var _navFnc = DateTimePicker.DatePickerModes[this.currentViewMode].NAV_FUNCTION;
                        this._viewDate.subtract(DateTimePicker.DatePickerModes[this.currentViewMode].NAV_STEP, _navFnc);
                        this._fillDate();
                        this._viewUpdate(_navFnc);
                        break;
                    }
                case 'pickerSwitch':
                    this._showMode(1);
                    break;
                case 'selectMonth':
                    {
                        var month = $(e.target).closest('tbody').find('span').index($(e.target));
                        this._viewDate.month(month);
                        if (this.currentViewMode === DateTimePicker.MinViewModeNumber) {
                            this._setValue(lastPicked.clone().year(this._viewDate.year()).month(this._viewDate.month()), this._getLastPickedDateIndex());
                            if (!this._options.inline) {
                                this.hide();
                            }
                        } else {
                            this._showMode(-1);
                            this._fillDate();
                        }
                        this._viewUpdate('M');
                        break;
                    }
                case 'selectYear':
                    {
                        var year = parseInt($(e.target).text(), 10) || 0;
                        this._viewDate.year(year);
                        if (this.currentViewMode === DateTimePicker.MinViewModeNumber) {
                            this._setValue(lastPicked.clone().year(this._viewDate.year()), this._getLastPickedDateIndex());
                            if (!this._options.inline) {
                                this.hide();
                            }
                        } else {
                            this._showMode(-1);
                            this._fillDate();
                        }
                        this._viewUpdate('YYYY');
                        break;
                    }
                case 'selectDecade':
                    {
                        var _year = parseInt($(e.target).data('selection'), 10) || 0;
                        this._viewDate.year(_year);
                        if (this.currentViewMode === DateTimePicker.MinViewModeNumber) {
                            this._setValue(lastPicked.clone().year(this._viewDate.year()), this._getLastPickedDateIndex());
                            if (!this._options.inline) {
                                this.hide();
                            }
                        } else {
                            this._showMode(-1);
                            this._fillDate();
                        }
                        this._viewUpdate('YYYY');
                        break;
                    }
                case 'selectDay':
                    {
                        var day = this._viewDate.clone();
                        if ($(e.target).is('.old')) {
                            day.subtract(1, 'M');
                        }
                        if ($(e.target).is('.new')) {
                            day.add(1, 'M');
                        }
                        this._setValue(day.date(parseInt($(e.target).text(), 10)), this._getLastPickedDateIndex());
                        if (!this._hasTime() && !this._options.keepOpen && !this._options.inline) {
                            this.hide();
                        }
                        break;
                    }
                case 'incrementHours':
                    {
                        var newDate = lastPicked.clone().add(1, 'h');
                        if (this._isValid(newDate, 'h')) {
                            this._setValue(newDate, this._getLastPickedDateIndex());
                        }
                        break;
                    }
                case 'incrementMinutes':
                    {
                        var _newDate = lastPicked.clone().add(this._options.stepping, 'm');
                        if (this._isValid(_newDate, 'm')) {
                            this._setValue(_newDate, this._getLastPickedDateIndex());
                        }
                        break;
                    }
                case 'incrementSeconds':
                    {
                        var _newDate2 = lastPicked.clone().add(1, 's');
                        if (this._isValid(_newDate2, 's')) {
                            this._setValue(_newDate2, this._getLastPickedDateIndex());
                        }
                        break;
                    }
                case 'decrementHours':
                    {
                        var _newDate3 = lastPicked.clone().subtract(1, 'h');
                        if (this._isValid(_newDate3, 'h')) {
                            this._setValue(_newDate3, this._getLastPickedDateIndex());
                        }
                        break;
                    }
                case 'decrementMinutes':
                    {
                        var _newDate4 = lastPicked.clone().subtract(this._options.stepping, 'm');
                        if (this._isValid(_newDate4, 'm')) {
                            this._setValue(_newDate4, this._getLastPickedDateIndex());
                        }
                        break;
                    }
                case 'decrementSeconds':
                    {
                        var _newDate5 = lastPicked.clone().subtract(1, 's');
                        if (this._isValid(_newDate5, 's')) {
                            this._setValue(_newDate5, this._getLastPickedDateIndex());
                        }
                        break;
                    }
                case 'togglePeriod':
                    {
                        this._setValue(lastPicked.clone().add(lastPicked.hours() >= 12 ? -12 : 12, 'h'), this._getLastPickedDateIndex());
                        break;
                    }
                case 'togglePicker':
                    {
                        var $this = $(e.target),
                            $link = $this.closest('a'),
                            $parent = $this.closest('ul'),
                            expanded = $parent.find('.show'),
                            closed = $parent.find('.collapse:not(.show)'),
                            $span = $this.is('span') ? $this : $this.find('span');
                        var collapseData = void 0;

                        if (expanded && expanded.length) {
                            collapseData = expanded.data('collapse');
                            if (collapseData && collapseData.transitioning) {
                                return true;
                            }
                            if (expanded.collapse) {
                                // if collapse plugin is available through bootstrap.js then use it
                                expanded.collapse('hide');
                                closed.collapse('show');
                            } else {
                                // otherwise just toggle in class on the two views
                                expanded.removeClass('show');
                                closed.addClass('show');
                            }
                            $span.toggleClass(this._options.icons.time + ' ' + this._options.icons.date);

                            if ($span.hasClass(this._options.icons.date)) {
                                $link.attr('title', this._options.tooltips.selectDate);
                            } else {
                                $link.attr('title', this._options.tooltips.selectTime);
                            }
                        }
                    }
                    break;
                case 'showPicker':
                    this.widget.find('.timepicker > div:not(.timepicker-picker)').hide();
                    this.widget.find('.timepicker .timepicker-picker').show();
                    break;
                case 'showHours':
                    this.widget.find('.timepicker .timepicker-picker').hide();
                    this.widget.find('.timepicker .timepicker-hours').show();
                    break;
                case 'showMinutes':
                    this.widget.find('.timepicker .timepicker-picker').hide();
                    this.widget.find('.timepicker .timepicker-minutes').show();
                    break;
                case 'showSeconds':
                    this.widget.find('.timepicker .timepicker-picker').hide();
                    this.widget.find('.timepicker .timepicker-seconds').show();
                    break;
                case 'selectHour':
                    {
                        var hour = parseInt($(e.target).text(), 10);

                        if (!this.use24Hours) {
                            if (lastPicked.hours() >= 12) {
                                if (hour !== 12) {
                                    hour += 12;
                                }
                            } else {
                                if (hour === 12) {
                                    hour = 0;
                                }
                            }
                        }
                        this._setValue(lastPicked.clone().hours(hour), this._getLastPickedDateIndex());
                        this._doAction(e, 'showPicker');
                        break;
                    }
                case 'selectMinute':
                    this._setValue(lastPicked.clone().minutes(parseInt($(e.target).text(), 10)), this._getLastPickedDateIndex());
                    this._doAction(e, 'showPicker');
                    break;
                case 'selectSecond':
                    this._setValue(lastPicked.clone().seconds(parseInt($(e.target).text(), 10)), this._getLastPickedDateIndex());
                    this._doAction(e, 'showPicker');
                    break;
                case 'clear':
                    this.clear();
                    break;
                case 'today':
                    {
                        var todaysDate = this.getMoment();
                        if (this._isValid(todaysDate, 'd')) {
                            this._setValue(todaysDate, this._getLastPickedDateIndex());
                        }
                        break;
                    }
            }
            return false;
        };

        //public


        TempusDominusBootstrap4.prototype.hide = function hide() {
            var transitioning = false;
            if (!this.widget) {
                return;
            }
            // Ignore event if in the middle of a picker transition
            this.widget.find('.collapse').each(function () {
                var collapseData = $(this).data('collapse');
                if (collapseData && collapseData.transitioning) {
                    transitioning = true;
                    return false;
                }
                return true;
            });
            if (transitioning) {
                return;
            }
            if (this.component && this.component.hasClass('btn')) {
                this.component.toggleClass('active');
            }
            this.widget.hide();

            $(window).off('resize', this._place());
            this.widget.off('click', '[data-action]');
            this.widget.off('mousedown', false);

            this.widget.remove();
            this.widget = false;

            this._notifyEvent({
                type: DateTimePicker.Event.HIDE,
                date: this._getLastPickedDate().clone()
            });

            if (this.input !== undefined) {
                this.input.blur();
            }

            this._viewDate = this._getLastPickedDate().clone();
        };

        TempusDominusBootstrap4.prototype.show = function show() {
            var currentMoment = void 0;
            var useCurrentGranularity = {
                'year': function year(m) {
                    return m.month(0).date(1).hours(0).seconds(0).minutes(0);
                },
                'month': function month(m) {
                    return m.date(1).hours(0).seconds(0).minutes(0);
                },
                'day': function day(m) {
                    return m.hours(0).seconds(0).minutes(0);
                },
                'hour': function hour(m) {
                    return m.seconds(0).minutes(0);
                },
                'minute': function minute(m) {
                    return m.seconds(0);
                }
            };

            if (this.input !== undefined) {
                if (this.input.prop('disabled') || !this._options.ignoreReadonly && this.input.prop('readonly') || this.widget) {
                    return;
                }
                if (this.input.val() !== undefined && this.input.val().trim().length !== 0) {
                    this._setValue(this._parseInputDate(this.input.val().trim()), 0);
                } else if (this.unset && this._options.useCurrent) {
                    currentMoment = this.getMoment();
                    if (typeof this._options.useCurrent === 'string') {
                        currentMoment = useCurrentGranularity[this._options.useCurrent](currentMoment);
                    }
                    this._setValue(currentMoment, 0);
                }
            } else if (this.unset && this._options.useCurrent) {
                currentMoment = this.getMoment();
                if (typeof this._options.useCurrent === 'string') {
                    currentMoment = useCurrentGranularity[this._options.useCurrent](currentMoment);
                }
                this._setValue(currentMoment, 0);
            }

            this.widget = this._getTemplate();

            this._fillDow();
            this._fillMonths();

            this.widget.find('.timepicker-hours').hide();
            this.widget.find('.timepicker-minutes').hide();
            this.widget.find('.timepicker-seconds').hide();

            this._update();
            this._showMode();

            $(window).on('resize', { picker: this }, this._place);
            this.widget.on('click', '[data-action]', $.proxy(this._doAction, this)); // this handles clicks on the widget
            this.widget.on('mousedown', false);

            if (this.component && this.component.hasClass('btn')) {
                this.component.toggleClass('active');
            }
            this._place();
            this.widget.show();
            if (this.input !== undefined && this._options.focusOnShow && !this.input.is(':focus')) {
                this.input.focus();
            }

            this._notifyEvent({
                type: DateTimePicker.Event.SHOW
            });
        };

        TempusDominusBootstrap4.prototype.destroy = function destroy() {
            this.hide();
            //todo doc off?
            this._element.removeData(DateTimePicker.DATA_KEY);
            this._element.removeData('date');
        };

        TempusDominusBootstrap4.prototype.disable = function disable() {
            this.hide();
            if (this.component && this.component.hasClass('btn')) {
                this.component.addClass('disabled');
            }
            if (this.input !== undefined) {
                this.input.prop('disabled', true); //todo disable this/comp if input is null
            }
        };

        TempusDominusBootstrap4.prototype.enable = function enable() {
            if (this.component && this.component.hasClass('btn')) {
                this.component.removeClass('disabled');
            }
            if (this.input !== undefined) {
                this.input.prop('disabled', false); //todo enable comp/this if input is null
            }
        };

        TempusDominusBootstrap4.prototype.toolbarPlacement = function toolbarPlacement(_toolbarPlacement) {
            if (arguments.length === 0) {
                return this._options.toolbarPlacement;
            }

            if (typeof _toolbarPlacement !== 'string') {
                throw new TypeError('toolbarPlacement() expects a string parameter');
            }
            if (toolbarPlacements.indexOf(_toolbarPlacement) === -1) {
                throw new TypeError('toolbarPlacement() parameter must be one of (' + toolbarPlacements.join(', ') + ') value');
            }
            this._options.toolbarPlacement = _toolbarPlacement;

            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        TempusDominusBootstrap4.prototype.widgetPositioning = function widgetPositioning(_widgetPositioning) {
            if (arguments.length === 0) {
                return $.extend({}, this._options.widgetPositioning);
            }

            if ({}.toString.call(_widgetPositioning) !== '[object Object]') {
                throw new TypeError('widgetPositioning() expects an object variable');
            }
            if (_widgetPositioning.horizontal) {
                if (typeof _widgetPositioning.horizontal !== 'string') {
                    throw new TypeError('widgetPositioning() horizontal variable must be a string');
                }
                _widgetPositioning.horizontal = _widgetPositioning.horizontal.toLowerCase();
                if (horizontalModes.indexOf(_widgetPositioning.horizontal) === -1) {
                    throw new TypeError('widgetPositioning() expects horizontal parameter to be one of (' + horizontalModes.join(', ') + ')');
                }
                this._options.widgetPositioning.horizontal = _widgetPositioning.horizontal;
            }
            if (_widgetPositioning.vertical) {
                if (typeof _widgetPositioning.vertical !== 'string') {
                    throw new TypeError('widgetPositioning() vertical variable must be a string');
                }
                _widgetPositioning.vertical = _widgetPositioning.vertical.toLowerCase();
                if (verticalModes.indexOf(_widgetPositioning.vertical) === -1) {
                    throw new TypeError('widgetPositioning() expects vertical parameter to be one of (' + verticalModes.join(', ') + ')');
                }
                this._options.widgetPositioning.vertical = _widgetPositioning.vertical;
            }
            this._update();
        };

        TempusDominusBootstrap4.prototype.widgetParent = function widgetParent(_widgetParent) {
            if (arguments.length === 0) {
                return this._options.widgetParent;
            }

            if (typeof _widgetParent === 'string') {
                _widgetParent = $(_widgetParent);
            }

            if (_widgetParent !== null && typeof _widgetParent !== 'string' && !(_widgetParent instanceof $)) {
                throw new TypeError('widgetParent() expects a string or a jQuery object parameter');
            }

            this._options.widgetParent = _widgetParent;
            if (this.widget) {
                this.hide();
                this.show();
            }
        };

        //static


        TempusDominusBootstrap4._jQueryHandleThis = function _jQueryHandleThis(me, option, argument) {
            var data = $(me).data(DateTimePicker.DATA_KEY);
            if ((typeof option === 'undefined' ? 'undefined' : _typeof(option)) === 'object') {
                $.extend({}, DateTimePicker.Default, option);
            }

            if (!data) {
                data = new TempusDominusBootstrap4($(me), option);
                $(me).data(DateTimePicker.DATA_KEY, data);
            }

            if (typeof option === 'string') {
                if (data[option] === undefined) {
                    throw new Error('No method named "' + option + '"');
                }
                if (argument === undefined) {
                    return data[option]();
                } else {
                    return data[option](argument);
                }
            }
        };

        TempusDominusBootstrap4._jQueryInterface = function _jQueryInterface(option, argument) {
            if (this.length === 1) {
                return TempusDominusBootstrap4._jQueryHandleThis(this[0], option, argument);
            }
            return this.each(function () {
                TempusDominusBootstrap4._jQueryHandleThis(this, option, argument);
            });
        };

        return TempusDominusBootstrap4;
    }(DateTimePicker);

    /**
    * ------------------------------------------------------------------------
    * jQuery
    * ------------------------------------------------------------------------
    */


    $(document).on(DateTimePicker.Event.CLICK_DATA_API, DateTimePicker.Selector.DATA_TOGGLE, function () {
        var $target = getSelectorFromElement($(this));
        if ($target.length === 0) {
            return;
        }
        TempusDominusBootstrap4._jQueryInterface.call($target, 'toggle');
    }).on(DateTimePicker.Event.CHANGE, '.' + DateTimePicker.ClassName.INPUT, function (event) {
        var $target = getSelectorFromElement($(this));
        if ($target.length === 0) {
            return;
        }
        TempusDominusBootstrap4._jQueryInterface.call($target, '_change', event);
    }).on(DateTimePicker.Event.BLUR, '.' + DateTimePicker.ClassName.INPUT, function (event) {
        var $target = getSelectorFromElement($(this)),
            config = $target.data(DateTimePicker.DATA_KEY);
        if ($target.length === 0) {
            return;
        }
        if (config._options.debug || window.debug) {
            return;
        }
        TempusDominusBootstrap4._jQueryInterface.call($target, 'hide', event);
    }).on(DateTimePicker.Event.KEYDOWN, '.' + DateTimePicker.ClassName.INPUT, function (event) {
        var $target = getSelectorFromElement($(this));
        if ($target.length === 0) {
            return;
        }
        TempusDominusBootstrap4._jQueryInterface.call($target, '_keydown', event);
    }).on(DateTimePicker.Event.KEYUP, '.' + DateTimePicker.ClassName.INPUT, function (event) {
        var $target = getSelectorFromElement($(this));
        if ($target.length === 0) {
            return;
        }
        TempusDominusBootstrap4._jQueryInterface.call($target, '_keyup', event);
    }).on(DateTimePicker.Event.FOCUS, '.' + DateTimePicker.ClassName.INPUT, function (event) {
        var $target = getSelectorFromElement($(this)),
            config = $target.data(DateTimePicker.DATA_KEY);
        if ($target.length === 0) {
            return;
        }
        if (!config._options.allowInputToggle) {
            return;
        }
        TempusDominusBootstrap4._jQueryInterface.call($target, config, event);
    });

    $.fn[DateTimePicker.NAME] = TempusDominusBootstrap4._jQueryInterface;
    $.fn[DateTimePicker.NAME].Constructor = TempusDominusBootstrap4;
    $.fn[DateTimePicker.NAME].noConflict = function () {
        $.fn[DateTimePicker.NAME] = JQUERY_NO_CONFLICT;
        return TempusDominusBootstrap4._jQueryInterface;
    };

    return TempusDominusBootstrap4;
}(jQuery);

}();

(function ($, moment)
{
   var pluginName = "bootstrapMaterialDatePicker";
   var pluginDataName = "plugin_" + pluginName;

   moment.locale('en');

   function Plugin(element, options)
   {
      this.currentView = 0;

      this.minDate;
      this.maxDate;

      this._attachedEvents = [];

      this.element = element;
      this.$element = $(element);


      this.params = {date: true, time: true, format: 'YYYY-MM-DD', minDate: null, maxDate: null, currentDate: null, lang: 'en', weekStart: 0, disabledDays: [], shortTime: false, clearButton: false, nowButton: false, cancelText: 'Cancel', okText: 'OK', clearText: 'Clear', nowText: 'Now', switchOnClick: false, triggerEvent: 'focus', monthPicker: false, year:true};
      this.params = $.fn.extend(this.params, options);

      this.name = "dtp_" + this.setName();
      this.$element.attr("data-dtp", this.name);

      moment.locale(this.params.lang);

      this.init();
   }

   $.fn[pluginName] = function (options, p)
   {
      this.each(function ()
      {
         if (!$.data(this, pluginDataName))
         {
            $.data(this, pluginDataName, new Plugin(this, options));
         } else
         {
            if (typeof ($.data(this, pluginDataName)[options]) === 'function')
            {
               $.data(this, pluginDataName)[options](p);
            }
            if (options === 'destroy')
            {
               delete $.data(this, pluginDataName);
            }
         }
      });
      return this;
   };

   Plugin.prototype =
           {
              init: function ()
              {
                 this.initDays();
                 this.initDates();

                 this.initTemplate();

                 this.initButtons();

                 this._attachEvent($(window), 'resize', this._centerBox.bind(this));
                 this._attachEvent(this.$dtpElement.find('.dtp-content'), 'click', this._onElementClick.bind(this));
                 this._attachEvent(this.$dtpElement, 'click', this._onBackgroundClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('.dtp-close > a'), 'click', this._onCloseClick.bind(this));
                 this._attachEvent(this.$element, this.params.triggerEvent, this._fireCalendar.bind(this));
              },
              initDays: function ()
              {
                 this.days = [];
                 for (var i = this.params.weekStart; this.days.length < 7; i++)
                 {
                    if (i > 6)
                    {
                       i = 0;
                    }
                    this.days.push(i.toString());
                 }
              },
              initDates: function ()
              {
                 if (this.$element.val().length > 0)
                 {
                    if (typeof (this.params.format) !== 'undefined' && this.params.format !== null)
                    {
                       this.currentDate = moment(this.$element.val(), this.params.format).locale(this.params.lang);
                    } else
                    {
                       this.currentDate = moment(this.$element.val()).locale(this.params.lang);
                    }
                 } else
                 {
                    if (typeof (this.$element.attr('value')) !== 'undefined' && this.$element.attr('value') !== null && this.$element.attr('value') !== "")
                    {
                       if (typeof (this.$element.attr('value')) === 'string')
                       {
                          if (typeof (this.params.format) !== 'undefined' && this.params.format !== null)
                          {
                             this.currentDate = moment(this.$element.attr('value'), this.params.format).locale(this.params.lang);
                          } else
                          {
                             this.currentDate = moment(this.$element.attr('value')).locale(this.params.lang);
                          }
                       }
                    } else
                    {
                       if (typeof (this.params.currentDate) !== 'undefined' && this.params.currentDate !== null)
                       {
                          if (typeof (this.params.currentDate) === 'string')
                          {
                             if (typeof (this.params.format) !== 'undefined' && this.params.format !== null)
                             {
                                this.currentDate = moment(this.params.currentDate, this.params.format).locale(this.params.lang);
                             } else
                             {
                                this.currentDate = moment(this.params.currentDate).locale(this.params.lang);
                             }
                          } else
                          {
                             if (typeof (this.params.currentDate.isValid) === 'undefined' || typeof (this.params.currentDate.isValid) !== 'function')
                             {
                                var x = this.params.currentDate.getTime();
                                this.currentDate = moment(x, "x").locale(this.params.lang);
                             } else
                             {
                                this.currentDate = this.params.currentDate;
                             }
                          }
                          this.$element.val(this.currentDate.format(this.params.format));
                       } else
                          this.currentDate = moment();
                    }
                 }

                 if (typeof (this.params.minDate) !== 'undefined' && this.params.minDate !== null)
                 {
                    if (typeof (this.params.minDate) === 'string')
                    {
                       if (typeof (this.params.format) !== 'undefined' && this.params.format !== null)
                       {
                          this.minDate = moment(this.params.minDate, this.params.format).locale(this.params.lang);
                       } else
                       {
                          this.minDate = moment(this.params.minDate).locale(this.params.lang);
                       }
                    } else
                    {
                       if (typeof (this.params.minDate.isValid) === 'undefined' || typeof (this.params.minDate.isValid) !== 'function')
                       {
                          var x = this.params.minDate.getTime();
                          this.minDate = moment(x, "x").locale(this.params.lang);
                       } else
                       {
                          this.minDate = this.params.minDate;
                       }
                    }
                 } else if (this.params.minDate === null)
                 {
                    this.minDate = null;
                 }

                 if (typeof (this.params.maxDate) !== 'undefined' && this.params.maxDate !== null)
                 {
                    if (typeof (this.params.maxDate) === 'string')
                    {
                       if (typeof (this.params.format) !== 'undefined' && this.params.format !== null)
                       {
                          this.maxDate = moment(this.params.maxDate, this.params.format).locale(this.params.lang);
                       } else
                       {
                          this.maxDate = moment(this.params.maxDate).locale(this.params.lang);
                       }
                    } else
                    {
                       if (typeof (this.params.maxDate.isValid) === 'undefined' || typeof (this.params.maxDate.isValid) !== 'function')
                       {
                          var x = this.params.maxDate.getTime();
                          this.maxDate = moment(x, "x").locale(this.params.lang);
                       } else
                       {
                          this.maxDate = this.params.maxDate;
                       }
                    }
                 } else if (this.params.maxDate === null)
                 {
                    this.maxDate = null;
                 }

                 if (!this.isAfterMinDate(this.currentDate))
                 {
                    this.currentDate = moment(this.minDate);
                 }
                 if (!this.isBeforeMaxDate(this.currentDate))
                 {
                    this.currentDate = moment(this.maxDate);
                 }
              },
              initTemplate: function ()
              {
                  var yearPicker = "";
                  var y =this.currentDate.year();
                  for (var i = y-3; i < y + 4; i++) {
                      yearPicker += '<div class="year-picker-item" data-year="' + i + '">' + i + '</div>';
                  }
                  this.midYear=y;
                  var yearHtml =
                      '<div class="dtp-picker-year hidden" >' +
                      '<div><a href="javascript:void(0);" class="btn btn-default dtp-select-year-range before" style="margin: 0;"><i class="ti-angle-up"></i></a></div>' +
                      yearPicker +
                      '<div><a href="javascript:void(0);" class="btn btn-default dtp-select-year-range after" style="margin: 0;"><i class="ti-angle-down"></i></a></div>' +
                      '</div>';

                 this.template = '<div class="dtp hidden" id="' + this.name + '">' +
                         '<div class="dtp-content">' +
                         '<div class="dtp-date-view">' +
                         '<header class="dtp-header">' +
                         '<div class="dtp-actual-day">Lundi</div>' +
                         '<div class="dtp-close"><a href="javascript:void(0);"><i class="ti-close"></i></a></div>' +
                         '</header>' +
                         '<div class="dtp-date hidden">' +
                         '<div>' +
                         '<div class="left center p10">' +
                         '<a href="javascript:void(0);" class="dtp-select-month-before"><i class="ti-angle-left"></i></a>' +
                         '</div>' +
                         '<div class="dtp-actual-month p80">MAR</div>' +
                         '<div class="right center p10">' +
                         '<a href="javascript:void(0);" class="dtp-select-month-after"><i class="ti-angle-right"></i></a>' +
                         '</div>' +
                         '<div class="clearfix"></div>' +
                         '</div>' +
                         '<div class="dtp-actual-num">13</div>' +
                         '<div>' +
                         '<div class="left center p10">' +
                         '<a href="javascript:void(0);" class="dtp-select-year-before"><i class="ti-angle-left"></i></a>' +
                         '</div>' +
                         '<div class="dtp-actual-year p80'+(this.params.year?"":" disabled")+'">2014</div>' +
                         '<div class="right center p10">' +
                         '<a href="javascript:void(0);" class="dtp-select-year-after"><i class="ti-angle-right"></i></a>' +
                         '</div>' +
                         '<div class="clearfix"></div>' +
                         '</div>' +
                         '</div>' +
                         '<div class="dtp-time hidden">' +
                         '<div class="dtp-actual-maxtime">23:55</div>' +
                         '</div>' +
                         '<div class="dtp-picker">' +
                         '<div class="dtp-picker-calendar"></div>' +
                         '<div class="dtp-picker-datetime hidden">' +
                         '<div class="dtp-actual-meridien">' +
                         '<div class="left p20">' +
                         '<a class="dtp-meridien-am" href="javascript:void(0);">AM</a>' +
                         '</div>' +
                         '<div class="dtp-actual-time p60"></div>' +
                         '<div class="right p20">' +
                         '<a class="dtp-meridien-pm" href="javascript:void(0);">PM</a>' +
                         '</div>' +
                         '<div class="clearfix"></div>' +
                         '</div>' +
                         '<div id="dtp-svg-clock">' +
                         '</div>' +
                         '</div>' +
                         yearHtml+
                         '</div>' +
                         '</div>' +
                         '<div class="dtp-buttons">' +
                         '<button class="dtp-btn-now btn btn-flat hidden">' + this.params.nowText + '</button>' +
                         '<button class="dtp-btn-clear btn btn-flat hidden">' + this.params.clearText + '</button>' +
                         '<button class="dtp-btn-cancel btn btn-info">' + this.params.cancelText + '</button>' +
                         '<button class="dtp-btn-ok btn btn-info m-r-10">' + this.params.okText + '</button>' +
                         '<div class="clearfix"></div>' +
                         '</div>' +
                         '</div>' +
                         '</div>';

                 if ($('body').find("#" + this.name).length <= 0)
                 {
                    $('body').append(this.template);

                    if (this)
                       this.dtpElement = $('body').find("#" + this.name);
                    this.$dtpElement = $(this.dtpElement);
                 }
              },
              initButtons: function ()
              {
                 this._attachEvent(this.$dtpElement.find('.dtp-btn-cancel'), 'click', this._onCancelClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('.dtp-btn-ok'), 'click', this._onOKClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('a.dtp-select-month-before'), 'click', this._onMonthBeforeClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('a.dtp-select-month-after'), 'click', this._onMonthAfterClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('a.dtp-select-year-before'), 'click', this._onYearBeforeClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('a.dtp-select-year-after'), 'click', this._onYearAfterClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('.dtp-actual-year'), 'click', this._onActualYearClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('a.dtp-select-year-range.before'), 'click', this._onYearRangeBeforeClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('a.dtp-select-year-range.after'), 'click', this._onYearRangeAfterClick.bind(this));
                 this._attachEvent(this.$dtpElement.find('div.year-picker-item'), 'click', this._onYearItemClick.bind(this));

                 if (this.params.clearButton === true)
                 {
                    this._attachEvent(this.$dtpElement.find('.dtp-btn-clear'), 'click', this._onClearClick.bind(this));
                    this.$dtpElement.find('.dtp-btn-clear').removeClass('hidden');
                 }

                 if (this.params.nowButton === true)
                 {
                    this._attachEvent(this.$dtpElement.find('.dtp-btn-now'), 'click', this._onNowClick.bind(this));
                    this.$dtpElement.find('.dtp-btn-now').removeClass('hidden');
                 }

                 if ((this.params.nowButton === true) && (this.params.clearButton === true))
                 {
                    this.$dtpElement.find('.dtp-btn-clear, .dtp-btn-now, .dtp-btn-cancel, .dtp-btn-ok').addClass('btn-xs');
                 } else if ((this.params.nowButton === true) || (this.params.clearButton === true))
                 {
                    this.$dtpElement.find('.dtp-btn-clear, .dtp-btn-now, .dtp-btn-cancel, .dtp-btn-ok').addClass('btn-sm');
                 }
              },
              initMeridienButtons: function ()
              {
                 this.$dtpElement.find('a.dtp-meridien-am').off('click').on('click', this._onSelectAM.bind(this));
                 this.$dtpElement.find('a.dtp-meridien-pm').off('click').on('click', this._onSelectPM.bind(this));
              },
              initDate: function (d)
              {
                 this.currentView = 0;

                 if (this.params.monthPicker === false)
                 {
                    this.$dtpElement.find('.dtp-picker-calendar').removeClass('hidden');
                 }
                 this.$dtpElement.find('.dtp-picker-datetime').addClass('hidden');
                 this.$dtpElement.find('.dtp-picker-year').addClass('hidden');

                 var _date = ((typeof (this.currentDate) !== 'undefined' && this.currentDate !== null) ? this.currentDate : null);
                 var _calendar = this.generateCalendar(this.currentDate);

                 if (typeof (_calendar.week) !== 'undefined' && typeof (_calendar.days) !== 'undefined')
                 {
                    var _template = this.constructHTMLCalendar(_date, _calendar);

                    this.$dtpElement.find('a.dtp-select-day').off('click');
                    this.$dtpElement.find('.dtp-picker-calendar').html(_template);

                    this.$dtpElement.find('a.dtp-select-day').on('click', this._onSelectDate.bind(this));

                    this.toggleButtons(_date);
                 }

                 this._centerBox();
                 this.showDate(_date);
              },
              initHours: function ()
              {
                 this.currentView = 1;

                 this.showTime(this.currentDate);
                 this.initMeridienButtons();

                 if (this.currentDate.hour() < 12)
                 {
                    this.$dtpElement.find('a.dtp-meridien-am').click();
                 } else
                 {
                    this.$dtpElement.find('a.dtp-meridien-pm').click();
                 }

                 var hFormat = ((this.params.shortTime) ? 'h' : 'H');

                 this.$dtpElement.find('.dtp-picker-datetime').removeClass('hidden');
                 this.$dtpElement.find('.dtp-picker-calendar').addClass('hidden');
                 this.$dtpElement.find('.dtp-picker-year').addClass('hidden');

                 var svgClockElement = this.createSVGClock(true);

                 for (var i = 0; i < 12; i++)
                 {
                    var x = -(162 * (Math.sin(-Math.PI * 2 * (i / 12))));
                    var y = -(162 * (Math.cos(-Math.PI * 2 * (i / 12))));

                    var fill = ((this.currentDate.format(hFormat) == i) ? "#9692d6" : 'transparent');
                    var color = ((this.currentDate.format(hFormat) == i) ? "#fff" : '#000');

                    var svgHourCircle = this.createSVGElement("circle", {'id': 'h-' + i, 'class': 'dtp-select-hour', 'style': 'cursor:pointer', r: '30', cx: x, cy: y, fill: fill, 'data-hour': i});

                    var svgHourText = this.createSVGElement("text", {'id': 'th-' + i, 'class': 'dtp-select-hour-text', 'text-anchor': 'middle', 'style': 'cursor:pointer', 'font-weight': 'bold', 'font-size': '20', x: x, y: y + 7, fill: color, 'data-hour': i});
                    svgHourText.textContent = ((i === 0) ? ((this.params.shortTime) ? 12 : i) : i);

                    if (!this.toggleTime(i, true))
                    {
                       svgHourCircle.className += " disabled";
                       svgHourText.className += " disabled";
                       svgHourText.setAttribute('fill', '#9692d6');
                    } else
                    {
                       svgHourCircle.addEventListener('click', this._onSelectHour.bind(this));
                       svgHourText.addEventListener('click', this._onSelectHour.bind(this));
                    }

                    svgClockElement.appendChild(svgHourCircle)
                    svgClockElement.appendChild(svgHourText)
                 }

                 if (!this.params.shortTime)
                 {
                    for (var i = 0; i < 12; i++)
                    {
                       var x = -(110 * (Math.sin(-Math.PI * 2 * (i / 12))));
                       var y = -(110 * (Math.cos(-Math.PI * 2 * (i / 12))));

                       var fill = ((this.currentDate.format(hFormat) == (i + 12)) ? "#9692d6" : 'transparent');
                       var color = ((this.currentDate.format(hFormat) == (i + 12)) ? "#fff" : '#000');

                       var svgHourCircle = this.createSVGElement("circle", {'id': 'h-' + (i + 12), 'class': 'dtp-select-hour', 'style': 'cursor:pointer', r: '30', cx: x, cy: y, fill: fill, 'data-hour': (i + 12)});

                       var svgHourText = this.createSVGElement("text", {'id': 'th-' + (i + 12), 'class': 'dtp-select-hour-text', 'text-anchor': 'middle', 'style': 'cursor:pointer', 'font-weight': 'bold', 'font-size': '22', x: x, y: y + 7, fill: color, 'data-hour': (i + 12)});
                       svgHourText.textContent = i + 12;

                       if (!this.toggleTime(i + 12, true))
                       {
                          svgHourCircle.className += " disabled";
                          svgHourText.className += " disabled";
                          svgHourText.setAttribute('fill', '#9692d6');
                       } else
                       {
                          svgHourCircle.addEventListener('click', this._onSelectHour.bind(this));
                          svgHourText.addEventListener('click', this._onSelectHour.bind(this));
                       }

                       svgClockElement.appendChild(svgHourCircle)
                       svgClockElement.appendChild(svgHourText)
                    }

                    this.$dtpElement.find('a.dtp-meridien-am').addClass('hidden');
                    this.$dtpElement.find('a.dtp-meridien-pm').addClass('hidden');
                 }

                 this._centerBox();
              },
              initMinutes: function ()
              {
                 this.currentView = 2;

                 this.showTime(this.currentDate);

                 this.initMeridienButtons();

                 if (this.currentDate.hour() < 12)
                 {
                    this.$dtpElement.find('a.dtp-meridien-am').click();
                 } else
                 {
                    this.$dtpElement.find('a.dtp-meridien-pm').click();
                 }

                 this.$dtpElement.find('.dtp-picker-year').addClass('hidden');
                 this.$dtpElement.find('.dtp-picker-calendar').addClass('hidden');
                 this.$dtpElement.find('.dtp-picker-datetime').removeClass('hidden');

                 var svgClockElement = this.createSVGClock(false);

                 for (var i = 0; i < 60; i++)
                 {
                    var s = ((i % 5 === 0) ? 162 : 158);
                    var r = ((i % 5 === 0) ? 30 : 20);

                    var x = -(s * (Math.sin(-Math.PI * 2 * (i / 60))));
                    var y = -(s * (Math.cos(-Math.PI * 2 * (i / 60))));

                    var color = ((this.currentDate.format("m") == i) ? "#9692d6" : 'transparent');

                    var svgMinuteCircle = this.createSVGElement("circle", {'id': 'm-' + i, 'class': 'dtp-select-minute', 'style': 'cursor:pointer', r: r, cx: x, cy: y, fill: color, 'data-minute': i});

                    if (!this.toggleTime(i, false))
                    {
                       svgMinuteCircle.className += " disabled";
                    } else
                    {
                       svgMinuteCircle.addEventListener('click', this._onSelectMinute.bind(this));
                    }

                    svgClockElement.appendChild(svgMinuteCircle)
                 }

                 for (var i = 0; i < 60; i++)
                 {
                    if ((i % 5) === 0)
                    {
                       var x = -(162 * (Math.sin(-Math.PI * 2 * (i / 60))));
                       var y = -(162 * (Math.cos(-Math.PI * 2 * (i / 60))));

                       var color = ((this.currentDate.format("m") == i) ? "#fff" : '#000');

                       var svgMinuteText = this.createSVGElement("text", {'id': 'tm-' + i, 'class': 'dtp-select-minute-text', 'text-anchor': 'middle', 'style': 'cursor:pointer', 'font-weight': 'bold', 'font-size': '20', x: x, y: y + 7, fill: color, 'data-minute': i});
                       svgMinuteText.textContent = i;

                       if (!this.toggleTime(i, false))
                       {
                          svgMinuteText.className += " disabled";
                          svgMinuteText.setAttribute('fill', '#9692d6');
                       } else
                       {
                          svgMinuteText.addEventListener('click', this._onSelectMinute.bind(this));
                       }

                       svgClockElement.appendChild(svgMinuteText)
                    }
                 }

                 this._centerBox();
              },
              animateHands: function ()
              {
                 var H = this.currentDate.hour();
                 var M = this.currentDate.minute();

                 var hh = this.$dtpElement.find('.hour-hand');
                 hh[0].setAttribute('transform', "rotate(" + 360 * H / 12 + ")");

                 var mh = this.$dtpElement.find('.minute-hand');
                 mh[0].setAttribute('transform', "rotate(" + 360 * M / 60 + ")");
              },
              createSVGClock: function (isHour)
              {
                 var hl = ((this.params.shortTime) ? -120 : -90);

                 var svgElement = this.createSVGElement("svg", {class: 'svg-clock', viewBox: '0,0,400,400'});
                 var svgGElement = this.createSVGElement("g", {transform: 'translate(200,200) '});
                 var svgClockFace = this.createSVGElement("circle", {r: '192', fill: '#eee', stroke: '#9692d6', 'stroke-width': 2});
                 var svgClockCenter = this.createSVGElement("circle", {r: '15', fill: '#756ede'});

                 svgGElement.appendChild(svgClockFace)

                 if (isHour)
                 {
                    var svgMinuteHand = this.createSVGElement("line", {class: 'minute-hand', x1: 0, y1: 0, x2: 0, y2: -150, stroke: '#9692d6', 'stroke-width': 2});
                    var svgHourHand = this.createSVGElement("line", {class: 'hour-hand', x1: 0, y1: 0, x2: 0, y2: hl, stroke: '#9692d6', 'stroke-width': 8});

                    svgGElement.appendChild(svgMinuteHand);
                    svgGElement.appendChild(svgHourHand);
                 } else
                 {
                    var svgMinuteHand = this.createSVGElement("line", {class: 'minute-hand', x1: 0, y1: 0, x2: 0, y2: -150, stroke: '#9692d6', 'stroke-width': 2});
                    var svgHourHand = this.createSVGElement("line", {class: 'hour-hand', x1: 0, y1: 0, x2: 0, y2: hl, stroke: '#9692d6', 'stroke-width': 8});

                    svgGElement.appendChild(svgHourHand);
                    svgGElement.appendChild(svgMinuteHand);
                 }

                 svgGElement.appendChild(svgClockCenter)

                 svgElement.appendChild(svgGElement)

                 this.$dtpElement.find("#dtp-svg-clock").empty();
                 this.$dtpElement.find("#dtp-svg-clock")[0].appendChild(svgElement);

                 this.animateHands();

                 return svgGElement;
              },
              createSVGElement: function (tag, attrs)
              {
                 var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                 for (var k in attrs)
                 {
                    el.setAttribute(k, attrs[k]);
                 }
                 return el;
              },
              isAfterMinDate: function (date, checkHour, checkMinute)
              {
                 var _return = true;

                 if (typeof (this.minDate) !== 'undefined' && this.minDate !== null)
                 {
                    var _minDate = moment(this.minDate);
                    var _date = moment(date);

                    if (!checkHour && !checkMinute)
                    {
                       _minDate.hour(0);
                       _minDate.minute(0);

                       _date.hour(0);
                       _date.minute(0);
                    }

                    _minDate.second(0);
                    _date.second(0);
                    _minDate.millisecond(0);
                    _date.millisecond(0);

                    if (!checkMinute)
                    {
                       _date.minute(0);
                       _minDate.minute(0);

                       _return = (parseInt(_date.format("X")) >= parseInt(_minDate.format("X")));
                    } else
                    {
                       _return = (parseInt(_date.format("X")) >= parseInt(_minDate.format("X")));
                    }
                 }

                 return _return;
              },
              isBeforeMaxDate: function (date, checkTime, checkMinute)
              {
                 var _return = true;

                 if (typeof (this.maxDate) !== 'undefined' && this.maxDate !== null)
                 {
                    var _maxDate = moment(this.maxDate);
                    var _date = moment(date);

                    if (!checkTime && !checkMinute)
                    {
                       _maxDate.hour(0);
                       _maxDate.minute(0);

                       _date.hour(0);
                       _date.minute(0);
                    }

                    _maxDate.second(0);
                    _date.second(0);
                    _maxDate.millisecond(0);
                    _date.millisecond(0);

                    if (!checkMinute)
                    {
                       _date.minute(0);
                       _maxDate.minute(0);

                       _return = (parseInt(_date.format("X")) <= parseInt(_maxDate.format("X")));
                    } else
                    {
                       _return = (parseInt(_date.format("X")) <= parseInt(_maxDate.format("X")));
                    }
                 }

                 return _return;
              },
              rotateElement: function (el, deg)
              {
                 $(el).css
                         ({
                            WebkitTransform: 'rotate(' + deg + 'deg)',
                            '-moz-transform': 'rotate(' + deg + 'deg)'
                         });
              },
              showDate: function (date)
              {
                 if (date)
                 {
                    this.$dtpElement.find('.dtp-actual-day').html(date.locale(this.params.lang).format('dddd'));
                    this.$dtpElement.find('.dtp-actual-month').html(date.locale(this.params.lang).format('MMM').toUpperCase());
                    this.$dtpElement.find('.dtp-actual-num').html(date.locale(this.params.lang).format('DD'));
                    this.$dtpElement.find('.dtp-actual-year').html(date.locale(this.params.lang).format('YYYY'));
                 }
              },
              showTime: function (date)
              {
                 if (date)
                 {
                    var minutes = date.minute();
                    var content = ((this.params.shortTime) ? date.format('hh') : date.format('HH')) + ':' + ((minutes.toString().length == 2) ? minutes : '0' + minutes) + ((this.params.shortTime) ? ' ' + date.format('A') : '');

                    if (this.params.date)
                       this.$dtpElement.find('.dtp-actual-time').html(content);
                    else
                    {
                       if (this.params.shortTime)
                          this.$dtpElement.find('.dtp-actual-day').html(date.format('A'));
                       else
                          this.$dtpElement.find('.dtp-actual-day').html('&nbsp;');

                       this.$dtpElement.find('.dtp-actual-maxtime').html(content);
                    }
                 }
              },
              selectDate: function (date)
              {
                 if (date)
                 {
                    this.currentDate.date(date);

                    this.showDate(this.currentDate);
                    this.$element.trigger('dateSelected', this.currentDate);
                 }
              },
              generateCalendar: function (date)
              {
                 var _calendar = {};

                 if (date !== null)
                 {
                    var startOfMonth = moment(date).locale(this.params.lang).startOf('month');
                    var endOfMonth = moment(date).locale(this.params.lang).endOf('month');

                    var iNumDay = startOfMonth.format('d');

                    _calendar.week = this.days;
                    _calendar.days = [];

                    for (var i = startOfMonth.date(); i <= endOfMonth.date(); i++)
                    {
                       if (i === startOfMonth.date())
                       {
                          var iWeek = _calendar.week.indexOf(iNumDay.toString());
                          if (iWeek > 0)
                          {
                             for (var x = 0; x < iWeek; x++)
                             {
                                _calendar.days.push(0);
                             }
                          }
                       }
                       _calendar.days.push(moment(startOfMonth).locale(this.params.lang).date(i));
                    }
                 }

                 return _calendar;
              },
              constructHTMLCalendar: function (date, calendar)
              {
                 var _template = "";

                 _template += '<div class="dtp-picker-month">' + date.locale(this.params.lang).format('MMMM YYYY') + '</div>';
                 _template += '<table class="table dtp-picker-days"><thead>';
                 for (var i = 0; i < calendar.week.length; i++)
                 {
                    _template += '<th>' + moment(parseInt(calendar.week[i]), "d").locale(this.params.lang).format("dd").substring(0, 1) + '</th>';
                 }

                 _template += '</thead>';
                 _template += '<tbody><tr>';

                 for (var i = 0; i < calendar.days.length; i++)
                 {
                    if (i % 7 == 0)
                       _template += '</tr><tr>';
                    _template += '<td data-date="' + moment(calendar.days[i]).locale(this.params.lang).format("D") + '">';
                    if (calendar.days[i] != 0)
                    {
                        if (this.isBeforeMaxDate(moment(calendar.days[i]), false, false) === false
                            || this.isAfterMinDate(moment(calendar.days[i]), false, false) === false
                            || this.params.disabledDays.indexOf(calendar.days[i].isoWeekday()) !== -1)
                        {
                            _template += '<span class="dtp-select-day">' + moment(calendar.days[i]).locale(this.params.lang).format("DD") + '</span>';
                        } else
                        {
                            if (moment(calendar.days[i]).locale(this.params.lang).format("DD") === moment(this.currentDate).locale(this.params.lang).format("DD"))
                            {
                                _template += '<a href="javascript:void(0);" class="dtp-select-day selected">' + moment(calendar.days[i]).locale(this.params.lang).format("DD") + '</a>';
                            } else
                            {
                                _template += '<a href="javascript:void(0);" class="dtp-select-day">' + moment(calendar.days[i]).locale(this.params.lang).format("DD") + '</a>';
                            }
                        }

                        _template += '</td>';
                    }
                 }
                 _template += '</tr></tbody></table>';

                 return _template;
              },
              setName: function ()
              {
                 var text = "";
                 var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                 for (var i = 0; i < 5; i++)
                 {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                 }

                 return text;
              },
              isPM: function ()
              {
                 return this.$dtpElement.find('a.dtp-meridien-pm').hasClass('selected');
              },
              setElementValue: function ()
              {
                 this.$element.trigger('beforeChange', this.currentDate);
                 if (typeof ($.material) !== 'undefined')
                 {
                    this.$element.removeClass('empty');
                 }
                 this.$element.val(moment(this.currentDate).locale(this.params.lang).format(this.params.format));
                 this.$element.trigger('change', this.currentDate);
              },
              toggleButtons: function (date)
              {
                 if (date && date.isValid())
                 {
                    var startOfMonth = moment(date).locale(this.params.lang).startOf('month');
                    var endOfMonth = moment(date).locale(this.params.lang).endOf('month');

                    if (!this.isAfterMinDate(startOfMonth, false, false))
                    {
                       this.$dtpElement.find('a.dtp-select-month-before').addClass('invisible');
                    } else
                    {
                       this.$dtpElement.find('a.dtp-select-month-before').removeClass('invisible');
                    }

                    if (!this.isBeforeMaxDate(endOfMonth, false, false))
                    {
                       this.$dtpElement.find('a.dtp-select-month-after').addClass('invisible');
                    } else
                    {
                       this.$dtpElement.find('a.dtp-select-month-after').removeClass('invisible');
                    }

                    var startOfYear = moment(date).locale(this.params.lang).startOf('year');
                    var endOfYear = moment(date).locale(this.params.lang).endOf('year');

                    if (!this.isAfterMinDate(startOfYear, false, false))
                    {
                       this.$dtpElement.find('a.dtp-select-year-before').addClass('invisible');
                    } else
                    {
                       this.$dtpElement.find('a.dtp-select-year-before').removeClass('invisible');
                    }

                    if (!this.isBeforeMaxDate(endOfYear, false, false))
                    {
                       this.$dtpElement.find('a.dtp-select-year-after').addClass('invisible');
                    } else
                    {
                       this.$dtpElement.find('a.dtp-select-year-after').removeClass('invisible');
                    }
                 }
              },
              toggleTime: function (value, isHours)
              {
                 var result = false;

                 if (isHours)
                 {
                    var _date = moment(this.currentDate);
                    _date.hour(this.convertHours(value)).minute(0).second(0);

                    result = !(this.isAfterMinDate(_date, true, false) === false || this.isBeforeMaxDate(_date, true, false) === false);
                 } else
                 {
                    var _date = moment(this.currentDate);
                    _date.minute(value).second(0);

                    result = !(this.isAfterMinDate(_date, true, true) === false || this.isBeforeMaxDate(_date, true, true) === false);
                 }

                 return result;
              },
              _attachEvent: function (el, ev, fn)
              {
                 el.on(ev, null, null, fn);
                 this._attachedEvents.push([el, ev, fn]);
              },
              _detachEvents: function ()
              {
                 for (var i = this._attachedEvents.length - 1; i >= 0; i--)
                 {
                    this._attachedEvents[i][0].off(this._attachedEvents[i][1], this._attachedEvents[i][2]);
                    this._attachedEvents.splice(i, 1);
                 }
              },
              _fireCalendar: function ()
              {
                 this.currentView = 0;
                 this.$element.blur();

                 this.initDates();

                 this.show();

                 if (this.params.date)
                 {
                    this.$dtpElement.find('.dtp-date').removeClass('hidden');
                    this.initDate();
                 } else
                 {
                    if (this.params.time)
                    {
                       this.$dtpElement.find('.dtp-time').removeClass('hidden');
                       this.initHours();
                    }
                 }
              },
              _onBackgroundClick: function (e)
              {
                 e.stopPropagation();
                 this.hide();
              },
              _onElementClick: function (e)
              {
                 e.stopPropagation();
              },
              _onKeydown: function (e)
              {
                 if (e.which === 27)
                 {
                    this.hide();
                 }
              },
              _onCloseClick: function ()
              {
                 this.hide();
              },
              _onClearClick: function ()
              {
                 this.currentDate = null;
                 this.$element.trigger('beforeChange', this.currentDate);
                 this.hide();
                 if (typeof ($.material) !== 'undefined')
                 {
                    this.$element.addClass('empty');
                 }
                 this.$element.val('');
                 this.$element.trigger('change', this.currentDate);
              },
              _onNowClick: function ()
              {
                 this.currentDate = moment();

                 if (this.params.date === true)
                 {
                    this.showDate(this.currentDate);

                    if (this.currentView === 0)
                    {
                       this.initDate();
                    }
                 }

                 if (this.params.time === true)
                 {
                    this.showTime(this.currentDate);

                    switch (this.currentView)
                    {
                       case 1 :
                          this.initHours();
                          break;
                       case 2 :
                          this.initMinutes();
                          break;
                    }

                    this.animateHands();
                 }
              },
              _onOKClick: function ()
              {
                 switch (this.currentView)
                 {
                    case 0:
                       if (this.params.time === true)
                       {
                          this.initHours();
                       } else
                       {
                          this.setElementValue();
                          this.hide();
                       }
                       break;
                    case 1:
                       this.initMinutes();
                       break;
                    case 2:
                       this.setElementValue();
                       this.hide();
                       break;
                 }
              },
              _onCancelClick: function ()
              {
                 if (this.params.time)
                 {
                    switch (this.currentView)
                    {
                       case 0:
                          this.hide();
                          break;
                       case 1:
                          if (this.params.date)
                          {
                             this.initDate();
                          } else
                          {
                             this.hide();
                          }
                          break;
                       case 2:
                          this.initHours();
                          break;
                    }
                 } else
                 {
                    this.hide();
                 }
              },
              _onMonthBeforeClick: function ()
              {
                 this.currentDate.subtract(1, 'months');
                 this.initDate(this.currentDate);
                  this._closeYearPicker();
              },
              _onMonthAfterClick: function ()
              {
                 this.currentDate.add(1, 'months');
                 this.initDate(this.currentDate);
                  this._closeYearPicker();
              },
              _onYearBeforeClick: function ()
              {
                 this.currentDate.subtract(1, 'years');
                 this.initDate(this.currentDate);
                  this._closeYearPicker();
              },
              _onYearAfterClick: function ()
              {
                 this.currentDate.add(1, 'years');
                 this.initDate(this.currentDate);
                  this._closeYearPicker();
              },
               refreshYearItems:function () {
                  var curYear=this.currentDate.year(),midYear=this.midYear;
                   var minYear=1850;
                   if (typeof (this.minDate) !== 'undefined' && this.minDate !== null){
                       minYear=moment(this.minDate).year();
                   }

                   var maxYear=2200;
                   if (typeof (this.maxDate) !== 'undefined' && this.maxDate !== null){
                       maxYear=moment(this.maxDate).year();
                   }

                   this.$dtpElement.find(".dtp-picker-year .invisible").removeClass("invisible");
                   this.$dtpElement.find(".year-picker-item").each(function (i, el) {
                       var newYear = midYear - 3 + i;
                       $(el).attr("data-year", newYear).text(newYear).data("year", newYear);
                       if (curYear == newYear) {
                           $(el).addClass("active");
                       } else {
                           $(el).removeClass("active");
                       }
                       if(newYear<minYear || newYear>maxYear){
                           $(el).addClass("invisible")
                       }
                   });
                   if(minYear>=midYear-3){
                       this.$dtpElement.find(".dtp-select-year-range.before").addClass('invisible');
                   }
                   if(maxYear<=midYear+3){
                       this.$dtpElement.find(".dtp-select-year-range.after").addClass('invisible');
                   }

                   this.$dtpElement.find(".dtp-select-year-range").data("mid", midYear);
               },
               _onActualYearClick:function(){
                  if(this.params.year){
                      if(this.$dtpElement.find('.dtp-picker-year.hidden').length>0) {
                          this.$dtpElement.find('.dtp-picker-datetime').addClass("hidden");
                          this.$dtpElement.find('.dtp-picker-calendar').addClass("hidden");
                          this.$dtpElement.find('.dtp-picker-year').removeClass("hidden");
                          this.midYear = this.currentDate.year();
                          this.refreshYearItems();
                      }else{
                          this._closeYearPicker();
                      }
                  }
               },
               _onYearRangeBeforeClick:function(){
                   this.midYear-=7;
                   this.refreshYearItems();
               },
               _onYearRangeAfterClick:function(){
                   this.midYear+=7;
                   this.refreshYearItems();
               },
               _onYearItemClick:function (e) {
                   var newYear = $(e.currentTarget).data('year');
                   var oldYear = this.currentDate.year();
                   var diff = newYear - oldYear;
                   this.currentDate.add(diff, 'years');
                   this.initDate(this.currentDate);

                   this._closeYearPicker();
                   this.$element.trigger("yearSelected",this.currentDate);
               },
               _closeYearPicker:function(){
                   this.$dtpElement.find('.dtp-picker-calendar').removeClass("hidden");
                   this.$dtpElement.find('.dtp-picker-year').addClass("hidden");
               },
               enableYearPicker:function () {
                    this.params.year=true;
                    this.$dtpElement.find(".dtp-actual-year").reomveClass("disabled");
               },
               disableYearPicker:function () {
                   this.params.year=false;
                   this.$dtpElement.find(".dtp-actual-year").addClass("disabled");
                   this._closeYearPicker();
               },
              _onSelectDate: function (e)
              {
                 this.$dtpElement.find('a.dtp-select-day').removeClass('selected');
                 $(e.currentTarget).addClass('selected');

                 this.selectDate($(e.currentTarget).parent().data("date"));

                 if (this.params.switchOnClick === true && this.params.time === true)
                    setTimeout(this.initHours.bind(this), 200);

                 if(this.params.switchOnClick === true && this.params.time === false) {
                    setTimeout(this._onOKClick.bind(this), 200);
                 }

              },
              _onSelectHour: function (e)
              {
                 if (!$(e.target).hasClass('disabled'))
                 {
                    var value = $(e.target).data('hour');
                    var parent = $(e.target).parent();

                    var h = parent.find('.dtp-select-hour');
                    for (var i = 0; i < h.length; i++)
                    {
                       $(h[i]).attr('fill', 'transparent');
                    }
                    var th = parent.find('.dtp-select-hour-text');
                    for (var i = 0; i < th.length; i++)
                    {
                       $(th[i]).attr('fill', '#000');
                    }

                    $(parent.find('#h-' + value)).attr('fill', '#9692d6');
                    $(parent.find('#th-' + value)).attr('fill', '#fff');

                    this.currentDate.hour(parseInt(value));

                    if (this.params.shortTime === true && this.isPM())
                    {
                       this.currentDate.add(12, 'hours');
                    }

                    this.showTime(this.currentDate);

                    this.animateHands();

                    if (this.params.switchOnClick === true)
                       setTimeout(this.initMinutes.bind(this), 200);
                 }
              },
              _onSelectMinute: function (e)
              {
                 if (!$(e.target).hasClass('disabled'))
                 {
                    var value = $(e.target).data('minute');
                    var parent = $(e.target).parent();

                    var m = parent.find('.dtp-select-minute');
                    for (var i = 0; i < m.length; i++)
                    {
                       $(m[i]).attr('fill', 'transparent');
                    }
                    var tm = parent.find('.dtp-select-minute-text');
                    for (var i = 0; i < tm.length; i++)
                    {
                       $(tm[i]).attr('fill', '#000');
                    }

                    $(parent.find('#m-' + value)).attr('fill', '#9692d6');
                    $(parent.find('#tm-' + value)).attr('fill', '#fff');

                    this.currentDate.minute(parseInt(value));
                    this.showTime(this.currentDate);

                    this.animateHands();

                    if (this.params.switchOnClick === true)
                       setTimeout(function ()
                       {
                          this.setElementValue();
                          this.hide();
                       }.bind(this), 200);
                 }
              },
              _onSelectAM: function (e)
              {
                 $('.dtp-actual-meridien').find('a').removeClass('selected');
                 $(e.currentTarget).addClass('selected');

                 if (this.currentDate.hour() >= 12)
                 {
                    if (this.currentDate.subtract(12, 'hours'))
                       this.showTime(this.currentDate);
                 }
                 this.toggleTime((this.currentView === 1));
              },
              _onSelectPM: function (e)
              {
                 $('.dtp-actual-meridien').find('a').removeClass('selected');
                 $(e.currentTarget).addClass('selected');

                 if (this.currentDate.hour() < 12)
                 {
                    if (this.currentDate.add(12, 'hours'))
                       this.showTime(this.currentDate);
                 }
                 this.toggleTime((this.currentView === 1));
              },
              _hideCalendar: function() {
                 this.$dtpElement.find('.dtp-picker-calendar').addClass('hidden');
              },
              convertHours: function (h)
              {
                 var _return = h;

                 if (this.params.shortTime === true)
                 {
                    if ((h < 12) && this.isPM())
                    {
                       _return += 12;
                    }
                 }

                 return _return;
              },
              setDate: function (date)
              {
                 this.params.currentDate = date;
                 this.initDates();
              },
              setMinDate: function (date)
              {
                 this.params.minDate = date;
                 this.initDates();
              },
              setMaxDate: function (date)
              {
                 this.params.maxDate = date;
                 this.initDates();
              },
              destroy: function ()
              {
                 this._detachEvents();
                 this.$dtpElement.remove();
              },
              show: function ()
              {
                 this.$dtpElement.removeClass('hidden');
                 this._attachEvent($(window), 'keydown', this._onKeydown.bind(this));
                 this._centerBox();
                 this.$element.trigger('open');
                 if (this.params.monthPicker === true)
                 {
                    this._hideCalendar();
                 }
              },
              hide: function ()
              {
                 $(window).off('keydown', null, null, this._onKeydown.bind(this));
                 this.$dtpElement.addClass('hidden');
                 this.$element.trigger('close');
              },
              _centerBox: function ()
              {
                 var h = (this.$dtpElement.height() - this.$dtpElement.find('.dtp-content').height()) / 2;
                 this.$dtpElement.find('.dtp-content').css('marginLeft', -(this.$dtpElement.find('.dtp-content').width() / 2) + 'px');
                 this.$dtpElement.find('.dtp-content').css('top', h + 'px');
              },
              enableDays: function ()
              {
                 var enableDays = this.params.enableDays;
                 if (enableDays) {
                    $(".dtp-picker-days tbody tr td").each(function () {
                       if (!(($.inArray($(this).index(), enableDays)) >= 0)) {
                          $(this).find('a').css({
                             "background": "#e3e3e3",
                             "cursor": "no-drop",
                             "opacity": "0.5"
                          }).off("click");
                       }
                    });
                 }
              }

           };
})(jQuery, moment);

/**
* jQuery asColor v0.3.4
* https://github.com/amazingSurge/asColor
*
* Copyright (c) amazingSurge
* Released under the LGPL-3.0 license
*/
(function(global, factory) {
  if (typeof define === "function" && define.amd) {
    define('AsColor', ['exports', 'jquery'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('jquery'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.jQuery);
    global.AsColor = mod.exports;
  }
})(this,

  function(exports, _jquery) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _jquery2 = _interopRequireDefault(_jquery);

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      };
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ?

      function(obj) {
        return typeof obj;
      }
      :

      function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    var _createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;

          if ("value" in descriptor)
            descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function(Constructor, protoProps, staticProps) {
        if (protoProps)
          defineProperties(Constructor.prototype, protoProps);

        if (staticProps)
          defineProperties(Constructor, staticProps);

        return Constructor;
      };
    }();

    var DEFAULTS = {
      format: false,
      shortenHex: false,
      hexUseName: false,
      reduceAlpha: false,
      alphaConvert: { // or false will disable convert
        'RGB': 'RGBA',
        'HSL': 'HSLA',
        'HEX': 'RGBA',
        'NAMESPACE': 'RGBA'
      },
      nameDegradation: 'HEX',
      invalidValue: '',
      zeroAlphaAsTransparent: true
    };

    function expandHex(hex) {
      if (hex.indexOf('#') === 0) {
        hex = hex.substr(1);
      }

      if (!hex) {

        return null;
      }

      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }

      return hex.length === 6 ? '#' + hex : null;
    }

    function shrinkHex(hex) {
      if (hex.indexOf('#') === 0) {
        hex = hex.substr(1);
      }

      if (hex.length === 6 && hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        hex = hex[0] + hex[2] + hex[4];
      }

      return '#' + hex;
    }

    function parseIntFromHex(val) {
      return parseInt(val, 16);
    }

    function isPercentage(n) {
      return typeof n === 'string' && n.indexOf('%') === n.length - 1;
    }

    function conventPercentageToRgb(n) {
      return parseInt(Math.round(n.slice(0, -1) * 2.55), 10);
    }

    function convertPercentageToFloat(n) {
      return parseFloat(n.slice(0, -1) / 100, 10);
    }

    function flip(o) {
      var flipped = {};

      for (var i in o) {

        if (o.hasOwnProperty(i)) {
          flipped[o[i]] = i;
        }
      }

      return flipped;
    }

    var NAMES = {
      aliceblue: 'f0f8ff',
      antiquewhite: 'faebd7',
      aqua: '0ff',
      aquamarine: '7fffd4',
      azure: 'f0ffff',
      beige: 'f5f5dc',
      bisque: 'ffe4c4',
      black: '000',
      blanchedalmond: 'ffebcd',
      blue: '00f',
      blueviolet: '8a2be2',
      brown: 'a52a2a',
      burlywood: 'deb887',
      burntsienna: 'ea7e5d',
      cadetblue: '5f9ea0',
      chartreuse: '7fff00',
      chocolate: 'd2691e',
      coral: 'ff7f50',
      cornflowerblue: '6495ed',
      cornsilk: 'fff8dc',
      crimson: 'dc143c',
      cyan: '0ff',
      darkblue: '00008b',
      darkcyan: '008b8b',
      darkgoldenrod: 'b8860b',
      darkgray: 'a9a9a9',
      darkgreen: '006400',
      darkgrey: 'a9a9a9',
      darkkhaki: 'bdb76b',
      darkmagenta: '8b008b',
      darkolivegreen: '556b2f',
      darkorange: 'ff8c00',
      darkorchid: '9932cc',
      darkred: '8b0000',
      darksalmon: 'e9967a',
      darkseagreen: '8fbc8f',
      darkslateblue: '483d8b',
      darkslategray: '2f4f4f',
      darkslategrey: '2f4f4f',
      darkturquoise: '00ced1',
      darkviolet: '9400d3',
      deeppink: 'ff1493',
      deepskyblue: '00bfff',
      dimgray: '696969',
      dimgrey: '696969',
      dodgerblue: '1e90ff',
      firebrick: 'b22222',
      floralwhite: 'fffaf0',
      forestgreen: '228b22',
      fuchsia: 'f0f',
      gainsboro: 'dcdcdc',
      ghostwhite: 'f8f8ff',
      gold: 'ffd700',
      goldenrod: 'daa520',
      gray: '808080',
      green: '008000',
      greenyellow: 'adff2f',
      grey: '808080',
      honeydew: 'f0fff0',
      hotpink: 'ff69b4',
      indianred: 'cd5c5c',
      indigo: '4b0082',
      ivory: 'fffff0',
      khaki: 'f0e68c',
      lavender: 'e6e6fa',
      lavenderblush: 'fff0f5',
      lawngreen: '7cfc00',
      lemonchiffon: 'fffacd',
      lightblue: 'add8e6',
      lightcoral: 'f08080',
      lightcyan: 'e0ffff',
      lightgoldenrodyellow: 'fafad2',
      lightgray: 'd3d3d3',
      lightgreen: '90ee90',
      lightgrey: 'd3d3d3',
      lightpink: 'ffb6c1',
      lightsalmon: 'ffa07a',
      lightseagreen: '20b2aa',
      lightskyblue: '87cefa',
      lightslategray: '789',
      lightslategrey: '789',
      lightsteelblue: 'b0c4de',
      lightyellow: 'ffffe0',
      lime: '0f0',
      limegreen: '32cd32',
      linen: 'faf0e6',
      magenta: 'f0f',
      maroon: '800000',
      mediumaquamarine: '66cdaa',
      mediumblue: '0000cd',
      mediumorchid: 'ba55d3',
      mediumpurple: '9370db',
      mediumseagreen: '3cb371',
      mediumslateblue: '7b68ee',
      mediumspringgreen: '00fa9a',
      mediumturquoise: '48d1cc',
      mediumvioletred: 'c71585',
      midnightblue: '191970',
      mintcream: 'f5fffa',
      mistyrose: 'ffe4e1',
      moccasin: 'ffe4b5',
      navajowhite: 'ffdead',
      navy: '000080',
      oldlace: 'fdf5e6',
      olive: '808000',
      olivedrab: '6b8e23',
      orange: 'ffa500',
      orangered: 'ff4500',
      orchid: 'da70d6',
      palegoldenrod: 'eee8aa',
      palegreen: '98fb98',
      paleturquoise: 'afeeee',
      palevioletred: 'db7093',
      papayawhip: 'ffefd5',
      peachpuff: 'ffdab9',
      peru: 'cd853f',
      pink: 'ffc0cb',
      plum: 'dda0dd',
      powderblue: 'b0e0e6',
      purple: '800080',
      red: 'f00',
      rosybrown: 'bc8f8f',
      royalblue: '4169e1',
      saddlebrown: '8b4513',
      salmon: 'fa8072',
      sandybrown: 'f4a460',
      seagreen: '2e8b57',
      seashell: 'fff5ee',
      sienna: 'a0522d',
      silver: 'c0c0c0',
      skyblue: '87ceeb',
      slateblue: '6a5acd',
      slategray: '708090',
      slategrey: '708090',
      snow: 'fffafa',
      springgreen: '00ff7f',
      steelblue: '4682b4',
      tan: 'd2b48c',
      teal: '008080',
      thistle: 'd8bfd8',
      tomato: 'ff6347',
      turquoise: '40e0d0',
      violet: 'ee82ee',
      wheat: 'f5deb3',
      white: 'fff',
      whitesmoke: 'f5f5f5',
      yellow: 'ff0',
      yellowgreen: '9acd32'
    };

    /* eslint no-bitwise: "off" */
    var hexNames = flip(NAMES);

    var Converter = {
      HSLtoRGB: function HSLtoRGB(hsl) {
        var h = hsl.h / 360;
        var s = hsl.s;
        var l = hsl.l;
        var m1 = void 0;
        var m2 = void 0;
        var rgb = void 0;

        if (l <= 0.5) {
          m2 = l * (s + 1);
        } else {
          m2 = l + s - l * s;
        }
        m1 = l * 2 - m2;
        rgb = {
          r: this.hueToRGB(m1, m2, h + 1 / 3),
          g: this.hueToRGB(m1, m2, h),
          b: this.hueToRGB(m1, m2, h - 1 / 3)
        };

        if (typeof hsl.a !== 'undefined') {
          rgb.a = hsl.a;
        }

        if (hsl.l === 0) {
          rgb.h = hsl.h;
        }

        if (hsl.l === 1) {
          rgb.h = hsl.h;
        }

        return rgb;
      },

      hueToRGB: function hueToRGB(m1, m2, h) {
        var v = void 0;

        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }

        if (h * 6 < 1) {
          v = m1 + (m2 - m1) * h * 6;
        } else if (h * 2 < 1) {
          v = m2;
        } else if (h * 3 < 2) {
          v = m1 + (m2 - m1) * (2 / 3 - h) * 6;
        } else {
          v = m1;
        }

        return Math.round(v * 255);
      },

      RGBtoHSL: function RGBtoHSL(rgb) {
        var r = rgb.r / 255;
        var g = rgb.g / 255;
        var b = rgb.b / 255;
        var min = Math.min(r, g, b);
        var max = Math.max(r, g, b);
        var diff = max - min;
        var add = max + min;
        var l = add * 0.5;
        var h = void 0;
        var s = void 0;

        if (min === max) {
          h = 0;
        } else if (r === max) {
          h = 60 * (g - b) / diff + 360;
        } else if (g === max) {
          h = 60 * (b - r) / diff + 120;
        } else {
          h = 60 * (r - g) / diff + 240;
        }

        if (diff === 0) {
          s = 0;
        } else if (l <= 0.5) {
          s = diff / add;
        } else {
          s = diff / (2 - add);
        }

        return {
          h: Math.round(h) % 360,
          s: s,
          l: l
        };
      },

      RGBtoHEX: function RGBtoHEX(rgb) {
        var hex = [rgb.r.toString(16), rgb.g.toString(16), rgb.b.toString(16)];

        _jquery2.default.each(hex,

          function(nr, val) {
            if (val.length === 1) {
              hex[nr] = '0' + val;
            }
          }
        );

        return '#' + hex.join('');
      },

      HSLtoHEX: function HSLtoHEX(hsl) {
        var rgb = this.HSLtoRGB(hsl);

        return this.RGBtoHEX(rgb);
      },

      HSVtoHEX: function HSVtoHEX(hsv) {
        var rgb = this.HSVtoRGB(hsv);

        return this.RGBtoHEX(rgb);
      },

      RGBtoHSV: function RGBtoHSV(rgb) {
        var r = rgb.r / 255;
        var g = rgb.g / 255;
        var b = rgb.b / 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = void 0;
        var s = void 0;
        var v = max;
        var diff = max - min;
        s = max === 0 ? 0 : diff / max;

        if (max === min) {
          h = 0;
        } else {
          switch (max) {
            case r: {
              h = (g - b) / diff + (g < b ? 6 : 0);
              break;
            }
            case g: {
              h = (b - r) / diff + 2;
              break;
            }
            case b: {
              h = (r - g) / diff + 4;
              break;
            }
            default: {
              break;
            }
          }
          h /= 6;
        }

        return {
          h: Math.round(h * 360),
          s: s,
          v: v
        };
      },

      HSVtoRGB: function HSVtoRGB(hsv) {
        var r = void 0;
        var g = void 0;
        var b = void 0;
        var h = hsv.h % 360 / 60;
        var s = hsv.s;
        var v = hsv.v;
        var c = v * s;
        var x = c * (1 - Math.abs(h % 2 - 1));

        r = g = b = v - c;
        h = ~~h;

        r += [c, x, 0, 0, x, c][h];
        g += [x, c, c, x, 0, 0][h];
        b += [0, 0, x, c, c, x][h];

        var rgb = {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
        };

        if (typeof hsv.a !== 'undefined') {
          rgb.a = hsv.a;
        }

        if (hsv.v === 0) {
          rgb.h = hsv.h;
        }

        if (hsv.v === 1 && hsv.s === 0) {
          rgb.h = hsv.h;
        }

        return rgb;
      },

      HEXtoRGB: function HEXtoRGB(hex) {
        if (hex.length === 4) {
          hex = expandHex(hex);
        }

        return {
          r: parseIntFromHex(hex.substr(1, 2)),
          g: parseIntFromHex(hex.substr(3, 2)),
          b: parseIntFromHex(hex.substr(5, 2))
        };
      },

      isNAME: function isNAME(string) {
        if (NAMES.hasOwnProperty(string)) {

          return true;
        }

        return false;
      },

      NAMEtoHEX: function NAMEtoHEX(name) {
        if (NAMES.hasOwnProperty(name)) {

          return '#' + NAMES[name];
        }

        return null;
      },

      NAMEtoRGB: function NAMEtoRGB(name) {
        var hex = this.NAMEtoHEX(name);

        if (hex) {

          return this.HEXtoRGB(hex);
        }

        return null;
      },

      hasNAME: function hasNAME(rgb) {
        var hex = this.RGBtoHEX(rgb);

        hex = shrinkHex(hex);

        if (hex.indexOf('#') === 0) {
          hex = hex.substr(1);
        }

        if (hexNames.hasOwnProperty(hex)) {

          return hexNames[hex];
        }

        return false;
      },

      RGBtoNAME: function RGBtoNAME(rgb) {
        var hasName = this.hasNAME(rgb);

        if (hasName) {

          return hasName;
        }

        return null;
      }
    };

    var CSS_INTEGER = '[-\\+]?\\d+%?';
    var CSS_NUMBER = '[-\\+]?\\d*\\.\\d+%?';
    var CSS_UNIT = '(?:' + CSS_NUMBER + ')|(?:' + CSS_INTEGER + ')';

    var PERMISSIVE_MATCH3 = '[\\s|\\(]+(' + CSS_UNIT + ')[,|\\s]+(' + CSS_UNIT + ')[,|\\s]+(' + CSS_UNIT + ')\\s*\\)';
    var PERMISSIVE_MATCH4 = '[\\s|\\(]+(' + CSS_UNIT + ')[,|\\s]+(' + CSS_UNIT + ')[,|\\s]+(' + CSS_UNIT + ')[,|\\s]+(' + CSS_UNIT + ')\\s*\\)';

    var ColorStrings = {
      RGB: {
        match: new RegExp('^rgb' + PERMISSIVE_MATCH3 + '$', 'i'),
        parse: function parse(result) {
          return {
            r: isPercentage(result[1]) ? conventPercentageToRgb(result[1]) : parseInt(result[1], 10),
            g: isPercentage(result[2]) ? conventPercentageToRgb(result[2]) : parseInt(result[2], 10),
            b: isPercentage(result[3]) ? conventPercentageToRgb(result[3]) : parseInt(result[3], 10),
            a: 1
          };
        },
        to: function to(color) {
          return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
        }
      },
      RGBA: {
        match: new RegExp('^rgba' + PERMISSIVE_MATCH4 + '$', 'i'),
        parse: function parse(result) {
          return {
            r: isPercentage(result[1]) ? conventPercentageToRgb(result[1]) : parseInt(result[1], 10),
            g: isPercentage(result[2]) ? conventPercentageToRgb(result[2]) : parseInt(result[2], 10),
            b: isPercentage(result[3]) ? conventPercentageToRgb(result[3]) : parseInt(result[3], 10),
            a: isPercentage(result[4]) ? convertPercentageToFloat(result[4]) : parseFloat(result[4], 10)
          };
        },
        to: function to(color) {
          return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a + ')';
        }
      },
      HSL: {
        match: new RegExp('^hsl' + PERMISSIVE_MATCH3 + '$', 'i'),
        parse: function parse(result) {
          var hsl = {
            h: (result[1] % 360 + 360) % 360,
            s: isPercentage(result[2]) ? convertPercentageToFloat(result[2]) : parseFloat(result[2], 10),
            l: isPercentage(result[3]) ? convertPercentageToFloat(result[3]) : parseFloat(result[3], 10),
            a: 1
          };

          return Converter.HSLtoRGB(hsl);
        },
        to: function to(color) {
          var hsl = Converter.RGBtoHSL(color);

          return 'hsl(' + parseInt(hsl.h, 10) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%)';
        }
      },
      HSLA: {
        match: new RegExp('^hsla' + PERMISSIVE_MATCH4 + '$', 'i'),
        parse: function parse(result) {
          var hsla = {
            h: (result[1] % 360 + 360) % 360,
            s: isPercentage(result[2]) ? convertPercentageToFloat(result[2]) : parseFloat(result[2], 10),
            l: isPercentage(result[3]) ? convertPercentageToFloat(result[3]) : parseFloat(result[3], 10),
            a: isPercentage(result[4]) ? convertPercentageToFloat(result[4]) : parseFloat(result[4], 10)
          };

          return Converter.HSLtoRGB(hsla);
        },
        to: function to(color) {
          var hsl = Converter.RGBtoHSL(color);

          return 'hsla(' + parseInt(hsl.h, 10) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%, ' + color.a + ')';
        }
      },
      HEX: {
        match: /^#([a-f0-9]{6}|[a-f0-9]{3})$/i,
        parse: function parse(result) {
          var hex = result[0];
          var rgb = Converter.HEXtoRGB(hex);

          return {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            a: 1
          };
        },
        to: function to(color, instance) {
          var hex = Converter.RGBtoHEX(color);

          if (instance) {

            if (instance.options.hexUseName) {
              var hasName = Converter.hasNAME(color);

              if (hasName) {

                return hasName;
              }
            }

            if (instance.options.shortenHex) {
              hex = shrinkHex(hex);
            }
          }

          return '' + hex;
        }
      },
      TRANSPARENT: {
        match: /^transparent$/i,
        parse: function parse() {
          return {
            r: 0,
            g: 0,
            b: 0,
            a: 0
          };
        },
        to: function to() {
          return 'transparent';
        }
      },
      NAME: {
        match: /^\w+$/i,
        parse: function parse(result) {
          var rgb = Converter.NAMEtoRGB(result[0]);

          if (rgb) {

            return {
              r: rgb.r,
              g: rgb.g,
              b: rgb.b,
              a: 1
            };
          }

          return null;
        },
        to: function to(color, instance) {
          var name = Converter.RGBtoNAME(color);

          if (name) {

            return name;
          }

          return ColorStrings[instance.options.nameDegradation.toUpperCase()].to(color);
        }
      }
    };

    /* eslint no-extend-native: "off" */

    if (!String.prototype.includes) {
      String.prototype.includes = function(search, start) {
        'use strict';

        if (typeof start !== 'number') {
          start = 0;
        }

        if (start + search.length > this.length) {

          return false;
        }

        return this.indexOf(search, start) !== -1;
      }
      ;
    }

    var AsColor = function() {
      function AsColor(string, options) {
        _classCallCheck(this, AsColor);

        if ((typeof string === 'undefined' ? 'undefined' : _typeof(string)) === 'object' && typeof options === 'undefined') {
          options = string;
          string = undefined;
        }

        if (typeof options === 'string') {
          options = {
            format: options
          };
        }
        this.options = _jquery2.default.extend(true, {}, DEFAULTS, options);
        this.value = {
          r: 0,
          g: 0,
          b: 0,
          h: 0,
          s: 0,
          v: 0,
          a: 1
        };
        this._format = false;
        this._matchFormat = 'HEX';
        this._valid = true;

        this.init(string);
      }

      _createClass(AsColor, [{
        key: 'init',
        value: function init(string) {
          this.format(this.options.format);
          this.fromString(string);

          return this;
        }
      }, {
        key: 'isValid',
        value: function isValid() {
          return this._valid;
        }
      }, {
        key: 'val',
        value: function val(value) {
          if (typeof value === 'undefined') {

            return this.toString();
          }
          this.fromString(value);

          return this;
        }
      }, {
        key: 'alpha',
        value: function alpha(value) {
          if (typeof value === 'undefined' || isNaN(value)) {

            return this.value.a;
          }

          value = parseFloat(value);

          if (value > 1) {
            value = 1;
          } else if (value < 0) {
            value = 0;
          }
          this.value.a = value;

          return this;
        }
      }, {
        key: 'matchString',
        value: function matchString(string) {
          return AsColor.matchString(string);
        }
      }, {
        key: 'fromString',
        value: function fromString(string, updateFormat) {
          if (typeof string === 'string') {
            string = _jquery2.default.trim(string);
            var matched = null;
            var rgb = void 0;
            this._valid = false;

            for (var i in ColorStrings) {

              if ((matched = ColorStrings[i].match.exec(string)) !== null) {
                rgb = ColorStrings[i].parse(matched);

                if (rgb) {
                  this.set(rgb);

                  if (i === 'TRANSPARENT') {
                    i = 'HEX';
                  }
                  this._matchFormat = i;

                  if (updateFormat === true) {
                    this.format(i);
                  }
                  break;
                }
              }
            }
          } else if ((typeof string === 'undefined' ? 'undefined' : _typeof(string)) === 'object') {
            this.set(string);
          }

          return this;
        }
      }, {
        key: 'format',
        value: function format(_format) {
          if (typeof _format === 'string' && (_format = _format.toUpperCase()) && typeof ColorStrings[_format] !== 'undefined') {

            if (_format !== 'TRANSPARENT') {
              this._format = _format;
            } else {
              this._format = 'HEX';
            }
          } else if (_format === false) {
            this._format = false;
          }

          if (this._format === false) {

            return this._matchFormat;
          }

          return this._format;
        }
      }, {
        key: 'toRGBA',
        value: function toRGBA() {
          return ColorStrings.RGBA.to(this.value, this);
        }
      }, {
        key: 'toRGB',
        value: function toRGB() {
          return ColorStrings.RGB.to(this.value, this);
        }
      }, {
        key: 'toHSLA',
        value: function toHSLA() {
          return ColorStrings.HSLA.to(this.value, this);
        }
      }, {
        key: 'toHSL',
        value: function toHSL() {
          return ColorStrings.HSL.to(this.value, this);
        }
      }, {
        key: 'toHEX',
        value: function toHEX() {
          return ColorStrings.HEX.to(this.value, this);
        }
      }, {
        key: 'toNAME',
        value: function toNAME() {
          return ColorStrings.NAME.to(this.value, this);
        }
      }, {
        key: 'to',
        value: function to(format) {
          if (typeof format === 'string' && (format = format.toUpperCase()) && typeof ColorStrings[format] !== 'undefined') {

            return ColorStrings[format].to(this.value, this);
          }

          return this.toString();
        }
      }, {
        key: 'toString',
        value: function toString() {
          var value = this.value;

          if (!this._valid) {
            value = this.options.invalidValue;

            if (typeof value === 'string') {

              return value;
            }
          }

          if (value.a === 0 && this.options.zeroAlphaAsTransparent) {

            return ColorStrings.TRANSPARENT.to(value, this);
          }

          var format = void 0;

          if (this._format === false) {
            format = this._matchFormat;
          } else {
            format = this._format;
          }

          if (this.options.reduceAlpha && value.a === 1) {
            switch (format) {
              case 'RGBA':
                format = 'RGB';
                break;
              case 'HSLA':
                format = 'HSL';
                break;
              default:
                break;
            }
          }

          if (value.a !== 1 && format !== 'RGBA' && format !== 'HSLA' && this.options.alphaConvert) {

            if (typeof this.options.alphaConvert === 'string') {
              format = this.options.alphaConvert;
            }

            if (typeof this.options.alphaConvert[format] !== 'undefined') {
              format = this.options.alphaConvert[format];
            }
          }

          return ColorStrings[format].to(value, this);
        }
      }, {
        key: 'get',
        value: function get() {
          return this.value;
        }
      }, {
        key: 'set',
        value: function set(color) {
          this._valid = true;
          var fromRgb = 0;
          var fromHsv = 0;
          var hsv = void 0;
          var rgb = void 0;

          for (var i in color) {

            if ('hsv'.includes(i)) {
              fromHsv++;
              this.value[i] = color[i];
            } else if ('rgb'.includes(i)) {
              fromRgb++;
              this.value[i] = color[i];
            } else if (i === 'a') {
              this.value.a = color.a;
            }
          }

          if (fromRgb > fromHsv) {
            hsv = Converter.RGBtoHSV(this.value);

            if (this.value.r === 0 && this.value.g === 0 && this.value.b === 0) {
              // this.value.h = color.h;
            } else {
              this.value.h = hsv.h;
            }

            this.value.s = hsv.s;
            this.value.v = hsv.v;
          } else if (fromHsv > fromRgb) {
            rgb = Converter.HSVtoRGB(this.value);
            this.value.r = rgb.r;
            this.value.g = rgb.g;
            this.value.b = rgb.b;
          }

          return this;
        }
      }], [{
        key: 'matchString',
        value: function matchString(string) {
          if (typeof string === 'string') {
            string = _jquery2.default.trim(string);
            var matched = null;
            var rgb = void 0;

            for (var i in ColorStrings) {

              if ((matched = ColorStrings[i].match.exec(string)) !== null) {
                rgb = ColorStrings[i].parse(matched);

                if (rgb) {

                  return true;
                }
              }
            }
          }

          return false;
        }
      }, {
        key: 'setDefaults',
        value: function setDefaults(options) {
          _jquery2.default.extend(true, DEFAULTS, _jquery2.default.isPlainObject(options) && options);
        }
      }]);

      return AsColor;
    }();

    var info = {
      version: '0.3.4'
    };

    var OtherAsColor = _jquery2.default.asColor;

    var jQueryAsColor = function jQueryAsColor() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return new (Function.prototype.bind.apply(AsColor, [null].concat(args)))();
    };

    _jquery2.default.asColor = jQueryAsColor;
    _jquery2.default.asColor.Constructor = AsColor;

    _jquery2.default.extend(_jquery2.default.asColor, {
      matchString: AsColor.matchString,
      setDefaults: AsColor.setDefaults,
      noConflict: function noConflict() {
        _jquery2.default.asColor = OtherAsColor;

        return jQueryAsColor;
      }
    }, Converter, info);

    var main = _jquery2.default.asColor;

    exports.default = main;
  }
);
/**
* jQuery asGradient v0.3.2
* https://github.com/amazingSurge/jquery-asGradient
*
* Copyright (c) amazingSurge
* Released under the LGPL-3.0 license
*/
(function(global, factory) {
  if (typeof define === "function" && define.amd) {
    define('AsGradient', ['exports', 'jquery', 'jquery-asColor'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('jquery'), require('jquery-asColor'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.jQuery, global.AsColor);
    global.AsGradient = mod.exports;
  }
})(this,

  function(exports, _jquery, _jqueryAsColor) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _jquery2 = _interopRequireDefault(_jquery);

    var _jqueryAsColor2 = _interopRequireDefault(_jqueryAsColor);

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      };
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ?

      function(obj) {
        return typeof obj;
      }
      :

      function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    var _createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;

          if ("value" in descriptor)
            descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function(Constructor, protoProps, staticProps) {
        if (protoProps)
          defineProperties(Constructor.prototype, protoProps);

        if (staticProps)
          defineProperties(Constructor, staticProps);

        return Constructor;
      };
    }();

    var DEFAULTS = {
      prefixes: ['-webkit-', '-moz-', '-ms-', '-o-'],
      forceStandard: true,
      angleUseKeyword: true,
      emptyString: '',
      degradationFormat: false,
      cleanPosition: true,
      color: {
        format: false, // rgb, rgba, hsl, hsla, hex
        hexUseName: false,
        reduceAlpha: true,
        shortenHex: true,
        zeroAlphaAsTransparent: false,
        invalidValue: {
          r: 0,
          g: 0,
          b: 0,
          a: 1
        }
      }
    };

    /* eslint no-extend-native: "off" */

    if (!String.prototype.includes) {
      String.prototype.includes = function(search, start) {
        'use strict';

        if (typeof start !== 'number') {
          start = 0;
        }

        if (start + search.length > this.length) {

          return false;
        }

        return this.indexOf(search, start) !== -1;
      }
      ;
    }

    function getPrefix() {
      var ua = window.navigator.userAgent;
      var prefix = '';

      if (/MSIE/g.test(ua)) {
        prefix = '-ms-';
      } else if (/Firefox/g.test(ua)) {
        prefix = '-moz-';
      } else if (/(WebKit)/i.test(ua)) {
        prefix = '-webkit-';
      } else if (/Opera/g.test(ua)) {
        prefix = '-o-';
      }

      return prefix;
    }

    function flip(o) {
      var flipped = {};

      for (var i in o) {

        if (o.hasOwnProperty(i)) {
          flipped[o[i]] = i;
        }
      }

      return flipped;
    }

    function reverseDirection(direction) {
      var mapping = {
        'top': 'bottom',
        'right': 'left',
        'bottom': 'top',
        'left': 'right',
        'right top': 'left bottom',
        'top right': 'bottom left',
        'bottom right': 'top left',
        'right bottom': 'left top',
        'left bottom': 'right top',
        'bottom left': 'top right',
        'top left': 'bottom right',
        'left top': 'right bottom'
      };

      return mapping.hasOwnProperty(direction) ? mapping[direction] : direction;
    }

    function isDirection(n) {
      var reg = /^(top|left|right|bottom)$/i;

      return reg.test(n);
    }

    var keywordAngleMap = {
      'to top': 0,
      'to right': 90,
      'to bottom': 180,
      'to left': 270,
      'to right top': 45,
      'to top right': 45,
      'to bottom right': 135,
      'to right bottom': 135,
      'to left bottom': 225,
      'to bottom left': 225,
      'to top left': 315,
      'to left top': 315
    };

    var angleKeywordMap = flip(keywordAngleMap);

    var RegExpStrings = function() {
      var color = /(?:rgba|rgb|hsla|hsl)\s*\([\s\d\.,%]+\)|#[a-z0-9]{3,6}|[a-z]+/i;
      var position = /\d{1,3}%/i;
      var angle = /(?:to ){0,1}(?:(?:top|left|right|bottom)\s*){1,2}|\d+deg/i;
      var stop = new RegExp('(' + color.source + ')\\s*(' + position.source + '){0,1}', 'i');
      var stops = new RegExp(stop.source, 'gi');
      var parameters = new RegExp('(?:(' + angle.source + ')){0,1}\\s*,{0,1}\\s*(.*?)\\s*', 'i');
      var full = new RegExp('^(-webkit-|-moz-|-ms-|-o-){0,1}(linear|radial|repeating-linear)-gradient\\s*\\(\\s*(' + parameters.source + ')\\s*\\)$', 'i');

      return {
        FULL: full,
        ANGLE: angle,
        COLOR: color,
        POSITION: position,
        STOP: stop,
        STOPS: stops,
        PARAMETERS: new RegExp('^' + parameters.source + '$', 'i')
      };
    }();

    var GradientString = {
      matchString: function matchString(string) {
        var matched = this.parseString(string);

        if (matched && matched.value && matched.value.stops && matched.value.stops.length > 1) {

          return true;
        }

        return false;
      },

      parseString: function parseString(string) {
        string = _jquery2.default.trim(string);
        var matched = void 0;

        if ((matched = RegExpStrings.FULL.exec(string)) !== null) {
          var value = this.parseParameters(matched[3]);

          return {
            prefix: typeof matched[1] === 'undefined' ? null : matched[1],
            type: matched[2],
            value: value
          };
        } else {

          return false;
        }
      },

      parseParameters: function parseParameters(string) {
        var matched = void 0;

        if ((matched = RegExpStrings.PARAMETERS.exec(string)) !== null) {
          var stops = this.parseStops(matched[2]);

          return {
            angle: typeof matched[1] === 'undefined' ? 0 : matched[1],
            stops: stops
          };
        } else {

          return false;
        }
      },

      parseStops: function parseStops(string) {
        var _this = this;

        var matched = void 0;
        var result = [];

        if ((matched = string.match(RegExpStrings.STOPS)) !== null) {

          _jquery2.default.each(matched,

            function(i, item) {
              var stop = _this.parseStop(item);

              if (stop) {
                result.push(stop);
              }
            }
          );

          return result;
        } else {

          return false;
        }
      },

      formatStops: function formatStops(stops, cleanPosition) {
        var stop = void 0;
        var output = [];
        var positions = [];
        var colors = [];
        var position = void 0;

        for (var i = 0; i < stops.length; i++) {
          stop = stops[i];

          if (typeof stop.position === 'undefined' || stop.position === null) {

            if (i === 0) {
              position = 0;
            } else if (i === stops.length - 1) {
              position = 1;
            } else {
              position = undefined;
            }
          } else {
            position = stop.position;
          }
          positions.push(position);
          colors.push(stop.color.toString());
        }

        positions = function(data) {
          var start = null;
          var average = void 0;

          for (var _i = 0; _i < data.length; _i++) {

            if (isNaN(data[_i])) {

              if (start === null) {
                start = _i;
                continue;
              }
            } else if (start) {
              average = (data[_i] - data[start - 1]) / (_i - start + 1);

              for (var j = start; j < _i; j++) {
                data[j] = data[start - 1] + (j - start + 1) * average;
              }
              start = null;
            }
          }

          return data;
        }(positions);

        for (var x = 0; x < stops.length; x++) {

          if (cleanPosition && (x === 0 && positions[x] === 0 || x === stops.length - 1 && positions[x] === 1)) {
            position = '';
          } else {
            position = ' ' + this.formatPosition(positions[x]);
          }

          output.push(colors[x] + position);
        }

        return output.join(', ');
      },

      parseStop: function parseStop(string) {
        var matched = void 0;

        if ((matched = RegExpStrings.STOP.exec(string)) !== null) {
          var position = this.parsePosition(matched[2]);

          return {
            color: matched[1],
            position: position
          };
        } else {

          return false;
        }
      },

      parsePosition: function parsePosition(string) {
        if (typeof string === 'string' && string.substr(-1) === '%') {
          string = parseFloat(string.slice(0, -1) / 100);
        }

        if (typeof string !== 'undefined' && string !== null) {

          return parseFloat(string, 10);
        } else {

          return null;
        }
      },

      formatPosition: function formatPosition(value) {
        return parseInt(value * 100, 10) + '%';
      },

      parseAngle: function parseAngle(string, notStandard) {
        if (typeof string === 'string' && string.includes('deg')) {
          string = string.replace('deg', '');
        }

        if (!isNaN(string)) {

          if (notStandard) {
            string = this.fixOldAngle(string);
          }
        }

        if (typeof string === 'string') {
          var directions = string.split(' ');

          var filtered = [];

          for (var i in directions) {

            if (isDirection(directions[i])) {
              filtered.push(directions[i].toLowerCase());
            }
          }
          var keyword = filtered.join(' ');

          if (!string.includes('to ')) {
            keyword = reverseDirection(keyword);
          }
          keyword = 'to ' + keyword;

          if (keywordAngleMap.hasOwnProperty(keyword)) {
            string = keywordAngleMap[keyword];
          }
        }
        var value = parseFloat(string, 10);

        if (value > 360) {
          value %= 360;
        } else if (value < 0) {
          value %= -360;

          if (value !== 0) {
            value += 360;
          }
        }

        return value;
      },

      fixOldAngle: function fixOldAngle(value) {
        value = parseFloat(value);
        value = Math.abs(450 - value) % 360;
        value = parseFloat(value.toFixed(3));

        return value;
      },

      formatAngle: function formatAngle(value, notStandard, useKeyword) {
        value = parseInt(value, 10);

        if (useKeyword && angleKeywordMap.hasOwnProperty(value)) {
          value = angleKeywordMap[value];

          if (notStandard) {
            value = reverseDirection(value.substr(3));
          }
        } else {

          if (notStandard) {
            value = this.fixOldAngle(value);
          }
          value = value + 'deg';
        }

        return value;
      }
    };

    var ColorStop = function() {
      function ColorStop(color, position, gradient) {
        _classCallCheck(this, ColorStop);

        this.color = (0, _jqueryAsColor2.default)(color, gradient.options.color);
        this.position = GradientString.parsePosition(position);
        this.id = ++gradient._stopIdCount;
        this.gradient = gradient;
      }

      _createClass(ColorStop, [{
        key: 'setPosition',
        value: function setPosition(string) {
          var position = GradientString.parsePosition(string);

          if (this.position !== position) {
            this.position = position;
            this.gradient.reorder();
          }
        }
      }, {
        key: 'setColor',
        value: function setColor(string) {
          this.color.fromString(string);
        }
      }, {
        key: 'remove',
        value: function remove() {
          this.gradient.removeById(this.id);
        }
      }]);

      return ColorStop;
    }();

    var GradientTypes = {
      LINEAR: {
        parse: function parse(result) {
          return {
            r: result[1].substr(-1) === '%' ? parseInt(result[1].slice(0, -1) * 2.55, 10) : parseInt(result[1], 10),
            g: result[2].substr(-1) === '%' ? parseInt(result[2].slice(0, -1) * 2.55, 10) : parseInt(result[2], 10),
            b: result[3].substr(-1) === '%' ? parseInt(result[3].slice(0, -1) * 2.55, 10) : parseInt(result[3], 10),
            a: 1
          };
        },
        to: function to(gradient, instance, prefix) {
          if (gradient.stops.length === 0) {

            return instance.options.emptyString;
          }

          if (gradient.stops.length === 1) {

            return gradient.stops[0].color.to(instance.options.degradationFormat);
          }

          var standard = instance.options.forceStandard;
          var _prefix = instance._prefix;

          if (!_prefix) {
            standard = true;
          }

          if (prefix && -1 !== _jquery2.default.inArray(prefix, instance.options.prefixes)) {
            standard = false;
            _prefix = prefix;
          }

          var angle = GradientString.formatAngle(gradient.angle, !standard, instance.options.angleUseKeyword);
          var stops = GradientString.formatStops(gradient.stops, instance.options.cleanPosition);

          var output = 'linear-gradient(' + angle + ', ' + stops + ')';

          if (standard) {

            return output;
          } else {

            return _prefix + output;
          }
        }
      }
    };

    var AsGradient = function() {
      function AsGradient(string, options) {
        _classCallCheck(this, AsGradient);

        if ((typeof string === 'undefined' ? 'undefined' : _typeof(string)) === 'object' && typeof options === 'undefined') {
          options = string;
          string = undefined;
        }
        this.value = {
          angle: 0,
          stops: []
        };
        this.options = _jquery2.default.extend(true, {}, DEFAULTS, options);

        this._type = 'LINEAR';
        this._prefix = null;
        this.length = this.value.stops.length;
        this.current = 0;
        this._stopIdCount = 0;

        this.init(string);
      }

      _createClass(AsGradient, [{
        key: 'init',
        value: function init(string) {
          if (string) {
            this.fromString(string);
          }
        }
      }, {
        key: 'val',
        value: function val(value) {
          if (typeof value === 'undefined') {

            return this.toString();
          } else {
            this.fromString(value);

            return this;
          }
        }
      }, {
        key: 'angle',
        value: function angle(value) {
          if (typeof value === 'undefined') {

            return this.value.angle;
          } else {
            this.value.angle = GradientString.parseAngle(value);

            return this;
          }
        }
      }, {
        key: 'append',
        value: function append(color, position) {
          return this.insert(color, position, this.length);
        }
      }, {
        key: 'reorder',
        value: function reorder() {
          if (this.length < 2) {

            return;
          }

          this.value.stops = this.value.stops.sort(

            function(a, b) {
              return a.position - b.position;
            }
          );
        }
      }, {
        key: 'insert',
        value: function insert(color, position, index) {
          if (typeof index === 'undefined') {
            index = this.current;
          }

          var stop = new ColorStop(color, position, this);

          this.value.stops.splice(index, 0, stop);

          this.length = this.length + 1;
          this.current = index;

          return stop;
        }
      }, {
        key: 'getById',
        value: function getById(id) {
          if (this.length > 0) {

            for (var i in this.value.stops) {

              if (id === this.value.stops[i].id) {

                return this.value.stops[i];
              }
            }
          }

          return false;
        }
      }, {
        key: 'removeById',
        value: function removeById(id) {
          var index = this.getIndexById(id);

          if (index) {
            this.remove(index);
          }
        }
      }, {
        key: 'getIndexById',
        value: function getIndexById(id) {
          var index = 0;

          for (var i in this.value.stops) {

            if (id === this.value.stops[i].id) {

              return index;
            }
            index++;
          }

          return false;
        }
      }, {
        key: 'getCurrent',
        value: function getCurrent() {
          return this.value.stops[this.current];
        }
      }, {
        key: 'setCurrentById',
        value: function setCurrentById(id) {
          var index = 0;

          for (var i in this.value.stops) {

            if (this.value.stops[i].id !== id) {
              index++;
            } else {
              this.current = index;
            }
          }
        }
      }, {
        key: 'get',
        value: function get(index) {
          if (typeof index === 'undefined') {
            index = this.current;
          }

          if (index >= 0 && index < this.length) {
            this.current = index;

            return this.value.stops[index];
          } else {

            return false;
          }
        }
      }, {
        key: 'remove',
        value: function remove(index) {
          if (typeof index === 'undefined') {
            index = this.current;
          }

          if (index >= 0 && index < this.length) {
            this.value.stops.splice(index, 1);
            this.length = this.length - 1;
            this.current = index - 1;
          }
        }
      }, {
        key: 'empty',
        value: function empty() {
          this.value.stops = [];
          this.length = 0;
          this.current = 0;
        }
      }, {
        key: 'reset',
        value: function reset() {
          this.value._angle = 0;
          this.empty();
          this._prefix = null;
          this._type = 'LINEAR';
        }
      }, {
        key: 'type',
        value: function type(_type) {
          if (typeof _type === 'string' && (_type = _type.toUpperCase()) && typeof GradientTypes[_type] !== 'undefined') {
            this._type = _type;

            return this;
          } else {

            return this._type;
          }
        }
      }, {
        key: 'fromString',
        value: function fromString(string) {
          var _this2 = this;

          this.reset();

          var result = GradientString.parseString(string);

          if (result) {
            this._prefix = result.prefix;
            this.type(result.type);

            if (result.value) {
              this.value.angle = GradientString.parseAngle(result.value.angle, this._prefix !== null);

              _jquery2.default.each(result.value.stops,

                function(i, stop) {
                  _this2.append(stop.color, stop.position);
                }
              );
            }
          }
        }
      }, {
        key: 'toString',
        value: function toString(prefix) {
          if (prefix === true) {
            prefix = getPrefix();
          }

          return GradientTypes[this.type()].to(this.value, this, prefix);
        }
      }, {
        key: 'matchString',
        value: function matchString(string) {
          return GradientString.matchString(string);
        }
      }, {
        key: 'toStringWithAngle',
        value: function toStringWithAngle(angle, prefix) {
          var value = _jquery2.default.extend(true, {}, this.value);
          value.angle = GradientString.parseAngle(angle);

          if (prefix === true) {
            prefix = getPrefix();
          }

          return GradientTypes[this.type()].to(value, this, prefix);
        }
      }, {
        key: 'getPrefixedStrings',
        value: function getPrefixedStrings() {
          var strings = [];

          for (var i in this.options.prefixes) {

            if (Object.hasOwnProperty.call(this.options.prefixes, i)) {
              strings.push(this.toString(this.options.prefixes[i]));
            }
          }

          return strings;
        }
      }], [{
        key: 'setDefaults',
        value: function setDefaults(options) {
          _jquery2.default.extend(true, DEFAULTS, _jquery2.default.isPlainObject(options) && options);
        }
      }]);

      return AsGradient;
    }();

    var info = {
      version: '0.3.2'
    };

    var OtherAsGradient = _jquery2.default.asGradient;

    var jQueryAsGradient = function jQueryAsGradient() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return new (Function.prototype.bind.apply(AsGradient, [null].concat(args)))();
    };

    _jquery2.default.asGradient = jQueryAsGradient;
    _jquery2.default.asGradient.Constructor = AsGradient;

    _jquery2.default.extend(_jquery2.default.asGradient, {
      setDefaults: AsGradient.setDefaults,
      noConflict: function noConflict() {
        _jquery2.default.asGradient = OtherAsGradient;

        return jQueryAsGradient;
      }
    }, GradientString, info);

    var main = _jquery2.default.asGradient;

    exports.default = main;
  }
);
/**
* asColorPicker v0.4.4
* https://github.com/amazingSurge/jquery-asColorPicker
*
* Copyright (c) amazingSurge
* Released under the LGPL-3.0 license
*/
!function(t,e){if("function"==typeof define&&define.amd)define(["jquery","jquery-asColor","jquery-asGradient"],e);else if("undefined"!=typeof exports)e(require("jquery"),require("jquery-asColor"),require("jquery-asGradient"));else{var i={exports:{}};e(t.jQuery,t.AsColor,t.AsGradient),t.jqueryAsColorPickerEs=i.exports}}(this,function(t,e,i){"use strict";function a(t){return t&&t.__esModule?t:{default:t}}function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function s(t){return t<0?t=0:t>1&&(t=1),100*t+"%"}function o(t){t.id=P,P++}var r=a(t),h=a(e),l=a(i),u=function(){function t(t,e){for(var i=0;i<e.length;i++){var a=e[i];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(t,a.key,a)}}return function(e,i,a){return i&&t(e.prototype,i),a&&t(e,a),e}}(),c={namespace:"asColorPicker",readonly:!1,skin:null,lang:"en",hideInput:!1,hideFireChange:!0,keyboard:!1,color:{format:!1,alphaConvert:{RGB:"RGBA",HSL:"HSLA",HEX:"RGBA",NAMESPACE:"RGBA"},shortenHex:!1,hexUseName:!1,reduceAlpha:!0,nameDegradation:"HEX",invalidValue:"",zeroAlphaAsTransparent:!0},mode:"simple",onInit:null,onReady:null,onChange:null,onClose:null,onOpen:null,onApply:null},d={simple:{trigger:!0,clear:!0,saturation:!0,hue:!0,alpha:!0},palettes:{trigger:!0,clear:!0,palettes:!0},complex:{trigger:!0,clear:!0,preview:!0,palettes:!0,saturation:!0,hue:!0,alpha:!0,hex:!0,buttons:!0},gradient:{trigger:!0,clear:!0,preview:!0,palettes:!0,saturation:!0,hue:!0,alpha:!0,hex:!0,gradient:!0}},p={size:150,defaults:{direction:"vertical",template:function(t){return'<div class="'+t+"-alpha "+t+"-alpha-"+this.direction+'"><i></i></div>'}},data:{},init:function(t,e){var i=this;this.options=$.extend(this.defaults,e),i.direction=this.options.direction,this.api=t,this.$alpha=$(this.options.template.call(i,t.namespace)).appendTo(t.$dropdown),this.$handle=this.$alpha.find("i"),t.$element.on("asColorPicker::firstOpen",function(){"vertical"===i.direction?i.size=i.$alpha.height():i.size=i.$alpha.width(),i.step=i.size/360,i.bindEvents(),i.keyboard()}),t.$element.on("asColorPicker::update asColorPicker::setup",function(t,e,a){i.update(a)})},bindEvents:function(){var t=this;this.$alpha.on(this.api.eventName("mousedown"),function(e){if(e.which?3===e.which:2===e.button)return!1;$.proxy(t.mousedown,t)(e)})},mousedown:function(t){var e=this.$alpha.offset();return"vertical"===this.direction?(this.data.startY=t.pageY,this.data.top=t.pageY-e.top,this.move(this.data.top)):(this.data.startX=t.pageX,this.data.left=t.pageX-e.left,this.move(this.data.left)),this.mousemove=function(t){var e=void 0;return e="vertical"===this.direction?this.data.top+(t.pageY||this.data.startY)-this.data.startY:this.data.left+(t.pageX||this.data.startX)-this.data.startX,this.move(e),!1},this.mouseup=function(){return $(document).off({mousemove:this.mousemove,mouseup:this.mouseup}),"vertical"===this.direction?this.data.top=this.data.cach:this.data.left=this.data.cach,!1},$(document).on({mousemove:$.proxy(this.mousemove,this),mouseup:$.proxy(this.mouseup,this)}),!1},move:function(t,e,i){t=Math.max(0,Math.min(this.size,t)),this.data.cach=t,void 0===e&&(e=1-t/this.size),e=Math.max(0,Math.min(1,e)),"vertical"===this.direction?this.$handle.css({top:t}):this.$handle.css({left:t}),!1!==i&&this.api.set({a:Math.round(100*e)/100})},moveLeft:function(){var t=this.step,e=this.data;e.left=Math.max(0,Math.min(this.width,e.left-t)),this.move(e.left)},moveRight:function(){var t=this.step,e=this.data;e.left=Math.max(0,Math.min(this.width,e.left+t)),this.move(e.left)},moveUp:function(){var t=this.step,e=this.data;e.top=Math.max(0,Math.min(this.width,e.top-t)),this.move(e.top)},moveDown:function(){var t=this.step,e=this.data;e.top=Math.max(0,Math.min(this.width,e.top+t)),this.move(e.top)},keyboard:function(){var t=void 0,e=this;if(!this.api._keyboard)return!1;t=$.extend(!0,{},this.api._keyboard),this.$alpha.attr("tabindex","0").on("focus",function(){return"vertical"===this.direction?t.attach({up:function(){e.moveUp()},down:function(){e.moveDown()}}):t.attach({left:function(){e.moveLeft()},right:function(){e.moveRight()}}),!1}).on("blur",function(){t.detach()})},update:function(t){var e=this.size*(1-t.value.a);this.$alpha.css("backgroundColor",t.toHEX()),this.move(e,t.value.a,!1)},destroy:function(){$(document).off({mousemove:this.mousemove,mouseup:this.mouseup})}},f={init:function(t){var e='<input type="text" class="'+t.namespace+'-hex" />';this.$hex=$(e).appendTo(t.$dropdown),this.$hex.on("change",function(){t.set(this.value)});var i=this;t.$element.on("asColorPicker::update asColorPicker::setup",function(t,e,a){i.update(a)})},update:function(t){this.$hex.val(t.toHEX())}},v={size:150,defaults:{direction:"vertical",template:function(){var t=this.api.namespace;return'<div class="'+t+"-hue "+t+"-hue-"+this.direction+'"><i></i></div>'}},data:{},init:function(t,e){var i=this;this.options=$.extend(this.defaults,e),this.direction=this.options.direction,this.api=t,this.$hue=$(this.options.template.call(i)).appendTo(t.$dropdown),this.$handle=this.$hue.find("i"),t.$element.on("asColorPicker::firstOpen",function(){"vertical"===i.direction?i.size=i.$hue.height():i.size=i.$hue.width(),i.step=i.size/360,i.bindEvents(t),i.keyboard(t)}),t.$element.on("asColorPicker::update asColorPicker::setup",function(t,e,a){i.update(a)})},bindEvents:function(){var t=this;this.$hue.on(this.api.eventName("mousedown"),function(e){if(e.which?3===e.which:2===e.button)return!1;$.proxy(t.mousedown,t)(e)})},mousedown:function(t){var e=this.$hue.offset();return"vertical"===this.direction?(this.data.startY=t.pageY,this.data.top=t.pageY-e.top,this.move(this.data.top)):(this.data.startX=t.pageX,this.data.left=t.pageX-e.left,this.move(this.data.left)),this.mousemove=function(t){var e=void 0;return e="vertical"===this.direction?this.data.top+(t.pageY||this.data.startY)-this.data.startY:this.data.left+(t.pageX||this.data.startX)-this.data.startX,this.move(e),!1},this.mouseup=function(){return $(document).off({mousemove:this.mousemove,mouseup:this.mouseup}),"vertical"===this.direction?this.data.top=this.data.cach:this.data.left=this.data.cach,!1},$(document).on({mousemove:$.proxy(this.mousemove,this),mouseup:$.proxy(this.mouseup,this)}),!1},move:function(t,e,i){t=Math.max(0,Math.min(this.size,t)),this.data.cach=t,void 0===e&&(e=360*(1-t/this.size)),e=Math.max(0,Math.min(360,e)),"vertical"===this.direction?this.$handle.css({top:t}):this.$handle.css({left:t}),!1!==i&&this.api.set({h:e})},moveLeft:function(){var t=this.step,e=this.data;e.left=Math.max(0,Math.min(this.width,e.left-t)),this.move(e.left)},moveRight:function(){var t=this.step,e=this.data;e.left=Math.max(0,Math.min(this.width,e.left+t)),this.move(e.left)},moveUp:function(){var t=this.step,e=this.data;e.top=Math.max(0,Math.min(this.width,e.top-t)),this.move(e.top)},moveDown:function(){var t=this.step,e=this.data;e.top=Math.max(0,Math.min(this.width,e.top+t)),this.move(e.top)},keyboard:function(){var t=void 0,e=this;if(!this.api._keyboard)return!1;t=$.extend(!0,{},this.api._keyboard),this.$hue.attr("tabindex","0").on("focus",function(){return"vertical"===this.direction?t.attach({up:function(){e.moveUp()},down:function(){e.moveDown()}}):t.attach({left:function(){e.moveLeft()},right:function(){e.moveRight()}}),!1}).on("blur",function(){t.detach()})},update:function(t){var e=0===t.value.h?0:this.size*(1-t.value.h/360);this.move(e,t.value.h,!1)},destroy:function(){$(document).off({mousemove:this.mousemove,mouseup:this.mouseup})}},m={defaults:{template:function(t){return'<div class="'+t+'-saturation"><i><b></b></i></div>'}},width:0,height:0,size:6,data:{},init:function(t,e){var i=this;this.options=$.extend(this.defaults,e),this.api=t,this.$saturation=$(this.options.template.call(i,t.namespace)).appendTo(t.$dropdown),this.$handle=this.$saturation.find("i"),t.$element.on("asColorPicker::firstOpen",function(){i.width=i.$saturation.width(),i.height=i.$saturation.height(),i.step={left:i.width/20,top:i.height/20},i.size=i.$handle.width()/2,i.bindEvents(),i.keyboard(t)}),t.$element.on("asColorPicker::update asColorPicker::setup",function(t,e,a){i.update(a)})},bindEvents:function(){var t=this;this.$saturation.on(this.api.eventName("mousedown"),function(e){if(e.which?3===e.which:2===e.button)return!1;t.mousedown(e)})},mousedown:function(t){var e=this.$saturation.offset();return this.data.startY=t.pageY,this.data.startX=t.pageX,this.data.top=t.pageY-e.top,this.data.left=t.pageX-e.left,this.data.cach={},this.move(this.data.left,this.data.top),this.mousemove=function(t){var e=this.data.left+(t.pageX||this.data.startX)-this.data.startX,i=this.data.top+(t.pageY||this.data.startY)-this.data.startY;return this.move(e,i),!1},this.mouseup=function(){return $(document).off({mousemove:this.mousemove,mouseup:this.mouseup}),this.data.left=this.data.cach.left,this.data.top=this.data.cach.top,!1},$(document).on({mousemove:$.proxy(this.mousemove,this),mouseup:$.proxy(this.mouseup,this)}),!1},move:function(t,e,i){e=Math.max(0,Math.min(this.height,e)),t=Math.max(0,Math.min(this.width,t)),void 0===this.data.cach&&(this.data.cach={}),this.data.cach.left=t,this.data.cach.top=e,this.$handle.css({top:e-this.size,left:t-this.size}),!1!==i&&this.api.set({s:t/this.width,v:1-e/this.height})},update:function(t){void 0===t.value.h&&(t.value.h=0),this.$saturation.css("backgroundColor",h.default.HSLtoHEX({h:t.value.h,s:1,l:.5}));var e=t.value.s*this.width,i=(1-t.value.v)*this.height;this.move(e,i,!1)},moveLeft:function(){var t=this.step.left,e=this.data;e.left=Math.max(0,Math.min(this.width,e.left-t)),this.move(e.left,e.top)},moveRight:function(){var t=this.step.left,e=this.data;e.left=Math.max(0,Math.min(this.width,e.left+t)),this.move(e.left,e.top)},moveUp:function(){var t=this.step.top,e=this.data;e.top=Math.max(0,Math.min(this.width,e.top-t)),this.move(e.left,e.top)},moveDown:function(){var t=this.step.top,e=this.data;e.top=Math.max(0,Math.min(this.width,e.top+t)),this.move(e.left,e.top)},keyboard:function(){var t=void 0,e=this;if(!this.api._keyboard)return!1;t=$.extend(!0,{},this.api._keyboard),this.$saturation.attr("tabindex","0").on("focus",function(){return t.attach({left:function(){e.moveLeft()},right:function(){e.moveRight()},up:function(){e.moveUp()},down:function(){e.moveDown()}}),!1}).on("blur",function(){t.detach()})},destroy:function(){$(document).off({mousemove:this.mousemove,mouseup:this.mouseup})}},g={defaults:{apply:!1,cancel:!0,applyText:null,cancelText:null,template:function(t){return'<div class="'+t+'-buttons"></div>'},applyTemplate:function(t){return'<a href="#" alt="'+this.options.applyText+'" class="'+t+'-buttons-apply">'+this.options.applyText+"</a>"},cancelTemplate:function(t){return'<a href="#" alt="'+this.options.cancelText+'" class="'+t+'-buttons-apply">'+this.options.cancelText+"</a>"}},init:function(t,e){var i=this;this.options=$.extend(this.defaults,{applyText:t.getString("applyText","apply"),cancelText:t.getString("cancelText","cancel")},e),this.$buttons=$(this.options.template.call(this,t.namespace)).appendTo(t.$dropdown),t.$element.on("asColorPicker::firstOpen",function(){i.options.apply&&(i.$apply=$(i.options.applyTemplate.call(i,t.namespace)).appendTo(i.$buttons).on("click",function(){return t.apply(),!1})),i.options.cancel&&(i.$cancel=$(i.options.cancelTemplate.call(i,t.namespace)).appendTo(i.$buttons).on("click",function(){return t.cancel(),!1}))})}},y={defaults:{template:function(t){return'<div class="'+t+'-trigger"><span></span></div>'}},init:function(t,e){this.options=$.extend(this.defaults,e),t.$trigger=$(this.options.template.call(this,t.namespace)),this.$triggerInner=t.$trigger.children("span"),t.$trigger.insertAfter(t.$element),t.$trigger.on("click",function(){return t.opened?t.close():t.open(),!1});var i=this;t.$element.on("asColorPicker::update",function(t,e,a,n){void 0===n&&(n=!1),i.update(a,n)}),this.update(t.color)},update:function(t,e){e?this.$triggerInner.css("background",e.toString(!0)):this.$triggerInner.css("background",t.toRGBA())},destroy:function(t){t.$trigger.remove()}},w={defaults:{template:function(t){return'<a href="#" class="'+t+'-clear"></a>'}},init:function(t,e){t.options.hideInput||(this.options=$.extend(this.defaults,e),this.$clear=$(this.options.template.call(this,t.namespace)).insertAfter(t.$element),this.$clear.on("click",function(){return t.clear(),!1}))}},k={color:["white","black","transparent"],init:function(t){var e='<ul class="'+t.namespace+'-info"><li><label>R:<input type="text" data-type="r"/></label></li><li><label>G:<input type="text" data-type="g"/></label></li><li><label>B:<input type="text" data-type="b"/></label></li><li><label>A:<input type="text" data-type="a"/></label></li></ul>';this.$info=$(e).appendTo(t.$dropdown),this.$r=this.$info.find('[data-type="r"]'),this.$g=this.$info.find('[data-type="g"]'),this.$b=this.$info.find('[data-type="b"]'),this.$a=this.$info.find('[data-type="a"]'),this.$info.on(t.eventName("keyup update change"),"input",function(e){var i=void 0,a=$(e.target).data("type");switch(a){case"r":case"g":case"b":(i=parseInt(this.value,10))>255?i=255:i<0&&(i=0);break;case"a":(i=parseFloat(this.value,10))>1?i=1:i<0&&(i=0)}isNaN(i)&&(i=0);var n={};n[a]=i,t.set(n)});var i=this;t.$element.on("asColorPicker::update asColorPicker::setup",function(t,e){i.update(e)})},update:function(t){this.$r.val(t.value.r),this.$g.val(t.value.g),this.$b.val(t.value.b),this.$a.val(t.value.a)}};window.localStorage||(window.localStorage=function(){});var b={defaults:{template:function(t){return'<ul class="'+t+'-palettes"></ul>'},item:function(t,e){return'<li data-color="'+e+'"><span style="background-color:'+e+'" /></li>'},colors:["white","black","red","blue","yellow"],max:10,localStorage:!0},init:function(t,e){var i=this,a=void 0,n=(0,h.default)();this.options=$.extend(!0,{},this.defaults,e),this.colors=[];var s=void 0;this.options.localStorage?(s=t.namespace+"_palettes_"+t.id,(a=this.getLocal(s))||(a=this.options.colors,this.setLocal(s,a))):a=this.options.colors;for(var o in a)Object.hasOwnProperty.call(a,o)&&this.colors.push(n.val(a[o]).toRGBA());var r="";$.each(this.colors,function(e,a){r+=i.options.item(t.namespace,a)}),this.$palettes=$(this.options.template.call(this,t.namespace)).html(r).appendTo(t.$dropdown),this.$palettes.on(t.eventName("click"),"li",function(e){var i=$(this).data("color");t.set(i),e.preventDefault(),e.stopPropagation()}),t.$element.on("asColorPicker::apply",function(t,e,a){"function"!=typeof a.toRGBA&&(a=a.get().color);var n=a.toRGBA();-1===$.inArray(n,i.colors)&&(i.colors.length>=i.options.max&&(i.colors.shift(),i.$palettes.find("li").eq(0).remove()),i.colors.push(n),i.$palettes.append(i.options.item(e.namespace,a)),i.options.localStorage&&i.setLocal(s,i.colors))})},setLocal:function(t,e){var i=JSON.stringify(e);localStorage[t]=i},getLocal:function(t){var e=localStorage[t];return e?JSON.parse(e):e}},x={defaults:{template:function(t){return'<ul class="'+t+'-preview"><li class="'+t+'-preview-current"><span /></li><li class="'+t+'-preview-previous"><span /></li></ul>'}},init:function(t,e){var i=this;this.options=$.extend(this.defaults,e),this.$preview=$(this.options.template.call(i,t.namespace)).appendTo(t.$dropdown),this.$current=this.$preview.find("."+t.namespace+"-preview-current span"),this.$previous=this.$preview.find("."+t.namespace+"-preview-previous span"),t.$element.on("asColorPicker::firstOpen",function(){i.$previous.on("click",function(){return t.set($(this).data("color")),!1})}),t.$element.on("asColorPicker::setup",function(t,e,a){i.updateCurrent(a),i.updatePreview(a)}),t.$element.on("asColorPicker::update",function(t,e,a){i.updateCurrent(a)})},updateCurrent:function(t){this.$current.css("backgroundColor",t.toRGBA())},updatePreview:function(t){this.$previous.css("backgroundColor",t.toRGBA()),this.$previous.data("color",{r:t.value.r,g:t.value.g,b:t.value.b,a:t.value.a})}},C=function(t,e){this.api=t,this.options=e,this.classes={enable:t.namespace+"-gradient_enable",marker:t.namespace+"-gradient-marker",active:t.namespace+"-gradient-marker_active",focus:t.namespace+"-gradient_focus"},this.isEnabled=!1,this.initialized=!1,this.current=null,this.value=(0,l.default)(this.options.settings),this.$doc=$(document);var i=this;$.extend(i,{init:function(){i.$wrap=$(i.options.template.call(i)).appendTo(t.$dropdown),i.$gradient=i.$wrap.filter("."+t.namespace+"-gradient"),this.angle.init(),this.preview.init(),this.markers.init(),this.wheel.init(),this.bind(),(!1===i.options.switchable||this.value.matchString(t.element.value))&&i.enable(),this.initialized=!0},bind:function(){var e=t.namespace;i.$gradient.on("update",function(){var e=i.value.getById(i.current);e&&t._trigger("update",e.color,i.value),t.element.value!==i.value.toString()&&t._updateInput()}),i.options.switchable&&i.$wrap.on("click","."+e+"-gradient-switch",function(){return i.isEnabled?i.disable():i.enable(),!1}),i.$wrap.on("click","."+e+"-gradient-cancel",function(){return(!1===i.options.switchable||l.default.matchString(t.originValue))&&i.overrideCore(),t.cancel(),!1})},overrideCore:function(){t.set=function(e){if(t.isEmpty=""===e,"string"==typeof e)!1===i.options.switchable||l.default.matchString(e)?i.isEnabled?(i.val(e),t.color=i.value,i.$gradient.trigger("update",i.value.value)):i.enable(e):(i.disable(),t.val(e));else{var a=i.value.getById(i.current);a&&(a.color.val(e),t._trigger("update",a.color,i.value)),i.$gradient.trigger("update",{id:i.current,stop:a})}},t._setup=function(){var e=i.value.getById(i.current);t._trigger("setup",e.color)}},revertCore:function(){t.set=$.proxy(t._set,t),t._setup=function(){t._trigger("setup",t.color)}},preview:{init:function(){var e=this;i.$preview=i.$gradient.find("."+t.namespace+"-gradient-preview"),i.$gradient.on("add del update empty",function(){e.render()})},render:function(){i.$preview.css({"background-image":i.value.toStringWithAngle("to right",!0)}),i.$preview.css({"background-image":i.value.toStringWithAngle("to right")})}},markers:{width:160,init:function(){var e=this;i.$markers=i.$gradient.find("."+t.namespace+"-gradient-markers").attr("tabindex",0),i.$gradient.on("add",function(t,i){e.add(i.stop)}),i.$gradient.on("active",function(t,i){e.active(i.id)}),i.$gradient.on("del",function(t,i){e.del(i.id)}),i.$gradient.on("update",function(t,i){i.stop&&e.update(i.stop.id,i.stop.color)}),i.$gradient.on("empty",function(){e.empty()}),i.$markers.on(i.api.eventName("mousedown"),function(t){if(t.which?3===t.which:2===t.button)return!1;var e=parseFloat((t.pageX-i.$markers.offset().left)/i.markers.width,10);return i.add("#fff",e),!1});var a=this;i.$markers.on(i.api.eventName("mousedown"),"li",function(t){return(t.which?3!==t.which:2!==t.button)&&(a.mousedown(this,t),!1)}),i.$doc.on(i.api.eventName("keydown"),function(t){if(i.api.opened&&i.$markers.is("."+i.classes.focus)){var e=t.keyCode||t.which;if(46===e||8===e)return!(i.value.length<=2)&&(i.del(i.current),!1)}}),i.$markers.on(i.api.eventName("focus"),function(){i.$markers.addClass(i.classes.focus)}).on(i.api.eventName("blur"),function(){i.$markers.removeClass(i.classes.focus)}),i.$markers.on(i.api.eventName("click"),"li",function(){var t=$(this).data("id");i.active(t)})},getMarker:function(t){return i.$markers.find('[data-id="'+t+'"]')},update:function(t,e){var i=this.getMarker(t);i.find("span").css("background-color",e.toHEX()),i.find("i").css("background-color",e.toHEX())},add:function(t){$('<li data-id="'+t.id+'" style="left:'+s(t.position)+'" class="'+i.classes.marker+'"><span style="background-color: '+t.color.toHEX()+'"></span><i style="background-color: '+t.color.toHEX()+'"></i></li>').appendTo(i.$markers)},empty:function(){i.$markers.html("")},del:function(t){var e=this.getMarker(t),a=e.prev();0===a.length&&(a=e.next()),i.active(a.data("id")),e.remove()},active:function(t){i.$markers.children().removeClass(i.classes.active),this.getMarker(t).addClass(i.classes.active),i.$markers.focus()},mousedown:function(t,e){var a=this,n=$(t).data("id"),s=$(t).position().left,o=e.pageX,r=void 0;return this.mousemove=function(e){r=e.pageX||o;var i=(s+r-o)/this.width;return a.move(t,i,n),!1},this.mouseup=function(){return $(document).off({mousemove:this.mousemove,mouseup:this.mouseup}),!1},i.$doc.on({mousemove:$.proxy(this.mousemove,this),mouseup:$.proxy(this.mouseup,this)}),i.active(n),!1},move:function(t,e,a){i.api.isEmpty=!1,e=Math.max(0,Math.min(1,e)),$(t).css({left:s(e)}),a||(a=$(t).data("id")),i.value.getById(a).setPosition(e),i.$gradient.trigger("update",{id:$(t).data("id"),position:e})}},wheel:{init:function(){var e=this;i.$wheel=i.$gradient.find("."+t.namespace+"-gradient-wheel"),i.$pointer=i.$wheel.find("i"),i.$gradient.on("update",function(t,i){void 0!==i.angle&&e.position(i.angle)}),i.$wheel.on(i.api.eventName("mousedown"),function(t){return(t.which?3!==t.which:2!==t.button)&&(e.mousedown(t,i),!1)})},mousedown:function(t,e){var i=this,a=e.$wheel.offset(),n=e.$wheel.width()/2,s=a.left+n,o=a.top+n,r=e.$doc;this.r=n,this.wheelMove=function(t){var a=t.pageX-s,n=o-t.pageY,r=i.getPosition(a,n),h=i.calAngle(r.x,r.y);e.api.isEmpty=!1,e.setAngle(h)},this.wheelMouseup=function(){return r.off({mousemove:this.wheelMove,mouseup:this.wheelMouseup}),!1},r.on({mousemove:$.proxy(this.wheelMove,this),mouseup:$.proxy(this.wheelMouseup,this)}),this.wheelMove(t)},getPosition:function(t,e){var i=this.r;return{x:t/Math.sqrt(t*t+e*e)*i,y:e/Math.sqrt(t*t+e*e)*i}},calAngle:function(t,e){var i=Math.round(Math.atan(Math.abs(t/e))*(180/Math.PI));return t<0&&e>0?360-i:t<0&&e<=0?i+180:t>=0&&e<=0?180-i:t>=0&&e>0?i:void 0},set:function(t){i.value.angle(t),i.$gradient.trigger("update",{angle:t})},position:function(t){var e=this.r||i.$wheel.width()/2,a=this.calPointer(t,e);i.$pointer.css({left:a.x,top:a.y})},calPointer:function(t,e){return{x:e+Math.sin(t*Math.PI/180)*e,y:e-Math.cos(t*Math.PI/180)*e}}},angle:{init:function(){i.$angle=i.$gradient.find("."+t.namespace+"-gradient-angle"),i.$angle.on(i.api.eventName("blur"),function(){return i.setAngle(this.value),!1}).on(i.api.eventName("keydown"),function(t){if(13===(t.keyCode||t.which))return i.api.isEmpty=!1,$(this).blur(),!1}),i.$gradient.on("update",function(t,e){void 0!==e.angle&&i.$angle.val(e.angle)})},set:function(t){i.value.angle(t),i.$gradient.trigger("update",{angle:t})}}}),this.init()};C.prototype={constructor:C,enable:function(t){!0!==this.isEnabled&&(this.isEnabled=!0,this.overrideCore(),this.$gradient.addClass(this.classes.enable),this.markers.width=this.$markers.width(),void 0===t&&(t=this.api.element.value),this.api.isEmpty=""===t,!l.default.matchString(t)&&this._last?this.value=this._last:this.val(t),this.api.color=this.value,this.$gradient.trigger("update",this.value.value),this.api.opened&&this.api.position())},val:function(t){if(""===t||this.value.toString()!==t){if(this.empty(),this.value.val(t),this.value.reorder(),this.value.length<2){var e=t;h.default.matchString(t)||(e="rgba(0,0,0,1)"),0===this.value.length&&this.value.append(e,0),1===this.value.length&&this.value.append(e,1)}for(var i=void 0,a=0;a<this.value.length;a++)(i=this.value.get(a))&&this.$gradient.trigger("add",{stop:i});this.active(i.id)}},disable:function(){!1!==this.isEnabled&&(this.isEnabled=!1,this.revertCore(),this.$gradient.removeClass(this.classes.enable),this._last=this.value,this.api.color=this.api.color.getCurrent().color,this.api.set(this.api.color.value),this.api.opened&&this.api.position())},active:function(t){this.current!==t&&(this.current=t,this.value.setCurrentById(t),this.$gradient.trigger("active",{id:t}))},empty:function(){this.value.empty(),this.$gradient.trigger("empty")},add:function(t,e){var i=this.value.insert(t,e);return this.api.isEmpty=!1,this.value.reorder(),this.$gradient.trigger("add",{stop:i}),this.active(i.id),this.$gradient.trigger("update",{stop:i}),i},del:function(t){this.value.length<=2||(this.value.removeById(t),this.value.reorder(),this.$gradient.trigger("del",{id:t}),this.$gradient.trigger("update",{}))},setAngle:function(t){this.value.angle(t),this.$gradient.trigger("update",{angle:t})}};var M={defaults:{switchable:!0,switchText:"Gradient",cancelText:"Cancel",settings:{forceStandard:!0,angleUseKeyword:!0,emptyString:"",degradationFormat:!1,cleanPosition:!1,color:{format:"rgb"}},template:function(){var t=this.api.namespace,e='<div class="'+t+'-gradient-control">';return this.options.switchable&&(e+='<a href="#" class="'+t+'-gradient-switch">'+this.options.switchText+"</a>"),(e+='<a href="#" class="'+t+'-gradient-cancel">'+this.options.cancelText+"</a></div>")+'<div class="'+t+'-gradient"><div class="'+t+'-gradient-preview"><ul class="'+t+'-gradient-markers"></ul></div><div class="'+t+'-gradient-wheel"><i></i></div><input class="'+t+'-gradient-angle" type="text" value="" size="3" /></div>'}},init:function(t,e){var i=this;t.$element.on("asColorPicker::ready",function(a,n){"gradient"===n.options.mode&&(i.defaults.settings.color=t.options.color,e=$.extend(!0,i.defaults,e),t.gradient=new C(t,e))})}},T={},_={en:{cancelText:"cancel",applyText:"apply"}},P=0,z=function(){function t(e,i){n(this,t),this.element=e,this.$element=(0,r.default)(e),this.opened=!1,this.firstOpen=!0,this.disabled=!1,this.initialed=!1,this.originValue=this.element.value,this.isEmpty=!1,o(this),this.options=r.default.extend(!0,{},c,i,this.$element.data()),this.namespace=this.options.namespace,this.classes={wrap:this.namespace+"-wrap",dropdown:this.namespace+"-dropdown",input:this.namespace+"-input",skin:this.namespace+"_"+this.options.skin,open:this.namespace+"_open",mask:this.namespace+"-mask",hideInput:this.namespace+"_hideInput",disabled:this.namespace+"_disabled",mode:this.namespace+"-mode_"+this.options.mode},this.options.hideInput&&this.$element.addClass(this.classes.hideInput),this.components=d[this.options.mode],this._components=r.default.extend(!0,{},T),this._trigger("init"),this.init()}return u(t,[{key:"_trigger",value:function(t){for(var e=arguments.length,i=Array(e>1?e-1:0),a=1;a<e;a++)i[a-1]=arguments[a];var n=[this].concat(i);this.$element.trigger("asColorPicker::"+t,n);var s="on"+(t=t.replace(/\b\w+\b/g,function(t){return t.substring(0,1).toUpperCase()+t.substring(1)}));"function"==typeof this.options[s]&&this.options[s].apply(this,i)}},{key:"eventName",value:function(t){if("string"!=typeof t||""===t)return"."+this.options.namespace;for(var e=(t=t.split(" ")).length,i=0;i<e;i++)t[i]=t[i]+"."+this.options.namespace;return t.join(" ")}},{key:"init",value:function(){this.color=(0,h.default)(this.element.value,this.options.color),this._create(),this.options.skin&&(this.$dropdown.addClass(this.classes.skin),this.$element.parent().addClass(this.classes.skin)),this.options.readonly&&this.$element.prop("readonly",!0),this._bindEvent(),this.initialed=!0,this._trigger("ready")}},{key:"_create",value:function(){var t=this;this.$dropdown=(0,r.default)('<div class="'+this.classes.dropdown+'" data-mode="'+this.options.mode+'"></div>'),this.$element.wrap('<div class="'+this.classes.wrap+'"></div>').addClass(this.classes.input),this.$wrap=this.$element.parent(),this.$body=(0,r.default)("body"),this.$dropdown.data("asColorPicker",this);var e=void 0;r.default.each(this.components,function(i,a){!0===a&&(a={}),void 0!==t.options[i]&&(a=r.default.extend(!0,{},a,t.options[i])),Object.hasOwnProperty.call(t._components,i)&&(e=t._components[i]).init(t,a)}),this._trigger("create")}},{key:"_bindEvent",value:function(){var t=this;this.$element.on(this.eventName("click"),function(){return t.opened||t.open(),!1}),this.$element.on(this.eventName("keydown"),function(e){9===e.keyCode?t.close():13===e.keyCode&&(t.val(t.element.value),t.close())}),this.$element.on(this.eventName("keyup"),function(){t.color.matchString(t.element.value)&&t.val(t.element.value)})}},{key:"opacity",value:function(t){if(!t)return this.color.alpha();this.color.alpha(t)}},{key:"position",value:function(){var t=!this.$element.is(":visible"),e=t?this.$trigger.offset():this.$element.offset(),i=t?this.$trigger.outerHeight():this.$element.outerHeight(),a=t?this.$trigger.outerWidth():this.$element.outerWidth()+this.$trigger.outerWidth(),n=this.$dropdown.outerWidth(!0),s=this.$dropdown.outerHeight(!0),o=void 0,h=void 0;o=s+e.top>(0,r.default)(window).height()+(0,r.default)(window).scrollTop()?e.top-s:e.top+i,h=n+e.left>(0,r.default)(window).width()+(0,r.default)(window).scrollLeft()?e.left-n+a:e.left,this.$dropdown.css({position:"absolute",top:o,left:h})}},{key:"open",value:function(){this.disabled||(this.originValue=this.element.value,this.$dropdown[0]!==this.$body.children().last()[0]&&this.$dropdown.detach().appendTo(this.$body),this.$mask=(0,r.default)("."+this.classes.mask),0===this.$mask.length&&this.createMask(),this.$dropdown.prev()[0]!==this.$mask[0]&&this.$dropdown.before(this.$mask),(0,r.default)("#asColorPicker-dropdown").removeAttr("id"),this.$dropdown.attr("id","asColorPicker-dropdown"),this.$mask.show(),this.position(),(0,r.default)(window).on(this.eventName("resize"),r.default.proxy(this.position,this)),this.$dropdown.addClass(this.classes.open),this.opened=!0,this.firstOpen&&(this.firstOpen=!1,this._trigger("firstOpen")),this._setup(),this._trigger("open"))}},{key:"createMask",value:function(){this.$mask=(0,r.default)(document.createElement("div")),this.$mask.attr("class",this.classes.mask),this.$mask.hide(),this.$mask.appendTo(this.$body),this.$mask.on(this.eventName("mousedown touchstart click"),function(t){var e=(0,r.default)("#asColorPicker-dropdown"),i=void 0;e.length>0&&((i=e.data("asColorPicker")).opened&&(i.options.hideFireChange?i.apply():i.cancel()),t.preventDefault(),t.stopPropagation())})}},{key:"close",value:function(){this.opened=!1,this.$element.blur(),this.$mask.hide(),this.$dropdown.removeClass(this.classes.open),(0,r.default)(window).off(this.eventName("resize")),this._trigger("close")}},{key:"clear",value:function(){this.val("")}},{key:"cancel",value:function(){this.close(),this.set(this.originValue)}},{key:"apply",value:function(){this._trigger("apply",this.color),this.close()}},{key:"val",value:function(t){if(void 0===t)return this.color.toString();this.set(t)}},{key:"_update",value:function(){this._trigger("update",this.color),this._updateInput()}},{key:"_updateInput",value:function(){var t=this.color.toString();this.isEmpty&&(t=""),this._trigger("change",t),this.$element.val(t)}},{key:"set",value:function(t){return this.isEmpty=""===t,this._set(t)}},{key:"_set",value:function(t){"string"==typeof t?this.color.val(t):this.color.set(t),this._update()}},{key:"_setup",value:function(){this._trigger("setup",this.color)}},{key:"get",value:function(){return this.color}},{key:"enable",value:function(){return this.disabled=!1,this.$parent.addClass(this.classes.disabled),this._trigger("enable"),this}},{key:"disable",value:function(){return this.disabled=!0,this.$parent.removeClass(this.classes.disabled),this._trigger("disable"),this}},{key:"destroy",value:function(){return this.$element.unwrap(),this.$element.off(this.eventName()),this.$mask.remove(),this.$dropdown.remove(),this.initialized=!1,this.$element.data("asColorPicker",null),this._trigger("destroy"),this}},{key:"getString",value:function(t,e){return this.options.lang in _&&void 0!==_[this.options.lang][t]?_[this.options.lang][t]:e}}],[{key:"setLocalization",value:function(t,e){_[t]=e}},{key:"registerComponent",value:function(t,e){T[t]=e}},{key:"setDefaults",value:function(t){r.default.extend(!0,c,r.default.isPlainObject(t)&&t)}}]),t}();z.registerComponent("alpha",p),z.registerComponent("hex",f),z.registerComponent("hue",v),z.registerComponent("saturation",m),z.registerComponent("buttons",g),z.registerComponent("trigger",y),z.registerComponent("clear",w),z.registerComponent("info",k),z.registerComponent("palettes",b),z.registerComponent("preview",x),z.registerComponent("gradient",M),z.setLocalization("cn",{cancelText:"取消",applyText:"应用"}),z.setLocalization("de",{cancelText:"Abbrechen",applyText:"Wählen"}),z.setLocalization("dk",{cancelText:"annuller",applyText:"Vælg"}),z.setLocalization("es",{cancelText:"Cancelar",applyText:"Elegir"}),z.setLocalization("fi",{cancelText:"Kumoa",applyText:"Valitse"}),z.setLocalization("fr",{cancelText:"Annuler",applyText:"Valider"}),z.setLocalization("it",{cancelText:"annulla",applyText:"scegli"}),z.setLocalization("ja",{cancelText:"中止",applyText:"選択"}),z.setLocalization("ru",{cancelText:"отмена",applyText:"выбрать"}),z.setLocalization("sv",{cancelText:"Avbryt",applyText:"Välj"}),z.setLocalization("tr",{cancelText:"Avbryt",applyText:"Välj"});var E={version:"0.4.4"},A=r.default.fn.asColorPicker,S=function(t){for(var e=arguments.length,i=Array(e>1?e-1:0),a=1;a<e;a++)i[a-1]=arguments[a];if("string"==typeof t){var n=t;if(/^_/.test(n))return!1;if(!(/^(get)$/.test(n)||"val"===n&&0===i.length))return this.each(function(){var t=r.default.data(this,"asColorPicker");t&&"function"==typeof t[n]&&t[n].apply(t,i)});var s=this.first().data("asColorPicker");if(s&&"function"==typeof s[n])return s[n].apply(s,i)}return this.each(function(){(0,r.default)(this).data("asColorPicker")||(0,r.default)(this).data("asColorPicker",new z(this,t))})};r.default.fn.asColorPicker=S,r.default.asColorPicker=r.default.extend({setDefaults:z.setDefaults,registerComponent:z.registerComponent,setLocalization:z.setLocalization,noConflict:function(){return r.default.fn.asColorPicker=A,S}},E)});
//# sourceMappingURL=jquery-asColorPicker.min.js.map

/*! Select2 4.0.5 | https://github.com/select2/select2/blob/master/LICENSE.md */!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){var b=function(){if(a&&a.fn&&a.fn.select2&&a.fn.select2.amd)var b=a.fn.select2.amd;var b;return function(){if(!b||!b.requirejs){b?c=b:b={};var a,c,d;!function(b){function e(a,b){return v.call(a,b)}function f(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o=b&&b.split("/"),p=t.map,q=p&&p["*"]||{};if(a){for(a=a.split("/"),g=a.length-1,t.nodeIdCompat&&x.test(a[g])&&(a[g]=a[g].replace(x,"")),"."===a[0].charAt(0)&&o&&(n=o.slice(0,o.length-1),a=n.concat(a)),k=0;k<a.length;k++)if("."===(m=a[k]))a.splice(k,1),k-=1;else if(".."===m){if(0===k||1===k&&".."===a[2]||".."===a[k-1])continue;k>0&&(a.splice(k-1,2),k-=2)}a=a.join("/")}if((o||q)&&p){for(c=a.split("/"),k=c.length;k>0;k-=1){if(d=c.slice(0,k).join("/"),o)for(l=o.length;l>0;l-=1)if((e=p[o.slice(0,l).join("/")])&&(e=e[d])){f=e,h=k;break}if(f)break;!i&&q&&q[d]&&(i=q[d],j=k)}!f&&i&&(f=i,h=j),f&&(c.splice(0,h,f),a=c.join("/"))}return a}function g(a,c){return function(){var d=w.call(arguments,0);return"string"!=typeof d[0]&&1===d.length&&d.push(null),o.apply(b,d.concat([a,c]))}}function h(a){return function(b){return f(b,a)}}function i(a){return function(b){r[a]=b}}function j(a){if(e(s,a)){var c=s[a];delete s[a],u[a]=!0,n.apply(b,c)}if(!e(r,a)&&!e(u,a))throw new Error("No "+a);return r[a]}function k(a){var b,c=a?a.indexOf("!"):-1;return c>-1&&(b=a.substring(0,c),a=a.substring(c+1,a.length)),[b,a]}function l(a){return a?k(a):[]}function m(a){return function(){return t&&t.config&&t.config[a]||{}}}var n,o,p,q,r={},s={},t={},u={},v=Object.prototype.hasOwnProperty,w=[].slice,x=/\.js$/;p=function(a,b){var c,d=k(a),e=d[0],g=b[1];return a=d[1],e&&(e=f(e,g),c=j(e)),e?a=c&&c.normalize?c.normalize(a,h(g)):f(a,g):(a=f(a,g),d=k(a),e=d[0],a=d[1],e&&(c=j(e))),{f:e?e+"!"+a:a,n:a,pr:e,p:c}},q={require:function(a){return g(a)},exports:function(a){var b=r[a];return void 0!==b?b:r[a]={}},module:function(a){return{id:a,uri:"",exports:r[a],config:m(a)}}},n=function(a,c,d,f){var h,k,m,n,o,t,v,w=[],x=typeof d;if(f=f||a,t=l(f),"undefined"===x||"function"===x){for(c=!c.length&&d.length?["require","exports","module"]:c,o=0;o<c.length;o+=1)if(n=p(c[o],t),"require"===(k=n.f))w[o]=q.require(a);else if("exports"===k)w[o]=q.exports(a),v=!0;else if("module"===k)h=w[o]=q.module(a);else if(e(r,k)||e(s,k)||e(u,k))w[o]=j(k);else{if(!n.p)throw new Error(a+" missing "+k);n.p.load(n.n,g(f,!0),i(k),{}),w[o]=r[k]}m=d?d.apply(r[a],w):void 0,a&&(h&&h.exports!==b&&h.exports!==r[a]?r[a]=h.exports:m===b&&v||(r[a]=m))}else a&&(r[a]=d)},a=c=o=function(a,c,d,e,f){if("string"==typeof a)return q[a]?q[a](c):j(p(a,l(c)).f);if(!a.splice){if(t=a,t.deps&&o(t.deps,t.callback),!c)return;c.splice?(a=c,c=d,d=null):a=b}return c=c||function(){},"function"==typeof d&&(d=e,e=f),e?n(b,a,c,d):setTimeout(function(){n(b,a,c,d)},4),o},o.config=function(a){return o(a)},a._defined=r,d=function(a,b,c){if("string"!=typeof a)throw new Error("See almond README: incorrect module build, no module name");b.splice||(c=b,b=[]),e(r,a)||e(s,a)||(s[a]=[a,b,c])},d.amd={jQuery:!0}}(),b.requirejs=a,b.require=c,b.define=d}}(),b.define("almond",function(){}),b.define("jquery",[],function(){var b=a||$;return null==b&&console&&console.error&&console.error("Select2: An instance of jQuery or a jQuery-compatible library was not found. Make sure that you are including jQuery before Select2 on your web page."),b}),b.define("select2/utils",["jquery"],function(a){function b(a){var b=a.prototype,c=[];for(var d in b){"function"==typeof b[d]&&("constructor"!==d&&c.push(d))}return c}var c={};c.Extend=function(a,b){function c(){this.constructor=a}var d={}.hasOwnProperty;for(var e in b)d.call(b,e)&&(a[e]=b[e]);return c.prototype=b.prototype,a.prototype=new c,a.__super__=b.prototype,a},c.Decorate=function(a,c){function d(){var b=Array.prototype.unshift,d=c.prototype.constructor.length,e=a.prototype.constructor;d>0&&(b.call(arguments,a.prototype.constructor),e=c.prototype.constructor),e.apply(this,arguments)}function e(){this.constructor=d}var f=b(c),g=b(a);c.displayName=a.displayName,d.prototype=new e;for(var h=0;h<g.length;h++){var i=g[h];d.prototype[i]=a.prototype[i]}for(var j=(function(a){var b=function(){};a in d.prototype&&(b=d.prototype[a]);var e=c.prototype[a];return function(){return Array.prototype.unshift.call(arguments,b),e.apply(this,arguments)}}),k=0;k<f.length;k++){var l=f[k];d.prototype[l]=j(l)}return d};var d=function(){this.listeners={}};return d.prototype.on=function(a,b){this.listeners=this.listeners||{},a in this.listeners?this.listeners[a].push(b):this.listeners[a]=[b]},d.prototype.trigger=function(a){var b=Array.prototype.slice,c=b.call(arguments,1);this.listeners=this.listeners||{},null==c&&(c=[]),0===c.length&&c.push({}),c[0]._type=a,a in this.listeners&&this.invoke(this.listeners[a],b.call(arguments,1)),"*"in this.listeners&&this.invoke(this.listeners["*"],arguments)},d.prototype.invoke=function(a,b){for(var c=0,d=a.length;c<d;c++)a[c].apply(this,b)},c.Observable=d,c.generateChars=function(a){for(var b="",c=0;c<a;c++){b+=Math.floor(36*Math.random()).toString(36)}return b},c.bind=function(a,b){return function(){a.apply(b,arguments)}},c._convertData=function(a){for(var b in a){var c=b.split("-"),d=a;if(1!==c.length){for(var e=0;e<c.length;e++){var f=c[e];f=f.substring(0,1).toLowerCase()+f.substring(1),f in d||(d[f]={}),e==c.length-1&&(d[f]=a[b]),d=d[f]}delete a[b]}}return a},c.hasScroll=function(b,c){var d=a(c),e=c.style.overflowX,f=c.style.overflowY;return(e!==f||"hidden"!==f&&"visible"!==f)&&("scroll"===e||"scroll"===f||(d.innerHeight()<c.scrollHeight||d.innerWidth()<c.scrollWidth))},c.escapeMarkup=function(a){var b={"\\":"&#92;","&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#47;"};return"string"!=typeof a?a:String(a).replace(/[&<>"'\/\\]/g,function(a){return b[a]})},c.appendMany=function(b,c){if("1.7"===a.fn.jquery.substr(0,3)){var d=a();a.map(c,function(a){d=d.add(a)}),c=d}b.append(c)},c}),b.define("select2/results",["jquery","./utils"],function(a,b){function c(a,b,d){this.$element=a,this.data=d,this.options=b,c.__super__.constructor.call(this)}return b.Extend(c,b.Observable),c.prototype.render=function(){var b=a('<ul class="select2-results__options" role="tree"></ul>');return this.options.get("multiple")&&b.attr("aria-multiselectable","true"),this.$results=b,b},c.prototype.clear=function(){this.$results.empty()},c.prototype.displayMessage=function(b){var c=this.options.get("escapeMarkup");this.clear(),this.hideLoading();var d=a('<li role="treeitem" aria-live="assertive" class="select2-results__option"></li>'),e=this.options.get("translations").get(b.message);d.append(c(e(b.args))),d[0].className+=" select2-results__message",this.$results.append(d)},c.prototype.hideMessages=function(){this.$results.find(".select2-results__message").remove()},c.prototype.append=function(a){this.hideLoading();var b=[];if(null==a.results||0===a.results.length)return void(0===this.$results.children().length&&this.trigger("results:message",{message:"noResults"}));a.results=this.sort(a.results);for(var c=0;c<a.results.length;c++){var d=a.results[c],e=this.option(d);b.push(e)}this.$results.append(b)},c.prototype.position=function(a,b){b.find(".select2-results").append(a)},c.prototype.sort=function(a){return this.options.get("sorter")(a)},c.prototype.highlightFirstItem=function(){var a=this.$results.find(".select2-results__option[aria-selected]"),b=a.filter("[aria-selected=true]");b.length>0?b.first().trigger("mouseenter"):a.first().trigger("mouseenter"),this.ensureHighlightVisible()},c.prototype.setClasses=function(){var b=this;this.data.current(function(c){var d=a.map(c,function(a){return a.id.toString()});b.$results.find(".select2-results__option[aria-selected]").each(function(){var b=a(this),c=a.data(this,"data"),e=""+c.id;null!=c.element&&c.element.selected||null==c.element&&a.inArray(e,d)>-1?b.attr("aria-selected","true"):b.attr("aria-selected","false")})})},c.prototype.showLoading=function(a){this.hideLoading();var b=this.options.get("translations").get("searching"),c={disabled:!0,loading:!0,text:b(a)},d=this.option(c);d.className+=" loading-results",this.$results.prepend(d)},c.prototype.hideLoading=function(){this.$results.find(".loading-results").remove()},c.prototype.option=function(b){var c=document.createElement("li");c.className="select2-results__option";var d={role:"treeitem","aria-selected":"false"};b.disabled&&(delete d["aria-selected"],d["aria-disabled"]="true"),null==b.id&&delete d["aria-selected"],null!=b._resultId&&(c.id=b._resultId),b.title&&(c.title=b.title),b.children&&(d.role="group",d["aria-label"]=b.text,delete d["aria-selected"]);for(var e in d){var f=d[e];c.setAttribute(e,f)}if(b.children){var g=a(c),h=document.createElement("strong");h.className="select2-results__group";a(h);this.template(b,h);for(var i=[],j=0;j<b.children.length;j++){var k=b.children[j],l=this.option(k);i.push(l)}var m=a("<ul></ul>",{class:"select2-results__options select2-results__options--nested"});m.append(i),g.append(h),g.append(m)}else this.template(b,c);return a.data(c,"data",b),c},c.prototype.bind=function(b,c){var d=this,e=b.id+"-results";this.$results.attr("id",e),b.on("results:all",function(a){d.clear(),d.append(a.data),b.isOpen()&&(d.setClasses(),d.highlightFirstItem())}),b.on("results:append",function(a){d.append(a.data),b.isOpen()&&d.setClasses()}),b.on("query",function(a){d.hideMessages(),d.showLoading(a)}),b.on("select",function(){b.isOpen()&&(d.setClasses(),d.highlightFirstItem())}),b.on("unselect",function(){b.isOpen()&&(d.setClasses(),d.highlightFirstItem())}),b.on("open",function(){d.$results.attr("aria-expanded","true"),d.$results.attr("aria-hidden","false"),d.setClasses(),d.ensureHighlightVisible()}),b.on("close",function(){d.$results.attr("aria-expanded","false"),d.$results.attr("aria-hidden","true"),d.$results.removeAttr("aria-activedescendant")}),b.on("results:toggle",function(){var a=d.getHighlightedResults();0!==a.length&&a.trigger("mouseup")}),b.on("results:select",function(){var a=d.getHighlightedResults();if(0!==a.length){var b=a.data("data");"true"==a.attr("aria-selected")?d.trigger("close",{}):d.trigger("select",{data:b})}}),b.on("results:previous",function(){var a=d.getHighlightedResults(),b=d.$results.find("[aria-selected]"),c=b.index(a);if(0!==c){var e=c-1;0===a.length&&(e=0);var f=b.eq(e);f.trigger("mouseenter");var g=d.$results.offset().top,h=f.offset().top,i=d.$results.scrollTop()+(h-g);0===e?d.$results.scrollTop(0):h-g<0&&d.$results.scrollTop(i)}}),b.on("results:next",function(){var a=d.getHighlightedResults(),b=d.$results.find("[aria-selected]"),c=b.index(a),e=c+1;if(!(e>=b.length)){var f=b.eq(e);f.trigger("mouseenter");var g=d.$results.offset().top+d.$results.outerHeight(!1),h=f.offset().top+f.outerHeight(!1),i=d.$results.scrollTop()+h-g;0===e?d.$results.scrollTop(0):h>g&&d.$results.scrollTop(i)}}),b.on("results:focus",function(a){a.element.addClass("select2-results__option--highlighted")}),b.on("results:message",function(a){d.displayMessage(a)}),a.fn.mousewheel&&this.$results.on("mousewheel",function(a){var b=d.$results.scrollTop(),c=d.$results.get(0).scrollHeight-b+a.deltaY,e=a.deltaY>0&&b-a.deltaY<=0,f=a.deltaY<0&&c<=d.$results.height();e?(d.$results.scrollTop(0),a.preventDefault(),a.stopPropagation()):f&&(d.$results.scrollTop(d.$results.get(0).scrollHeight-d.$results.height()),a.preventDefault(),a.stopPropagation())}),this.$results.on("mouseup",".select2-results__option[aria-selected]",function(b){var c=a(this),e=c.data("data");if("true"===c.attr("aria-selected"))return void(d.options.get("multiple")?d.trigger("unselect",{originalEvent:b,data:e}):d.trigger("close",{}));d.trigger("select",{originalEvent:b,data:e})}),this.$results.on("mouseenter",".select2-results__option[aria-selected]",function(b){var c=a(this).data("data");d.getHighlightedResults().removeClass("select2-results__option--highlighted"),d.trigger("results:focus",{data:c,element:a(this)})})},c.prototype.getHighlightedResults=function(){return this.$results.find(".select2-results__option--highlighted")},c.prototype.destroy=function(){this.$results.remove()},c.prototype.ensureHighlightVisible=function(){var a=this.getHighlightedResults();if(0!==a.length){var b=this.$results.find("[aria-selected]"),c=b.index(a),d=this.$results.offset().top,e=a.offset().top,f=this.$results.scrollTop()+(e-d),g=e-d;f-=2*a.outerHeight(!1),c<=2?this.$results.scrollTop(0):(g>this.$results.outerHeight()||g<0)&&this.$results.scrollTop(f)}},c.prototype.template=function(b,c){var d=this.options.get("templateResult"),e=this.options.get("escapeMarkup"),f=d(b,c);null==f?c.style.display="none":"string"==typeof f?c.innerHTML=e(f):a(c).append(f)},c}),b.define("select2/keys",[],function(){return{BACKSPACE:8,TAB:9,ENTER:13,SHIFT:16,CTRL:17,ALT:18,ESC:27,SPACE:32,PAGE_UP:33,PAGE_DOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,DELETE:46}}),b.define("select2/selection/base",["jquery","../utils","../keys"],function(a,b,c){function d(a,b){this.$element=a,this.options=b,d.__super__.constructor.call(this)}return b.Extend(d,b.Observable),d.prototype.render=function(){var b=a('<span class="select2-selection" role="combobox"  aria-haspopup="true" aria-expanded="false"></span>');return this._tabindex=0,null!=this.$element.data("old-tabindex")?this._tabindex=this.$element.data("old-tabindex"):null!=this.$element.attr("tabindex")&&(this._tabindex=this.$element.attr("tabindex")),b.attr("title",this.$element.attr("title")),b.attr("tabindex",this._tabindex),this.$selection=b,b},d.prototype.bind=function(a,b){var d=this,e=(a.id,a.id+"-results");this.container=a,this.$selection.on("focus",function(a){d.trigger("focus",a)}),this.$selection.on("blur",function(a){d._handleBlur(a)}),this.$selection.on("keydown",function(a){d.trigger("keypress",a),a.which===c.SPACE&&a.preventDefault()}),a.on("results:focus",function(a){d.$selection.attr("aria-activedescendant",a.data._resultId)}),a.on("selection:update",function(a){d.update(a.data)}),a.on("open",function(){d.$selection.attr("aria-expanded","true"),d.$selection.attr("aria-owns",e),d._attachCloseHandler(a)}),a.on("close",function(){d.$selection.attr("aria-expanded","false"),d.$selection.removeAttr("aria-activedescendant"),d.$selection.removeAttr("aria-owns"),d.$selection.focus(),d._detachCloseHandler(a)}),a.on("enable",function(){d.$selection.attr("tabindex",d._tabindex)}),a.on("disable",function(){d.$selection.attr("tabindex","-1")})},d.prototype._handleBlur=function(b){var c=this;window.setTimeout(function(){document.activeElement==c.$selection[0]||a.contains(c.$selection[0],document.activeElement)||c.trigger("blur",b)},1)},d.prototype._attachCloseHandler=function(b){a(document.body).on("mousedown.select2."+b.id,function(b){var c=a(b.target),d=c.closest(".select2");a(".select2.select2-container--open").each(function(){var b=a(this);this!=d[0]&&b.data("element").select2("close")})})},d.prototype._detachCloseHandler=function(b){a(document.body).off("mousedown.select2."+b.id)},d.prototype.position=function(a,b){b.find(".selection").append(a)},d.prototype.destroy=function(){this._detachCloseHandler(this.container)},d.prototype.update=function(a){throw new Error("The `update` method must be defined in child classes.")},d}),b.define("select2/selection/single",["jquery","./base","../utils","../keys"],function(a,b,c,d){function e(){e.__super__.constructor.apply(this,arguments)}return c.Extend(e,b),e.prototype.render=function(){var a=e.__super__.render.call(this);return a.addClass("select2-selection--single"),a.html('<span class="select2-selection__rendered"></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span>'),a},e.prototype.bind=function(a,b){var c=this;e.__super__.bind.apply(this,arguments);var d=a.id+"-container";this.$selection.find(".select2-selection__rendered").attr("id",d),this.$selection.attr("aria-labelledby",d),this.$selection.on("mousedown",function(a){1===a.which&&c.trigger("toggle",{originalEvent:a})}),this.$selection.on("focus",function(a){}),this.$selection.on("blur",function(a){}),a.on("focus",function(b){a.isOpen()||c.$selection.focus()}),a.on("selection:update",function(a){c.update(a.data)})},e.prototype.clear=function(){this.$selection.find(".select2-selection__rendered").empty()},e.prototype.display=function(a,b){var c=this.options.get("templateSelection");return this.options.get("escapeMarkup")(c(a,b))},e.prototype.selectionContainer=function(){return a("<span></span>")},e.prototype.update=function(a){if(0===a.length)return void this.clear();var b=a[0],c=this.$selection.find(".select2-selection__rendered"),d=this.display(b,c);c.empty().append(d),c.prop("title",b.title||b.text)},e}),b.define("select2/selection/multiple",["jquery","./base","../utils"],function(a,b,c){function d(a,b){d.__super__.constructor.apply(this,arguments)}return c.Extend(d,b),d.prototype.render=function(){var a=d.__super__.render.call(this);return a.addClass("select2-selection--multiple"),a.html('<ul class="select2-selection__rendered"></ul>'),a},d.prototype.bind=function(b,c){var e=this;d.__super__.bind.apply(this,arguments),this.$selection.on("click",function(a){e.trigger("toggle",{originalEvent:a})}),this.$selection.on("click",".select2-selection__choice__remove",function(b){if(!e.options.get("disabled")){var c=a(this),d=c.parent(),f=d.data("data");e.trigger("unselect",{originalEvent:b,data:f})}})},d.prototype.clear=function(){this.$selection.find(".select2-selection__rendered").empty()},d.prototype.display=function(a,b){var c=this.options.get("templateSelection");return this.options.get("escapeMarkup")(c(a,b))},d.prototype.selectionContainer=function(){return a('<li class="select2-selection__choice"><span class="select2-selection__choice__remove" role="presentation">&times;</span></li>')},d.prototype.update=function(a){if(this.clear(),0!==a.length){for(var b=[],d=0;d<a.length;d++){var e=a[d],f=this.selectionContainer(),g=this.display(e,f);f.append(g),f.prop("title",e.title||e.text),f.data("data",e),b.push(f)}var h=this.$selection.find(".select2-selection__rendered");c.appendMany(h,b)}},d}),b.define("select2/selection/placeholder",["../utils"],function(a){function b(a,b,c){this.placeholder=this.normalizePlaceholder(c.get("placeholder")),a.call(this,b,c)}return b.prototype.normalizePlaceholder=function(a,b){return"string"==typeof b&&(b={id:"",text:b}),b},b.prototype.createPlaceholder=function(a,b){var c=this.selectionContainer();return c.html(this.display(b)),c.addClass("select2-selection__placeholder").removeClass("select2-selection__choice"),c},b.prototype.update=function(a,b){var c=1==b.length&&b[0].id!=this.placeholder.id;if(b.length>1||c)return a.call(this,b);this.clear();var d=this.createPlaceholder(this.placeholder);this.$selection.find(".select2-selection__rendered").append(d)},b}),b.define("select2/selection/allowClear",["jquery","../keys"],function(a,b){function c(){}return c.prototype.bind=function(a,b,c){var d=this;a.call(this,b,c),null==this.placeholder&&this.options.get("debug")&&window.console&&console.error&&console.error("Select2: The `allowClear` option should be used in combination with the `placeholder` option."),this.$selection.on("mousedown",".select2-selection__clear",function(a){d._handleClear(a)}),b.on("keypress",function(a){d._handleKeyboardClear(a,b)})},c.prototype._handleClear=function(a,b){if(!this.options.get("disabled")){var c=this.$selection.find(".select2-selection__clear");if(0!==c.length){b.stopPropagation();for(var d=c.data("data"),e=0;e<d.length;e++){var f={data:d[e]};if(this.trigger("unselect",f),f.prevented)return}this.$element.val(this.placeholder.id).trigger("change"),this.trigger("toggle",{})}}},c.prototype._handleKeyboardClear=function(a,c,d){d.isOpen()||c.which!=b.DELETE&&c.which!=b.BACKSPACE||this._handleClear(c)},c.prototype.update=function(b,c){if(b.call(this,c),!(this.$selection.find(".select2-selection__placeholder").length>0||0===c.length)){var d=a('<span class="select2-selection__clear">&times;</span>');d.data("data",c),this.$selection.find(".select2-selection__rendered").prepend(d)}},c}),b.define("select2/selection/search",["jquery","../utils","../keys"],function(a,b,c){function d(a,b,c){a.call(this,b,c)}return d.prototype.render=function(b){var c=a('<li class="select2-search select2-search--inline"><input class="select2-search__field" type="search" tabindex="-1" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" role="textbox" aria-autocomplete="list" /></li>');this.$searchContainer=c,this.$search=c.find("input");var d=b.call(this);return this._transferTabIndex(),d},d.prototype.bind=function(a,b,d){var e=this;a.call(this,b,d),b.on("open",function(){e.$search.trigger("focus")}),b.on("close",function(){e.$search.val(""),e.$search.removeAttr("aria-activedescendant"),e.$search.trigger("focus")}),b.on("enable",function(){e.$search.prop("disabled",!1),e._transferTabIndex()}),b.on("disable",function(){e.$search.prop("disabled",!0)}),b.on("focus",function(a){e.$search.trigger("focus")}),b.on("results:focus",function(a){e.$search.attr("aria-activedescendant",a.id)}),this.$selection.on("focusin",".select2-search--inline",function(a){e.trigger("focus",a)}),this.$selection.on("focusout",".select2-search--inline",function(a){e._handleBlur(a)}),this.$selection.on("keydown",".select2-search--inline",function(a){if(a.stopPropagation(),e.trigger("keypress",a),e._keyUpPrevented=a.isDefaultPrevented(),a.which===c.BACKSPACE&&""===e.$search.val()){var b=e.$searchContainer.prev(".select2-selection__choice");if(b.length>0){var d=b.data("data");e.searchRemoveChoice(d),a.preventDefault()}}});var f=document.documentMode,g=f&&f<=11;this.$selection.on("input.searchcheck",".select2-search--inline",function(a){if(g)return void e.$selection.off("input.search input.searchcheck");e.$selection.off("keyup.search")}),this.$selection.on("keyup.search input.search",".select2-search--inline",function(a){if(g&&"input"===a.type)return void e.$selection.off("input.search input.searchcheck");var b=a.which;b!=c.SHIFT&&b!=c.CTRL&&b!=c.ALT&&b!=c.TAB&&e.handleSearch(a)})},d.prototype._transferTabIndex=function(a){this.$search.attr("tabindex",this.$selection.attr("tabindex")),this.$selection.attr("tabindex","-1")},d.prototype.createPlaceholder=function(a,b){this.$search.attr("placeholder",b.text)},d.prototype.update=function(a,b){var c=this.$search[0]==document.activeElement;this.$search.attr("placeholder",""),a.call(this,b),this.$selection.find(".select2-selection__rendered").append(this.$searchContainer),this.resizeSearch(),c&&this.$search.focus()},d.prototype.handleSearch=function(){if(this.resizeSearch(),!this._keyUpPrevented){var a=this.$search.val();this.trigger("query",{term:a})}this._keyUpPrevented=!1},d.prototype.searchRemoveChoice=function(a,b){this.trigger("unselect",{data:b}),this.$search.val(b.text),this.handleSearch()},d.prototype.resizeSearch=function(){this.$search.css("width","25px");var a="";if(""!==this.$search.attr("placeholder"))a=this.$selection.find(".select2-selection__rendered").innerWidth();else{a=.75*(this.$search.val().length+1)+"em"}this.$search.css("width",a)},d}),b.define("select2/selection/eventRelay",["jquery"],function(a){function b(){}return b.prototype.bind=function(b,c,d){var e=this,f=["open","opening","close","closing","select","selecting","unselect","unselecting"],g=["opening","closing","selecting","unselecting"];b.call(this,c,d),c.on("*",function(b,c){if(-1!==a.inArray(b,f)){c=c||{};var d=a.Event("select2:"+b,{params:c});e.$element.trigger(d),-1!==a.inArray(b,g)&&(c.prevented=d.isDefaultPrevented())}})},b}),b.define("select2/translation",["jquery","require"],function(a,b){function c(a){this.dict=a||{}}return c.prototype.all=function(){return this.dict},c.prototype.get=function(a){return this.dict[a]},c.prototype.extend=function(b){this.dict=a.extend({},b.all(),this.dict)},c._cache={},c.loadPath=function(a){if(!(a in c._cache)){var d=b(a);c._cache[a]=d}return new c(c._cache[a])},c}),b.define("select2/diacritics",[],function(){return{"Ⓐ":"A","Ａ":"A","À":"A","Á":"A","Â":"A","Ầ":"A","Ấ":"A","Ẫ":"A","Ẩ":"A","Ã":"A","Ā":"A","Ă":"A","Ằ":"A","Ắ":"A","Ẵ":"A","Ẳ":"A","Ȧ":"A","Ǡ":"A","Ä":"A","Ǟ":"A","Ả":"A","Å":"A","Ǻ":"A","Ǎ":"A","Ȁ":"A","Ȃ":"A","Ạ":"A","Ậ":"A","Ặ":"A","Ḁ":"A","Ą":"A","Ⱥ":"A","Ɐ":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ⓑ":"B","Ｂ":"B","Ḃ":"B","Ḅ":"B","Ḇ":"B","Ƀ":"B","Ƃ":"B","Ɓ":"B","Ⓒ":"C","Ｃ":"C","Ć":"C","Ĉ":"C","Ċ":"C","Č":"C","Ç":"C","Ḉ":"C","Ƈ":"C","Ȼ":"C","Ꜿ":"C","Ⓓ":"D","Ｄ":"D","Ḋ":"D","Ď":"D","Ḍ":"D","Ḑ":"D","Ḓ":"D","Ḏ":"D","Đ":"D","Ƌ":"D","Ɗ":"D","Ɖ":"D","Ꝺ":"D","Ǳ":"DZ","Ǆ":"DZ","ǲ":"Dz","ǅ":"Dz","Ⓔ":"E","Ｅ":"E","È":"E","É":"E","Ê":"E","Ề":"E","Ế":"E","Ễ":"E","Ể":"E","Ẽ":"E","Ē":"E","Ḕ":"E","Ḗ":"E","Ĕ":"E","Ė":"E","Ë":"E","Ẻ":"E","Ě":"E","Ȅ":"E","Ȇ":"E","Ẹ":"E","Ệ":"E","Ȩ":"E","Ḝ":"E","Ę":"E","Ḙ":"E","Ḛ":"E","Ɛ":"E","Ǝ":"E","Ⓕ":"F","Ｆ":"F","Ḟ":"F","Ƒ":"F","Ꝼ":"F","Ⓖ":"G","Ｇ":"G","Ǵ":"G","Ĝ":"G","Ḡ":"G","Ğ":"G","Ġ":"G","Ǧ":"G","Ģ":"G","Ǥ":"G","Ɠ":"G","Ꞡ":"G","Ᵹ":"G","Ꝿ":"G","Ⓗ":"H","Ｈ":"H","Ĥ":"H","Ḣ":"H","Ḧ":"H","Ȟ":"H","Ḥ":"H","Ḩ":"H","Ḫ":"H","Ħ":"H","Ⱨ":"H","Ⱶ":"H","Ɥ":"H","Ⓘ":"I","Ｉ":"I","Ì":"I","Í":"I","Î":"I","Ĩ":"I","Ī":"I","Ĭ":"I","İ":"I","Ï":"I","Ḯ":"I","Ỉ":"I","Ǐ":"I","Ȉ":"I","Ȋ":"I","Ị":"I","Į":"I","Ḭ":"I","Ɨ":"I","Ⓙ":"J","Ｊ":"J","Ĵ":"J","Ɉ":"J","Ⓚ":"K","Ｋ":"K","Ḱ":"K","Ǩ":"K","Ḳ":"K","Ķ":"K","Ḵ":"K","Ƙ":"K","Ⱪ":"K","Ꝁ":"K","Ꝃ":"K","Ꝅ":"K","Ꞣ":"K","Ⓛ":"L","Ｌ":"L","Ŀ":"L","Ĺ":"L","Ľ":"L","Ḷ":"L","Ḹ":"L","Ļ":"L","Ḽ":"L","Ḻ":"L","Ł":"L","Ƚ":"L","Ɫ":"L","Ⱡ":"L","Ꝉ":"L","Ꝇ":"L","Ꞁ":"L","Ǉ":"LJ","ǈ":"Lj","Ⓜ":"M","Ｍ":"M","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ɯ":"M","Ⓝ":"N","Ｎ":"N","Ǹ":"N","Ń":"N","Ñ":"N","Ṅ":"N","Ň":"N","Ṇ":"N","Ņ":"N","Ṋ":"N","Ṉ":"N","Ƞ":"N","Ɲ":"N","Ꞑ":"N","Ꞥ":"N","Ǌ":"NJ","ǋ":"Nj","Ⓞ":"O","Ｏ":"O","Ò":"O","Ó":"O","Ô":"O","Ồ":"O","Ố":"O","Ỗ":"O","Ổ":"O","Õ":"O","Ṍ":"O","Ȭ":"O","Ṏ":"O","Ō":"O","Ṑ":"O","Ṓ":"O","Ŏ":"O","Ȯ":"O","Ȱ":"O","Ö":"O","Ȫ":"O","Ỏ":"O","Ő":"O","Ǒ":"O","Ȍ":"O","Ȏ":"O","Ơ":"O","Ờ":"O","Ớ":"O","Ỡ":"O","Ở":"O","Ợ":"O","Ọ":"O","Ộ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Ɔ":"O","Ɵ":"O","Ꝋ":"O","Ꝍ":"O","Ƣ":"OI","Ꝏ":"OO","Ȣ":"OU","Ⓟ":"P","Ｐ":"P","Ṕ":"P","Ṗ":"P","Ƥ":"P","Ᵽ":"P","Ꝑ":"P","Ꝓ":"P","Ꝕ":"P","Ⓠ":"Q","Ｑ":"Q","Ꝗ":"Q","Ꝙ":"Q","Ɋ":"Q","Ⓡ":"R","Ｒ":"R","Ŕ":"R","Ṙ":"R","Ř":"R","Ȑ":"R","Ȓ":"R","Ṛ":"R","Ṝ":"R","Ŗ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꝛ":"R","Ꞧ":"R","Ꞃ":"R","Ⓢ":"S","Ｓ":"S","ẞ":"S","Ś":"S","Ṥ":"S","Ŝ":"S","Ṡ":"S","Š":"S","Ṧ":"S","Ṣ":"S","Ṩ":"S","Ș":"S","Ş":"S","Ȿ":"S","Ꞩ":"S","Ꞅ":"S","Ⓣ":"T","Ｔ":"T","Ṫ":"T","Ť":"T","Ṭ":"T","Ț":"T","Ţ":"T","Ṱ":"T","Ṯ":"T","Ŧ":"T","Ƭ":"T","Ʈ":"T","Ⱦ":"T","Ꞇ":"T","Ꜩ":"TZ","Ⓤ":"U","Ｕ":"U","Ù":"U","Ú":"U","Û":"U","Ũ":"U","Ṹ":"U","Ū":"U","Ṻ":"U","Ŭ":"U","Ü":"U","Ǜ":"U","Ǘ":"U","Ǖ":"U","Ǚ":"U","Ủ":"U","Ů":"U","Ű":"U","Ǔ":"U","Ȕ":"U","Ȗ":"U","Ư":"U","Ừ":"U","Ứ":"U","Ữ":"U","Ử":"U","Ự":"U","Ụ":"U","Ṳ":"U","Ų":"U","Ṷ":"U","Ṵ":"U","Ʉ":"U","Ⓥ":"V","Ｖ":"V","Ṽ":"V","Ṿ":"V","Ʋ":"V","Ꝟ":"V","Ʌ":"V","Ꝡ":"VY","Ⓦ":"W","Ｗ":"W","Ẁ":"W","Ẃ":"W","Ŵ":"W","Ẇ":"W","Ẅ":"W","Ẉ":"W","Ⱳ":"W","Ⓧ":"X","Ｘ":"X","Ẋ":"X","Ẍ":"X","Ⓨ":"Y","Ｙ":"Y","Ỳ":"Y","Ý":"Y","Ŷ":"Y","Ỹ":"Y","Ȳ":"Y","Ẏ":"Y","Ÿ":"Y","Ỷ":"Y","Ỵ":"Y","Ƴ":"Y","Ɏ":"Y","Ỿ":"Y","Ⓩ":"Z","Ｚ":"Z","Ź":"Z","Ẑ":"Z","Ż":"Z","Ž":"Z","Ẓ":"Z","Ẕ":"Z","Ƶ":"Z","Ȥ":"Z","Ɀ":"Z","Ⱬ":"Z","Ꝣ":"Z","ⓐ":"a","ａ":"a","ẚ":"a","à":"a","á":"a","â":"a","ầ":"a","ấ":"a","ẫ":"a","ẩ":"a","ã":"a","ā":"a","ă":"a","ằ":"a","ắ":"a","ẵ":"a","ẳ":"a","ȧ":"a","ǡ":"a","ä":"a","ǟ":"a","ả":"a","å":"a","ǻ":"a","ǎ":"a","ȁ":"a","ȃ":"a","ạ":"a","ậ":"a","ặ":"a","ḁ":"a","ą":"a","ⱥ":"a","ɐ":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ⓑ":"b","ｂ":"b","ḃ":"b","ḅ":"b","ḇ":"b","ƀ":"b","ƃ":"b","ɓ":"b","ⓒ":"c","ｃ":"c","ć":"c","ĉ":"c","ċ":"c","č":"c","ç":"c","ḉ":"c","ƈ":"c","ȼ":"c","ꜿ":"c","ↄ":"c","ⓓ":"d","ｄ":"d","ḋ":"d","ď":"d","ḍ":"d","ḑ":"d","ḓ":"d","ḏ":"d","đ":"d","ƌ":"d","ɖ":"d","ɗ":"d","ꝺ":"d","ǳ":"dz","ǆ":"dz","ⓔ":"e","ｅ":"e","è":"e","é":"e","ê":"e","ề":"e","ế":"e","ễ":"e","ể":"e","ẽ":"e","ē":"e","ḕ":"e","ḗ":"e","ĕ":"e","ė":"e","ë":"e","ẻ":"e","ě":"e","ȅ":"e","ȇ":"e","ẹ":"e","ệ":"e","ȩ":"e","ḝ":"e","ę":"e","ḙ":"e","ḛ":"e","ɇ":"e","ɛ":"e","ǝ":"e","ⓕ":"f","ｆ":"f","ḟ":"f","ƒ":"f","ꝼ":"f","ⓖ":"g","ｇ":"g","ǵ":"g","ĝ":"g","ḡ":"g","ğ":"g","ġ":"g","ǧ":"g","ģ":"g","ǥ":"g","ɠ":"g","ꞡ":"g","ᵹ":"g","ꝿ":"g","ⓗ":"h","ｈ":"h","ĥ":"h","ḣ":"h","ḧ":"h","ȟ":"h","ḥ":"h","ḩ":"h","ḫ":"h","ẖ":"h","ħ":"h","ⱨ":"h","ⱶ":"h","ɥ":"h","ƕ":"hv","ⓘ":"i","ｉ":"i","ì":"i","í":"i","î":"i","ĩ":"i","ī":"i","ĭ":"i","ï":"i","ḯ":"i","ỉ":"i","ǐ":"i","ȉ":"i","ȋ":"i","ị":"i","į":"i","ḭ":"i","ɨ":"i","ı":"i","ⓙ":"j","ｊ":"j","ĵ":"j","ǰ":"j","ɉ":"j","ⓚ":"k","ｋ":"k","ḱ":"k","ǩ":"k","ḳ":"k","ķ":"k","ḵ":"k","ƙ":"k","ⱪ":"k","ꝁ":"k","ꝃ":"k","ꝅ":"k","ꞣ":"k","ⓛ":"l","ｌ":"l","ŀ":"l","ĺ":"l","ľ":"l","ḷ":"l","ḹ":"l","ļ":"l","ḽ":"l","ḻ":"l","ſ":"l","ł":"l","ƚ":"l","ɫ":"l","ⱡ":"l","ꝉ":"l","ꞁ":"l","ꝇ":"l","ǉ":"lj","ⓜ":"m","ｍ":"m","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ɯ":"m","ⓝ":"n","ｎ":"n","ǹ":"n","ń":"n","ñ":"n","ṅ":"n","ň":"n","ṇ":"n","ņ":"n","ṋ":"n","ṉ":"n","ƞ":"n","ɲ":"n","ŉ":"n","ꞑ":"n","ꞥ":"n","ǌ":"nj","ⓞ":"o","ｏ":"o","ò":"o","ó":"o","ô":"o","ồ":"o","ố":"o","ỗ":"o","ổ":"o","õ":"o","ṍ":"o","ȭ":"o","ṏ":"o","ō":"o","ṑ":"o","ṓ":"o","ŏ":"o","ȯ":"o","ȱ":"o","ö":"o","ȫ":"o","ỏ":"o","ő":"o","ǒ":"o","ȍ":"o","ȏ":"o","ơ":"o","ờ":"o","ớ":"o","ỡ":"o","ở":"o","ợ":"o","ọ":"o","ộ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","ɔ":"o","ꝋ":"o","ꝍ":"o","ɵ":"o","ƣ":"oi","ȣ":"ou","ꝏ":"oo","ⓟ":"p","ｐ":"p","ṕ":"p","ṗ":"p","ƥ":"p","ᵽ":"p","ꝑ":"p","ꝓ":"p","ꝕ":"p","ⓠ":"q","ｑ":"q","ɋ":"q","ꝗ":"q","ꝙ":"q","ⓡ":"r","ｒ":"r","ŕ":"r","ṙ":"r","ř":"r","ȑ":"r","ȓ":"r","ṛ":"r","ṝ":"r","ŗ":"r","ṟ":"r","ɍ":"r","ɽ":"r","ꝛ":"r","ꞧ":"r","ꞃ":"r","ⓢ":"s","ｓ":"s","ß":"s","ś":"s","ṥ":"s","ŝ":"s","ṡ":"s","š":"s","ṧ":"s","ṣ":"s","ṩ":"s","ș":"s","ş":"s","ȿ":"s","ꞩ":"s","ꞅ":"s","ẛ":"s","ⓣ":"t","ｔ":"t","ṫ":"t","ẗ":"t","ť":"t","ṭ":"t","ț":"t","ţ":"t","ṱ":"t","ṯ":"t","ŧ":"t","ƭ":"t","ʈ":"t","ⱦ":"t","ꞇ":"t","ꜩ":"tz","ⓤ":"u","ｕ":"u","ù":"u","ú":"u","û":"u","ũ":"u","ṹ":"u","ū":"u","ṻ":"u","ŭ":"u","ü":"u","ǜ":"u","ǘ":"u","ǖ":"u","ǚ":"u","ủ":"u","ů":"u","ű":"u","ǔ":"u","ȕ":"u","ȗ":"u","ư":"u","ừ":"u","ứ":"u","ữ":"u","ử":"u","ự":"u","ụ":"u","ṳ":"u","ų":"u","ṷ":"u","ṵ":"u","ʉ":"u","ⓥ":"v","ｖ":"v","ṽ":"v","ṿ":"v","ʋ":"v","ꝟ":"v","ʌ":"v","ꝡ":"vy","ⓦ":"w","ｗ":"w","ẁ":"w","ẃ":"w","ŵ":"w","ẇ":"w","ẅ":"w","ẘ":"w","ẉ":"w","ⱳ":"w","ⓧ":"x","ｘ":"x","ẋ":"x","ẍ":"x","ⓨ":"y","ｙ":"y","ỳ":"y","ý":"y","ŷ":"y","ỹ":"y","ȳ":"y","ẏ":"y","ÿ":"y","ỷ":"y","ẙ":"y","ỵ":"y","ƴ":"y","ɏ":"y","ỿ":"y","ⓩ":"z","ｚ":"z","ź":"z","ẑ":"z","ż":"z","ž":"z","ẓ":"z","ẕ":"z","ƶ":"z","ȥ":"z","ɀ":"z","ⱬ":"z","ꝣ":"z","Ά":"Α","Έ":"Ε","Ή":"Η","Ί":"Ι","Ϊ":"Ι","Ό":"Ο","Ύ":"Υ","Ϋ":"Υ","Ώ":"Ω","ά":"α","έ":"ε","ή":"η","ί":"ι","ϊ":"ι","ΐ":"ι","ό":"ο","ύ":"υ","ϋ":"υ","ΰ":"υ","ω":"ω","ς":"σ"}}),b.define("select2/data/base",["../utils"],function(a){function b(a,c){b.__super__.constructor.call(this)}return a.Extend(b,a.Observable),b.prototype.current=function(a){throw new Error("The `current` method must be defined in child classes.")},b.prototype.query=function(a,b){throw new Error("The `query` method must be defined in child classes.")},b.prototype.bind=function(a,b){},b.prototype.destroy=function(){},b.prototype.generateResultId=function(b,c){var d=b.id+"-result-";return d+=a.generateChars(4),null!=c.id?d+="-"+c.id.toString():d+="-"+a.generateChars(4),d},b}),b.define("select2/data/select",["./base","../utils","jquery"],function(a,b,c){function d(a,b){this.$element=a,this.options=b,d.__super__.constructor.call(this)}return b.Extend(d,a),d.prototype.current=function(a){var b=[],d=this;this.$element.find(":selected").each(function(){var a=c(this),e=d.item(a);b.push(e)}),a(b)},d.prototype.select=function(a){var b=this;if(a.selected=!0,c(a.element).is("option"))return a.element.selected=!0,void this.$element.trigger("change");if(this.$element.prop("multiple"))this.current(function(d){var e=[];a=[a],a.push.apply(a,d);for(var f=0;f<a.length;f++){var g=a[f].id;-1===c.inArray(g,e)&&e.push(g)}b.$element.val(e),b.$element.trigger("change")});else{var d=a.id;this.$element.val(d),this.$element.trigger("change")}},d.prototype.unselect=function(a){var b=this;if(this.$element.prop("multiple")){if(a.selected=!1,c(a.element).is("option"))return a.element.selected=!1,void this.$element.trigger("change");this.current(function(d){for(var e=[],f=0;f<d.length;f++){var g=d[f].id;g!==a.id&&-1===c.inArray(g,e)&&e.push(g)}b.$element.val(e),b.$element.trigger("change")})}},d.prototype.bind=function(a,b){var c=this;this.container=a,a.on("select",function(a){c.select(a.data)}),a.on("unselect",function(a){c.unselect(a.data)})},d.prototype.destroy=function(){this.$element.find("*").each(function(){c.removeData(this,"data")})},d.prototype.query=function(a,b){var d=[],e=this;this.$element.children().each(function(){var b=c(this);if(b.is("option")||b.is("optgroup")){var f=e.item(b),g=e.matches(a,f);null!==g&&d.push(g)}}),b({results:d})},d.prototype.addOptions=function(a){b.appendMany(this.$element,a)},d.prototype.option=function(a){var b;a.children?(b=document.createElement("optgroup"),b.label=a.text):(b=document.createElement("option"),void 0!==b.textContent?b.textContent=a.text:b.innerText=a.text),void 0!==a.id&&(b.value=a.id),a.disabled&&(b.disabled=!0),a.selected&&(b.selected=!0),a.title&&(b.title=a.title);var d=c(b),e=this._normalizeItem(a);return e.element=b,c.data(b,"data",e),d},d.prototype.item=function(a){var b={};if(null!=(b=c.data(a[0],"data")))return b;if(a.is("option"))b={id:a.val(),text:a.text(),disabled:a.prop("disabled"),selected:a.prop("selected"),title:a.prop("title")};else if(a.is("optgroup")){b={text:a.prop("label"),children:[],title:a.prop("title")};for(var d=a.children("option"),e=[],f=0;f<d.length;f++){var g=c(d[f]),h=this.item(g);e.push(h)}b.children=e}return b=this._normalizeItem(b),b.element=a[0],c.data(a[0],"data",b),b},d.prototype._normalizeItem=function(a){c.isPlainObject(a)||(a={id:a,text:a}),a=c.extend({},{text:""},a);var b={selected:!1,disabled:!1};return null!=a.id&&(a.id=a.id.toString()),null!=a.text&&(a.text=a.text.toString()),null==a._resultId&&a.id&&null!=this.container&&(a._resultId=this.generateResultId(this.container,a)),c.extend({},b,a)},d.prototype.matches=function(a,b){return this.options.get("matcher")(a,b)},d}),b.define("select2/data/array",["./select","../utils","jquery"],function(a,b,c){function d(a,b){var c=b.get("data")||[];d.__super__.constructor.call(this,a,b),this.addOptions(this.convertToOptions(c))}return b.Extend(d,a),d.prototype.select=function(a){var b=this.$element.find("option").filter(function(b,c){return c.value==a.id.toString()});0===b.length&&(b=this.option(a),this.addOptions(b)),d.__super__.select.call(this,a)},d.prototype.convertToOptions=function(a){function d(a){return function(){return c(this).val()==a.id}}for(var e=this,f=this.$element.find("option"),g=f.map(function(){return e.item(c(this)).id}).get(),h=[],i=0;i<a.length;i++){var j=this._normalizeItem(a[i]);if(c.inArray(j.id,g)>=0){var k=f.filter(d(j)),l=this.item(k),m=c.extend(!0,{},j,l),n=this.option(m);k.replaceWith(n)}else{var o=this.option(j);if(j.children){var p=this.convertToOptions(j.children);b.appendMany(o,p)}h.push(o)}}return h},d}),b.define("select2/data/ajax",["./array","../utils","jquery"],function(a,b,c){function d(a,b){this.ajaxOptions=this._applyDefaults(b.get("ajax")),null!=this.ajaxOptions.processResults&&(this.processResults=this.ajaxOptions.processResults),d.__super__.constructor.call(this,a,b)}return b.Extend(d,a),d.prototype._applyDefaults=function(a){var b={data:function(a){return c.extend({},a,{q:a.term})},transport:function(a,b,d){var e=c.ajax(a);return e.then(b),e.fail(d),e}};return c.extend({},b,a,!0)},d.prototype.processResults=function(a){return a},d.prototype.query=function(a,b){function d(){var d=f.transport(f,function(d){var f=e.processResults(d,a);e.options.get("debug")&&window.console&&console.error&&(f&&f.results&&c.isArray(f.results)||console.error("Select2: The AJAX results did not return an array in the `results` key of the response.")),b(f)},function(){d.status&&"0"===d.status||e.trigger("results:message",{message:"errorLoading"})});e._request=d}var e=this;null!=this._request&&(c.isFunction(this._request.abort)&&this._request.abort(),this._request=null);var f=c.extend({type:"GET"},this.ajaxOptions);"function"==typeof f.url&&(f.url=f.url.call(this.$element,a)),"function"==typeof f.data&&(f.data=f.data.call(this.$element,a)),this.ajaxOptions.delay&&null!=a.term?(this._queryTimeout&&window.clearTimeout(this._queryTimeout),this._queryTimeout=window.setTimeout(d,this.ajaxOptions.delay)):d()},d}),b.define("select2/data/tags",["jquery"],function(a){function b(b,c,d){var e=d.get("tags"),f=d.get("createTag");void 0!==f&&(this.createTag=f);var g=d.get("insertTag");if(void 0!==g&&(this.insertTag=g),b.call(this,c,d),a.isArray(e))for(var h=0;h<e.length;h++){var i=e[h],j=this._normalizeItem(i),k=this.option(j);this.$element.append(k)}}return b.prototype.query=function(a,b,c){function d(a,f){for(var g=a.results,h=0;h<g.length;h++){var i=g[h],j=null!=i.children&&!d({results:i.children},!0);if((i.text||"").toUpperCase()===(b.term||"").toUpperCase()||j)return!f&&(a.data=g,void c(a))}if(f)return!0;var k=e.createTag(b);if(null!=k){var l=e.option(k);l.attr("data-select2-tag",!0),e.addOptions([l]),e.insertTag(g,k)}a.results=g,c(a)}var e=this;if(this._removeOldTags(),null==b.term||null!=b.page)return void a.call(this,b,c);a.call(this,b,d)},b.prototype.createTag=function(b,c){var d=a.trim(c.term);return""===d?null:{id:d,text:d}},b.prototype.insertTag=function(a,b,c){b.unshift(c)},b.prototype._removeOldTags=function(b){this._lastTag;this.$element.find("option[data-select2-tag]").each(function(){this.selected||a(this).remove()})},b}),b.define("select2/data/tokenizer",["jquery"],function(a){function b(a,b,c){var d=c.get("tokenizer");void 0!==d&&(this.tokenizer=d),a.call(this,b,c)}return b.prototype.bind=function(a,b,c){a.call(this,b,c),this.$search=b.dropdown.$search||b.selection.$search||c.find(".select2-search__field")},b.prototype.query=function(b,c,d){function e(b){var c=g._normalizeItem(b);if(!g.$element.find("option").filter(function(){return a(this).val()===c.id}).length){var d=g.option(c);d.attr("data-select2-tag",!0),g._removeOldTags(),g.addOptions([d])}f(c)}function f(a){g.trigger("select",{data:a})}var g=this;c.term=c.term||"";var h=this.tokenizer(c,this.options,e);h.term!==c.term&&(this.$search.length&&(this.$search.val(h.term),this.$search.focus()),c.term=h.term),b.call(this,c,d)},b.prototype.tokenizer=function(b,c,d,e){for(var f=d.get("tokenSeparators")||[],g=c.term,h=0,i=this.createTag||function(a){return{id:a.term,text:a.term}};h<g.length;){var j=g[h];if(-1!==a.inArray(j,f)){var k=g.substr(0,h),l=a.extend({},c,{term:k}),m=i(l);null!=m?(e(m),g=g.substr(h+1)||"",h=0):h++}else h++}return{term:g}},b}),b.define("select2/data/minimumInputLength",[],function(){function a(a,b,c){this.minimumInputLength=c.get("minimumInputLength"),a.call(this,b,c)}return a.prototype.query=function(a,b,c){if(b.term=b.term||"",b.term.length<this.minimumInputLength)return void this.trigger("results:message",{message:"inputTooShort",args:{minimum:this.minimumInputLength,input:b.term,params:b}});a.call(this,b,c)},a}),b.define("select2/data/maximumInputLength",[],function(){function a(a,b,c){this.maximumInputLength=c.get("maximumInputLength"),a.call(this,b,c)}return a.prototype.query=function(a,b,c){if(b.term=b.term||"",this.maximumInputLength>0&&b.term.length>this.maximumInputLength)return void this.trigger("results:message",{message:"inputTooLong",args:{maximum:this.maximumInputLength,input:b.term,params:b}});a.call(this,b,c)},a}),b.define("select2/data/maximumSelectionLength",[],function(){function a(a,b,c){this.maximumSelectionLength=c.get("maximumSelectionLength"),a.call(this,b,c)}return a.prototype.query=function(a,b,c){var d=this;this.current(function(e){var f=null!=e?e.length:0;if(d.maximumSelectionLength>0&&f>=d.maximumSelectionLength)return void d.trigger("results:message",{message:"maximumSelected",args:{maximum:d.maximumSelectionLength}});a.call(d,b,c)})},a}),b.define("select2/dropdown",["jquery","./utils"],function(a,b){function c(a,b){this.$element=a,this.options=b,c.__super__.constructor.call(this)}return b.Extend(c,b.Observable),c.prototype.render=function(){var b=a('<span class="select2-dropdown"><span class="select2-results"></span></span>');return b.attr("dir",this.options.get("dir")),this.$dropdown=b,b},c.prototype.bind=function(){},c.prototype.position=function(a,b){},c.prototype.destroy=function(){this.$dropdown.remove()},c}),b.define("select2/dropdown/search",["jquery","../utils"],function(a,b){function c(){}return c.prototype.render=function(b){var c=b.call(this),d=a('<span class="select2-search select2-search--dropdown"><input class="select2-search__field" type="search" tabindex="-1" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" role="textbox" /></span>');return this.$searchContainer=d,this.$search=d.find("input"),c.prepend(d),c},c.prototype.bind=function(b,c,d){var e=this;b.call(this,c,d),this.$search.on("keydown",function(a){e.trigger("keypress",a),e._keyUpPrevented=a.isDefaultPrevented()}),this.$search.on("input",function(b){a(this).off("keyup")}),this.$search.on("keyup input",function(a){e.handleSearch(a)}),c.on("open",function(){e.$search.attr("tabindex",0),e.$search.focus(),window.setTimeout(function(){e.$search.focus()},0)}),c.on("close",function(){e.$search.attr("tabindex",-1),e.$search.val("")}),c.on("focus",function(){c.isOpen()||e.$search.focus()}),c.on("results:all",function(a){if(null==a.query.term||""===a.query.term){e.showSearch(a)?e.$searchContainer.removeClass("select2-search--hide"):e.$searchContainer.addClass("select2-search--hide")}})},c.prototype.handleSearch=function(a){if(!this._keyUpPrevented){var b=this.$search.val();this.trigger("query",{term:b})}this._keyUpPrevented=!1},c.prototype.showSearch=function(a,b){return!0},c}),b.define("select2/dropdown/hidePlaceholder",[],function(){function a(a,b,c,d){this.placeholder=this.normalizePlaceholder(c.get("placeholder")),a.call(this,b,c,d)}return a.prototype.append=function(a,b){b.results=this.removePlaceholder(b.results),a.call(this,b)},a.prototype.normalizePlaceholder=function(a,b){return"string"==typeof b&&(b={id:"",text:b}),b},a.prototype.removePlaceholder=function(a,b){for(var c=b.slice(0),d=b.length-1;d>=0;d--){var e=b[d];this.placeholder.id===e.id&&c.splice(d,1)}return c},a}),b.define("select2/dropdown/infiniteScroll",["jquery"],function(a){function b(a,b,c,d){this.lastParams={},a.call(this,b,c,d),this.$loadingMore=this.createLoadingMore(),this.loading=!1}return b.prototype.append=function(a,b){this.$loadingMore.remove(),this.loading=!1,a.call(this,b),this.showLoadingMore(b)&&this.$results.append(this.$loadingMore)},b.prototype.bind=function(b,c,d){var e=this;b.call(this,c,d),c.on("query",function(a){e.lastParams=a,e.loading=!0}),c.on("query:append",function(a){e.lastParams=a,e.loading=!0}),this.$results.on("scroll",function(){var b=a.contains(document.documentElement,e.$loadingMore[0]);if(!e.loading&&b){e.$results.offset().top+e.$results.outerHeight(!1)+50>=e.$loadingMore.offset().top+e.$loadingMore.outerHeight(!1)&&e.loadMore()}})},b.prototype.loadMore=function(){this.loading=!0;var b=a.extend({},{page:1},this.lastParams);b.page++,this.trigger("query:append",b)},b.prototype.showLoadingMore=function(a,b){return b.pagination&&b.pagination.more},b.prototype.createLoadingMore=function(){var b=a('<li class="select2-results__option select2-results__option--load-more"role="treeitem" aria-disabled="true"></li>'),c=this.options.get("translations").get("loadingMore");return b.html(c(this.lastParams)),b},b}),b.define("select2/dropdown/attachBody",["jquery","../utils"],function(a,b){function c(b,c,d){this.$dropdownParent=d.get("dropdownParent")||a(document.body),b.call(this,c,d)}return c.prototype.bind=function(a,b,c){var d=this,e=!1;a.call(this,b,c),b.on("open",function(){d._showDropdown(),d._attachPositioningHandler(b),e||(e=!0,b.on("results:all",function(){d._positionDropdown(),d._resizeDropdown()}),b.on("results:append",function(){d._positionDropdown(),d._resizeDropdown()}))}),b.on("close",function(){d._hideDropdown(),d._detachPositioningHandler(b)}),this.$dropdownContainer.on("mousedown",function(a){a.stopPropagation()})},c.prototype.destroy=function(a){a.call(this),this.$dropdownContainer.remove()},c.prototype.position=function(a,b,c){b.attr("class",c.attr("class")),b.removeClass("select2"),b.addClass("select2-container--open"),b.css({position:"absolute",top:-999999}),this.$container=c},c.prototype.render=function(b){var c=a("<span></span>"),d=b.call(this);return c.append(d),this.$dropdownContainer=c,c},c.prototype._hideDropdown=function(a){this.$dropdownContainer.detach()},c.prototype._attachPositioningHandler=function(c,d){var e=this,f="scroll.select2."+d.id,g="resize.select2."+d.id,h="orientationchange.select2."+d.id,i=this.$container.parents().filter(b.hasScroll);i.each(function(){a(this).data("select2-scroll-position",{x:a(this).scrollLeft(),y:a(this).scrollTop()})}),i.on(f,function(b){var c=a(this).data("select2-scroll-position");a(this).scrollTop(c.y)}),a(window).on(f+" "+g+" "+h,function(a){e._positionDropdown(),e._resizeDropdown()})},c.prototype._detachPositioningHandler=function(c,d){var e="scroll.select2."+d.id,f="resize.select2."+d.id,g="orientationchange.select2."+d.id;this.$container.parents().filter(b.hasScroll).off(e),a(window).off(e+" "+f+" "+g)},c.prototype._positionDropdown=function(){var b=a(window),c=this.$dropdown.hasClass("select2-dropdown--above"),d=this.$dropdown.hasClass("select2-dropdown--below"),e=null,f=this.$container.offset();f.bottom=f.top+this.$container.outerHeight(!1);var g={height:this.$container.outerHeight(!1)};g.top=f.top,g.bottom=f.top+g.height;var h={height:this.$dropdown.outerHeight(!1)},i={top:b.scrollTop(),bottom:b.scrollTop()+b.height()},j=i.top<f.top-h.height,k=i.bottom>f.bottom+h.height,l={left:f.left,top:g.bottom},m=this.$dropdownParent;"static"===m.css("position")&&(m=m.offsetParent());var n=m.offset();l.top-=n.top,l.left-=n.left,c||d||(e="below"),k||!j||c?!j&&k&&c&&(e="below"):e="above",("above"==e||c&&"below"!==e)&&(l.top=g.top-n.top-h.height),null!=e&&(this.$dropdown.removeClass("select2-dropdown--below select2-dropdown--above").addClass("select2-dropdown--"+e),this.$container.removeClass("select2-container--below select2-container--above").addClass("select2-container--"+e)),this.$dropdownContainer.css(l)},c.prototype._resizeDropdown=function(){var a={width:this.$container.outerWidth(!1)+"px"};this.options.get("dropdownAutoWidth")&&(a.minWidth=a.width,a.position="relative",a.width="auto"),this.$dropdown.css(a)},c.prototype._showDropdown=function(a){this.$dropdownContainer.appendTo(this.$dropdownParent),this._positionDropdown(),this._resizeDropdown()},c}),b.define("select2/dropdown/minimumResultsForSearch",[],function(){function a(b){for(var c=0,d=0;d<b.length;d++){var e=b[d];e.children?c+=a(e.children):c++}return c}function b(a,b,c,d){this.minimumResultsForSearch=c.get("minimumResultsForSearch"),this.minimumResultsForSearch<0&&(this.minimumResultsForSearch=1/0),a.call(this,b,c,d)}return b.prototype.showSearch=function(b,c){return!(a(c.data.results)<this.minimumResultsForSearch)&&b.call(this,c)},b}),b.define("select2/dropdown/selectOnClose",[],function(){function a(){}return a.prototype.bind=function(a,b,c){var d=this;a.call(this,b,c),b.on("close",function(a){d._handleSelectOnClose(a)})},a.prototype._handleSelectOnClose=function(a,b){if(b&&null!=b.originalSelect2Event){var c=b.originalSelect2Event;if("select"===c._type||"unselect"===c._type)return}var d=this.getHighlightedResults();if(!(d.length<1)){var e=d.data("data");null!=e.element&&e.element.selected||null==e.element&&e.selected||this.trigger("select",{data:e})}},a}),b.define("select2/dropdown/closeOnSelect",[],function(){function a(){}return a.prototype.bind=function(a,b,c){var d=this;a.call(this,b,c),b.on("select",function(a){d._selectTriggered(a)}),b.on("unselect",function(a){d._selectTriggered(a)})},a.prototype._selectTriggered=function(a,b){var c=b.originalEvent;c&&c.ctrlKey||this.trigger("close",{originalEvent:c,originalSelect2Event:b})},a}),b.define("select2/i18n/en",[],function(){return{errorLoading:function(){return"The results could not be loaded."},inputTooLong:function(a){var b=a.input.length-a.maximum,c="Please delete "+b+" character";return 1!=b&&(c+="s"),c},inputTooShort:function(a){return"Please enter "+(a.minimum-a.input.length)+" or more characters"},loadingMore:function(){return"Loading more results…"},maximumSelected:function(a){var b="You can only select "+a.maximum+" item";return 1!=a.maximum&&(b+="s"),b},noResults:function(){return"No results found"},searching:function(){return"Searching…"}}}),b.define("select2/defaults",["jquery","require","./results","./selection/single","./selection/multiple","./selection/placeholder","./selection/allowClear","./selection/search","./selection/eventRelay","./utils","./translation","./diacritics","./data/select","./data/array","./data/ajax","./data/tags","./data/tokenizer","./data/minimumInputLength","./data/maximumInputLength","./data/maximumSelectionLength","./dropdown","./dropdown/search","./dropdown/hidePlaceholder","./dropdown/infiniteScroll","./dropdown/attachBody","./dropdown/minimumResultsForSearch","./dropdown/selectOnClose","./dropdown/closeOnSelect","./i18n/en"],function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C){function D(){this.reset()}return D.prototype.apply=function(l){if(l=a.extend(!0,{},this.defaults,l),null==l.dataAdapter){if(null!=l.ajax?l.dataAdapter=o:null!=l.data?l.dataAdapter=n:l.dataAdapter=m,l.minimumInputLength>0&&(l.dataAdapter=j.Decorate(l.dataAdapter,r)),l.maximumInputLength>0&&(l.dataAdapter=j.Decorate(l.dataAdapter,s)),l.maximumSelectionLength>0&&(l.dataAdapter=j.Decorate(l.dataAdapter,t)),l.tags&&(l.dataAdapter=j.Decorate(l.dataAdapter,p)),null==l.tokenSeparators&&null==l.tokenizer||(l.dataAdapter=j.Decorate(l.dataAdapter,q)),null!=l.query){var C=b(l.amdBase+"compat/query");l.dataAdapter=j.Decorate(l.dataAdapter,C)}if(null!=l.initSelection){var D=b(l.amdBase+"compat/initSelection");l.dataAdapter=j.Decorate(l.dataAdapter,D)}}if(null==l.resultsAdapter&&(l.resultsAdapter=c,null!=l.ajax&&(l.resultsAdapter=j.Decorate(l.resultsAdapter,x)),null!=l.placeholder&&(l.resultsAdapter=j.Decorate(l.resultsAdapter,w)),l.selectOnClose&&(l.resultsAdapter=j.Decorate(l.resultsAdapter,A))),null==l.dropdownAdapter){if(l.multiple)l.dropdownAdapter=u;else{var E=j.Decorate(u,v);l.dropdownAdapter=E}if(0!==l.minimumResultsForSearch&&(l.dropdownAdapter=j.Decorate(l.dropdownAdapter,z)),l.closeOnSelect&&(l.dropdownAdapter=j.Decorate(l.dropdownAdapter,B)),null!=l.dropdownCssClass||null!=l.dropdownCss||null!=l.adaptDropdownCssClass){var F=b(l.amdBase+"compat/dropdownCss");l.dropdownAdapter=j.Decorate(l.dropdownAdapter,F)}l.dropdownAdapter=j.Decorate(l.dropdownAdapter,y)}if(null==l.selectionAdapter){if(l.multiple?l.selectionAdapter=e:l.selectionAdapter=d,null!=l.placeholder&&(l.selectionAdapter=j.Decorate(l.selectionAdapter,f)),l.allowClear&&(l.selectionAdapter=j.Decorate(l.selectionAdapter,g)),l.multiple&&(l.selectionAdapter=j.Decorate(l.selectionAdapter,h)),null!=l.containerCssClass||null!=l.containerCss||null!=l.adaptContainerCssClass){var G=b(l.amdBase+"compat/containerCss");l.selectionAdapter=j.Decorate(l.selectionAdapter,G)}l.selectionAdapter=j.Decorate(l.selectionAdapter,i)}if("string"==typeof l.language)if(l.language.indexOf("-")>0){var H=l.language.split("-"),I=H[0];l.language=[l.language,I]}else l.language=[l.language];if(a.isArray(l.language)){var J=new k;l.language.push("en");for(var K=l.language,L=0;L<K.length;L++){var M=K[L],N={};try{N=k.loadPath(M)}catch(a){try{M=this.defaults.amdLanguageBase+M,N=k.loadPath(M)}catch(a){l.debug&&window.console&&console.warn&&console.warn('Select2: The language file for "'+M+'" could not be automatically loaded. A fallback will be used instead.');continue}}J.extend(N)}l.translations=J}else{var O=k.loadPath(this.defaults.amdLanguageBase+"en"),P=new k(l.language);P.extend(O),l.translations=P}return l},D.prototype.reset=function(){function b(a){function b(a){return l[a]||a}return a.replace(/[^\u0000-\u007E]/g,b)}function c(d,e){if(""===a.trim(d.term))return e;if(e.children&&e.children.length>0){for(var f=a.extend(!0,{},e),g=e.children.length-1;g>=0;g--){null==c(d,e.children[g])&&f.children.splice(g,1)}return f.children.length>0?f:c(d,f)}var h=b(e.text).toUpperCase(),i=b(d.term).toUpperCase();return h.indexOf(i)>-1?e:null}this.defaults={amdBase:"./",amdLanguageBase:"./i18n/",closeOnSelect:!0,debug:!1,dropdownAutoWidth:!1,escapeMarkup:j.escapeMarkup,language:C,matcher:c,minimumInputLength:0,maximumInputLength:0,maximumSelectionLength:0,minimumResultsForSearch:0,selectOnClose:!1,sorter:function(a){return a},templateResult:function(a){return a.text},templateSelection:function(a){return a.text},theme:"default",width:"resolve"}},D.prototype.set=function(b,c){var d=a.camelCase(b),e={};e[d]=c;var f=j._convertData(e);a.extend(this.defaults,f)},new D}),b.define("select2/options",["require","jquery","./defaults","./utils"],function(a,b,c,d){function e(b,e){if(this.options=b,null!=e&&this.fromElement(e),this.options=c.apply(this.options),e&&e.is("input")){var f=a(this.get("amdBase")+"compat/inputData");this.options.dataAdapter=d.Decorate(this.options.dataAdapter,f)}}return e.prototype.fromElement=function(a){var c=["select2"];null==this.options.multiple&&(this.options.multiple=a.prop("multiple")),null==this.options.disabled&&(this.options.disabled=a.prop("disabled")),null==this.options.language&&(a.prop("lang")?this.options.language=a.prop("lang").toLowerCase():a.closest("[lang]").prop("lang")&&(this.options.language=a.closest("[lang]").prop("lang"))),null==this.options.dir&&(a.prop("dir")?this.options.dir=a.prop("dir"):a.closest("[dir]").prop("dir")?this.options.dir=a.closest("[dir]").prop("dir"):this.options.dir="ltr"),a.prop("disabled",this.options.disabled),a.prop("multiple",this.options.multiple),a.data("select2Tags")&&(this.options.debug&&window.console&&console.warn&&console.warn('Select2: The `data-select2-tags` attribute has been changed to use the `data-data` and `data-tags="true"` attributes and will be removed in future versions of Select2.'),a.data("data",a.data("select2Tags")),a.data("tags",!0)),a.data("ajaxUrl")&&(this.options.debug&&window.console&&console.warn&&console.warn("Select2: The `data-ajax-url` attribute has been changed to `data-ajax--url` and support for the old attribute will be removed in future versions of Select2."),a.attr("ajax--url",a.data("ajaxUrl")),a.data("ajax--url",a.data("ajaxUrl")));var e={};e=b.fn.jquery&&"1."==b.fn.jquery.substr(0,2)&&a[0].dataset?b.extend(!0,{},a[0].dataset,a.data()):a.data();var f=b.extend(!0,{},e);f=d._convertData(f);for(var g in f)b.inArray(g,c)>-1||(b.isPlainObject(this.options[g])?b.extend(this.options[g],f[g]):this.options[g]=f[g]);return this},e.prototype.get=function(a){return this.options[a]},e.prototype.set=function(a,b){this.options[a]=b},e}),b.define("select2/core",["jquery","./options","./utils","./keys"],function(a,b,c,d){var e=function(a,c){null!=a.data("select2")&&a.data("select2").destroy(),this.$element=a,this.id=this._generateId(a),c=c||{},this.options=new b(c,a),e.__super__.constructor.call(this);var d=a.attr("tabindex")||0;a.data("old-tabindex",d),a.attr("tabindex","-1");var f=this.options.get("dataAdapter");this.dataAdapter=new f(a,this.options);var g=this.render();this._placeContainer(g);var h=this.options.get("selectionAdapter");this.selection=new h(a,this.options),this.$selection=this.selection.render(),this.selection.position(this.$selection,g);var i=this.options.get("dropdownAdapter");this.dropdown=new i(a,this.options),this.$dropdown=this.dropdown.render(),this.dropdown.position(this.$dropdown,g);var j=this.options.get("resultsAdapter");this.results=new j(a,this.options,this.dataAdapter),this.$results=this.results.render(),this.results.position(this.$results,this.$dropdown);var k=this;this._bindAdapters(),this._registerDomEvents(),this._registerDataEvents(),this._registerSelectionEvents(),this._registerDropdownEvents(),this._registerResultsEvents(),this._registerEvents(),this.dataAdapter.current(function(a){k.trigger("selection:update",{data:a})}),a.addClass("select2-hidden-accessible"),a.attr("aria-hidden","true"),this._syncAttributes(),a.data("select2",this)};return c.Extend(e,c.Observable),e.prototype._generateId=function(a){var b="";return b=null!=a.attr("id")?a.attr("id"):null!=a.attr("name")?a.attr("name")+"-"+c.generateChars(2):c.generateChars(4),b=b.replace(/(:|\.|\[|\]|,)/g,""),b="select2-"+b},e.prototype._placeContainer=function(a){a.insertAfter(this.$element);var b=this._resolveWidth(this.$element,this.options.get("width"));null!=b&&a.css("width",b)},e.prototype._resolveWidth=function(a,b){var c=/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;if("resolve"==b){var d=this._resolveWidth(a,"style");return null!=d?d:this._resolveWidth(a,"element")}if("element"==b){var e=a.outerWidth(!1);return e<=0?"auto":e+"px"}if("style"==b){var f=a.attr("style");if("string"!=typeof f)return null;for(var g=f.split(";"),h=0,i=g.length;h<i;h+=1){var j=g[h].replace(/\s/g,""),k=j.match(c);if(null!==k&&k.length>=1)return k[1]}return null}return b},e.prototype._bindAdapters=function(){this.dataAdapter.bind(this,this.$container),this.selection.bind(this,this.$container),this.dropdown.bind(this,this.$container),this.results.bind(this,this.$container)},e.prototype._registerDomEvents=function(){var b=this;this.$element.on("change.select2",function(){b.dataAdapter.current(function(a){b.trigger("selection:update",{data:a})})}),this.$element.on("focus.select2",function(a){b.trigger("focus",a)}),this._syncA=c.bind(this._syncAttributes,this),this._syncS=c.bind(this._syncSubtree,this),this.$element[0].attachEvent&&this.$element[0].attachEvent("onpropertychange",this._syncA);var d=window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver;null!=d?(this._observer=new d(function(c){a.each(c,b._syncA),a.each(c,b._syncS)}),this._observer.observe(this.$element[0],{attributes:!0,childList:!0,subtree:!1})):this.$element[0].addEventListener&&(this.$element[0].addEventListener("DOMAttrModified",b._syncA,!1),this.$element[0].addEventListener("DOMNodeInserted",b._syncS,!1),this.$element[0].addEventListener("DOMNodeRemoved",b._syncS,!1))},e.prototype._registerDataEvents=function(){var a=this;this.dataAdapter.on("*",function(b,c){a.trigger(b,c)})},e.prototype._registerSelectionEvents=function(){var b=this,c=["toggle","focus"];this.selection.on("toggle",function(){b.toggleDropdown()}),this.selection.on("focus",function(a){b.focus(a)}),this.selection.on("*",function(d,e){-1===a.inArray(d,c)&&b.trigger(d,e)})},e.prototype._registerDropdownEvents=function(){var a=this;this.dropdown.on("*",function(b,c){a.trigger(b,c)})},e.prototype._registerResultsEvents=function(){var a=this;this.results.on("*",function(b,c){a.trigger(b,c)})},e.prototype._registerEvents=function(){var a=this;this.on("open",function(){a.$container.addClass("select2-container--open")}),this.on("close",function(){a.$container.removeClass("select2-container--open")}),this.on("enable",function(){a.$container.removeClass("select2-container--disabled")}),this.on("disable",function(){a.$container.addClass("select2-container--disabled")}),this.on("blur",function(){a.$container.removeClass("select2-container--focus")}),this.on("query",function(b){a.isOpen()||a.trigger("open",{}),this.dataAdapter.query(b,function(c){a.trigger("results:all",{data:c,query:b})})}),this.on("query:append",function(b){this.dataAdapter.query(b,function(c){a.trigger("results:append",{data:c,query:b})})}),this.on("keypress",function(b){var c=b.which;a.isOpen()?c===d.ESC||c===d.TAB||c===d.UP&&b.altKey?(a.close(),b.preventDefault()):c===d.ENTER?(a.trigger("results:select",{}),b.preventDefault()):c===d.SPACE&&b.ctrlKey?(a.trigger("results:toggle",{}),b.preventDefault()):c===d.UP?(a.trigger("results:previous",{}),b.preventDefault()):c===d.DOWN&&(a.trigger("results:next",{}),b.preventDefault()):(c===d.ENTER||c===d.SPACE||c===d.DOWN&&b.altKey)&&(a.open(),b.preventDefault())})},e.prototype._syncAttributes=function(){this.options.set("disabled",this.$element.prop("disabled")),this.options.get("disabled")?(this.isOpen()&&this.close(),this.trigger("disable",{})):this.trigger("enable",{})},e.prototype._syncSubtree=function(a,b){var c=!1,d=this;if(!a||!a.target||"OPTION"===a.target.nodeName||"OPTGROUP"===a.target.nodeName){if(b)if(b.addedNodes&&b.addedNodes.length>0)for(var e=0;e<b.addedNodes.length;e++){var f=b.addedNodes[e];f.selected&&(c=!0)}else b.removedNodes&&b.removedNodes.length>0&&(c=!0);else c=!0;c&&this.dataAdapter.current(function(a){d.trigger("selection:update",{data:a})})}},e.prototype.trigger=function(a,b){var c=e.__super__.trigger,d={open:"opening",close:"closing",select:"selecting",unselect:"unselecting"};if(void 0===b&&(b={}),a in d){var f=d[a],g={prevented:!1,name:a,args:b};if(c.call(this,f,g),g.prevented)return void(b.prevented=!0)}c.call(this,a,b)},e.prototype.toggleDropdown=function(){this.options.get("disabled")||(this.isOpen()?this.close():this.open())},e.prototype.open=function(){this.isOpen()||this.trigger("query",{})},e.prototype.close=function(){this.isOpen()&&this.trigger("close",{})},e.prototype.isOpen=function(){return this.$container.hasClass("select2-container--open")},e.prototype.hasFocus=function(){return this.$container.hasClass("select2-container--focus")},e.prototype.focus=function(a){this.hasFocus()||(this.$container.addClass("select2-container--focus"),this.trigger("focus",{}))},e.prototype.enable=function(a){this.options.get("debug")&&window.console&&console.warn&&console.warn('Select2: The `select2("enable")` method has been deprecated and will be removed in later Select2 versions. Use $element.prop("disabled") instead.'),null!=a&&0!==a.length||(a=[!0]);var b=!a[0];this.$element.prop("disabled",b)},e.prototype.data=function(){this.options.get("debug")&&arguments.length>0&&window.console&&console.warn&&console.warn('Select2: Data can no longer be set using `select2("data")`. You should consider setting the value instead using `$element.val()`.');var a=[];return this.dataAdapter.current(function(b){a=b}),a},e.prototype.val=function(b){if(this.options.get("debug")&&window.console&&console.warn&&console.warn('Select2: The `select2("val")` method has been deprecated and will be removed in later Select2 versions. Use $element.val() instead.'),null==b||0===b.length)return this.$element.val();var c=b[0];a.isArray(c)&&(c=a.map(c,function(a){return a.toString()})),this.$element.val(c).trigger("change")},e.prototype.destroy=function(){this.$container.remove(),this.$element[0].detachEvent&&this.$element[0].detachEvent("onpropertychange",this._syncA),null!=this._observer?(this._observer.disconnect(),this._observer=null):this.$element[0].removeEventListener&&(this.$element[0].removeEventListener("DOMAttrModified",this._syncA,!1),this.$element[0].removeEventListener("DOMNodeInserted",this._syncS,!1),this.$element[0].removeEventListener("DOMNodeRemoved",this._syncS,!1)),this._syncA=null,this._syncS=null,this.$element.off(".select2"),this.$element.attr("tabindex",this.$element.data("old-tabindex")),this.$element.removeClass("select2-hidden-accessible"),this.$element.attr("aria-hidden","false"),this.$element.removeData("select2"),this.dataAdapter.destroy(),this.selection.destroy(),this.dropdown.destroy(),this.results.destroy(),this.dataAdapter=null,this.selection=null,this.dropdown=null,this.results=null},e.prototype.render=function(){var b=a('<span class="select2 select2-container"><span class="selection"></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>');return b.attr("dir",this.options.get("dir")),this.$container=b,this.$container.addClass("select2-container--"+this.options.get("theme")),b.data("element",this.$element),b},e}),b.define("jquery-mousewheel",["jquery"],function(a){return a}),b.define("jquery.select2",["jquery","jquery-mousewheel","./select2/core","./select2/defaults"],function(a,b,c,d){if(null==a.fn.select2){var e=["open","close","destroy"];a.fn.select2=function(b){if("object"==typeof(b=b||{}))return this.each(function(){var d=a.extend(!0,{},b);new c(a(this),d)}),this;if("string"==typeof b){var d,f=Array.prototype.slice.call(arguments,1);return this.each(function(){var c=a(this).data("select2");null==c&&window.console&&console.error&&console.error("The select2('"+b+"') method was called on an element that is not using Select2."),d=c[b].apply(c,f)}),a.inArray(b,e)>-1?this:d}throw new Error("Invalid arguments for Select2: "+b)}}return null==a.fn.select2.defaults&&(a.fn.select2.defaults=d),c}),{define:b.define,require:b.require}}(),c=b.require("jquery.select2");return a.fn.select2.amd=b,c});
/*!
 * Bootstrap Colorpicker v2.3.3
 * http://mjolnic.github.io/bootstrap-colorpicker/
 */
!function(a){"use strict";"object"==typeof exports?module.exports=a(window.jQuery):"function"==typeof define&&define.amd?define(["jquery"],a):window.jQuery&&!window.jQuery.fn.colorpicker&&a(window.jQuery)}(function(a){"use strict";var b=function(b,c){this.value={h:0,s:0,b:0,a:1},this.origFormat=null,c&&a.extend(this.colors,c),b&&(void 0!==b.toLowerCase?(b+="",this.setColor(b)):void 0!==b.h&&(this.value=b))};b.prototype={constructor:b,colors:{aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",green:"#008000",greenyellow:"#adff2f",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgrey:"#d3d3d3",lightgreen:"#90ee90",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370d8",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#d87093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32",transparent:"transparent"},_sanitizeNumber:function(a){return"number"==typeof a?a:isNaN(a)||null===a||""===a||void 0===a?1:""===a?0:void 0!==a.toLowerCase?(a.match(/^\./)&&(a="0"+a),Math.ceil(100*parseFloat(a))/100):1},isTransparent:function(a){return a?(a=a.toLowerCase().trim(),"transparent"===a||a.match(/#?00000000/)||a.match(/(rgba|hsla)\(0,0,0,0?\.?0\)/)):!1},rgbaIsTransparent:function(a){return 0===a.r&&0===a.g&&0===a.b&&0===a.a},setColor:function(a){a=a.toLowerCase().trim(),a&&(this.isTransparent(a)?this.value={h:0,s:0,b:0,a:0}:this.value=this.stringToHSB(a)||{h:0,s:0,b:0,a:1})},stringToHSB:function(b){b=b.toLowerCase();var c;"undefined"!=typeof this.colors[b]&&(b=this.colors[b],c="alias");var d=this,e=!1;return a.each(this.stringParsers,function(a,f){var g=f.re.exec(b),h=g&&f.parse.apply(d,[g]),i=c||f.format||"rgba";return h?(e=i.match(/hsla?/)?d.RGBtoHSB.apply(d,d.HSLtoRGB.apply(d,h)):d.RGBtoHSB.apply(d,h),d.origFormat=i,!1):!0}),e},setHue:function(a){this.value.h=1-a},setSaturation:function(a){this.value.s=a},setBrightness:function(a){this.value.b=1-a},setAlpha:function(a){this.value.a=Math.round(parseInt(100*(1-a),10)/100*100)/100},toRGB:function(a,b,c,d){a||(a=this.value.h,b=this.value.s,c=this.value.b),a*=360;var e,f,g,h,i;return a=a%360/60,i=c*b,h=i*(1-Math.abs(a%2-1)),e=f=g=c-i,a=~~a,e+=[i,h,0,0,h,i][a],f+=[h,i,i,h,0,0][a],g+=[0,0,h,i,i,h][a],{r:Math.round(255*e),g:Math.round(255*f),b:Math.round(255*g),a:d||this.value.a}},toHex:function(a,b,c,d){var e=this.toRGB(a,b,c,d);return this.rgbaIsTransparent(e)?"transparent":"#"+(1<<24|parseInt(e.r)<<16|parseInt(e.g)<<8|parseInt(e.b)).toString(16).substr(1)},toHSL:function(a,b,c,d){a=a||this.value.h,b=b||this.value.s,c=c||this.value.b,d=d||this.value.a;var e=a,f=(2-b)*c,g=b*c;return g/=f>0&&1>=f?f:2-f,f/=2,g>1&&(g=1),{h:isNaN(e)?0:e,s:isNaN(g)?0:g,l:isNaN(f)?0:f,a:isNaN(d)?0:d}},toAlias:function(a,b,c,d){var e=this.toHex(a,b,c,d);for(var f in this.colors)if(this.colors[f]===e)return f;return!1},RGBtoHSB:function(a,b,c,d){a/=255,b/=255,c/=255;var e,f,g,h;return g=Math.max(a,b,c),h=g-Math.min(a,b,c),e=0===h?null:g===a?(b-c)/h:g===b?(c-a)/h+2:(a-b)/h+4,e=(e+360)%6*60/360,f=0===h?0:h/g,{h:this._sanitizeNumber(e),s:f,b:g,a:this._sanitizeNumber(d)}},HueToRGB:function(a,b,c){return 0>c?c+=1:c>1&&(c-=1),1>6*c?a+(b-a)*c*6:1>2*c?b:2>3*c?a+(b-a)*(2/3-c)*6:a},HSLtoRGB:function(a,b,c,d){0>b&&(b=0);var e;e=.5>=c?c*(1+b):c+b-c*b;var f=2*c-e,g=a+1/3,h=a,i=a-1/3,j=Math.round(255*this.HueToRGB(f,e,g)),k=Math.round(255*this.HueToRGB(f,e,h)),l=Math.round(255*this.HueToRGB(f,e,i));return[j,k,l,this._sanitizeNumber(d)]},toString:function(a){a=a||"rgba";var b=!1;switch(a){case"rgb":return b=this.toRGB(),this.rgbaIsTransparent(b)?"transparent":"rgb("+b.r+","+b.g+","+b.b+")";case"rgba":return b=this.toRGB(),"rgba("+b.r+","+b.g+","+b.b+","+b.a+")";case"hsl":return b=this.toHSL(),"hsl("+Math.round(360*b.h)+","+Math.round(100*b.s)+"%,"+Math.round(100*b.l)+"%)";case"hsla":return b=this.toHSL(),"hsla("+Math.round(360*b.h)+","+Math.round(100*b.s)+"%,"+Math.round(100*b.l)+"%,"+b.a+")";case"hex":return this.toHex();case"alias":return this.toAlias()||this.toHex();default:return b}},stringParsers:[{re:/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*?\)/,format:"rgb",parse:function(a){return[a[1],a[2],a[3],1]}},{re:/rgb\(\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*?\)/,format:"rgb",parse:function(a){return[2.55*a[1],2.55*a[2],2.55*a[3],1]}},{re:/rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,format:"rgba",parse:function(a){return[a[1],a[2],a[3],a[4]]}},{re:/rgba\(\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,format:"rgba",parse:function(a){return[2.55*a[1],2.55*a[2],2.55*a[3],a[4]]}},{re:/hsl\(\s*(\d*(?:\.\d+)?)\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*?\)/,format:"hsl",parse:function(a){return[a[1]/360,a[2]/100,a[3]/100,a[4]]}},{re:/hsla\(\s*(\d*(?:\.\d+)?)\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,format:"hsla",parse:function(a){return[a[1]/360,a[2]/100,a[3]/100,a[4]]}},{re:/#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,format:"hex",parse:function(a){return[parseInt(a[1],16),parseInt(a[2],16),parseInt(a[3],16),1]}},{re:/#?([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,format:"hex",parse:function(a){return[parseInt(a[1]+a[1],16),parseInt(a[2]+a[2],16),parseInt(a[3]+a[3],16),1]}}],colorNameToHex:function(a){return"undefined"!=typeof this.colors[a.toLowerCase()]?this.colors[a.toLowerCase()]:!1}};var c={horizontal:!1,inline:!1,color:!1,format:!1,input:"input",container:!1,component:".add-on, .input-group-addon",sliders:{saturation:{maxLeft:100,maxTop:100,callLeft:"setSaturation",callTop:"setBrightness"},hue:{maxLeft:0,maxTop:100,callLeft:!1,callTop:"setHue"},alpha:{maxLeft:0,maxTop:100,callLeft:!1,callTop:"setAlpha"}},slidersHorz:{saturation:{maxLeft:100,maxTop:100,callLeft:"setSaturation",callTop:"setBrightness"},hue:{maxLeft:100,maxTop:0,callLeft:"setHue",callTop:!1},alpha:{maxLeft:100,maxTop:0,callLeft:"setAlpha",callTop:!1}},template:'<div class="colorpicker dropdown-menu"><div class="colorpicker-saturation"><i><b></b></i></div><div class="colorpicker-hue"><i></i></div><div class="colorpicker-alpha"><i></i></div><div class="colorpicker-color"><div /></div><div class="colorpicker-selectors"></div></div>',align:"right",customClass:null,colorSelectors:null},d=function(d,e){if(this.element=a(d).addClass("colorpicker-element"),this.options=a.extend(!0,{},c,this.element.data(),e),this.component=this.options.component,this.component=this.component!==!1?this.element.find(this.component):!1,this.component&&0===this.component.length&&(this.component=!1),this.container=this.options.container===!0?this.element:this.options.container,this.container=this.container!==!1?a(this.container):!1,this.input=this.element.is("input")?this.element:this.options.input?this.element.find(this.options.input):!1,this.input&&0===this.input.length&&(this.input=!1),this.color=new b(this.options.color!==!1?this.options.color:this.getValue(),this.options.colorSelectors),this.format=this.options.format!==!1?this.options.format:this.color.origFormat,this.options.color!==!1&&(this.updateInput(this.color),this.updateData(this.color)),this.picker=a(this.options.template),this.options.customClass&&this.picker.addClass(this.options.customClass),this.options.inline?this.picker.addClass("colorpicker-inline colorpicker-visible"):this.picker.addClass("colorpicker-hidden"),this.options.horizontal&&this.picker.addClass("colorpicker-horizontal"),"rgba"!==this.format&&"hsla"!==this.format&&this.options.format!==!1||this.picker.addClass("colorpicker-with-alpha"),"right"===this.options.align&&this.picker.addClass("colorpicker-right"),this.options.inline===!0&&this.picker.addClass("colorpicker-no-arrow"),this.options.colorSelectors){var f=this;a.each(this.options.colorSelectors,function(b,c){var d=a("<i />").css("background-color",c).data("class",b);d.click(function(){f.setValue(a(this).css("background-color"))}),f.picker.find(".colorpicker-selectors").append(d)}),this.picker.find(".colorpicker-selectors").show()}this.picker.on("mousedown.colorpicker touchstart.colorpicker",a.proxy(this.mousedown,this)),this.picker.appendTo(this.container?this.container:a("body")),this.input!==!1&&(this.input.on({"keyup.colorpicker":a.proxy(this.keyup,this)}),this.input.on({"change.colorpicker":a.proxy(this.change,this)}),this.component===!1&&this.element.on({"focus.colorpicker":a.proxy(this.show,this)}),this.options.inline===!1&&this.element.on({"focusout.colorpicker":a.proxy(this.hide,this)})),this.component!==!1&&this.component.on({"click.colorpicker":a.proxy(this.show,this)}),this.input===!1&&this.component===!1&&this.element.on({"click.colorpicker":a.proxy(this.show,this)}),this.input!==!1&&this.component!==!1&&"color"===this.input.attr("type")&&this.input.on({"click.colorpicker":a.proxy(this.show,this),"focus.colorpicker":a.proxy(this.show,this)}),this.update(),a(a.proxy(function(){this.element.trigger("create")},this))};d.Color=b,d.prototype={constructor:d,destroy:function(){this.picker.remove(),this.element.removeData("colorpicker","color").off(".colorpicker"),this.input!==!1&&this.input.off(".colorpicker"),this.component!==!1&&this.component.off(".colorpicker"),this.element.removeClass("colorpicker-element"),this.element.trigger({type:"destroy"})},reposition:function(){if(this.options.inline!==!1||this.options.container)return!1;var a=this.container&&this.container[0]!==document.body?"position":"offset",b=this.component||this.element,c=b[a]();"right"===this.options.align&&(c.left-=this.picker.outerWidth()-b.outerWidth()),this.picker.css({top:c.top+b.outerHeight(),left:c.left})},show:function(b){return this.isDisabled()?!1:(this.picker.addClass("colorpicker-visible").removeClass("colorpicker-hidden"),this.reposition(),a(window).on("resize.colorpicker",a.proxy(this.reposition,this)),!b||this.hasInput()&&"color"!==this.input.attr("type")||b.stopPropagation&&b.preventDefault&&(b.stopPropagation(),b.preventDefault()),!this.component&&this.input||this.options.inline!==!1||a(window.document).on({"mousedown.colorpicker":a.proxy(this.hide,this)}),void this.element.trigger({type:"showPicker",color:this.color}))},hide:function(){this.picker.addClass("colorpicker-hidden").removeClass("colorpicker-visible"),a(window).off("resize.colorpicker",this.reposition),a(document).off({"mousedown.colorpicker":this.hide}),this.update(),this.element.trigger({type:"hidePicker",color:this.color})},updateData:function(a){return a=a||this.color.toString(this.format),this.element.data("color",a),a},updateInput:function(a){if(a=a||this.color.toString(this.format),this.input!==!1){if(this.options.colorSelectors){var c=new b(a,this.options.colorSelectors),d=c.toAlias();"undefined"!=typeof this.options.colorSelectors[d]&&(a=d)}this.input.prop("value",a)}return a},updatePicker:function(a){void 0!==a&&(this.color=new b(a,this.options.colorSelectors));var c=this.options.horizontal===!1?this.options.sliders:this.options.slidersHorz,d=this.picker.find("i");return 0!==d.length?(this.options.horizontal===!1?(c=this.options.sliders,d.eq(1).css("top",c.hue.maxTop*(1-this.color.value.h)).end().eq(2).css("top",c.alpha.maxTop*(1-this.color.value.a))):(c=this.options.slidersHorz,d.eq(1).css("left",c.hue.maxLeft*(1-this.color.value.h)).end().eq(2).css("left",c.alpha.maxLeft*(1-this.color.value.a))),d.eq(0).css({top:c.saturation.maxTop-this.color.value.b*c.saturation.maxTop,left:this.color.value.s*c.saturation.maxLeft}),this.picker.find(".colorpicker-saturation").css("backgroundColor",this.color.toHex(this.color.value.h,1,1,1)),this.picker.find(".colorpicker-alpha").css("backgroundColor",this.color.toHex()),this.picker.find(".colorpicker-color, .colorpicker-color div").css("backgroundColor",this.color.toString(this.format)),a):void 0},updateComponent:function(a){if(a=a||this.color.toString(this.format),this.component!==!1){var b=this.component.find("i").eq(0);b.length>0?b.css({backgroundColor:a}):this.component.css({backgroundColor:a})}return a},update:function(a){var b;return this.getValue(!1)===!1&&a!==!0||(b=this.updateComponent(),this.updateInput(b),this.updateData(b),this.updatePicker()),b},setValue:function(a){this.color=new b(a,this.options.colorSelectors),this.update(!0),this.element.trigger({type:"changeColor",color:this.color,value:a})},getValue:function(a){a=void 0===a?"#000000":a;var b;return b=this.hasInput()?this.input.val():this.element.data("color"),void 0!==b&&""!==b&&null!==b||(b=a),b},hasInput:function(){return this.input!==!1},isDisabled:function(){return this.hasInput()?this.input.prop("disabled")===!0:!1},disable:function(){return this.hasInput()?(this.input.prop("disabled",!0),this.element.trigger({type:"disable",color:this.color,value:this.getValue()}),!0):!1},enable:function(){return this.hasInput()?(this.input.prop("disabled",!1),this.element.trigger({type:"enable",color:this.color,value:this.getValue()}),!0):!1},currentSlider:null,mousePointer:{left:0,top:0},mousedown:function(b){!b.pageX&&!b.pageY&&b.originalEvent&&b.originalEvent.touches&&(b.pageX=b.originalEvent.touches[0].pageX,b.pageY=b.originalEvent.touches[0].pageY),b.stopPropagation(),b.preventDefault();var c=a(b.target),d=c.closest("div"),e=this.options.horizontal?this.options.slidersHorz:this.options.sliders;if(!d.is(".colorpicker")){if(d.is(".colorpicker-saturation"))this.currentSlider=a.extend({},e.saturation);else if(d.is(".colorpicker-hue"))this.currentSlider=a.extend({},e.hue);else{if(!d.is(".colorpicker-alpha"))return!1;this.currentSlider=a.extend({},e.alpha)}var f=d.offset();this.currentSlider.guide=d.find("i")[0].style,this.currentSlider.left=b.pageX-f.left,this.currentSlider.top=b.pageY-f.top,this.mousePointer={left:b.pageX,top:b.pageY},a(document).on({"mousemove.colorpicker":a.proxy(this.mousemove,this),"touchmove.colorpicker":a.proxy(this.mousemove,this),"mouseup.colorpicker":a.proxy(this.mouseup,this),"touchend.colorpicker":a.proxy(this.mouseup,this)}).trigger("mousemove")}return!1},mousemove:function(a){!a.pageX&&!a.pageY&&a.originalEvent&&a.originalEvent.touches&&(a.pageX=a.originalEvent.touches[0].pageX,a.pageY=a.originalEvent.touches[0].pageY),a.stopPropagation(),a.preventDefault();var b=Math.max(0,Math.min(this.currentSlider.maxLeft,this.currentSlider.left+((a.pageX||this.mousePointer.left)-this.mousePointer.left))),c=Math.max(0,Math.min(this.currentSlider.maxTop,this.currentSlider.top+((a.pageY||this.mousePointer.top)-this.mousePointer.top)));return this.currentSlider.guide.left=b+"px",this.currentSlider.guide.top=c+"px",this.currentSlider.callLeft&&this.color[this.currentSlider.callLeft].call(this.color,b/this.currentSlider.maxLeft),this.currentSlider.callTop&&this.color[this.currentSlider.callTop].call(this.color,c/this.currentSlider.maxTop),"setAlpha"===this.currentSlider.callTop&&this.options.format===!1&&(1!==this.color.value.a?(this.format="rgba",this.color.origFormat="rgba"):(this.format="hex",this.color.origFormat="hex")),this.update(!0),this.element.trigger({type:"changeColor",color:this.color}),!1},mouseup:function(b){return b.stopPropagation(),b.preventDefault(),a(document).off({"mousemove.colorpicker":this.mousemove,"touchmove.colorpicker":this.mousemove,"mouseup.colorpicker":this.mouseup,"touchend.colorpicker":this.mouseup}),!1},change:function(a){this.keyup(a)},keyup:function(a){38===a.keyCode?(this.color.value.a<1&&(this.color.value.a=Math.round(100*(this.color.value.a+.01))/100),this.update(!0)):40===a.keyCode?(this.color.value.a>0&&(this.color.value.a=Math.round(100*(this.color.value.a-.01))/100),this.update(!0)):(this.color=new b(this.input.val(),this.options.colorSelectors),this.color.origFormat&&this.options.format===!1&&(this.format=this.color.origFormat),this.getValue(!1)!==!1&&(this.updateData(),this.updateComponent(),this.updatePicker())),this.element.trigger({type:"changeColor",color:this.color,value:this.input.val()})}},a.colorpicker=d,a.fn.colorpicker=function(b){var c=arguments,e=null,f=this.each(function(){var f=a(this),g=f.data("colorpicker"),h="object"==typeof b?b:{};g||"string"==typeof b?"string"==typeof b&&(e=g[b].apply(g,Array.prototype.slice.call(c,1))):f.data("colorpicker",new d(this,h))});return"getValue"===b?e:f},a.fn.colorpicker.constructor=d});
/*!
 * Datepicker for Bootstrap v1.7.0-dev (https://github.com/eternicode/bootstrap-datepicker)
 *
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 * Licensed under the Apache License v2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):a("object"==typeof exports?require("jquery"):jQuery)}(function(a,b){function c(){return new Date(Date.UTC.apply(Date,arguments))}function d(){var a=new Date;return c(a.getFullYear(),a.getMonth(),a.getDate())}function e(a,b){return a.getUTCFullYear()===b.getUTCFullYear()&&a.getUTCMonth()===b.getUTCMonth()&&a.getUTCDate()===b.getUTCDate()}function f(a){return function(){return this[a].apply(this,arguments)}}function g(a){return a&&!isNaN(a.getTime())}function h(b,c){function d(a,b){return b.toLowerCase()}var e,f=a(b).data(),g={},h=new RegExp("^"+c.toLowerCase()+"([A-Z])");c=new RegExp("^"+c.toLowerCase());for(var i in f)c.test(i)&&(e=i.replace(h,d),g[e]=f[i]);return g}function i(b){var c={};if(q[b]||(b=b.split("-")[0],q[b])){var d=q[b];return a.each(p,function(a,b){b in d&&(c[b]=d[b])}),c}}var j=function(){var b={get:function(a){return this.slice(a)[0]},contains:function(a){for(var b=a&&a.valueOf(),c=0,d=this.length;d>c;c++)if(0<=this[c].valueOf()-b&&this[c].valueOf()-b<864e5)return c;return-1},remove:function(a){this.splice(a,1)},replace:function(b){b&&(a.isArray(b)||(b=[b]),this.clear(),this.push.apply(this,b))},clear:function(){this.length=0},copy:function(){var a=new j;return a.replace(this),a}};return function(){var c=[];return c.push.apply(c,arguments),a.extend(c,b),c}}(),k=function(b,c){a.data(b,"datepicker",this),this._process_options(c),this.dates=new j,this.viewDate=this.o.defaultViewDate,this.focusDate=null,this.element=a(b),this.isInput=this.element.is("input"),this.inputField=this.isInput?this.element:this.element.find("input"),this.component=this.element.hasClass("date")?this.element.find(".add-on, .input-group-addon, .btn"):!1,this.component&&0===this.component.length&&(this.component=!1),this.isInline=!this.component&&this.element.is("div"),this.picker=a(r.template),this._check_template(this.o.templates.leftArrow)&&this.picker.find(".prev").html(this.o.templates.leftArrow),this._check_template(this.o.templates.rightArrow)&&this.picker.find(".next").html(this.o.templates.rightArrow),this._buildEvents(),this._attachEvents(),this.isInline?this.picker.addClass("datepicker-inline").appendTo(this.element):this.picker.addClass("datepicker-dropdown dropdown-menu"),this.o.rtl&&this.picker.addClass("datepicker-rtl"),this.o.calendarWeeks&&this.picker.find(".datepicker-days .datepicker-switch, thead .datepicker-title, tfoot .today, tfoot .clear").attr("colspan",function(a,b){return Number(b)+1}),this._allow_update=!1,this.setStartDate(this._o.startDate),this.setEndDate(this._o.endDate),this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled),this.setDaysOfWeekHighlighted(this.o.daysOfWeekHighlighted),this.setDatesDisabled(this.o.datesDisabled),this.setViewMode(this.o.startView),this.fillDow(),this.fillMonths(),this._allow_update=!0,this.update(),this.isInline&&this.show()};k.prototype={constructor:k,_resolveViewName:function(b){return a.each(r.viewModes,function(c,d){return b===c||-1!==a.inArray(b,d.names)?(b=c,!1):void 0}),b},_resolveDaysOfWeek:function(b){return a.isArray(b)||(b=b.split(/[,\s]*/)),a.map(b,Number)},_check_template:function(c){try{if(c===b||""===c)return!1;if((c.match(/[<>]/g)||[]).length<=0)return!0;var d=a(c);return d.length>0}catch(e){return!1}},_process_options:function(b){this._o=a.extend({},this._o,b);var e=this.o=a.extend({},this._o),f=e.language;q[f]||(f=f.split("-")[0],q[f]||(f=o.language)),e.language=f,e.startView=this._resolveViewName(e.startView),e.minViewMode=this._resolveViewName(e.minViewMode),e.maxViewMode=this._resolveViewName(e.maxViewMode),e.startView=Math.max(this.o.minViewMode,Math.min(this.o.maxViewMode,e.startView)),e.multidate!==!0&&(e.multidate=Number(e.multidate)||!1,e.multidate!==!1&&(e.multidate=Math.max(0,e.multidate))),e.multidateSeparator=String(e.multidateSeparator),e.weekStart%=7,e.weekEnd=(e.weekStart+6)%7;var g=r.parseFormat(e.format);e.startDate!==-(1/0)&&(e.startDate?e.startDate instanceof Date?e.startDate=this._local_to_utc(this._zero_time(e.startDate)):e.startDate=r.parseDate(e.startDate,g,e.language,e.assumeNearbyYear):e.startDate=-(1/0)),e.endDate!==1/0&&(e.endDate?e.endDate instanceof Date?e.endDate=this._local_to_utc(this._zero_time(e.endDate)):e.endDate=r.parseDate(e.endDate,g,e.language,e.assumeNearbyYear):e.endDate=1/0),e.daysOfWeekDisabled=this._resolveDaysOfWeek(e.daysOfWeekDisabled||[]),e.daysOfWeekHighlighted=this._resolveDaysOfWeek(e.daysOfWeekHighlighted||[]),e.datesDisabled=e.datesDisabled||[],a.isArray(e.datesDisabled)||(e.datesDisabled=[e.datesDisabled]),e.datesDisabled=a.map(e.datesDisabled,function(a){return r.parseDate(a,g,e.language,e.assumeNearbyYear)});var h=String(e.orientation).toLowerCase().split(/\s+/g),i=e.orientation.toLowerCase();if(h=a.grep(h,function(a){return/^auto|left|right|top|bottom$/.test(a)}),e.orientation={x:"auto",y:"auto"},i&&"auto"!==i)if(1===h.length)switch(h[0]){case"top":case"bottom":e.orientation.y=h[0];break;case"left":case"right":e.orientation.x=h[0]}else i=a.grep(h,function(a){return/^left|right$/.test(a)}),e.orientation.x=i[0]||"auto",i=a.grep(h,function(a){return/^top|bottom$/.test(a)}),e.orientation.y=i[0]||"auto";else;if(e.defaultViewDate){var j=e.defaultViewDate.year||(new Date).getFullYear(),k=e.defaultViewDate.month||0,l=e.defaultViewDate.day||1;e.defaultViewDate=c(j,k,l)}else e.defaultViewDate=d()},_events:[],_secondaryEvents:[],_applyEvents:function(a){for(var c,d,e,f=0;f<a.length;f++)c=a[f][0],2===a[f].length?(d=b,e=a[f][1]):3===a[f].length&&(d=a[f][1],e=a[f][2]),c.on(e,d)},_unapplyEvents:function(a){for(var c,d,e,f=0;f<a.length;f++)c=a[f][0],2===a[f].length?(e=b,d=a[f][1]):3===a[f].length&&(e=a[f][1],d=a[f][2]),c.off(d,e)},_buildEvents:function(){var b={keyup:a.proxy(function(b){-1===a.inArray(b.keyCode,[27,37,39,38,40,32,13,9])&&this.update()},this),keydown:a.proxy(this.keydown,this),paste:a.proxy(this.paste,this)};this.o.showOnFocus===!0&&(b.focus=a.proxy(this.show,this)),this.isInput?this._events=[[this.element,b]]:this.component&&this.inputField.length?this._events=[[this.inputField,b],[this.component,{click:a.proxy(this.show,this)}]]:this._events=[[this.element,{click:a.proxy(this.show,this),keydown:a.proxy(this.keydown,this)}]],this._events.push([this.element,"*",{blur:a.proxy(function(a){this._focused_from=a.target},this)}],[this.element,{blur:a.proxy(function(a){this._focused_from=a.target},this)}]),this.o.immediateUpdates&&this._events.push([this.element,{"changeYear changeMonth":a.proxy(function(a){this.update(a.date)},this)}]),this._secondaryEvents=[[this.picker,{click:a.proxy(this.click,this)}],[this.picker,".prev, .next",{click:a.proxy(this.navArrowsClick,this)}],[a(window),{resize:a.proxy(this.place,this)}],[a(document),{"mousedown touchstart":a.proxy(function(a){this.element.is(a.target)||this.element.find(a.target).length||this.picker.is(a.target)||this.picker.find(a.target).length||this.isInline||this.hide()},this)}]]},_attachEvents:function(){this._detachEvents(),this._applyEvents(this._events)},_detachEvents:function(){this._unapplyEvents(this._events)},_attachSecondaryEvents:function(){this._detachSecondaryEvents(),this._applyEvents(this._secondaryEvents)},_detachSecondaryEvents:function(){this._unapplyEvents(this._secondaryEvents)},_trigger:function(b,c){var d=c||this.dates.get(-1),e=this._utc_to_local(d);this.element.trigger({type:b,date:e,dates:a.map(this.dates,this._utc_to_local),format:a.proxy(function(a,b){0===arguments.length?(a=this.dates.length-1,b=this.o.format):"string"==typeof a&&(b=a,a=this.dates.length-1),b=b||this.o.format;var c=this.dates.get(a);return r.formatDate(c,b,this.o.language)},this)})},show:function(){return this.inputField.prop("disabled")||this.inputField.prop("readonly")&&this.o.enableOnReadonly===!1?void 0:(this.isInline||this.picker.appendTo(this.o.container),this.place(),this.picker.show(),this._attachSecondaryEvents(),this._trigger("show"),(window.navigator.msMaxTouchPoints||"ontouchstart"in document)&&this.o.disableTouchKeyboard&&a(this.element).blur(),this)},hide:function(){return this.isInline||!this.picker.is(":visible")?this:(this.focusDate=null,this.picker.hide().detach(),this._detachSecondaryEvents(),this.setViewMode(this.o.startView),this.o.forceParse&&this.inputField.val()&&this.setValue(),this._trigger("hide"),this)},destroy:function(){return this.hide(),this._detachEvents(),this._detachSecondaryEvents(),this.picker.remove(),delete this.element.data().datepicker,this.isInput||delete this.element.data().date,this},paste:function(b){var c;if(b.originalEvent.clipboardData&&b.originalEvent.clipboardData.types&&-1!==a.inArray("text/plain",b.originalEvent.clipboardData.types))c=b.originalEvent.clipboardData.getData("text/plain");else{if(!window.clipboardData)return;c=window.clipboardData.getData("Text")}this.setDate(c),this.update(),b.preventDefault()},_utc_to_local:function(a){return a&&new Date(a.getTime()+6e4*a.getTimezoneOffset())},_local_to_utc:function(a){return a&&new Date(a.getTime()-6e4*a.getTimezoneOffset())},_zero_time:function(a){return a&&new Date(a.getFullYear(),a.getMonth(),a.getDate())},_zero_utc_time:function(a){return a&&c(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate())},getDates:function(){return a.map(this.dates,this._utc_to_local)},getUTCDates:function(){return a.map(this.dates,function(a){return new Date(a)})},getDate:function(){return this._utc_to_local(this.getUTCDate())},getUTCDate:function(){var a=this.dates.get(-1);return a!==b?new Date(a):null},clearDates:function(){this.inputField.val(""),this.update(),this._trigger("changeDate"),this.o.autoclose&&this.hide()},setDates:function(){var b=a.isArray(arguments[0])?arguments[0]:arguments;return this.update.apply(this,b),this._trigger("changeDate"),this.setValue(),this},setUTCDates:function(){var b=a.isArray(arguments[0])?arguments[0]:arguments;return this.setDates.apply(this,a.map(b,this._utc_to_local)),this},setDate:f("setDates"),setUTCDate:f("setUTCDates"),remove:f("destroy"),setValue:function(){var a=this.getFormattedDate();return this.inputField.val(a),this},getFormattedDate:function(c){c===b&&(c=this.o.format);var d=this.o.language;return a.map(this.dates,function(a){return r.formatDate(a,c,d)}).join(this.o.multidateSeparator)},getStartDate:function(){return this.o.startDate},setStartDate:function(a){return this._process_options({startDate:a}),this.update(),this.updateNavArrows(),this},getEndDate:function(){return this.o.endDate},setEndDate:function(a){return this._process_options({endDate:a}),this.update(),this.updateNavArrows(),this},setDaysOfWeekDisabled:function(a){return this._process_options({daysOfWeekDisabled:a}),this.update(),this},setDaysOfWeekHighlighted:function(a){return this._process_options({daysOfWeekHighlighted:a}),this.update(),this},setDatesDisabled:function(a){return this._process_options({datesDisabled:a}),this.update(),this},place:function(){if(this.isInline)return this;var b=this.picker.outerWidth(),c=this.picker.outerHeight(),d=10,e=a(this.o.container),f=e.width(),g="body"===this.o.container?a(document).scrollTop():e.scrollTop(),h=e.offset(),i=[];this.element.parents().each(function(){var b=a(this).css("z-index");"auto"!==b&&0!==b&&i.push(parseInt(b))});var j=Math.max.apply(Math,i)+this.o.zIndexOffset,k=this.component?this.component.parent().offset():this.element.offset(),l=this.component?this.component.outerHeight(!0):this.element.outerHeight(!1),m=this.component?this.component.outerWidth(!0):this.element.outerWidth(!1),n=k.left-h.left,o=k.top-h.top;"body"!==this.o.container&&(o+=g),this.picker.removeClass("datepicker-orient-top datepicker-orient-bottom datepicker-orient-right datepicker-orient-left"),"auto"!==this.o.orientation.x?(this.picker.addClass("datepicker-orient-"+this.o.orientation.x),"right"===this.o.orientation.x&&(n-=b-m)):k.left<0?(this.picker.addClass("datepicker-orient-left"),n-=k.left-d):n+b>f?(this.picker.addClass("datepicker-orient-right"),n+=m-b):this.picker.addClass("datepicker-orient-left");var p,q=this.o.orientation.y;if("auto"===q&&(p=-g+o-c,q=0>p?"bottom":"top"),this.picker.addClass("datepicker-orient-"+q),"top"===q?o-=c+parseInt(this.picker.css("padding-top")):o+=l,this.o.rtl){var r=f-(n+m);this.picker.css({top:o,right:r,zIndex:j})}else this.picker.css({top:o,left:n,zIndex:j});return this},_allow_update:!0,update:function(){if(!this._allow_update)return this;var b=this.dates.copy(),c=[],d=!1;return arguments.length?(a.each(arguments,a.proxy(function(a,b){b instanceof Date&&(b=this._local_to_utc(b)),c.push(b)},this)),d=!0):(c=this.isInput?this.element.val():this.element.data("date")||this.inputField.val(),c=c&&this.o.multidate?c.split(this.o.multidateSeparator):[c],delete this.element.data().date),c=a.map(c,a.proxy(function(a){return r.parseDate(a,this.o.format,this.o.language,this.o.assumeNearbyYear)},this)),c=a.grep(c,a.proxy(function(a){return!this.dateWithinRange(a)||!a},this),!0),this.dates.replace(c),this.dates.length?this.viewDate=new Date(this.dates.get(-1)):this.viewDate<this.o.startDate?this.viewDate=new Date(this.o.startDate):this.viewDate>this.o.endDate?this.viewDate=new Date(this.o.endDate):this.viewDate=this.o.defaultViewDate,d?(this.setValue(),this.element.change()):this.dates.length&&String(b)!==String(this.dates)&&d&&(this._trigger("changeDate"),this.element.change()),!this.dates.length&&b.length&&(this._trigger("clearDate"),this.element.change()),this.fill(),this},fillDow:function(){var b=this.o.weekStart,c="<tr>";for(this.o.calendarWeeks&&(c+='<th class="cw">&#160;</th>');b<this.o.weekStart+7;)c+='<th class="dow',-1!==a.inArray(b,this.o.daysOfWeekDisabled)&&(c+=" disabled"),c+='">'+q[this.o.language].daysMin[b++%7]+"</th>";c+="</tr>",this.picker.find(".datepicker-days thead").append(c)},fillMonths:function(){for(var a=this._utc_to_local(this.viewDate),b="",c=0;12>c;){var d=a&&a.getMonth()===c?" focused":"";b+='<span class="month'+d+'">'+q[this.o.language].monthsShort[c++]+"</span>"}this.picker.find(".datepicker-months td").html(b)},setRange:function(b){b&&b.length?this.range=a.map(b,function(a){return a.valueOf()}):delete this.range,this.fill()},getClassNames:function(b){var c=[],f=this.viewDate.getUTCFullYear(),g=this.viewDate.getUTCMonth(),h=d();return b.getUTCFullYear()<f||b.getUTCFullYear()===f&&b.getUTCMonth()<g?c.push("old"):(b.getUTCFullYear()>f||b.getUTCFullYear()===f&&b.getUTCMonth()>g)&&c.push("new"),this.focusDate&&b.valueOf()===this.focusDate.valueOf()&&c.push("focused"),this.o.todayHighlight&&e(b,h)&&c.push("today"),-1!==this.dates.contains(b)&&c.push("active"),this.dateWithinRange(b)||c.push("disabled"),this.dateIsDisabled(b)&&c.push("disabled","disabled-date"),-1!==a.inArray(b.getUTCDay(),this.o.daysOfWeekHighlighted)&&c.push("highlighted"),this.range&&(b>this.range[0]&&b<this.range[this.range.length-1]&&c.push("range"),-1!==a.inArray(b.valueOf(),this.range)&&c.push("selected"),b.valueOf()===this.range[0]&&c.push("range-start"),b.valueOf()===this.range[this.range.length-1]&&c.push("range-end")),c},_fill_yearsView:function(c,d,e,f,g,h,i,j){var k,l,m,n,o,p,q,r,s,t,u;for(k="",l=this.picker.find(c),m=parseInt(g/e,10)*e,o=parseInt(h/f,10)*f,p=parseInt(i/f,10)*f,n=a.map(this.dates,function(a){return parseInt(a.getUTCFullYear()/f,10)*f}),l.find(".datepicker-switch").text(m+"-"+(m+9*f)),q=m-f,r=-1;11>r;r+=1)s=[d],t=null,-1===r?s.push("old"):10===r&&s.push("new"),-1!==a.inArray(q,n)&&s.push("active"),(o>q||q>p)&&s.push("disabled"),q===this.viewDate.getFullYear()&&s.push("focused"),j!==a.noop&&(u=j(new Date(q,0,1)),u===b?u={}:"boolean"==typeof u?u={enabled:u}:"string"==typeof u&&(u={classes:u}),u.enabled===!1&&s.push("disabled"),u.classes&&(s=s.concat(u.classes.split(/\s+/))),u.tooltip&&(t=u.tooltip)),k+='<span class="'+s.join(" ")+'"'+(t?' title="'+t+'"':"")+">"+q+"</span>",q+=f;l.find("td").html(k)},fill:function(){var d,e,f=new Date(this.viewDate),g=f.getUTCFullYear(),h=f.getUTCMonth(),i=this.o.startDate!==-(1/0)?this.o.startDate.getUTCFullYear():-(1/0),j=this.o.startDate!==-(1/0)?this.o.startDate.getUTCMonth():-(1/0),k=this.o.endDate!==1/0?this.o.endDate.getUTCFullYear():1/0,l=this.o.endDate!==1/0?this.o.endDate.getUTCMonth():1/0,m=q[this.o.language].today||q.en.today||"",n=q[this.o.language].clear||q.en.clear||"",o=q[this.o.language].titleFormat||q.en.titleFormat;if(!isNaN(g)&&!isNaN(h)){this.picker.find(".datepicker-days .datepicker-switch").text(r.formatDate(f,o,this.o.language)),this.picker.find("tfoot .today").text(m).toggle(this.o.todayBtn!==!1),this.picker.find("tfoot .clear").text(n).toggle(this.o.clearBtn!==!1),this.picker.find("thead .datepicker-title").text(this.o.title).toggle(""!==this.o.title),this.updateNavArrows(),this.fillMonths();var p=c(g,h,0),s=p.getUTCDate();p.setUTCDate(s-(p.getUTCDay()-this.o.weekStart+7)%7);var t=new Date(p);p.getUTCFullYear()<100&&t.setUTCFullYear(p.getUTCFullYear()),t.setUTCDate(t.getUTCDate()+42),t=t.valueOf();for(var u,v,w=[];p.valueOf()<t;){if(u=p.getUTCDay(),u===this.o.weekStart&&(w.push("<tr>"),this.o.calendarWeeks)){var x=new Date(+p+(this.o.weekStart-u-7)%7*864e5),y=new Date(Number(x)+(11-x.getUTCDay())%7*864e5),z=new Date(Number(z=c(y.getUTCFullYear(),0,1))+(11-z.getUTCDay())%7*864e5),A=(y-z)/864e5/7+1;w.push('<td class="cw">'+A+"</td>")}v=this.getClassNames(p),v.push("day"),this.o.beforeShowDay!==a.noop&&(e=this.o.beforeShowDay(this._utc_to_local(p)),e===b?e={}:"boolean"==typeof e?e={enabled:e}:"string"==typeof e&&(e={classes:e}),e.enabled===!1&&v.push("disabled"),e.classes&&(v=v.concat(e.classes.split(/\s+/))),e.tooltip&&(d=e.tooltip)),v=a.unique(v),w.push('<td class="'+v.join(" ")+'"'+(d?' title="'+d+'"':"")+(this.o.dateCells?' data-date="'+p.getTime().toString()+'"':"")+">"+p.getUTCDate()+"</td>"),d=null,u===this.o.weekEnd&&w.push("</tr>"),p.setUTCDate(p.getUTCDate()+1)}this.picker.find(".datepicker-days tbody").html(w.join(""));var B=q[this.o.language].monthsTitle||q.en.monthsTitle||"Months",C=this.picker.find(".datepicker-months").find(".datepicker-switch").text(this.o.maxViewMode<2?B:g).end().find("tbody span").removeClass("active");if(a.each(this.dates,function(a,b){b.getUTCFullYear()===g&&C.eq(b.getUTCMonth()).addClass("active")}),(i>g||g>k)&&C.addClass("disabled"),g===i&&C.slice(0,j).addClass("disabled"),g===k&&C.slice(l+1).addClass("disabled"),this.o.beforeShowMonth!==a.noop){var D=this;a.each(C,function(c,d){var e=new Date(g,c,1),f=D.o.beforeShowMonth(e);f===b?f={}:"boolean"==typeof f?f={enabled:f}:"string"==typeof f&&(f={classes:f}),f.enabled!==!1||a(d).hasClass("disabled")||a(d).addClass("disabled"),f.classes&&a(d).addClass(f.classes),f.tooltip&&a(d).prop("title",f.tooltip)})}this._fill_yearsView(".datepicker-years","year",10,1,g,i,k,this.o.beforeShowYear),this._fill_yearsView(".datepicker-decades","decade",100,10,g,i,k,this.o.beforeShowDecade),this._fill_yearsView(".datepicker-centuries","century",1e3,100,g,i,k,this.o.beforeShowCentury)}},updateNavArrows:function(){if(this._allow_update){var a,b,c=new Date(this.viewDate),d=c.getUTCFullYear(),e=c.getUTCMonth();switch(this.viewMode){case 0:a=this.o.startDate!==-(1/0)&&d<=this.o.startDate.getUTCFullYear()&&e<=this.o.startDate.getUTCMonth(),b=this.o.endDate!==1/0&&d>=this.o.endDate.getUTCFullYear()&&e>=this.o.endDate.getUTCMonth();break;case 1:case 2:case 3:case 4:a=this.o.startDate!==-(1/0)&&d<=this.o.startDate.getUTCFullYear(),b=this.o.endDate!==1/0&&d>=this.o.endDate.getUTCFullYear()}this.picker.find(".prev").toggleClass("disabled",a),this.picker.find(".next").toggleClass("disabled",b)}},click:function(b){b.preventDefault(),b.stopPropagation();var e,f,g,h,i;e=a(b.target),e.hasClass("datepicker-switch")&&this.setViewMode(this.viewMode+1),e.hasClass("today")&&!e.hasClass("day")&&(this.setViewMode(0),this._setDate(d(),"linked"===this.o.todayBtn?null:"view")),e.hasClass("clear")&&this.clearDates(),e.hasClass("disabled")||(e.hasClass("day")&&(g=Number(e.text()),h=this.viewDate.getUTCFullYear(),i=this.viewDate.getUTCMonth(),(e.hasClass("old")||e.hasClass("new"))&&(f=e.hasClass("old")?-1:1,i=(i+f+12)%12,(-1===f&&11===i||1===f&&0===i)&&(h+=f,this._trigger("changeYear",this.viewDate)),this._trigger("changeMonth",this.viewDate)),this._setDate(c(h,i,g))),(e.hasClass("month")||e.hasClass("year")||e.hasClass("decade")||e.hasClass("century"))&&(this.viewDate.setUTCDate(1),g=1,1===this.viewMode?(i=e.parent().find("span").index(e),h=this.viewDate.getUTCFullYear(),this.viewDate.setUTCMonth(i)):(i=0,h=Number(e.text()),this.viewDate.setUTCFullYear(h)),this._trigger(r.viewModes[this.viewMode-1].e,this.viewDate),this.viewMode===this.o.minViewMode?this._setDate(c(h,i,g)):(this.setViewMode(this.viewMode-1),this.fill()))),this.picker.is(":visible")&&this._focused_from&&this._focused_from.focus(),delete this._focused_from},navArrowsClick:function(b){var c=a(b.target),d=c.hasClass("prev")?-1:1;0!==this.viewMode&&(d*=12*r.viewModes[this.viewMode].navStep),this.viewDate=this.moveMonth(this.viewDate,d),this._trigger(r.viewModes[this.viewMode].e,this.viewDate),this.fill()},_toggle_multidate:function(a){var b=this.dates.contains(a);if(a||this.dates.clear(),-1!==b?(this.o.multidate===!0||this.o.multidate>1||this.o.toggleActive)&&this.dates.remove(b):this.o.multidate===!1?(this.dates.clear(),this.dates.push(a)):this.dates.push(a),"number"==typeof this.o.multidate)for(;this.dates.length>this.o.multidate;)this.dates.remove(0)},_setDate:function(a,b){b&&"date"!==b||this._toggle_multidate(a&&new Date(a)),b&&"view"!==b||(this.viewDate=a&&new Date(a)),this.fill(),this.setValue(),b&&"view"===b||this._trigger("changeDate"),this.inputField.trigger("change"),!this.o.autoclose||b&&"date"!==b||this.hide()},moveDay:function(a,b){var c=new Date(a);return c.setUTCDate(a.getUTCDate()+b),c},moveWeek:function(a,b){return this.moveDay(a,7*b)},moveMonth:function(a,b){if(!g(a))return this.o.defaultViewDate;if(!b)return a;var c,d,e=new Date(a.valueOf()),f=e.getUTCDate(),h=e.getUTCMonth(),i=Math.abs(b);if(b=b>0?1:-1,1===i)d=-1===b?function(){return e.getUTCMonth()===h}:function(){return e.getUTCMonth()!==c},c=h+b,e.setUTCMonth(c),c=(c+12)%12;else{for(var j=0;i>j;j++)e=this.moveMonth(e,b);c=e.getUTCMonth(),e.setUTCDate(f),d=function(){return c!==e.getUTCMonth()}}for(;d();)e.setUTCDate(--f),e.setUTCMonth(c);return e},moveYear:function(a,b){return this.moveMonth(a,12*b)},moveAvailableDate:function(a,b,c){do{if(a=this[c](a,b),!this.dateWithinRange(a))return!1;c="moveDay"}while(this.dateIsDisabled(a));return a},weekOfDateIsDisabled:function(b){return-1!==a.inArray(b.getUTCDay(),this.o.daysOfWeekDisabled)},dateIsDisabled:function(b){return this.weekOfDateIsDisabled(b)||a.grep(this.o.datesDisabled,function(a){return e(b,a)}).length>0},dateWithinRange:function(a){return a>=this.o.startDate&&a<=this.o.endDate},keydown:function(a){if(!this.picker.is(":visible"))return void((40===a.keyCode||27===a.keyCode)&&(this.show(),a.stopPropagation()));var b,c,d=!1,e=this.focusDate||this.viewDate;switch(a.keyCode){case 27:this.focusDate?(this.focusDate=null,this.viewDate=this.dates.get(-1)||this.viewDate,this.fill()):this.hide(),a.preventDefault(),a.stopPropagation();break;case 37:case 38:case 39:case 40:if(!this.o.keyboardNavigation||7===this.o.daysOfWeekDisabled.length)break;b=37===a.keyCode||38===a.keyCode?-1:1,0===this.viewMode?a.ctrlKey?(c=this.moveAvailableDate(e,b,"moveYear"),c&&this._trigger("changeYear",this.viewDate)):a.shiftKey?(c=this.moveAvailableDate(e,b,"moveMonth"),c&&this._trigger("changeMonth",this.viewDate)):37===a.keyCode||39===a.keyCode?c=this.moveAvailableDate(e,b,"moveDay"):this.weekOfDateIsDisabled(e)||(c=this.moveAvailableDate(e,b,"moveWeek")):1===this.viewMode?((38===a.keyCode||40===a.keyCode)&&(b=4*b),c=this.moveAvailableDate(e,b,"moveMonth")):2===this.viewMode&&((38===a.keyCode||40===a.keyCode)&&(b=4*b),c=this.moveAvailableDate(e,b,"moveYear")),c&&(this.focusDate=this.viewDate=c,this.setValue(),this.fill(),a.preventDefault());break;case 13:if(!this.o.forceParse)break;e=this.focusDate||this.dates.get(-1)||this.viewDate,this.o.keyboardNavigation&&(this._toggle_multidate(e),d=!0),this.focusDate=null,this.viewDate=this.dates.get(-1)||this.viewDate,this.setValue(),this.fill(),this.picker.is(":visible")&&(a.preventDefault(),a.stopPropagation(),this.o.autoclose&&this.hide());break;case 9:this.focusDate=null,this.viewDate=this.dates.get(-1)||this.viewDate,this.fill(),this.hide()}d&&(this.dates.length?this._trigger("changeDate"):this._trigger("clearDate"),this.inputField.trigger("change"))},setViewMode:function(a){this.viewMode=a,this.picker.children("div").hide().filter(".datepicker-"+r.viewModes[this.viewMode].clsName).show(),this.updateNavArrows()}};var l=function(b,c){a.data(b,"datepicker",this),this.element=a(b),this.inputs=a.map(c.inputs,function(a){return a.jquery?a[0]:a}),delete c.inputs,this.keepEmptyValues=c.keepEmptyValues,delete c.keepEmptyValues,n.call(a(this.inputs),c).on("changeDate",a.proxy(this.dateUpdated,this)),this.pickers=a.map(this.inputs,function(b){return a.data(b,"datepicker")}),this.updateDates()};l.prototype={updateDates:function(){this.dates=a.map(this.pickers,function(a){return a.getUTCDate()}),this.updateRanges()},updateRanges:function(){var b=a.map(this.dates,function(a){return a.valueOf()});a.each(this.pickers,function(a,c){c.setRange(b)})},dateUpdated:function(c){if(!this.updating){this.updating=!0;var d=a.data(c.target,"datepicker");if(d!==b){var e=d.getUTCDate(),f=this.keepEmptyValues,g=a.inArray(c.target,this.inputs),h=g-1,i=g+1,j=this.inputs.length;if(-1!==g){if(a.each(this.pickers,function(a,b){b.getUTCDate()||b!==d&&f||b.setUTCDate(e)}),e<this.dates[h])for(;h>=0&&e<this.dates[h];)this.pickers[h--].setUTCDate(e);else if(e>this.dates[i])for(;j>i&&e>this.dates[i];)this.pickers[i++].setUTCDate(e);this.updateDates(),delete this.updating}}}},destroy:function(){a.map(this.pickers,function(a){a.destroy()}),delete this.element.data().datepicker},remove:f("destroy")};var m=a.fn.datepicker,n=function(c){var d=Array.apply(null,arguments);d.shift();var e;if(this.each(function(){var b=a(this),f=b.data("datepicker"),g="object"==typeof c&&c;if(!f){var j=h(this,"date"),m=a.extend({},o,j,g),n=i(m.language),p=a.extend({},o,n,j,g);b.hasClass("input-daterange")||p.inputs?(a.extend(p,{inputs:p.inputs||b.find("input").toArray()}),f=new l(this,p)):f=new k(this,p),b.data("datepicker",f)}"string"==typeof c&&"function"==typeof f[c]&&(e=f[c].apply(f,d))}),e===b||e instanceof k||e instanceof l)return this;if(this.length>1)throw new Error("Using only allowed for the collection of a single element ("+c+" function)");return e};a.fn.datepicker=n;var o=a.fn.datepicker.defaults={assumeNearbyYear:!1,autoclose:!1,beforeShowDay:a.noop,beforeShowMonth:a.noop,beforeShowYear:a.noop,beforeShowDecade:a.noop,beforeShowCentury:a.noop,calendarWeeks:!1,clearBtn:!1,toggleActive:!1,daysOfWeekDisabled:[],daysOfWeekHighlighted:[],datesDisabled:[],endDate:1/0,forceParse:!0,format:"mm/dd/yyyy",keepEmptyValues:!1,keyboardNavigation:!0,language:"en",minViewMode:0,maxViewMode:4,multidate:!1,multidateSeparator:",",orientation:"auto",rtl:!1,startDate:-(1/0),startView:0,todayBtn:!1,todayHighlight:!1,weekStart:0,disableTouchKeyboard:!1,enableOnReadonly:!0,showOnFocus:!0,zIndexOffset:10,container:"body",immediateUpdates:!1,dateCells:!1,title:"",templates:{leftArrow:"&laquo;",rightArrow:"&raquo;"}},p=a.fn.datepicker.locale_opts=["format","rtl","weekStart"];a.fn.datepicker.Constructor=k;var q=a.fn.datepicker.dates={en:{days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],daysShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],daysMin:["Su","Mo","Tu","We","Th","Fr","Sa"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],monthsShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],today:"Today",clear:"Clear",titleFormat:"MM yyyy"}},r={viewModes:[{names:["days","month"],clsName:"days",e:"changeMonth"},{names:["months","year"],clsName:"months",e:"changeYear",navStep:1},{names:["years","decade"],clsName:"years",e:"changeDecade",navStep:10},{names:["decades","century"],clsName:"decades",e:"changeCentury",navStep:100},{names:["centuries","millennium"],clsName:"centuries",e:"changeMillennium",navStep:1e3}],validParts:/dd?|DD?|mm?|MM?|yy(?:yy)?/g,nonpunctuation:/[^ -\/:-@\u5e74\u6708\u65e5\[-`{-~\t\n\r]+/g,parseFormat:function(a){if("function"==typeof a.toValue&&"function"==typeof a.toDisplay)return a;var b=a.replace(this.validParts,"\x00").split("\x00"),c=a.match(this.validParts);if(!b||!b.length||!c||0===c.length)throw new Error("Invalid date format.");return{separators:b,parts:c}},parseDate:function(e,f,g,h){function i(a,b){return b===!0&&(b=10),100>a&&(a+=2e3,a>(new Date).getFullYear()+b&&(a-=100)),a}function j(){var a=this.slice(0,s[n].length),b=s[n].slice(0,a.length);return a.toLowerCase()===b.toLowerCase()}if(!e)return b;if(e instanceof Date)return e;if("string"==typeof f&&(f=r.parseFormat(f)),f.toValue)return f.toValue(e,f,g);var l,m,n,o,p=/([\-+]\d+)([dmwy])/,s=e.match(/([\-+]\d+)([dmwy])/g),t={d:"moveDay",m:"moveMonth",w:"moveWeek",y:"moveYear"},u={yesterday:"-1d",today:"+0d",tomorrow:"+1d"};if(/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(e)){for(e=new Date,n=0;n<s.length;n++)l=p.exec(s[n]),m=parseInt(l[1]),o=t[l[2]],e=k.prototype[o](e,m);return c(e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate())}if(e in u&&(e=u[e],s=e.match(/([\-+]\d+)([dmwy])/g),/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(e))){for(e=new Date,n=0;n<s.length;n++)l=p.exec(s[n]),m=parseInt(l[1]),o=t[l[2]],e=k.prototype[o](e,m);return c(e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate())}s=e&&e.match(this.nonpunctuation)||[],e=new Date;var v,w,x={},y=["yyyy","yy","M","MM","m","mm","d","dd"],z={yyyy:function(a,b){return a.setUTCFullYear(h?i(b,h):b)},m:function(a,b){if(isNaN(a))return a;for(b-=1;0>b;)b+=12;for(b%=12,a.setUTCMonth(b);a.getUTCMonth()!==b;)a.setUTCDate(a.getUTCDate()-1);return a},d:function(a,b){return a.setUTCDate(b)}};z.yy=z.yyyy,z.M=z.MM=z.mm=z.m,z.dd=z.d,e=d();var A=f.parts.slice();if(s.length!==A.length&&(A=a(A).filter(function(b,c){return-1!==a.inArray(c,y)}).toArray()),s.length===A.length){var B;for(n=0,B=A.length;B>n;n++){if(v=parseInt(s[n],10),l=A[n],isNaN(v))switch(l){case"MM":w=a(q[g].months).filter(j),v=a.inArray(w[0],q[g].months)+1;break;case"M":w=a(q[g].monthsShort).filter(j),v=a.inArray(w[0],q[g].monthsShort)+1}x[l]=v}var C,D;for(n=0;n<y.length;n++)D=y[n],D in x&&!isNaN(x[D])&&(C=new Date(e),z[D](C,x[D]),isNaN(C)||(e=C))}return e},formatDate:function(b,c,d){if(!b)return"";if("string"==typeof c&&(c=r.parseFormat(c)),c.toDisplay)return c.toDisplay(b,c,d);var e={d:b.getUTCDate(),D:q[d].daysShort[b.getUTCDay()],DD:q[d].days[b.getUTCDay()],m:b.getUTCMonth()+1,M:q[d].monthsShort[b.getUTCMonth()],MM:q[d].months[b.getUTCMonth()],yy:b.getUTCFullYear().toString().substring(2),yyyy:b.getUTCFullYear()};e.dd=(e.d<10?"0":"")+e.d,e.mm=(e.m<10?"0":"")+e.m,b=[];for(var f=a.extend([],c.separators),g=0,h=c.parts.length;h>=g;g++)f.length&&b.push(f.shift()),b.push(e[c.parts[g]]);return b.join("")},headTemplate:'<thead><tr><th colspan="7" class="datepicker-title"></th></tr><tr><th class="prev">&laquo;</th><th colspan="5" class="datepicker-switch"></th><th class="next">&raquo;</th></tr></thead>',contTemplate:'<tbody><tr><td colspan="7"></td></tr></tbody>',footTemplate:'<tfoot><tr><th colspan="7" class="today"></th></tr><tr><th colspan="7" class="clear"></th></tr></tfoot>'};r.template='<div class="datepicker"><div class="datepicker-days"><table class="table-condensed">'+r.headTemplate+"<tbody></tbody>"+r.footTemplate+'</table></div><div class="datepicker-months"><table class="table-condensed">'+r.headTemplate+r.contTemplate+r.footTemplate+'</table></div><div class="datepicker-years"><table class="table-condensed">'+r.headTemplate+r.contTemplate+r.footTemplate+'</table></div><div class="datepicker-decades"><table class="table-condensed">'+r.headTemplate+r.contTemplate+r.footTemplate+'</table></div><div class="datepicker-centuries"><table class="table-condensed">'+r.headTemplate+r.contTemplate+r.footTemplate+"</table></div></div>",
a.fn.datepicker.DPGlobal=r,a.fn.datepicker.noConflict=function(){return a.fn.datepicker=m,this},a.fn.datepicker.version="1.7.0-dev",a(document).on("focus.datepicker.data-api click.datepicker.data-api",'[data-provide="datepicker"]',function(b){var c=a(this);c.data("datepicker")||(b.preventDefault(),n.call(c,"show"))}),a(function(){n.call(a('[data-provide="datepicker-inline"]'))})});
/* ========================================================== 
 * 
 * bootstrap-maxlength.js v 1.6.0 
 * Copyright 2015 Maurizio Napoleoni @mimonap
 * Licensed under MIT License
 * URL: https://github.com/mimo84/bootstrap-maxlength/blob/master/LICENSE
 *
 * ========================================================== */

!function(a){"use strict";a.event.special.destroyed||(a.event.special.destroyed={remove:function(a){a.handler&&a.handler()}}),a.fn.extend({maxlength:function(b,c){function d(a){var c=a.val();c=b.twoCharLinebreak?c.replace(/\r(?!\n)|\n(?!\r)/g,"\r\n"):c.replace(new RegExp("\r?\n","g"),"\n");var d=0;return d=b.utf8?f(c):c.length}function e(a,c){var d=a.val(),e=0;b.twoCharLinebreak&&(d=d.replace(/\r(?!\n)|\n(?!\r)/g,"\r\n"),"\n"===d.substr(d.length-1)&&d.length%2===1&&(e=1)),a.val(d.substr(0,c-e))}function f(a){for(var b=0,c=0;c<a.length;c++){var d=a.charCodeAt(c);128>d?b++:b+=d>127&&2048>d?2:3}return b}function g(a,c,e){var f=!0;return!b.alwaysShow&&e-d(a)>c&&(f=!1),f}function h(a,b){var c=b-d(a);return c}function i(a,b){b.css({display:"block"}),a.trigger("maxlength.shown")}function j(a,b){b.css({display:"none"}),a.trigger("maxlength.hidden")}function k(a,c,d){var e="";return b.message?e="function"==typeof b.message?b.message(a,c):b.message.replace("%charsTyped%",d).replace("%charsRemaining%",c-d).replace("%charsTotal%",c):(b.preText&&(e+=b.preText),e+=b.showCharsTyped?d:c-d,b.showMaxLength&&(e+=b.separator+c),b.postText&&(e+=b.postText)),e}function l(a,c,d,e){e&&(e.html(k(c.val(),d,d-a)),a>0?g(c,b.threshold,d)?i(c,e.removeClass(b.limitReachedClass).addClass(b.warningClass)):j(c,e):i(c,e.removeClass(b.warningClass).addClass(b.limitReachedClass))),b.allowOverMax&&(0>a?c.addClass("overmax"):c.removeClass("overmax"))}function m(b){var c=b[0];return a.extend({},"function"==typeof c.getBoundingClientRect?c.getBoundingClientRect():{width:c.offsetWidth,height:c.offsetHeight},b.offset())}function n(c,d){var e=m(c);if("function"===a.type(b.placement))return void b.placement(c,d,e);if(a.isPlainObject(b.placement))return void o(b.placement,d);var f=c.outerWidth(),g=d.outerWidth(),h=d.width(),i=d.height();switch(b.appendToParent&&(e.top-=c.parent().offset().top,e.left-=c.parent().offset().left),b.placement){case"bottom":d.css({top:e.top+e.height,left:e.left+e.width/2-h/2});break;case"top":d.css({top:e.top-i,left:e.left+e.width/2-h/2});break;case"left":d.css({top:e.top+e.height/2-i/2,left:e.left-h});break;case"right":d.css({top:e.top+e.height/2-i/2,left:e.left+e.width});break;case"bottom-right":d.css({top:e.top+e.height,left:e.left+e.width});break;case"top-right":d.css({top:e.top-i,left:e.left+f});break;case"top-left":d.css({top:e.top-i,left:e.left-g});break;case"bottom-left":d.css({top:e.top+c.outerHeight(),left:e.left-g});break;case"centered-right":d.css({top:e.top+i/2,left:e.left+f-g-3});break;case"bottom-right-inside":d.css({top:e.top+e.height,left:e.left+e.width-g});break;case"top-right-inside":d.css({top:e.top-i,left:e.left+f-g});break;case"top-left-inside":d.css({top:e.top-i,left:e.left});break;case"bottom-left-inside":d.css({top:e.top+c.outerHeight(),left:e.left})}}function o(c,d){if(c&&d){var e=["top","bottom","left","right","position"],f={};a.each(e,function(a,c){var d=b.placement[c];"undefined"!=typeof d&&(f[c]=d)}),d.css(f)}}function p(a){var c="maxlength";return b.allowOverMax&&(c="data-bs-mxl"),a.attr(c)||a.attr("size")}var q=a("body"),r={showOnReady:!1,alwaysShow:!1,threshold:10,warningClass:"label label-success",limitReachedClass:"label label-important label-danger",separator:" / ",preText:"",postText:"",showMaxLength:!0,placement:"bottom",message:null,showCharsTyped:!0,validate:!1,utf8:!1,appendToParent:!1,twoCharLinebreak:!0,allowOverMax:!1};return a.isFunction(b)&&!c&&(c=b,b={}),b=a.extend(r,b),this.each(function(){function c(){var c=k(g.val(),d,"0");d=p(g),f||(f=a('<span class="bootstrap-maxlength"></span>').css({display:"none",position:"absolute",whiteSpace:"nowrap",zIndex:1099}).html(c)),g.is("textarea")&&(g.data("maxlenghtsizex",g.outerWidth()),g.data("maxlenghtsizey",g.outerHeight()),g.mouseup(function(){(g.outerWidth()!==g.data("maxlenghtsizex")||g.outerHeight()!==g.data("maxlenghtsizey"))&&n(g,f),g.data("maxlenghtsizex",g.outerWidth()),g.data("maxlenghtsizey",g.outerHeight())})),b.appendToParent?(g.parent().append(f),g.parent().css("position","relative")):q.append(f);var e=h(g,p(g));l(e,g,d,f),n(g,f)}var d,f,g=a(this);a(window).resize(function(){f&&n(g,f)}),b.allowOverMax&&(a(this).attr("data-bs-mxl",a(this).attr("maxlength")),a(this).removeAttr("maxlength")),b.showOnReady?g.ready(function(){c()}):g.focus(function(){c()}),g.on("maxlength.reposition",function(){n(g,f)}),g.on("destroyed",function(){f&&f.remove()}),g.on("blur",function(){f&&!b.showOnReady&&f.remove()}),g.on("input",function(){var a=p(g),c=h(g,a),i=!0;return b.validate&&0>c?(e(g,a),i=!1):l(c,g,d,f),("bottom-right-inside"===b.placement||"top-right-inside"===b.placement)&&n(g,f),i})})}})}(jQuery);
/*
 *  Bootstrap TouchSpin - v3.0.1
 *  A mobile and touch friendly input spinner component for Bootstrap 3.
 *  http://www.virtuosoft.eu/code/bootstrap-touchspin/
 *
 *  Made by István Ujj-Mészáros
 *  Under Apache License v2.0 License
 */
!function(a){"use strict";function b(a,b){return a+".touchspin_"+b}function c(c,d){return a.map(c,function(a){return b(a,d)})}var d=0;a.fn.TouchSpin=function(b){if("destroy"===b)return void this.each(function(){var b=a(this),d=b.data();a(document).off(c(["mouseup","touchend","touchcancel","mousemove","touchmove","scroll","scrollstart"],d.spinnerid).join(" "))});var e={min:0,max:100,initval:"",step:1,decimals:0,stepinterval:100,forcestepdivisibility:"round",stepintervaldelay:500,verticalbuttons:!1,verticalupclass:"glyphicon glyphicon-chevron-up",verticaldownclass:"glyphicon glyphicon-chevron-down",prefix:"",postfix:"",prefix_extraclass:"",postfix_extraclass:"",booster:!0,boostat:10,maxboostedstep:!1,mousewheel:!0,buttondown_class:"btn btn-default",buttonup_class:"btn btn-default"},f={min:"min",max:"max",initval:"init-val",step:"step",decimals:"decimals",stepinterval:"step-interval",verticalbuttons:"vertical-buttons",verticalupclass:"vertical-up-class",verticaldownclass:"vertical-down-class",forcestepdivisibility:"force-step-divisibility",stepintervaldelay:"step-interval-delay",prefix:"prefix",postfix:"postfix",prefix_extraclass:"prefix-extra-class",postfix_extraclass:"postfix-extra-class",booster:"booster",boostat:"boostat",maxboostedstep:"max-boosted-step",mousewheel:"mouse-wheel",buttondown_class:"button-down-class",buttonup_class:"button-up-class"};return this.each(function(){function g(){if(!J.data("alreadyinitialized")){if(J.data("alreadyinitialized",!0),d+=1,J.data("spinnerid",d),!J.is("input"))return void console.log("Must be an input.");j(),h(),u(),m(),p(),q(),r(),s(),D.input.css("display","block")}}function h(){""!==B.initval&&""===J.val()&&J.val(B.initval)}function i(a){l(a),u();var b=D.input.val();""!==b&&(b=Number(D.input.val()),D.input.val(b.toFixed(B.decimals)))}function j(){B=a.extend({},e,K,k(),b)}function k(){var b={};return a.each(f,function(a,c){var d="bts-"+c;J.is("[data-"+d+"]")&&(b[a]=J.data(d))}),b}function l(b){B=a.extend({},B,b)}function m(){var a=J.val(),b=J.parent();""!==a&&(a=Number(a).toFixed(B.decimals)),J.data("initvalue",a).val(a),J.addClass("form-control"),b.hasClass("input-group")?n(b):o()}function n(b){b.addClass("bootstrap-touchspin");var c,d,e=J.prev(),f=J.next(),g='<span class="input-group-addon bootstrap-touchspin-prefix">'+B.prefix+"</span>",h='<span class="input-group-addon bootstrap-touchspin-postfix">'+B.postfix+"</span>";e.hasClass("input-group-btn")?(c='<button class="'+B.buttondown_class+' bootstrap-touchspin-down" type="button">-</button>',e.append(c)):(c='<span class="input-group-btn"><button class="'+B.buttondown_class+' bootstrap-touchspin-down" type="button">-</button></span>',a(c).insertBefore(J)),f.hasClass("input-group-btn")?(d='<button class="'+B.buttonup_class+' bootstrap-touchspin-up" type="button">+</button>',f.prepend(d)):(d='<span class="input-group-btn"><button class="'+B.buttonup_class+' bootstrap-touchspin-up" type="button">+</button></span>',a(d).insertAfter(J)),a(g).insertBefore(J),a(h).insertAfter(J),C=b}function o(){var b;b=B.verticalbuttons?'<div class="input-group bootstrap-touchspin"><span class="input-group-addon bootstrap-touchspin-prefix">'+B.prefix+'</span><span class="input-group-addon bootstrap-touchspin-postfix">'+B.postfix+'</span><span class="input-group-btn-vertical"><button class="'+B.buttondown_class+' bootstrap-touchspin-up" type="button"><i class="'+B.verticalupclass+'"></i></button><button class="'+B.buttonup_class+' bootstrap-touchspin-down" type="button"><i class="'+B.verticaldownclass+'"></i></button></span></div>':'<div class="input-group bootstrap-touchspin"><span class="input-group-btn"><button class="'+B.buttondown_class+' bootstrap-touchspin-down" type="button">-</button></span><span class="input-group-addon bootstrap-touchspin-prefix">'+B.prefix+'</span><span class="input-group-addon bootstrap-touchspin-postfix">'+B.postfix+'</span><span class="input-group-btn"><button class="'+B.buttonup_class+' bootstrap-touchspin-up" type="button">+</button></span></div>',C=a(b).insertBefore(J),a(".bootstrap-touchspin-prefix",C).after(J),J.hasClass("input-sm")?C.addClass("input-group-sm"):J.hasClass("input-lg")&&C.addClass("input-group-lg")}function p(){D={down:a(".bootstrap-touchspin-down",C),up:a(".bootstrap-touchspin-up",C),input:a("input",C),prefix:a(".bootstrap-touchspin-prefix",C).addClass(B.prefix_extraclass),postfix:a(".bootstrap-touchspin-postfix",C).addClass(B.postfix_extraclass)}}function q(){""===B.prefix&&D.prefix.hide(),""===B.postfix&&D.postfix.hide()}function r(){J.on("keydown",function(a){var b=a.keyCode||a.which;38===b?("up"!==M&&(w(),z()),a.preventDefault()):40===b&&("down"!==M&&(x(),y()),a.preventDefault())}),J.on("keyup",function(a){var b=a.keyCode||a.which;38===b?A():40===b&&A()}),J.on("blur",function(){u()}),D.down.on("keydown",function(a){var b=a.keyCode||a.which;(32===b||13===b)&&("down"!==M&&(x(),y()),a.preventDefault())}),D.down.on("keyup",function(a){var b=a.keyCode||a.which;(32===b||13===b)&&A()}),D.up.on("keydown",function(a){var b=a.keyCode||a.which;(32===b||13===b)&&("up"!==M&&(w(),z()),a.preventDefault())}),D.up.on("keyup",function(a){var b=a.keyCode||a.which;(32===b||13===b)&&A()}),D.down.on("mousedown.touchspin",function(a){D.down.off("touchstart.touchspin"),J.is(":disabled")||(x(),y(),a.preventDefault(),a.stopPropagation())}),D.down.on("touchstart.touchspin",function(a){D.down.off("mousedown.touchspin"),J.is(":disabled")||(x(),y(),a.preventDefault(),a.stopPropagation())}),D.up.on("mousedown.touchspin",function(a){D.up.off("touchstart.touchspin"),J.is(":disabled")||(w(),z(),a.preventDefault(),a.stopPropagation())}),D.up.on("touchstart.touchspin",function(a){D.up.off("mousedown.touchspin"),J.is(":disabled")||(w(),z(),a.preventDefault(),a.stopPropagation())}),D.up.on("mouseout touchleave touchend touchcancel",function(a){M&&(a.stopPropagation(),A())}),D.down.on("mouseout touchleave touchend touchcancel",function(a){M&&(a.stopPropagation(),A())}),D.down.on("mousemove touchmove",function(a){M&&(a.stopPropagation(),a.preventDefault())}),D.up.on("mousemove touchmove",function(a){M&&(a.stopPropagation(),a.preventDefault())}),a(document).on(c(["mouseup","touchend","touchcancel"],d).join(" "),function(a){M&&(a.preventDefault(),A())}),a(document).on(c(["mousemove","touchmove","scroll","scrollstart"],d).join(" "),function(a){M&&(a.preventDefault(),A())}),J.on("mousewheel DOMMouseScroll",function(a){if(B.mousewheel&&J.is(":focus")){var b=a.originalEvent.wheelDelta||-a.originalEvent.deltaY||-a.originalEvent.detail;a.stopPropagation(),a.preventDefault(),0>b?x():w()}})}function s(){J.on("touchspin.uponce",function(){A(),w()}),J.on("touchspin.downonce",function(){A(),x()}),J.on("touchspin.startupspin",function(){z()}),J.on("touchspin.startdownspin",function(){y()}),J.on("touchspin.stopspin",function(){A()}),J.on("touchspin.updatesettings",function(a,b){i(b)})}function t(a){switch(B.forcestepdivisibility){case"round":return(Math.round(a/B.step)*B.step).toFixed(B.decimals);case"floor":return(Math.floor(a/B.step)*B.step).toFixed(B.decimals);case"ceil":return(Math.ceil(a/B.step)*B.step).toFixed(B.decimals);default:return a}}function u(){var a,b,c;a=J.val(),""!==a&&(B.decimals>0&&"."===a||(b=parseFloat(a),isNaN(b)&&(b=0),c=b,b.toString()!==a&&(c=b),b<B.min&&(c=B.min),b>B.max&&(c=B.max),c=t(c),Number(a).toString()!==c.toString()&&(J.val(c),J.trigger("change"))))}function v(){if(B.booster){var a=Math.pow(2,Math.floor(L/B.boostat))*B.step;return B.maxboostedstep&&a>B.maxboostedstep&&(a=B.maxboostedstep,E=Math.round(E/a)*a),Math.max(B.step,a)}return B.step}function w(){u(),E=parseFloat(D.input.val()),isNaN(E)&&(E=0);var a=E,b=v();E+=b,E>B.max&&(E=B.max,J.trigger("touchspin.on.max"),A()),D.input.val(Number(E).toFixed(B.decimals)),a!==E&&J.trigger("change")}function x(){u(),E=parseFloat(D.input.val()),isNaN(E)&&(E=0);var a=E,b=v();E-=b,E<B.min&&(E=B.min,J.trigger("touchspin.on.min"),A()),D.input.val(E.toFixed(B.decimals)),a!==E&&J.trigger("change")}function y(){A(),L=0,M="down",J.trigger("touchspin.on.startspin"),J.trigger("touchspin.on.startdownspin"),H=setTimeout(function(){F=setInterval(function(){L++,x()},B.stepinterval)},B.stepintervaldelay)}function z(){A(),L=0,M="up",J.trigger("touchspin.on.startspin"),J.trigger("touchspin.on.startupspin"),I=setTimeout(function(){G=setInterval(function(){L++,w()},B.stepinterval)},B.stepintervaldelay)}function A(){switch(clearTimeout(H),clearTimeout(I),clearInterval(F),clearInterval(G),M){case"up":J.trigger("touchspin.on.stopupspin"),J.trigger("touchspin.on.stopspin");break;case"down":J.trigger("touchspin.on.stopdownspin"),J.trigger("touchspin.on.stopspin")}L=0,M=!1}var B,C,D,E,F,G,H,I,J=a(this),K=J.data(),L=0,M=!1;g()})}}(jQuery);
/**
* Bootstrap.js by @mdo and @fat, extended by @ArnoldDaniels.
* plugins: bootstrap-inputmask.js
* Copyright 2012 Twitter, Inc.
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/
!function(e){var t=window.orientation!==undefined,n=navigator.userAgent.toLowerCase().indexOf("android")>-1,r=function(t,r){if(n)return;this.$element=e(t),this.options=e.extend({},e.fn.inputmask.defaults,r),this.mask=String(r.mask),this.init(),this.listen(),this.checkVal()};r.prototype={init:function(){var t=this.options.definitions,n=this.mask.length;this.tests=[],this.partialPosition=this.mask.length,this.firstNonMaskPos=null,e.each(this.mask.split(""),e.proxy(function(e,r){r=="?"?(n--,this.partialPosition=e):t[r]?(this.tests.push(new RegExp(t[r])),this.firstNonMaskPos===null&&(this.firstNonMaskPos=this.tests.length-1)):this.tests.push(null)},this)),this.buffer=e.map(this.mask.split(""),e.proxy(function(e,n){if(e!="?")return t[e]?this.options.placeholder:e},this)),this.focusText=this.$element.val(),this.$element.data("rawMaskFn",e.proxy(function(){return e.map(this.buffer,function(e,t){return this.tests[t]&&e!=this.options.placeholder?e:null}).join("")},this))},listen:function(){if(this.$element.attr("readonly"))return;var t=(navigator.userAgent.match(/msie/i)?"paste":"input")+".mask";this.$element.on("unmask",e.proxy(this.unmask,this)).on("focus.mask",e.proxy(this.focusEvent,this)).on("blur.mask",e.proxy(this.blurEvent,this)).on("keydown.mask",e.proxy(this.keydownEvent,this)).on("keypress.mask",e.proxy(this.keypressEvent,this)).on(t,e.proxy(this.pasteEvent,this))},caret:function(e,t){if(this.$element.length===0)return;if(typeof e=="number")return t=typeof t=="number"?t:e,this.$element.each(function(){if(this.setSelectionRange)this.setSelectionRange(e,t);else if(this.createTextRange){var n=this.createTextRange();n.collapse(!0),n.moveEnd("character",t),n.moveStart("character",e),n.select()}});if(this.$element[0].setSelectionRange)e=this.$element[0].selectionStart,t=this.$element[0].selectionEnd;else if(document.selection&&document.selection.createRange){var n=document.selection.createRange();e=0-n.duplicate().moveStart("character",-1e5),t=e+n.text.length}return{begin:e,end:t}},seekNext:function(e){var t=this.mask.length;while(++e<=t&&!this.tests[e]);return e},seekPrev:function(e){while(--e>=0&&!this.tests[e]);return e},shiftL:function(e,t){var n=this.mask.length;if(e<0)return;for(var r=e,i=this.seekNext(t);r<n;r++)if(this.tests[r]){if(!(i<n&&this.tests[r].test(this.buffer[i])))break;this.buffer[r]=this.buffer[i],this.buffer[i]=this.options.placeholder,i=this.seekNext(i)}this.writeBuffer(),this.caret(Math.max(this.firstNonMaskPos,e))},shiftR:function(e){var t=this.mask.length;for(var n=e,r=this.options.placeholder;n<t;n++)if(this.tests[n]){var i=this.seekNext(n),s=this.buffer[n];this.buffer[n]=r;if(!(i<t&&this.tests[i].test(s)))break;r=s}},unmask:function(){this.$element.unbind(".mask").removeData("inputmask")},focusEvent:function(){this.focusText=this.$element.val();var t=this.mask.length,n=this.checkVal();this.writeBuffer();var r=this,i=function(){n==t?r.caret(0,n):r.caret(n)};e.browser.msie?i():setTimeout(i,0)},blurEvent:function(){this.checkVal(),this.$element.val()!=this.focusText&&this.$element.trigger("change")},keydownEvent:function(e){var n=e.which;if(n==8||n==46||t&&n==127){var r=this.caret(),i=r.begin,s=r.end;return s-i===0&&(i=n!=46?this.seekPrev(i):s=this.seekNext(i-1),s=n==46?this.seekNext(s):s),this.clearBuffer(i,s),this.shiftL(i,s-1),!1}if(n==27)return this.$element.val(this.focusText),this.caret(0,this.checkVal()),!1},keypressEvent:function(e){var t=this.mask.length,n=e.which,r=this.caret();if(e.ctrlKey||e.altKey||e.metaKey||n<32)return!0;if(n){r.end-r.begin!==0&&(this.clearBuffer(r.begin,r.end),this.shiftL(r.begin,r.end-1));var i=this.seekNext(r.begin-1);if(i<t){var s=String.fromCharCode(n);if(this.tests[i].test(s)){this.shiftR(i),this.buffer[i]=s,this.writeBuffer();var o=this.seekNext(i);this.caret(o)}}return!1}},pasteEvent:function(){var e=this;setTimeout(function(){e.caret(e.checkVal(!0))},0)},clearBuffer:function(e,t){var n=this.mask.length;for(var r=e;r<t&&r<n;r++)this.tests[r]&&(this.buffer[r]=this.options.placeholder)},writeBuffer:function(){return this.$element.val(this.buffer.join("")).val()},checkVal:function(e){var t=this.mask.length,n=this.$element.val(),r=-1;for(var i=0,s=0;i<t;i++)if(this.tests[i]){this.buffer[i]=this.options.placeholder;while(s++<n.length){var o=n.charAt(s-1);if(this.tests[i].test(o)){this.buffer[i]=o,r=i;break}}if(s>n.length)break}else this.buffer[i]==n.charAt(s)&&i!=this.partialPosition&&(s++,r=i);if(!e&&r+1<this.partialPosition)this.$element.val(""),this.clearBuffer(0,t);else if(e||r+1>=this.partialPosition)this.writeBuffer(),e||this.$element.val(this.$element.val().substring(0,r+1));return this.partialPosition?i:this.firstNonMaskPos}},e.fn.inputmask=function(t){return this.each(function(){var n=e(this),i=n.data("inputmask");i||n.data("inputmask",i=new r(this,t))})},e.fn.inputmask.defaults={mask:"",placeholder:"_",definitions:{9:"[0-9]",a:"[A-Za-z]","?":"[A-Za-z0-9]","*":"."}},e.fn.inputmask.Constructor=r,e(document).on("focus.inputmask.data-api","[data-mask]",function(t){var n=e(this);if(n.data("inputmask"))return;t.preventDefault(),n.inputmask(n.data())})}(window.jQuery)

/*
 *
 * More info at [www.dropzonejs.com](http://www.dropzonejs.com)
 *
 * Copyright (c) 2012, Matias Meno
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

(function() {
  var Dropzone, Emitter, camelize, contentLoaded, detectVerticalSquash, drawImageIOSFix, noop, without,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  noop = function() {};

  Emitter = (function() {
    function Emitter() {}

    Emitter.prototype.addEventListener = Emitter.prototype.on;

    Emitter.prototype.on = function(event, fn) {
      this._callbacks = this._callbacks || {};
      if (!this._callbacks[event]) {
        this._callbacks[event] = [];
      }
      this._callbacks[event].push(fn);
      return this;
    };

    Emitter.prototype.emit = function() {
      var args, callback, callbacks, event, _i, _len;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this._callbacks = this._callbacks || {};
      callbacks = this._callbacks[event];
      if (callbacks) {
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          callback.apply(this, args);
        }
      }
      return this;
    };

    Emitter.prototype.removeListener = Emitter.prototype.off;

    Emitter.prototype.removeAllListeners = Emitter.prototype.off;

    Emitter.prototype.removeEventListener = Emitter.prototype.off;

    Emitter.prototype.off = function(event, fn) {
      var callback, callbacks, i, _i, _len;
      if (!this._callbacks || arguments.length === 0) {
        this._callbacks = {};
        return this;
      }
      callbacks = this._callbacks[event];
      if (!callbacks) {
        return this;
      }
      if (arguments.length === 1) {
        delete this._callbacks[event];
        return this;
      }
      for (i = _i = 0, _len = callbacks.length; _i < _len; i = ++_i) {
        callback = callbacks[i];
        if (callback === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }
      return this;
    };

    return Emitter;

  })();

  Dropzone = (function(_super) {
    var extend, resolveOption;

    __extends(Dropzone, _super);

    Dropzone.prototype.Emitter = Emitter;


    /*
    This is a list of all available events you can register on a dropzone object.
    
    You can register an event handler like this:
    
        dropzone.on("dragEnter", function() { });
     */

    Dropzone.prototype.events = ["drop", "dragstart", "dragend", "dragenter", "dragover", "dragleave", "addedfile", "removedfile", "thumbnail", "error", "errormultiple", "processing", "processingmultiple", "uploadprogress", "totaluploadprogress", "sending", "sendingmultiple", "success", "successmultiple", "canceled", "canceledmultiple", "complete", "completemultiple", "reset", "maxfilesexceeded", "maxfilesreached", "queuecomplete"];

    Dropzone.prototype.defaultOptions = {
      url: null,
      method: "post",
      withCredentials: false,
      parallelUploads: 2,
      uploadMultiple: false,
      maxFilesize: 256,
      paramName: "file",
      createImageThumbnails: true,
      maxThumbnailFilesize: 10,
      thumbnailWidth: 120,
      thumbnailHeight: 120,
      filesizeBase: 1000,
      maxFiles: null,
      filesizeBase: 1000,
      params: {},
      clickable: true,
      ignoreHiddenFiles: true,
      acceptedFiles: null,
      acceptedMimeTypes: null,
      autoProcessQueue: true,
      autoQueue: true,
      addRemoveLinks: false,
      previewsContainer: null,
      capture: null,
      dictDefaultMessage: "Drop files here to upload",
      dictFallbackMessage: "Your browser does not support drag'n'drop file uploads.",
      dictFallbackText: "Please use the fallback form below to upload your files like in the olden days.",
      dictFileTooBig: "File is too big ({{filesize}}MiB). Max filesize: {{maxFilesize}}MiB.",
      dictInvalidFileType: "You can't upload files of this type.",
      dictResponseError: "Server responded with {{statusCode}} code.",
      dictCancelUpload: "Cancel upload",
      dictCancelUploadConfirmation: "Are you sure you want to cancel this upload?",
      dictRemoveFile: "Remove file",
      dictRemoveFileConfirmation: null,
      dictMaxFilesExceeded: "You can not upload any more files.",
      accept: function(file, done) {
        return done();
      },
      init: function() {
        return noop;
      },
      forceFallback: false,
      fallback: function() {
        var child, messageElement, span, _i, _len, _ref;
        this.element.className = "" + this.element.className + " dz-browser-not-supported";
        _ref = this.element.getElementsByTagName("div");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (/(^| )dz-message($| )/.test(child.className)) {
            messageElement = child;
            child.className = "dz-message";
            continue;
          }
        }
        if (!messageElement) {
          messageElement = Dropzone.createElement("<div class=\"dz-message\"><span></span></div>");
          this.element.appendChild(messageElement);
        }
        span = messageElement.getElementsByTagName("span")[0];
        if (span) {
          span.textContent = this.options.dictFallbackMessage;
        }
        return this.element.appendChild(this.getFallbackForm());
      },
      resize: function(file) {
        var info, srcRatio, trgRatio;
        info = {
          srcX: 0,
          srcY: 0,
          srcWidth: file.width,
          srcHeight: file.height
        };
        srcRatio = file.width / file.height;
        info.optWidth = this.options.thumbnailWidth;
        info.optHeight = this.options.thumbnailHeight;
        if ((info.optWidth == null) && (info.optHeight == null)) {
          info.optWidth = info.srcWidth;
          info.optHeight = info.srcHeight;
        } else if (info.optWidth == null) {
          info.optWidth = srcRatio * info.optHeight;
        } else if (info.optHeight == null) {
          info.optHeight = (1 / srcRatio) * info.optWidth;
        }
        trgRatio = info.optWidth / info.optHeight;
        if (file.height < info.optHeight || file.width < info.optWidth) {
          info.trgHeight = info.srcHeight;
          info.trgWidth = info.srcWidth;
        } else {
          if (srcRatio > trgRatio) {
            info.srcHeight = file.height;
            info.srcWidth = info.srcHeight * trgRatio;
          } else {
            info.srcWidth = file.width;
            info.srcHeight = info.srcWidth / trgRatio;
          }
        }
        info.srcX = (file.width - info.srcWidth) / 2;
        info.srcY = (file.height - info.srcHeight) / 2;
        return info;
      },

      /*
      Those functions register themselves to the events on init and handle all
      the user interface specific stuff. Overwriting them won't break the upload
      but can break the way it's displayed.
      You can overwrite them if you don't like the default behavior. If you just
      want to add an additional event handler, register it on the dropzone object
      and don't overwrite those options.
       */
      drop: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      dragstart: noop,
      dragend: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      dragenter: function(e) {
        return this.element.classList.add("dz-drag-hover");
      },
      dragover: function(e) {
        return this.element.classList.add("dz-drag-hover");
      },
      dragleave: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      paste: noop,
      reset: function() {
        return this.element.classList.remove("dz-started");
      },
      addedfile: function(file) {
        var node, removeFileEvent, removeLink, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
        if (this.element === this.previewsContainer) {
          this.element.classList.add("dz-started");
        }
        if (this.previewsContainer) {
          file.previewElement = Dropzone.createElement(this.options.previewTemplate.trim());
          file.previewTemplate = file.previewElement;
          this.previewsContainer.appendChild(file.previewElement);
          _ref = file.previewElement.querySelectorAll("[data-dz-name]");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.textContent = file.name;
          }
          _ref1 = file.previewElement.querySelectorAll("[data-dz-size]");
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            node = _ref1[_j];
            node.innerHTML = this.filesize(file.size);
          }
          if (this.options.addRemoveLinks) {
            file._removeLink = Dropzone.createElement("<a class=\"dz-remove\" href=\"javascript:undefined;\" data-dz-remove>" + this.options.dictRemoveFile + "</a>");
            file.previewElement.appendChild(file._removeLink);
          }
          removeFileEvent = (function(_this) {
            return function(e) {
              e.preventDefault();
              e.stopPropagation();
              if (file.status === Dropzone.UPLOADING) {
                return Dropzone.confirm(_this.options.dictCancelUploadConfirmation, function() {
                  return _this.removeFile(file);
                });
              } else {
                if (_this.options.dictRemoveFileConfirmation) {
                  return Dropzone.confirm(_this.options.dictRemoveFileConfirmation, function() {
                    return _this.removeFile(file);
                  });
                } else {
                  return _this.removeFile(file);
                }
              }
            };
          })(this);
          _ref2 = file.previewElement.querySelectorAll("[data-dz-remove]");
          _results = [];
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            removeLink = _ref2[_k];
            _results.push(removeLink.addEventListener("click", removeFileEvent));
          }
          return _results;
        }
      },
      removedfile: function(file) {
        var _ref;
        if (file.previewElement) {
          if ((_ref = file.previewElement) != null) {
            _ref.parentNode.removeChild(file.previewElement);
          }
        }
        return this._updateMaxFilesReachedClass();
      },
      thumbnail: function(file, dataUrl) {
        var thumbnailElement, _i, _len, _ref;
        if (file.previewElement) {
          file.previewElement.classList.remove("dz-file-preview");
          _ref = file.previewElement.querySelectorAll("[data-dz-thumbnail]");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            thumbnailElement = _ref[_i];
            thumbnailElement.alt = file.name;
            thumbnailElement.src = dataUrl;
          }
          return setTimeout(((function(_this) {
            return function() {
              return file.previewElement.classList.add("dz-image-preview");
            };
          })(this)), 1);
        }
      },
      error: function(file, message) {
        var node, _i, _len, _ref, _results;
        if (file.previewElement) {
          file.previewElement.classList.add("dz-error");
          if (typeof message !== "String" && message.error) {
            message = message.error;
          }
          _ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            _results.push(node.textContent = message);
          }
          return _results;
        }
      },
      errormultiple: noop,
      processing: function(file) {
        if (file.previewElement) {
          file.previewElement.classList.add("dz-processing");
          if (file._removeLink) {
            return file._removeLink.textContent = this.options.dictCancelUpload;
          }
        }
      },
      processingmultiple: noop,
      uploadprogress: function(file, progress, bytesSent) {
        var node, _i, _len, _ref, _results;
        if (file.previewElement) {
          _ref = file.previewElement.querySelectorAll("[data-dz-uploadprogress]");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            if (node.nodeName === 'PROGRESS') {
              _results.push(node.value = progress);
            } else {
              _results.push(node.style.width = "" + progress + "%");
            }
          }
          return _results;
        }
      },
      totaluploadprogress: noop,
      sending: noop,
      sendingmultiple: noop,
      success: function(file) {
        if (file.previewElement) {
          return file.previewElement.classList.add("dz-success");
        }
      },
      successmultiple: noop,
      canceled: function(file) {
        return this.emit("error", file, "Upload canceled.");
      },
      canceledmultiple: noop,
      complete: function(file) {
        if (file._removeLink) {
          file._removeLink.textContent = this.options.dictRemoveFile;
        }
        if (file.previewElement) {
          return file.previewElement.classList.add("dz-complete");
        }
      },
      completemultiple: noop,
      maxfilesexceeded: noop,
      maxfilesreached: noop,
      queuecomplete: noop,
      previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n  <div class=\"dz-image\"><img data-dz-thumbnail /></div>\n  <div class=\"dz-details\">\n    <div class=\"dz-size\"><span data-dz-size></span></div>\n    <div class=\"dz-filename\"><span data-dz-name></span></div>\n  </div>\n  <div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div>\n  <div class=\"dz-error-message\"><span data-dz-errormessage></span></div>\n  <div class=\"dz-success-mark\">\n    <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n      <title>Check</title>\n      <defs></defs>\n      <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n        <path d=\"M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" stroke-opacity=\"0.198794158\" stroke=\"#747474\" fill-opacity=\"0.816519475\" fill=\"#FFFFFF\" sketch:type=\"MSShapeGroup\"></path>\n      </g>\n    </svg>\n  </div>\n  <div class=\"dz-error-mark\">\n    <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n      <title>Error</title>\n      <defs></defs>\n      <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n        <g id=\"Check-+-Oval-2\" sketch:type=\"MSLayerGroup\" stroke=\"#747474\" stroke-opacity=\"0.198794158\" fill=\"#FFFFFF\" fill-opacity=\"0.816519475\">\n          <path d=\"M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" sketch:type=\"MSShapeGroup\"></path>\n        </g>\n      </g>\n    </svg>\n  </div>\n</div>"
    };

    extend = function() {
      var key, object, objects, target, val, _i, _len;
      target = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        for (key in object) {
          val = object[key];
          target[key] = val;
        }
      }
      return target;
    };

    function Dropzone(element, options) {
      var elementOptions, fallback, _ref;
      this.element = element;
      this.version = Dropzone.version;
      this.defaultOptions.previewTemplate = this.defaultOptions.previewTemplate.replace(/\n*/g, "");
      this.clickableElements = [];
      this.listeners = [];
      this.files = [];
      if (typeof this.element === "string") {
        this.element = document.querySelector(this.element);
      }
      if (!(this.element && (this.element.nodeType != null))) {
        throw new Error("Invalid dropzone element.");
      }
      if (this.element.dropzone) {
        throw new Error("Dropzone already attached.");
      }
      Dropzone.instances.push(this);
      this.element.dropzone = this;
      elementOptions = (_ref = Dropzone.optionsForElement(this.element)) != null ? _ref : {};
      this.options = extend({}, this.defaultOptions, elementOptions, options != null ? options : {});
      if (this.options.forceFallback || !Dropzone.isBrowserSupported()) {
        return this.options.fallback.call(this);
      }
      if (this.options.url == null) {
        this.options.url = this.element.getAttribute("action");
      }
      if (!this.options.url) {
        throw new Error("No URL provided.");
      }
      if (this.options.acceptedFiles && this.options.acceptedMimeTypes) {
        throw new Error("You can't provide both 'acceptedFiles' and 'acceptedMimeTypes'. 'acceptedMimeTypes' is deprecated.");
      }
      if (this.options.acceptedMimeTypes) {
        this.options.acceptedFiles = this.options.acceptedMimeTypes;
        delete this.options.acceptedMimeTypes;
      }
      this.options.method = this.options.method.toUpperCase();
      if ((fallback = this.getExistingFallback()) && fallback.parentNode) {
        fallback.parentNode.removeChild(fallback);
      }
      if (this.options.previewsContainer !== false) {
        if (this.options.previewsContainer) {
          this.previewsContainer = Dropzone.getElement(this.options.previewsContainer, "previewsContainer");
        } else {
          this.previewsContainer = this.element;
        }
      }
      if (this.options.clickable) {
        if (this.options.clickable === true) {
          this.clickableElements = [this.element];
        } else {
          this.clickableElements = Dropzone.getElements(this.options.clickable, "clickable");
        }
      }
      this.init();
    }

    Dropzone.prototype.getAcceptedFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.accepted) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getRejectedFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (!file.accepted) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getFilesWithStatus = function(status) {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status === status) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getQueuedFiles = function() {
      return this.getFilesWithStatus(Dropzone.QUEUED);
    };

    Dropzone.prototype.getUploadingFiles = function() {
      return this.getFilesWithStatus(Dropzone.UPLOADING);
    };

    Dropzone.prototype.getActiveFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status === Dropzone.UPLOADING || file.status === Dropzone.QUEUED) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.init = function() {
      var eventName, noPropagation, setupHiddenFileInput, _i, _len, _ref, _ref1;
      if (this.element.tagName === "form") {
        this.element.setAttribute("enctype", "multipart/form-data");
      }
      if (this.element.classList.contains("dropzone") && !this.element.querySelector(".dz-message")) {
        this.element.appendChild(Dropzone.createElement("<div class=\"dz-default dz-message\"><span>" + this.options.dictDefaultMessage + "</span></div>"));
      }
      if (this.clickableElements.length) {
        setupHiddenFileInput = (function(_this) {
          return function() {
            if (_this.hiddenFileInput) {
              document.body.removeChild(_this.hiddenFileInput);
            }
            _this.hiddenFileInput = document.createElement("input");
            _this.hiddenFileInput.setAttribute("type", "file");
            if ((_this.options.maxFiles == null) || _this.options.maxFiles > 1) {
              _this.hiddenFileInput.setAttribute("multiple", "multiple");
            }
            _this.hiddenFileInput.className = "dz-hidden-input";
            if (_this.options.acceptedFiles != null) {
              _this.hiddenFileInput.setAttribute("accept", _this.options.acceptedFiles);
            }
            if (_this.options.capture != null) {
              _this.hiddenFileInput.setAttribute("capture", _this.options.capture);
            }
            _this.hiddenFileInput.style.visibility = "hidden";
            _this.hiddenFileInput.style.position = "absolute";
            _this.hiddenFileInput.style.top = "0";
            _this.hiddenFileInput.style.left = "0";
            _this.hiddenFileInput.style.height = "0";
            _this.hiddenFileInput.style.width = "0";
            document.body.appendChild(_this.hiddenFileInput);
            return _this.hiddenFileInput.addEventListener("change", function() {
              var file, files, _i, _len;
              files = _this.hiddenFileInput.files;
              if (files.length) {
                for (_i = 0, _len = files.length; _i < _len; _i++) {
                  file = files[_i];
                  _this.addFile(file);
                }
              }
              return setupHiddenFileInput();
            });
          };
        })(this);
        setupHiddenFileInput();
      }
      this.URL = (_ref = window.URL) != null ? _ref : window.webkitURL;
      _ref1 = this.events;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        eventName = _ref1[_i];
        this.on(eventName, this.options[eventName]);
      }
      this.on("uploadprogress", (function(_this) {
        return function() {
          return _this.updateTotalUploadProgress();
        };
      })(this));
      this.on("removedfile", (function(_this) {
        return function() {
          return _this.updateTotalUploadProgress();
        };
      })(this));
      this.on("canceled", (function(_this) {
        return function(file) {
          return _this.emit("complete", file);
        };
      })(this));
      this.on("complete", (function(_this) {
        return function(file) {
          if (_this.getUploadingFiles().length === 0 && _this.getQueuedFiles().length === 0) {
            return setTimeout((function() {
              return _this.emit("queuecomplete");
            }), 0);
          }
        };
      })(this));
      noPropagation = function(e) {
        e.stopPropagation();
        if (e.preventDefault) {
          return e.preventDefault();
        } else {
          return e.returnValue = false;
        }
      };
      this.listeners = [
        {
          element: this.element,
          events: {
            "dragstart": (function(_this) {
              return function(e) {
                return _this.emit("dragstart", e);
              };
            })(this),
            "dragenter": (function(_this) {
              return function(e) {
                noPropagation(e);
                return _this.emit("dragenter", e);
              };
            })(this),
            "dragover": (function(_this) {
              return function(e) {
                var efct;
                try {
                  efct = e.dataTransfer.effectAllowed;
                } catch (_error) {}
                e.dataTransfer.dropEffect = 'move' === efct || 'linkMove' === efct ? 'move' : 'copy';
                noPropagation(e);
                return _this.emit("dragover", e);
              };
            })(this),
            "dragleave": (function(_this) {
              return function(e) {
                return _this.emit("dragleave", e);
              };
            })(this),
            "drop": (function(_this) {
              return function(e) {
                noPropagation(e);
                return _this.drop(e);
              };
            })(this),
            "dragend": (function(_this) {
              return function(e) {
                return _this.emit("dragend", e);
              };
            })(this)
          }
        }
      ];
      this.clickableElements.forEach((function(_this) {
        return function(clickableElement) {
          return _this.listeners.push({
            element: clickableElement,
            events: {
              "click": function(evt) {
                if ((clickableElement !== _this.element) || (evt.target === _this.element || Dropzone.elementInside(evt.target, _this.element.querySelector(".dz-message")))) {
                  return _this.hiddenFileInput.click();
                }
              }
            }
          });
        };
      })(this));
      this.enable();
      return this.options.init.call(this);
    };

    Dropzone.prototype.destroy = function() {
      var _ref;
      this.disable();
      this.removeAllFiles(true);
      if ((_ref = this.hiddenFileInput) != null ? _ref.parentNode : void 0) {
        this.hiddenFileInput.parentNode.removeChild(this.hiddenFileInput);
        this.hiddenFileInput = null;
      }
      delete this.element.dropzone;
      return Dropzone.instances.splice(Dropzone.instances.indexOf(this), 1);
    };

    Dropzone.prototype.updateTotalUploadProgress = function() {
      var activeFiles, file, totalBytes, totalBytesSent, totalUploadProgress, _i, _len, _ref;
      totalBytesSent = 0;
      totalBytes = 0;
      activeFiles = this.getActiveFiles();
      if (activeFiles.length) {
        _ref = this.getActiveFiles();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          totalBytesSent += file.upload.bytesSent;
          totalBytes += file.upload.total;
        }
        totalUploadProgress = 100 * totalBytesSent / totalBytes;
      } else {
        totalUploadProgress = 100;
      }
      return this.emit("totaluploadprogress", totalUploadProgress, totalBytes, totalBytesSent);
    };

    Dropzone.prototype._getParamName = function(n) {
      if (typeof this.options.paramName === "function") {
        return this.options.paramName(n);
      } else {
        return "" + this.options.paramName + (this.options.uploadMultiple ? "[" + n + "]" : "");
      }
    };

    Dropzone.prototype.getFallbackForm = function() {
      var existingFallback, fields, fieldsString, form;
      if (existingFallback = this.getExistingFallback()) {
        return existingFallback;
      }
      fieldsString = "<div class=\"dz-fallback\">";
      if (this.options.dictFallbackText) {
        fieldsString += "<p>" + this.options.dictFallbackText + "</p>";
      }
      fieldsString += "<input type=\"file\" name=\"" + (this._getParamName(0)) + "\" " + (this.options.uploadMultiple ? 'multiple="multiple"' : void 0) + " /><input type=\"submit\" value=\"Upload!\"></div>";
      fields = Dropzone.createElement(fieldsString);
      if (this.element.tagName !== "FORM") {
        form = Dropzone.createElement("<form action=\"" + this.options.url + "\" enctype=\"multipart/form-data\" method=\"" + this.options.method + "\"></form>");
        form.appendChild(fields);
      } else {
        this.element.setAttribute("enctype", "multipart/form-data");
        this.element.setAttribute("method", this.options.method);
      }
      return form != null ? form : fields;
    };

    Dropzone.prototype.getExistingFallback = function() {
      var fallback, getFallback, tagName, _i, _len, _ref;
      getFallback = function(elements) {
        var el, _i, _len;
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          if (/(^| )fallback($| )/.test(el.className)) {
            return el;
          }
        }
      };
      _ref = ["div", "form"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tagName = _ref[_i];
        if (fallback = getFallback(this.element.getElementsByTagName(tagName))) {
          return fallback;
        }
      }
    };

    Dropzone.prototype.setupEventListeners = function() {
      var elementListeners, event, listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elementListeners = _ref[_i];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = elementListeners.events;
          _results1 = [];
          for (event in _ref1) {
            listener = _ref1[event];
            _results1.push(elementListeners.element.addEventListener(event, listener, false));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Dropzone.prototype.removeEventListeners = function() {
      var elementListeners, event, listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elementListeners = _ref[_i];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = elementListeners.events;
          _results1 = [];
          for (event in _ref1) {
            listener = _ref1[event];
            _results1.push(elementListeners.element.removeEventListener(event, listener, false));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Dropzone.prototype.disable = function() {
      var file, _i, _len, _ref, _results;
      this.clickableElements.forEach(function(element) {
        return element.classList.remove("dz-clickable");
      });
      this.removeEventListeners();
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        _results.push(this.cancelUpload(file));
      }
      return _results;
    };

    Dropzone.prototype.enable = function() {
      this.clickableElements.forEach(function(element) {
        return element.classList.add("dz-clickable");
      });
      return this.setupEventListeners();
    };

    Dropzone.prototype.filesize = function(size) {
      var cutoff, i, selectedSize, selectedUnit, unit, units, _i, _len;
      units = ['TB', 'GB', 'MB', 'KB', 'b'];
      selectedSize = selectedUnit = null;
      for (i = _i = 0, _len = units.length; _i < _len; i = ++_i) {
        unit = units[i];
        cutoff = Math.pow(this.options.filesizeBase, 4 - i) / 10;
        if (size >= cutoff) {
          selectedSize = size / Math.pow(this.options.filesizeBase, 4 - i);
          selectedUnit = unit;
          break;
        }
      }
      selectedSize = Math.round(10 * selectedSize) / 10;
      return "<strong>" + selectedSize + "</strong> " + selectedUnit;
    };

    Dropzone.prototype._updateMaxFilesReachedClass = function() {
      if ((this.options.maxFiles != null) && this.getAcceptedFiles().length >= this.options.maxFiles) {
        if (this.getAcceptedFiles().length === this.options.maxFiles) {
          this.emit('maxfilesreached', this.files);
        }
        return this.element.classList.add("dz-max-files-reached");
      } else {
        return this.element.classList.remove("dz-max-files-reached");
      }
    };

    Dropzone.prototype.drop = function(e) {
      var files, items;
      if (!e.dataTransfer) {
        return;
      }
      this.emit("drop", e);
      files = e.dataTransfer.files;
      if (files.length) {
        items = e.dataTransfer.items;
        if (items && items.length && (items[0].webkitGetAsEntry != null)) {
          this._addFilesFromItems(items);
        } else {
          this.handleFiles(files);
        }
      }
    };

    Dropzone.prototype.paste = function(e) {
      var items, _ref;
      if ((e != null ? (_ref = e.clipboardData) != null ? _ref.items : void 0 : void 0) == null) {
        return;
      }
      this.emit("paste", e);
      items = e.clipboardData.items;
      if (items.length) {
        return this._addFilesFromItems(items);
      }
    };

    Dropzone.prototype.handleFiles = function(files) {
      var file, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        _results.push(this.addFile(file));
      }
      return _results;
    };

    Dropzone.prototype._addFilesFromItems = function(items) {
      var entry, item, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if ((item.webkitGetAsEntry != null) && (entry = item.webkitGetAsEntry())) {
          if (entry.isFile) {
            _results.push(this.addFile(item.getAsFile()));
          } else if (entry.isDirectory) {
            _results.push(this._addFilesFromDirectory(entry, entry.name));
          } else {
            _results.push(void 0);
          }
        } else if (item.getAsFile != null) {
          if ((item.kind == null) || item.kind === "file") {
            _results.push(this.addFile(item.getAsFile()));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Dropzone.prototype._addFilesFromDirectory = function(directory, path) {
      var dirReader, entriesReader;
      dirReader = directory.createReader();
      entriesReader = (function(_this) {
        return function(entries) {
          var entry, _i, _len;
          for (_i = 0, _len = entries.length; _i < _len; _i++) {
            entry = entries[_i];
            if (entry.isFile) {
              entry.file(function(file) {
                if (_this.options.ignoreHiddenFiles && file.name.substring(0, 1) === '.') {
                  return;
                }
                file.fullPath = "" + path + "/" + file.name;
                return _this.addFile(file);
              });
            } else if (entry.isDirectory) {
              _this._addFilesFromDirectory(entry, "" + path + "/" + entry.name);
            }
          }
        };
      })(this);
      return dirReader.readEntries(entriesReader, function(error) {
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log(error) : void 0 : void 0;
      });
    };

    Dropzone.prototype.accept = function(file, done) {
      if (file.size > this.options.maxFilesize * 1024 * 1024) {
        return done(this.options.dictFileTooBig.replace("{{filesize}}", Math.round(file.size / 1024 / 10.24) / 100).replace("{{maxFilesize}}", this.options.maxFilesize));
      } else if (!Dropzone.isValidFile(file, this.options.acceptedFiles)) {
        return done(this.options.dictInvalidFileType);
      } else if ((this.options.maxFiles != null) && this.getAcceptedFiles().length >= this.options.maxFiles) {
        done(this.options.dictMaxFilesExceeded.replace("{{maxFiles}}", this.options.maxFiles));
        return this.emit("maxfilesexceeded", file);
      } else {
        return this.options.accept.call(this, file, done);
      }
    };

    Dropzone.prototype.addFile = function(file) {
      file.upload = {
        progress: 0,
        total: file.size,
        bytesSent: 0
      };
      this.files.push(file);
      file.status = Dropzone.ADDED;
      this.emit("addedfile", file);
      this._enqueueThumbnail(file);
      return this.accept(file, (function(_this) {
        return function(error) {
          if (error) {
            file.accepted = false;
            _this._errorProcessing([file], error);
          } else {
            file.accepted = true;
            if (_this.options.autoQueue) {
              _this.enqueueFile(file);
            }
          }
          return _this._updateMaxFilesReachedClass();
        };
      })(this));
    };

    Dropzone.prototype.enqueueFiles = function(files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        this.enqueueFile(file);
      }
      return null;
    };

    Dropzone.prototype.enqueueFile = function(file) {
      if (file.status === Dropzone.ADDED && file.accepted === true) {
        file.status = Dropzone.QUEUED;
        if (this.options.autoProcessQueue) {
          return setTimeout(((function(_this) {
            return function() {
              return _this.processQueue();
            };
          })(this)), 0);
        }
      } else {
        throw new Error("This file can't be queued because it has already been processed or was rejected.");
      }
    };

    Dropzone.prototype._thumbnailQueue = [];

    Dropzone.prototype._processingThumbnail = false;

    Dropzone.prototype._enqueueThumbnail = function(file) {
      if (this.options.createImageThumbnails && file.type.match(/image.*/) && file.size <= this.options.maxThumbnailFilesize * 1024 * 1024) {
        this._thumbnailQueue.push(file);
        return setTimeout(((function(_this) {
          return function() {
            return _this._processThumbnailQueue();
          };
        })(this)), 0);
      }
    };

    Dropzone.prototype._processThumbnailQueue = function() {
      if (this._processingThumbnail || this._thumbnailQueue.length === 0) {
        return;
      }
      this._processingThumbnail = true;
      return this.createThumbnail(this._thumbnailQueue.shift(), (function(_this) {
        return function() {
          _this._processingThumbnail = false;
          return _this._processThumbnailQueue();
        };
      })(this));
    };

    Dropzone.prototype.removeFile = function(file) {
      if (file.status === Dropzone.UPLOADING) {
        this.cancelUpload(file);
      }
      this.files = without(this.files, file);
      this.emit("removedfile", file);
      if (this.files.length === 0) {
        return this.emit("reset");
      }
    };

    Dropzone.prototype.removeAllFiles = function(cancelIfNecessary) {
      var file, _i, _len, _ref;
      if (cancelIfNecessary == null) {
        cancelIfNecessary = false;
      }
      _ref = this.files.slice();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status !== Dropzone.UPLOADING || cancelIfNecessary) {
          this.removeFile(file);
        }
      }
      return null;
    };

    Dropzone.prototype.createThumbnail = function(file, callback) {
      var fileReader;
      fileReader = new FileReader;
      fileReader.onload = (function(_this) {
        return function() {
          if (file.type === "image/svg+xml") {
            _this.emit("thumbnail", file, fileReader.result);
            if (callback != null) {
              callback();
            }
            return;
          }
          return _this.createThumbnailFromUrl(file, fileReader.result, callback);
        };
      })(this);
      return fileReader.readAsDataURL(file);
    };

    Dropzone.prototype.createThumbnailFromUrl = function(file, imageUrl, callback) {
      var img;
      img = document.createElement("img");
      img.onload = (function(_this) {
        return function() {
          var canvas, ctx, resizeInfo, thumbnail, _ref, _ref1, _ref2, _ref3;
          file.width = img.width;
          file.height = img.height;
          resizeInfo = _this.options.resize.call(_this, file);
          if (resizeInfo.trgWidth == null) {
            resizeInfo.trgWidth = resizeInfo.optWidth;
          }
          if (resizeInfo.trgHeight == null) {
            resizeInfo.trgHeight = resizeInfo.optHeight;
          }
          canvas = document.createElement("canvas");
          ctx = canvas.getContext("2d");
          canvas.width = resizeInfo.trgWidth;
          canvas.height = resizeInfo.trgHeight;
          drawImageIOSFix(ctx, img, (_ref = resizeInfo.srcX) != null ? _ref : 0, (_ref1 = resizeInfo.srcY) != null ? _ref1 : 0, resizeInfo.srcWidth, resizeInfo.srcHeight, (_ref2 = resizeInfo.trgX) != null ? _ref2 : 0, (_ref3 = resizeInfo.trgY) != null ? _ref3 : 0, resizeInfo.trgWidth, resizeInfo.trgHeight);
          thumbnail = canvas.toDataURL("image/png");
          _this.emit("thumbnail", file, thumbnail);
          if (callback != null) {
            return callback();
          }
        };
      })(this);
      if (callback != null) {
        img.onerror = callback;
      }
      return img.src = imageUrl;
    };

    Dropzone.prototype.processQueue = function() {
      var i, parallelUploads, processingLength, queuedFiles;
      parallelUploads = this.options.parallelUploads;
      processingLength = this.getUploadingFiles().length;
      i = processingLength;
      if (processingLength >= parallelUploads) {
        return;
      }
      queuedFiles = this.getQueuedFiles();
      if (!(queuedFiles.length > 0)) {
        return;
      }
      if (this.options.uploadMultiple) {
        return this.processFiles(queuedFiles.slice(0, parallelUploads - processingLength));
      } else {
        while (i < parallelUploads) {
          if (!queuedFiles.length) {
            return;
          }
          this.processFile(queuedFiles.shift());
          i++;
        }
      }
    };

    Dropzone.prototype.processFile = function(file) {
      return this.processFiles([file]);
    };

    Dropzone.prototype.processFiles = function(files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.processing = true;
        file.status = Dropzone.UPLOADING;
        this.emit("processing", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("processingmultiple", files);
      }
      return this.uploadFiles(files);
    };

    Dropzone.prototype._getFilesWithXhr = function(xhr) {
      var file, files;
      return files = (function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          if (file.xhr === xhr) {
            _results.push(file);
          }
        }
        return _results;
      }).call(this);
    };

    Dropzone.prototype.cancelUpload = function(file) {
      var groupedFile, groupedFiles, _i, _j, _len, _len1, _ref;
      if (file.status === Dropzone.UPLOADING) {
        groupedFiles = this._getFilesWithXhr(file.xhr);
        for (_i = 0, _len = groupedFiles.length; _i < _len; _i++) {
          groupedFile = groupedFiles[_i];
          groupedFile.status = Dropzone.CANCELED;
        }
        file.xhr.abort();
        for (_j = 0, _len1 = groupedFiles.length; _j < _len1; _j++) {
          groupedFile = groupedFiles[_j];
          this.emit("canceled", groupedFile);
        }
        if (this.options.uploadMultiple) {
          this.emit("canceledmultiple", groupedFiles);
        }
      } else if ((_ref = file.status) === Dropzone.ADDED || _ref === Dropzone.QUEUED) {
        file.status = Dropzone.CANCELED;
        this.emit("canceled", file);
        if (this.options.uploadMultiple) {
          this.emit("canceledmultiple", [file]);
        }
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    resolveOption = function() {
      var args, option;
      option = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (typeof option === 'function') {
        return option.apply(this, args);
      }
      return option;
    };

    Dropzone.prototype.uploadFile = function(file) {
      return this.uploadFiles([file]);
    };

    Dropzone.prototype.uploadFiles = function(files) {
      var file, formData, handleError, headerName, headerValue, headers, i, input, inputName, inputType, key, method, option, progressObj, response, updateProgress, url, value, xhr, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      xhr = new XMLHttpRequest();
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.xhr = xhr;
      }
      method = resolveOption(this.options.method, files);
      url = resolveOption(this.options.url, files);
      xhr.open(method, url, true);
      xhr.withCredentials = !!this.options.withCredentials;
      response = null;
      handleError = (function(_this) {
        return function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
            file = files[_j];
            _results.push(_this._errorProcessing(files, response || _this.options.dictResponseError.replace("{{statusCode}}", xhr.status), xhr));
          }
          return _results;
        };
      })(this);
      updateProgress = (function(_this) {
        return function(e) {
          var allFilesFinished, progress, _j, _k, _l, _len1, _len2, _len3, _results;
          if (e != null) {
            progress = 100 * e.loaded / e.total;
            for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
              file = files[_j];
              file.upload = {
                progress: progress,
                total: e.total,
                bytesSent: e.loaded
              };
            }
          } else {
            allFilesFinished = true;
            progress = 100;
            for (_k = 0, _len2 = files.length; _k < _len2; _k++) {
              file = files[_k];
              if (!(file.upload.progress === 100 && file.upload.bytesSent === file.upload.total)) {
                allFilesFinished = false;
              }
              file.upload.progress = progress;
              file.upload.bytesSent = file.upload.total;
            }
            if (allFilesFinished) {
              return;
            }
          }
          _results = [];
          for (_l = 0, _len3 = files.length; _l < _len3; _l++) {
            file = files[_l];
            _results.push(_this.emit("uploadprogress", file, progress, file.upload.bytesSent));
          }
          return _results;
        };
      })(this);
      xhr.onload = (function(_this) {
        return function(e) {
          var _ref;
          if (files[0].status === Dropzone.CANCELED) {
            return;
          }
          if (xhr.readyState !== 4) {
            return;
          }
          response = xhr.responseText;
          if (xhr.getResponseHeader("content-type") && ~xhr.getResponseHeader("content-type").indexOf("application/json")) {
            try {
              response = JSON.parse(response);
            } catch (_error) {
              e = _error;
              response = "Invalid JSON response from server.";
            }
          }
          updateProgress();
          if (!((200 <= (_ref = xhr.status) && _ref < 300))) {
            return handleError();
          } else {
            return _this._finished(files, response, e);
          }
        };
      })(this);
      xhr.onerror = (function(_this) {
        return function() {
          if (files[0].status === Dropzone.CANCELED) {
            return;
          }
          return handleError();
        };
      })(this);
      progressObj = (_ref = xhr.upload) != null ? _ref : xhr;
      progressObj.onprogress = updateProgress;
      headers = {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "X-Requested-With": "XMLHttpRequest"
      };
      if (this.options.headers) {
        extend(headers, this.options.headers);
      }
      for (headerName in headers) {
        headerValue = headers[headerName];
        xhr.setRequestHeader(headerName, headerValue);
      }
      formData = new FormData();
      if (this.options.params) {
        _ref1 = this.options.params;
        for (key in _ref1) {
          value = _ref1[key];
          formData.append(key, value);
        }
      }
      for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
        file = files[_j];
        this.emit("sending", file, xhr, formData);
      }
      if (this.options.uploadMultiple) {
        this.emit("sendingmultiple", files, xhr, formData);
      }
      if (this.element.tagName === "FORM") {
        _ref2 = this.element.querySelectorAll("input, textarea, select, button");
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          input = _ref2[_k];
          inputName = input.getAttribute("name");
          inputType = input.getAttribute("type");
          if (input.tagName === "SELECT" && input.hasAttribute("multiple")) {
            _ref3 = input.options;
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
              option = _ref3[_l];
              if (option.selected) {
                formData.append(inputName, option.value);
              }
            }
          } else if (!inputType || ((_ref4 = inputType.toLowerCase()) !== "checkbox" && _ref4 !== "radio") || input.checked) {
            formData.append(inputName, input.value);
          }
        }
      }
      for (i = _m = 0, _ref5 = files.length - 1; 0 <= _ref5 ? _m <= _ref5 : _m >= _ref5; i = 0 <= _ref5 ? ++_m : --_m) {
        formData.append(this._getParamName(i), files[i], files[i].name);
      }
      return xhr.send(formData);
    };

    Dropzone.prototype._finished = function(files, responseText, e) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.status = Dropzone.SUCCESS;
        this.emit("success", file, responseText, e);
        this.emit("complete", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("successmultiple", files, responseText, e);
        this.emit("completemultiple", files);
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    Dropzone.prototype._errorProcessing = function(files, message, xhr) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.status = Dropzone.ERROR;
        this.emit("error", file, message, xhr);
        this.emit("complete", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("errormultiple", files, message, xhr);
        this.emit("completemultiple", files);
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    return Dropzone;

  })(Emitter);

  Dropzone.version = "4.0.1";

  Dropzone.options = {};

  Dropzone.optionsForElement = function(element) {
    if (element.getAttribute("id")) {
      return Dropzone.options[camelize(element.getAttribute("id"))];
    } else {
      return void 0;
    }
  };

  Dropzone.instances = [];

  Dropzone.forElement = function(element) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if ((element != null ? element.dropzone : void 0) == null) {
      throw new Error("No Dropzone found for given element. This is probably because you're trying to access it before Dropzone had the time to initialize. Use the `init` option to setup any additional observers on your Dropzone.");
    }
    return element.dropzone;
  };

  Dropzone.autoDiscover = true;

  Dropzone.discover = function() {
    var checkElements, dropzone, dropzones, _i, _len, _results;
    if (document.querySelectorAll) {
      dropzones = document.querySelectorAll(".dropzone");
    } else {
      dropzones = [];
      checkElements = function(elements) {
        var el, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          if (/(^| )dropzone($| )/.test(el.className)) {
            _results.push(dropzones.push(el));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      checkElements(document.getElementsByTagName("div"));
      checkElements(document.getElementsByTagName("form"));
    }
    _results = [];
    for (_i = 0, _len = dropzones.length; _i < _len; _i++) {
      dropzone = dropzones[_i];
      if (Dropzone.optionsForElement(dropzone) !== false) {
        _results.push(new Dropzone(dropzone));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Dropzone.blacklistedBrowsers = [/opera.*Macintosh.*version\/12/i];

  Dropzone.isBrowserSupported = function() {
    var capableBrowser, regex, _i, _len, _ref;
    capableBrowser = true;
    if (window.File && window.FileReader && window.FileList && window.Blob && window.FormData && document.querySelector) {
      if (!("classList" in document.createElement("a"))) {
        capableBrowser = false;
      } else {
        _ref = Dropzone.blacklistedBrowsers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          regex = _ref[_i];
          if (regex.test(navigator.userAgent)) {
            capableBrowser = false;
            continue;
          }
        }
      }
    } else {
      capableBrowser = false;
    }
    return capableBrowser;
  };

  without = function(list, rejectedItem) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      item = list[_i];
      if (item !== rejectedItem) {
        _results.push(item);
      }
    }
    return _results;
  };

  camelize = function(str) {
    return str.replace(/[\-_](\w)/g, function(match) {
      return match.charAt(1).toUpperCase();
    });
  };

  Dropzone.createElement = function(string) {
    var div;
    div = document.createElement("div");
    div.innerHTML = string;
    return div.childNodes[0];
  };

  Dropzone.elementInside = function(element, container) {
    if (element === container) {
      return true;
    }
    while (element = element.parentNode) {
      if (element === container) {
        return true;
      }
    }
    return false;
  };

  Dropzone.getElement = function(el, name) {
    var element;
    if (typeof el === "string") {
      element = document.querySelector(el);
    } else if (el.nodeType != null) {
      element = el;
    }
    if (element == null) {
      throw new Error("Invalid `" + name + "` option provided. Please provide a CSS selector or a plain HTML element.");
    }
    return element;
  };

  Dropzone.getElements = function(els, name) {
    var e, el, elements, _i, _j, _len, _len1, _ref;
    if (els instanceof Array) {
      elements = [];
      try {
        for (_i = 0, _len = els.length; _i < _len; _i++) {
          el = els[_i];
          elements.push(this.getElement(el, name));
        }
      } catch (_error) {
        e = _error;
        elements = null;
      }
    } else if (typeof els === "string") {
      elements = [];
      _ref = document.querySelectorAll(els);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        el = _ref[_j];
        elements.push(el);
      }
    } else if (els.nodeType != null) {
      elements = [els];
    }
    if (!((elements != null) && elements.length)) {
      throw new Error("Invalid `" + name + "` option provided. Please provide a CSS selector, a plain HTML element or a list of those.");
    }
    return elements;
  };

  Dropzone.confirm = function(question, accepted, rejected) {
    if (window.confirm(question)) {
      return accepted();
    } else if (rejected != null) {
      return rejected();
    }
  };

  Dropzone.isValidFile = function(file, acceptedFiles) {
    var baseMimeType, mimeType, validType, _i, _len;
    if (!acceptedFiles) {
      return true;
    }
    acceptedFiles = acceptedFiles.split(",");
    mimeType = file.type;
    baseMimeType = mimeType.replace(/\/.*$/, "");
    for (_i = 0, _len = acceptedFiles.length; _i < _len; _i++) {
      validType = acceptedFiles[_i];
      validType = validType.trim();
      if (validType.charAt(0) === ".") {
        if (file.name.toLowerCase().indexOf(validType.toLowerCase(), file.name.length - validType.length) !== -1) {
          return true;
        }
      } else if (/\/\*$/.test(validType)) {
        if (baseMimeType === validType.replace(/\/.*$/, "")) {
          return true;
        }
      } else {
        if (mimeType === validType) {
          return true;
        }
      }
    }
    return false;
  };

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    jQuery.fn.dropzone = function(options) {
      return this.each(function() {
        return new Dropzone(this, options);
      });
    };
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Dropzone;
  } else {
    window.Dropzone = Dropzone;
  }

  Dropzone.ADDED = "added";

  Dropzone.QUEUED = "queued";

  Dropzone.ACCEPTED = Dropzone.QUEUED;

  Dropzone.UPLOADING = "uploading";

  Dropzone.PROCESSING = Dropzone.UPLOADING;

  Dropzone.CANCELED = "canceled";

  Dropzone.ERROR = "error";

  Dropzone.SUCCESS = "success";


  /*
  
  Bugfix for iOS 6 and 7
  Source: http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
  based on the work of https://github.com/stomita/ios-imagefile-megapixel
   */

  detectVerticalSquash = function(img) {
    var alpha, canvas, ctx, data, ey, ih, iw, py, ratio, sy;
    iw = img.naturalWidth;
    ih = img.naturalHeight;
    canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = ih;
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    data = ctx.getImageData(0, 0, 1, ih).data;
    sy = 0;
    ey = ih;
    py = ih;
    while (py > sy) {
      alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    ratio = py / ih;
    if (ratio === 0) {
      return 1;
    } else {
      return ratio;
    }
  };

  drawImageIOSFix = function(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    var vertSquashRatio;
    vertSquashRatio = detectVerticalSquash(img);
    return ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
  };


  /*
   * contentloaded.js
   *
   * Author: Diego Perini (diego.perini at gmail.com)
   * Summary: cross-browser wrapper for DOMContentLoaded
   * Updated: 20101020
   * License: MIT
   * Version: 1.2
   *
   * URL:
   * http://javascript.nwbox.com/ContentLoaded/
   * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
   */

  contentLoaded = function(win, fn) {
    var add, doc, done, init, poll, pre, rem, root, top;
    done = false;
    top = true;
    doc = win.document;
    root = doc.documentElement;
    add = (doc.addEventListener ? "addEventListener" : "attachEvent");
    rem = (doc.addEventListener ? "removeEventListener" : "detachEvent");
    pre = (doc.addEventListener ? "" : "on");
    init = function(e) {
      if (e.type === "readystatechange" && doc.readyState !== "complete") {
        return;
      }
      (e.type === "load" ? win : doc)[rem](pre + e.type, init, false);
      if (!done && (done = true)) {
        return fn.call(win, e.type || e);
      }
    };
    poll = function() {
      var e;
      try {
        root.doScroll("left");
      } catch (_error) {
        e = _error;
        setTimeout(poll, 50);
        return;
      }
      return init("poll");
    };
    if (doc.readyState !== "complete") {
      if (doc.createEventObject && root.doScroll) {
        try {
          top = !win.frameElement;
        } catch (_error) {}
        if (top) {
          poll();
        }
      }
      doc[add](pre + "DOMContentLoaded", init, false);
      doc[add](pre + "readystatechange", init, false);
      return win[add](pre + "load", init, false);
    }
  };

  Dropzone._autoDiscoverFunction = function() {
    if (Dropzone.autoDiscover) {
      return Dropzone.discover();
    }
  };

  contentLoaded(window, Dropzone._autoDiscoverFunction);

}).call(this);

! function(t) {
    "use strict";
    var a = function() {};
    a.prototype.init = function() {
        t(".colorpicker-default").colorpicker({
            format: "hex"
        }), t(".colorpicker-rgba").colorpicker(), jQuery("#datepicker").datepicker(), jQuery("#datepicker-autoclose").datepicker({
            autoclose: !0,
            todayHighlight: !0
        }), jQuery("#datepicker-inline").datepicker(), jQuery("#datepicker-multiple-date").datepicker({
            format: "dd/mm/yyyy",
            clearBtn: !0,
            multidate: !0,
            multidateSeparator: ","
        }), jQuery("#date-range").datepicker({
            toggleActive: !0
        }), t("input#defaultconfig").maxlength({
            warningClass: "badge badge-info",
            limitReachedClass: "badge badge-warning"
        }), t("input#thresholdconfig").maxlength({
            threshold: 20,
            warningClass: "badge badge-info",
            limitReachedClass: "badge badge-warning"
        }), t("input#moreoptions").maxlength({
            alwaysShow: !0,
            warningClass: "badge badge-success",
            limitReachedClass: "badge badge-danger"
        }), t("input#alloptions").maxlength({
            alwaysShow: !0,
            warningClass: "badge badge-success",
            limitReachedClass: "badge badge-danger",
            separator: " out of ",
            preText: "You typed ",
            postText: " chars available.",
            validate: !0
        }), t("textarea#textarea").maxlength({
            alwaysShow: !0,
            warningClass: "badge badge-info",
            limitReachedClass: "badge badge-warning"
        }), t("input#placement").maxlength({
            alwaysShow: !0,
            placement: "top-left",
            warningClass: "badge badge-info",
            limitReachedClass: "badge badge-warning"
        }), t(".vertical-spin").TouchSpin({
            verticalbuttons: !0,
            verticalupclass: "ion-plus-round",
            verticaldownclass: "ion-minus-round",
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo1']").TouchSpin({
            min: 0,
            max: 100,
            step: .1,
            decimals: 2,
            boostat: 5,
            maxboostedstep: 10,
            postfix: "%",
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo2']").TouchSpin({
            min: -1e9,
            max: 1e9,
            stepinterval: 50,
            maxboostedstep: 1e7,
            prefix: "$",
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo3']").TouchSpin({
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo3_21']").TouchSpin({
            initval: 40,
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo3_22']").TouchSpin({
            initval: 40,
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo5']").TouchSpin({
            prefix: "pre",
            postfix: "post",
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("input[name='demo0']").TouchSpin({
            buttondown_class: "btn btn-primary",
            buttonup_class: "btn btn-primary"
        }), t("#mdate").bootstrapMaterialDatePicker({
            weekStart: 0,
            time: !1
        }), t("#timepicker").bootstrapMaterialDatePicker({
            format: "HH:mm",
            time: !0,
            date: !1
        }), t("#date-format").bootstrapMaterialDatePicker({
            format: "dddd DD MMMM YYYY - HH:mm"
        }), t("#min-date").bootstrapMaterialDatePicker({
            format: "DD/MM/YYYY HH:mm",
            minDate: new Date
        }), t(".colorpicker").asColorPicker(), t(".gradient-colorpicker").asColorPicker({
            mode: "gradient"
        }), t(".complex-colorpicker").asColorPicker({
            mode: "complex"
        }), t(".select2").select2({
            width: "100%"
        })
    }, t.AdvancedForm = new a, t.AdvancedForm.Constructor = a
}(window.jQuery),
function(t) {
    "use strict";
    window.jQuery.AdvancedForm.init()
}();