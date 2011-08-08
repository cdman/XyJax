/*************************************************************
 *
 *  MathJax/extensions/TeX/xypic.js
 *
 *  Implements Xy-pic environment.
 *  
 *  ---------------------------------------------------------------------
 *  
 *  Copyright (c) 2011 Isao Sonobe <sonoisa@gmail.com>.
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


// TODO: パーサを別ファイルにする。

MathJax.Hub.Register.StartupHook("TeX Jax Ready",function () {
  var VERSION = "0.1";
  
  var MML = MathJax.ElementJax.mml;
  var TEX = MathJax.InputJax.TeX;
  var TEXDEF = TEX.Definitions;




/************ Matcher **************/
MathJax.Matcher = MathJax.Object.Subclass({
	Init: function () { this.cases = []; },
	Case: function (klass, f) {
		this.cases.push([klass, f]);
		return this;
	},
	match: function (x) {
		if (x instanceof Object && "isa" in x) {
			var i, count, klass, op;
			i = 0;
			count = this.cases.length;
			while (i < count) {
				klass = this.cases[i][0];
				if (x.isa(klass)) {
					op = klass.unapply(x);
					if (op.isDefined) {
						return this.cases[i][1](op.get);
					}
				}
				i = i + 1;
			}
		}
		throw MathJax.MatchError(x);
	}
});


/************ Option **************/
MathJax.Option = MathJax.Object.Subclass({});

MathJax.Option.Some = MathJax.Option.Subclass({
	Init: function (value) {
		this.get = value;
	},
	isEmpty: false,
	isDefined: true,
  getOrElse: function (ignore) { return this.get; },
	toString: function () {
		return "Some(" + this.get + ")";
	}
}, {
	unapply: function (x) { return MathJax.Option.Some(x.get); }
});

MathJax.Option.None = MathJax.Option.Subclass({
	Init: function () {},
	isEmpty: true,
	isDefined: false,
  getOrElse: function (value) { return value; },
	toString: function () { return "None"; }
}, {
	unapply: function (x) { return MathJax.Option.Some(x); }
});

MathJax.Option.Augment({}, {
	empty: MathJax.Option.None()
});


/************ List **************/
MathJax.List = MathJax.Object.Subclass({});

MathJax.List.Cons = MathJax.List.Subclass({
	Init: function (head, tail) {
		this.head = head;
		this.tail = tail;
	},
	isEmpty: false,
	foldLeft: function (x0, f) {
		var r, c;
		r = f(x0, this.head);
		c = this.tail;
		while (!c.isEmpty) {
			r = f(r, c.head);
			c = c.tail;
		}
		return r;
	},
	foldRight: function (x0, f) {
		if (this.tail.isEmpty) {
			return f(this.head, x0);
		} else {
			return f(this.head, this.tail.foldRight(x0, f));
		}
	},
  foreach: function (f) {
  	var e = this;
    while (!e.isEmpty) {
    	f(e.head);
      e = e.tail;
    }
  },
  mkString: function () {
  	var open, delim, close;
  	switch (arguments.length) {
    	case 0:
      	open = delim = close = "";
        break;
    	case 1:
      	delim = arguments[0];
        open = close = "";
      	break;
      case 2:
      	open = arguments[0];
      	delim = arguments[1];
        close = "";
        break;
      default:
      	open = arguments[0];
      	delim = arguments[1];
      	close = arguments[2];
        break;
    }
		var desc, nxt;
		desc = open + this.head.toString();
		nxt = this.tail;
		while (nxt.isa(MathJax.List.Cons)) {
			desc += delim + nxt.head.toString(); 
			nxt = nxt.tail;
		}
		desc += close;
		return desc;
  },
	toString: function () {
  	return this.mkString("[", ", ", "]");
	}
}, {
	unapply: function (x) { return MathJax.Option.Some([x.head, x.tail]); }
});

MathJax.List.Nil = MathJax.List.Subclass({
	isEmpty: true,
	foldLeft: function (x0, f) { return x0; },
	foldRight: function (x0, f) { return x0; },
  foreach: function (f) {},
  mkString: function () {
  	switch (arguments.length) {
    	case 0:
    	case 1:
      	return "";
      case 2:
      	return arguments[0]
      default:
      	return arguments[0]+arguments[2];
    }
  },
	toString: function () { return '[]'; }
}, {
	unapply: function (x) { return MathJax.Option.Some(x); }
});

MathJax.List.Augment({}, {
	empty: MathJax.List.Nil(),
	fromArray: function (as) {
		var list, i;
		list = MathJax.List.empty;
		i = as.length - 1;
		while (i >= 0) {
			list = MathJax.List.Cons(as[i], list);
			i -= 1;
		}
		return list;
	}
});


/************ MatchError **************/
MathJax.MatchError = MathJax.Object.Subclass({
	Init: function (obj) { this.obj = obj; },
//	getMessage: function () {
//		if (this.obj === null) {
//			return "null"
//		} else {
//			return obj.toString() + " (of class " + obj. + ")"
//		}
//	}
	toString: function () { return "MatchError(" + this.obj + ")"; }
});


/************ OffsetPosition **************/
MathJax.OffsetPosition = MathJax.Object.Subclass({
	Init: function (source, offset) {
		// assert(source.length >= offset)
		this.source = source;
		if (offset === undefined) { this.offset = 0; } else { this.offset = offset; }	
		this._index = null;
		this._line = null;
	},
	index: function () {
		if (this._index !== null) { return this._index; }
		this._index = [];
		this._index.push(0);
		var i = 0;
		while (i < this.source.length) {
			if (this.source.charAt(i) === '\n') { this._index.push(i + 1); }
			i += 1;
		}
		this._index.push(this.source.length);
		return this._index;
	},
	line: function () {
		var lo, hi, mid;
		if (this._line !== null) { return this._line; }
		lo = 0;
		hi = this.index().length - 1;
		while (lo + 1 < hi) {
			mid = (hi + lo) >> 1;
			if (this.offset < this.index()[mid]) {
				hi = mid;
			} else {
				lo = mid;
			}
		}
		this._line = lo + 1;
		return this._line;
	},
	column: function () {
		return this.offset - this.index()[this.line() - 1] + 1;
	},
	lineContents: function () {
		var i, l;
		i = this.index();
		l = this.line();
		return this.source.substring(i[l - 1], i[l]);
	},
	toString: function () { return this.line().toString() + '.' + this.column(); },
	longString: function () {
		var desc, i;
		desc = this.lineContents() + '\n';
		i = 0;
		while (i < this.column()) {
			if (this.lineContents().charAt(i) === '\t') {
				desc += '\t';
			} else {
				desc += ' ';
			}
			i += 1;
		}
		desc += '^';
		return desc;
	},
	isLessThan: function (that) {
		if (that.isa(MathJax.OffsetPosition)) {
			return this.offset < that.offset;
		} else {
			return (
				this.line() < that.line() || 
				(this.line() === that.line() && this.column() < that.column())
			);
		}
	} 
});


