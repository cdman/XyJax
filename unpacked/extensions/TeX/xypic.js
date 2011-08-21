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

MathJax.Extension.xypic = {
  version: "0.1",
  AST: {}
};

MathJax.Hub.Register.StartupHook("TeX Jax Ready",function () {
  var FP = MathJax.Extension.fp;
  var MML = MathJax.ElementJax.mml;
  var TEX = MathJax.InputJax.TeX;
  var TEXDEF = TEX.Definitions;
  var AST = MathJax.Extension.xypic.AST;
  
  MathJax.Hub.Insert(TEXDEF, {
    environment: {
      xy: ['ExtensionEnv', null, 'XYpic']
    }
  });
  
  var tex_formatError = TEX.formatError;
  TEX.formatError = function (err,math,displaystyle,script) {
    if (err.parseError !== undefined) {
      return err.toMML();
    } else {
      return tex_formatError(err, math, displaystyle, script);
    }
  }

  AST.xypic = MML.mbase.Subclass({
    Init: function (cmd) {
      this.data = [];
      this.cmd = cmd;
    },
    type: "xypic",
    inferRow: false,
    defaults: {
      mathbackground: MML.INHERIT,
      mathcolor: MML.INHERIT,
      notation: MML.NOTATION.LONGDIV,
      texClass: MML.TEXCLASS.ORD
    },
    setTeXclass: MML.mbase.setSeparateTeXclasses,
    toString: function () { return this.type + "(" + this.cmd + ")"; }
  });
  
  // <pos>
  AST.Pos = MathJax.Object.Subclass({});
  // <pos> ::= <coord> <pos2>*
  AST.Pos.Coord = MathJax.Object.Subclass({
    Init: function (coord, pos2s) {
      this.coord = coord;
      this.pos2s = pos2s;
    },
    toString: function () {
      return "Pos(" + this.coord + ", " + this.pos2s.mkString(", ") + ")";
    }
  });
  // <pos2> ::= '+' <coord>
  AST.Pos.Plus = MathJax.Object.Subclass({
    Init: function (coord) {
      this.coord = coord;
    },
    toString: function () {
      return "+(" + this.coord + ")";
    }
  });
  // <pos2> ::= '-' <coord>
  AST.Pos.Minus = MathJax.Object.Subclass({
    Init: function (coord) {
      this.coord = coord;
    },
    toString: function () {
      return "-(" + this.coord + ")";
    }
  });
  // <pos2> ::= ',' <coord>
  AST.Pos.Then = MathJax.Object.Subclass({
    Init: function (coord) {
      this.coord = coord;
    },
    toString: function () {
      return ",(" + this.coord + ")";
    }
  });
  // <pos2> ::= ';' <coord>
  AST.Pos.SwapPAndC = MathJax.Object.Subclass({
    Init: function (coord) {
      this.coord = coord;
    },
    toString: function () {
      return ";(" + this.coord + ")";
    }
  });
  // <pos2> ::= '**' <object>
  AST.Pos.ConnectObject = MathJax.Object.Subclass({
    Init: function (object) {
      this.object = object;
    },
    toString: function () {
      return "**(" + this.object + ")";
    }
  });
  // <pos2> ::= '*' <object>
  AST.Pos.DropObject = MathJax.Object.Subclass({
    Init: function (object) {
      this.object = object;
    },
    toString: function () {
      return "*(" + this.object + ")";
    }
  });
  // <pos2> ::= '?' <place>
  AST.Pos.Place = MathJax.Object.Subclass({
    Init: function (place) {
      this.place = place;
    },
    toString: function () {
      return "?(" + this.place + ")";
    }
  });
  // <pos2> ::= '=' <saving>
  // <saving> ::= '"' <id> '"'
  AST.Pos.SavingPos = MathJax.Object.Subclass({
    Init: function (id) {
      this.id = id;
    },
    toString: function () {
      return "=(" + this.id + ")";
    }
  });
	// <saving> ::= '@:"' <id> '"'
	// <saving> ::= '@' <coord> '"' <id> '"'
	// <saving> ::= '@@"' <id> '"'
  // TODO: impl <saving>
  
  // <coord> 
  AST.Coord = MathJax.Object.Subclass({});
  // <coord> ::= <vector>
  AST.Coord.Vector = MathJax.Object.Subclass({
    Init: function (vector) {
      this.vector = vector;
    },
    toString: function () {
      return this.vector.toString();
    }
  });
  // <coord> ::= <empty> | 'c'
  AST.Coord.C = MathJax.Object.Subclass({
    toString: function () {
      return "c";
    }
  });
  // <coord> ::= 'p'
  AST.Coord.P = MathJax.Object.Subclass({
    toString: function () {
      return "p";
    }
  });
  // <coord> ::= 'x'
  AST.Coord.X = MathJax.Object.Subclass({
    toString: function () {
      return "x";
    }
  });
  // <coord> ::= 'y'
  AST.Coord.Y = MathJax.Object.Subclass({
    toString: function () {
      return "y";
    }
  });
  // <coord> ::= '"' <id> '"'
  AST.Coord.Id = MathJax.Object.Subclass({
    Init: function (id) {
      this.id = id;
    },
    toString: function () {
      return '"' + this.id + '"';
    }
  });
  
  // <vector>
  AST.Vector = MathJax.Object.Subclass({});
  // <vector> ::= '(' <factor> ',' <factor> ')'
  AST.Vector.InCurBase = MathJax.Object.Subclass({
    Init: function (x, y) {
      this.x = x;
      this.y = y;
    },
    toString: function () {
      return "(" + this.x + ", " + this.y + ")";
    }
  });
  // <vector> ::= '<' <dimen> ',' <dimen> '>'
  // <vector> ::= '<' <dimen> '>'
  AST.Vector.Abs = MathJax.Object.Subclass({
    Init: function (x, y) {
      this.x = x;
      this.y = y;
    },
    toString: function () {
      return "<" + this.x + ", " + this.y + ">";
    }
  });
  // <vector> ::= 'a' '(' <number> ')'
  AST.Vector.Angle = MathJax.Object.Subclass({
    Init: function (degree) {
      this.degree = degree;
    },
    toString: function () {
      return "a(" + this.degree + ")";
    }
  });
  // <vector> ::= '/' <direction> <dimen> '/'
  AST.Vector.Dir = MathJax.Object.Subclass({
    Init: function (dir, dimen) {
      this.dir = dir;
      this.dimen = dimen;
    },
    toString: function () {
      return "/" + this.dir + " " + this.dimen + "/";
    }
  });
  // <vector> ::= <corner>
  //          |   <corner> '(' <factor> ')'
  AST.Vector.Corner = MathJax.Object.Subclass({
    Init: function (corner, factor) {
      this.corner = corner;
      this.factor = factor;
    },
    toString: function () {
      return this.corner.toString() + "(" + this.factor + ")";
    }
  });
  
  // <corner> ::= 'L' | 'R' | 'D' | 'U'
  //          | 'CL' | 'CR' | 'CD' | 'CU'
  //          | 'LD' | 'RD' | 'LU' | 'RU'
  //          | 'E' | 'P'
  //          | 'A'
  AST.Corner = MathJax.Object.Subclass({});
  AST.Corner.L = MathJax.Object.Subclass({
  	toString: function () { return "L"; }
  });
  AST.Corner.R = MathJax.Object.Subclass({
  	toString: function () { return "R"; }
  });
  AST.Corner.D = MathJax.Object.Subclass({
  	toString: function () { return "D"; }
  });
  AST.Corner.U = MathJax.Object.Subclass({
  	toString: function () { return "U"; }
  });
  AST.Corner.CL = MathJax.Object.Subclass({
  	toString: function () { return "CL"; }
  });
  AST.Corner.CR = MathJax.Object.Subclass({
  	toString: function () { return "CR"; }
  });
  AST.Corner.CD = MathJax.Object.Subclass({
  	toString: function () { return "CD"; }
  });
  AST.Corner.CU = MathJax.Object.Subclass({
  	toString: function () { return "CU"; }
  });
  AST.Corner.LD = MathJax.Object.Subclass({
  	toString: function () { return "LD"; }
  });
  AST.Corner.RD = MathJax.Object.Subclass({
  	toString: function () { return "RD"; }
  });
  AST.Corner.LU = MathJax.Object.Subclass({
  	toString: function () { return "LU"; }
  });
  AST.Corner.RU = MathJax.Object.Subclass({
  	toString: function () { return "RU"; }
  });
  AST.Corner.NearestEdgePoint = MathJax.Object.Subclass({
  	toString: function () { return "E"; }
  });
  AST.Corner.PropEdgePoint = MathJax.Object.Subclass({
  	toString: function () { return "P"; }
  });
  AST.Corner.Axis = MathJax.Object.Subclass({
  	toString: function () { return "A"; }
  });
  
  // <place> ::= '<' <place>
  // <place> ::= '>' <place>
  // <place> ::= '(' <factor> ')' <place>
  // <place> ::= '!' '{' <pos> '}' <slide>
  // <place> ::= <slide>
  AST.Place = MathJax.Object.Subclass({
  	Init: function (shaveP, shaveC, factor, slide) {
    	this.shaveP = shaveP;
      this.shaveC = shaveC;
      this.factor = factor;
      this.slide = slide;
    },
    compound: function (that) {
    	return AST.Place(
      	this.shaveP + that.shaveP,
        this.shaveC + that.shaveC,
        (that.factor === undefined? this.factor : that.factor),
        that.slide);
    },
    toString: function () {
    	var desc = "";
      for (var l = 0; l < this.shaveP; l++) {
      	desc += "<";
      }
      for (var r = 0; r < this.shaveC; r++) {
      	desc += ">";
      }
      if (this.factor !== undefined) {
      	desc += "(" + this.factor + ")";
      }
      if (this.slide.dimen !== undefined) {
      	desc += "/" + this.slide.dimen + "/";
      }
      return desc;
    }
  });
  AST.Place.Factor = MathJax.Object.Subclass({
    Init: function (factor) {
      this.factor = factor;
    },
    isIntercept: false,
    toString: function () {
      return this.factor.toString();
    }
  });
  AST.Place.Intercept = MathJax.Object.Subclass({
    Init: function (pos) {
      this.pos = pos;
    },
    isIntercept: true,
    toString: function () {
      return "!{" + this.pos + "}";
    }
  });
  
  // <slide> ::= <empty>
  // <slide> ::= '/' <dimen> '/'
  AST.Slide = MathJax.Object.Subclass({
  	Init: function (dimen) {
    	this.dimen = dimen;
    },
    toString: function () {
    	if (this.dimen === undefined) {
      	return "";
      } else {
      	return dimen;
      }
    }
  });
  
  
  // <object> ::= <modifier>* <objectbox>
  AST.Object = MathJax.Object.Subclass({
  	Init: function (modifiers, object) {
    	this.modifiers = modifiers;
      this.object = object;
    },
    dirVariant: function () { return this.object.dirVariant(); },
    dirMain: function () { return this.object.dirMain(); },
    isDir: function () { return this.object.isDir(); },
    toString: function () {
    	return this.modifiers.mkString() + this.object.toString();
    }
  });
  
  // <objectbox>
  AST.ObjectBox = MathJax.Object.Subclass({});
  // <objectbox> ::= '{' <text> '}'
  AST.ObjectBox.Text = AST.ObjectBox.Subclass({
  	Init: function (math) {
    	this.math = math;
    },
    dirVariant: function () { return undefined; },
    dirMain: function () { return undefined; },
    isDir: function () { return false; },
    toString: function () { return "{" + this.math.toString() + "}"; }
  });
  
  // <objectbox> ::= '\cir' <radius> '{' <cir> '}'
  // <radius> ::= <vector>
  //          | <empty>
  // <cir> ::= <diag> <orient> <diag>
  //       | <empty>
  AST.ObjectBox.Cir = AST.ObjectBox.Subclass({
    Init: function (radius, cir) {
      this.radius = radius;
      this.cir = cir;
    },
    toString: function () {
      return "\\cir"+this.radius+"{"+this.cir+"}";
    }
  });
  AST.ObjectBox.Cir.Radius = MathJax.Object.Subclass({});
  AST.ObjectBox.Cir.Radius.Vector = MathJax.Object.Subclass({
    Init: function (vector) {
      this.vector = vector;
    },
    toString: function () { return this.vector.toString(); }
  });
  AST.ObjectBox.Cir.Radius.Default = MathJax.Object.Subclass({
    toString: function () { return ""; }
  });
  AST.ObjectBox.Cir.Cir = MathJax.Object.Subclass({});
  AST.ObjectBox.Cir.Cir.Segment = MathJax.Object.Subclass({
    Init: function (startDiag, orient, endDiag) {
      this.startDiag = startDiag;
      this.orient = orient;
      this.endDiag = endDiag;
    },
    toString: function () { return this.startDiag.toString()+this.orient+this.endDiag; }
  });
  AST.ObjectBox.Cir.Cir.Full = MathJax.Object.Subclass({
    toString: function () { return ""; }
  });
  
  // <objectbox> ::= '\dir' <variant> '{' <main> '}'
  // <variant> ::= '^' | '_' | '2' | '3' | <empty>
  // <main> ::= <empty> | '--' | '-' | '..' | '.' | '~~' | '~' | '>>|' | '>|' | '>>' | '<<' | '>' | '<' | '(' | ')' | '`' | "'" | '||' | '|-' | '|<' | '|<<' | '|' | '*' | '+' | 'x' | '//' | '/' | 'o' | '==' | '=' | '::' | ':'
  AST.ObjectBox.Dir = AST.ObjectBox.Subclass({
  	Init: function (variant, main) {
    	this.variant = variant;
    	this.main = main;
    },
    dirVariant: function () { return this.variant; },
    dirMain: function () { return this.main; },
    isDir: function () { return true; },
    toString: function () { return "\\dir" + this.variant + "{" + this.main + "}"; }
  });
  
  // <objectbox> ::= '\crv' <curve-modifier> '{' <curve-object> <curve-poslist> '}'
  AST.ObjectBox.Curve = AST.ObjectBox.Subclass({
  	Init: function (modifiers, objects, poslist) {
    	this.modifiers = modifiers;
    	this.objects = objects;
    	this.poslist = poslist;
    },
    dirVariant: function () { return ""; },
    dirMain: function () { return "-"; },
    isDir: function () { return false; },
    toString: function () { return "\\curve"+this.modifiers.mkString(" ")+"{"+this.objects.mkString(" ")+" "+this.poslist.mkString("&")+"}"; }
  });
  // <curve-modifier> ::= ( '~' <curve-option> )*
  // <curve-option> ::= 'p' | 'P' | 'l' | 'L' | 'c' | 'C'
  //                |   'pc' | 'pC' | 'Pc' | 'PC'
  //                |   'lc' | 'lC' | 'Lc' | 'LC'
  //                |   'cC'
  AST.ObjectBox.Curve.Modifier = MathJax.Object.Subclass({});
  AST.ObjectBox.Curve.Modifier.p = MathJax.Object.Subclass({
    toString: function () { return "~p"; }
  });
  AST.ObjectBox.Curve.Modifier.P = MathJax.Object.Subclass({
    toString: function () { return "~P"; }
  });
  AST.ObjectBox.Curve.Modifier.l = MathJax.Object.Subclass({
    toString: function () { return "~l"; }
  });
  AST.ObjectBox.Curve.Modifier.L = MathJax.Object.Subclass({
    toString: function () { return "~L"; }
  });
  AST.ObjectBox.Curve.Modifier.c = MathJax.Object.Subclass({
    toString: function () { return "~c"; }
  });
  AST.ObjectBox.Curve.Modifier.C = MathJax.Object.Subclass({
    toString: function () { return "~C"; }
  });
  AST.ObjectBox.Curve.Modifier.pc = MathJax.Object.Subclass({
    toString: function () { return "~pc"; }
  });
  AST.ObjectBox.Curve.Modifier.pC = MathJax.Object.Subclass({
    toString: function () { return "~pC"; }
  });
  AST.ObjectBox.Curve.Modifier.Pc = MathJax.Object.Subclass({
    toString: function () { return "~Pc"; }
  });
  AST.ObjectBox.Curve.Modifier.PC = MathJax.Object.Subclass({
    toString: function () { return "~PC"; }
  });
  AST.ObjectBox.Curve.Modifier.lc = MathJax.Object.Subclass({
    toString: function () { return "~lc"; }
  });
  AST.ObjectBox.Curve.Modifier.lC = MathJax.Object.Subclass({
    toString: function () { return "~lC"; }
  });
  AST.ObjectBox.Curve.Modifier.Lc = MathJax.Object.Subclass({
    toString: function () { return "~Lc"; }
  });
  AST.ObjectBox.Curve.Modifier.LC = MathJax.Object.Subclass({
    toString: function () { return "~LC"; }
  });
  AST.ObjectBox.Curve.Modifier.cC = MathJax.Object.Subclass({
    toString: function () { return "~cC"; }
  });
  // <curve-object> ::= <empty>
  //                |   '~*' <object> <curve-object>
  //                |   '~**' <object> <curve-object>
  AST.ObjectBox.Curve.Object = MathJax.Object.Subclass({});
  AST.ObjectBox.Curve.Object.Drop = MathJax.Object.Subclass({
  	Init: function (object) {
    	this.object = object;
    },
    toString: function () { return "~*" + this.object; }
  });
  AST.ObjectBox.Curve.Object.Connect = MathJax.Object.Subclass({
  	Init: function (object) {
    	this.object = object;
    },
    toString: function () { return "~**" + this.object; }
  });
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
  AST.ObjectBox.Curve.PosList = MathJax.Object.Subclass({});
  AST.ObjectBox.Curve.PosList.CurPos = MathJax.Object.Subclass({
    toString: function () { return ""; }
  });
  AST.ObjectBox.Curve.PosList.Pos = MathJax.Object.Subclass({
  	Init: function (pos) {
    	this.pos = pos;
    },
    toString: function () { return this.pos.toString(); }
  });
  AST.ObjectBox.Curve.PosList.AddStack = MathJax.Object.Subclass({
    toString: function () { return "~@"; }
  });
  
  // <modifier>
  AST.Modifier = MathJax.Object.Subclass({});
  // <modifier> ::= '!' <vector>
  AST.Modifier.Vector = MathJax.Object.Subclass({
  	Init: function (vector) {
    	this.vector = vector;
    },
    toString: function () { return "!" + this.vector; }
  });
  // <modifier> ::= <add-op> <size>
  // <add-op> ::= '+' | '-' | '=' | '+=' | '-='
  // <size> ::= <vector> | <empty>
  AST.Modifier.AddOp = MathJax.Object.Subclass({
  	Init: function (op, size) {
    	this.op = op;
      this.size = size;
    },
    toString: function () { return this.op.toString() + " " + this.size; }
  });
  AST.Modifier.AddOp.Grow = MathJax.Object.Subclass({
    toString: function () { return '+'; }
  });
  AST.Modifier.AddOp.Shrink = MathJax.Object.Subclass({
    toString: function () { return '-'; }
  });
  AST.Modifier.AddOp.Set = MathJax.Object.Subclass({
    toString: function () { return '='; }
  });
  AST.Modifier.AddOp.GrowTo = MathJax.Object.Subclass({
    toString: function () { return '+='; }
  });
  AST.Modifier.AddOp.ShrinkTo = MathJax.Object.Subclass({
    toString: function () { return '-='; }
  });
  AST.Modifier.AddOp.VactorSize = MathJax.Object.Subclass({
    Init: function (vector) {
      this.vector = vector;
    },
    isDefault: false,
    toString: function () { return this.vector.toString(); }
  });
  AST.Modifier.AddOp.DefaultSize = MathJax.Object.Subclass({
    isDefault: true,
    toString: function () { return ""; }
  });
  
  // <modifier> ::= '[' <shape> ']'
  // <shape> ::= '.' | 'o' | 'l' | 'r' | 'u' | 'd' | 'c' | <empty>
  AST.Modifier.Shape = MathJax.Object.Subclass({
  	Init: function (shape) {
    	this.shape = shape;
    },
    toString: function () { return "[" + this.shape + "]"; }
  });
  AST.Modifier.Shape.Point = MathJax.Object.Subclass({
  	toString: function () { return "."; }
  });
  AST.Modifier.Shape.Rect = MathJax.Object.Subclass({
  	toString: function () { return ""; }
  });
  AST.Modifier.Shape.Circle = MathJax.Object.Subclass({
  	toString: function () { return "o"; }
  });
  AST.Modifier.Shape.L = MathJax.Object.Subclass({
  	toString: function () { return "l"; }
  });
  AST.Modifier.Shape.R = MathJax.Object.Subclass({
  	toString: function () { return "r"; }
  });
  AST.Modifier.Shape.U = MathJax.Object.Subclass({
  	toString: function () { return "u"; }
  });
  AST.Modifier.Shape.D = MathJax.Object.Subclass({
  	toString: function () { return "d"; }
  });
  AST.Modifier.Shape.C = MathJax.Object.Subclass({
  	toString: function () { return "c"; }
  });
  
  // <direction>
  AST.Direction = MathJax.Object.Subclass({});
  // <direction> ::= <direction0> <direction1>*
  AST.Direction.Compound = MathJax.Object.Subclass({
  	Init: function (dir, rots) {
    	this.dir = dir;
      this.rots = rots;
    },
    toString: function () {
    	return this.dir.toString() + this.rots.mkString();
    }
  });
  // <direction0> ::= <diag>
  AST.Direction.Diag = MathJax.Object.Subclass({
  	Init: function (diag) {
    	this.diag = diag;
    },
    toString: function () { return this.diag.toString(); }
  });
  // <direction0> ::= 'v' <vector>
  AST.Direction.Vector = MathJax.Object.Subclass({
  	Init: function (vector) {
    	this.vector = vector;
    },
    toString: function () { return "v" + this.vector.toString(); }
  });
  // <direction1> ::= ':' <vector>
  AST.Direction.RotVector = MathJax.Object.Subclass({
  	Init: function (vector) {
    	this.vector = vector;
    },
    toString: function () { return ":" + this.vector.toString(); }
  });
  // <direction1> ::= '_'
  AST.Direction.RotAntiCW = MathJax.Object.Subclass({
    toString: function () { return "_"; }
  });
  // <direction1> ::= '^'
  AST.Direction.RotCW = MathJax.Object.Subclass({
    toString: function () { return "^"; }
  });
  // <direction0> ::=  'q' '{' <pos> <decor> '}'
  // TODO: impl <direction> ::= q {<pos> <decor>}
  
  // <diag>
  AST.Diag = MathJax.Object.Subclass({});
  // <diag> ::= <empty>
  AST.Diag.Default = MathJax.Object.Subclass({
  	toString: function () { return ""; }
  });
  // <diag> ::= 'l' | 'r' | 'd' | 'u' | 'ld' | 'rd' | 'lu' | 'ru'
  AST.Diag.Angle = MathJax.Object.Subclass({
  	Init: function (symbol, angle) {
    	this.symbol = symbol;
      this.ang = angle;
    },
  	toString: function () { return this.symbol; }
  });
  

  var fun = FP.Parsers.fun;
  var elem = FP.Parsers.elem;
  var felem = function (x) { return fun(FP.Parsers.elem(x)); }
  var lit = FP.Parsers.literal;
  var regex = FP.Parsers.regex;
  var regexLit = FP.Parsers.regexLiteral;
  var flit = function (x) { return fun(FP.Parsers.literal(x)); }
  var seq = FP.Parsers.seq;
  var or = FP.Parsers.or;
  var rep = function (x) { return FP.Parsers.lazyParser(x)().rep(); }
  var memo = function (parser) {
    return function () {
      var m = parser.memo;
      if (m === undefined) {
        m = parser.memo = parser();
      }
      return m;
    }
  }
  
  var p = FP.Parsers.Subclass({
    // <pos> '\end' '{' 'xy' '}'
    xy: memo(function () {
      return p.pos().into(function (pos) {
        return FP.Parsers.guard(function() { return lit('\\end').andl(flit('{')).andl(flit('xy')).andl(flit('}')).to(function () {
          return pos;
        })});
      });
    }),
    
    // <pos> ::= <coord> <pos2>*
    pos: memo(function () {
      return seq(p.coord, rep(p.pos2)).to(function (cps) {
        return AST.Pos.Coord(cps.head, cps.tail);
      });
    }),
    
    // <nonemptyPos> ::= <coord> <pos2>*
    nonemptyPos: memo(function () {
      return seq(p.nonemptyCoord, rep(p.pos2)).to(function (cps) {
        return AST.Pos.Coord(cps.head, cps.tail);
      });
    }),
    
    // <pos2> ::= ';' <coord>
    //        |   '**' <object>
    //        |   '*' <object>
    //        |   '?' <place>
    //        |   '=' <saving>
    pos2: memo(function () {
      return or(
        lit('+').andr(p.coord).to(function (c) { return AST.Pos.Plus(c); }),
        lit('-').andr(p.coord).to(function (c) { return AST.Pos.Minus(c); }),
        lit(',').andr(p.coord).to(function (c) { return AST.Pos.Then(c); }),
        lit(';').andr(p.coord).to(function (c) { return AST.Pos.SwapPAndC(c); }),
        lit('**').andr(p.object).to(function (o) { return AST.Pos.ConnectObject(o); }),
        lit('*').andr(p.object).to(function (o) { return AST.Pos.DropObject(o); }),
        lit('?').andr(p.place).to(function (o) { return AST.Pos.Place(o); }),
        lit('=').andr(flit('"')).andr(p.id).andl(felem('"')).to(function (o) { return AST.Pos.SavingPos(o); })
      );
    }),
    
    // <coord> ::= <nonemptyCoord> | <empty>
    coord: memo(function () {
      return or(
        p.nonemptyCoord,
        FP.Parsers.success('empty').to(function () { return AST.Coord.C(); })
      );
    }),
    
    // <nonemptyCoord> ::= 'c' | 'p' | 'x' | 'y'
    //         |   <vector>
    //         |   '"' <id> '"'
    nonemptyCoord: memo(function () {
      return or(
        lit('c').to(function () { return AST.Coord.C(); }), 
        lit('p').to(function () { return AST.Coord.P(); }), 
        lit('x').to(function () { return AST.Coord.X(); }), 
        lit('y').to(function () { return AST.Coord.Y(); }),
        p.vector().to(function (v) { return AST.Coord.Vector(v); }), 
        lit('"').andr(p.id).andl(felem('"')).to(function (id) { return AST.Coord.Id(id) })
      );
    }),
    
    // <vector> ::= '(' <factor> ',' <factor> ')'
    //          |   '<' <dimen> ',' <dimen> '>'
    //          |   '<' <dimen> '>'
    //          |   'a' '(' <number> ')'
    //          |   '/' <direction> <loose-dimen> '/'
    //          |   0
    //          |   <corner>
    //          |   <corner> '(' <factor> ')'
    vector: memo(function () {
      return or(
        lit('(').andr(p.factor).andl(flit(',')).and(p.factor).andl(flit(')')).to(
          function (xy) {
            return AST.Vector.InCurBase(xy.head, xy.tail);
          }
        ),
        lit('<').andr(p.dimen).andl(flit(',')).and(p.dimen).andl(flit('>')).to(
          function (xy) {
            return AST.Vector.Abs(xy.head, xy.tail);
          }
        ),
        lit('<').andr(p.dimen).andl(flit('>')).to(
          function (x) {
            return AST.Vector.Abs(x, x);
          }
        ),
        lit('a').andr(flit('(')).andr(p.number).andl(flit(')')).to(
          function (d) {
            return AST.Vector.Angle(d);
          }
        ),
        lit('/').andr(p.direction).and(p.looseDimen).andl(flit('/')).to(
          function (dd) {
            return AST.Vector.Dir(dd.head, dd.tail);
          }
        ),
        lit('0').to(function (x) { return AST.Vector.InCurBase(0, 0); }),
        function () { return p.corner().and(fun(FP.Parsers.opt(
        	fun(lit('(').andr(p.factor).andl(flit(')')))).to(function (f) {
          	return f.getOrElse(1);
          }))).to(function (cf) {
          	return AST.Vector.Corner(cf.head, cf.tail);
        	})
        }
      );
    }),
    
    // <corner> ::= 'L' | 'R' | 'D' | 'U'
    //          | 'CL' | 'CR' | 'CD' | 'CU' | 'LC' | 'RC' | 'DC' | 'UC'
    //          | 'LD' | 'RD' | 'LU' | 'RU' | 'DL' | 'DR' | 'UL' | 'UR'
    //          | 'E' | 'P'
    //          | 'A'
    corner: memo(function () {
    	return or(
      	regexLit(/^(CL|LC)/).to(function () { return AST.Corner.CL(); }),
      	regexLit(/^(CR|RC)/).to(function () { return AST.Corner.CR(); }),
      	regexLit(/^(CD|DC)/).to(function () { return AST.Corner.CD(); }),
      	regexLit(/^(CU|UC)/).to(function () { return AST.Corner.CU(); }),
      	regexLit(/^(LD|DL)/).to(function () { return AST.Corner.LD(); }),
      	regexLit(/^(RD|DR)/).to(function () { return AST.Corner.RD(); }),
      	regexLit(/^(LU|UL)/).to(function () { return AST.Corner.LU(); }),
      	regexLit(/^(RU|UR)/).to(function () { return AST.Corner.RU(); }),
      	lit('L').to(function () { return AST.Corner.L(); }),
      	lit('R').to(function () { return AST.Corner.R(); }),
      	lit('D').to(function () { return AST.Corner.D(); }),
      	lit('U').to(function () { return AST.Corner.U(); }),
      	lit('E').to(function () { return AST.Corner.NearestEdgePoint(); }),
      	lit('P').to(function () { return AST.Corner.PropEdgePoint(); }),
      	lit('A').to(function () { return AST.Corner.Axis(); })
      );
    }),
    
    // <place> ::= '<' <place>
    //         | '>' <place>
    //         | '(' <factor> ')' <place>
    //         | '!' '{' <pos> '}' <slide>
    //         | <slide>
    place: memo(function () {
      return or(
        lit('<').andr(p.place).to(function (pl) {
          return AST.Place(1, 0, undefined, undefined).compound(pl);
        }), 
        lit('>').andr(p.place).to(function (pl) {
          return AST.Place(0, 1, undefined, undefined).compound(pl);
        }), 
        lit('(').andr(p.factor).andl(flit(')')).and(p.place).to(function (pl) {
          return AST.Place(0, 0, AST.Place.Factor(pl.head), undefined).compound(pl.tail);
        }), 
        lit('!').andr(flit('{')).andr(p.pos).andl(flit('}')).and(p.slide).to(function (ps) {
          return AST.Place(0, 0, AST.Place.Intercept(ps.head), ps.tail);
        }),
        function () { return p.slide().to(function (s) {
          return AST.Place(0, 0, undefined, s);
        }) }
      );
    }),
    
    // <slide> ::= '/' <dimen> '/'
    //         | <empty>
    slide: memo(function () {
      return or(
        lit('/').andr(p.dimen).andl(flit('/')).to(function (d) {
          return AST.Slide(d);
        }),
        FP.Parsers.success("no slide").to(function () {
          return AST.Slide(undefined);
        })
      );
    }),
    
    // <factor>
    factor: memo(fun(regexLit(/^[+\-]?(\d+(\.\d*)?|\d*\.\d+)/).to(
      function (v) { return parseFloat(v); })
    )),
    
    // <number>
    number: memo(fun(regexLit(/^[+\-]?\d+/).to(
      function (n) { return parseInt(n); })
    )),
    
    unit: memo(fun(regexLit(/^(em|ex|px|pt|pc|in|cm|mm|mu)/).to(function (d) {
        return d//.getOrElse("mm");
    }))),
    
    // <dimen> ::= <factor> ( 'em' | 'ex' | 'px' | 'pt' | 'pc' | 'in' | 'cm' | 'mm' | 'mu' )?
    dimen: memo(function () {
      return p.factor().and(p.unit).to(function (x) {
        return x.head.toString() + x.tail;
      })
    }),
    
    // <loose-dimen> ::= <loose-factor> ( 'em' | 'ex' | 'px' | 'pt' | 'pc' | 'in' | 'cm' | 'mm' | 'mu' )?
    looseDimen: memo(function () {
      return p.looseFactor().and(p.unit).to(function (x) {
        return x.head.toString() + x.tail;
      })
    }),
    
    // <loose-factor>
    // makeshift against /^ 3.5mm/ converted to /^ 3 .5mm/ by MathJax.InputJax.TeX.prefilterMath()
    looseFactor: memo(fun(or(
      regexLit(/^(\d \d*(\.\d*))/).to(function (v) {
        return parseFloat(v.replace(/ /, ""));
      }),
      regexLit(/^[+\-]?(\d+(\.\d*)?|\d*\.\d+)/).to(function (v) {
        return parseFloat(v);
      })
    ))),
    
    // <id>
    id: memo(fun(regex(/^[^"]+/))), // "
    
    // <object> ::= <modifier>* <objectbox>
    object: memo(function () {
      return or(
        rep(p.modifier).and(p.objectbox).to(function (mso) {
          return AST.Object(mso.head, mso.tail);
        })
      );
    }),
    
    // <objectbox> ::= '{' <text> '}'
    //          | '@' <dir>
    //          | '\dir' <dir>
    //          | '\cir' <radius> '{' <cir> '}'
    //          | <curve>
    objectbox: memo(function () {
      return or(lit("{").andr(p.text).andl(felem("}")).to(function (math) {
          var mml = TEX.Parse(math).mml();
          if (mml.inferred) {
            mml = MML.apply(MathJax.ElementJax,mml.data);
          } else {
            mml = MML(mml);
          }
          TEX.combineRelations(mml.root);
          return AST.ObjectBox.Text(mml.root);
        }),
        lit("@").andr(p.dir),
        lit("\\dir").andr(p.dir),
        lit("\\cir").andr(p.radius).andl(flit("{")).and(p.cir).andl(flit("}")).to(function (rc) {
          return AST.ObjectBox.Cir(rc.head, rc.tail);
        }),
        p.curve
      );
    }),
    
    // <text> ::= /[^{}]*/ ( '{' <text> '}' /[^{}]*/ )*
    text: memo(function () {
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
    }),
		
    // <dir> ::= <variant> '{' <main> '}'
    // <variant> ::= '^' | '_' | '2' | '3' | <empty>
    // <main> ::= <empty> | '--' | '-' | '..' | '.' | '~~' | '~' | '>>|' | '>|' | '>>' | '<<' | '>' | '<' | '(' | ')' | '`' | "'" | '||' | '|-' | '|<' | '|<<' | '|' | '*' | '+' | 'x' | '//' | '/' | 'o' | '==' | '=' | '::' | ':'
    dir: memo(function () {
      return regexLit(/^[\^_23]/).opt().andl(flit('{')).and(fun(regexLit(/^(--|-|\.\.|\.|~~|~|>>\||>\||>>|<<|>|<|\(|\)|`|'|\|\||\|-|\|<|\|<<|\||\*|\+|x|\/\/|\/|o|==|=|::|:)/ /*'*/).opt())).andl(flit('}')).to(function (vm) {
        return AST.ObjectBox.Dir(vm.head.getOrElse(""), vm.tail.getOrElse(""));
      })
    }),
    
    // <radius> ::= <vector>
    //          | <empty>
    radius: memo(function () {
      return or(
        p.vector().to(function (v) {
          return AST.ObjectBox.Cir.Radius.Vector(v);
        }),
        FP.Parsers.success("default").to(function () {
        	return AST.ObjectBox.Cir.Radius.Default();
        })
      );
    }),
    
    // <cir> ::= <diag> <orient> <diag>
    //       | <empty>
    cir: memo(function () {
      return or(
        p.diag().and(fun(regexLit(/^[_\^]/))).and(p.diag).to(function (dod) {
          return AST.ObjectBox.Cir.Cir.Segment(dod.head.head, dod.head.tail, dod.tail);
        }),
        FP.Parsers.success("full").to(function () {
        	return AST.ObjectBox.Cir.Cir.Full();
        })
      );
    }),
    
    // <curve> ::= '\crv' <curve-modifier> '{' <curve-object> <poslist> '}'
    curve: memo(function () {
    	return lit("\\crv").andr(p.curveModifier).andl(flit("{")).and(p.curveObject).and(p.curvePoslist).andl(flit("}")).to(function (mop) {
      	return AST.ObjectBox.Curve(mop.head.head, mop.head.tail, mop.tail);
      });
    }),
    
	  // <curve-modifier> ::= ( '~' <curve-option> )*
    curveModifier: memo(function () {
    	return rep(fun(lit("~").andr(p.curveOption)));
    }),
    
    // <curve-option> ::= 'p' | 'P' | 'l' | 'L' | 'c' | 'C'
    //                |   'pc' | 'pC' | 'Pc' | 'PC'
    //                |   'lc' | 'lC' | 'Lc' | 'LC'
    //                |   'cC'
    curveOption: memo(function () {
    	return or(
      	lit("p").to(function () { return AST.ObjectBox.Curve.Modifier.p(); }),
      	lit("P").to(function () { return AST.ObjectBox.Curve.Modifier.P(); }),
      	lit("l").to(function () { return AST.ObjectBox.Curve.Modifier.l(); }),
      	lit("L").to(function () { return AST.ObjectBox.Curve.Modifier.L(); }),
      	lit("c").to(function () { return AST.ObjectBox.Curve.Modifier.c(); }),
      	lit("C").to(function () { return AST.ObjectBox.Curve.Modifier.C(); }),
      	lit("pc").to(function () { return AST.ObjectBox.Curve.Modifier.pc(); }),
      	lit("pC").to(function () { return AST.ObjectBox.Curve.Modifier.pC(); }),
      	lit("Pc").to(function () { return AST.ObjectBox.Curve.Modifier.Pc(); }),
      	lit("PC").to(function () { return AST.ObjectBox.Curve.Modifier.PC(); }),
      	lit("lc").to(function () { return AST.ObjectBox.Curve.Modifier.lc(); }),
      	lit("lC").to(function () { return AST.ObjectBox.Curve.Modifier.lC(); }),
      	lit("Lc").to(function () { return AST.ObjectBox.Curve.Modifier.Lc(); }),
      	lit("LC").to(function () { return AST.ObjectBox.Curve.Modifier.LC(); }),
      	lit("cC").to(function () { return AST.ObjectBox.Curve.Modifier.cC(); })
      );
    }),
    
    // <curve-object> ::= <empty>
    //                |   '~*' <object> <curve-object>
    //                |   '~**' <object> <curve-object>
    curveObject: memo(function () {
    	return rep(or(
      	lit("~*").andr(p.object).to(function (obj) {
        	return AST.ObjectBox.Curve.Object.Drop(obj);
        }),
      	lit("~**").andr(p.object).to(function (obj) {
        	return AST.ObjectBox.Curve.Object.Connect(obj);
        })
      ));
    }),
    
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
    curvePoslist: memo(function () {
    	return or(
      	lit("&").andr(p.curvePoslist2).to(function (ps) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.CurPos(), ps);
        }),
      	lit("~@").andr(flit("&")).andr(p.curvePoslist2).to(function (ps) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.AddStack(), ps);
        }),
      	lit("~@").to(function () {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.AddStack(), FP.List.empty);
        }),
      	p.pos().andl(flit("&")).and(p.curvePoslist2).to(function (pps) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.Pos(pps.head), pps.tail);
        }),
      	p.nonemptyPos().to(function (p) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.Pos(p), FP.List.empty);
        }),
        FP.Parsers.success("empty").to(function () {
        	return FP.List.empty;
        })
      );
    }),
    curvePoslist2: memo(function () {
    	return or(
      	lit("&").andr(p.curvePoslist2).to(function (ps) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.CurPos(), ps);
        }),
      	lit("~@").andr(flit("&")).andr(p.curvePoslist2).to(function (ps) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.AddStack(), ps);
        }),
      	lit("~@").to(function () {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.AddStack(), FP.List.empty);
        }),
      	p.nonemptyPos().andl(flit("&")).and(p.curvePoslist2).to(function (pps) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.Pos(pps.head), pps.tail);
        }),
      	p.nonemptyPos().to(function (p) {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.Pos(p), FP.List.empty);
        }),
        FP.Parsers.success("empty").to(function () {
        	return FP.List.Cons(AST.ObjectBox.Curve.PosList.CurPos(), FP.List.empty);
        })
      );
    }),
    
    // <modifier> ::= '!' <vector>
    //            |   '[' <shape> ']'
    //            |   <add-op> <size>
    modifier: memo(function () {
    	return or(
        lit("!").andr(p.vector).to(function (v) {
          return AST.Modifier.Vector(v);
        }),
        lit("[").andr(p.shape).andl(flit("]")).to(function (s) {
        	return AST.Modifier.Shape(s);
        }),
        function () {
          return p.addOp().and(p.size).to(function (os) {
            return AST.Modifier.AddOp(os.head, os.tail);
          })
        }
      );
    }),
    
    // <add-op> ::= '+' | '-' | '=' | '+=' | '-='
    addOp: memo(function () {
    	return or(
      	lit("+=").to(function () { return AST.Modifier.AddOp.GrowTo(); }),
      	lit("-=").to(function () { return AST.Modifier.AddOp.ShrinkTo(); }),
      	lit("+").to(function () { return AST.Modifier.AddOp.Grow(); }),
      	lit("-").to(function () { return AST.Modifier.AddOp.Shrink(); }),
      	lit("=").to(function () { return AST.Modifier.AddOp.Set(); })
      );
    }),
    
    // <size> ::= <vector> | <empty>
    size: memo(function () {
    	return or(
      	function () { return p.vector().to(function (v) {
          return AST.Modifier.AddOp.VactorSize(v);
        }) },
      	FP.Parsers.success("default size").to(function () {
          return AST.Modifier.AddOp.DefaultSize();
        })
      );
    }),
    
    // <shape> ::= '.' | 'o' | 'l' | 'r' | 'u' | 'd' | 'c' | <empty>
    shape: memo(function () {
    	return or(
      	lit(".").to(function () { return AST.Modifier.Shape.Point(); }),
      	lit("o").to(function () { return AST.Modifier.Shape.Circle(); }),
      	lit("l").to(function () { return AST.Modifier.Shape.L(); }),
      	lit("r").to(function () { return AST.Modifier.Shape.R(); }),
      	lit("u").to(function () { return AST.Modifier.Shape.U(); }),
      	lit("d").to(function () { return AST.Modifier.Shape.D(); }),
      	lit("c").to(function () { return AST.Modifier.Shape.C(); }),
      	FP.Parsers.success("rect").to(function () { return AST.Modifier.Shape.Rect(); })
      );
    }),
    
    // <direction> ::= <direction0> <direction1>*
    // <direction0> ::= <diag>
    //              | 'v' <vector>
    // <direction1> | ':' <vector>
    //              | '_'
    //              | '^'
    direction: memo(function () {
      return seq(p.direction0, rep(p.direction1)).to(function (drs){
        return AST.Direction.Compound(drs.head, drs.tail);
      });
    }),
    direction0: memo(function () {
      return or(
        lit('v').andr(p.vector).to(function (v) {
          return AST.Direction.Vector(v);
        }),
        p.diag().to(function (d) {
          return AST.Direction.Diag(d);
        })
      );
    }),
    direction1: memo(function () {
      return or(
        lit(':').andr(p.vector).to(function (v) {
          return AST.Direction.RotVector(v);
        }),
        lit('_').to(function (x) {
          return AST.Direction.RotAntiCW();
        }),
        lit('^').to(function (x) {
          return AST.Direction.RotCW();
        })
      );
    }),
    
    // <diag> ::= 'l' | 'r' | 'd' | 'u' | 'ld' | 'rd' | 'lu' | 'ru'
    //        | <empty>
    diag: memo(fun(or(
      regexLit(/^(ld|dl)/).to(function (x) { return AST.Diag.Angle('ld', -3*Math.PI/4); }),
      regexLit(/^(rd|dr)/).to(function (x) { return AST.Diag.Angle('rd', -Math.PI/4); }),
      regexLit(/^(lu|ul)/).to(function (x) { return AST.Diag.Angle('lu', 3*Math.PI/4); }),
      regexLit(/^(ru|ur)/).to(function (x) { return AST.Diag.Angle('ru', Math.PI/4); }),
      lit('l').to(function (x) { return AST.Diag.Angle('l', Math.PI); }),
      lit('r').to(function (x) { return AST.Diag.Angle('r', 0); }),
      lit('d').to(function (x) { return AST.Diag.Angle('d', -Math.PI/2); }),
      lit('u').to(function (x) { return AST.Diag.Angle('u', Math.PI/2); }),
      FP.Parsers.success("empty").to(function (x) {
        return AST.Diag.Default();
      })
    ))),
  })();

  MathJax.Hub.Insert(TEXDEF,{
    environment: {
      xy:            ['XY', null]
    }
  });
  
  FP.Parsers.ParseError = MathJax.Object.Subclass({
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
      	var input = FP.StringReader(this.string, this.i);
        var result = FP.Parsers.parse(p.xy(), input);
        this.i = result.next.offset;
//        console.log(result.toString());
      } catch (e) {
        console.log(e.toString());
        throw e;
      }
      
      if (result.successful) {
        if (supportGraphics) {
          this.Push(AST.xypic(result.result));
        } else {
          this.Push(MML.merror("Unsupported Browser. Please open with Firefox/Safari/Chrome"));
        }
      } else {
        throw FP.Parsers.ParseError(result);
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
  
  MathJax.Hub.Startup.signal.Post("TeX Xy-pic Ready");
});

MathJax.Hub.Register.StartupHook("HTML-CSS Jax Ready",function () {
  var VERSION = "0.1";
  
  var FP = MathJax.Extension.fp;
  var MML = MathJax.ElementJax.mml;
  var HTMLCSS = MathJax.OutputJax["HTML-CSS"];
  var HUB = MathJax.Hub;
  var xypic = MathJax.Extension.xypic;
  var AST = xypic.AST;
  
  var SVGNS = "http://www.w3.org/2000/svg";
  var XHTMLNS = "http://www.w3.org/1999/xhtml";
  var XLINKNS = "http://www.w3.org/1999/xlink";
  var VMLNS = "urn:schemas-microsoft-com:vml";
  var vmlns = "mjxvml";
  
  var em2px = function (n) { return Math.round(n * HTMLCSS.em * 100)/100; }
  
  var svgForDebug;
  
  xypic.Graphics = MathJax.Object.Subclass({});
  xypic.Graphics.SVG = xypic.Graphics.Subclass({
    createGroup: function (transform) {
      return xypic.Graphics.SVG.Group(this, transform);
    },
    createSVGElement: function (type, def) {
      var obj = document.createElementNS(SVGNS, type);
      if (def) {
        for (var id in def) {
          if (def.hasOwnProperty(id)) {
            obj.setAttributeNS(null,id,def[id].toString());
          }
        }
      }
      this.drawArea.appendChild(obj);
      return obj;
    },
    transformBuilder: function () {
      return xypic.Graphics.SVG.Transform();
    }
  });
  xypic.Graphics.SVG.World = xypic.Graphics.SVG.Subclass({
    Init: function (stack, height, depth, width, strokeWidth, color, def) {
      var svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("xmlns", SVGNS);
      svg.setAttribute("version", "1.1");
      if (def) {
        for (var id in def) {
          if (def.hasOwnProperty(id)) {
            svg.setAttributeNS(null, id, def[id].toString());
          }
        }
      }
      if (svg.style) {
        svg.style.width = HTMLCSS.Em(width);
        svg.style.height = HTMLCSS.Em(height + depth);
      }
      var def = {
        fill:"none", stroke:color, "stroke-linecap":"round",
        "stroke-width":em2px(strokeWidth)
      };
      this.drawArea = document.createElementNS(SVGNS, "g");
      for (var id in def) {
        if (def.hasOwnProperty(id)) {
          this.drawArea.setAttributeNS(null,id,def[id].toString());
        }
      }
      svg.appendChild(this.drawArea);
      this.svg = svg;
    },
    setHeight: function (height) {
      this.svg.style.height = HTMLCSS.Em(height);
    },
    setWidth: function (height) {
      this.svg.style.width = HTMLCSS.Em(height);
    },
    setAttribute: function (name, value) {
      this.svg.setAttributeNS(null, name, value.toString());
    }
  });
  xypic.Graphics.SVG.Transform = MathJax.Object.Subclass({
    Init: function (transform) {
      this.transform = (transform || "");
    },
    translate: function (x, y) {
      return xypic.Graphics.SVG.Transform(
        this.transform+" translate("+em2px(x)+","+em2px(-y)+")")
    },
    rotateDegree: function (degree) {
      return xypic.Graphics.SVG.Transform(
        this.transform+" rotate("+(-degree)+")");
    },
    rotateRadian: function (radian) {
      return xypic.Graphics.SVG.Transform(
        this.transform+" rotate("+(-180*radian/Math.PI)+")");
    },
    toString: function () {
      return this.transform;
    }
  });
  xypic.Graphics.SVG.Group = xypic.Graphics.SVG.Subclass({
    Init: function (parent, transform) {
      this.drawArea = parent.createSVGElement("g", 
        transform === undefined? {} : {transform:transform.toString()});
    },
    remove: function () {
      this.drawArea.parentNode.removeChild(this.drawArea);
    }
  });
  xypic.Graphics.Augment({}, {
    createSVG: function (stack, height, depth, width, strokeWidth, color, def) {
      return xypic.Graphics.SVG.World(stack, height, depth, width, strokeWidth, color, def);
    }
  });
  
  // for WebKit SVG
  var foreignObjects;
  
  AST.xypic.Augment({
    toHTML: function (span) {
      if (!HTMLCSS.supportGraphics) {
        return span;
      }
      
      var p = HTMLCSS.length2em("0.2em");
      var t = AST.xypic.strokeWidth;

      span = this.HTMLcreateSpan(span);
      var stack = HTMLCSS.createStack(span);
			
      var bbox = {h:1, d:0, w:1, lw:0, rw:1};
      var H = bbox.h, D = bbox.d, W = bbox.w;
      var frame = HTMLCSS.createFrame(stack, H+D, 0, W, t, "none");
      frame.id = "MathJax-frame-"+this.spanID+HTMLCSS.idPostfix;
      
      var svg;
      var color = "black";
      if (HTMLCSS.useVML) {
      	// TODO: to support VML or not ...
      } else {
        svg = xypic.Graphics.createSVG(stack, H, D, W, t, color, {
          viewBox:[0, -em2px(H+D), em2px(W), em2px(H+D)].join(" "),
          overflow:"visible"
        });
        svgForDebug = svg;
        var scale = HTMLCSS.createBox(stack);
        scale.appendChild(svg.svg);
        
        if (HTMLCSS.webkitSVGProblem) {
        	foreignObjects = [];
        }
        
        var xypicData = this.cmd;
        if (xypicData) {
          var env = xypic.Env();
          var box = xypicData.draw(svg, env);
          if (box !== undefined) {
            svg.setWidth(box.l+box.r+2*p);
            svg.setHeight(box.u+box.d+2*p);
            svg.setAttribute("viewBox", [em2px(box.x-box.l-p), -em2px(box.y+box.u+p), em2px(box.l+box.r+2*p), em2px(box.u+box.d+2*p)].join(" "));
            if (HTMLCSS.webkitSVGProblem) {
            	var c = foreignObjects.length;
              for (var i = 0; i < c; i++) {
              	var fo = foreignObjects[i];
                var x = parseFloat(fo.getAttribute("x"));
                var y = parseFloat(fo.getAttribute("y"));
                fo.setAttribute("x", x-em2px(box.x-box.l-p));
                fo.setAttribute("y", y+em2px(box.y+box.u+p));
              }
            }
            
            bbox = {h:(box.u+box.d+p), d:p, w:(box.l+box.r+2*p), lw:0, rw:(box.l+box.r+2*p)}
			      span.bbox = bbox;
            D = p;
            W = box.l+box.r+2*p;
            H = box.h+box.d+p;
            
            HTMLCSS.placeBox(scale, 0, -D, true);
            frame.style.width = HTMLCSS.Em(W);
            frame.style.height = HTMLCSS.Em(H+D);
            HTMLCSS.addBox(stack, frame); 
            HTMLCSS.placeBox(frame, W-1, -D, true);
            this.HTMLhandleSpace(span);
            this.HTMLhandleColor(span);
          } else {
          	// there is no contents
          	span = span.parentNode;
            span.removeChild(span.firstChild);
          }
        } else {
          // there is no contents
          span = span.parentNode;
          span.removeChild(span.firstChild);
        }
      }
      
      return span;
    }
  }, {
  	lengthResolution: 128,
  	interpolationResolution: 5,
    machinePrecision: 1e-15,
    strokeWidth: HTMLCSS.length2em("0.05em"),
    thickness: HTMLCSS.length2em("0.15em"),
    jot: HTMLCSS.length2em("3pt"),
    objectmargin: HTMLCSS.length2em("3pt"),
    objectwidth: HTMLCSS.length2em("0pt"),
    objectheight: HTMLCSS.length2em("0pt"),
  });
  
  xypic.Util = MathJax.Object.Subclass({}, {
    extProd: function (v1, v2) {
      return [v1[1]*v2[2]-v1[2]*v2[1], v1[2]*v2[0]-v1[0]*v2[2], v1[0]*v2[1]-v1[1]*v2[0]];
    },
    sign: function (x) {
      return (x < 0? -1 : (x > 0? 1 : 0));
    },
    sign2: function (x) {
      return (x < 0? -1 : 1);
    },
    roundEpsilon: function (x) {
      if (Math.abs(x) < AST.xypic.machinePrecision) {
        return 0;
      } else {
        return x;
      }
    }
  });
  
  HUB.Browser.Select({
    MSIE: function (browser) {
//      HTMLCSS.useVML = true;
//      if (!document.namespaces[vmlns]) {
//        document.namespaces.add(vmlns, VMLNS);
//        var sheet = document.createStyleSheet();
//        sheet.addRule(vmlns+"\\:*","{behavior: url(#default#VML); position:absolute; top:0; left:0}");
//      }
    },
    Firefox: function (browser) {
      HTMLCSS.supportGraphics = true;
    },
    Safari: function (browser) {
      HTMLCSS.supportGraphics = true;
    	HTMLCSS.webkitSVGProblem = true;
    },
    Chrome: function (browser) {
      HTMLCSS.supportGraphics = true;
    	HTMLCSS.webkitSVGProblem = true;
    }
  });
  
  xypic.Frame = MathJax.Object.Subclass({
    toRect: function (def) {
      return xypic.Frame.Rect(this.x, this.y, def);
    },
	  combineRect: function (that) {
    	return xypic.Frame.combineRect(this, that);
    }
  },{
    combineRect: function (frame1, frame2) {
    	if (frame1 === undefined) {
      	return frame2;
      } else if (frame2 === undefined) {
      	return frame1;
      } else {
        var l = -(Math.min(frame1.x-frame1.l, frame2.x-frame2.l) - frame1.x);
        var r = Math.max(frame1.x+frame1.r, frame2.x+frame2.r) - frame1.x;
        var d = -(Math.min(frame1.y-frame1.d, frame2.y-frame2.d) - frame1.y);
        var u = Math.max(frame1.y+frame1.u, frame2.y+frame2.u) - frame1.y;
        return frame1.toRect({l:l, r:r, d:d, u:u});
      }
    }
  });
  
  xypic.Frame.Point = xypic.Frame.Subclass({
    Init: function (x, y) {
      this.x = x;
      this.y = y;
    },
    l: 0,
    r: 0,
    u: 0,
    d: 0,
    isPoint: function () { return true; },
    isRect: function () { return false; },
    isCircle: function () { return false; },
    edgePoint: function (x, y) { return this; },
    oppositeEdgePoint: function (x, y) { return this; },
    grow: function (xMargin, yMargin) {
      var xm = Math.max(0, xMargin);
      var ym = Math.max(0, yMargin);
      return this.toRect({l:xm, r:xm, u:ym, d:ym});
    },
    toSize: function (width, height) {
      return this.toRect({l:width/2, r:width/2, u:height/2, d:height/2});
    },
    growTo: function (width, height) {
      var w = Math.max(0, width);
      var h = Math.max(0, height);
      return this.toRect({l:w/2, r:w/2, u:h/2, d:h/2});
    },
    shrinkTo: function (width, height) {
      return this;
    },
    move: function (x, y) {
    	return xypic.Frame.Point(x, y);
    },
    rotate: function (angle) {
    	return this;
    },
    toString: function () {
    	return "{x:"+this.x+", y:"+this.y+"}";
    }
  });
  
  xypic.Frame.Rect = xypic.Frame.Subclass({
    Init: function (x, y, def) {
      this.x = x;
      this.y = y;
      this.l = (def.l || 0);
      this.r = (def.r || 0);
      this.u = (def.u || 0);
      this.d = (def.d || 0);
    },
    isPoint: function () {
    	return this.l === 0 && this.r === 0 && this.u === 0 && this.d === 0;
    },
    isRect: function () { return !this.isPoint(); },
    isCircle: function () { return false; },
    edgePoint: function (x, y) {
    	if (this.isPoint()) {
      	return this;
      }
      var dx = x - this.x;
      var dy = y - this.y;
      if (dx > 0) {
      	var ey = dy * this.r / dx;
        if (ey > this.u) {
        	return xypic.Frame.Point(this.x + this.u * dx / dy, this.y + this.u);
        } else if (ey < -this.d) {
        	return xypic.Frame.Point(this.x - this.d * dx / dy, this.y - this.d);
        }
        return xypic.Frame.Point(this.x + this.r, this.y + ey);
      } else if (dx < 0) {
      	var ey = -dy * this.l / dx;
        if (ey > this.u) {
        	return xypic.Frame.Point(this.x + this.u * dx / dy, this.y + this.u);
        } else if (ey < -this.d) {
        	return xypic.Frame.Point(this.x - this.d * dx / dy, this.y - this.d);
        }
        return xypic.Frame.Point(this.x - this.l, this.y + ey);
      } else {
      	if (dy > 0) {
        	return xypic.Frame.Point(this.x, this.y + this.u);
        } else if (dy < 0) {
        	return xypic.Frame.Point(this.x, this.y - this.d);
        }
      	return undefined;	// TODO: 存在しない点を表すオプジェクトを作る？MayBeモナドでよい。
      }
    },
    oppositeEdgePoint: function (x, y) {
    	if (this.isPoint()) {
      	return this;
      }
      var dx = x - this.x;
      var dy = y - this.y;
      if (dx > 0) {
      	var ey = dy * (-this.l) / dx;
        if (ey > this.u) {
        	return xypic.Frame.Point(this.x + this.u * dx / dy, this.y + this.u);
        } else if (ey < -this.d) {
        	return xypic.Frame.Point(this.x - this.d * dx / dy, this.y - this.d);
        }
        return xypic.Frame.Point(this.x - this.l, this.y + ey);
      } else if (dx < 0) {
      	var ey = dy * this.r / dx;
        if (ey > this.u) {
        	return xypic.Frame.Point(this.x + this.u * dx / dy, this.y + this.u);
        } else if (ey < -this.d) {
        	return xypic.Frame.Point(this.x - this.d * dx / dy, this.y - this.d);
        }
        return xypic.Frame.Point(this.x + this.r, this.y + ey);
      } else {
      	if (dy < 0) {
        	return xypic.Frame.Point(this.x, this.y + this.u);
        } else if (dy > 0) {
        	return xypic.Frame.Point(this.x, this.y - this.d);
        }
      	return undefined;	// TODO: 存在しない点を表すオプジェクトを作る？MayBeモナドでよい。
      }
    },
    grow: function (xMargin, yMargin) {
      return this.toRect({
        l:Math.max(0, this.l+xMargin),
        r:Math.max(0, this.r+xMargin),
        u:Math.max(0, this.u+yMargin),
        d:Math.max(0, this.d+yMargin)
      });
    },
    toSize: function (width, height) {
      return this.toRect({l:width/2, r:width/2, u:height/2, d:height/2});
    },
    growTo: function (width, height) {
      var w = Math.max(this.l+this.r, width);
      var h = Math.max(this.u+this.d, height);
      return this.toRect({l:w/2, r:w/2, u:h/2, d:h/2});
    },
    shrinkTo: function (width, height) {
      var w = Math.min(this.l+this.r, width);
      var h = Math.min(this.u+this.d, height);
      return this.toRect({l:w/2, r:w/2, u:h/2, d:h/2});
    },
    move: function (x, y) {
    	return xypic.Frame.Rect(x, y, {l:this.l, r:this.r, u:this.u, d:this.d});
    },
    rotate: function (angle) {
    	var c = Math.cos(angle), s = Math.sin(angle);
      var lx = -this.l, rx = this.r, uy = this.u, dy = -this.d;
    	var lu = {x:lx*c-uy*s, y:lx*s+uy*c};
      var ld = {x:lx*c-dy*s, y:lx*s+dy*c};
      var ru = {x:rx*c-uy*s, y:rx*s+uy*c};
      var rd = {x:rx*c-dy*s, y:rx*s+dy*c};
      return this.toRect({
      	l:-Math.min(lu.x, ld.x, ru.x, rd.x),
        r:Math.max(lu.x, ld.x, ru.x, rd.x),
        u:Math.max(lu.y, ld.y, ru.y, rd.y),
        d:-Math.min(lu.y, ld.y, ru.y, rd.y)
      });
    },
    toString: function () {
    	return "{x:"+this.x+", y:"+this.y+", l:"+this.l+", r:"+this.r+", u:"+this.u+", d:"+this.d+"}";
    }
  });
  
  xypic.Frame.Circle = xypic.Frame.Subclass({
    Init: function (x, y, r) {
      this.x = x;
      this.y = y;
      this.l = r;
      this.r = r;
      this.u = r;
      this.d = r;
    },
    isPoint: function () { return this.r === 0; },
    isRect: function () { return false; },
    isCircle: function () { return !this.isPoint(); },
    edgePoint: function (x, y) {
    	if (this.isPoint()) {
      	return this;
      }
      var dx = x - this.x;
      var dy = y - this.y;
      if (Math.sqrt(dx*dx+dy*dy) < this.r) {
      	return undefined;	// TODO: 存在しない点を表すオプジェクトを作る？MayBeモナドでよい。
      } else {
      	var angle = Math.atan2(dy, dx);
        return xypic.Frame.Point(this.x+this.r*Math.cos(angle), this.y+this.r*Math.sin(angle));
      }
    },
    oppositeEdgePoint: function (x, y) {
    	if (this.isPoint()) {
      	return this;
      }
      var dx = x - this.x;
      var dy = y - this.y;
      if (Math.sqrt(dx*dx+dy*dy) < this.r) {
      	return undefined;	// TODO: 存在しない点を表すオプジェクトを作る？MayBeモナドでよい。
      } else {
      	var angle = Math.atan2(dy, dx);
        return xypic.Frame.Point(this.x-this.r*Math.cos(angle), this.y-this.r*Math.sin(angle));
      }
    },
    grow: function (xMargin, yMargin) {
      return xypic.Frame.Circle(this.x, this.y, Math.max(0, this.r+xMargin));
    },
    toSize: function (width, height) {
      return xypic.Frame.Circle(this.x, this.y, width/2);
    },
    growTo: function (width, height) {
      var r = Math.max(this.r, width/2);
      return xypic.Frame.Circle(this.x, this.y, r);
    },
    shrinkTo: function (width, height) {
      var r = Math.min(this.r, width/2);
      return xypic.Frame.Circle(this.x, this.y, r);
    },
    move: function (x, y) {
    	return xypic.Frame.Circle(x, y, this.r);
    },
    rotate: function (angle) {
    	return this;
    },
    toString: function () {
    	return "{x:"+this.x+", y:"+this.y+", r:"+this.r+"}";
    }
  });
  
  xypic.Shape = MathJax.Object.Subclass({
    velocity: function (t) {
    	var dx = this.dpx(t);
    	var dy = this.dpy(t);
    	return Math.sqrt(dx*dx+dy*dy);
    },
    length: function (t) {
    	if (t < 0 || t > 1) {
      	throw Error("illegal cubic Bezier parameter t:"+t);
      }
    	this.buildLengthArray();
      
      var n = AST.xypic.lengthResolution;
      var tn = t*n;
    	var f = Math.floor(tn);
    	var c = Math.ceil(tn);
      if (f === c) {
      	return this.lengthArray[f];
      }
      var sf = this.lengthArray[f];
      var sc = this.lengthArray[c];
      return sf + (sc-sf)/(c-f)*(tn-f);	// linear interpolation 
    },
    tOfLength: function (s) {
    	this.buildLengthArray();
      
      var a = this.lengthArray;
      if (s < a[0]) {
        return 0;
      } else if (s > a[a.length - 1]) {
      	return 1;
      }
      
      var m, al, ah;
    	var l = 0;
    	var r = a.length-2;
      while (l <= r) {
      	m = (l + r) >> 1;
        al = a[m];
        ah = a[m+1];
        if (s >= al && s <= ah) {
          break;
        }
        if (s < al) {
        	r = m-1;
        } else {
        	l = m+1;
        }
      }
      
      var n = AST.xypic.lengthResolution;
      if (al === ah) {
      	return m/n;
      }
      var t = (m + (s-al)/(ah-al))/n;
      return t;
    },
    buildLengthArray: function () {
    	if (this.lengthArray !== undefined) {
      	return;
      }
      
      var n = AST.xypic.lengthResolution;
      // lengthArray[i]: \int_0^{t_{2i}} v(t) dt with Simpson's rule, (i=0, 1, \cdots, n)
      // where, t_k=k h, h=1/(2n): step length.
      var lengthArray = new Array(n+1);
      
      var sum = 0;
      var h = 1/2/n;
    	var i = 0;
      var delta = h/3;
      lengthArray[0] = 0;
      sum = this.velocity(0) + 4*this.velocity(h);
      lastv = this.velocity(2*h);
      lengthArray[1] = delta*(sum + lastv);
      for (i = 2; i <= n; i++) {
      	sum += 2*lastv + 4*this.velocity((2*i-1)*h);
        lastv = this.velocity(2*i*h);
	      lengthArray[i] = delta*(sum + lastv);
      }
      this.lengthArray = lengthArray;
    },
    drawParallelCurve: function (svg, vshift) {
      var i, n = this.countOfSegments() * AST.xypic.interpolationResolution;
      var ts = new Array(n+1);
      var x1s = new Array(n+1);
      var y1s = new Array(n+1);
      var x2s = new Array(n+1);
      var y2s = new Array(n+1);
      var hpi = Math.PI/2;
      var d = vshift;
      var t, angle, p, x, y, dc, ds;
      for (i = 0; i <= n; i++) {
        t = i/n;
        ts[i] = t;	// TODO: 高速化。ts[i+1]-ts[i]が定数の場合に特化した作りにする。
        angle = this.angle(t);
        p = this.position(t);
        x = p.x;
        y = p.y;
        dc = d*Math.cos(angle+hpi);
        ds = d*Math.sin(angle+hpi);
        x1s[i] = x+dc;
        y1s[i] = y+ds;
        x2s[i] = x-dc;
        y2s[i] = y-ds;
      }
      xypic.Shape.CubicBeziers.interpolation(ts, x1s, y1s).drawPrimitive(svg, "none");
      xypic.Shape.CubicBeziers.interpolation(ts, x2s, y2s).drawPrimitive(svg, "none");
    },
    drawParallelDottedCurve: function (svg, spacing, vshift) {
      var px = 1/HTMLCSS.em, hpx = px/2;
      var sp = px + spacing;
      var len = this.length(1);
      var n = Math.floor((len-px)/sp);
      var d = vshift;
      if (n >= 0) {
        var i, hpi = Math.PI/2;
        var s = this.startPosition(), e = this.endPosition();
        for (i = 0; i <= n; i++) {
          var s = hpx + i*sp;
          // TODO: 高速化。毎回二分探索せず、端から線形探索・適用するようにする。
          var t = this.tOfLength(s);
          var angle = this.angle(t);
          var p = this.position(t);
          var x = p.x, y = p.y
          var dc = d*Math.cos(angle+hpi), ds = d*Math.sin(angle+hpi);
          // TODO: rを正しい値にする。
          svg.createSVGElement("circle", {
            cx:em2px(x+dc), cy:-em2px(y+ds), r:0.25
          });
          svg.createSVGElement("circle", {
            cx:em2px(x-dc), cy:-em2px(y-ds), r:0.25
          });
        }
      }
    },
    drawParallelDashedCurve: function (svg, dash, vshift) {
    	var len = this.length(1);
      var n = Math.floor((len-dash)/(2*dash)), m = 2*n+1;
      var hshift = (len-dash)/2-n*dash;
      var i;
      var ts = new Array(n+1);
      var x1s = new Array(n+1);
      var y1s = new Array(n+1);
      var x2s = new Array(n+1);
      var y2s = new Array(n+1);
      var hpi = Math.PI/2;
      var d = vshift;
      var t, angle, p, x, y, dc, ds;
      for (i = 0; i <= m; i++) {
      	// TODO: 高速化。毎回二分探索せず、端から線形探索・適用するようにする。
        t = this.tOfLength(hshift + i*dash);
        ts[i] = t;
        angle = this.angle(t);
        p = this.position(t);
        x = p.x;
        y = p.y;
        dc = d*Math.cos(angle+hpi);
        ds = d*Math.sin(angle+hpi);
        x1s[i] = x+dc;
        y1s[i] = y+ds;
        x2s[i] = x-dc;
        y2s[i] = y-ds;
      }
      xypic.Shape.CubicBeziers.interpolation(ts, x1s, y1s).drawSkipped(svg);
      xypic.Shape.CubicBeziers.interpolation(ts, x2s, y2s).drawSkipped(svg);
    },
  	drawSquigCurve: function (svg, env, variant) {
      var thickness = HTMLCSS.length2em("0.15em");
      var len = this.length(1);
      var wave = 4*thickness;
      var amp = thickness;
      if (len >= wave) {
        var n = Math.floor(len/wave);
        var shiftLen = (len-n*wave)/2;
        
        var s, t, p, angle, nx, ny, hpi = Math.PI/2, d1, d2, d3;
        switch (variant) {
        	case "3":
            s = shiftLen;
            t = this.tOfLength(s);
            p = this.position(t);
            angle = this.angle(t);
            nx = amp*Math.cos(angle+hpi);
            ny = amp*Math.sin(angle+hpi);
            d1 = "M"+em2px(p.x+nx)+","+em2px(-p.y-ny);
            d2 = "M"+em2px(p.x)+","+em2px(-p.y);
            d3 = "M"+em2px(p.x-nx)+","+em2px(-p.y+ny);
            
            for (var i = 0; i < n; i++) {
              s = shiftLen + wave*i + thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x+2*nx)+","+em2px(-p.y-2*ny);
              d2 += " Q"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d3 += " Q"+em2px(p.x)+","+em2px(-p.y);
              
              s = shiftLen + wave*i + 2*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x)+","+em2px(-p.y);
              d3 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*i + 3*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x)+","+em2px(-p.y);
              d2 += " Q"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              d3 += " "+em2px(p.x-2*nx)+","+em2px(-p.y+2*ny);
              
              s = shiftLen + wave*(i+1);
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x)+","+em2px(-p.y);
              d3 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
            }
            svg.createSVGElement("path", {"d":d1});
            svg.createSVGElement("path", {"d":d2});
            svg.createSVGElement("path", {"d":d3});
            break;
            
          case "2":
            s = shiftLen;
            t = this.tOfLength(s);
            p = this.position(t);
            angle = this.angle(t);
            nx = amp*Math.cos(angle+hpi)/2;
            ny = amp*Math.sin(angle+hpi)/2;
            d1 = "M"+em2px(p.x+nx)+","+em2px(-p.y-ny);
            d2 = "M"+em2px(p.x-nx)+","+em2px(-p.y+ny);
            
            for (var i = 0; i < n; i++) {
              s = shiftLen + wave*i + thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " Q"+em2px(p.x+3*nx)+","+em2px(-p.y-3*ny);
              d2 += " Q"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              
              s = shiftLen + wave*i + 2*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*i + 3*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " Q"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              d2 += " Q"+em2px(p.x-3*nx)+","+em2px(-p.y+3*ny);
              
              s = shiftLen + wave*(i+1);
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
            }
            svg.createSVGElement("path", {"d":d1});
            svg.createSVGElement("path", {"d":d2});
            break;
            
          default:
            s = shiftLen;
            t = this.tOfLength(s);
            p = this.position(t);
            d1 = "M"+em2px(p.x)+","+em2px(-p.y);
            
            for (var i = 0; i < n; i++) {
              s = shiftLen + wave*i + thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              
              s = shiftLen + wave*i + 2*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              d1 += " "+em2px(p.x)+","+em2px(-p.y);
              
              s = shiftLen + wave*i + 3*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*(i+1);
              t = this.tOfLength(s);
              p = this.position(t);
              d1 += " "+em2px(p.x)+","+em2px(-p.y);
            }
            svg.createSVGElement("path", {"d":d1});
        }
      }
    },
  	drawDashSquigCurve: function (svg, env, variant) {
      var thickness = AST.xypic.thickness;
      var len = this.length(1);
      var wave = 4*thickness;
      var amp = thickness;
      if (len >= wave) {
        var n = Math.floor((len-wave)/2/wave);
        var shiftLen = (len-wave)/2-n*wave;
        
        var s, t, p, angle, nx, ny, hpi = Math.PI/2, d1, d2, d3;
        switch (variant) {
        	case "3":
            d1 = d2 = d3 = "";
            for (var i = 0; i <= n; i++) {
              s = shiftLen + wave*i*2;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " M"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " M"+em2px(p.x)+","+em2px(-p.y);
              d3 += " M"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*i*2 + thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x+2*nx)+","+em2px(-p.y-2*ny);
              d2 += " Q"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d3 += " Q"+em2px(p.x)+","+em2px(-p.y);
              
              s = shiftLen + wave*i*2 + 2*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x)+","+em2px(-p.y);
              d3 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*i*2 + 3*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x)+","+em2px(-p.y);
              d2 += " Q"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              d3 += " "+em2px(p.x-2*nx)+","+em2px(-p.y+2*ny);
              
              s = shiftLen + wave*(i*2+1);
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x)+","+em2px(-p.y);
              d3 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
            }
            svg.createSVGElement("path", {"d":d1});
            svg.createSVGElement("path", {"d":d2});
            svg.createSVGElement("path", {"d":d3});
            break;
            
          case "2":
            d1 = d2 = "";
            for (var i = 0; i <= n; i++) {
              s = shiftLen + wave*i*2;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " M"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " M"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*i*2 + thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " Q"+em2px(p.x+3*nx)+","+em2px(-p.y-3*ny);
              d2 += " Q"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              
              s = shiftLen + wave*i*2 + 2*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*i*2 + 3*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " Q"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              d2 += " Q"+em2px(p.x-3*nx)+","+em2px(-p.y+3*ny);
              
              s = shiftLen + wave*(i*2+1);
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi)/2;
              ny = amp*Math.sin(angle+hpi)/2;
              d1 += " "+em2px(p.x+nx)+","+em2px(-p.y-ny);
              d2 += " "+em2px(p.x-nx)+","+em2px(-p.y+ny);
            }
            svg.createSVGElement("path", {"d":d1});
            svg.createSVGElement("path", {"d":d2});
            break;
            
          default:
            d1 = "";
            for (var i = 0; i <= n; i++) {
              s = shiftLen + wave*i*2;
              t = this.tOfLength(s);
              p = this.position(t);
              d1 += " M"+em2px(p.x)+","+em2px(-p.y);
              
              s = shiftLen + wave*i*2 + thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x+nx)+","+em2px(-p.y-ny);
              
              s = shiftLen + wave*i*2 + 2*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              d1 += " "+em2px(p.x)+","+em2px(-p.y);
              
              s = shiftLen + wave*i*2 + 3*thickness;
              t = this.tOfLength(s);
              p = this.position(t);
              angle = this.angle(t);
              nx = amp*Math.cos(angle+hpi);
              ny = amp*Math.sin(angle+hpi);
              d1 += " Q"+em2px(p.x-nx)+","+em2px(-p.y+ny);
              
              s = shiftLen + wave*(i*2+1);
              t = this.tOfLength(s);
              p = this.position(t);
              d1 += " "+em2px(p.x)+","+em2px(-p.y);
            }
            svg.createSVGElement("path", {"d":d1});
        }
      }
    },
    draw: function (svg, env, objectForDrop, objectForConnect) {
      var thickness = HTMLCSS.length2em("0.15em"), vshift;
      var box;
    	if (objectForConnect !== undefined) {
      	var main = objectForConnect.dirMain();
        var variant = objectForConnect.dirVariant();
        switch (main) {
        	case "=":
            main = "-";
            variant = "2";
            break;
          case "==":
            main = "--";
            variant = "2";
            break;
          case ':':
          case '::':
            main = ".";
            variant = "2";
          	break;
        }
        
      	switch (main) {
        	case '':
          	// draw nothing
            break;
            
        	case '-':
          	switch (variant) {
            	case "2":
                vshift = thickness/2;
              	this.drawParallelCurve(svg, vshift);
                break;
              case "3":
                vshift = thickness;
								this.drawParallelCurve(svg, vshift);
                this.drawPrimitive(svg, "none");
              	break;
            	default:
                vshift = 0;
                this.drawPrimitive(svg, "none");
            }
            break;
            
          case '.':
          case '..':
            switch (variant) {
            	case "2":
                vshift = thickness/2;
								this.drawParallelDottedCurve(svg, thickness, vshift)
                break;
                
            	case "3":
                vshift = thickness;
								this.drawParallelDottedCurve(svg, thickness, vshift)
                this.drawPrimitive(svg, "1 "+em2px(thickness));
              	break;
                
            	default:
                vshift = 0;
                this.drawPrimitive(svg, "1 "+em2px(thickness));
                break;
            }
            break;
            
          case '--':
            var dash = 3*thickness;
            var len = this.length(1);
          	if (len >= dash) {
              switch (variant) {
              	case "2":
                  vshift = thickness/2;
                  this.drawParallelDashedCurve(svg, dash, vshift);
                	break;
                  
              	case "3":
                	vshift = thickness;
                  this.drawParallelDashedCurve(svg, dash, vshift);
                  var shiftLen = (len-dash)/2-Math.floor((len-dash)/2/dash)*dash;
                  var shiftT = this.tOfLength(shiftLen);
                  var shifted = this.divide(shiftT)[1];
                  shifted.drawPrimitive(svg, em2px(dash)+" "+em2px(dash))
                	break;
                  
              	default:
                	vshift = 0;
                  var shiftLen = (len-dash)/2-Math.floor((len-dash)/2/dash)*dash;
                  var shiftT = this.tOfLength(shiftLen);
                  var shifted = this.divide(shiftT)[1];
                  shifted.drawPrimitive(svg, em2px(dash)+" "+em2px(dash));
              }
            }
            break;
            
          case '~':
          	this.drawSquigCurve(svg, env, variant);
            switch (variant) {
            	case "2":
              	vshift = 1.5*thickness;
                break;
            	case "3":
              	vshift = 2*thickness;
                break;
              default:
              	vshift = 0
            }
          	break;
            
          case '~~':
          	this.drawDashSquigCurve(svg, env, variant);
            switch (variant) {
            	case "2":
              	vshift = 1.5*thickness;
                break;
            	case "3":
              	vshift = 2*thickness;
                break;
              default:
              	vshift = 0
            }
          	break;
            
          default:
            // TODO: ~* と ~** の順序を考慮する。
            var conBBox = objectForConnect.boundingBox(svg, env);
            if (conBBox == undefined) {
              env.angle = 0;
              env.mostRecentLine = xypic.MostRecentLine.none;
              return undefined;
            }
            
            var cl = conBBox.l;
            var conLen = cl + conBBox.r;
            
            var dropLen, dl;
            if (objectForDrop !== undefined) {
              var dropBBox = objectForDrop.boundingBox(svg, env);
              if (dropBBox !== undefined) {
                dl = dropBBox.l;
                dropLen = dl + dropBBox.r;
              }
            } else {
              dropLen = 0;
            }
            
            var compositeLen = conLen + dropLen;
            if (compositeLen == 0) {
              compositeLen = AST.xypic.strokeWidth;
            }
            
            var len = this.length(1);
            var n = Math.floor(len/compositeLen);
            if (n == 0) {
              env.angle = 0;
              env.mostRecentLine = xypic.MostRecentLine.none;
              return undefined;
            }
            
            var c = env.c;
            var shiftLen = (len - n*compositeLen)/2;
            var group = svg.createGroup();
            var bbox, s, t;
            for (var i = 0; i < n; i++) {
              s = shiftLen + i*compositeLen;
              if (objectForDrop !== undefined) {
                t = this.tOfLength(s + dl);
                env.c = this.position(t);
                env.angle = this.angle(t);
                bbox = objectForDrop.drop(group, env);
                if (box === undefined) {
                  box = bbox;
                } else {
                  box = box.combineRect(bbox);
                }
              }
              t = this.tOfLength(s + dropLen + cl);
              env.c = this.position(t);
              env.angle = this.angle(t);
              bbox = objectForConnect.drop(group, env);
              if (box === undefined) {
                box = bbox;
              } else {
                box = box.combineRect(bbox);
              }
            }
            env.c = c;
            return box;
        }
        if (vshift === undefined) {
        	box = undefined;
        } else {
	        box = this.boundingBox(vshift);
        }
      } else if (objectForDrop !== undefined) {
        var object = objectForDrop;
        var objectBBox = object.boundingBox(svg, env);
        if (objectBBox == undefined) {
          env.angle = 0;
          env.mostRecentLine = xypic.MostRecentLine.none;
          return undefined;
        }
        
        var objectWidth = objectBBox.l+objectBBox.r;
        var objectLen = objectWidth;
        if (objectLen == 0) {
          objectLen = AST.xypic.strokeWidth;
        }
        
        var len = this.length(1);
        var n = Math.floor(len/objectLen);
        if (n == 0) {
          env.angle = 0;
          env.mostRecentLine = xypic.MostRecentLine.none;
          return undefined;
        }
        
        var shiftLen = (len - n*objectLen + objectLen - objectWidth)/2 + objectBBox.l;
        var c = env.c;
        var group = svg.createGroup();
        for (var i = 0; i < n; i++) {
          var s = shiftLen + i*objectLen;
          var t = this.tOfLength(s);
          env.c = this.position(t);
          env.angle = 0;
          var bbox = object.drop(group, env);
          if (i == 0) {
            box = bbox;
          } else {
            box = box.combineRect(bbox);
          }
        }
        env.c = c;
      }
      return box;
    }
  }, {
    sign: function (x) { return x>0? 1 : (x===0? 0 : -1); },
    minT: function () {
    	var ts = [];
      for (var i = 0; i < arguments.length; i++) {
      	var t = arguments[i];
        if (t >= 0 && t <= 1) {
        	ts.push(t);
        }
      }
      if (ts.length > 0) {
	      return Math.min.apply(Math, ts);
      } else {
      	return undefined;
      }
		},
    minSolutionOfCubicEq: function (a3, a2, a1, a0) {
    	// find minimum solution t in [0, 1]
      if (a3 === 0) {
      	return xypic.Shape.minSolutionOfQuadEq(a2, a1, a0);
      }
      var b2 = a2/3/a3, b1 = a1/a3, b0 = a0/a3;
      var p = b2*b2-b1/3, q = -b0/2+b1*b2/2-b2*b2*b2;
      var d = q*q-p*p*p;
      if (d === 0) {
      	var s = Math.pow(q, 1/3);
        var t0 = 2*s-b2, t1 = -s-b2;
        return xypic.Shape.minT(t0, t1);
      } else if (d > 0) {
      	var u = q+xypic.Shape.sign(q)*Math.sqrt(d);
      	var r = xypic.Shape.sign(u)*Math.pow(Math.abs(u), 1/3);
        var s = p/r;
        var t = r+s-b2;
        return xypic.Shape.minT(t);
      } else {
      	var r = 2*Math.sqrt(p);
        var s = Math.acos(2*q/p/r);
        var t0 = r*Math.cos(s/3)-b2;
        var t1 = r*Math.cos((s+2*Math.PI)/3)-b2;
        var t2 = r*Math.cos((s+4*Math.PI)/3)-b2;
        return xypic.Shape.minT(t0, t1, t2);
      }
    },
    minSolutionOfQuadEq: function (a2, a1, a0) {
    	// find minimum solution t in [0, 1]
      if (a2 === 0) {
      	if (a1 === 0) {
        	return (a0 === 0? 0 : undefined);
        }
        return  xypic.Shape.minT(-a0/a1);
      } else {
      	var d = a1*a1-4*a0*a2;
        if (d >= 0) {
          var s = Math.sqrt(d);
          var tp = (-a1+s)/2/a2;
          var tm = (-a1-s)/2/a2;
          return xypic.Shape.minT(tp, tm);
        } else {
        	return undefined;
        }
      }
    }
  });
  
  xypic.Shape.QuadBezier = xypic.Shape.Subclass({
  	Init: function (cp0, cp1, cp2) {
    	this.cp0 = cp0;
    	this.cp1 = cp1;
    	this.cp2 = cp2;
      
    	var a0x = cp0.x;
      var a1x = 2*(cp1.x - cp0.x);
      var a2x = cp2.x - 2*cp1.x + cp0.x;
    	this.px = function(t) { return a0x + t*a1x + t*t*a2x; }
    	this.dpx = function(t) { return a1x + 2*t*a2x; }
      
    	var a0y = cp0.y;
      var a1y = 2*(cp1.y - cp0.y);
      var a2y = cp2.y - 2*cp1.y + cp0.y;
    	this.py = function(t) { return a0y + t*a1y + t*t*a2y; }
    	this.dpy = function(t) { return a1y + 2*t*a2y; }
    },
    startPosition: function () {
    	return this.cp0;
    },
    endPosition: function () {
    	return this.cp2;
    },
    position: function (t) {
    	return xypic.Frame.Point(this.px(t), this.py(t));
    },
    derivative: function (t) {
    	return xypic.Frame.Point(this.dpx(t), this.dpy(t));
    },
    angle: function (t) {
    	return Math.atan2(this.dpy(t), this.dpx(t));
    },
    boundingBox: function (vshift) {
      var maxMinX = this.maxMin(this.cp0.x, this.cp1.x, this.cp2.x, vshift);
      var maxMinY = this.maxMin(this.cp0.y, this.cp1.y, this.cp2.y, vshift);
    	if (vshift === 0) {
        return xypic.Frame.Rect(this.cp0.x, this.cp0.y, {
          l:this.cp0.x-maxMinX.min, r:maxMinX.max-this.cp0.x,
          u:maxMinY.max-this.cp0.y, d:this.cp0.y-maxMinY.min
        });
      } else {
				var hpi = Math.PI/2;
        var sx = this.cp0.x;
        var sy = this.cp0.y;
        var ex = this.cp2.x;
        var ey = this.cp2.y;
        var a0 = this.angle(0)+hpi;
        var a1 = this.angle(1)+hpi;
        var vc0 = vshift*Math.cos(a0), vs0 = vshift*Math.sin(a0);
        var vc1 = vshift*Math.cos(a1), vs1 = vshift*Math.sin(a1);
        var minX = Math.min(maxMinX.min, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
        var maxX = Math.max(maxMinX.max, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
        var minY = Math.min(maxMinY.min, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
        var maxY = Math.max(maxMinY.max, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
        return xypic.Frame.Rect(sx, sy, {
          l:sx-minX, r:maxX-sx, u:maxY-sy, d:sy-minY
        });
      }
    },
    maxMin: function (x0, x1, x2, vshift) {
    	var max, min;
      if (x0 > x2) {
      	max = x0;
        min = x2;
      } else {
      	max = x2;
        min = x0;
      }
      
      var roundEp = xypic.Util.roundEpsilon;
      
    	var a0 = roundEp(x0);
      var a1 = roundEp(x1 - x0);
      var a2 = roundEp(x2 - 2*x1 + x0);
    	var p = function(t) { return a0 + 2*t*a1 + t*t*a2 }
      
      var x, t;
      if (a2 != 0) {
      	t = -a1/a2;
        if (t > 0 && t < 1) {
          x = p(t);
          max = Math.max(max, x + vshift, x - vshift);
          min = Math.min(min, x + vshift, x - vshift);
        }
      }
      return {min:min, max:max};
    },
    divide: function (t) {
    	if (t < 0 || t > 1) {
      	throw Error("illegal quadratic Bezier parameter t:"+t);
      }
      
      // find starting edge point
      var x0 = this.cp0.x;
      var x1 = this.cp1.x;
      var x2 = this.cp2.x;
      
      var y0 = this.cp0.y;
      var y1 = this.cp1.y;
      var y2 = this.cp2.y;
      
      var tx = this.px(t);
      var ty = this.py(t);
      
      var p0 = this.cp0;
      var p1 = xypic.Frame.Point(x0+t*(x1-x0), y0+t*(y1-y0));
      var p2 = xypic.Frame.Point(tx, ty);
      
      var q0 = p2;
      var q1 = xypic.Frame.Point(x1+t*(x2-x1), y1+t*(y2-y1));
    	var q2 = this.cp2;
      
      return [
      	xypic.Shape.QuadBezier(p0, p1, p2),
      	xypic.Shape.QuadBezier(q0, q1, q2)
      ]
    },
    shaveStart: function (frame) {
      var edgeCPs;
      edgeCPs = this.edgeControlPoints(frame, this.cp0, this.cp1, this.cp2);
      if (edgeCPs === undefined) {
        return undefined;
      }
      return xypic.Shape.QuadBezier(edgeCPs[0], edgeCPs[1], edgeCPs[2]);
    },
    shaveEnd: function (frame) {
      var edgeCPs;
      edgeCPs = this.edgeControlPoints(frame, this.cp2, this.cp1, this.cp0);
      if (edgeCPs === undefined) {
        return undefined;
      }
      return xypic.Shape.QuadBezier(edgeCPs[2], edgeCPs[1], edgeCPs[0]);
    },
    edgeControlPoints: function (frame, cp0, cp1, cp2) {
      if (frame.isPoint()) {
        return [cp0, cp1 ,cp2];
      }
      
      var t;
      var roundEp = xypic.Util.roundEpsilon;
      
      var x0 = cp0.x;
      var x1 = cp1.x;
      var x2 = cp2.x;
      
      var a0x = roundEp(x0);
      var a1x = roundEp(2*(x1 - x0));
      var a2x = roundEp(x2 - 2*x1 + x0);
      var px = function(t) { return a0x + t*a1x + t*t*a2x; }
      
      var y0 = cp0.y;
      var y1 = cp1.y;
      var y2 = cp2.y;
      
      var a0y = roundEp(y0);
      var a1y = roundEp(2*(y1 - y0));
      var a2y = roundEp(y2 - 2*y1 + y0);
      var py = function(t) { return a0y + t*a1y + t*t*a2y; }
      
      if (frame.isRect()) {
        // find starting edge point
        var rx = frame.x + frame.r;
        var lx = frame.x - frame.l;
        var uy = frame.y + frame.u;
        var dy = frame.y - frame.d;
        
        var ts = [];
        if (x0 <= rx && (x1 >= rx || x2 >= rx)) {
          t = xypic.Shape.minSolutionOfQuadEq(a2x, a1x, a0x-rx);
          if (t !== undefined) { ts.push(t) }
        }
        if (x0 >= lx && (x2 <= lx || x1 <= lx)) {
          t = xypic.Shape.minSolutionOfQuadEq(a2x, a1x, a0x-lx);
          if (t !== undefined) { ts.push(t) }
        }
        if (y0 <= uy && (y1 >= uy || y2 >= uy)) {
          t = xypic.Shape.minSolutionOfQuadEq(a2y, a1y, a0y-uy);
          if (t !== undefined) { ts.push(t) }
        }
        if (y0 >= dy && (y2 <= dy || y1 <= dy)) {
          t = xypic.Shape.minSolutionOfQuadEq(a2y, a1y, a0y-dy);
          if (t !== undefined) { ts.push(t) }
        }
        if (ts.length === 0) {
        	return undefined;
        }
        
        t = Math.min.apply(Math, ts);
      } else if (frame.isCircle()) {
        var cx = frame.x, cy = frame.y, r = frame.r, pi = Math.PI;
        
        var arc0 = xypic.Shape.Segment.Arc(cx, cy, r, -pi, -pi/2);
        var arc1 = xypic.Shape.Segment.Arc(cx, cy, r, -pi/2, 0);
        var arc2 = xypic.Shape.Segment.Arc(cx, cy, r, 0, pi/2);
        var arc3 = xypic.Shape.Segment.Arc(cx, cy, r, pi/2, pi);
        
        var bezier = xypic.Shape.Segment.QuadBezier(xypic.Shape.QuadBezier(cp0, cp1, cp2), 0, 1);
        
        var intersec = [];
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc0, bezier));
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc1, bezier));
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc2, bezier));
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc3, bezier));
        
        if (intersec.length === 0) {
          return undefined;
        } else {
          t = (intersec[0][1].min + intersec[0][1].max)/2;
          for (var i = 1; i < intersec.length; i++) { 
            var ttmp = (intersec[i][1].min + intersec[i][1].max)/2;
            if (t > ttmp) { t = ttmp; }
          }
        }
      }
      var tx = px(t);
      var ty = py(t);
      cp0 = xypic.Frame.Point(tx, ty);
      cp1 = xypic.Frame.Point(x1+t*(x2-x1), y1+t*(y2-y1));
      return [cp0, cp1 ,cp2];
    },
    countOfSegments: function () { return 1; },
    drawPrimitive: function (svg, dasharray) {
    	var cp0 = this.cp0, cp1 = this.cp1, cp2 = this.cp2;
      svg.createSVGElement("path", {
        "d":"M"+em2px(cp0.x)+","+em2px(-cp0.y)+
          " Q"+em2px(cp1.x)+","+em2px(-cp1.y)+
          " "+em2px(cp2.x)+","+em2px(-cp2.y),
        "stroke-dasharray":dasharray
      });
    },
    toString: function () {
    	return "QuadBezier("+this.cp0.x+", "+this.cp0.y+")-("+this.cp1.x+", "+this.cp1.y+")-("+this.cp2.x+", "+this.cp2.y+")"
    }
  });
  
  xypic.Shape.CubicBezier = xypic.Shape.Subclass({
  	Init: function (cp0, cp1, cp2, cp3) {
    	this.cp0 = cp0;
    	this.cp1 = cp1;
    	this.cp2 = cp2;
    	this.cp3 = cp3;
      
    	var a0x = cp0.x;
      var a1x = 3*(cp1.x - cp0.x);
      var a2x = 3*(cp2.x - 2*cp1.x + cp0.x);
      var a3x = cp3.x - 3*cp2.x + 3*cp1.x - cp0.x;
    	this.px = function(t) { return a0x + t*a1x + t*t*a2x + t*t*t*a3x; }
    	this.dpx = function(t) { return a1x + 2*t*a2x + 3*t*t*a3x; }
      
    	var a0y = cp0.y;
      var a1y = 3*(cp1.y - cp0.y);
      var a2y = 3*(cp2.y - 2*cp1.y + cp0.y);
      var a3y = cp3.y - 3*cp2.y + 3*cp1.y - cp0.y;
    	this.py = function(t) { return a0y + t*a1y + t*t*a2y + t*t*t*a3y; }
    	this.dpy = function(t) { return a1y + 2*t*a2y + 3*t*t*a3y; }
    },
    startPosition: function () {
    	return this.cp0;
    },
    endPosition: function () {
    	return this.cp3;
    },
    position: function (t) {
    	return xypic.Frame.Point(this.px(t), this.py(t));
    },
    derivative: function (t) {
    	return xypic.Frame.Point(this.dpx(t), this.dpy(t));
    },
    angle: function (t) {
    	return Math.atan2(this.dpy(t), this.dpx(t));
    },
    boundingBox: function (vshift) {
      var maxMinX = this.maxMin(this.cp0.x, this.cp1.x, this.cp2.x, this.cp3.x, vshift);
      var maxMinY = this.maxMin(this.cp0.y, this.cp1.y, this.cp2.y, this.cp3.y, vshift);
    	if (vshift === 0) {
        return xypic.Frame.Rect(this.cp0.x, this.cp0.y, {
          l:this.cp0.x-maxMinX.min, r:maxMinX.max-this.cp0.x,
          u:maxMinY.max-this.cp0.y, d:this.cp0.y-maxMinY.min
        });
      } else {
				var hpi = Math.PI/2;
        var sx = this.cp0.x;
        var sy = this.cp0.y;
        var ex = this.cp3.x;
        var ey = this.cp3.y;
        var a0 = this.angle(0)+hpi;
        var a1 = this.angle(1)+hpi;
        var vc0 = vshift*Math.cos(a0), vs0 = vshift*Math.sin(a0);
        var vc1 = vshift*Math.cos(a1), vs1 = vshift*Math.sin(a1);
        var minX = Math.min(maxMinX.min, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
        var maxX = Math.max(maxMinX.max, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
        var minY = Math.min(maxMinY.min, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
        var maxY = Math.max(maxMinY.max, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
        return xypic.Frame.Rect(sx, sy, {
          l:sx-minX, r:maxX-sx, u:maxY-sy, d:sy-minY
        });
      }
    },
    maxMin: function (x0, x1, x2, x3, vshift) {
    	var max, min;
      if (x0 > x3) {
      	max = x0;
        min = x3;
      } else {
      	max = x3;
        min = x0;
      }
      
      var roundEp = xypic.Util.roundEpsilon;
    	var a0 = roundEp(x0);
      var a1 = roundEp(x1 - x0);
      var a2 = roundEp(x2 - 2*x1 + x0);
      var a3 = roundEp(x3 - 3*x2 + 3*x1 - x0);
    	var p = function(t) { return a0 + 3*t*a1 + 3*t*t*a2 + t*t*t*a3 }
      
      var updateMinMax = function (t) {
        if (t > 0 && t < 1) {
          x = p(t);
          max = Math.max(max, x + vshift, x - vshift);
          min = Math.min(min, x + vshift, x - vshift);
        }
      }
      
      var t, x;
      if (a3 == 0) {
      	if (a2 != 0) {
        	t = -a1/a2/2;
          updateMinMax(t);
        }
      } else {
        var d = a2*a2 - a1*a3;
      	if (d > 0) {
	      	t = (-a2 + Math.sqrt(d))/a3;
          updateMinMax(t);
	      	t = (-a2 - Math.sqrt(d))/a3;
          updateMinMax(t);
        } else if (d == 0) {
	      	t = -a2/a3;
          updateMinMax(t);
        }
      }
      return {min:min, max:max};
    },
    divide: function (t) {
    	if (t < 0 || t > 1) {
      	throw Error("illegal cubic Bezier parameter t:"+t);
      }
      
      // find starting edge point
      var x0 = this.cp0.x;
      var x1 = this.cp1.x;
      var x2 = this.cp2.x;
      var x3 = this.cp3.x;
      
      var y0 = this.cp0.y;
      var y1 = this.cp1.y;
      var y2 = this.cp2.y;
      var y3 = this.cp3.y;
      
      var tx = this.px(t);
      var ty = this.py(t);
      
      var p0 = this.cp0;
      var p1 = xypic.Frame.Point(x0+t*(x1-x0), y0+t*(y1-y0));
			var p2 = xypic.Frame.Point(
      	x0+2*t*(x1-x0)+t*t*(x2-2*x1+x0),
        y0+2*t*(y1-y0)+t*t*(y2-2*y1+y0)
      );
      var p3 = xypic.Frame.Point(tx, ty);
      
      var q0 = p3;
      var q1 = xypic.Frame.Point(
      	x1+2*t*(x2-x1)+t*t*(x3-2*x2+x1),
        y1+2*t*(y2-y1)+t*t*(y3-2*y2+y1)
      );
      var q2 = xypic.Frame.Point(x2+t*(x3-x2), y2+t*(y3-y2));
    	var q3 = this.cp3;
      
      return [
      	xypic.Shape.CubicBezier(p0, p1, p2, p3),
      	xypic.Shape.CubicBezier(q0, q1, q2, q3)
      ]
    },
    shaveStart: function (frame) {
      var edgeCPs;
      edgeCPs = this.edgeControlPoints(frame, this.cp0, this.cp1, this.cp2, this.cp3);
      if (edgeCPs === undefined) {
        return undefined;
      }
      return xypic.Shape.CubicBezier(edgeCPs[0], edgeCPs[1], edgeCPs[2], edgeCPs[3]);
    },
    shaveEnd: function (frame) {
      var edgeCPs;
      edgeCPs = this.edgeControlPoints(frame, this.cp3, this.cp2, this.cp1, this.cp0);
      if (edgeCPs === undefined) {
        return undefined;
      }
      return xypic.Shape.CubicBezier(edgeCPs[3], edgeCPs[2], edgeCPs[1], edgeCPs[0]);
    },
    edgeControlPoints: function (frame, cp0, cp1, cp2, cp3) {
      if (frame.isPoint()) {
        return [cp0, cp1 ,cp2, cp3];
      }
      
      var t;
      var roundEp = xypic.Util.roundEpsilon;
      
      var x0 = cp0.x;
      var x1 = cp1.x;
      var x2 = cp2.x;
      var x3 = cp3.x;
      
      var y0 = cp0.y;
      var y1 = cp1.y;
      var y2 = cp2.y;
      var y3 = cp3.y;
      
      var a0x = roundEp(x0);
      var a1x = roundEp(3*(x1 - x0));
      var a2x = roundEp(3*(x2 - 2*x1 + x0));
      var a3x = roundEp(x3 - 3*x2 + 3*x1 - x0);
      var px = function(t) { return a0x + t*a1x + t*t*a2x + t*t*t*a3x }
      
      var a0y = roundEp(y0);
      var a1y = roundEp(3*(y1 - y0));
      var a2y = roundEp(3*(y2 - 2*y1 + y0));
      var a3y = roundEp(y3 - 3*y2 + 3*y1 - y0);
      var py = function(t) { return a0y + t*a1y + t*t*a2y + t*t*t*a3y }
      
      if (frame.isRect()) {
        // find starting edge point
        var rx = frame.x + frame.r;
        var lx = frame.x - frame.l;
        var uy = frame.y + frame.u;
        var dy = frame.y - frame.d;
        
        var ts = [];
        if (x0 <= rx && (x3 >= rx || x1 >= rx || x2 >= rx)) {
          t = xypic.Shape.minSolutionOfCubicEq(a3x, a2x, a1x, a0x-rx);
          if (t !== undefined) { ts.push(t) }
        }
        if (x0 >= lx && (x3 <= lx || x2 <= lx || x1 <= lx)) {
          t = xypic.Shape.minSolutionOfCubicEq(a3x, a2x, a1x, a0x-lx);
          if (t !== undefined) { ts.push(t) }
        }
        if (y0 <= uy && (y3 >= uy || y1 >= uy || y2 >= uy)) {
          t = xypic.Shape.minSolutionOfCubicEq(a3y, a2y, a1y, a0y-uy);
          if (t !== undefined) { ts.push(t) }
        }
        if (y0 >= dy && (y3 <= dy || y2 <= dy || y1 <= dy)) {
          t = xypic.Shape.minSolutionOfCubicEq(a3y, a2y, a1y, a0y-dy);
          if (t !== undefined) { ts.push(t) }
        }
        if (ts.length === 0) {
        	return undefined;
        }
        
        t = Math.min.apply(Math, ts);
      } else if (frame.isCircle()) {
        var cx = frame.x, cy = frame.y, r = frame.r, pi = Math.PI;
        
        var arc0 = xypic.Shape.Segment.Arc(cx, cy, r, -pi, -pi/2);
        var arc1 = xypic.Shape.Segment.Arc(cx, cy, r, -pi/2, 0);
        var arc2 = xypic.Shape.Segment.Arc(cx, cy, r, 0, pi/2);
        var arc3 = xypic.Shape.Segment.Arc(cx, cy, r, pi/2, pi);
        
        var bezier = xypic.Shape.Segment.CubicBezier(xypic.Shape.CubicBezier(cp0, cp1, cp2, cp3), 0, 1);
        
        var intersec = [];
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc0, bezier));
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc1, bezier));
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc2, bezier));
        intersec = intersec.concat(xypic.Shape.Segment.findIntersections(arc3, bezier));
        
        if (intersec.length === 0) {
          return undefined;
        } else {
          t = (intersec[0][1].min + intersec[0][1].max)/2;
          for (var i = 1; i < intersec.length; i++) { 
            var ttmp = (intersec[i][1].min + intersec[i][1].max)/2;
            if (t > ttmp) { t = ttmp; }
          }
        }
      }
      
      var tx = px(t);
      var ty = py(t);
      cp0 = xypic.Frame.Point(tx, ty);
      cp1 = xypic.Frame.Point(
        x1+2*t*(x2-x1)+t*t*(x3-2*x2+x1),
        y1+2*t*(y2-y1)+t*t*(y3-2*y2+y1)
      );
      cp2 = xypic.Frame.Point(x2+t*(x3-x2), y2+t*(y3-y2));
      return [cp0, cp1 ,cp2, cp3];
    },
    countOfSegments: function () { return 1; },
    drawPrimitive: function (svg, dasharray) {
    	var cp0 = this.cp0, cp1 = this.cp1, cp2 = this.cp2, cp3 = this.cp3;
      svg.createSVGElement("path", {
        "d":"M"+em2px(cp0.x)+","+em2px(-cp0.y)+
          " C"+em2px(cp1.x)+","+em2px(-cp1.y)+
          " "+em2px(cp2.x)+","+em2px(-cp2.y)+
          " "+em2px(cp3.x)+","+em2px(-cp3.y),
        "stroke-dasharray":dasharray
      });
    },
    toString: function () {
    	return "CubicBezier("+this.cp0.x+", "+this.cp0.y+")-("+this.cp1.x+", "+this.cp1.y+")-("+this.cp2.x+", "+this.cp2.y+")-("+this.cp3.x+", "+this.cp3.y+")"
    }
  });
  
  xypic.Shape.CubicBeziers = xypic.Shape.Subclass({
  	Init: function (cbs) {
    	this.cbs = cbs;
      var n = this.cbs.length;
      this.delegate = (n == 0?
      	function (t, succ, fail) {
        	return fail;
        } : function (t, succ, fail) {
          var tn = t*n;
          var i = Math.floor(tn);
          if (i < 0) { i = 0; }
          if (i >= n) { i = n-1; }
          var s = tn - i;
          var cb = cbs[i];
          return succ(cb, s);
        }
      );
    },
    startPosition: function () {
    	return this.cbs[0].cp0;
    },
    endPosition: function () {
    	return this.cbs[this.cbs.length - 1].cp3;
    },
    position: function (t) {
      return this.delegate(t, function (cb, s) { return cb.position(s) }, undefined);
    },
    derivative: function (t) {
      return this.delegate(t, function (cb, s) { return cb.derivative(s) }, undefined);
    },
    angle: function (t) {
      return this.delegate(t, function (cb, s) { return cb.angle(s) }, 0);
    },
    velocity: function (t) {
    	var n = this.cbs.length;
      return this.delegate(t, function (cb, s) { return n*cb.velocity(s) }, 0);
    },
    boundingBox: function (vshift) {
    	if (this.cbs.length == 0) {
      	return undefined;
      }
      var bbox = this.cbs[0].boundingBox(vshift);
      var i, n = this.cbs.length;
      for (i = 1; i < n; i++) {
      	bbox = bbox.combineRect(this.cbs[i].boundingBox(vshift))
      }
      return bbox;
    },
    shaveStart: function (frame) {
      var shaved = [];
      var i = 0, l = this.cbs.length;
      while (i < l) {
        var cb = this.cbs[i];
        cb = cb.shaveStart(frame);
        i++;
        if (cb !== undefined) {
          shaved.push(cb);
          while (i < l) {
            cb = this.cbs[i];
            shaved.push(cb);
            i++;
          }
          break;
        }
      }
      return xypic.Shape.CubicBeziers(shaved);
    },
    shaveEnd: function (frame) {
      var reversedShaved = [];
    	var l = this.cbs.length;
      var i = l - 1;
      while (i >= 0) {
        var cb = this.cbs[i];
        cb = cb.shaveEnd(frame);
        i--;
        if (cb !== undefined) {
          reversedShaved.push(cb);
          while (i >= 0) {
            cb = this.cbs[i];
            reversedShaved.push(cb);
            i--;
          }
        }
      }
      return xypic.Shape.CubicBeziers(reversedShaved.reverse());
    },
    divide: function (t) {
    	if (t < 0 || t > 1) {
      	throw Error("illegal cubic Bezier parameter t:"+t);
      } else if (t === 0) {
      	return [xypic.Shape.CubicBeziers([]), this];
      } else if (t === 1) {
      	return [this, xypic.Shape.CubicBeziers([])];
      }
      
      var n = this.cbs.length;
      var tn = t*n;
      var i = Math.floor(tn);
      var s = tn - i;
      var divS = this.cbs.slice(0,i);
      var divE = this.cbs.slice(i+1);
      var cb = cbs[i];
      var divB = cb.divide(s);
      divS.push(divB[0]);
      divE.unshift(divB[1]);
      return [xypic.Shape.CubicBeziers(divS), xypic.Shape.CubicBeziers(divE)];
    },
    countOfSegments: function () { return this.cbs.length; },
    drawPrimitive: function (svg, dasharray) {
    	var n = this.cbs.length;
      var cbs = this.cbs;
      var cb = cbs[0];
      var cp0 = cb.cp0, cp1 = cb.cp1, cp2 = cb.cp2, cp3 = cb.cp3;
      var d = ("M"+em2px(cp0.x)+","+em2px(-cp0.y)+
          " C"+em2px(cp1.x)+","+em2px(-cp1.y)+
          " "+em2px(cp2.x)+","+em2px(-cp2.y)+
          " "+em2px(cp3.x)+","+em2px(-cp3.y));
      for (var i = 1; i < n; i++) {
        cb = cbs[i];
      	cp2 = cb.cp2, cp3 = cb.cp3;
        d += " S"+em2px(cp2.x)+","+em2px(-cp2.y)+" "+em2px(cp3.x)+","+em2px(-cp3.y);
      }
      svg.createSVGElement("path", {"d":d, "stroke-dasharray":dasharray});
    },
    drawSkipped: function (svg) {
    	var n = this.cbs.length;
      var cbs = this.cbs;
      var d = "";
      for (var i = 0; i < n; i+=2) {
        var cb = cbs[i];
        var cp0 = cb.cp0, cp1 = cb.cp1, cp2 = cb.cp2, cp3 = cb.cp3;
        d += ("M"+em2px(cp0.x)+","+em2px(-cp0.y)+
            " C"+em2px(cp1.x)+","+em2px(-cp1.y)+
            " "+em2px(cp2.x)+","+em2px(-cp2.y)+
            " "+em2px(cp3.x)+","+em2px(-cp3.y));
      }
      svg.createSVGElement("path", {"d":d});
    }
  },{
  	interpolation: function (ts, xs, ys) {
    	var x12 = xypic.Shape.CubicBeziers.cubicSplineInterpolation(ts, xs);
      var x1 = x12[0];
      var x2 = x12[1];
      
    	var y12 = xypic.Shape.CubicBeziers.cubicSplineInterpolation(ts, ys);
      var y1 = y12[0];
      var y2 = y12[1];
      
      var i, n = ts.length;
      var beziers = new Array(n-1);
      for (i = 0; i < n-1; i++) {
      	beziers[i] = xypic.Shape.CubicBezier(
        	xypic.Frame.Point(xs[i], ys[i]),
        	xypic.Frame.Point(x1[i], y1[i]),
        	xypic.Frame.Point(x2[i], y2[i]),
        	xypic.Frame.Point(xs[i+1], ys[i+1])
        )
      }
      return xypic.Shape.CubicBeziers(beziers);
    },
    cubicSplineInterpolation: function (ts, xs) {
    	var n = ts.length-1;
    	var hs = new Array(n);
      var i;
      for (i = 0; i < n; i++) {
      	hs[i] = ts[i+1] - ts[i];
      }
      var as = new Array(n);
      for (i = 1; i < n; i++) {
      	as[i] = 3*(xs[i+1] - xs[i])/hs[i] - 3*(xs[i] - xs[i-1])/hs[i-1];
      }
      var ls = new Array(n+1);
      var ms = new Array(n+1);
      var zs = new Array(n+1);
      ls[0] = 1;
      ms[0] = 0;
      zs[0] = 0;
      for (i = 1; i < n; i++) {
      	ls[i] = 2*(ts[i+1] - ts[i-1]) - hs[i-1]*ms[i-1];
        ms[i] = hs[i]/ls[i];
        zs[i] = (as[i] - hs[i-1]*zs[i-1])/ls[i];
      }
      ls[n] = 1;
      zs[n] = 0;
      var bs = new Array(n);
      var cs = new Array(n+1);
      cs[n] = 0;
      for (i = n-1; i >= 0; i--) {
      	var h = hs[i], c1 = cs[i+1], c0 = h*h*zs[i] - ms[i]*c1;
      	cs[i] = c0;
        bs[i] = (xs[i+1] - xs[i]) - (c1 + 2*c0)/3;
      }
      var p1s = new Array(n);
      var p2s = new Array(n);
      for (i = 0; i < n; i++) {
      	var a = xs[i], b = bs[i], c = cs[i];
        p1s[i] = a + b/3;
        p2s[i] = a + (2*b + c)/3;
      }
      return [p1s, p2s];
    }
  });
  
  xypic.Shape.CubicBSpline = xypic.Shape.Subclass({
  	Init: function (s, intCps, e) {
    	if (intCps.length < 1) {
      	throw Error("the number of internal control points of cubic B-spline must be greater than or equal to 1");
      }
      
    	var controlPoints = [];
      controlPoints.push(s);
      for (var i = 0, l = intCps.length; i < l; i++) {
      	controlPoints.push(intCps[i]);
      }
      controlPoints.push(e);
      this.cps = controlPoints;
      
      var n = this.cps.length - 1;
    	var cps = function (i) {
      	if (i < 0) {
        	return controlPoints[0];
        } else if (i > n) {
        	return controlPoints[n];
        } else {
        	return controlPoints[i];
        }
      }
      var N = function (t) {
        var s = Math.abs(t);
        if (s <= 1) {
          return (3*s*s*s - 6*s*s + 4)/6;
        } else if (s <= 2) {
          return -(s-2)*(s-2)*(s-2)/6;
        } else {
          return 0;
        }
      }
      this.px = function (t) {
      	var s = (n+2)*t-1;
        var minj = Math.ceil(s-2);
        var maxj = Math.floor(s+2);
        var p = 0;
        for (var j = minj; j <= maxj; j++) {
          p += N(s-j)*cps(j).x;
        }
        return p;
      }
      this.py = function (t) {
      	var s = (n+2)*t-1;
        var minj = Math.ceil(s-2);
        var maxj = Math.floor(s+2);
        var p = 0;
        for (var j = minj; j <= maxj; j++) {
          p += N(s-j)*cps(j).y;
        }
        return p;
      }
      var dN = function (t) {
        var u = (t>0? 1 : (t<0? -1 : 0));
        var s = Math.abs(t);
        if (s <= 1) {
          return u*(3*s*s - 4*s)/2;
        } else if (s <= 2) {
          return -u*(s-2)*(s-2)/2;
        } else {
          return 0;
        }
      }
      this.dpx = function (t) {
      	var s = (n+2)*t-1;
        var minj = Math.ceil(s-2);
        var maxj = Math.floor(s+2);
        var p = 0;
        for (var j = minj; j <= maxj; j++) {
          p += dN(s-j)*cps(j).x;
        }
        return p;
      }
      this.dpy = function (t) {
      	var s = (n+2)*t-1;
        var minj = Math.ceil(s-2);
        var maxj = Math.floor(s+2);
        var p = 0;
        for (var j = minj; j <= maxj; j++) {
          p += dN(s-j)*cps(j).y;
        }
        return p;
      }
    },
    position: function (t) {
      return xypic.Frame.Point(this.px(t), this.py(t));
    },
    angle: function (t) {
      return Math.atan2(this.dpy(t), this.dpx(t));
    },
    toCubicBeziers: function () {
    	var cbs = [];
      var cps = this.cps;
      
      var cp0 = cps[0];
      var cp1 = cps[1];
      var cp2 = cps[2];
      var p0x = cp0.x;
      var p0y = cp0.y;
      var p1x = p0x+(cp1.x-p0x)/3;
      var p1y = p0y+(cp1.y-p0y)/3;
      var p2x = p0x+(cp1.x-p0x)*2/3;
      var p2y = p0y+(cp1.y-p0y)*2/3;
      var n1x = cp1.x+(cp2.x-cp1.x)/3;
      var n1y = cp1.y+(cp2.y-cp1.y)/3;
      var p3x = (p2x+n1x)/2;
      var p3y = (p2y+n1y)/2;
      var p0 = cp0;
      var p1 = xypic.Frame.Point(p1x, p1y);
      var p2 = xypic.Frame.Point(p2x, p2y);
      var p3 = xypic.Frame.Point(p3x, p3y);
      var cb = xypic.Shape.CubicBezier(p0, p1, p2, p3);
      cbs.push(cb);
      
      var len = this.cps.length - 1;
      for (var i=2; i < len; i++) {
        cp0 = cp1;
        cp1 = cp2;
        cp2 = cps[i+1];
        p0x = p3x;
        p0y = p3y;
        p1x = 2*p3x - p2x;
        p1y = 2*p3y - p2y;
        p2x = cp0.x+(cp1.x-cp0.x)*2/3;
        p2y = cp0.y+(cp1.y-cp0.y)*2/3;
        n1x = cp1.x+(cp2.x-cp1.x)/3;
        n1y = cp1.y+(cp2.y-cp1.y)/3;
        p3x = (p2x+n1x)/2;
        p3y = (p2y+n1y)/2;
        p0 = p3;
        p1 = xypic.Frame.Point(p1x, p1y);
        p2 = xypic.Frame.Point(p2x, p2y);
        p3 = xypic.Frame.Point(p3x, p3y);
        cb = xypic.Shape.CubicBezier(p0, p1, p2, p3);
        cbs.push(cb);
      }
      
      cp0 = cp1;
      cp1 = cp2;
      p0x = p3x;
      p0y = p3y;
      p1x = 2*p3x - p2x;
      p1y = 2*p3y - p2y;
      p2x = cp0.x+(cp1.x-cp0.x)*2/3;
      p2y = cp0.y+(cp1.y-cp0.y)*2/3;
      p3x = cp1.x;
      p3y = cp1.y;
      p0 = p3;
      p1 = xypic.Frame.Point(p1x, p1y);
      p2 = xypic.Frame.Point(p2x, p2y);
      p3 = xypic.Frame.Point(p3x, p3y);
      cb = xypic.Shape.CubicBezier(p0, p1, p2, p3);
      cbs.push(cb);
    	
      return cbs;
    },
    countOfSegments: function () { return this.cps.length - 1; }
  });
  
  xypic.Shape.Segment = MathJax.Object.Subclass({
    bezierFatLine: function (n) {
      var p0 = this.cps[0], pn = this.cps[n];
      var a, b, c;
      if (p0.x !== pn.x || p0.y !== pn.y) {
        a = p0.y-pn.y;
        b = pn.x-p0.x;
        l = Math.sqrt(a*a+b*b);
        a /= l;
        b /= l;
        c = (p0.x*pn.y-p0.y*pn.x)/l;
      } else {
        var angle = this.bezier.angle(this.tmin);
        a = -Math.sin(angle);
        b = Math.cos(angle);
        c = -a*this.cp0.x-b*this.cp0.y;
      }
      
      var cmin = c, cmax = c;
      for (var i = 1; i < n; i++) {
        var ci = -a*this.cps[i].x-b*this.cps[i].y;
        if (ci > cmax) {
          cmax = ci;
        } else if (ci < cmin) {
          cmin = ci;
        }
      }
      return {min:[a, b, cmin], max:[a, b, cmax]};
    }, 
    clippedLineRange: function (ps, lineMin, lineMax) {
      var n = ps.length - 1;
      var es = new Array(n+1);
      var extProd = xypic.Util.extProd;
      for (var i = 0; i <= n; i++) {
        es[i] = [i/n, -lineMin[0]*ps[i].x-lineMin[1]*ps[i].y-lineMin[2], 1];
      }
      
      var vminAgainstLineMin, vmaxAgainstLineMin, t;
      if (es[0][1] < 0) {
        var allLiesBelow = true;
        for (i = 1; i <= n; i++) {
          var l0i = extProd(es[0], es[i]);
          v = -l0i[2]/l0i[0];
          if (v > 0 && v < 1 && (vminAgainstLineMin === undefined || v < vminAgainstLineMin)) {
            vminAgainstLineMin = v;
          }
          if (es[i][1] >= 0) {
            allLiesBelow = false;
          }
        }
        if (allLiesBelow) {
          // clip away everything.
          return undefined;
        }
      } else {
        vminAgainstLineMin = 0;
      }
      if (es[n][1] < 0) {
        for (i = 0; i < n; i++) {
          var lni = extProd(es[n], es[i]);
          v = -lni[2]/lni[0];
          if (v > 0 && v < 1 && (vmaxAgainstLineMin === undefined || v > vmaxAgainstLineMin)) {
            vmaxAgainstLineMin = v;
          }
        }
      } else {
        vmaxAgainstLineMin = 1;
      }
      
      for (i = 0; i <= n; i++) {
        es[i] = [i/n, lineMax[0]*ps[i].x+lineMax[1]*ps[i].y+lineMax[2], 1];
      }
      
      var vminAgainstLineMax, vmaxAgainstLineMax;
      if (es[0][1] < 0) {
        var allLiesAbove = true;
        for (i = 1; i <= n; i++) {
          var l0i = extProd(es[0], es[i]);
          v = -l0i[2]/l0i[0];
          if (v > 0 && v < 1 && (vminAgainstLineMax === undefined || v < vminAgainstLineMax)) {
            vminAgainstLineMax = v;
          }
          if (es[i][1] >= 0) {
            allLiesAbove = false;
          }
        }
        if (allLiesAbove) {
          // clip away everything.
          return undefined;
        }
      } else {
        vminAgainstLineMax = 0;
      }
      if (es[n][1] < 0) {
        for (i = 0; i < n; i++) {
          var lni = extProd(es[n], es[i]);
          v = -lni[2]/lni[0];
          if (v > 0 && v < 1 && (vmaxAgainstLineMax === undefined || v > vmaxAgainstLineMax)) {
            vmaxAgainstLineMax = v;
          }
        }
      } else {
        vmaxAgainstLineMax = 1;
      }
      
      var vmin = Math.max(vminAgainstLineMin, vminAgainstLineMax);
      var vmax = Math.min(vmaxAgainstLineMin, vmaxAgainstLineMax);
      return {min:this.tmin + vmin*(this.tmax - this.tmin), max:this.tmin + vmax*(this.tmax - this.tmin)};
    }
  }, {
    findIntersections: function (segment0, segment1) {
      var n = xypic.Shape.Segment.maxIterations;
      var acc = xypic.Shape.Segment.goalAccuracy;
      var queue = [[segment0, segment1, false]];
      var i = 0;
      var intersections = [];
      while (i < n && queue.length > 0) {
        i++;
        var head = queue.shift();
        var segment0 = head[0];
        var segment1 = head[1];
        var swapped = head[2];
        
//        segment0.drawFatLine();
        
        var fatLine = segment0.fatLine();
        var tminMax = segment1.clippedRange(fatLine.min, fatLine.max);
        if (tminMax == undefined) {
          // clip away everything
          continue;
        }
        
        var tmin = tminMax.min;
        var tmax = tminMax.max;
        var tlen = tmax - tmin;
        if (tlen < acc && segment0.paramLength() < acc) {
          // intersection found
          if (swapped) {
            intersections.push([segment1.clip(tmin, tmax).paramRange(), segment0.paramRange()]);
          } else {
            intersections.push([segment0.paramRange(), segment1.clip(tmin, tmax).paramRange()]);
          }
          continue;
        }
        if (tlen <= segment1.paramLength() * 0.8) {
          queue.push([segment1.clip(tmin, tmax), segment0, !swapped]);
        } else {
          // subdivision
          if (tlen > segment0.paramLength()) {
            var tmid = (tmax + tmin)/2;
            queue.push([segment1.clip(tmin, tmid), segment0, !swapped]);
            queue.push([segment1.clip(tmid, tmax), segment0, !swapped]);
          } else {
            var newSegment = segment1.clip(tmin, tmax);
            var range0 = segment0.paramRange();
            var mid0 = (range0.min + range0.max)/2;
            queue.push([newSegment, segment0.clip(range0.min, mid0), !swapped]);
            queue.push([newSegment, segment0.clip(mid0, range0.max), !swapped]);
          }
        }
      }
      return intersections;
    },
    maxIterations: 30,
    goalAccuracy: 1e-4
  });
  
  xypic.Shape.Segment.Line = xypic.Shape.Segment.Subclass({
    Init: function (p0, p1, tmin, tmax) {
      this.p0 = p0;
      this.p1 = p1;
      this.tmin = tmin;
      this.tmax = tmax;
    },
    paramRange: function () { return {min:this.tmin, max:this.tmax}; },
    paramLength: function () { return this.tmax - this.tmin; },
    containsParam: function (t) { return t >= this.tmin && t <= this.tmax; }, 
    position: function (t) {
      return {
        x:this.p0.x + t*(this.p1.x - this.p0.x),
        y:this.p0.y + t*(this.p1.y - this.p0.y)
      };
    },
    fatLine: function () {
      var a = (this.p1.y - this.p0.y), b = (this.p0.x - this.p1.x), c = this.p1.x*this.p0.y - this.p0.x*this.p1.y;
      var l = Math.sqrt(a*a + b*b);
      if (l === 0) {
        a = 1;
        b = 0;
      } else {
        a /= l;
        b /= l;
        c /= l;
      }
      return {min:[a, b, c], max:[a, b, c]};
    },
    clip: function (tmin, tmax) {
      return xypic.Shape.Segment.Line(this.p0, this.p1, tmin, tmax);
    },
    clippedRange: function (lineMin, lineMax) {
      var ps = new Array(2);
      ps[0] = this.position(this.tmin);
      ps[1] = this.position(this.tmax);
      return this.clippedLineRange(ps, lineMin, lineMax);
    },
    drawFatLine: function () {
      var fatLine = this.fatLine();
      var lmin = fatLine.min;
      var y = function (x, l) {
        return -(x*l[0] + l[2])/l[1];
      }
      var xmin = this.p0.x;
      var xmax = this.p1.x;
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmax)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmax)),
        "stroke-width":em2px(0.02), stroke:"red"
      });
    }
  });

  xypic.Shape.Segment.QuadBezier = xypic.Shape.Segment.Subclass({
    Init: function (bezier, tmin, tmax) {
      this.bezier = bezier;
      this.tmin = tmin;
      this.tmax = tmax;
      this.cp0 = bezier.position(tmin);
      this.cp1 = xypic.Frame.Point(
        (1-tmax)*(1-tmin)*bezier.cp0.x + (tmin+tmax-2*tmin*tmax)*bezier.cp1.x + tmin*tmax*bezier.cp2.x,
        (1-tmax)*(1-tmin)*bezier.cp0.y + (tmin+tmax-2*tmin*tmax)*bezier.cp1.y + tmin*tmax*bezier.cp2.y
      );
      this.cp2 = bezier.position(tmax);
      this.cps = [this.cp0, this.cp1, this.cp2];
    },
    paramRange: function () { return {min:this.tmin, max:this.tmax}; },
    paramLength: function () { return this.tmax - this.tmin; },
    fatLine: function () { return this.bezierFatLine(2); },
    clip: function (tmin, tmax) {
      return xypic.Shape.Segment.QuadBezier(this.bezier, tmin, tmax);
    },
    clippedRange: function (lineMin, lineMax) {
      return this.clippedLineRange(this.cps, lineMin, lineMax);
    },
    drawFatLine: function () {
      var fatLine = this.fatLine();
      var lmin = fatLine.min;
      var lmax = fatLine.max;
      var y = function (x, l) {
        return -(x*l[0] + l[2])/l[1];
      }
      var xmin = this.cp0.x
      var xmax = this.cp2.x
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmin)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmin)),
        "stroke-width":em2px(0.02), stroke:"blue"
      });
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmax)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmax)),
        "stroke-width":em2px(0.02), stroke:"red"
      });
    }
  });
  
  xypic.Shape.Segment.CubicBezier = xypic.Shape.Segment.Subclass({
    Init: function (bezier, tmin, tmax) {
      this.bezier = bezier;
      this.tmin = tmin;
      this.tmax = tmax;
      this.cp0 = bezier.position(tmin);
      this.cp1 = xypic.Frame.Point(
        (1-tmax)*(1-tmin)*(1-tmin)*bezier.cp0.x + (1-tmin)*(2*tmin+tmax-3*tmin*tmax)*bezier.cp1.x + tmin*(2*tmax+tmin-3*tmin*tmax)*bezier.cp2.x + tmin*tmin*tmax*bezier.cp3.x,
        (1-tmax)*(1-tmin)*(1-tmin)*bezier.cp0.y + (1-tmin)*(2*tmin+tmax-3*tmin*tmax)*bezier.cp1.y + tmin*(2*tmax+tmin-3*tmin*tmax)*bezier.cp2.y + tmin*tmin*tmax*bezier.cp3.y
      );
      this.cp2 = xypic.Frame.Point(
        (1-tmin)*(1-tmax)*(1-tmax)*bezier.cp0.x + (1-tmax)*(2*tmax+tmin-3*tmin*tmax)*bezier.cp1.x + tmax*(2*tmin+tmax-3*tmin*tmax)*bezier.cp2.x + tmin*tmax*tmax*bezier.cp3.x,
        (1-tmin)*(1-tmax)*(1-tmax)*bezier.cp0.y + (1-tmax)*(2*tmax+tmin-3*tmin*tmax)*bezier.cp1.y + tmax*(2*tmin+tmax-3*tmin*tmax)*bezier.cp2.y + tmin*tmax*tmax*bezier.cp3.y
      );
      this.cp3 = bezier.position(tmax);
      this.cps = [this.cp0, this.cp1, this.cp2, this.cp3];
    },
    paramRange: function () { return {min:this.tmin, max:this.tmax}; },
    paramLength: function () { return this.tmax - this.tmin; },
    fatLine: function () { return this.bezierFatLine(3); },
    clip: function (tmin, tmax) {
      return xypic.Shape.Segment.CubicBezier(this.bezier, tmin, tmax);
    },
    clippedRange: function (lineMin, lineMax) {
      return this.clippedLineRange(this.cps, lineMin, lineMax);
    },
    drawFatLine: function () {
      var fatLine = this.fatLine();
      var lmin = fatLine.min;
      var lmax = fatLine.max;
      var y = function (x, l) {
        return -(x*l[0] + l[2])/l[1];
      }
      var xmin = this.cp0.x
      var xmax = this.cp3.x
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmin)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmin)),
        "stroke-width":em2px(0.02), stroke:"blue"
      });
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmax)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmax)),
        "stroke-width":em2px(0.02), stroke:"red"
      });
    }
  });
  
  xypic.Shape.Segment.Arc = xypic.Shape.Segment.Subclass({
    Init: function (x, y, r, angleMin, angleMax) {
      this.x = x;
      this.y = y;
      this.r = r;
      this.angleMin = angleMin;
      this.angleMax = angleMax;
    },
    paramRange: function () { return {min:this.angleMin, max:this.angleMax}; },
    paramLength: function () { return this.angleMax - this.angleMin; },
    normalizeAngle: function (angle) {
      angle = angle % 2*Math.PI;
      if (angle > Math.PI) {
        return angle - 2*Math.PI;
      }
      if (angle < -Math.PI) {
        return angle + 2*Math.PI;
      }
      return angle;
    },
    containsParam: function (angle) { return angle >= this.angleMin && angle <= this.angleMax; }, 
    fatLine: function () {
      var tp = (this.angleMax+this.angleMin)/2;
      var tm = (this.angleMax-this.angleMin)/2;
      var cosp = Math.cos(tp), sinp = Math.sin(tp);
      var Lmin = [-cosp, -sinp, this.x*cosp + this.y*sinp + this.r*Math.cos(tm)];
      var Lmax = [-cosp, -sinp, this.r + this.x*cosp + this.y*sinp];
      return {min:Lmin, max:Lmax};
    },
    clip: function (angleMin, angleMax) {
      return xypic.Shape.Segment.Arc(this.x, this.y, this.r, angleMin, angleMax);
    },
    clippedRange: function (lineMin, lineMax) {
      var x = this.x, y = this.y, r = this.r, angleMin = this.angleMin, angleMax = this.angleMax;
      var d = -(lineMin[0]*x+lineMin[1]*y+lineMin[2]);
      
      var sign = xypic.Util.sign2;
      var angles = [];
      var det = r*r - d*d;
      if (det >= 0) {
        var xp = lineMin[0]*d - lineMin[1]*Math.sqrt(r*r - d*d);
        var yp = lineMin[1]*d + lineMin[0]*Math.sqrt(r*r - d*d);
        var xm = lineMin[0]*d + lineMin[1]*Math.sqrt(r*r - d*d);
        var ym = lineMin[1]*d - lineMin[0]*Math.sqrt(r*r - d*d);
        var anglep = Math.atan2(yp, xp);
        var anglem = Math.atan2(ym, xm);
        if (this.containsParam(anglep)) {
          angles.push(anglep);
        }
        if (this.containsParam(anglem)) {
          angles.push(anglem);
        }
      }
      
      var d0 = -(lineMin[0]*(x+r*Math.cos(angleMin)) + lineMin[1]*(y+r*Math.sin(angleMin)) + lineMin[2]);
      var d1 = -(lineMin[0]*(x+r*Math.cos(angleMax)) + lineMin[1]*(y+r*Math.sin(angleMax)) + lineMin[2]);
      var angleMinAgainstLineMin, angleMaxAgainstLineMin;
      if (d0 < 0) {
        if (angles.length == 0) {
          // no intersection
          return undefined;
        }
        angleMinAgainstLineMin = Math.min.apply(Math, angles);
      } else {
        angleMinAgainstLineMin = this.angleMin;
      }
      if (d1 < 0) {
        if (angles.length == 0) {
          // no intersection
          return undefined;
        }
        angleMaxAgainstLineMin = Math.max.apply(Math, angles);
      } else {
        angleMaxAgainstLineMin = this.angleMax;
      }
      
      var d = lineMax[0]*x+lineMax[1]*y+lineMax[2];
      var angles = [];
      var det = r*r - d*d;
      if (det >= 0) {
        var xp = -lineMin[0]*d + lineMin[1]*Math.sqrt(r*r - d*d);
        var yp = -lineMin[1]*d - lineMin[0]*Math.sqrt(r*r - d*d);
        var xm = -lineMin[0]*d - lineMin[1]*Math.sqrt(r*r - d*d);
        var ym = -lineMin[1]*d + lineMin[0]*Math.sqrt(r*r - d*d);
        var anglep = Math.atan2(yp, xp);
        var anglem = Math.atan2(ym, xm);
        if (this.containsParam(anglep)) {
          angles.push(anglep);
        }
        if (this.containsParam(anglem)) {
          angles.push(anglem);
        }
      }
      
      var d0 = lineMax[0]*(x+r*Math.cos(angleMin)) + lineMax[1]*(y+r*Math.sin(angleMin)) + lineMax[2];
      var d1 = lineMax[0]*(x+r*Math.cos(angleMax)) + lineMax[1]*(y+r*Math.sin(angleMax)) + lineMax[2];
      var angleMinAgainstLineMax, angleMaxAgainstLineMax;
      if (d0 < 0) {
        if (angles.length == 0) {
          // no intersection
          return undefined;
        }
        angleMinAgainstLineMax = Math.min.apply(Math, angles);
      } else {
        angleMinAgainstLineMax = this.angleMin;
      }
      if (d1 < 0) {
        if (angles.length == 0) {
          // no intersection
          return undefined;
        }
        angleMaxAgainstLineMax = Math.max.apply(Math, angles);
      } else {
        angleMaxAgainstLineMax = this.angleMax;
      }
      
      return {min:Math.max(angleMinAgainstLineMin, angleMinAgainstLineMax), max:Math.min(angleMaxAgainstLineMin, angleMaxAgainstLineMax)};
    },
    drawFatLine: function () {
      var fatLine = this.fatLine();
      var lmin = fatLine.min;
      var lmax = fatLine.max;
      var y = function (x, l) {
        return -(x*l[0] + l[2])/l[1];
      }
      var x0 = this.x+this.r*Math.cos(this.angleMin);
      var x1 = this.x+this.r*Math.cos(this.angleMax);
      var xmin = x0;
      var xmax = x1;
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmin)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmin)),
        "stroke-width":em2px(0.02), stroke:"blue"
      });
      svgForDebug.createSVGElement("line", {
        x1:em2px(xmin), y1:-em2px(y(xmin, lmax)),
        x2:em2px(xmax), y2:-em2px(y(xmax, lmax)),
        "stroke-width":em2px(0.02), stroke:"red"
      });
    }
  });
  
  
  xypic.MostRecentLine = MathJax.Object.Subclass({});
  
  xypic.MostRecentLine.None = xypic.MostRecentLine.Subclass({
  	Init: function () {}, 
  	isDefined: false,
    segment: function () { return []; }
  });
  
  xypic.MostRecentLine.Line = xypic.MostRecentLine.Subclass({
  	Init: function (start, end, p, c) {
    	this.start = start;
      this.end = end;
      this.p = p;
      this.c = c;
    },
  	isDefined: true,
    position: function (t) {
      return xypic.Frame.Point(
        this.p.x + t*(this.c.x - this.p.x),
        this.p.y + t*(this.c.y - this.p.y)
      );
    },
    derivative: function (t) {
      return xypic.Frame.Point(
        this.c.x - this.p.x,
        this.c.y - this.p.y
      );
    },
    posAngle: function (shaveP, shaveC, factor, slideEm) {
    	var start = (shaveP? this.start : this.p);
      var end = (shaveC? this.end : this.c);
      if (start.x === end.x && start.y === end.y) {
        return {pos:start, angle:0};
      } else {
        var dx = end.x - start.x;
        var dy = end.y - start.y;
        var l = Math.sqrt(dx*dx+dy*dy);
        var angle = Math.atan2(dy, dx);
        if (factor > 0.5) {
          return {pos:xypic.Frame.Point(
                end.x - (1 - factor)*dx + slideEm*dx/l,
                end.y - (1 - factor)*dy + slideEm*dy/l
              ),
              angle:angle
            };
        } else {
          return {pos:xypic.Frame.Point(
                start.x + factor*dx + slideEm*dx/l,
                start.y + factor*dy + slideEm*dy/l
              ),
              angle:angle
            };
        }
      }
    },
    segments: function () {
      return [xypic.Shape.Segment.Line(this.p, this.c, 0, 1)];
    }
  });
  
  xypic.MostRecentLine.QuadBezier = xypic.MostRecentLine.Subclass({
  	Init: function (origBezier, shavePBezier, shavePCBezier) {
    	this.origBezier = origBezier;
    	this.shavePBezier = shavePBezier;
    	this.shavePCBezier = shavePCBezier;
    	this.shaveCBezier = null;
    },
  	isDefined: true,
    position: function (t) {
      return this.origBezier.position(t);
    },
    derivative: function (t) {
      return this.origBezier.derivative(t);
    },
    posAngle: function (shaveP, shaveC, factor, slide) {
    	var bezier;
    	if (shaveC) {
      	if (shaveP) {
        	bezier = this.shavePCBezier;
        } else {
        	if (this.shaveCBezier === null) {
          	this.shaveCBezier = this.origBezier.shaveEnd(this.origBezier.cp2);
          }
        	bezier = this.shaveCBezier;
        }
      } else {
      	if (shaveP) {
          bezier = this.shavePBezier; 
        } else {
        	bezier = this.origBezier;
        }
      }
      var pos, angle;
      if (bezier === undefined) {
        pos = start;
        angle = 0;
      } else {
        if (slide !== 0) {
        	var fd = bezier.length(factor);
          factor = bezier.tOfLength(fd + slide);
        }
      	pos = bezier.position(factor);
      	angle = bezier.angle(factor);
      }
      return {pos:pos, angle:angle};
    },
    segments: function () {
      return [xypic.Shape.Segment.QuadBezier(this.origBezier, 0, 1)];
    }
  });
  
  xypic.MostRecentLine.CubicBezier = xypic.MostRecentLine.Subclass({
  	Init: function (origBezier, shavePBezier, shavePCBezier) {
    	this.origBezier = origBezier;
    	this.shavePBezier = shavePBezier;
    	this.shavePCBezier = shavePCBezier;
    	this.shaveCBezier = null;
    },
    originalLine: function () {
      return this.originalLine;
    },
  	isDefined: true,
    position: function (t) {
      return this.origBezier.position(t);
    },
    derivative: function (t) {
      return this.origBezier.derivative(t);
    },
    posAngle: function (shaveP, shaveC, factor, slide) {
    	var bezier;
    	if (shaveC) {
      	if (shaveP) {
        	bezier = this.shavePCBezier;
        } else {
        	if (this.shaveCBezier === null) {
          	this.shaveCBezier = this.origBezier.shaveEnd(this.origBezier.cp3);
          }
        	bezier = this.shaveCBezier;
        }
      } else {
      	if (shaveP) {
          bezier = this.shavePBezier; 
        } else {
        	bezier = this.origBezier;
        }
      }
      var pos, angle;
      if (bezier === undefined) {
        pos = start;
        angle = 0;
      } else {
        if (slide !== 0) {
        	var fd = bezier.length(factor);
          factor = bezier.tOfLength(fd + slide);
        }
      	pos = bezier.position(factor);
      	angle = bezier.angle(factor);
      }
      return {pos:pos, angle:angle};
    },
    segments: function () {
      return [xypic.Shape.Segment.CubicBezier(this.origBezier, 0, 1)];
    }
  });
  
  xypic.MostRecentLine.CubicBSpline = xypic.MostRecentLine.Subclass({
  	Init: function (s, e, origBeziers, shavePBeziers, shavePCBeziers) {
    	this.s = s;
      this.e = e;
    	this.origBeziers = origBeziers;
    	this.shavePBeziers = shavePBeziers;
    	this.shavePCBeziers = shavePCBeziers;
    	this.shaveCBeziers = null;
    },
  	isDefined: true,
    position: function (t) {
      return this.origBeziers.position(t);
    },
    derivative: function (t) {
      return this.origBeziers.derivative(t);
    },
    posAngle: function (shaveP, shaveC, factor, slide) {
    	var beziers;
    	if (shaveC) {
      	if (shaveP) {
        	beziers = this.shavePCBeziers;
        } else {
        	if (this.shaveCBeziers === null) {
          	this.shaveCBeziers = this.origBeziers.shaveEnd(this.e);
          }
        	beziers = this.shaveCBeziers;
        }
      } else {
      	if (shaveP) {
          beziers = this.shavePBeziers; 
        } else {
        	beziers = this.origBeziers;
        }
      }
      var pos, angle;
      if (beziers === undefined) {
        pos = start;
        angle = 0;
      } else {
        if (slide !== 0) {
        	var fd = beziers.length(factor);
          factor = beziers.tOfLength(fd + slide);
        }
      	pos = beziers.position(factor);
      	angle = beziers.angle(factor);
      }
      return {pos:pos, angle:angle};
    },
    segments: function () {
      var segments = new Array(this.origBeziers.length);
      var n = segments.length;
      for (var i = 0; i < n; i++) {
        segments[i] = xypic.Shape.Segment.CubicBezier(this.origBezier, i/n, (i+1)/n);
      }
      return segments;
    }
  });
  
  xypic.MostRecentLine.Augment({}, {
  	none: xypic.MostRecentLine.None()
  });
  
  xypic.Env = MathJax.Object.Subclass({
    Init: function () {
      this.boundingBox = undefined;
    	this.savedPosition = {};
      this.angle = 0; // radian
      this.mostRecentLine = xypic.MostRecentLine.none;
      this.p = this.c = xypic.Env.originPosition;
    },
    duplicate: function () {
      var newEnv = xypic.Env();
      newEnv.boundingBox = this.boundingBox;
      newEnv.savedPosition = {};
      for (var id in this.savedPosition) {
        if (this.savedPosition.hasOwnProperty(id)) {
          newEnv.savedPosition[id] = this.savedPosition[id];
        }
      }
      newEnv.angle = this.angle;
      newEnv.mostRecentLine = this.mostRecentLine;
      newEnv.p = this.p;
      newEnv.c = this.c;
      return newEnv;
    },
    swapPAndC: function () {
      var t = this.p;
      this.p = this.c;
      this.c = t;
    },
    savePos: function (id, pos) {
    	this.savedPosition[id] = pos;
    },
    lookupPos: function (id) {
    	var pos = this.savedPosition[id];
      if (pos === undefined) {
      	throw Error('id "' + id + '" not found');
      } else {
      	return pos;
      }
    },
    extendBoundingBox: function (box) {
      this.boundingBox = xypic.Frame.combineRect(this.boundingBox, box);
    },
    toString: function () {
      var savedPositionDesc = "";
      for (var id in this.savedPosition) {
        if (this.savedPosition.hasOwnProperty(id)) {
          if (savedPositionDesc.length > 0) {
            savedPositionDesc += ", "
          }
          savedPositionDesc += id.toString()+":"+this.savedPosition[id];
        }
      }
      return "Env(p:"+this.p+", c:"+this.c+", angle:"+this.angle+", mostRecentLine:"+this.mostRecentLine+", savedPosition:{"+savedPositionDesc+"})";
    }
  }, {
    originPosition: xypic.Frame.Point(0, 0)
  });
  
  AST.Pos.Coord.Augment({
  	draw: function (svg, env) {
      env.c = this.coord.position(env);
      this.pos2s.foreach(function (p) {
        env.extendBoundingBox(p.draw(svg, env));
      });
      return env.boundingBox;
    }
  });
  
  AST.Pos.Plus.Augment({
  	draw: function (svg, env) {
    	var d = this.coord.position(env);
    	env.c = env.c.move(env.c.x+d.x, env.c.y+d.y);
      return undefined;
    }
  });
  
  AST.Pos.Minus.Augment({
  	draw: function (svg, env) {
    	var d = this.coord.position(env);
    	env.c = env.c.move(env.c.x-d.x, env.c.y-d.y);
      return undefined;
    }
  });
  
  AST.Pos.Then.Augment({
  	draw: function (svg, env) {
    	env.c = this.coord.position(env);
      return undefined;
    }
  });
  
  AST.Pos.SwapPAndC.Augment({
  	draw: function (svg, env) {
    	env.swapPAndC();
    	env.c = this.coord.position(env);
      return undefined;
    }
  });
  
  AST.Pos.ConnectObject.Augment({
  	draw: function (svg, env) {
    	return this.object.connect(svg, env);
    }
  });
  
  AST.Pos.DropObject.Augment({
  	draw: function (svg, env) {
    	env.c = this.object.drop(svg, env);
      return env.c;
    }
  });
  
  AST.Pos.Place.Augment({
  	draw: function (svg, env) {
      if (env.mostRecentLine.isDefined) {
      	var place = this.place;
        var start, end, f, dimen;
        var shouldShaveP = (place.shaveP > 0);
        var shouldShaveC = (place.shaveC > 0);
        var jotP = (shouldShaveP? place.shaveP - 1 : 0);
        var jotC = (shouldShaveC? place.shaveC - 1 : 0);
        
        if (shouldShaveP) { f = 0; }
        if (shouldShaveC) { f = 1; }
        if (shouldShaveP == shouldShaveC) {
        	f = 0.5;
        }
        if (place.factor !== undefined) {
          if (place.factor.isIntercept) {
            shouldShaveC = shouldShaveP = false;
            f = place.factor.value(svg, env);
            if (f === undefined) {
              return undefined;
            }
          } else {
            f = place.factor.value(svg, env);
          }
        }
        
        dimen = HTMLCSS.length2em(place.slide.dimen || "0");
        var jot = AST.xypic.jot;
        var slideEm = dimen + (jotP - jotC) * jot;
        var posAngle = env.mostRecentLine.posAngle(shouldShaveP, shouldShaveC, f, slideEm);
        env.c = posAngle.pos;
        env.angle = posAngle.angle;
        return env.c;
      } else  {
	      return undefined;
      }
    }
  });
  
  AST.Place.Factor.Augment({
    value: function (svg, env) {
      return this.factor;
    }
  });
  
  AST.Place.Intercept.Augment({
    value: function (svg, env) {
      if (!env.mostRecentLine.isDefined) {
        return undefined;
      }
      
      var tmpEnv = env.duplicate();
      tmpEnv.boundingBox = undefined;
      tmpEnv.angle = 0;
      tmpEnv.mostRecentLine = xypic.MostRecentLine.none;
      tmpEnv.p = tmpEnv.c = xypic.Env.originPosition;
      var box = this.pos.draw(svg, tmpEnv);
      env.extendBoundingBox(box);
      
      if (!tmpEnv.mostRecentLine.isDefined) {
        tmpEnv.mostRecentLine = xypic.MostRecentLine.Line(tmpEnv.p, tmpEnv.c, tmpEnv.p, tmpEnv.c);
      }
      
      var intersec = [];
      var thisSegs = env.mostRecentLine.segments();
      var thatSegs = tmpEnv.mostRecentLine.segments();
      
      for (var i = 0; i < thisSegs.length; i++) {
        for (var j = 0; j < thatSegs.length; j++) {
          intersec = intersec.concat(xypic.Shape.Segment.findIntersections(thisSegs[i], thatSegs[j]));
        }
      }
      
      if (intersec.length === 0) {
        // find the nearest point, if no intersection was found.
        console.log("perhaps no curve intersection.");
        
        // Levenberg-Marqardt Method
        var line0 = env.mostRecentLine;
        var line1 = tmpEnv.mostRecentLine;
        
        var n = 100; // maxIterations
        var goalAccuracy = 1e-5;
        var tau = 1e-3;
        
        var k = 0;
        var nu = 2;
        
        // TODO: 複数個の開始地点から探索し、尤もらしい解を選択する。
        var x0 = 0, x1 = 0;
        
        var tx = function (x) {
          return 1/(1 + Math.exp(-x));
        }
        var dtx = function (x) {
          var ex = Math.exp(-x);
          return ex/(1 + ex)/(1 + ex);
        }
        
        var t0 = tx(x0), t1 = tx(x1);
        var dt0 = dtx(x0), dt1 = dtx(x1);
        
        var dp0 = line0.derivative(t0);
        var dp1 = line1.derivative(t1);
        
        var j00 = dp0.x*dt0, j01 = -dp1.x*dt1;
        var j10 = dp0.y*dt0, j11 = -dp1.y*dt1;
        
        var a00 = j00*j00 + j10*j10, a01 = j00*j01 + j10*j11;
        var a10 = j01*j00 + j11*j10, a11 = j01*j01 + j11*j11;
        
        var p0 = line0.position(t0);
        var p1 = line1.position(t1);
        
        var f0 = p0.x - p1.x;
        var f1 = p0.y - p1.y;
        
        var g0 = j00*f0 + j10*f1;
        var g1 = j01*f0 + j11*f1;
        
        var stop = Math.sqrt(g0*g0 + g1*g1) < goalAccuracy;
        var mu = tau * Math.max(a00, a11);
        
        while (!stop && k < n) {
          k++;
          do {
            var am00 = a00 + mu, am01 = a01;
            var am10 = a10, am11 = a11 + mu;
            
            var det = am00*am11 - am01*am10;
            var d0 = (am11*g0 - a01*g1)/det;
            var d1 = (-am10*g0 + a00*g1)/det;
            
            if ((d0*d0 + d1*d1) < goalAccuracy * goalAccuracy * (x0*x0 + x1*x1)) {
              stop = true;
            } else {
              var newX0 = x0 - d0;
              var newX1 = x1 - d1;
              
              var newT0 = tx(newX0);
              var newT1 = tx(newX1);
              
              var newP0 = line0.position(newT0);
              var newP1 = line1.position(newT1);
              
              var newF0 = newP0.x - newP1.x;
              var newF1 = newP0.y - newP1.y;
              
              var rho = ((f0*f0 + f1*f1) - (newF0*newF0 + newF1*newF1))/(d0*(mu*d0 + g0) + d1*(mu*d1 + g1));
              
              if (rho > 0) {
                x0 = newX0;
                x1 = newX1;
                t0 = newT0;
                t1 = newT1;
                dt0 = dtx(x0);
                dt1 = dtx(x1);
                dp0 = line0.derivative(t0);
                dp1 = line1.derivative(t1);
                j00 = dp0.x*dt0; j01 = -dp1.x*dt1;
                j10 = dp0.y*dt0; j11 = -dp1.y*dt1;
                a00 = j00*j00 + j10*j10; a01 = j00*j01 + j10*j11;
                a10 = j01*j00 + j11*j10; a11 = j01*j01 + j11*j11;
                f0 = newF0;
                f1 = newF1;
                g0 = j00*f0 + j10*f1;
                g1 = j01*f0 + j11*f1;
                stop = Math.sqrt(g0*g0 + g1*g1) < goalAccuracy;
                var sigma = 2*rho - 1;
                mu = mu + Math.max(1/3, 1 - sigma*sigma*sigma);
                nu = 2;
              } else {
                mu = mu * nu;
                nu = 2 * nu;
              }
            }
          } while (!stop && !(rho !== undefined && rho > 0))
        }
        
        return tx(x0);
      } else {
        var t = (intersec[0][0].min + intersec[0][0].max)/2;
        for (var i = 1; i < intersec.length; i++) { 
          var ttmp = (intersec[i][0].min + intersec[i][0].max)/2;
          if (t > ttmp) { t = ttmp; }
        }
        return t;
      }
    }
  });
  
  AST.Pos.SavingPos.Augment({
  	draw: function (svg, env) {
    	env.savePos(this.id, env.c);
      return undefined;
    }
  });
  
  AST.Object.Augment({
  	drop: function (svg, env) {
      return this.object.drop(svg, env, this.modifiers);
    },
    connect: function (svg, env) {
    	return this.object.connect(svg, env, this.modifiers);
    },
    boundingBox: function (svg, env) {
      return this.object.boundingBox(svg, env, this.modifiers);
    }
  });
  
  AST.ObjectBox.Augment({
    boundingBox: function (svg, env, modifiers) {
      var tmpEnv = env.duplicate();
      tmpEnv.angle = 0;
      tmpEnv.p = tmpEnv.c = xypic.Frame.Point(0, 0);
      tmpGroup = svg.createGroup();
      var bbox = this.drop(tmpGroup, tmpEnv, modifiers);
      tmpGroup.remove();
      return bbox;
    }
  });
  
  AST.ObjectBox.Text.Augment({
  	drop: function (svg, env, modifiers) {
    	// modification
      modifiers.foreach(function (m) { m.preprocess(env); });
      
    	var span, stack, base, math;
      math = this.math;
      math.setTeXclass();
      
      // padding
      var p = HTMLCSS.length2em("0.1em");
      var span = HTMLCSS.Element("span", {className:"MathJax", style:{width:"100%", "text-align":"center", role:"textbox", "aria-readonly":"true", position:"relative"}});
      
      fo = svg.createSVGElement("foreignObject", {
        x:em2px(env.c.x), y:em2px(env.c.y), width:0, height:0, overflow:"visible"
      });
      fo.appendChild(span);
      
      // clear spanID for connecting objects.
      var clearSpanId = function (mml) {
        if (mml) {
          if (mml.hasOwnProperty("spanID")) { delete mml.spanID; }
          if (mml.data) {
            for (var i = 0, n = mml.data.length; i < n; i++) {
              clearSpanId(mml.data[i]);
            }
          }
        }
      }
      
      clearSpanId(math);
      span = math.HTMLcreateSpan(span);
      stack = HTMLCSS.createStack(span);
      base = HTMLCSS.createBox(stack);
      math.HTMLmeasureChild(0, base);
      var H = base.bbox.h+p, D = base.bbox.d+p, W = base.bbox.w+2*p;
      var frame = HTMLCSS.createFrame(stack,H+D, 0, W, 0, "none");
      frame.id = "MathJax-frame-"+math.spanID+HTMLCSS.idPostfix;
//      frame.style.border = "solid 0.1px pink";
      HTMLCSS.addBox(stack, frame);
      stack.insertBefore(frame, base);
      frame.style.width = em2px(W); frame.style.height = em2px(H+D);
      HTMLCSS.placeBox(frame, 0, -D, true);
      HTMLCSS.placeBox(base, p, 0);
      math.HTMLhandleSpace(span);
      math.HTMLhandleColor(span);
      
      var spanHeight = span.offsetHeight;
      var halfHD = (H+D)/2;
      var halfW = W/2;
    	
      // TODO: Zoomしたときにレイアウトが崩れないようにする。
      fo.setAttribute("x", em2px(env.c.x - halfW));
      fo.setAttribute("y", em2px(-env.c.y) - spanHeight/2);
      fo.setAttribute("width", em2px(W));
      fo.setAttribute("height", em2px(H+D));
      if (HTMLCSS.webkitSVGProblem) {
      	foreignObjects.push(fo);
      }
      
//      svg.createSVGElement("rect",{
//        x:em2px(env.c.x - W/2),
//        y:-em2px(env.c.y) - spanHeight/2,
//        width:em2px(W),
//        height:spanHeight,
//        stroke:"orange", "stroke-width":0.5
//      });
//      
//      svg.createSVGElement("rect",{
//        x:em2px(env.c.x - halfW),
//        y:-em2px(env.c.y) - em2px(halfHD),
//        width:em2px(W),
//        height:em2px(H+D),
//        stroke:"green", "stroke-width":0.5
//      });
      
      var c = env.c.toRect({u:halfHD, d:halfHD, l:halfW, r:halfW});
    	// modification
    	// TODO: '!'に対応させる。objectの大きさを元に、描画の位置を調整することになるため、ここでは遅い。
      modifiers.foreach(function (m) { c = m.postprocess(c, env); });
      return c;
    },
    connect: function (svg, env, modifiers) {
      var s = env.p.edgePoint(env.c.x, env.c.y);
      var e = env.c.edgePoint(env.p.x, env.p.y);
      if (s !== undefined && e !== undefined && (s.x !== e.x || s.y !== e.y)) {
        var objectBBox = this.boundingBox(svg, env, modifiers);
        if (objectBBox == undefined) {
          env.angle = 0;
          env.mostRecentLine = xypic.MostRecentLine.none;
          return undefined;
        }
        
        var objectWidth = objectBBox.l+objectBBox.r;
        var objectLen = objectWidth;
        if (objectLen == 0) {
          objectLen = AST.xypic.strokeWidth;
        }
        
        var dx = e.x-s.x;
        var dy = e.y-s.y;
        var len = Math.sqrt(dx*dx+dy*dy);
        var n = Math.floor(len/objectLen);
        if (n == 0) {
          env.angle = 0;
          env.mostRecentLine = xypic.MostRecentLine.none;
          return undefined;
        }
        
        var angle = Math.atan2(dy, dx);
        var cos = Math.cos(angle), sin = Math.sin(angle);
        var odx = objectLen*cos, ody = objectLen*sin;
        var shiftLen = (len - n*objectLen + objectLen - objectWidth)/2 + objectBBox.l;
        var startX = s.x + shiftLen*cos;
        var startY = s.y + shiftLen*sin;
        
        var c = env.c;
        var group = svg.createGroup();
        var bboxS, bboxE;
        for (var i = 0; i < n; i++) {
          env.c = xypic.Frame.Point(startX + i*odx, startY + i*ody);
          env.angle = 0;
          var bbox = this.drop(group, env, modifiers);
          if (i == 0) {
            bboxS = bbox;
          }
          if (i == n-1) {
            bboxE = bbox;
          }
        }
        var box = bboxS.combineRect(bboxE);
        env.angle = angle;
        env.c = c;
        env.mostRecentLine = xypic.MostRecentLine.Line(s, e, env.p, env.c);
        return box;
      }
      env.angle = 0;
      env.mostRecentLine = xypic.MostRecentLine.none;
      return undefined;
    }
  });
  
  AST.ObjectBox.Cir.Augment({
  	drop: function (svg, env, modifiers) {
      if (env.c === undefined) {
        // TODO: cが存在しない場合の扱いは？
        return undefined;
      }
      
    	// modification
      modifiers.foreach(function (m) { m.preprocess(env); });
      
      var r = this.radius.radius(env);
      var x = env.c.x;
      var y = env.c.y;
      c = this.cir.draw(svg, env, x, y, r);
      
    	// modification
    	// TODO: '!'に対応させる。objectの大きさを元に、描画の位置を調整することになるため、ここでは遅い。
      modifiers.foreach(function (m) { c = m.postprocess(c, env); });
      return c;
    },
  	connect: function (svg, env, modifiers) {
      // TODO: do nothing?
      return undefined;
    }
  });
  
  AST.ObjectBox.Cir.Radius.Vector.Augment({
    radius: function (env) {
      return this.vector.xy(env).x;
    }
  });
  AST.ObjectBox.Cir.Radius.Default.Augment({
    radius: function (env) {
      return env.c.r;
    }
  });
  AST.ObjectBox.Cir.Cir.Segment.Augment({
    draw: function (svg, env, x, y, r) {
      var sd = this.startDiag.toString();
      var ed = this.endDiag.toString();
      
      var sa, ea, large, da, flip;
      if (this.orient === "^") {
        sa = this.diagToAngleACW(sd);
        ea = this.diagToAngleACW(ed, sa);
        da = ea - sa;
        da = (da < 0? da + 360 : da);
        large = (da > 180? "1" : "0");
        flip = "0";
      } else {
        sa = this.diagToAngleCW(sd);
        ea = this.diagToAngleCW(ed, sa);
        da = ea - sa;
        da = (da < 0? da + 360 : da);
        large = (da > 180? "0" : "1");
        flip = "1";
      }
      
      var sx = x + r*Math.cos(sa/180*Math.PI);
      var sy = y + r*Math.sin(sa/180*Math.PI);
      var ex = x + r*Math.cos(ea/180*Math.PI);
      var ey = y + r*Math.sin(ea/180*Math.PI);
      
      svg.createSVGElement("path", {
        d:"M"+em2px(sx)+","+em2px(-sy)+" A"+em2px(r)+","+em2px(r)+" 0 "+large+","+flip+" "+em2px(ex)+","+em2px(-ey)
      });
      return xypic.Frame.Circle(x, y, r);
    },
    diagToAngleACW: function (diag, angle) {
      switch (diag) {
        case "l": return 90;
        case "r": return -90;
        case "d": return 180;
        case "u": return 0;
        case "dl":
        case "ld":
          return 135;
        case "dr":
        case "rd":
          return -135;
        case "ul":
        case "lu":
          return 45;
        case "ur":
        case "ru":
          return -45;
        default:
          if (angle !== undefined) {
            return angle + 180;
          } else {
            return 0;
          }
      }
    },
    diagToAngleCW: function (diag, angle) {
      switch (diag) {
        case "l": return -90;
        case "r": return 90;
        case "d": return 0;
        case "u": return 180;
        case "dl":
        case "ld":
          return -45;
        case "dr":
        case "rd":
          return 45;
        case "ul":
        case "lu":
          return -135;
        case "ur":
        case "ru":
          return 135;
        default:
          if (angle !== undefined) {
            return angle + 180;
          } else {
            return 0;
          }
      }
    },
  });
  AST.ObjectBox.Cir.Cir.Full.Augment({
    draw: function (svg, env, x, y, r) {
      svg.createSVGElement("circle", {
        cx:em2px(x), cy:em2px(-y), r:em2px(r)
      });
      return xypic.Frame.Circle(x, y, r);
    }
  });
  
  AST.ObjectBox.Dir.Augment({
  	drop: function (svg, env, modifiers) {
      if (env.c === undefined) {
        // TODO: cが存在しない場合の扱いは？
        return undefined;
      }
      
      modifiers.foreach(function (m) { m.preprocess(env); });
      
      var t = AST.xypic.thickness;
      var g = svg.createGroup(svg.transformBuilder().translate(env.c.x,env.c.y).rotateRadian(env.angle));
      
      var box;
      switch (this.main) {
      	case ">":
          switch (this.variant) {
          	case "2":
//            	var l = Math.sqrt(0.55*0.55+0.165*0.165);
//              var lc = l*Math.cos(10*Math.PI/180+Math.atan2(0.165, 0.55));
//              var ls = l*Math.sin(10*Math.PI/180+Math.atan2(0.165, 0.55));
//              console.log("l:"+l, ", l cos 10:"+lc+", l sin 10:"+ls)
//              box = {l:lc-0.24, r:0.24, d:ls, u:ls};
              box = {l:0.273, r:0.24, d:0.258, u:0.258};
            	var gu = g.createGroup(g.transformBuilder().translate(0.24,0).rotateDegree(-10));
            	var gd = g.createGroup(g.transformBuilder().translate(0.24,0).rotateDegree(10));
              gu.createSVGElement("path", {
                d:"M0,0 Q"+em2px(-0.25)+","+em2px(-0.023)+" "+em2px(-0.55)+","+em2px(-0.165)
              });
              gd.createSVGElement("path", {
                d:"M0,0 Q"+em2px(-0.25)+","+em2px(0.023)+" "+em2px(-0.55)+","+em2px(0.165), 
              });
            	break;
            case "3":
//            	var l = Math.sqrt(0.55*0.55+0.165*0.165);
//              var lc = l*Math.cos(15*Math.PI/180+Math.atan2(0.165, 0.55));
//              var ls = l*Math.sin(15*Math.PI/180+Math.atan2(0.165, 0.55));
//              console.log("l:"+l, ", l cos 15:"+lc+", l sin 15:"+ls)
//              box = {l:0.24, r:0.33, d:ls, u:ls};
              box = {l:0.23, r:0.33, d:0.3017, u:0.3017};
            	var gu = g.createGroup(g.transformBuilder().translate(0.33,0).rotateDegree(-15));
            	var gd = g.createGroup(g.transformBuilder().translate(0.33,0).rotateDegree(15));
              gu.createSVGElement("path", {
                d:"M0,0 Q"+em2px(-0.25)+","+em2px(-0.023)+" "+em2px(-0.55)+","+em2px(-0.165)
              });
              g.createSVGElement("line", {
              	x1:em2px(0.33), y1:0, x2:em2px(-0.24), y2:0
              });
              gd.createSVGElement("path", {
                d:"M0,0 Q"+em2px(-0.25)+","+em2px(0.023)+" "+em2px(-0.55)+","+em2px(0.165)
              });
            	break;
            default:
		        	box = {l:0.55, r:0, d:(this.variant==="^"? 0:0.165), u:(this.variant==="_"? 0:0.165)};
              if (this.variant !== "^") {
                g.createSVGElement("path", {
                  d:"M0,0 Q"+em2px(-0.25)+","+em2px(0.023)+" "+em2px(-0.55)+","+em2px(0.165)
                });
              }
              if (this.variant !== "_") {
                g.createSVGElement("path", {
                  d:"M0,0 Q"+em2px(-0.25)+","+em2px(-0.023)+" "+em2px(-0.55)+","+em2px(-0.165)
                });
              }
          }
        	break;
      	case "<":
          switch (this.variant) {
          	case "2":
//            	var l = Math.sqrt(0.55*0.55+0.165*0.165);
//              var lc = l*Math.cos(10*Math.PI/180+Math.atan2(0.165, 0.55));
//              var ls = l*Math.sin(10*Math.PI/180+Math.atan2(0.165, 0.55));
//              console.log("l:"+l, ", l cos 10:"+lc+", l sin 10:"+ls)
//              box = {l:0.24, r:lc-0.24, d:ls, u:ls};
              box = {l:0.24, r:0.273, d:0.258, u:0.258};
              var gu = g.createGroup(g.transformBuilder().translate(-0.24,0).rotateDegree(10)); 
              var gd = g.createGroup(g.transformBuilder().translate(-0.24,0).rotateDegree(-10));
              gu.createSVGElement("path", {
                d:"M0,0 Q"+em2px(0.25)+","+em2px(-0.023)+" "+em2px(0.55)+","+em2px(-0.165)
              });
              gd.createSVGElement("path", {
                d:"M0,0 Q"+em2px(0.25)+","+em2px(0.023)+" "+em2px(0.55)+","+em2px(0.165), 
              });
            	break;
            case "3":
//            	var l = Math.sqrt(0.55*0.55+0.165*0.165);
//              var lc = l*Math.cos(15*Math.PI/180+Math.atan2(0.165, 0.55));
//              var ls = l*Math.sin(15*Math.PI/180+Math.atan2(0.165, 0.55));
//              console.log("l:"+l, ", l cos 15:"+lc+", l sin 15:"+ls)
//              box = {l:0.33, r:0.24, d:ls, u:ls};
              box = {l:0.33, r:0.24, d:0.3017, u:0.3017};
            	var gu = g.createGroup(g.transformBuilder().translate(-0.33,0).rotateDegree(15));
            	var gd = g.createGroup(g.transformBuilder().translate(-0.33,0).rotateDegree(-15));
              gu.createSVGElement("path", {
                d:"M0,0 Q"+em2px(0.25)+","+em2px(-0.023)+" "+em2px(0.55)+","+em2px(-0.165)
              });
              g.createSVGElement("line", {
              	x1:em2px(-0.33), y1:0, x2:em2px(0.24), y2:0
              });
              gd.createSVGElement("path", {
                d:"M0,0 Q"+em2px(0.25)+","+em2px(0.023)+" "+em2px(0.55)+","+em2px(0.165)
              });
            	break;
            default:
              box = {l:0, r:0.55, d:(this.variant==="^"? 0:0.165), u:(this.variant==="_"? 0:0.165)};
              if (this.variant !== "^") {
                g.createSVGElement("path", {
                  d:"M0,0 Q"+em2px(0.25)+","+em2px(0.023)+" "+em2px(0.55)+","+em2px(0.165)
                });
              }
              if (this.variant !== "_") {
                g.createSVGElement("path", {
                  d:"M0,0 Q"+em2px(0.25)+","+em2px(-0.023)+" "+em2px(0.55)+","+em2px(-0.165)
                });
              }
          }
        	break;
        case "|":
        	var l = em2px(3*t);
        	switch (this.variant) {
          	case "^":
            	box = {l:0, r:0, u:3*t, d:0};
              g.createSVGElement("line", {
                x1:0, y1:0, x2:0, y2:-l
              });
              break;
            case "_":
            	box = {l:0, r:0, u:0, d:3*t};
              g.createSVGElement("line", {
                x1:0, y1:0, x2:0, y2:l
              });
              break;
            case "2":
            	box = {l:0, r:0, u:2*t, d:2*t};
              g.createSVGElement("line", {
                x1:0, y1:em2px(2*t), x2:0, y2:em2px(-2*t)
              });
              break;
            case "3":
            	box = {l:0, r:0, u:2.5*t, d:2.5*t};
              g.createSVGElement("line", {
                x1:0, y1:em2px(2.5*t), x2:0, y2:em2px(-2.5*t)
              });
              break;
            default:
            	box = {l:0, r:0, u:1.5*t, d:1.5*t};
              g.createSVGElement("line", {
                x1:0, y1:l/2, x2:0, y2:-l/2
              });
          }
          break;
        case "(":
        	var r = em2px(1.5*t);
        	switch (this.variant) {
          	case "^":
            	box = {l:1.5*t, r:0, u:3*t, d:0};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,1 0,"+(-2*r)
              });
              break;
            case "_":
            	box = {l:1.5*t, r:0, u:0, d:3*t};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,0 0,"+(2*r)
              });
              break;
            default:
            	box = {l:0, r:1.5*t, u:1.5*t, d:1.5*t};
              g.createSVGElement("path", {
                d:"M"+r+","+(-r)+" A "+r+","+r+" 0 0,0 "+r+","+r
              });
          }
          break;
        case ")":
        	var r = em2px(1.5*t);
        	switch (this.variant) {
          	case "^":
            	box = {l:0, r:1.5*t, u:3*t, d:0};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,0 0,"+(-2*r)
              });
              break;
            case "_":
            	box = {l:0, r:1.5*t, u:0, d:3*t};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,1 0,"+(2*r)
              });
              break;
            default:
            	box = {l:1.5*t, r:0, u:1.5*t, d:1.5*t};
              g.createSVGElement("path", {
                d:"M"+(-r)+","+(-r)+" A "+r+","+r+" 0 0,1 "+(-r)+","+r
              });
          }
          break;
        case "`":
        	var r = em2px(1.5*t);
        	switch (this.variant) {
            case "_":
            	box = {l:1.5*t, r:0, u:0, d:1.5*t};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,0 "+(-r)+","+(r)
              });
              break;
          	case "^":
            default:
            	box = {l:1.5*t, r:0, u:1.5*t, d:0};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,1 "+(-r)+","+(-r)
              });
              break;
          }
          break;
        case "'":
        	var r = em2px(1.5*t);
        	switch (this.variant) {
            case "_":
            	box = {l:0, r:1.5*t, u:0, d:1.5*t};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,1 "+r+","+(r)
              });
              break;
          	case "^":
            default:
            	box = {l:0, r:1.5*t, u:1.5*t, d:0};
              g.createSVGElement("path", {
                d:"M0,0 A "+r+","+r+" 0 0,0 "+r+","+(-r)
              });
              break;
          }
          break;
        default:
          svg.firstChild.removeChild(g);
          // TODO: impl compound arrowheads
      }
      
      var c = env.c.toRect(box).rotate(env.angle);
//      svg.createSVGElement("rect", {
//        x:em2px(c.x-c.l), y:em2px(-c.y-c.u), width:em2px(c.l+c.r), height:em2px(c.u+c.d),
//        "stroke-width":"0.02em", stroke:"green"
//      })
      
    	// modification
      modifiers.foreach(function (m) { c = m.postprocess(c, env); });
      return c;
    },
    connect: function (svg, env, modifiers) {
      // 多重線の幅、点線・破線の幅の基準
      var t = AST.xypic.thickness;
      var s = env.p.edgePoint(env.c.x, env.c.y);
      var e = env.c.edgePoint(env.p.x, env.p.y);
      if (s !== undefined && e !== undefined && (s.x !== e.x || s.y !== e.y)) {
        var dx = e.x-s.x;
        var dy = e.y-s.y;
        var angle = Math.atan2(dy, dx);
        var shift = {x:0, y:0};
        var box;
        
      	switch (this.main) {
        	case '':
          	// draw nothing
          	break;
        	case '-':
          	box = this.drawline(svg, env, s, e, shift, angle, t, this.variant, "");
	          break;
          case '=':
          	box = this.drawline(svg, env, s, e, shift, angle, t, "2", "");
            break;
          case '.':
          case '..':
          	box = this.drawline(svg, env, s, e, shift, angle, t, this.variant, "1 "+em2px(t));
          	break;
          case ':':
          case '::':
          	box = this.drawline(svg, env, s, e, shift, angle, t, "2", "1 "+em2px(t));
          	break;
          case '--':
          case '==':
          	var len = Math.sqrt(dx*dx+dy*dy);
            var dash = 3*t;
            if (len >= dash) {
            	var shiftLen = (len-dash)/2-Math.floor((len-dash)/2/dash)*dash;
              shift = {x:shiftLen*Math.cos(angle), y:shiftLen*Math.sin(angle)};
	          	box = this.drawline(svg, env, s, e, shift, angle, t, (this.main==="=="? "2":this.variant), em2px(dash)+" "+em2px(dash));
            }
            break;
          case '~':
          	var len = Math.sqrt(dx*dx+dy*dy);
            var wave = 4*t;
            if (len >= wave) {
            	var n = Math.floor(len/wave);
            	var shiftLen = (len-n*wave)/2;
              shift = {x:shiftLen*Math.cos(angle), y:shiftLen*Math.sin(angle)};
              var cx = t*Math.cos(angle+Math.PI/2);
              var cy = t*Math.sin(angle+Math.PI/2);
              var tx = t*Math.cos(angle);
              var ty = t*Math.sin(angle);
              var sx = s.x+shift.x;
              var sy = -s.y-shift.y;
              var d = "M"+em2px(sx)+","+em2px(sy)+
                " Q"+em2px(sx+tx+cx)+","+em2px(sy-ty-cy)+
                " "+em2px(sx+2*tx)+","+em2px(sy-2*ty)+
                " T"+em2px(sx+4*tx)+","+em2px(sy-4*ty);
              for (var i = 1; i < n; i++) {
              	d += " T"+em2px(sx+(4*i+2)*tx)+","+em2px(sy-(4*i+2)*ty)+
                	" T"+em2px(sx+(4*i+4)*tx)+","+em2px(sy-(4*i+4)*ty);
              }
              box = this.drawPath(svg, env, d, s, e, cx, cy);
            }
          	break;
          case '~~':
          	var len = Math.sqrt(dx*dx+dy*dy);
            var wave = 4*t;
            if (len >= wave) {
            	var n = Math.floor((len-wave)/2/wave);
            	var shiftLen = (len-wave)/2-n*wave;
              shift = {x:shiftLen*Math.cos(angle), y:shiftLen*Math.sin(angle)};
              var cx = t*Math.cos(angle+Math.PI/2);
              var cy = t*Math.sin(angle+Math.PI/2);
              var tx = t*Math.cos(angle);
              var ty = t*Math.sin(angle);
              var sx = s.x+shift.x;
              var sy = -s.y-shift.y;
              var d = "";
              for (var i = 0; i <= n; i++) {
              	d += " M"+em2px(sx+8*i*tx)+","+em2px(sy-8*i*ty)+
                	" Q"+em2px(sx+(8*i+1)*tx+cx)+","+em2px(sy-(8*i+1)*ty-cy)+
                	" "+em2px(sx+(8*i+2)*tx)+","+em2px(sy-(8*i+2)*ty)+
                	" T"+em2px(sx+(8*i+4)*tx)+","+em2px(sy-(8*i+4)*ty);
              }
              box = this.drawPath(svg, env, d, s, e, cx, cy);
            }
          	break;
            
          default:
            // connect by arrowheads
            var arrowBBox = this.boundingBox(svg, env, modifiers);
            if (arrowBBox == undefined) {
              env.angle = 0;
              env.mostRecentLine = xypic.MostRecentLine.none;
              return undefined;
            }
            
            var arrowLen = arrowBBox.l+arrowBBox.r;
            if (arrowLen == 0) {
              arrowLen = AST.xypic.strokeWidth;
            }
            
            var len = Math.sqrt(dx*dx+dy*dy);
            var n = Math.floor(len/arrowLen);
            if (n == 0) {
              env.angle = 0;
              env.mostRecentLine = xypic.MostRecentLine.none;
              return undefined;
            }
            
            var c = env.c;
            var shiftLen = (len - n*arrowLen)/2;
            var cos = Math.cos(angle), sin = Math.sin(angle);
            var ac = arrowLen*cos, as = arrowLen*sin;
            var startX = s.x + (shiftLen + arrowBBox.l)*cos;
            var startY = s.y + (shiftLen + arrowBBox.l)*sin;
            var group = svg.createGroup();
            for (var i = 0; i < n; i++) {
              env.c = xypic.Frame.Point(startX + i*ac, startY + i*as);
              env.angle = angle;
              var bbox = this.drop(group, env, modifiers);
              if (i == 0) {
                bboxS = bbox;
              }
              if (i == n-1) {
                bboxE = bbox;
              }
            }
            var box = bboxS.combineRect(bboxE);
            env.c = c;
            env.angle = angle;
            env.mostRecentLine = xypic.MostRecentLine.Line(s, e, env.p, env.c);
            return box;            
        }
        
        env.angle = angle;
        env.mostRecentLine = xypic.MostRecentLine.Line(s, e, env.p, env.c);
        return box;
      } else {
        env.angle = 0;
        env.mostRecentLine = xypic.MostRecentLine.none;
        return undefined;
      }
    },
    drawline: function (svg, env, s, e, shift, angle, t, variant, dasharray) {
      if (variant === "3") {
        var cx = t*Math.cos(angle+Math.PI/2);
        var cy = t*Math.sin(angle+Math.PI/2);
        svg.createSVGElement("line", {
          x1:em2px(s.x+shift.x), y1:-em2px(s.y+shift.y),
          x2:em2px(e.x), y2:-em2px(e.y), 
          "stroke-dasharray":dasharray
        });
        svg.createSVGElement("line", {
          x1:em2px(s.x+cx+shift.x), y1:-em2px(s.y+cy+shift.y),
          x2:em2px(e.x+cx), y2:-em2px(e.y+cy), 
          "stroke-dasharray":dasharray
        });
        svg.createSVGElement("line", {
          x1:em2px(s.x-cx+shift.x), y1:-em2px(s.y-cy+shift.y),
          x2:em2px(e.x-cx), y2:-em2px(e.y-cy), 
          "stroke-dasharray":dasharray
        });
        return xypic.Frame.Rect(s.x, s.y, {
        	l:s.x-Math.min(s.x+cx, s.x-cx, e.x+cx, e.x-cx),
        	r:Math.max(s.x+cx, s.x-cx, e.x+cx, e.x-cx)-s.x,
        	u:Math.max(s.y+cy, s.y-cy, e.y+cy, e.y-cy)-s.y,
        	d:s.y-Math.min(s.y+cy, s.y-cy, e.y+cy, e.y-cy)
        });
      } else if (variant === "2") {
        var cx = t*Math.cos(angle+Math.PI/2)/2;
        var cy = t*Math.sin(angle+Math.PI/2)/2;
        svg.createSVGElement("line", {
          x1:em2px(s.x+cx+shift.x), y1:-em2px(s.y+cy+shift.y),
          x2:em2px(e.x+cx), y2:-em2px(e.y+cy), 
          "stroke-dasharray":dasharray
        });
        svg.createSVGElement("line", {
          x1:em2px(s.x-cx+shift.x), y1:-em2px(s.y-cy+shift.y),
          x2:em2px(e.x-cx), y2:-em2px(e.y-cy), 
          "stroke-dasharray":dasharray
        });
        return xypic.Frame.Rect(s.x, s.y, {
        	l:s.x-Math.min(s.x+cx, s.x-cx, e.x+cx, e.x-cx),
        	r:Math.max(s.x+cx, s.x-cx, e.x+cx, e.x-cx)-s.x,
        	u:Math.max(s.y+cy, s.y-cy, e.y+cy, e.y-cy)-s.y,
        	d:s.y-Math.min(s.y+cy, s.y-cy, e.y+cy, e.y-cy)
        });
      } else {
        svg.createSVGElement("line", {
          x1:em2px(s.x+shift.x), y1:-em2px(s.y+shift.y),
          x2:em2px(e.x), y2:-em2px(e.y), 
          "stroke-dasharray":dasharray
        });
        return xypic.Frame.Rect(s.x, s.y, {
        	l:s.x-Math.min(s.x, e.x),
        	r:Math.max(s.x, e.x)-s.x,
        	u:Math.max(s.y, e.y)-s.y,
        	d:s.y-Math.min(s.y, e.y)
        });
      }
    },
    drawPath: function (svg, env, d, s, e, cx, cy) {
      if (this.variant === "3") {
        svg.createSVGElement("path", {d:d});
        g1 = svg.createGroup(svg.transformBuilder().translate(cx,cy));
        g1.createSVGElement("path", {d:d});
        g2 = svg.createGroup(svg.transformBuilder().translate(-cx,-cy));
        g2.createSVGElement("path", {d:d});
        var bx = 1.5*cx, by = 1.5*cy;
        return xypic.Frame.Rect(s.x, s.y, {
          l:s.x-Math.min(s.x+bx, s.x-bx, e.x+bx, e.x-bx),
          r:Math.max(s.x+bx, s.x-bx, e.x+bx, e.x-bx)-s.x,
          u:Math.max(s.y+by, s.y-by, e.y+by, e.y-by)-s.y,
          d:s.y-Math.min(s.y+by, s.y-by, e.y+by, e.y-by)
        });
      } else if (this.variant === "2") {
        g1 = svg.createGroup(svg.transformBuilder().translate(cx/2,cy/2));
        g1.createSVGElement("path", {d:d});
        g2 = svg.createGroup(svg.transformBuilder().translate(-cx/2,-cy/2));
        g2.createSVGElement("path", {d:d});
        return xypic.Frame.Rect(s.x, s.y, {
          l:s.x-Math.min(s.x+cx, s.x-cx, e.x+cx, e.x-cx),
          r:Math.max(s.x+cx, s.x-cx, e.x+cx, e.x-cx)-s.x,
          u:Math.max(s.y+cy, s.y-cy, e.y+cy, e.y-cy)-s.y,
          d:s.y-Math.min(s.y+cy, s.y-cy, e.y+cy, e.y-cy)
        });
      } else {
        svg.createSVGElement("path", {d:d});
        var bx = cx/2, by = cy/2;
        return xypic.Frame.Rect(s.x, s.y, {
          l:s.x-Math.min(s.x+bx, s.x-bx, e.x+bx, e.x-bx),
          r:Math.max(s.x+bx, s.x-bx, e.x+bx, e.x-bx)-s.x,
          u:Math.max(s.y+by, s.y-by, e.y+by, e.y-by)-s.y,
          d:s.y-Math.min(s.y+by, s.y-by, e.y+by, e.y-by)
        });
      }
    }
  });
  
  AST.ObjectBox.Curve.Augment({
    drop: function (svg, env, modifiers) {
      return xypic.Frame.Point(env.c.x, env.c.y);
    },
    connect: function (svg, env, modifiers) {
    	// find object for drop and connect
      var objectForDrop = undefined;
      var objectForConnect = undefined;
      this.objects.foreach(function (o) {
      	objectForDrop = o.objectForDrop(objectForDrop);
      	objectForConnect = o.objectForConnect(objectForConnect);
      });
      if (objectForDrop === undefined && objectForConnect === undefined) {
        objectForConnect = AST.Object(FP.List.empty, AST.ObjectBox.Dir("", "-"));
      }
      
      // 多重線の幅、点線・破線の幅の基準
      var thickness = AST.xypic.thickness;
      
      var c = env.c;
      var p = env.p;
      var controlPoints = [];
      this.poslist.foreach(function (p) {
				p.draw(svg, env);
        controlPoints.push(env.c);
//        svg.createSVGElement("circle", {
//          cx:em2px(env.c.x), cy:-em2px(env.c.y), r:em2px(thickness/2)
//        });
      });
//      console.log("controlPoints:"+controlPoints);
      
      env.c = c;
      env.p = p;
      var box;
      var s = p;
      var e = c;
      switch (controlPoints.length) {
        case 0:
          if (s.x === e.x && s.y === e.y) {
            env.mostRecentLine = xypic.MostRecentLine.none;
            env.angle = 0;
            return undefined;
          }
          if (objectForConnect !== undefined) {
            return objectForConnect.connect(svg, env, FP.List.empty);
          } else {
            return objectForDrop.connect(svg, env, FP.List.empty);
          }
          
        case 1:
          var origBezier = xypic.Shape.QuadBezier(s, controlPoints[0], e);
          var shavePBezier = origBezier.shaveStart(s);
          var shavePCBezier;
          if (shavePBezier !== undefined) {
            shavePCBezier = shavePBezier.shaveEnd(e);
          }
          if (shavePCBezier === undefined) {
              env.angle = 0;
              env.mostRecentLine = xypic.MostRecentLine.none;
              return undefined;
          }
          box = shavePCBezier.draw(svg, env, objectForDrop, objectForConnect);
          env.mostRecentLine = xypic.MostRecentLine.QuadBezier(origBezier, shavePBezier, shavePCBezier);
          env.angle = Math.atan2(e.y - s.y, e.x - s.x);
          break;
          
        case 2:
          var origBezier = xypic.Shape.CubicBezier(s, controlPoints[0], controlPoints[1], e);
          var shavePBezier = origBezier.shaveStart(s);
          var shavePCBezier;
          if (shavePBezier !== undefined) {
            shavePCBezier = shavePBezier.shaveEnd(e);
          }
          var cb = shavePCBezier;
          if (cb === undefined) {
            env.mostRecentLine = xypic.MostRecentLine.none;
            env.angle = 0;
            return undefined;
          }
          
          box = shavePCBezier.draw(svg, env, objectForDrop, objectForConnect);
          env.mostRecentLine = xypic.MostRecentLine.CubicBezier(origBezier, shavePBezier, shavePCBezier);
          env.angle = Math.atan2(e.y - s.y, e.x - s.x);
          break;
          
        default:
          var spline = xypic.Shape.CubicBSpline(s, controlPoints, e);
          var origBeziers = xypic.Shape.CubicBeziers(spline.toCubicBeziers());
          var shavePBeziers = origBeziers.shaveStart(s);
          var shavePCBeziers = shavePBeziers.shaveEnd(e);
          
          var n = shavePCBeziers.countOfSegments;
          if (n == 0) {
            env.mostRecentLine = xypic.MostRecentLine.none;
            env.angle = 0;
            return undefined;
          }
          box = shavePCBeziers.draw(svg, env, objectForDrop, objectForConnect);
          env.mostRecentLine = xypic.MostRecentLine.CubicBSpline(s, e, origBeziers, shavePBeziers, shavePCBeziers);
          env.angle = Math.atan2(e.y - s.y, e.x - s.x);
          break;
      }
      
//        svg.createSVGElement("rect", {
//          x:em2px(box.x-box.l), y:em2px(-box.y-box.u), width:em2px(box.l+box.r), height:em2px(box.u+box.d),
//          "stroke-width":"0.02em", stroke:"green"
//        })
      return box;
    }
	});
  
  AST.ObjectBox.Curve.Object.Drop.Augment({
  	objectForDrop: function (object) {
    	return this.object;
    },
  	objectForConnect: function (object) {
    	return object;
    },
  });
  
  AST.ObjectBox.Curve.Object.Connect.Augment({
  	objectForDrop: function (object) {
    	return object;
    },
  	objectForConnect: function (object) {
    	return this.object;
    },
  });
  
  AST.ObjectBox.Curve.PosList.CurPos.Augment({
  	draw: function (svg, env) {
    	return undefined;
    }
  });
  
  AST.ObjectBox.Curve.PosList.Pos.Augment({
  	draw: function (svg, env) {
    	return this.pos.draw(svg, env);
    }
  });
  
  AST.ObjectBox.Curve.PosList.AddStack.Augment({
  	draw: function (svg, env) {
    	// TODO: impl pick control points from the stack
    	return undefined;
    }
  });
  
  AST.Coord.C.Augment({
    position: function (env) {
    	return env.c;
    }
  });
  
  AST.Coord.P.Augment({
    position: function (env) {
    	return env.p;
    }
  });
  
  AST.Coord.X.Augment({
    position: function (env) {
    	var p = env.p;
      var c = env.c;
      // TODO: 分母が0のときはどうする？ 扱いがComplete Sourceに書いてある。
      var x = p.x-(c.x-p.x)/(c.y-p.y)*p.y;
    	return xypic.Frame.Point(x, 0);
    }
  });
  
  AST.Coord.Y.Augment({
    position: function (env) {
    	var p = env.p;
      var c = env.c;
      // TODO: 分母が0のときはどうする？ 扱いがComplete Sourceに書いてある。
      var y = p.y-(c.y-p.y)/(c.x-p.x)*p.x;
    	return xypic.Frame.Point(0, y);
    }
  });
  
  AST.Coord.Vector.Augment({
    position: function (env) {
    	var xy = this.vector.xy(env);
    	return xypic.Frame.Point(xy.x, xy.y);
    }
  });
  
  AST.Coord.Id.Augment({
    position: function (env) {
    	return env.lookupPos(this.id)
    }
  });
  
  AST.Vector.InCurBase.Augment({
    xy: function (env) {
    	return {x:this.x, y:this.y};
    },
    angle: function (env) {
    	return Math.atan2(this.y, this.x);
    }
  });
  
  AST.Vector.Abs.Augment({
    xy: function (env) {
    	// TODO: 拡大したときに位置がずれないようにする。
    	return {x:HTMLCSS.length2em(this.x), y:HTMLCSS.length2em(this.y)};
    },
    angle: function (env) {
    	var xy = this.xy(env);
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Vector.Angle.Augment({
    xy: function (env) {
      var angle = Math.PI/180*this.degree;
      return {x:Math.cos(angle), y:Math.sin(angle)};
    },
    angle: function (env) {
    	return Math.PI/180*this.degree;
    }
  });
  
  AST.Vector.Dir.Augment({
    xy: function (env) {
    	var l = HTMLCSS.length2em(this.dimen);
      var angle = this.dir.angle(env);
      return {x:l*Math.cos(angle), y:l*Math.sin(angle)};
    },
    angle: function (env) {
    	return this.dir.angle(env);
    }
  });
  
  AST.Vector.Corner.Augment({
    xy: function (env) {
    	var xy = this.corner.xy(env);
      return {x:xy.x*this.factor, y:xy.y*this.factor};
    },
    angle: function (env) {
    	return this.corner.angle(env);
    }
  });
  
  AST.Corner.L.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:-c.l, y:0};
    },
    angle: function (env) {
    	return Math.PI;
    }
  });
  
  AST.Corner.R.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:c.r, y:0};
    },
    angle: function (env) {
    	return 0;
    }
  });
  
  AST.Corner.D.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:0, y:-c.d};
    },
    angle: function (env) {
    	return -Math.PI/2;
    }
  });
  
  AST.Corner.U.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:0, y:c.u};
    },
    angle: function (env) {
    	return Math.PI/2;
    }
  });
  
  AST.Corner.CL.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:-c.l, y:(c.u-c.d)/2};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.CR.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:c.r, y:(c.u-c.d)/2};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.CD.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:(c.r-c.l)/2, y:-c.d};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.CU.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:(c.r-c.l)/2, y:c.u};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.LU.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:-c.l, y:c.u};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.LD.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:-c.l, y:-c.d};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.RU.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:c.r, y:c.u};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.RD.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:c.r, y:-c.d};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.NearestEdgePoint.Augment({
  	xy: function (env) {
    	var c = env.c;
      var e = c.edgePoint() || xypic.Frame.Point(0, 0);  
      return {x:e.x-c.x, y:e.y-c.y};
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.PropEdgePoint.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:e.x-c.x, y:e.y-c.y};	// TODO: calc proportional edge point
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.atan2(xy.y, xy.x);
    }
  });
  
  AST.Corner.Axis.Augment({
  	xy: function (env) {
    	var c = env.c;
      return {x:0, y:(c.u-c.d)/2};	// TODO: align to Math axis
    },
    angle: function (env) {
    	var xy = this.xy();
    	return Math.PI/2;
    }
  });
  
  AST.Modifier.Vector.Augment({
  	preprocess: function (env) {
    	var d = this.vector.xy(env);
      env.c = env.c.move(env.c.x - d.x, env.c.y - d.y);
    },
    postprocess: function (c, env) {
    	return c;
    }
  });
  
  AST.Modifier.Shape.Augment({
  	preprocess: function (env) {
    	this.shape.preprocess(env);
    },
    postprocess: function (c, env) {
    	return this.shape.postprocess(c, env);
    }
  });
  
  AST.Modifier.Shape.Point.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	var mc = xypic.Frame.Point(c.x, c.y);
      env.c = mc;
      return mc;
    }
  });
  
  AST.Modifier.Shape.Rect.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	return c;
    }
  });
  
  AST.Modifier.Shape.Circle.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	return xypic.Frame.Circle(c.x, c.y, Math.max(c.l, c.r, c.u, c.d));
    }
  });
  
  AST.Modifier.Shape.L.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	// TODO: impl [l]
    	return c;
    }
  });
  
  AST.Modifier.Shape.R.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	// TODO: impl [r]
    	return c;
    }
  });
  
  AST.Modifier.Shape.U.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	// TODO: impl [u]
    	return c;
    }
  });
  
  AST.Modifier.Shape.D.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	// TODO: impl [d]
    	return c;
    }
  });
  
  AST.Modifier.Shape.C.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	// TODO: impl [c]
    	return c;
    }
  });
  
  AST.Modifier.AddOp.Augment({
  	preprocess: function (env) {},
    postprocess: function (c, env) {
    	return this.op.postprocess(this.size, c, env);
    }
  });
  AST.Modifier.AddOp.Grow.Augment({
    postprocess: function (size, c, env) {
      var margin = (size.isDefault?
        {x:2*AST.xypic.objectmargin, y:2*AST.xypic.objectmargin}:
        size.vector.xy(env));
    	var xMargin = Math.abs(margin.x/2);
    	var yMargin = Math.abs(margin.y/2);
      return c.grow(xMargin, yMargin);
    }
  });
  AST.Modifier.AddOp.Shrink.Augment({
    postprocess: function (size, c, env) {
      var margin = (size.isDefault?
        {x:2*AST.xypic.objectmargin, y:2*AST.xypic.objectmargin}:
        size.vector.xy(env));
    	var xMargin = -Math.abs(margin.x/2);
    	var yMargin = -Math.abs(margin.y/2);
      return c.grow(xMargin, yMargin);
    }
  });
  AST.Modifier.AddOp.Set.Augment({
    postprocess: function (size, c, env) {
      var margin = (size.isDefault?
        {x:AST.xypic.objectwidth, y:AST.xypic.objectheight}:
        size.vector.xy(env));
    	var width = Math.abs(margin.x);
    	var height = Math.abs(margin.y);
      return c.toSize(width, height);
    }
  });
  AST.Modifier.AddOp.GrowTo.Augment({
    postprocess: function (size, c, env) {
      var l = Math.max(c.l+c.r, c.u+c.d);
      var margin = (size.isDefault? {x:l, y:l} : size.vector.xy(env));
    	var width = Math.abs(margin.x);
    	var height = Math.abs(margin.y);
      return c.growTo(width, height);
    }
  });
  AST.Modifier.AddOp.ShrinkTo.Augment({
    postprocess: function (size, c, env) {
      var l = Math.min(c.l+c.r, c.u+c.d);
      var margin = (size.isDefault? {x:l, y:l} : size.vector.xy(env));
    	var width = Math.abs(margin.x);
    	var height = Math.abs(margin.y);
      return c.shrinkTo(width, height);
    }
  });
  
  AST.Direction.Compound.Augment({
  	angle: function (env) {
    	var angle = this.dir.angle(env);
      this.rots.foreach(function (rot) { angle = rot.rotate(angle, env); });
      return angle;
    }
  });
  
  AST.Direction.Diag.Augment({
  	angle: function (env) {
    	return this.diag.angle(env);
    }
  });
  
  AST.Direction.Vector.Augment({
  	angle: function (env) {
    	return this.vector.angle(env);
    }
  });
  
  AST.Direction.RotVector.Augment({
  	rotate: function (angle, env) {
      return angle + this.vector.angle(env);
    }
  });
  
  AST.Direction.RotCW.Augment({
  	rotate: function (angle, env) {
      return angle + Math.PI/2;
    }
  });
  
  AST.Direction.RotAntiCW.Augment({
  	rotate: function (angle, env) {
      return angle - Math.PI/2;
    }
  });
  
  AST.Diag.Default.Augment({
  	angle: function (env) {
    	return env.angle;
    }
  });
    
  AST.Diag.Angle.Augment({
  	angle: function (env) {
    	return this.ang;
    }
  });
  
  MathJax.Hub.Startup.signal.Post("HTML-CSS Xy-pic Ready");
});

MathJax.Ajax.loadComplete("[MathJax]/extensions/TeX/xypic.js");