/************ StringReader **************/
MathJax.StringReader = MathJax.Object.Subclass({
	Init: function (source, offset) {
		this.source = source;
		if (offset === undefined) { this.offset = 0; } else { this.offset = offset; }	
	},
	first: function () {
		if (this.offset < this.source.length) {
			return this.source.charAt(this.offset);
		} else {
			return MathJax.StringReader.EofCh;
		}
	},
	rest: function () {
		if (this.offset < this.source.length) {
			return MathJax.StringReader(this.source, this.offset + 1);
		} else {
			return this;
		}
	},
	pos: function () { return MathJax.OffsetPosition(this.source, this.offset); },
	atEnd: function () { return this.offset >= this.source.length; },
	drop: function (n) {
		var r, count;
		r = this;
		count = n;
		while (count > 0) {
			r = r.rest();
			count -= 1;
		}
		return r;
	}
}, {
	EofCh: '\x03'
});


/************ Parsers **************/
MathJax.Parsers = MathJax.Object.Subclass({}, {
	parse: function (p, input) {
		return p.apply(input);
	},
	parseAll: function (p, input) {
		return p.andl(function () { return MathJax.Parsers.eos(); }).apply(input);
	},
	parseString: function (p, str) {
		var input = MathJax.StringReader(str);
		return MathJax.Parsers.parse(p, input);
	},
	parseAllString: function (p, str) {
		var input = MathJax.StringReader(str);
		return MathJax.Parsers.parseAll(p, input);
	},
	whiteSpaceRegex: /^\s+/,
	handleWhiteSpace: function (source, offset) {
		var m = MathJax.Parsers.whiteSpaceRegex.exec(source.substring(offset, source.length));
		if (m !== null) {
			return offset + m[0].length;
		} else {
			return offset;
		}
	},
	whiteSpace: function () {
  	return MathJax.Parsers.regex(MathJax.Parsers.whiteSpaceRegex);
  },
	literal: function (str) {
		return MathJax.Parsers.Parser(function (input) {
			var source, offset, start, i, j, found;
			source = input.source;
			offset = input.offset;
			start = MathJax.Parsers.handleWhiteSpace(source, offset);
			i = 0;
			j = start;
			while (i < str.length && j < source.length && 
					str.charAt(i) === source.charAt(j)) {
				i += 1;
				j += 1;
			}
			if (i === str.length) {
				return MathJax.Parsers.Success(str, input.drop(j - offset));
			} else {
				if (start === source.length) {
					found = "end of source";
				} else {
					found = "`" + source.charAt(start) + "'";
				}
				return MathJax.Parsers.Failure(
					"`" + str + "' expected but " + found + " found",
					input.drop(start - offset)
				);
			}
		});
	},
	regex: function (rx /* must start with ^ */) {
		if (rx.toString().substring(0, 2) !== "/^") {
			throw ("regex must start with `^' but " + rx);
		}
		return MathJax.Parsers.Parser(function (input) {
			var source, offset, m, found;
			source = input.source;
			offset = input.offset;
			m = rx.exec(source.substring(offset, source.length));
			if (m !== null) {
				return MathJax.Parsers.Success(m[0], input.drop(m[0].length));
			} else {
				if (offset === source.length) {
					found = "end of source";
				} else {
					found = "`" + source.charAt(offset) + "'";
				}
				return MathJax.Parsers.Failure(
					"string matching regex " + rx + " expected but " + found + " found",
					input
				);
			}
		});
	},
	regexLiteral: function (rx /* must start with ^ */) {
		if (rx.toString().substring(0, 2) !== "/^") {
			throw ("regex must start with `^' but " + rx);
		}
		return MathJax.Parsers.Parser(function (input) {
			var source, offset, start, m, found;
			source = input.source;
			offset = input.offset;
			start = MathJax.Parsers.handleWhiteSpace(source, offset);
			m = rx.exec(source.substring(start, source.length));
			if (m !== null) {
				return MathJax.Parsers.Success(m[0], input.drop(start + m[0].length - offset));
			} else {
				if (start === source.length) {
					found = "end of source";
				} else {
					found = "`" + source.charAt(start) + "'";
				}
				return MathJax.Parsers.Failure(
					"string matching regex " + rx + " expected but " + found + " found",
					input.drop(start - offset)
				);
			}
		});
	},
	eos: function () {
		return MathJax.Parsers.Parser(function (input) {
			var source, offset, start;
			source = input.source;
			offset = input.offset;
			start = MathJax.Parsers.handleWhiteSpace(source, offset);
			if (source.length === start) {
				return MathJax.Parsers.Success("", input);
			} else {
				return MathJax.Parsers.Failure("end of source expected but `" + 
					source.charAt(start) + "' found", input);
			}
		});
	},
	commit: function (/*lazy*/ p) {
		return MathJax.Parsers.Parser(function (input) {
			var res = p()(input);
			return (MathJax.Matcher()
				.Case(MathJax.Parsers.Success, function (x) { return res; })
				.Case(MathJax.Parsers.Error, function (x) { return res; })
				.Case(MathJax.Parsers.Failure, function (x) {
					return MathJax.Parsers.Error(x[0], x[1]);
				}).match(res)
			);
		});
	},
	//elem: function (kind, p)
	elem: function (e) { return MathJax.Parsers.accept(e).named('"' + e + '"'); },
	accept: function (e) {
		return MathJax.Parsers.acceptIf(
			function (x) { return x === e; },
			function (x) { return "`" + e + "' expected but `" + x + "' found"; }
		);
	},
	acceptIf: function (p, err) {
		return MathJax.Parsers.Parser(function (input) {
			if (p(input.first())) {
				return MathJax.Parsers.Success(input.first(), input.rest());
			} else {
				return MathJax.Parsers.Failure(err(input.first()), input);
			}
		});
	},
	//acceptMatch: function (expected, f)
	//acceptSeq: function (es)
	failure: function (msg) {
		return MathJax.Parsers.Parser(function (input) {
			return MathJax.Parsers.Failure(msg, input);
		});
	},
	err: function (msg) {
		return MathJax.Parsers.Parser(function (input) {
			return MathJax.Parsers.Error(msg, input);
		});
	},
	success: function (v) {
		return MathJax.Parsers.Parser(function (input) {
			return MathJax.Parsers.Success(v, input);
		});
	},
	log: function (/*lazy*/ p, name) {
		return MathJax.Parsers.Parser(function (input) {
			console.log("trying " + name + " at " + input);
			var r = p().apply(input);
			console.log(name + " --> " + r);
			return r;
		});
	},
	rep: function (/*lazy*/ p) {
		var s = MathJax.Parsers.success(MathJax.List.empty);
		return MathJax.Parsers.rep1(p).or(function () { return s; });
	},
	rep1: function (/*lazy*/ p) {
		return MathJax.Parsers.Parser(function (input) {
			var elems, i, p0, res;
			elems = [];
			i = input;
			p0 = p();
			res = p0.apply(input);
			if (res.isa(MathJax.Parsers.Success)) {
				while (res.isa(MathJax.Parsers.Success)) {
					elems.push(res.result);
					i = res.next;
					res = p0.apply(i);
				}
				return MathJax.Parsers.Success(MathJax.List.fromArray(elems), i);
			} else {
				return res;
			}
		});
	},
	//rep1: function (/*lazy*/ first, /*lazy*/ p)
	repN: function (num, /*lazy*/ p) {
		if (num === 0) {
			return MathJax.Parsers.success(MathJax.List.empty);
		}
		return MathJax.Parsers.Parser(function (input) {
			var elems, i, p0, res;
			elems = [];
			i = input;
			p0 = p();
			res = p0.apply(i);
			while (res.isa(MathJax.Parsers.Success)) {
				elems.push(res.result);
				i = res.next;
				if (num === elems.length) {
					return MathJax.Parsers.Success(MathJax.List.fromArray(elems), i);
				}
				res = p0.apply(i);
			}
			return res; // NoSuccess
		});
	},
	repsep: function (/*lazy*/ p, /*lazy*/ q) {
		var s = MathJax.Parsers.success(MathJax.List.empty);
		return MathJax.Parsers.rep1sep(p, q).or(function () { return s; });
	},
	rep1sep: function (/*lazy*/ p, /*lazy*/ q) {
		return p().and(MathJax.Parsers.rep(q().andr(p))).to(function (res) {
			return MathJax.List.Cons(res.head, res.tail);
		});
	},
//	chainl1: function (/*lazy*/ p, /*lazy*/ q) {
//		return this.chainl1(p, p, q)
//	},
	chainl1: function (/*lazy*/ first, /*lazy*/ p, /*lazy*/ q) {
		return first().and(MathJax.Parsers.rep(q().and(p))).to(function (res) {
			return res.tail.foldLeft(res.head, function (a, fb) { return fb.head(a, fb.tail); });
		});
	},
	chainr1: function (/*lazy*/ p, /*lazy*/ q, combine, first) {
		return p().and(this.rep(q().and(p))).to(function (res) {
			return MathJax.List.Cons(MathJax.Parsers.Pair(combine, res.head),
				res.tail).foldRight(first, function (fa, b) { return fa.head(fa.tail, b); }
				);
		});
	},
	opt: function (/*lazy*/ p) {
		return p().to(function (x) {
			return MathJax.Option.Some(x);
		}).or(function () {
			return MathJax.Parsers.success(MathJax.Option.empty);
		});
	},
	not: function (/*lazy*/ p) {
		return MathJax.Parsers.Parser(function (input) {
			var r = p().apply(input);
			if (r.successful) {
				return MathJax.Parsers.Failure("Expected failure", input);
			} else {
				return MathJax.Parsers.Success(MathJax.Option.empty, input);
			}
		});
	},
	guard: function (/*lazy*/ p) {
		return MathJax.Parsers.Parser(function (input) {
			var r = p().apply(input);
			if (r.successful) {
				return MathJax.Parsers.Success(r.result, input);
			} else {
				return r;
			}
		});
	},
	//positioned: function (/*lazy*/ p)
	//phrase: function (p)
	mkList: function (pair) { return MathJax.List.Cons(pair.head, pair.tail); },
	fun: function (x) { return function () { return x; }; },
	lazyParser: function (x) {
		var lit, r;
		if (x instanceof String || (typeof x) === "string") {
			lit = MathJax.Parsers.literal(x);
			return function () { return lit; };
		} else if (x instanceof Function) {
			// x is deemed to be a function which has the return value as Parser. 
			return x;
		} else if (x instanceof Object) {
			if("isa" in x && x.isa(MathJax.Parsers.Parser)) {
				return function () { return x; };
			} else if (x instanceof RegExp) {
				r = MathJax.Parsers.regexLiteral(x);
				return function () { return r; };
			} else {
				return MathJax.Parsers.err("unhandlable type");
			}
		} else {
			return MathJax.Parsers.err("unhandlable type");
		}
	},
	seq: function () {
		var count, parser, i;
		count = arguments.length;
		if (count === 0) { return MathJax.Parsers.err("at least one element must be specified"); }
		parser = MathJax.Parsers.lazyParser(arguments[0])();
		i = 1;
		while (i < count) {
			parser = parser.and(MathJax.Parsers.lazyParser(arguments[i]));
			i += 1;
		}
		return parser;
	},
	or: function () {
  	// TODO: バグ？バックトラックしないようだ。
		var count, parser, i;
		count = arguments.length;
		if (count === 0) { return MathJax.Parsers.err("at least one element must be specified"); }
		parser = MathJax.Parsers.lazyParser(arguments[0])();
		i = 1;
		while (i < count) {
			parser = parser.or(MathJax.Parsers.lazyParser(arguments[i]));
			i += 1;
		}
		return parser;
	}
});


/************ Pair **************/
MathJax.Parsers.Pair = MathJax.List.Subclass({
	Init: function (head, tail) {
		this.head = head;
		this.tail = tail;
	},
	toString: function () { return '(' + this.head + '~' + this.tail + ')'; }
}, {
	unapply: function (x) { return MathJax.Option.Some([x.head, x.tail]); }
});


/************ ParseResult **************/
MathJax.Parsers.ParseResult = MathJax.Object.Subclass({
	Init: function () {},
	isEmpty: function () { return !this.successful; },
	getOrElse: function (/*lazy*/ defaultValue) {
		if (this.isEmpty) { return defaultValue(); } else { return this.get(); }
	} 
});


/************ Success **************/
MathJax.Parsers.Success = MathJax.Parsers.ParseResult.Subclass({
	Init: function (result, next) {
		this.result = result;
		this.next = next;
	},
	map: function (f) { return MathJax.Parsers.Success(f(this.result), this.next); },
	mapPartial: function (f, err) {
		try {
			return MathJax.Parsers.Success(f(this.result), this.next);
		} catch (e) {
			if ("isa" in e && e.isa(MathJax.MatchError)) {
				return MathJax.Parsers.Failure(err(this.result), this.next);
			} else {
				throw e;
			}
		}
	},
	flatMapWithNext: function (f) { return f(this.result).apply(this.next); },
	append: function (/*lazy*/ a) { return this; },
	get: function () { return this.result; },
	successful: true,
	toString: function () { return '[' + this.next.pos() + '] parsed: ' + this.result; }
}, {
	unapply: function (x) { return MathJax.Option.Some([x.result, x.next]); }
});


/************ NoSuccess **************/
MathJax.Parsers.NoSuccess = MathJax.Parsers.ParseResult.Subclass({
	Init: function () {},
	map: function (f) { return this; },
	mapPartial: function (f, error) { return this; },
	flatMapWithNext: function (f) { return this; },
	get: function () { return MathJax.Parsers.error("No result when parsing failed"); },
	successful: false
});


/************ Failure **************/
MathJax.Parsers.Failure = MathJax.Parsers.NoSuccess.Subclass({
	Init: function (msg, next) {
		this.msg = msg;
		this.next = next;
//		if (!(PARSERS.lastNoSuccess != null && 
//			this.next.pos().isLessThan(PARSERS.lastNoSuccess.next.pos()))) {
//			PARSERS.lastNoSuccess = this;
//		}
	},
	append: function (/*lazy*/ a) {
		var alt = a();
		if (alt.isa(MathJax.Parsers.Success)) {
			return alt;
		} else if (alt.isa(MathJax.Parsers.NoSuccess)) {
			if (alt.next.pos().isLessThan(this.next.pos())) {
				return this;
			} else {
				return alt;
			}
		} else {
			throw MathJax.MatchError(alt);
		}
	},
	toString: function () { return ('[' + this.next.pos() + '] failure: ' + 
		this.msg + '\n\n' + this.next.pos().longString()); }
}, {
	unapply: function (x) { return MathJax.Option.Some([x.msg, x.next]); }
});


/************ Error **************/
MathJax.Parsers.Error = MathJax.Parsers.NoSuccess.Subclass({
	Init: function (msg, next) {
		this.msg = msg;
		this.next = next;
//		if (!(PARSERS.lastNoSuccess != null && 
//			this.next.pos().isLessThan(PARSERS.lastNoSuccess.next.pos()))) {
//			PARSERS.lastNoSuccess = this;
//		}
	},
	append: function (/*lazy*/ a) { return this; },
	toString: function () { return ('[' + this.next.pos() + '] error: ' + 
		this.msg + '\n\n' + this.next.pos().longString()); }
}, {
	unapply: function (x) { return MathJax.Option.Some([x.msg, x.next]); }
});


/************ Parser **************/
MathJax.Parsers.Parser = MathJax.Object.Subclass({
	Init: function (f) { this.apply = f; },
	name: '',
	named: function (name) { this.name = name; return this; },
	toString: function () { return 'Parser (' + this.name + ')'; },
	flatMap: function (f) {
		var app = this.apply;
		return MathJax.Parsers.Parser(function (input) {
			return app(input).flatMapWithNext(f);
		});
	},
	map: function (f) {
		var app = this.apply;
		return MathJax.Parsers.Parser(function (input) {
			return app(input).map(f);
		});
	},
	append: function (/*lazy*/ p) {
		var app = this.apply;
		return MathJax.Parsers.Parser(function (input) {
			return app(input).append(function () {
				return p().apply(input);
			});
		});
	},
	and: function (/*lazy*/ p) {
		return this.flatMap(function (a) {
			return p().map(function (b) {
				return MathJax.Parsers.Pair(a, b);
			});
		}).named('~');
	},
	andr: function (/*lazy*/ p) {
		return this.flatMap(function (a) {
			return p().map(function (b) {
				return b;
			});
		}).named('~>');
	},
	andl: function (/*lazy*/ p) {
		return this.flatMap(function (a) {
			return p().map(function (b) {
				return a;
			});
		}).named('<~');
	},
	or: function (/*lazy*/ q) { return this.append(q).named("|"); },
	andOnce: function (/*lazy*/ p) {
		var flatMap = this.flatMap;
		return MathJax.Parsers.OnceParser(function () {
			return flatMap(function (a) {
				return MathJax.Parsers.commit(p).map(function (b) {
					return MathJax.Parsers.Pair(a, b);
				});
			}).named('~!');
		});
	},
	longestOr: function (/*lazy*/ q0) {
		var app = this.apply;
		return MathJax.Parsers.Parser(function (input) {
			var res1, res2;
			res1 = app(input);
			res2 = q0()(input);
			if (res1.successful) {
				if (res2.successful) {
					if (res2.next.pos().isLessThan(res1.next.pos())) {
						return res1;
					} else {
						return res2;
					}
				} else {
					return res1;
				}
			} else if (res2.successful) {
				return res2;
			} else if (res1.isa(MathJax.Parsers.Error)) {
				return res1;
			} else {
				if (res2.next.pos().isLessThan(res1.next.pos())) {
					return res1;
				} else {
					return res2;
				}
			}
		}).named("|||");
	},
	to: function (f) { return this.map(f).named(this.toString() + '^^'); },
	ret: function (/*lazy*/ v) {
		var app = this.apply;
		return MathJax.Parsers.Parser(function (input) {
			return app(input).map(function (x) { return v(); });
		}).named(this.toString() + "^^^");
	},
	toIfPossible: function (f, error) {
		if (error === undefined) {
			error = function (r) { return "Constructor function not defined at " + r; };
		}
		var app = this.apply;
		return MathJax.Parsers.Parser(function (input) {
			return app(input).mapPartial(f, error);
		}).named(this.toString() + "^?");
	},
	into: function (fq) { return this.flatMap(fq); },
	rep: function () {
		var p = this;
		return MathJax.Parsers.rep(function () { return p; });
	},
	chain: function (/*lazy*/ sep) {
		var p, lp;
		p = this;
		lp = function () { return p; };
		return MathJax.Parsers.chainl1(lp, lp, sep);
	},
	rep1: function () {
		var p = this;
		return MathJax.Parsers.rep1(function () { return p; });
	},
	opt: function () {
		var p = this;
		return MathJax.Parsers.opt(function () { return p; });
	}
});


/************ OnceParser **************/
MathJax.Parsers.OnceParser = MathJax.Parsers.Parser.Subclass({
	Init: function (f) { this.apply = f; },
	and: function (p) {
		var flatMap = this.flatMap;
		return MathJax.Parsers.OnceParser(function () {
			return flatMap(function (a) {
				return MathJax.Parsers.commit(p).map(function (b) {
					return MathJax.Parsers.Pair(a, b);
				});
			});
		}).named('~');
	}
});



  var fun = MathJax.Parsers.fun;
  var elem = MathJax.Parsers.elem;
  var felem = function (x) { return fun(MathJax.Parsers.elem(x)); }
  var lit = MathJax.Parsers.literal;
  var regex = MathJax.Parsers.regex;
  var regexLit = MathJax.Parsers.regexLiteral;
  var flit = function (x) { return fun(MathJax.Parsers.literal(x)); }
  var seq = MathJax.Parsers.seq;
  var or = MathJax.Parsers.or;
  var rep = function (x) { return MathJax.Parsers.lazyParser(x)().rep(); }
  
  var p = MathJax.Parsers.Subclass({
    // <pos> '\end' '{' 'xy' '}'
    xy: function () {
      return p.pos().into(function (pos) {
        return MathJax.Parsers.guard(function() { return lit('\\end').andl(flit('{')).andl(flit('xy')).andl(flit('}')).to(function () {
          return pos;
        })});
      });
    },
    
    // <pos> ::= <coord> <pos2>*
    pos: function () {
      return seq(p.coord, rep(p.pos2)).to(function (cps) {
        return MML.xypic.Pos.Coord(cps.head, cps.tail);
      });
    },
    
    // <nonemptyPos> ::= <coord> <pos2>*
    nonemptyPos: function () {
      return seq(p.nonemptyCoord, rep(p.pos2)).to(function (cps) {
        return MML.xypic.Pos.Coord(cps.head, cps.tail);
      });
    },
    
    // <pos2> ::= ';' <coord>
    //        |   '**' <object>
    //        |   '*' <object>
    //        |   '?' <place>
    //        |   '=' <saving>
    pos2: function () {
      return or(
        lit('+').andr(p.coord).to(function (c) { return MML.xypic.Pos.Plus(c); }),
        lit('-').andr(p.coord).to(function (c) { return MML.xypic.Pos.Minus(c); }),
        lit(',').andr(p.coord).to(function (c) { return MML.xypic.Pos.Then(c); }),
        lit(';').andr(p.coord).to(function (c) { return MML.xypic.Pos.SwapPAndC(c); }),
        lit('**').andr(p.object).to(function (o) { return MML.xypic.Pos.ConnectObject(o); }),
        lit('*').andr(p.object).to(function (o) { return MML.xypic.Pos.DropObject(o); }),
        lit('?').andr(p.place).to(function (o) { return MML.xypic.Pos.Place(o); }),
        lit('=').andr(flit('"')).andr(p.id).andl(felem('"')).to(function (o) { return MML.xypic.Pos.SavingPos(o); })
      );
    },
    
    // <coord> ::= <nonemptyCoord> | <empty>
    coord: function () {
      return or(
        p.nonemptyCoord,
        MathJax.Parsers.success('empty').to(function () { return MML.xypic.Coord.C(); })
      );
    },
    
    // <nonemptyCoord> ::= 'c' | 'p' | 'x' | 'y'
    //         |   <vector>
    //         |   '"' <id> '"'
    nonemptyCoord: function () {
      return or(
        lit('c').to(function () { return MML.xypic.Coord.C(); }), 
        lit('p').to(function () { return MML.xypic.Coord.P(); }), 
        lit('x').to(function () { return MML.xypic.Coord.X(); }), 
        lit('y').to(function () { return MML.xypic.Coord.Y(); }),
        p.vector().to(function (v) { return MML.xypic.Coord.Vector(v); }), 
        lit('"').andr(p.id).andl(felem('"')).to(function (id) { return MML.xypic.Coord.Id(id) })
      );
    },
    
    // <vector> ::= '(' <factor> ',' <factor> ')'
    //          |   '<' <dimen> ',' <dimen> '>'
    //          |   '<' <dimen> '>'
    //          |   'a' '(' <number> ')'
    //          |   '/' <direction> <loose-dimen> '/'
    //          |   0
    //          |   <corner>
    //          |   <corner> '(' <factor> ')'
    vector: function () {
      return or(
        lit('(').andr(p.factor).andl(flit(',')).and(p.factor).andl(flit(')')).to(
          function (xy) {
            return MML.xypic.Vector.InCurBase(xy.head, xy.tail);
          }
        ),
        lit('<').andr(p.dimen).andl(flit(',')).and(p.dimen).andl(flit('>')).to(
          function (xy) {
            return MML.xypic.Vector.Abs(xy.head, xy.tail);
          }
        ),
        lit('<').andr(p.dimen).andl(flit('>')).to(
          function (x) {
            return MML.xypic.Vector.Abs(x, x);
          }
        ),
        lit('a').andr(flit('(')).andr(p.number).andl(flit(')')).to(
          function (d) {
            return MML.xypic.Vector.Angle(d);
          }
        ),
        lit('/').andr(p.direction).and(p.looseDimen).andl(flit('/')).to(
          function (dd) {
            return MML.xypic.Vector.Dir(dd.head, dd.tail);
          }
        ),
        lit('0').to(function (x) { return MML.xypic.Vector.InCurBase(0, 0); }),
        function () { return p.corner().and(fun(MathJax.Parsers.opt(
        	fun(lit('(').andr(p.factor).andl(flit(')')))).to(function (f) {
          	return f.getOrElse(1);
          }))).to(function (cf) {
          	return MML.xypic.Vector.Corner(cf.head, cf.tail);
        	})
        }
      );
    },
    
    // <corner> ::= 'L' | 'R' | 'D' | 'U'
    //          | 'CL' | 'CR' | 'CD' | 'CU' | 'LC' | 'RC' | 'DC' | 'UC'
    //          | 'LD' | 'RD' | 'LU' | 'RU' | 'DL' | 'DR' | 'UL' | 'UR'
    //          | 'E' | 'P'
    //          | 'A'
    corner: function () {
    	return or(
      	regexLit(/^(CL|LC)/).to(function () { return MML.xypic.Corner.CL(); }),
      	regexLit(/^(CR|RC)/).to(function () { return MML.xypic.Corner.CR(); }),
      	regexLit(/^(CD|DC)/).to(function () { return MML.xypic.Corner.CD(); }),
      	regexLit(/^(CU|UC)/).to(function () { return MML.xypic.Corner.CU(); }),
      	regexLit(/^(LD|DL)/).to(function () { return MML.xypic.Corner.LD(); }),
      	regexLit(/^(RD|DR)/).to(function () { return MML.xypic.Corner.RD(); }),
      	regexLit(/^(LU|UL)/).to(function () { return MML.xypic.Corner.LU(); }),
      	regexLit(/^(RU|UR)/).to(function () { return MML.xypic.Corner.RU(); }),
      	lit('L').to(function () { return MML.xypic.Corner.L(); }),
      	lit('R').to(function () { return MML.xypic.Corner.R(); }),
      	lit('D').to(function () { return MML.xypic.Corner.D(); }),
      	lit('U').to(function () { return MML.xypic.Corner.U(); }),
      	lit('E').to(function () { return MML.xypic.Corner.NearestEdgePoint(); }),
      	lit('P').to(function () { return MML.xypic.Corner.PropEdgePoint(); }),
      	lit('A').to(function () { return MML.xypic.Corner.Axis(); })
      );
    },
    
    // <place> ::= '<' <place>
    //         | '>' <place>
    //         | '(' <factor> ')' <place>
    //         | '!' '{' <pos> '}' <slide>
    //         | <slide>
    place: function () {
      return or(
        lit('<').andr(p.place).to(function (pl) {
          return MML.xypic.Place(1, 0, undefined, undefined).compound(pl);
        }), 
        lit('>').andr(p.place).to(function (pl) {
          return MML.xypic.Place(0, 1, undefined, undefined).compound(pl);
        }), 
        lit('(').andr(p.factor).andl(flit(')')).and(p.place).to(function (pl) {
          return MML.xypic.Place(0, 0, MML.xypic.Place.Factor(pl.head), undefined).compound(pl.tail);
        }), 
        lit('!').andr(flit('{')).andr(p.pos).andl(flit('}')).and(p.slide).to(function (ps) {
          return MML.xypic.Place(0, 0, MML.xypic.Place.Intercept(ps.head), ps.tail);
        }),
        function () { return p.slide().to(function (s) {
          return MML.xypic.Place(0, 0, undefined, s);
        }) }
      );
    },
    
    // <slide> ::= '/' <dimen> '/'
    //         | <empty>
    slide: function () {
      return or(
        lit('/').andr(p.dimen).andl(flit('/')).to(function (d) {
          return MML.xypic.Slide(d);
        }),
        MathJax.Parsers.success("no slide").to(function () {
          return MML.xypic.Slide(undefined);
        })
      );
    },
    
    // <factor>
    factor: fun(regexLit(/^[+\-]?(\d+(\.\d*)?|\d*\.\d+)/).to(
      function (v) { return parseFloat(v); })
    ),
    
    // <number>
    number: fun(regexLit(/^[+\-]?\d+/).to(
      function (n) { return parseInt(n); })
    ),
    
    unit: fun(regexLit(/^(em|ex|px|pt|pc|in|cm|mm|mu)/).opt().to(function (d) {
        return d.getOrElse("mm");
    })),
    
    // <dimen> ::= <factor> ( 'em' | 'ex' | 'px' | 'pt' | 'pc' | 'in' | 'cm' | 'mm' | 'mu' )?
    dimen: function () {
      return p.factor().and(p.unit).to(function (x) {
        return x.head.toString() + x.tail;
      })
    },
    
    // <loose-dimen> ::= <loose-factor> 
    looseDimen: function () {
      return p.looseFactor().and(p.unit).to(function (x) {
        return x.head.toString() + x.tail;
      })
    },
    
    // <loose-factor>
    // makeshift against /^ 3.5mm/ is converted to /^ 3 .5mm/ by MathJax.InputJax.TeX.prefilterMath()
    looseFactor: fun(or(
      regexLit(/^(\d \d*(\.\d*))/).to(function (v) {
        return parseFloat(v.replace(/ /, ""));
      }),
      regexLit(/^[+\-]?(\d+(\.\d*)?|\d*\.\d+)/).to(function (v) {
        return parseFloat(v);
      })
    )),
    
    // <id>
    id: fun(regex(/^[^"]+/)), // " TODO: IDの文字領域は？
    
    // <object> ::= <modifier>* <objectbox>
    object: function () {
      return or(
        rep(p.modifier).and(p.objectbox).to(function (mso) {
          return MML.xypic.Object(mso.head, mso.tail);
        })
      );
    },
    
    // <objectbox> ::= '{' <text> '}'
    //          | '@' <dir>
    //          | '\dir' <dir>
    //          | <curve>
    objectbox: function () {
      return or(lit("{").andr(p.text).andl(felem("}")).to(function (math) {
          var mml = TEX.Parse(math).mml();
          if (mml.inferred) {
            mml = MML.apply(MathJax.ElementJax,mml.data);
          } else {
            mml = MML(mml);
          }
          TEX.combineRelations(mml.root);
          return MML.xypic.ObjectBox.Text(mml.root);
        }),
        lit("@").andr(p.dir),
        lit("\\dir").andr(p.dir),
        p.curve
      );
    },
    
    // <text> ::= /[^{}]*/ ( '{' <text> '}' /[^{}]*/ )*
    text: function () {
      return regex(/^[^{}]*/).and(function () {
        return (elem("{").andr(p.text).andl(felem("}")).and(fun(regex(/^[^{}]*/)))).rep().to(function (xs) {
          var res = "";
          xs.foreach(function (x) {
            res += "{" + x.head + "}" + x.tail;
          });
          return res;
        })
      }).to(function (x) {
        return x.head + x.tail
      });
    },
		
    // <dir> ::= <variant> '{' <main> '}'
    // <variant> ::= '^' | '_' | '2' | '3' | <empty>
    // <main> ::= <empty> | '--' | '-' | '..' | '.' | '~~' | '~' | '>>|' | '>|' | '>>' | '<<' | '>' | '<' | '(' | ')' | '`' | "'" | '||' | '|-' | '|<' | '|<<' | '|' | '*' | '+' | 'x' | '//' | '/' | 'o' | '==' | '=' | '::' | ':'
    dir: function () {
      return regexLit(/^[\^_23]/).opt().andl(flit('{')).and(fun(regexLit(/^(--|-|\.\.|\.|~~|~|>>\||>\||>>|<<|>|<|\(|\)|`|'|\|\||\|-|\|<|\|<<|\||\*|\+|x|\/\/|\/|o|==|=|::|:)/ /*'*/).opt())).andl(flit('}')).to(function (vm) {
        return MML.xypic.ObjectBox.Dir(vm.head.getOrElse(""), vm.tail.getOrElse(""));
      })
    },
    
    // <curve> ::= '\crv' <curve-modifier> '{' <curve-object> <poslist> '}'
    curve: function () {
    	return lit("\\crv").andr(p.curveModifier).andl(flit("{")).and(p.curveObject).and(p.curvePoslist).andl(flit("}")).to(function (mop) {
      	return MML.xypic.ObjectBox.Curve(mop.head.head, mop.head.tail, mop.tail);
      });
    },
    
	  // <curve-modifier> ::= ( '~' <curve-option> )*
    curveModifier: function () {
    	return rep(fun(lit("~").andr(p.curveOption)));
    },
    
    // <curve-option> ::= 'p' | 'P' | 'l' | 'L' | 'c' | 'C'
    //                |   'pc' | 'pC' | 'Pc' | 'PC'
    //                |   'lc' | 'lC' | 'Lc' | 'LC'
    //                |   'cC'
    curveOption: function () {
    	return or(
      	lit("p").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.p(); }),
      	lit("P").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.P(); }),
      	lit("l").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.l(); }),
      	lit("L").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.L(); }),
      	lit("c").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.c(); }),
      	lit("C").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.C(); }),
      	lit("pc").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.pc(); }),
      	lit("pC").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.pC(); }),
      	lit("Pc").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.Pc(); }),
      	lit("PC").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.PC(); }),
      	lit("lc").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.lc(); }),
      	lit("lC").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.lC(); }),
      	lit("Lc").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.Lc(); }),
      	lit("LC").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.LC(); }),
      	lit("cC").to(function () { return MML.xypic.ObjectBox.Curve.Modifier.cC(); })
      );
    },
    
    // <curve-object> ::= <empty>
    //                |   '~*' <object> <curve-object>
    //                |   '~**' <object> <curve-object>
    curveObject: function () {
    	return rep(or(
      	lit("~*").andr(p.object).to(function (obj) {
        	return MML.xypic.ObjectBox.Curve.Object.Drop(obj);
        }),
      	lit("~**").andr(p.object).to(function (obj) {
        	return MML.xypic.ObjectBox.Curve.Object.Connect(obj);
        })
      ));
    },
    
    // <curve-poslist> ::= <empty> ^^ Empty List
    //           |   '&' <curve-poslist2> ^^ (c, <poslist>)
    //           |   <nonemptyPos> ^^ (<nonemptyPos>, Nil)
    //           |   <nonemptyPos> '&' <curve-poslist2> ^^ (<nonemptyPos>, <poslist>)
    //           |   '~@' ^^ (~@, Nil)
    //           |   '~@' '&' <curve-poslist2> ^^ (~@, <poslist>)
    // <curve-poslist2> ::= <empty> ^^ (c, Nil)
    //           |   '&' <curve-poslist2> ^^ (c, <poslist>)
    //           |   <nonemptyPos> ^^ (<nonemptyPos>, Nil)
    //           |   <nonemptyPos> '&' <curve-poslist2> ^^ (<nonemptyPos>, <poslist>)
    //           |   '~@' ^^ (~@, Nil)
    //           |   '~@' '&' <curve-poslist2> ^^ (~@, <poslist>)
    curvePoslist: function () {
    	return or(
      	lit("&").andr(p.curvePoslist2).to(function (ps) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.CurPos(), ps);
        }),
      	lit("~@").andr(flit("&")).andr(p.curvePoslist2).to(function (ps) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.AddStack(), ps);
        }),
      	lit("~@").to(function () {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.AddStack(), MathJax.List.empty);
        }),
      	p.pos().andl(flit("&")).and(p.curvePoslist2).to(function (pps) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.Pos(pps.head), pps.tail);
        }),
      	p.nonemptyPos().to(function (p) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.Pos(p), MathJax.List.empty);
        }),
        MathJax.Parsers.success("empty").to(function () {
        	return MathJax.List.empty;
        })
      );
    },
    curvePoslist2: function () {
    	return or(
      	lit("&").andr(p.curvePoslist2).to(function (ps) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.CurPos(), ps);
        }),
      	lit("~@").andr(flit("&")).andr(p.curvePoslist2).to(function (ps) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.AddStack(), ps);
        }),
      	lit("~@").to(function () {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.AddStack(), MathJax.List.empty);
        }),
      	p.nonemptyPos().andl(flit("&")).and(p.curvePoslist2).to(function (pps) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.Pos(pps.head), pps.tail);
        }),
      	p.nonemptyPos().to(function (p) {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.Pos(p), MathJax.List.empty);
        }),
        MathJax.Parsers.success("empty").to(function () {
        	return MathJax.List.Cons(MML.xypic.ObjectBox.Curve.PosList.CurPos(), MathJax.List.empty);
        })
      );
    },
    
    // <modifier> ::= '!' <vector>
    //            |   '[' <shape> ']'
    //            |   <add-op> <size>
    modifier: function () {
    	return or(
        lit("!").andr(p.vector).to(function (v) {
          return MML.xypic.Modifier.Vector(v);
        }),
        lit("[").andr(p.shape).andl(flit("]")).to(function (s) {
        	return MML.xypic.Modifier.Shape(s);
        }),
        function () {
          return p.addOp().and(p.size).to(function (os) {
            return MML.xypic.Modifier.AddOp(os.head, os.tail);
          })
        }
      );
    },
    
    // <add-op> ::= '+' | '-' | '=' | '+=' | '-='
    addOp: function () {
    	return or(
      	lit("+=").to(function () { return MML.xypic.Modifier.AddOp.GrowTo(); }),
      	lit("-=").to(function () { return MML.xypic.Modifier.AddOp.ShrinkTo(); }),
      	lit("+").to(function () { return MML.xypic.Modifier.AddOp.Grow(); }),
      	lit("-").to(function () { return MML.xypic.Modifier.AddOp.Shrink(); }),
      	lit("=").to(function () { return MML.xypic.Modifier.AddOp.Set(); })
      );
    },
    
    // <size> ::= <vector> | <empty>
    size: function () {
    	return or(
      	function () { return p.vector().to(function (v) {
          return MML.xypic.Modifier.AddOp.VactorSize(v);
        }) },
      	MathJax.Parsers.success("default size").to(function () {
          return MML.xypic.Modifier.AddOp.DefaultSize();
        })
      );
    },
    
    // <shape> ::= '.' | 'o' | 'l' | 'r' | 'u' | 'd' | 'c' | <empty>
    shape: function () {
    	return or(
      	lit(".").to(function () { return MML.xypic.Modifier.Shape.Point(); }),
      	lit("o").to(function () { return MML.xypic.Modifier.Shape.Circle(); }),
      	lit("l").to(function () { return MML.xypic.Modifier.Shape.L(); }),
      	lit("r").to(function () { return MML.xypic.Modifier.Shape.R(); }),
      	lit("u").to(function () { return MML.xypic.Modifier.Shape.U(); }),
      	lit("d").to(function () { return MML.xypic.Modifier.Shape.D(); }),
      	lit("c").to(function () { return MML.xypic.Modifier.Shape.C(); }),
      	MathJax.Parsers.success("rect").to(function () { return MML.xypic.Modifier.Shape.Rect(); })
      );
    },
    
    // <direction> ::= <direction0> <direction1>*
    // <direction0> ::= <diag>
    //              | 'v' <vector>
    // <direction1> | ':' <vector>
    //              | '_'
    //              | '^'
    direction: function () {
      return seq(p.direction0, rep(p.direction1)).to(function (drs){
        return MML.xypic.Direction.Compound(drs.head, drs.tail);
      });
    },
    direction0: function () {
      return or(
        lit('v').andr(p.vector).to(function (v) {
          return MML.xypic.Direction.Vector(v);
        }),
        p.diag().to(function (d) {
          return MML.xypic.Direction.Diag(d);
        })
      );
    },
    direction1: function () {
      return or(
        lit(':').andr(p.vector).to(function (v) {
          return MML.xypic.Direction.RotVector(v);
        }),
        lit('_').to(function (x) {
          return MML.xypic.Direction.RotCW();
        }),
        lit('^').to(function (x) {
          return MML.xypic.Direction.RotAntiCW();
        })
      );
    },
    
    // <diag> ::= 'l' | 'r' | 'd' | 'u' | 'ld' | 'rd' | 'lu' | 'ru'
    //        | <empty>
    diag: fun(or(
      regexLit(/^(ld|dl)/).to(function (x) { return MML.xypic.Diag.Angle('ld', -3*Math.PI/4); }),
      regexLit(/^(rd|dr)/).to(function (x) { return MML.xypic.Diag.Angle('rd', -Math.PI/4); }),
      regexLit(/^(lu|ul)/).to(function (x) { return MML.xypic.Diag.Angle('lu', 3*Math.PI/4); }),
      regexLit(/^(ru|ur)/).to(function (x) { return MML.xypic.Diag.Angle('ru', Math.PI/4); }),
      lit('l').to(function (x) { return MML.xypic.Diag.Angle('l', Math.PI); }),
      lit('r').to(function (x) { return MML.xypic.Diag.Angle('r', 0); }),
      lit('d').to(function (x) { return MML.xypic.Diag.Angle('d', -Math.PI/2); }),
      lit('u').to(function (x) { return MML.xypic.Diag.Angle('u', Math.PI/2); }),
      MathJax.Parsers.success("empty").to(function (x) {
        return MML.xypic.Diag.Default();
      })
    )),
  })();

  MathJax.Hub.Insert(TEXDEF,{
    environment: {
      xy:            ['XY', null]
    }
  });
  
  MathJax.Parsers.ParseError = MathJax.Object.Subclass({
    Init: function (parseResult) {
      this.parseResult = parseResult;
    },
    toMML: function () {
      var pos = this.parseResult.next.pos();
      var lineContents = pos.lineContents();
      var col = pos.column();
      var left = lineContents.substring(0, col-1);
      var mid = lineContents.substring(col-1, col);
      var right = lineContents.substring(col);
      return MML.merror(MML.mtext('parse error at or near "'), MML.mtext(left).With({color:"black"}), MML.mtext(mid).With({color:"red"}), MML.mtext(right).With({color:"black"}), MML.mtext('"'));
    },
    texError: true,
    parseError: true
  });
  
  TEX.Parse.Augment({
    /*
     * Handle XY environment
     */
    XY: function(begin) {
      try {
      	var input = MathJax.StringReader(this.string, this.i);
        var result = MathJax.Parsers.parse(p.xy(), input);
        this.i = result.next.offset;
//        console.log(result.toString());
      } catch (e) {
        console.log(e.toString());
        throw e;
      }
      
      if (result.successful) {
        if (supportGraphics) {
          this.Push(MML.xypic(result.result));
        } else {
          this.Push(MML.merror("Unsupported Browser. Please open with Firefox/Safari/Chrome"));
        }
      } else {
        throw MathJax.Parsers.ParseError(result);
      }
      
      return begin;
    }
  });
  
  var supportGraphics = false;
  MathJax.Hub.Browser.Select({
    Firefox: function (browser) {
      supportGraphics = true;
    },
    Safari: function (browser) {
      supportGraphics = true;
    },
    Chrome: function (browser) {
      supportGraphics = true;
    }
  });
  
  MathJax.Hub.Startup.signal.Post("TeX XYpic Ready");
});

MathJax.Ajax.loadComplete("[MathJax]/extensions/TeX/XYpic.js");
