/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-07-23
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if ("document" in self) {

// Full polyfill for browsers with no classList support
	if (!("classList" in document.createElement("_"))) {

		(function (view) {

			"use strict";

			if (!('Element' in view)) return;

			var
				classListProp = "classList"
				, protoProp = "prototype"
				, elemCtrProto = view.Element[protoProp]
				, objCtr = Object
				, strTrim = String[protoProp].trim || function () {
						return this.replace(/^\s+|\s+$/g, "");
					}
				, arrIndexOf = Array[protoProp].indexOf || function (item) {
						var
							i = 0
							, len = this.length
							;
						for (; i < len; i++) {
							if (i in this && this[i] === item) {
								return i;
							}
						}
						return -1;
					}
			// Vendors: please allow content code to instantiate DOMExceptions
				, DOMEx = function (type, message) {
					this.name = type;
					this.code = DOMException[type];
					this.message = message;
				}
				, checkTokenAndGetIndex = function (classList, token) {
					if (token === "") {
						throw new DOMEx(
							"SYNTAX_ERR"
							, "An invalid or illegal string was specified"
						);
					}
					if (/\s/.test(token)) {
						throw new DOMEx(
							"INVALID_CHARACTER_ERR"
							, "String contains an invalid character"
						);
					}
					return arrIndexOf.call(classList, token);
				}
				, ClassList = function (elem) {
					var
						trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
						, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
						, i = 0
						, len = classes.length
						;
					for (; i < len; i++) {
						this.push(classes[i]);
					}
					this._updateClassName = function () {
						elem.setAttribute("class", this.toString());
					};
				}
				, classListProto = ClassList[protoProp] = []
				, classListGetter = function () {
					return new ClassList(this);
				}
				;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
			DOMEx[protoProp] = Error[protoProp];
			classListProto.item = function (i) {
				return this[i] || null;
			};
			classListProto.contains = function (token) {
				token += "";
				return checkTokenAndGetIndex(this, token) !== -1;
			};
			classListProto.add = function () {
				var
					tokens = arguments
					, i = 0
					, l = tokens.length
					, token
					, updated = false
					;
				do {
					token = tokens[i] + "";
					if (checkTokenAndGetIndex(this, token) === -1) {
						this.push(token);
						updated = true;
					}
				}
				while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.remove = function () {
				var
					tokens = arguments
					, i = 0
					, l = tokens.length
					, token
					, updated = false
					, index
					;
				do {
					token = tokens[i] + "";
					index = checkTokenAndGetIndex(this, token);
					while (index !== -1) {
						this.splice(index, 1);
						updated = true;
						index = checkTokenAndGetIndex(this, token);
					}
				}
				while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.toggle = function (token, force) {
				token += "";

				var
					result = this.contains(token)
					, method = result ?
					force !== true && "remove"
						:
					force !== false && "add"
					;

				if (method) {
					this[method](token);
				}

				if (force === true || force === false) {
					return force;
				} else {
					return !result;
				}
			};
			classListProto.toString = function () {
				return this.join(" ");
			};

			if (objCtr.defineProperty) {
				var classListPropDesc = {
					get: classListGetter
					, enumerable: true
					, configurable: true
				};
				try {
					objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
				} catch (ex) { // IE 8 doesn't support enumerable:true
					if (ex.number === -0x7FF5EC54) {
						classListPropDesc.enumerable = false;
						objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
					}
				}
			} else if (objCtr[protoProp].__defineGetter__) {
				elemCtrProto.__defineGetter__(classListProp, classListGetter);
			}

		}(self));

	} else {
// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.

		(function () {
			"use strict";

			var testElement = document.createElement("_");

			testElement.classList.add("c1", "c2");

			// Polyfill for IE 10/11 and Firefox <26, where classList.add and
			// classList.remove exist but support only one argument at a time.
			if (!testElement.classList.contains("c2")) {
				var createMethod = function(method) {
					var original = DOMTokenList.prototype[method];

					DOMTokenList.prototype[method] = function(token) {
						var i, len = arguments.length;

						for (i = 0; i < len; i++) {
							token = arguments[i];
							original.call(this, token);
						}
					};
				};
				createMethod('add');
				createMethod('remove');
			}

			testElement.classList.toggle("c3", false);

			// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
			// support the second argument.
			if (testElement.classList.contains("c3")) {
				var _toggle = DOMTokenList.prototype.toggle;

				DOMTokenList.prototype.toggle = function(token, force) {
					if (1 in arguments && !this.contains(token) === !force) {
						return force;
					} else {
						return _toggle.call(this, token);
					}
				};

			}

			testElement = null;
		}());
	}
}
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq, line) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  var t = this;
  function find(rule) {
    if (cap = rule.exec(src)) {
      if (top && !bq) {
        if (t.options.lineNumbers)
          line && t.tokens.push({ type: 'line', line: line })
        line = (line || 0) + cap[0].split("\n").length - 1;
      }
      src = src.substring(cap[0].length);
    }
    return cap;
  }

  while (src) {
    // newline
    if (find(this.rules.newline)) {
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (find(this.rules.code)) {
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (find(this.rules.fences)) {
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (find(this.rules.heading)) {
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && find(this.rules.nptable)) {
      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (find(this.rules.lheading)) {
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (find(this.rules.hr)) {
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (find(this.rules.blockquote)) {
      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true, line);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (find(this.rules.list, false)) {
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq, line);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (find(this.rules.html)) {
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && find(this.rules.def)) {
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && find(this.rules.table)) {
      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && find(this.rules.paragraph)) {
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (find(this.rules.text)) {
      // Top-level should never reach here.
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0]
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.text(escape(this.smartypants(cap[0])));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.lineNumber = function(line) {
  return '<span line-number="' + line + '"></span>';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'line': {
      return this.renderer.lineNumber(this.token.line);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  sanitizer: null,
  mangle: true,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

var m = (function app(window, undefined) {
	"use strict";
  	var VERSION = "v0.2.1";
	function isFunction(object) {
		return typeof object === "function";
	}
	function isObject(object) {
		return type.call(object) === "[object Object]";
	}
	function isString(object) {
		return type.call(object) === "[object String]";
	}
	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]";
	};
	var type = {}.toString;
	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
	var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
	var noop = function () {};

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

	// self invoking function needed because of the way mocks work
	function initialize(window) {
		$document = window.document;
		$location = window.location;
		$cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
		$requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
	}

	initialize(window);

	m.version = function() {
		return VERSION;
	};

	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
	 *
	 */
	function m(tag, pairs) {
		for (var args = [], i = 1; i < arguments.length; i++) {
			args[i - 1] = arguments[i];
		}
		if (isObject(tag)) return parameterize(tag, args);
		var hasAttrs = pairs != null && isObject(pairs) && !("tag" in pairs || "view" in pairs || "subtree" in pairs);
		var attrs = hasAttrs ? pairs : {};
		var classAttrName = "class" in attrs ? "class" : "className";
		var cell = {tag: "div", attrs: {}};
		var match, classes = [];
		if (!isString(tag)) throw new Error("selector in m(selector, attrs, children) should be a string");
		while ((match = parser.exec(tag)) != null) {
			if (match[1] === "" && match[2]) cell.tag = match[2];
			else if (match[1] === "#") cell.attrs.id = match[2];
			else if (match[1] === ".") classes.push(match[2]);
			else if (match[3][0] === "[") {
				var pair = attrParser.exec(match[3]);
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true);
			}
		}

		var children = hasAttrs ? args.slice(1) : args;
		if (children.length === 1 && isArray(children[0])) {
			cell.children = children[0];
		}
		else {
			cell.children = children;
		}

		for (var attrName in attrs) {
			if (attrs.hasOwnProperty(attrName)) {
				if (attrName === classAttrName && attrs[attrName] != null && attrs[attrName] !== "") {
					classes.push(attrs[attrName]);
					cell.attrs[attrName] = ""; //create key in correct iteration order
				}
				else cell.attrs[attrName] = attrs[attrName];
			}
		}
		if (classes.length) cell.attrs[classAttrName] = classes.join(" ");

		return cell;
	}
	function forEach(list, f) {
		for (var i = 0; i < list.length && !f(list[i], i++);) {}
	}
	function forKeys(list, f) {
		forEach(list, function (attrs, i) {
			return (attrs = attrs && attrs.attrs) && attrs.key != null && f(attrs, i);
		});
	}
	// This function was causing deopts in Chrome.
	function dataToString(data) {
		//data.toString() might throw or return null if data is the return value of Console.log in Firefox (behavior depends on version)
		try {
			if (data == null || data.toString() == null) return "";
		} catch (e) {
			return "";
		}
		return data;
	}
	// This function was causing deopts in Chrome.
	function injectTextNode(parentElement, first, index, data) {
		try {
			insertNode(parentElement, first, index);
			first.nodeValue = data;
		} catch (e) {} //IE erroneously throws error when appending an empty text node after a null
	}

	function flatten(list) {
		//recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list);
				//check current index again and flatten until there are no more nested arrays at that index
				i--;
			}
		}
		return list;
	}

	function insertNode(parentElement, node, index) {
		parentElement.insertBefore(node, parentElement.childNodes[index] || null);
	}

	var DELETION = 1, INSERTION = 2, MOVE = 3;

	function handleKeysDiffer(data, existing, cached, parentElement) {
		forKeys(data, function (key, i) {
			existing[key = key.key] = existing[key] ? {
				action: MOVE,
				index: i,
				from: existing[key].index,
				element: cached.nodes[existing[key].index] || $document.createElement("div")
			} : {action: INSERTION, index: i};
		});
		var actions = [];
		for (var prop in existing) actions.push(existing[prop]);
		var changes = actions.sort(sortChanges), newCached = new Array(cached.length);
		newCached.nodes = cached.nodes.slice();

		forEach(changes, function (change) {
			var index = change.index;
			if (change.action === DELETION) {
				clear(cached[index].nodes, cached[index]);
				newCached.splice(index, 1);
			}
			if (change.action === INSERTION) {
				var dummy = $document.createElement("div");
				dummy.key = data[index].attrs.key;
				insertNode(parentElement, dummy, index);
				newCached.splice(index, 0, {
					attrs: {key: data[index].attrs.key},
					nodes: [dummy]
				});
				newCached.nodes[index] = dummy;
			}

			if (change.action === MOVE) {
				var changeElement = change.element;
				var maybeChanged = parentElement.childNodes[index];
				if (maybeChanged !== changeElement && changeElement !== null) {
					parentElement.insertBefore(changeElement, maybeChanged || null);
				}
				newCached[index] = cached[change.from];
				newCached.nodes[index] = changeElement;
			}
		});

		return newCached;
	}

	function diffKeys(data, cached, existing, parentElement) {
		var keysDiffer = data.length !== cached.length;
		if (!keysDiffer) {
			forKeys(data, function (attrs, i) {
				var cachedCell = cached[i];
				return keysDiffer = cachedCell && cachedCell.attrs && cachedCell.attrs.key !== attrs.key;
			});
		}

		return keysDiffer ? handleKeysDiffer(data, existing, cached, parentElement) : cached;
	}

	function diffArray(data, cached, nodes) {
		//diff the array itself

		//update the list of DOM nodes by collecting the nodes from each item
		forEach(data, function (_, i) {
			if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes);
		})
		//remove items from the end of the array if the new array is shorter than the old one. if errors ever happen here, the issue is most likely
		//a bug in the construction of the `cached` data structure somewhere earlier in the program
		forEach(cached.nodes, function (node, i) {
			if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]]);
		})
		if (data.length < cached.length) cached.length = data.length;
		cached.nodes = nodes;
	}

	function buildArrayKeys(data) {
		var guid = 0;
		forKeys(data, function () {
			forEach(data, function (attrs) {
				if ((attrs = attrs && attrs.attrs) && attrs.key == null) attrs.key = "__mithril__" + guid++;
			})
			return 1;
		});
	}

	function maybeRecreateObject(data, cached, dataAttrKeys) {
		//if an element is different enough from the one in cache, recreate it
		if (data.tag !== cached.tag ||
				dataAttrKeys.sort().join() !== Object.keys(cached.attrs).sort().join() ||
				data.attrs.id !== cached.attrs.id ||
				data.attrs.key !== cached.attrs.key ||
				(m.redraw.strategy() === "all" && (!cached.configContext || cached.configContext.retain !== true)) ||
				(m.redraw.strategy() === "diff" && cached.configContext && cached.configContext.retain === false)) {
			if (cached.nodes.length) clear(cached.nodes);
			if (cached.configContext && isFunction(cached.configContext.onunload)) cached.configContext.onunload();
			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (controller.unload) controller.onunload({preventDefault: noop});
				});
			}
		}
	}

	function getObjectNamespace(data, namespace) {
		return data.attrs.xmlns ? data.attrs.xmlns :
			data.tag === "svg" ? "http://www.w3.org/2000/svg" :
			data.tag === "math" ? "http://www.w3.org/1998/Math/MathML" :
			namespace;
	}

	function unloadCachedControllers(cached, views, controllers) {
		if (controllers.length) {
			cached.views = views;
			cached.controllers = controllers;
			forEach(controllers, function (controller) {
				if (controller.onunload && controller.onunload.$old) controller.onunload = controller.onunload.$old;
				if (pendingRequests && controller.onunload) {
					var onunload = controller.onunload;
					controller.onunload = noop;
					controller.onunload.$old = onunload;
				}
			});
		}
	}

	function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
		//schedule configs to be called. They are called after `build`
		//finishes running
		if (isFunction(data.attrs.config)) {
			var context = cached.configContext = cached.configContext || {};

			//bind
			configs.push(function() {
				return data.attrs.config.call(data, node, !isNew, context, cached);
			});
		}
	}

	function buildUpdatedNode(cached, data, editable, hasKeys, namespace, views, configs, controllers) {
		var node = cached.nodes[0];
		if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
		cached.children = build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
		cached.nodes.intact = true;

		if (controllers.length) {
			cached.views = views;
			cached.controllers = controllers;
		}

		return node;
	}

	function handleNonexistentNodes(data, parentElement, index) {
		var nodes;
		if (data.$trusted) {
			nodes = injectHTML(parentElement, index, data);
		}
		else {
			nodes = [$document.createTextNode(data)];
			if (!parentElement.nodeName.match(voidElements)) insertNode(parentElement, nodes[0], index);
		}

		var cached = typeof data === "string" || typeof data === "number" || typeof data === "boolean" ? new data.constructor(data) : data;
		cached.nodes = nodes;
		return cached;
	}

	function reattachNodes(data, cached, parentElement, editable, index, parentTag) {
		var nodes = cached.nodes;
		if (!editable || editable !== $document.activeElement) {
			if (data.$trusted) {
				clear(nodes, cached);
				nodes = injectHTML(parentElement, index, data);
			}
			//corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
			//we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
			else if (parentTag === "textarea") {
				parentElement.value = data;
			}
			else if (editable) {
				editable.innerHTML = data;
			}
			else {
				//was a trusted string
				if (nodes[0].nodeType === 1 || nodes.length > 1) {
					clear(cached.nodes, cached);
					nodes = [$document.createTextNode(data)];
				}
				injectTextNode(parentElement, nodes[0], index, data);
			}
		}
		cached = new data.constructor(data);
		cached.nodes = nodes;
		return cached;
	}

	function handleText(cached, data, index, parentElement, shouldReattach, editable, parentTag) {
		//handle text nodes
		return cached.nodes.length === 0 ? handleNonexistentNodes(data, parentElement, index) :
			cached.valueOf() !== data.valueOf() || shouldReattach === true ?
				reattachNodes(data, cached, parentElement, editable, index, parentTag) :
			(cached.nodes.intact = true, cached);
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			//fix offset of next element if item was a trusted string w/ more than one html element
			//the first clause in the regexp matches elements
			//the second clause (after the pipe) matches text nodes
			var match = item.match(/<[^\/]|\>\s*[^<]/g);
			if (match != null) return match.length;
		}
		else if (isArray(item)) {
			return item.length;
		}
		return 1;
	}

	function buildArray(data, cached, parentElement, index, parentTag, shouldReattach, editable, namespace, configs) {
		data = flatten(data);
		var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

		//keys algorithm: sort elements without recreating them if keys are present
		//1) create a map of all existing keys, and mark all for deletion
		//2) add new keys to map and mark them for addition
		//3) if key exists in new list, change action from deletion to a move
		//4) for each key, handle its corresponding action as marked in previous steps
		var existing = {}, shouldMaintainIdentities = false;
		forKeys(cached, function (attrs, i) {
			shouldMaintainIdentities = true;
			existing[cached[i].attrs.key] = {action: DELETION, index: i};
		});

		buildArrayKeys(data);
		if (shouldMaintainIdentities) cached = diffKeys(data, cached, existing, parentElement);
		//end key algorithm

		var cacheCount = 0;
		//faster explicitly written
		for (var i = 0, len = data.length; i < len; i++) {
			//diff each item in the array
			var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);

			if (item !== undefined) {
				intact = intact && item.nodes.intact;
				subArrayCount += getSubArrayCount(item);
				cached[cacheCount++] = item;
			}
		}

		if (!intact) diffArray(data, cached, nodes);
		return cached
	}

	function makeCache(data, cached, index, parentIndex, parentCache) {
		if (cached != null) {
			if (type.call(cached) === type.call(data)) return cached;

			if (parentCache && parentCache.nodes) {
				var offset = index - parentIndex, end = offset + (isArray(data) ? data : cached.nodes).length;
				clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end));
			} else if (cached.nodes) {
				clear(cached.nodes, cached);
			}
		}

		cached = new data.constructor();
		//if constructor creates a virtual dom element, use a blank object
		//as the base cached node instead of copying the virtual el (#277)
		if (cached.tag) cached = {};
		cached.nodes = [];
		return cached;
	}

	function constructNode(data, namespace) {
		return namespace === undefined ?
			data.attrs.is ? $document.createElement(data.tag, data.attrs.is) : $document.createElement(data.tag) :
			data.attrs.is ? $document.createElementNS(namespace, data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag);
	}

	function constructAttrs(data, node, namespace, hasKeys) {
		return hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs;
	}

	function constructChildren(data, node, cached, editable, namespace, configs) {
		return data.children != null && data.children.length > 0 ?
			build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
			data.children;
	}

	function reconstructCached(data, attrs, children, node, namespace, views, controllers) {
		var cached = {tag: data.tag, attrs: attrs, children: children, nodes: [node]};
		unloadCachedControllers(cached, views, controllers);
		if (cached.children && !cached.children.nodes) cached.children.nodes = [];
		//edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
		if (data.tag === "select" && "value" in data.attrs) setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
		return cached
	}

	function getController(views, view, cachedControllers, controller) {
		var controllerIndex = m.redraw.strategy() === "diff" && views ? views.indexOf(view) : -1;
		return controllerIndex > -1 ? cachedControllers[controllerIndex] :
			typeof controller === "function" ? new controller() : {};
	}

	function updateLists(views, controllers, view, controller) {
		if (controller.onunload != null) unloaders.push({controller: controller, handler: controller.onunload});
		views.push(view);
		controllers.push(controller);
	}

	function checkView(data, view, cached, cachedControllers, controllers, views) {
		var controller = getController(cached.views, view, cachedControllers, data.controller);
		//Faster to coerce to number and check for NaN
		var key = +(data && data.attrs && data.attrs.key);
		data = pendingRequests === 0 || forcing || cachedControllers && cachedControllers.indexOf(controller) > -1 ? data.view(controller) : {tag: "placeholder"};
		if (data.subtree === "retain") return cached;
		if (key === key) (data.attrs = data.attrs || {}).key = key;
		updateLists(views, controllers, view, controller);
		return data;
	}

	function markViews(data, cached, views, controllers) {
		var cachedControllers = cached && cached.controllers;
		while (data.view != null) data = checkView(data, data.view.$original || data.view, cached, cachedControllers, controllers, views);
		return data;
	}

	function buildObject(data, cached, editable, parentElement, index, shouldReattach, namespace, configs) {
		var views = [], controllers = [];
		data = markViews(data, cached, views, controllers);
		if (!data.tag && controllers.length) throw new Error("Component template must return a virtual element, not an array, string, etc.");
		data.attrs = data.attrs || {};
		cached.attrs = cached.attrs || {};
		var dataAttrKeys = Object.keys(data.attrs);
		var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0);
		maybeRecreateObject(data, cached, dataAttrKeys);
		if (!isString(data.tag)) return;
		var isNew = !cached.nodes || cached.nodes.length === 0;
		namespace = getObjectNamespace(data, namespace);
		var node;
		if (isNew) {
			node = constructNode(data, namespace);
			//set attributes first, then create children
			var attrs = constructAttrs(data, node, namespace, hasKeys)
			var children = constructChildren(data, node, cached, editable, namespace, configs);
			cached = reconstructCached(data, attrs, children, node, namespace, views, controllers);
		}
		else {
			node = buildUpdatedNode(cached, data, editable, hasKeys, namespace, views, configs, controllers);
		}
		if (isNew || shouldReattach === true && node != null) insertNode(parentElement, node, index);
		//schedule configs to be called. They are called after `build`
		//finishes running
		scheduleConfigsToBeCalled(configs, data, node, isNew, cached);
		return cached
	}

	function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
		//`build` is a recursive function that manages creation/diffing/removal
		//of DOM elements based on comparison between `data` and `cached`
		//the diff algorithm can be summarized as this:
		//1 - compare `data` and `cached`
		//2 - if they are different, copy `data` to `cached` and update the DOM
		//    based on what the difference is
		//3 - recursively apply this algorithm for every array and for the
		//    children of every virtual element

		//the `cached` data structure is essentially the same as the previous
		//redraw's `data` data structure, with a few additions:
		//- `cached` always has a property called `nodes`, which is a list of
		//   DOM elements that correspond to the data represented by the
		//   respective virtual element
		//- in order to support attaching `nodes` as a property of `cached`,
		//   `cached` is *always* a non-primitive object, i.e. if the data was
		//   a string, then cached is a String instance. If data was `null` or
		//   `undefined`, cached is `new String("")`
		//- `cached also has a `configContext` property, which is the state
		//   storage object exposed by config(element, isInitialized, context)
		//- when `cached` is an Object, it represents a virtual element; when
		//   it's an Array, it represents a list of elements; when it's a
		//   String, Number or Boolean, it represents a text node

		//`parentElement` is a DOM element used for W3C DOM API calls
		//`parentTag` is only used for handling a corner case for textarea
		//values
		//`parentCache` is used to remove nodes in some multi-node cases
		//`parentIndex` and `index` are used to figure out the offset of nodes.
		//They're artifacts from before arrays started being flattened and are
		//likely refactorable
		//`data` and `cached` are, respectively, the new and old nodes being
		//diffed
		//`shouldReattach` is a flag indicating whether a parent node was
		//recreated (if so, and if this node is reused, then this node must
		//reattach itself to the new parent)
		//`editable` is a flag that indicates whether an ancestor is
		//contenteditable
		//`namespace` indicates the closest HTML namespace as it cascades down
		//from an ancestor
		//`configs` is a list of config functions to run after the topmost
		//`build` call finishes running

		//there's logic that relies on the assumption that null and undefined
		//data are equivalent to empty strings
		//- this prevents lifecycle surprises from procedural helpers that mix
		//  implicit and explicit return statements (e.g.
		//  function foo() {if (cond) return m("div")}
		//- it simplifies diffing code
		data = dataToString(data);
		if (data.subtree === "retain") return cached;
		cached = makeCache(data, cached, index, parentIndex, parentCache);
		return isArray(data) ? buildArray(data, cached, parentElement, index, parentTag, shouldReattach, editable, namespace, configs) :
			data != null && isObject(data) ? buildObject(data, cached, editable, parentElement, index, shouldReattach, namespace, configs) :
			!isFunction(data) ? handleText(cached, data, index, parentElement, shouldReattach, editable, parentTag) :
			cached;
	}
	function sortChanges(a, b) { return a.action - b.action || a.index - b.index; }
	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			var dataAttr = dataAttrs[attrName];
			var cachedAttr = cachedAttrs[attrName];
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
				cachedAttrs[attrName] = dataAttr;
				try {
					//`config` isn't a real attributes, so ignore it
					if (attrName === "config" || attrName === "key") continue;
					//hook event handlers to the auto-redrawing system
					else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
						node[attrName] = autoredraw(dataAttr, node);
					}
					//handle `style: {...}`
					else if (attrName === "style" && dataAttr != null && isObject(dataAttr)) {
						for (var rule in dataAttr) {
							if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule];
						}
						for (var rule in cachedAttr) {
							if (!(rule in dataAttr)) node.style[rule] = "";
						}
					}
					//handle SVG
					else if (namespace != null) {
						if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
						else node.setAttribute(attrName === "className" ? "class" : attrName, dataAttr);
					}
					//handle cases that are properties (but ignore cases where we should use setAttribute instead)
					//- list and form are typically used as strings, but are DOM element references in js
					//- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
					else if (attrName in node && attrName !== "list" && attrName !== "style" && attrName !== "form" && attrName !== "type" && attrName !== "width" && attrName !== "height") {
						//#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
						if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr;
					}
					else node.setAttribute(attrName, dataAttr);
				}
				catch (e) {
					//swallow IE's invalid argument errors to mimic HTML's fallback-to-doing-nothing-on-invalid-attributes behavior
					if (e.message.indexOf("Invalid argument") < 0) throw e;
				}
			}
			//#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
			else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
				node.value = dataAttr;
			}
		}
		return cachedAttrs;
	}
	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try { nodes[i].parentNode.removeChild(nodes[i]); }
				catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
				cached = [].concat(cached);
				if (cached[i]) unload(cached[i]);
			}
		}
		//release memory if nodes is an array. This check should fail if nodes is a NodeList (see loop above)
		if (nodes.length) nodes.length = 0;
	}
	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload();
			cached.configContext.onunload = null;
		}
		if (cached.controllers) {
			forEach(cached.controllers, function (controller) {
				if (isFunction(controller.onunload)) controller.onunload({preventDefault: noop});
			});
		}
		if (cached.children) {
			if (isArray(cached.children)) forEach(cached.children, unload);
			else if (cached.children.tag) unload(cached.children);
		}
	}

	var insertAdjacentBeforeEnd = (function () {
		var rangeStrategy = function (parentElement, data) {
			parentElement.appendChild($document.createRange().createContextualFragment(data));
		};
		var insertAdjacentStrategy = function (parentElement, data) {
			parentElement.insertAdjacentHTML("beforeend", data);
		};

		try {
			$document.createRange().createContextualFragment('x');
			return rangeStrategy;
		} catch (e) {
			return insertAdjacentStrategy;
		}
	})();

	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index];
		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1;
			var placeholder = $document.createElement("span");
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null);
				placeholder.insertAdjacentHTML("beforebegin", data);
				parentElement.removeChild(placeholder);
			}
			else nextSibling.insertAdjacentHTML("beforebegin", data);
		}
		else insertAdjacentBeforeEnd(parentElement, data);

		var nodes = [];
		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index]);
			index++;
		}
		return nodes;
	}
	function autoredraw(callback, object) {
		return function(e) {
			e = e || event;
			m.redraw.strategy("diff");
			m.startComputation();
			try { return callback.call(object, e); }
			finally {
				endFirstComputation();
			}
		};
	}

	var html;
	var documentNode = {
		appendChild: function(node) {
			if (html === undefined) html = $document.createElement("html");
			if ($document.documentElement && $document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement);
			}
			else $document.appendChild(node);
			this.childNodes = $document.childNodes;
		},
		insertBefore: function(node) {
			this.appendChild(node);
		},
		childNodes: []
	};
	var nodeCache = [], cellCache = {};
	m.render = function(root, cell, forceRecreation) {
		var configs = [];
		if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
		var id = getCellCacheKey(root);
		var isDocumentRoot = root === $document;
		var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
		if (isDocumentRoot && cell.tag !== "html") cell = {tag: "html", attrs: {}, children: cell};
		if (cellCache[id] === undefined) clear(node.childNodes);
		if (forceRecreation === true) reset(root);
		cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
		forEach(configs, function (config) { config(); });
	};
	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element);
		return index < 0 ? nodeCache.push(element) - 1 : index;
	}

	m.trust = function(value) {
		value = new String(value);
		value.$trusted = true;
		return value;
	};

	function gettersetter(store) {
		var prop = function() {
			if (arguments.length) store = arguments[0];
			return store;
		};

		prop.toJSON = function() {
			return store;
		};

		return prop;
	}

	m.prop = function (store) {
		//note: using non-strict equality check here because we're checking if store is null OR undefined
		if ((store != null && isObject(store) || isFunction(store)) && isFunction(store.then)) {
			return propify(store);
		}

		return gettersetter(store);
	};

	var roots = [], components = [], controllers = [], lastRedrawId = null, lastRedrawCallTime = 0, computePreRedrawHook = null, computePostRedrawHook = null, topComponent, unloaders = [];
	var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
	function parameterize(component, args) {
		var controller = function() {
			return (component.controller || noop).apply(this, args) || this;
		};
		if (component.controller) controller.prototype = component.controller.prototype;
		var view = function(ctrl) {
			var currentArgs = arguments.length > 1 ? args.concat([].slice.call(arguments, 1)) : args;
			return component.view.apply(component, currentArgs ? [ctrl].concat(currentArgs) : [ctrl]);
		};
		view.$original = component.view;
		var output = {controller: controller, view: view};
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key};
		return output;
	}
	m.component = function(component) {
		for (var args = [], i = 1; i < arguments.length; i++) args.push(arguments[i]);
		return parameterize(component, args);
	};
	m.mount = m.module = function(root, component) {
		if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
		var index = roots.indexOf(root);
		if (index < 0) index = roots.length;

		var isPrevented = false;
		var event = {preventDefault: function() {
			isPrevented = true;
			computePreRedrawHook = computePostRedrawHook = null;
		}};

		forEach(unloaders, function (unloader) {
			unloader.handler.call(unloader.controller, event);
			unloader.controller.onunload = null;
		});

		if (isPrevented) {
			forEach(unloaders, function (unloader) {
				unloader.controller.onunload = unloader.handler;
			});
		}
		else unloaders = [];

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(event);
		}

		var isNullComponent = component === null;

		if (!isPrevented) {
			m.redraw.strategy("all");
			m.startComputation();
			roots[index] = root;
			var currentComponent = component ? (topComponent = component) : (topComponent = component = {controller: noop});
			var controller = new (component.controller || noop)();
			//controllers may call m.mount recursively (via m.route redirects, for example)
			//this conditional ensures only the last recursive m.mount call is applied
			if (currentComponent === topComponent) {
				controllers[index] = controller;
				components[index] = component;
			}
			endFirstComputation();
			if (isNullComponent) {
				removeRootElement(root, index);
			}
			return controllers[index];
		}
		if (isNullComponent) {
			removeRootElement(root, index);
		}
	};

	function removeRootElement(root, index) {
		roots.splice(index, 1);
		controllers.splice(index, 1);
		components.splice(index, 1);
		reset(root);
		nodeCache.splice(getCellCacheKey(root), 1);
	}

	var redrawing = false, forcing = false;
	m.redraw = function(force) {
		if (redrawing) return;
		redrawing = true;
		if (force) forcing = true;
		try {
			//lastRedrawId is a positive number if a second redraw is requested before the next animation frame
			//lastRedrawID is null if it's the first redraw and not an event handler
			if (lastRedrawId && !force) {
				//when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
				//when rAF: always reschedule redraw
				if ($requestAnimationFrame === window.requestAnimationFrame || new Date - lastRedrawCallTime > FRAME_BUDGET) {
					if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
					lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET);
				}
			}
			else {
				redraw();
				lastRedrawId = $requestAnimationFrame(function() { lastRedrawId = null; }, FRAME_BUDGET);
			}
		}
		finally {
			redrawing = forcing = false;
		}
	};
	m.redraw.strategy = m.prop();
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook();
			computePreRedrawHook = null;
		}
		forEach(roots, function (root, i) {
			var component = components[i];
			if (controllers[i]) {
				var args = [controllers[i]];
				m.render(root, component.view ? component.view(controllers[i], args) : "");
			}
		});
		//after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook();
			computePostRedrawHook = null;
		}
		lastRedrawId = null;
		lastRedrawCallTime = new Date;
		m.redraw.strategy("diff");
	}

	var pendingRequests = 0;
	m.startComputation = function() { pendingRequests++; };
	m.endComputation = function() {
		if (pendingRequests > 1) pendingRequests--;
		else {
			pendingRequests = 0;
			m.redraw();
		}
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--;
			m.redraw.strategy("diff");
		}
		else m.endComputation();
	}

	m.withAttr = function(prop, withAttrCallback, callbackThis) {
		return function(e) {
			e = e || event;
			var currentTarget = e.currentTarget || this;
			var _this = callbackThis || this;
			withAttrCallback.call(_this, prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop));
		};
	};

	//routing
	var modes = {pathname: "", hash: "#", search: "?"};
	var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;
	m.route = function(root, arg1, arg2, vdom) {
		//m.route()
		if (arguments.length === 0) return currentRoute;
		//m.route(el, defaultRoute, routes)
		else if (arguments.length === 3 && isString(arg1)) {
			redirect = function(source) {
				var path = currentRoute = normalizeRoute(source);
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) throw new Error("Ensure the default route matches one of the routes defined in m.route");
					isDefaultRoute = true;
					m.route(arg1, true);
					isDefaultRoute = false;
				}
			};
			var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
			window[listener] = function() {
				var path = $location[m.route.mode];
				if (m.route.mode === "pathname") path += $location.search;
				if (currentRoute !== normalizeRoute(path)) redirect(path);
			};

			computePreRedrawHook = setScroll;
			window[listener]();
		}
		//config: m.route
		else if (root.addEventListener || root.attachEvent) {
			root.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + vdom.attrs.href;
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive);
				root.addEventListener("click", routeUnobtrusive);
			}
			else {
				root.detachEvent("onclick", routeUnobtrusive);
				root.attachEvent("onclick", routeUnobtrusive);
			}
		}
		//m.route(route, params, shouldReplaceHistoryEntry)
		else if (isString(root)) {
			var oldRoute = currentRoute;
			currentRoute = root;
			var args = arg1 || {};
			var queryIndex = currentRoute.indexOf("?");
			var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {};
			for (var i in args) params[i] = args[i];
			var querystring = buildQueryString(params);
			var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute;
			if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

			var shouldReplaceHistoryEntry = (arguments.length === 3 ? arg2 : arg1) === true || oldRoute === root;

			if (window.history.pushState) {
				computePreRedrawHook = setScroll;
				computePostRedrawHook = function() {
					window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
				};
				redirect(modes[m.route.mode] + currentRoute);
			}
			else {
				$location[m.route.mode] = currentRoute;
				redirect(modes[m.route.mode] + currentRoute);
			}
		}
	};
	m.route.param = function(key) {
		if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()");
		if( !key ){
			return routeParams;
		}
		return routeParams[key];
	};
	m.route.mode = "search";
	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length);
	}
	function routeByValue(root, router, path) {
		routeParams = {};

		var queryStart = path.indexOf("?");
		if (queryStart !== -1) {
			routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
			path = path.substr(0, queryStart);
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router);
		var index = keys.indexOf(path);
		if(index !== -1){
			m.mount(root, router[keys [index]]);
			return true;
		}

		for (var route in router) {
			if (route === path) {
				m.mount(root, router[route]);
				return true;
			}

			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

			if (matcher.test(path)) {
				path.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || [];
					var values = [].slice.call(arguments, 1, -2);
					forEach(keys, function (key, i) {
						routeParams[key.replace(/:|\./g, "")] = decodeURIComponent(values[i]);
					})
					m.mount(root, router[route]);
				});
				return true;
			}
		}
	}
	function routeUnobtrusive(e) {
		e = e || event;

		if (e.ctrlKey || e.metaKey || e.which === 2) return;

		if (e.preventDefault) e.preventDefault();
		else e.returnValue = false;

		var currentTarget = e.currentTarget || e.srcElement;
		var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
		while (currentTarget && currentTarget.nodeName.toUpperCase() !== "A") currentTarget = currentTarget.parentNode;
		m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args);
	}
	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) $location.hash = $location.hash;
		else window.scrollTo(0, 0);
	}
	function buildQueryString(object, prefix) {
		var duplicates = {};
		var str = [];
		for (var prop in object) {
			var key = prefix ? prefix + "[" + prop + "]" : prop;
			var value = object[prop];

			if (value === null) {
				str.push(encodeURIComponent(key));
			} else if (isObject(value)) {
				str.push(buildQueryString(value, key));
			} else if (isArray(value)) {
				var keys = [];
				duplicates[key] = duplicates[key] || {};
				forEach(value, function (item) {
					if (!duplicates[key][item]) {
						duplicates[key][item] = true;
						keys.push(encodeURIComponent(key) + "=" + encodeURIComponent(item));
					}
				});
				str.push(keys.join("&"));
			} else if (value !== undefined) {
				str.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
			}
		}
		return str.join("&");
	}
	function parseQueryString(str) {
		if (str === "" || str == null) return {};
		if (str.charAt(0) === "?") str = str.slice(1);

		var pairs = str.split("&"), params = {};
		forEach(pairs, function (string) {
			var pair = string.split("=");
			var key = decodeURIComponent(pair[0]);
			var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null;
			if (params[key] != null) {
				if (!isArray(params[key])) params[key] = [params[key]];
				params[key].push(value);
			}
			else params[key] = value;
		});

		return params;
	}
	m.route.buildQueryString = buildQueryString;
	m.route.parseQueryString = parseQueryString;

	function reset(root) {
		var cacheKey = getCellCacheKey(root);
		clear(root.childNodes, cellCache[cacheKey]);
		cellCache[cacheKey] = undefined;
	}

	m.deferred = function () {
		var deferred = new Deferred();
		deferred.promise = propify(deferred.promise);
		return deferred;
	};
	function propify(promise, initialValue) {
		var prop = m.prop(initialValue);
		promise.then(prop);
		prop.then = function(resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue);
		};
		prop["catch"] = prop.then.bind(null, null);
		prop["finally"] = function(callback) {
			var _callback = function() {return m.deferred().resolve(callback()).promise;};
			return prop.then(function(value) {
				return propify(_callback().then(function() {return value;}), initialValue);
			}, function(reason) {
				return propify(_callback().then(function() {throw new Error(reason);}), initialValue);
			});
		};
		return prop;
	}
	//Promiz.mithril.js | Zolmeister | MIT
	//a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
	//1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
	//2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
	function Deferred(successCallback, failureCallback) {
		var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
		var self = this, state = 0, promiseValue = 0, next = [];

		self.promise = {};

		self.resolve = function(value) {
			if (!state) {
				promiseValue = value;
				state = RESOLVING;

				fire();
			}
			return this;
		};

		self.reject = function(value) {
			if (!state) {
				promiseValue = value;
				state = REJECTING;

				fire();
			}
			return this;
		};

		self.promise.then = function(successCallback, failureCallback) {
			var deferred = new Deferred(successCallback, failureCallback)
			if (state === RESOLVED) {
				deferred.resolve(promiseValue);
			}
			else if (state === REJECTED) {
				deferred.reject(promiseValue);
			}
			else {
				next.push(deferred);
			}
			return deferred.promise
		};

		function finish(type) {
			state = type || REJECTED;
			next.map(function(deferred) {
				state === RESOLVED ? deferred.resolve(promiseValue) : deferred.reject(promiseValue);
			});
		}

		function thennable(then, successCallback, failureCallback, notThennableCallback) {
			if (((promiseValue != null && isObject(promiseValue)) || isFunction(promiseValue)) && isFunction(then)) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0;
					then.call(promiseValue, function(value) {
						if (count++) return;
						promiseValue = value;
						successCallback();
					}, function (value) {
						if (count++) return;
						promiseValue = value;
						failureCallback();
					});
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					failureCallback();
				}
			} else {
				notThennableCallback();
			}
		}

		function fire() {
			// check if it's a thenable
			var then;
			try {
				then = promiseValue && promiseValue.then;
			}
			catch (e) {
				m.deferred.onerror(e);
				promiseValue = e;
				state = REJECTING;
				return fire();
			}

			thennable(then, function() {
				state = RESOLVING;
				fire();
			}, function() {
				state = REJECTING;
				fire();
			}, function() {
				try {
					if (state === RESOLVING && isFunction(successCallback)) {
						promiseValue = successCallback(promiseValue);
					}
					else if (state === REJECTING && isFunction(failureCallback)) {
						promiseValue = failureCallback(promiseValue);
						state = RESOLVING;
					}
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					return finish();
				}

				if (promiseValue === self) {
					promiseValue = TypeError();
					finish();
				} else {
					thennable(then, function () {
						finish(RESOLVED);
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED);
					});
				}
			});
		}
	}
	m.deferred.onerror = function(e) {
		if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) {
			pendingRequests = 0;
			throw e;
		}
	};

	m.sync = function(args) {
		var method = "resolve";

		function synchronizer(pos, resolved) {
			return function(value) {
				results[pos] = value;
				if (!resolved) method = "reject";
				if (--outstanding === 0) {
					deferred.promise(results);
					deferred[method](results);
				}
				return value;
			};
		}

		var deferred = m.deferred();
		var outstanding = args.length;
		var results = new Array(outstanding);
		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false));
			});
		}
		else deferred.resolve([]);

		return deferred.promise;
	};
	function identity(value) { return value; }

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36)
			var script = $document.createElement("script");

			window[callbackKey] = function(resp) {
				script.parentNode.removeChild(script);
				options.onload({
					type: "load",
					target: {
						responseText: resp
					}
				});
				window[callbackKey] = undefined;
			};

			script.onerror = function() {
				script.parentNode.removeChild(script);

				options.onerror({
					type: "error",
					target: {
						status: 500,
						responseText: JSON.stringify({
							error: "Error making jsonp request"
						})
					}
				});
				window[callbackKey] = undefined;

				return false;
			}

			script.onload = function() {
				return false;
			};

			script.src = options.url
				+ (options.url.indexOf("?") > 0 ? "&" : "?")
				+ (options.callbackKey ? options.callbackKey : "callback")
				+ "=" + callbackKey
				+ "&" + buildQueryString(options.data || {});
			$document.body.appendChild(script);
		}
		else {
			var xhr = new window.XMLHttpRequest();
			xhr.open(options.method, options.url, true, options.user, options.password);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
					else options.onerror({type: "error", target: xhr});
				}
			};
			if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			}
			if (options.deserialize === JSON.parse) {
				xhr.setRequestHeader("Accept", "application/json, text/*");
			}
			if (isFunction(options.config)) {
				var maybeXhr = options.config(xhr, options);
				if (maybeXhr != null) xhr = maybeXhr;
			}

			var data = options.method === "GET" || !options.data ? "" : options.data;
			if (data && (!isString(data) && data.constructor !== window.FormData)) {
				throw new Error("Request data should be either be a string or FormData. Check the `serialize` option in `m.request`");
			}
			xhr.send(data);
			return xhr;
		}
	}

	function bindData(xhrOptions, data, serialize) {
		if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
			var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
			var querystring = buildQueryString(data);
			xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "");
		}
		else xhrOptions.data = serialize(data);
		return xhrOptions;
	}

	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi);
		if (tokens && data) {
			forEach(tokens, function (token) {
				var key = token.slice(1);
				url = url.replace(token, data[key]);
				delete data[key];
			});
		}
		return url;
	}

	m.request = function(xhrOptions) {
		if (xhrOptions.background !== true) m.startComputation();
		var deferred = new Deferred();
		var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp"
		var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
		var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
		var extract = isJSONP ? function(jsonp) { return jsonp.responseText } : xhrOptions.extract || function(xhr) {
			if (xhr.responseText.length === 0 && deserialize === JSON.parse) {
				return null
			} else {
				return xhr.responseText
			}
		};
		xhrOptions.method = (xhrOptions.method || "GET").toUpperCase();
		xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
		xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
		xhrOptions.onload = xhrOptions.onerror = function(e) {
			try {
				e = e || event;
				var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
				var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
				if (e.type === "load") {
					if (isArray(response) && xhrOptions.type) {
						forEach(response, function (res, i) {
							response[i] = new xhrOptions.type(res);
						});
					} else if (xhrOptions.type) {
						response = new xhrOptions.type(response);
					}
				}

				deferred[e.type === "load" ? "resolve" : "reject"](response);
			} catch (e) {
				m.deferred.onerror(e);
				deferred.reject(e);
			}

			if (xhrOptions.background !== true) m.endComputation()
		}

		ajax(xhrOptions);
		deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
		return deferred.promise;
	};

	//testing API
	m.deps = function(mock) {
		initialize(window = mock || window);
		return window;
	};
	//for internal testing only, do not use `m.deps.factory`
	m.deps.factory = app;

	return m;
})(typeof window !== "undefined" ? window : {});

if (typeof module === "object" && module != null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() { return m });
/*!
 * Pikaday
 *
 * Copyright © 2014 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory)
{
	'use strict';

	var moment;
	if (typeof exports === 'object') {
		// CommonJS module
		// Load moment.js as an optional dependency
		try { moment = require('moment'); } catch (e) {}
		module.exports = factory(moment);
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(function (req)
		{
			// Load moment.js as an optional dependency
			var id = 'moment';
			try { moment = req(id); } catch (e) {}
			return factory(moment);
		});
	} else {
		root.Pikaday = factory(root.moment);
	}
}(this, function (moment)
{
	'use strict';

	/**
	 * feature detection and helper functions
	 */
	var hasMoment = typeof moment === 'function',

		hasEventListeners = !!window.addEventListener,

		document = window.document,

		sto = window.setTimeout,

		addEvent = function(el, e, callback, capture)
		{
			if (hasEventListeners) {
				el.addEventListener(e, callback, !!capture);
			} else {
				el.attachEvent('on' + e, callback);
			}
		},

		removeEvent = function(el, e, callback, capture)
		{
			if (hasEventListeners) {
				el.removeEventListener(e, callback, !!capture);
			} else {
				el.detachEvent('on' + e, callback);
			}
		},

		fireEvent = function(el, eventName, data)
		{
			var ev;

			if (document.createEvent) {
				ev = document.createEvent('HTMLEvents');
				ev.initEvent(eventName, true, false);
				ev = extend(ev, data);
				el.dispatchEvent(ev);
			} else if (document.createEventObject) {
				ev = document.createEventObject();
				ev = extend(ev, data);
				el.fireEvent('on' + eventName, ev);
			}
		},

		trim = function(str)
		{
			return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
		},

		hasClass = function(el, cn)
		{
			return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
		},

		addClass = function(el, cn)
		{
			if (!hasClass(el, cn)) {
				el.className = (el.className === '') ? cn : el.className + ' ' + cn;
			}
		},

		removeClass = function(el, cn)
		{
			el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
		},

		isArray = function(obj)
		{
			return (/Array/).test(Object.prototype.toString.call(obj));
		},

		isDate = function(obj)
		{
			return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
		},

		isWeekend = function(date)
		{
			var day = date.getDay();
			return day === 0 || day === 6;
		},

		isLeapYear = function(year)
		{
			// solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
			return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
		},

		getDaysInMonth = function(year, month)
		{
			return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},

		setToStartOfDay = function(date)
		{
			if (isDate(date)) date.setHours(0,0,0,0);
		},

		compareDates = function(a,b)
		{
			// weak date comparison (use setToStartOfDay(date) to ensure correct result)
			return a.getTime() === b.getTime();
		},

		extend = function(to, from, overwrite)
		{
			var prop, hasProp;
			for (prop in from) {
				hasProp = to[prop] !== undefined;
				if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
					if (isDate(from[prop])) {
						if (overwrite) {
							to[prop] = new Date(from[prop].getTime());
						}
					}
					else if (isArray(from[prop])) {
						if (overwrite) {
							to[prop] = from[prop].slice(0);
						}
					} else {
						to[prop] = extend({}, from[prop], overwrite);
					}
				} else if (overwrite || !hasProp) {
					to[prop] = from[prop];
				}
			}
			return to;
		},

		adjustCalendar = function(calendar) {
			if (calendar.month < 0) {
				calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
				calendar.month += 12;
			}
			if (calendar.month > 11) {
				calendar.year += Math.floor(Math.abs(calendar.month)/12);
				calendar.month -= 12;
			}
			return calendar;
		},

		/**
		 * defaults and localisation
		 */
		defaults = {

			// bind the picker to a form field
			field: null,

			// automatically show/hide the picker on `field` focus (default `true` if `field` is set)
			bound: undefined,

			// position of the datepicker, relative to the field (default to bottom & left)
			// ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
			position: 'bottom left',

			// automatically fit in the viewport even if it means repositioning from the position option
			reposition: true,

			// the default output format for `.toString()` and `field` value
			format: 'YYYY-MM-DD',

			// the initial date to view when first opened
			defaultDate: null,

			// make the `defaultDate` the initial selected value
			setDefaultDate: false,

			// first day of week (0: Sunday, 1: Monday etc)
			firstDay: 0,

			// the default flag for moment's strict date parsing
			formatStrict: false,

			// the minimum/earliest date that can be selected
			minDate: null,
			// the maximum/latest date that can be selected
			maxDate: null,

			// number of years either side, or array of upper/lower range
			yearRange: 10,

			// show week numbers at head of row
			showWeekNumber: false,

			// used internally (don't config outside)
			minYear: 0,
			maxYear: 9999,
			minMonth: undefined,
			maxMonth: undefined,

			startRange: null,
			endRange: null,

			isRTL: false,

			// Additional text to append to the year in the calendar title
			yearSuffix: '',

			// Render the month after year in the calendar title
			showMonthAfterYear: false,

			// Render days of the calendar grid that fall in the next or previous month
			showDaysInNextAndPreviousMonths: false,

			// how many months are visible
			numberOfMonths: 1,

			// when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
			// only used for the first display or when a selected date is not visible
			mainCalendar: 'left',

			// Specify a DOM element to render the calendar in
			container: undefined,

			// internationalization
			i18n: {
				previousMonth : '',
				nextMonth     : '',
				months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
				weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
				weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
			},

			// Theme Classname
			theme: null,

			// callback function
			onSelect: null,
			onOpen: null,
			onClose: null,
			onDraw: null
		},


		/**
		 * templating functions to abstract HTML rendering
		 */
		renderDayName = function(opts, day, abbr)
		{
			day += opts.firstDay;
			while (day >= 7) {
				day -= 7;
			}
			return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
		},

		renderDay = function(opts)
		{
			var arr = [];
			if (opts.isEmpty) {
				if (opts.showDaysInNextAndPreviousMonths) {
					arr.push('is-outside-current-month');
				} else {
					return '<td class="is-empty"></td>';
				}
			}
			if (opts.isDisabled) {
				arr.push('is-disabled');
			}
			if (opts.isToday) {
				arr.push('is-today');
			}
			if (opts.isSelected) {
				arr.push('is-selected');
			}
			if (opts.isInRange) {
				arr.push('is-inrange');
			}
			if (opts.isStartRange) {
				arr.push('is-startrange');
			}
			if (opts.isEndRange) {
				arr.push('is-endrange');
			}
			return '<td data-day="' + opts.day + '" class="' + arr.join(' ') + '">' +
				'<button class="pika-button pika-day" type="button" ' +
				'data-pika-year="' + opts.year + '" data-pika-month="' + opts.month + '" data-pika-day="' + opts.day + '">' +
				opts.day +
				'</button>' +
				'</td>';
		},

		renderWeek = function (d, m, y) {
			// Lifted from http://javascript.about.com/library/blweekyear.htm, lightly modified.
			var onejan = new Date(y, 0, 1),
				weekNum = Math.ceil((((new Date(y, m, d) - onejan) / 86400000) + onejan.getDay()+1)/7);
			return '<td class="pika-week">' + weekNum + '</td>';
		},

		renderRow = function(days, isRTL)
		{
			return '<tr>' + (isRTL ? days.reverse() : days).join('') + '</tr>';
		},

		renderBody = function(rows)
		{
			return '<tbody>' + rows.join('') + '</tbody>';
		},

		renderHead = function(opts)
		{
			var i, arr = [];
			if (opts.showWeekNumber) {
				arr.push('<th></th>');
			}
			for (i = 0; i < 7; i++) {
				arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
			}
			return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
		},

		renderTitle = function(instance, c, year, month, refYear)
		{
			var i, j, arr,
				opts = instance._o,
				isMinYear = year === opts.minYear,
				isMaxYear = year === opts.maxYear,
				html = '<div class="pika-title">',
				monthHtml,
				yearHtml,
				prev = true,
				next = true;

			for (arr = [], i = 0; i < 12; i++) {
				arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
					(i === month ? ' selected="selected"': '') +
					((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled="disabled"' : '') + '>' +
					opts.i18n.months[i] + '</option>');
			}
			monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month" tabindex="-1">' + arr.join('') + '</select></div>';

			if (isArray(opts.yearRange)) {
				i = opts.yearRange[0];
				j = opts.yearRange[1] + 1;
			} else {
				i = year - opts.yearRange;
				j = 1 + year + opts.yearRange;
			}

			for (arr = []; i < j && i <= opts.maxYear; i++) {
				if (i >= opts.minYear) {
					arr.push('<option value="' + i + '"' + (i === year ? ' selected="selected"': '') + '>' + (i) + '</option>');
				}
			}
			yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year" tabindex="-1">' + arr.join('') + '</select></div>';

			if (opts.showMonthAfterYear) {
				html += yearHtml + monthHtml;
			} else {
				html += monthHtml + yearHtml;
			}

			if (isMinYear && (month === 0 || opts.minMonth >= month)) {
				prev = false;
			}

			if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
				next = false;
			}

			if (c === 0) {
				html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
			}
			if (c === (instance._o.numberOfMonths - 1) ) {
				html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
			}

			return html += '</div>';
		},

		renderTable = function(opts, data)
		{
			return '<table cellpadding="0" cellspacing="0" class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
		},


		/**
		 * Pikaday constructor
		 */
		Pikaday = function(options)
		{
			var self = this,
				opts = self.config(options);

			self._onMouseDown = function(e)
			{
				if (!self._v) {
					return;
				}
				e = e || window.event;
				var target = e.target || e.srcElement;
				if (!target) {
					return;
				}

				if (!hasClass(target, 'is-disabled')) {
					if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty') && !hasClass(target.parentNode, 'is-disabled')) {
						self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
						if (opts.bound) {
							sto(function() {
								self.hide();
								if (opts.field) {
									opts.field.blur();
								}
							}, 100);
						}
					}
					else if (hasClass(target, 'pika-prev')) {
						self.prevMonth();
					}
					else if (hasClass(target, 'pika-next')) {
						self.nextMonth();
					}
				}
				if (!hasClass(target, 'pika-select')) {
					// if this is touch event prevent mouse events emulation
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
						return false;
					}
				} else {
					self._c = true;
				}
			};

			self._onChange = function(e)
			{
				e = e || window.event;
				var target = e.target || e.srcElement;
				if (!target) {
					return;
				}
				if (hasClass(target, 'pika-select-month')) {
					self.gotoMonth(target.value);
				}
				else if (hasClass(target, 'pika-select-year')) {
					self.gotoYear(target.value);
				}
			};

			self._onInputChange = function(e)
			{
				var date;

				if (e.firedBy === self) {
					return;
				}
				if (hasMoment) {
					date = moment(opts.field.value, opts.format, opts.formatStrict);
					date = (date && date.isValid()) ? date.toDate() : null;
				}
				else {
					date = new Date(Date.parse(opts.field.value));
				}
				if (isDate(date)) {
					self.setDate(date);
				}
				if (!self._v) {
					self.show();
				}
			};

			self._onInputFocus = function()
			{
				self.show();
			};

			self._onInputClick = function()
			{
				self.show();
			};

			self._onInputBlur = function()
			{
				// IE allows pika div to gain focus; catch blur the input field
				var pEl = document.activeElement;
				do {
					if (hasClass(pEl, 'pika-single')) {
						return;
					}
				}
				while ((pEl = pEl.parentNode));

				if (!self._c) {
					self._b = sto(function() {
						self.hide();
					}, 50);
				}
				self._c = false;
			};

			self._onClick = function(e)
			{
				e = e || window.event;
				var target = e.target || e.srcElement,
					pEl = target;
				if (!target) {
					return;
				}
				if (!hasEventListeners && hasClass(target, 'pika-select')) {
					if (!target.onchange) {
						target.setAttribute('onchange', 'return;');
						addEvent(target, 'change', self._onChange);
					}
				}
				do {
					if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
						return;
					}
				}
				while ((pEl = pEl.parentNode));
				if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
					self.hide();
				}
			};

			self.el = document.createElement('div');
			self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '') + (opts.theme ? ' ' + opts.theme : '');

			addEvent(self.el, 'mousedown', self._onMouseDown, true);
			addEvent(self.el, 'touchend', self._onMouseDown, true);
			addEvent(self.el, 'change', self._onChange);

			if (opts.field) {
				if (opts.container) {
					opts.container.appendChild(self.el);
				} else if (opts.bound) {
					document.body.appendChild(self.el);
				} else {
					opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
				}
				addEvent(opts.field, 'change', self._onInputChange);

				if (!opts.defaultDate) {
					if (hasMoment && opts.field.value) {
						opts.defaultDate = moment(opts.field.value, opts.format).toDate();
					} else {
						opts.defaultDate = new Date(Date.parse(opts.field.value));
					}
					opts.setDefaultDate = true;
				}
			}

			var defDate = opts.defaultDate;

			if (isDate(defDate)) {
				if (opts.setDefaultDate) {
					self.setDate(defDate, true);
				} else {
					self.gotoDate(defDate);
				}
			} else {
				self.gotoDate(new Date());
			}

			if (opts.bound) {
				this.hide();
				self.el.className += ' is-bound';
				addEvent(opts.trigger, 'click', self._onInputClick);
				addEvent(opts.trigger, 'focus', self._onInputFocus);
				addEvent(opts.trigger, 'blur', self._onInputBlur);
			} else {
				this.show();
			}
		};


	/**
	 * public Pikaday API
	 */
	Pikaday.prototype = {


		/**
		 * configure functionality
		 */
		config: function(options)
		{
			if (!this._o) {
				this._o = extend({}, defaults, true);
			}

			var opts = extend(this._o, options, true);

			opts.isRTL = !!opts.isRTL;

			opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

			opts.theme = (typeof opts.theme) === 'string' && opts.theme ? opts.theme : null;

			opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);

			opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

			opts.disableWeekends = !!opts.disableWeekends;

			opts.disableDayFn = (typeof opts.disableDayFn) === 'function' ? opts.disableDayFn : null;

			var nom = parseInt(opts.numberOfMonths, 10) || 1;
			opts.numberOfMonths = nom > 4 ? 4 : nom;

			if (!isDate(opts.minDate)) {
				opts.minDate = false;
			}
			if (!isDate(opts.maxDate)) {
				opts.maxDate = false;
			}
			if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
				opts.maxDate = opts.minDate = false;
			}
			if (opts.minDate) {
				this.setMinDate(opts.minDate);
			}
			if (opts.maxDate) {
				this.setMaxDate(opts.maxDate);
			}

			if (isArray(opts.yearRange)) {
				var fallback = new Date().getFullYear() - 10;
				opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
				opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
			} else {
				opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
				if (opts.yearRange > 100) {
					opts.yearRange = 100;
				}
			}

			return opts;
		},

		/**
		 * return a formatted string of the current selection (using Moment.js if available)
		 */
		toString: function(format)
		{
			return !isDate(this._d) ? '' : hasMoment ? moment(this._d).format(format || this._o.format) : this._d.toDateString();
		},

		/**
		 * return a Moment.js object of the current selection (if available)
		 */
		getMoment: function()
		{
			return hasMoment ? moment(this._d) : null;
		},

		/**
		 * set the current selection from a Moment.js object (if available)
		 */
		setMoment: function(date, preventOnSelect)
		{
			if (hasMoment && moment.isMoment(date)) {
				this.setDate(date.toDate(), preventOnSelect);
			}
		},

		/**
		 * return a Date object of the current selection
		 */
		getDate: function()
		{
			return isDate(this._d) ? new Date(this._d.getTime()) : null;
		},

		/**
		 * set the current selection
		 */
		setDate: function(date, preventOnSelect)
		{
			if (!date) {
				this._d = null;

				if (this._o.field) {
					this._o.field.value = '';
					fireEvent(this._o.field, 'change', { firedBy: this });
				}

				return this.draw();
			}
			if (typeof date === 'string') {
				date = new Date(Date.parse(date));
			}
			if (!isDate(date)) {
				return;
			}

			var min = this._o.minDate,
				max = this._o.maxDate;

			if (isDate(min) && date < min) {
				date = min;
			} else if (isDate(max) && date > max) {
				date = max;
			}

			this._d = new Date(date.getTime());
			setToStartOfDay(this._d);
			this.gotoDate(this._d);

			if (this._o.field) {
				this._o.field.value = this.toString();
				fireEvent(this._o.field, 'change', { firedBy: this });
			}
			if (!preventOnSelect && typeof this._o.onSelect === 'function') {
				this._o.onSelect.call(this, this.getDate());
			}
		},

		/**
		 * change view to a specific date
		 */
		gotoDate: function(date)
		{
			var newCalendar = true;

			if (!isDate(date)) {
				return;
			}

			if (this.calendars) {
				var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
					lastVisibleDate = new Date(this.calendars[this.calendars.length-1].year, this.calendars[this.calendars.length-1].month, 1),
					visibleDate = date.getTime();
				// get the end of the month
				lastVisibleDate.setMonth(lastVisibleDate.getMonth()+1);
				lastVisibleDate.setDate(lastVisibleDate.getDate()-1);
				newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
			}

			if (newCalendar) {
				this.calendars = [{
					month: date.getMonth(),
					year: date.getFullYear()
				}];
				if (this._o.mainCalendar === 'right') {
					this.calendars[0].month += 1 - this._o.numberOfMonths;
				}
			}

			this.adjustCalendars();
		},

		adjustCalendars: function() {
			this.calendars[0] = adjustCalendar(this.calendars[0]);
			for (var c = 1; c < this._o.numberOfMonths; c++) {
				this.calendars[c] = adjustCalendar({
					month: this.calendars[0].month + c,
					year: this.calendars[0].year
				});
			}
			this.draw();
		},

		gotoToday: function()
		{
			this.gotoDate(new Date());
		},

		/**
		 * change view to a specific month (zero-index, e.g. 0: January)
		 */
		gotoMonth: function(month)
		{
			if (!isNaN(month)) {
				this.calendars[0].month = parseInt(month, 10);
				this.adjustCalendars();
			}
		},

		nextMonth: function()
		{
			this.calendars[0].month++;
			this.adjustCalendars();
		},

		prevMonth: function()
		{
			this.calendars[0].month--;
			this.adjustCalendars();
		},

		/**
		 * change view to a specific full year (e.g. "2012")
		 */
		gotoYear: function(year)
		{
			if (!isNaN(year)) {
				this.calendars[0].year = parseInt(year, 10);
				this.adjustCalendars();
			}
		},

		/**
		 * change the minDate
		 */
		setMinDate: function(value)
		{
			if(value instanceof Date) {
				setToStartOfDay(value);
				this._o.minDate = value;
				this._o.minYear  = value.getFullYear();
				this._o.minMonth = value.getMonth();
			} else {
				this._o.minDate = defaults.minDate;
				this._o.minYear  = defaults.minYear;
				this._o.minMonth = defaults.minMonth;
				this._o.startRange = defaults.startRange;
			}

			this.draw();
		},

		/**
		 * change the maxDate
		 */
		setMaxDate: function(value)
		{
			if(value instanceof Date) {
				setToStartOfDay(value);
				this._o.maxDate = value;
				this._o.maxYear = value.getFullYear();
				this._o.maxMonth = value.getMonth();
			} else {
				this._o.maxDate = defaults.maxDate;
				this._o.maxYear = defaults.maxYear;
				this._o.maxMonth = defaults.maxMonth;
				this._o.endRange = defaults.endRange;
			}

			this.draw();
		},

		setStartRange: function(value)
		{
			this._o.startRange = value;
		},

		setEndRange: function(value)
		{
			this._o.endRange = value;
		},

		/**
		 * refresh the HTML
		 */
		draw: function(force)
		{
			if (!this._v && !force) {
				return;
			}
			var opts = this._o,
				minYear = opts.minYear,
				maxYear = opts.maxYear,
				minMonth = opts.minMonth,
				maxMonth = opts.maxMonth,
				html = '';

			if (this._y <= minYear) {
				this._y = minYear;
				if (!isNaN(minMonth) && this._m < minMonth) {
					this._m = minMonth;
				}
			}
			if (this._y >= maxYear) {
				this._y = maxYear;
				if (!isNaN(maxMonth) && this._m > maxMonth) {
					this._m = maxMonth;
				}
			}

			for (var c = 0; c < opts.numberOfMonths; c++) {
				html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year) + this.render(this.calendars[c].year, this.calendars[c].month) + '</div>';
			}

			this.el.innerHTML = html;

			if (opts.bound) {
				if(opts.field.type !== 'hidden') {
					sto(function() {
						opts.trigger.focus();
					}, 1);
				}
			}

			if (typeof this._o.onDraw === 'function') {
				this._o.onDraw(this);
			}
		},

		adjustPosition: function()
		{
			var field, pEl, width, height, viewportWidth, viewportHeight, scrollTop, left, top, clientRect;

			if (this._o.container) return;

			this.el.style.position = 'absolute';

			field = this._o.trigger;
			pEl = field;
			width = this.el.offsetWidth;
			height = this.el.offsetHeight;
			viewportWidth = window.innerWidth || document.documentElement.clientWidth;
			viewportHeight = window.innerHeight || document.documentElement.clientHeight;
			scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

			if (typeof field.getBoundingClientRect === 'function') {
				clientRect = field.getBoundingClientRect();
				left = clientRect.left + window.pageXOffset;
				top = clientRect.bottom + window.pageYOffset;
			} else {
				left = pEl.offsetLeft;
				top  = pEl.offsetTop + pEl.offsetHeight;
				while((pEl = pEl.offsetParent)) {
					left += pEl.offsetLeft;
					top  += pEl.offsetTop;
				}
			}

			// default position is bottom & left
			if ((this._o.reposition && left + width > viewportWidth) ||
				(
					this._o.position.indexOf('right') > -1 &&
					left - width + field.offsetWidth > 0
				)
			) {
				left = left - width + field.offsetWidth;
			}
			if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
				(
					this._o.position.indexOf('top') > -1 &&
					top - height - field.offsetHeight > 0
				)
			) {
				top = top - height - field.offsetHeight;
			}

			this.el.style.left = left + 'px';
			this.el.style.top = top + 'px';
		},

		/**
		 * render HTML for a particular month
		 */
		render: function(year, month)
		{
			var opts   = this._o,
				now    = new Date(),
				days   = getDaysInMonth(year, month),
				before = new Date(year, month, 1).getDay(),
				data   = [],
				row    = [];
			setToStartOfDay(now);
			if (opts.firstDay > 0) {
				before -= opts.firstDay;
				if (before < 0) {
					before += 7;
				}
			}
			var previousMonth = month === 0 ? 11 : month - 1,
				nextMonth = month === 11 ? 0 : month + 1,
				yearOfPreviousMonth = month === 0 ? year - 1 : year,
				yearOfNextMonth = month === 11 ? year + 1 : year,
				daysInPreviousMonth = getDaysInMonth(yearOfPreviousMonth, previousMonth);
			var cells = days + before,
				after = cells;
			while(after > 7) {
				after -= 7;
			}
			cells += 7 - after;
			for (var i = 0, r = 0; i < cells; i++)
			{
				var day = new Date(year, month, 1 + (i - before)),
					isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
					isToday = compareDates(day, now),
					isEmpty = i < before || i >= (days + before),
					dayNumber = 1 + (i - before),
					monthNumber = month,
					yearNumber = year,
					isStartRange = opts.startRange && compareDates(opts.startRange, day),
					isEndRange = opts.endRange && compareDates(opts.endRange, day),
					isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
					isDisabled = (opts.minDate && day < opts.minDate) ||
						(opts.maxDate && day > opts.maxDate) ||
						(opts.disableWeekends && isWeekend(day)) ||
						(opts.disableDayFn && opts.disableDayFn(day));

				if (isEmpty) {
					if (i < before) {
						dayNumber = daysInPreviousMonth + dayNumber;
						monthNumber = previousMonth;
						yearNumber = yearOfPreviousMonth;
					} else {
						dayNumber = dayNumber - days;
						monthNumber = nextMonth;
						yearNumber = yearOfNextMonth;
					}
				}

				var dayConfig = {
					day: dayNumber,
					month: monthNumber,
					year: yearNumber,
					isSelected: isSelected,
					isToday: isToday,
					isDisabled: isDisabled,
					isEmpty: isEmpty,
					isStartRange: isStartRange,
					isEndRange: isEndRange,
					isInRange: isInRange,
					showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths
				};

				row.push(renderDay(dayConfig));

				if (++r === 7) {
					if (opts.showWeekNumber) {
						row.unshift(renderWeek(i - before, month, year));
					}
					data.push(renderRow(row, opts.isRTL));
					row = [];
					r = 0;
				}
			}
			return renderTable(opts, data);
		},

		isVisible: function()
		{
			return this._v;
		},

		show: function()
		{
			if (!this._v) {
				removeClass(this.el, 'is-hidden');
				this._v = true;
				this.draw();
				if (this._o.bound) {
					addEvent(document, 'click', this._onClick);
					this.adjustPosition();
				}
				if (typeof this._o.onOpen === 'function') {
					this._o.onOpen.call(this);
				}
			}
		},

		hide: function()
		{
			var v = this._v;
			if (v !== false) {
				if (this._o.bound) {
					removeEvent(document, 'click', this._onClick);
				}
				this.el.style.position = 'static'; // reset
				this.el.style.left = 'auto';
				this.el.style.top = 'auto';
				addClass(this.el, 'is-hidden');
				this._v = false;
				if (v !== undefined && typeof this._o.onClose === 'function') {
					this._o.onClose.call(this);
				}
			}
		},

		/**
		 * GAME OVER
		 */
		destroy: function()
		{
			this.hide();
			removeEvent(this.el, 'mousedown', this._onMouseDown, true);
			removeEvent(this.el, 'touchend', this._onMouseDown, true);
			removeEvent(this.el, 'change', this._onChange);
			if (this._o.field) {
				removeEvent(this._o.field, 'change', this._onInputChange);
				if (this._o.bound) {
					removeEvent(this._o.trigger, 'click', this._onInputClick);
					removeEvent(this._o.trigger, 'focus', this._onInputFocus);
					removeEvent(this._o.trigger, 'blur', this._onInputBlur);
				}
			}
			if (this.el.parentNode) {
				this.el.parentNode.removeChild(this.el);
			}
		}

	};

	return Pikaday;

}));
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
		typeof define === 'function' && define.amd ? define(factory) :
			(factory());
}(this, (function () { 'use strict';

	var promiseFinally = function(callback) {
		var constructor = this.constructor;
		return this.then(
			function(value) {
				return constructor.resolve(callback()).then(function() {
					return value;
				});
			},
			function(reason) {
				return constructor.resolve(callback()).then(function() {
					return constructor.reject(reason);
				});
			}
		);
	};

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
	var setTimeoutFunc = setTimeout;

	function noop() {}

// Polyfill for Function.prototype.bind
	function bind(fn, thisArg) {
		return function() {
			fn.apply(thisArg, arguments);
		};
	}

	function Promise(fn) {
		if (!(this instanceof Promise))
			throw new TypeError('Promises must be constructed via new');
		if (typeof fn !== 'function') throw new TypeError('not a function');
		this._state = 0;
		this._handled = false;
		this._value = undefined;
		this._deferreds = [];

		doResolve(fn, this);
	}

	function handle(self, deferred) {
		while (self._state === 3) {
			self = self._value;
		}
		if (self._state === 0) {
			self._deferreds.push(deferred);
			return;
		}
		self._handled = true;
		Promise._immediateFn(function() {
			var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
			if (cb === null) {
				(self._state === 1 ? resolve : reject)(deferred.promise, self._value);
				return;
			}
			var ret;
			try {
				ret = cb(self._value);
			} catch (e) {
				reject(deferred.promise, e);
				return;
			}
			resolve(deferred.promise, ret);
		});
	}

	function resolve(self, newValue) {
		try {
			// Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
			if (newValue === self)
				throw new TypeError('A promise cannot be resolved with itself.');
			if (
				newValue &&
				(typeof newValue === 'object' || typeof newValue === 'function')
			) {
				var then = newValue.then;
				if (newValue instanceof Promise) {
					self._state = 3;
					self._value = newValue;
					finale(self);
					return;
				} else if (typeof then === 'function') {
					doResolve(bind(then, newValue), self);
					return;
				}
			}
			self._state = 1;
			self._value = newValue;
			finale(self);
		} catch (e) {
			reject(self, e);
		}
	}

	function reject(self, newValue) {
		self._state = 2;
		self._value = newValue;
		finale(self);
	}

	function finale(self) {
		if (self._state === 2 && self._deferreds.length === 0) {
			Promise._immediateFn(function() {
				if (!self._handled) {
					Promise._unhandledRejectionFn(self._value);
				}
			});
		}

		for (var i = 0, len = self._deferreds.length; i < len; i++) {
			handle(self, self._deferreds[i]);
		}
		self._deferreds = null;
	}

	function Handler(onFulfilled, onRejected, promise) {
		this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
		this.onRejected = typeof onRejected === 'function' ? onRejected : null;
		this.promise = promise;
	}

	/**
	 * Take a potentially misbehaving resolver function and make sure
	 * onFulfilled and onRejected are only called once.
	 *
	 * Makes no guarantees about asynchrony.
	 */
	function doResolve(fn, self) {
		var done = false;
		try {
			fn(
				function(value) {
					if (done) return;
					done = true;
					resolve(self, value);
				},
				function(reason) {
					if (done) return;
					done = true;
					reject(self, reason);
				}
			);
		} catch (ex) {
			if (done) return;
			done = true;
			reject(self, ex);
		}
	}

	Promise.prototype['catch'] = function(onRejected) {
		return this.then(null, onRejected);
	};

	Promise.prototype.then = function(onFulfilled, onRejected) {
		var prom = new this.constructor(noop);

		handle(this, new Handler(onFulfilled, onRejected, prom));
		return prom;
	};

	Promise.prototype['finally'] = promiseFinally;

	Promise.all = function(arr) {
		return new Promise(function(resolve, reject) {
			if (!arr || typeof arr.length === 'undefined')
				throw new TypeError('Promise.all accepts an array');
			var args = Array.prototype.slice.call(arr);
			if (args.length === 0) return resolve([]);
			var remaining = args.length;

			function res(i, val) {
				try {
					if (val && (typeof val === 'object' || typeof val === 'function')) {
						var then = val.then;
						if (typeof then === 'function') {
							then.call(
								val,
								function(val) {
									res(i, val);
								},
								reject
							);
							return;
						}
					}
					args[i] = val;
					if (--remaining === 0) {
						resolve(args);
					}
				} catch (ex) {
					reject(ex);
				}
			}

			for (var i = 0; i < args.length; i++) {
				res(i, args[i]);
			}
		});
	};

	Promise.resolve = function(value) {
		if (value && typeof value === 'object' && value.constructor === Promise) {
			return value;
		}

		return new Promise(function(resolve) {
			resolve(value);
		});
	};

	Promise.reject = function(value) {
		return new Promise(function(resolve, reject) {
			reject(value);
		});
	};

	Promise.race = function(values) {
		return new Promise(function(resolve, reject) {
			for (var i = 0, len = values.length; i < len; i++) {
				values[i].then(resolve, reject);
			}
		});
	};

// Use polyfill for setImmediate for performance gains
	Promise._immediateFn =
		(typeof setImmediate === 'function' &&
			function(fn) {
				setImmediate(fn);
			}) ||
		function(fn) {
			setTimeoutFunc(fn, 0);
		};

	Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
		if (typeof console !== 'undefined' && console) {
			console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
		}
	};

	var globalNS = (function() {
		// the only reliable means to get the global object is
		// `Function('return this')()`
		// However, this causes CSP violations in Chrome apps.
		if (typeof self !== 'undefined') {
			return self;
		}
		if (typeof window !== 'undefined') {
			return window;
		}
		if (typeof global !== 'undefined') {
			return global;
		}
		throw new Error('unable to locate global object');
	})();

	if (!globalNS.Promise) {
		globalNS.Promise = Promise;
	} else if (!globalNS.Promise.prototype['finally']) {
		globalNS.Promise.prototype['finally'] = promiseFinally;
	}

})));
/*! powerbi-client v2.5.1 | (c) 2016 Microsoft Corporation MIT */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["powerbi-client"] = factory();
	else
		root["powerbi-client"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var service = __webpack_require__(1);
	exports.service = service;
	var factories = __webpack_require__(15);
	exports.factories = factories;
	var models = __webpack_require__(4);
	exports.models = models;
	var report_1 = __webpack_require__(5);
	exports.Report = report_1.Report;
	var dashboard_1 = __webpack_require__(11);
	exports.Dashboard = dashboard_1.Dashboard;
	var tile_1 = __webpack_require__(12);
	exports.Tile = tile_1.Tile;
	var embed_1 = __webpack_require__(2);
	exports.Embed = embed_1.Embed;
	var page_1 = __webpack_require__(6);
	exports.Page = page_1.Page;
	var qna_1 = __webpack_require__(13);
	exports.Qna = qna_1.Qna;
	var visual_1 = __webpack_require__(14);
	exports.Visual = visual_1.Visual;
	var visualDescriptor_1 = __webpack_require__(7);
	exports.VisualDescriptor = visualDescriptor_1.VisualDescriptor;
	/**
	 * Makes Power BI available to the global object for use in applications that don't have module loading support.
	 *
	 * Note: create an instance of the class with the default configuration for normal usage, or save the class so that you can create an instance of the service.
	 */
	var powerbi = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);
	window.powerbi = powerbi;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var embed = __webpack_require__(2);
	var report_1 = __webpack_require__(5);
	var create_1 = __webpack_require__(10);
	var dashboard_1 = __webpack_require__(11);
	var tile_1 = __webpack_require__(12);
	var page_1 = __webpack_require__(6);
	var qna_1 = __webpack_require__(13);
	var visual_1 = __webpack_require__(14);
	var utils = __webpack_require__(3);
	/**
	 * The Power BI Service embed component, which is the entry point to embed all other Power BI components into your application
	 *
	 * @export
	 * @class Service
	 * @implements {IService}
	 */
	var Service = (function () {
	    /**
	     * Creates an instance of a Power BI Service.
	     *
	     * @param {IHpmFactory} hpmFactory The http post message factory used in the postMessage communication layer
	     * @param {IWpmpFactory} wpmpFactory The window post message factory used in the postMessage communication layer
	     * @param {IRouterFactory} routerFactory The router factory used in the postMessage communication layer
	     * @param {IServiceConfiguration} [config={}]
	     */
	    function Service(hpmFactory, wpmpFactory, routerFactory, config) {
	        var _this = this;
	        if (config === void 0) { config = {}; }
	        this.wpmp = wpmpFactory(config.wpmpName, config.logMessages);
	        this.hpm = hpmFactory(this.wpmp, null, config.version, config.type);
	        this.router = routerFactory(this.wpmp);
	        /**
	         * Adds handler for report events.
	         */
	        this.router.post("/reports/:uniqueId/events/:eventName", function (req, res) {
	            var event = {
	                type: 'report',
	                id: req.params.uniqueId,
	                name: req.params.eventName,
	                value: req.body
	            };
	            _this.handleEvent(event);
	        });
	        this.router.post("/reports/:uniqueId/pages/:pageName/events/:eventName", function (req, res) {
	            var event = {
	                type: 'report',
	                id: req.params.uniqueId,
	                name: req.params.eventName,
	                value: req.body
	            };
	            _this.handleEvent(event);
	        });
	        this.router.post("/reports/:uniqueId/pages/:pageName/visuals/:visualName/events/:eventName", function (req, res) {
	            var event = {
	                type: 'report',
	                id: req.params.uniqueId,
	                name: req.params.eventName,
	                value: req.body
	            };
	            _this.handleEvent(event);
	        });
	        this.router.post("/dashboards/:uniqueId/events/:eventName", function (req, res) {
	            var event = {
	                type: 'dashboard',
	                id: req.params.uniqueId,
	                name: req.params.eventName,
	                value: req.body
	            };
	            _this.handleEvent(event);
	        });
	        this.router.post("/tile/:uniqueId/events/:eventName", function (req, res) {
	            var event = {
	                type: 'tile',
	                id: req.params.uniqueId,
	                name: req.params.eventName,
	                value: req.body
	            };
	            _this.handleEvent(event);
	        });
	        /**
	         * Adds handler for Q&A events.
	         */
	        this.router.post("/qna/:uniqueId/events/:eventName", function (req, res) {
	            var event = {
	                type: 'qna',
	                id: req.params.uniqueId,
	                name: req.params.eventName,
	                value: req.body
	            };
	            _this.handleEvent(event);
	        });
	        this.embeds = [];
	        // TODO: Change when Object.assign is available.
	        this.config = utils.assign({}, Service.defaultConfig, config);
	        if (this.config.autoEmbedOnContentLoaded) {
	            this.enableAutoEmbed();
	        }
	    }
	    /**
	     * Creates new report
	     * @param {HTMLElement} element
	     * @param {embed.IEmbedConfiguration} [config={}]
	     * @returns {embed.Embed}
	     */
	    Service.prototype.createReport = function (element, config) {
	        config.type = 'create';
	        var powerBiElement = element;
	        var component = new create_1.Create(this, powerBiElement, config);
	        powerBiElement.powerBiEmbed = component;
	        this.addOrOverwriteEmbed(component, element);
	        return component;
	    };
	    /**
	     * TODO: Add a description here
	     *
	     * @param {HTMLElement} [container]
	     * @param {embed.IEmbedConfiguration} [config=undefined]
	     * @returns {embed.Embed[]}
	     */
	    Service.prototype.init = function (container, config) {
	        var _this = this;
	        if (config === void 0) { config = undefined; }
	        container = (container && container instanceof HTMLElement) ? container : document.body;
	        var elements = Array.prototype.slice.call(container.querySelectorAll("[" + embed.Embed.embedUrlAttribute + "]"));
	        return elements.map(function (element) { return _this.embed(element, config); });
	    };
	    /**
	     * Given a configuration based on an HTML element,
	     * if the component has already been created and attached to the element, reuses the component instance and existing iframe,
	     * otherwise creates a new component instance.
	     *
	     * @param {HTMLElement} element
	     * @param {embed.IEmbedConfigurationBase} [config={}]
	     * @returns {embed.Embed}
	     */
	    Service.prototype.embed = function (element, config) {
	        if (config === void 0) { config = {}; }
	        return this.embedInternal(element, config);
	    };
	    /**
	     * Given a configuration based on an HTML element,
	     * if the component has already been created and attached to the element, reuses the component instance and existing iframe,
	     * otherwise creates a new component instance.
	     * This is used for the phased embedding API, once element is loaded successfully, one can call 'render' on it.
	     *
	     * @param {HTMLElement} element
	     * @param {embed.IEmbedConfigurationBase} [config={}]
	     * @returns {embed.Embed}
	     */
	    Service.prototype.load = function (element, config) {
	        if (config === void 0) { config = {}; }
	        return this.embedInternal(element, config, /* phasedRender */ true);
	    };
	    Service.prototype.embedInternal = function (element, config, phasedRender) {
	        if (config === void 0) { config = {}; }
	        var component;
	        var powerBiElement = element;
	        if (powerBiElement.powerBiEmbed) {
	            component = this.embedExisting(powerBiElement, config, phasedRender);
	        }
	        else {
	            component = this.embedNew(powerBiElement, config, phasedRender);
	        }
	        return component;
	    };
	    /**
	     * Given a configuration based on a Power BI element, saves the component instance that reference the element for later lookup.
	     *
	     * @private
	     * @param {IPowerBiElement} element
	     * @param {embed.IEmbedConfigurationBase} config
	     * @returns {embed.Embed}
	     */
	    Service.prototype.embedNew = function (element, config, phasedRender) {
	        var componentType = config.type || element.getAttribute(embed.Embed.typeAttribute);
	        if (!componentType) {
	            throw new Error("Attempted to embed using config " + JSON.stringify(config) + " on element " + element.outerHTML + ", but could not determine what type of component to embed. You must specify a type in the configuration or as an attribute such as '" + embed.Embed.typeAttribute + "=\"" + report_1.Report.type.toLowerCase() + "\"'.");
	        }
	        // Saves the type as part of the configuration so that it can be referenced later at a known location.
	        config.type = componentType;
	        var Component = utils.find(function (component) { return componentType === component.type.toLowerCase(); }, Service.components);
	        if (!Component) {
	            throw new Error("Attempted to embed component of type: " + componentType + " but did not find any matching component.  Please verify the type you specified is intended.");
	        }
	        var component = new Component(this, element, config, phasedRender);
	        element.powerBiEmbed = component;
	        this.addOrOverwriteEmbed(component, element);
	        return component;
	    };
	    /**
	     * Given an element that already contains an embed component, load with a new configuration.
	     *
	     * @private
	     * @param {IPowerBiElement} element
	     * @param {embed.IEmbedConfigurationBase} config
	     * @returns {embed.Embed}
	     */
	    Service.prototype.embedExisting = function (element, config, phasedRender) {
	        var component = utils.find(function (x) { return x.element === element; }, this.embeds);
	        if (!component) {
	            throw new Error("Attempted to embed using config " + JSON.stringify(config) + " on element " + element.outerHTML + " which already has embedded comopnent associated, but could not find the existing comopnent in the list of active components. This could indicate the embeds list is out of sync with the DOM, or the component is referencing the incorrect HTML element.");
	        }
	        // TODO: Multiple embedding to the same iframe is not supported in QnA
	        if (config.type && config.type.toLowerCase() === "qna") {
	            return this.embedNew(element, config);
	        }
	        /**
	         * TODO: Dynamic embed type switching could be supported but there is work needed to prepare the service state and DOM cleanup.
	         * remove all event handlers from the DOM, then reset the element to initial state which removes iframe, and removes from list of embeds
	         * then we can call the embedNew function which would allow setting the proper embedUrl and construction of object based on the new type.
	         */
	        if (typeof config.type === "string" && config.type !== component.config.type) {
	            /**
	             * When loading report after create we want to use existing Iframe to optimize load period
	             */
	            if (config.type === "report" && component.config.type === "create") {
	                var report = new report_1.Report(this, element, config, /* phasedRender */ false, element.powerBiEmbed.iframe);
	                report.load(config);
	                element.powerBiEmbed = report;
	                this.addOrOverwriteEmbed(component, element);
	                return report;
	            }
	            throw new Error("Embedding on an existing element with a different type than the previous embed object is not supported.  Attempted to embed using config " + JSON.stringify(config) + " on element " + element.outerHTML + ", but the existing element contains an embed of type: " + this.config.type + " which does not match the new type: " + config.type);
	        }
	        component.load(config, phasedRender);
	        return component;
	    };
	    /**
	     * Adds an event handler for DOMContentLoaded, which searches the DOM for elements that have the 'powerbi-embed-url' attribute,
	     * and automatically attempts to embed a powerbi component based on information from other powerbi-* attributes.
	     *
	     * Note: Only runs if `config.autoEmbedOnContentLoaded` is true when the service is created.
	     * This handler is typically useful only for applications that are rendered on the server so that all required data is available when the handler is called.
	     */
	    Service.prototype.enableAutoEmbed = function () {
	        var _this = this;
	        window.addEventListener('DOMContentLoaded', function (event) { return _this.init(document.body); }, false);
	    };
	    /**
	     * Returns an instance of the component associated with the element.
	     *
	     * @param {HTMLElement} element
	     * @returns {(Report | Tile)}
	     */
	    Service.prototype.get = function (element) {
	        var powerBiElement = element;
	        if (!powerBiElement.powerBiEmbed) {
	            throw new Error("You attempted to get an instance of powerbi component associated with element: " + element.outerHTML + " but there was no associated instance.");
	        }
	        return powerBiElement.powerBiEmbed;
	    };
	    /**
	     * Finds an embed instance by the name or unique ID that is provided.
	     *
	     * @param {string} uniqueId
	     * @returns {(Report | Tile)}
	     */
	    Service.prototype.find = function (uniqueId) {
	        return utils.find(function (x) { return x.config.uniqueId === uniqueId; }, this.embeds);
	    };
	    Service.prototype.addOrOverwriteEmbed = function (component, element) {
	        // remove embeds over the same div element.
	        this.embeds = this.embeds.filter(function (embed) {
	            return embed.element.id !== element.id;
	        });
	        this.embeds.push(component);
	    };
	    /**
	     * Given an HTML element that has a component embedded within it, removes the component from the list of embedded components, removes the association between the element and the component, and removes the iframe.
	     *
	     * @param {HTMLElement} element
	     * @returns {void}
	     */
	    Service.prototype.reset = function (element) {
	        var powerBiElement = element;
	        if (!powerBiElement.powerBiEmbed) {
	            return;
	        }
	        /** Removes the component from an internal list of components. */
	        utils.remove(function (x) { return x === powerBiElement.powerBiEmbed; }, this.embeds);
	        /** Deletes a property from the HTML element. */
	        delete powerBiElement.powerBiEmbed;
	        /** Removes the iframe from the element. */
	        var iframe = element.querySelector('iframe');
	        if (iframe) {
	            if (iframe.remove !== undefined) {
	                iframe.remove();
	            }
	            else {
	                /** Workaround for IE: unhandled rejection TypeError: object doesn't support propert or method 'remove' */
	                iframe.parentElement.removeChild(iframe);
	            }
	        }
	    };
	    /**
	     * handles tile events
	     *
	     * @param {IEvent<any>} event
	     */
	    Service.prototype.handleTileEvents = function (event) {
	        if (event.type === 'tile') {
	            this.handleEvent(event);
	        }
	    };
	    /**
	     * Given an event object, finds the embed component with the matching type and ID, and invokes its handleEvent method with the event object.
	     *
	     * @private
	     * @param {IEvent<any>} event
	     */
	    Service.prototype.handleEvent = function (event) {
	        var embed = utils.find(function (embed) {
	            return (embed.config.uniqueId === event.id);
	        }, this.embeds);
	        if (embed) {
	            var value = event.value;
	            if (event.name === 'pageChanged') {
	                var pageKey = 'newPage';
	                var page = value[pageKey];
	                if (!page) {
	                    throw new Error("Page model not found at 'event.value." + pageKey + "'.");
	                }
	                value[pageKey] = new page_1.Page(embed, page.name, page.displayName, true /* isActive */);
	            }
	            utils.raiseCustomEvent(embed.element, event.name, value);
	        }
	    };
	    /**
	     * API for warm starting powerbi embedded endpoints.
	     * Use this API to preload Power BI Embedded in the background.
	     *
	     * @public
	     * @param {embed.IEmbedConfigurationBase} [config={}]
	     * @param {HTMLElement} [element=undefined]
	     */
	    Service.prototype.preload = function (config, element) {
	        var iframeContent = document.createElement("iframe");
	        iframeContent.setAttribute("style", "display:none;");
	        iframeContent.setAttribute("src", config.embedUrl);
	        iframeContent.setAttribute("scrolling", "no");
	        iframeContent.setAttribute("allowfullscreen", "false");
	        var node = element;
	        if (!node) {
	            node = document.getElementsByTagName("body")[0];
	        }
	        node.appendChild(iframeContent);
	        iframeContent.onload = function () {
	            utils.raiseCustomEvent(iframeContent, "preloaded", {});
	        };
	        return iframeContent;
	    };
	    /**
	     * A list of components that this service can embed
	     */
	    Service.components = [
	        tile_1.Tile,
	        report_1.Report,
	        dashboard_1.Dashboard,
	        qna_1.Qna,
	        visual_1.Visual
	    ];
	    /**
	     * The default configuration for the service
	     */
	    Service.defaultConfig = {
	        autoEmbedOnContentLoaded: false,
	        onError: function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i - 0] = arguments[_i];
	            }
	            return console.log(args[0], args.slice(1));
	        }
	    };
	    Service.DefaultInitEmbedUrl = "http://app.powerbi.com/reportEmbed";
	    return Service;
	}());
	exports.Service = Service;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(3);
	var models = __webpack_require__(4);
	/**
	 * Base class for all Power BI embed components
	 *
	 * @export
	 * @abstract
	 * @class Embed
	 */
	var Embed = (function () {
	    /**
	     * Creates an instance of Embed.
	     *
	     * Note: there is circular reference between embeds and the service, because
	     * the service has a list of all embeds on the host page, and each embed has a reference to the service that created it.
	     *
	     * @param {service.Service} service
	     * @param {HTMLElement} element
	     * @param {IEmbedConfigurationBase} config
	     */
	    function Embed(service, element, config, iframe, phasedRender) {
	        this.allowedEvents = [];
	        Array.prototype.push.apply(this.allowedEvents, Embed.allowedEvents);
	        this.eventHandlers = [];
	        this.service = service;
	        this.element = element;
	        this.iframe = iframe;
	        this.embeType = config.type.toLowerCase();
	        this.populateConfig(config);
	        if (this.embeType === 'create') {
	            this.setIframe(false /*set EventListener to call create() on 'load' event*/);
	        }
	        else {
	            this.setIframe(true /*set EventListener to call load() on 'load' event*/, phasedRender);
	        }
	    }
	    /**
	     * Sends createReport configuration data.
	     *
	     * ```javascript
	     * createReport({
	     *   datasetId: '5dac7a4a-4452-46b3-99f6-a25915e0fe55',
	     *   accessToken: 'eyJ0eXA ... TaE2rTSbmg',
	     * ```
	     *
	     * @param {models.IReportCreateConfiguration} config
	     * @returns {Promise<void>}
	     */
	    Embed.prototype.createReport = function (config) {
	        var errors = models.validateCreateReport(config);
	        if (errors) {
	            throw errors;
	        }
	        return this.service.hpm.post("/report/create", config, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Saves Report.
	     *
	     * @returns {Promise<void>}
	     */
	    Embed.prototype.save = function () {
	        return this.service.hpm.post('/report/save', null, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * SaveAs Report.
	     *
	     * @returns {Promise<void>}
	     */
	    Embed.prototype.saveAs = function (saveAsParameters) {
	        return this.service.hpm.post('/report/saveAs', saveAsParameters, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Sends load configuration data.
	     *
	     * ```javascript
	     * report.load({
	     *   type: 'report',
	     *   id: '5dac7a4a-4452-46b3-99f6-a25915e0fe55',
	     *   accessToken: 'eyJ0eXA ... TaE2rTSbmg',
	     *   settings: {
	     *     navContentPaneEnabled: false
	     *   },
	     *   pageName: "DefaultPage",
	     *   filters: [
	     *     {
	     *        ...  DefaultReportFilter ...
	     *     }
	     *   ]
	     * })
	     *   .catch(error => { ... });
	     * ```
	     *
	     * @param {models.ILoadConfiguration} config
	     * @param {boolean} phasedRender
	     * @returns {Promise<void>}
	     */
	    Embed.prototype.load = function (config, phasedRender) {
	        var _this = this;
	        var errors = this.validate(config);
	        if (errors) {
	            throw errors;
	        }
	        var path = phasedRender && config.type === 'report' ? this.phasedLoadPath : this.loadPath;
	        return this.service.hpm.post(path, config, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            utils.assign(_this.config, config);
	            return response.body;
	        }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Removes one or more event handlers from the list of handlers.
	     * If a reference to the existing handle function is specified, remove the specific handler.
	     * If the handler is not specified, remove all handlers for the event name specified.
	     *
	     * ```javascript
	     * report.off('pageChanged')
	     *
	     * or
	     *
	     * const logHandler = function (event) {
	     *    console.log(event);
	     * };
	     *
	     * report.off('pageChanged', logHandler);
	     * ```
	     *
	     * @template T
	     * @param {string} eventName
	     * @param {service.IEventHandler<T>} [handler]
	     */
	    Embed.prototype.off = function (eventName, handler) {
	        var _this = this;
	        var fakeEvent = { name: eventName, type: null, id: null, value: null };
	        if (handler) {
	            utils.remove(function (eventHandler) { return eventHandler.test(fakeEvent) && (eventHandler.handle === handler); }, this.eventHandlers);
	            this.element.removeEventListener(eventName, handler);
	        }
	        else {
	            var eventHandlersToRemove = this.eventHandlers
	                .filter(function (eventHandler) { return eventHandler.test(fakeEvent); });
	            eventHandlersToRemove
	                .forEach(function (eventHandlerToRemove) {
	                utils.remove(function (eventHandler) { return eventHandler === eventHandlerToRemove; }, _this.eventHandlers);
	                _this.element.removeEventListener(eventName, eventHandlerToRemove.handle);
	            });
	        }
	    };
	    /**
	     * Adds an event handler for a specific event.
	     *
	     * ```javascript
	     * report.on('pageChanged', (event) => {
	     *   console.log('PageChanged: ', event.page.name);
	     * });
	     * ```
	     *
	     * @template T
	     * @param {string} eventName
	     * @param {service.IEventHandler<T>} handler
	     */
	    Embed.prototype.on = function (eventName, handler) {
	        if (this.allowedEvents.indexOf(eventName) === -1) {
	            throw new Error("eventName is must be one of " + this.allowedEvents + ". You passed: " + eventName);
	        }
	        this.eventHandlers.push({
	            test: function (event) { return event.name === eventName; },
	            handle: handler
	        });
	        this.element.addEventListener(eventName, handler);
	    };
	    /**
	     * Reloads embed using existing configuration.
	     * E.g. For reports this effectively clears all filters and makes the first page active which simulates resetting a report back to loaded state.
	     *
	     * ```javascript
	     * report.reload();
	     * ```
	     */
	    Embed.prototype.reload = function () {
	        return this.load(this.config);
	    };
	    /**
	     * Set accessToken.
	     *
	     * @returns {Promise<void>}
	     */
	    Embed.prototype.setAccessToken = function (accessToken) {
	        var embedType = this.config.type;
	        return this.service.hpm.post('/' + embedType + '/token', accessToken, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Gets an access token from the first available location: config, attribute, global.
	     *
	     * @private
	     * @param {string} globalAccessToken
	     * @returns {string}
	     */
	    Embed.prototype.getAccessToken = function (globalAccessToken) {
	        var accessToken = this.config.accessToken || this.element.getAttribute(Embed.accessTokenAttribute) || globalAccessToken;
	        if (!accessToken) {
	            throw new Error("No access token was found for element. You must specify an access token directly on the element using attribute '" + Embed.accessTokenAttribute + "' or specify a global token at: powerbi.accessToken.");
	        }
	        return accessToken;
	    };
	    /**
	     * Populate config for create and load
	     *
	     * @param {IEmbedConfiguration}
	     * @returns {void}
	     */
	    Embed.prototype.populateConfig = function (config) {
	        this.config = config;
	        // TODO: Change when Object.assign is available.
	        this.config.uniqueId = this.getUniqueId();
	        this.config.embedUrl = this.getEmbedUrl();
	        this.config.accessToken = this.getAccessToken(this.service.accessToken);
	        this.addLocaleToEmbedUrl(config);
	    };
	    /**
	     * Adds locale parameters to embedUrl
	     *
	     * @private
	     * @param {IEmbedConfiguration} config
	     */
	    Embed.prototype.addLocaleToEmbedUrl = function (config) {
	        if (!config.settings) {
	            return;
	        }
	        var localeSettings = config.settings.localeSettings;
	        if (localeSettings && localeSettings.language) {
	            this.config.embedUrl = utils.addParamToUrl(this.config.embedUrl, 'language', localeSettings.language);
	        }
	        if (localeSettings && localeSettings.formatLocale) {
	            this.config.embedUrl = utils.addParamToUrl(this.config.embedUrl, 'formatLocale', localeSettings.formatLocale);
	        }
	    };
	    /**
	     * Gets an embed url from the first available location: options, attribute.
	     *
	     * @private
	     * @returns {string}
	     */
	    Embed.prototype.getEmbedUrl = function () {
	        var embedUrl = this.config.embedUrl || this.element.getAttribute(Embed.embedUrlAttribute);
	        if (typeof embedUrl !== 'string' || embedUrl.length === 0) {
	            throw new Error("Embed Url is required, but it was not found. You must provide an embed url either as part of embed configuration or as attribute '" + Embed.embedUrlAttribute + "'.");
	        }
	        return embedUrl;
	    };
	    /**
	     * Gets a unique ID from the first available location: options, attribute.
	     * If neither is provided generate a unique string.
	     *
	     * @private
	     * @returns {string}
	     */
	    Embed.prototype.getUniqueId = function () {
	        return this.config.uniqueId || this.element.getAttribute(Embed.nameAttribute) || utils.createRandomString();
	    };
	    /**
	     * Requests the browser to render the component's iframe in fullscreen mode.
	     */
	    Embed.prototype.fullscreen = function () {
	        var requestFullScreen = this.iframe.requestFullscreen || this.iframe.msRequestFullscreen || this.iframe.mozRequestFullScreen || this.iframe.webkitRequestFullscreen;
	        requestFullScreen.call(this.iframe);
	    };
	    /**
	     * Requests the browser to exit fullscreen mode.
	     */
	    Embed.prototype.exitFullscreen = function () {
	        if (!this.isFullscreen(this.iframe)) {
	            return;
	        }
	        var exitFullscreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
	        exitFullscreen.call(document);
	    };
	    /**
	     * Returns true if the iframe is rendered in fullscreen mode,
	     * otherwise returns false.
	     *
	     * @private
	     * @param {HTMLIFrameElement} iframe
	     * @returns {boolean}
	     */
	    Embed.prototype.isFullscreen = function (iframe) {
	        var options = ['fullscreenElement', 'webkitFullscreenElement', 'mozFullscreenScreenElement', 'msFullscreenElement'];
	        return options.some(function (option) { return document[option] === iframe; });
	    };
	    /**
	     * Sets Iframe for embed
	     */
	    Embed.prototype.setIframe = function (isLoad, phasedRender) {
	        var _this = this;
	        if (!this.iframe) {
	            var iframeContent = document.createElement("iframe");
	            var embedUrl = this.config.embedUrl;
	            iframeContent.setAttribute("style", "width:100%;height:100%;");
	            iframeContent.setAttribute("src", embedUrl);
	            iframeContent.setAttribute("scrolling", "no");
	            iframeContent.setAttribute("allowfullscreen", "true");
	            var node = this.element;
	            while (node.firstChild) {
	                node.removeChild(node.firstChild);
	            }
	            node.appendChild(iframeContent);
	            this.iframe = node.firstChild;
	        }
	        if (isLoad) {
	            this.iframe.addEventListener('load', function () { return _this.load(_this.config, phasedRender); }, false);
	        }
	        else {
	            this.iframe.addEventListener('load', function () { return _this.createReport(_this.createConfig); }, false);
	        }
	    };
	    Embed.allowedEvents = ["loaded", "saved", "rendered", "saveAsTriggered", "error", "dataSelected"];
	    Embed.accessTokenAttribute = 'powerbi-access-token';
	    Embed.embedUrlAttribute = 'powerbi-embed-url';
	    Embed.nameAttribute = 'powerbi-name';
	    Embed.typeAttribute = 'powerbi-type';
	    return Embed;
	}());
	exports.Embed = Embed;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	/**
	 * Raises a custom event with event data on the specified HTML element.
	 *
	 * @export
	 * @param {HTMLElement} element
	 * @param {string} eventName
	 * @param {*} eventData
	 */
	function raiseCustomEvent(element, eventName, eventData) {
	    var customEvent;
	    if (typeof CustomEvent === 'function') {
	        customEvent = new CustomEvent(eventName, {
	            detail: eventData,
	            bubbles: true,
	            cancelable: true
	        });
	    }
	    else {
	        customEvent = document.createEvent('CustomEvent');
	        customEvent.initCustomEvent(eventName, true, true, eventData);
	    }
	    element.dispatchEvent(customEvent);
	}
	exports.raiseCustomEvent = raiseCustomEvent;
	/**
	 * Finds the index of the first value in an array that matches the specified predicate.
	 *
	 * @export
	 * @template T
	 * @param {(x: T) => boolean} predicate
	 * @param {T[]} xs
	 * @returns {number}
	 */
	function findIndex(predicate, xs) {
	    if (!Array.isArray(xs)) {
	        throw new Error("You attempted to call find with second parameter that was not an array. You passed: " + xs);
	    }
	    var index;
	    xs.some(function (x, i) {
	        if (predicate(x)) {
	            index = i;
	            return true;
	        }
	    });
	    return index;
	}
	exports.findIndex = findIndex;
	/**
	 * Finds the first value in an array that matches the specified predicate.
	 *
	 * @export
	 * @template T
	 * @param {(x: T) => boolean} predicate
	 * @param {T[]} xs
	 * @returns {T}
	 */
	function find(predicate, xs) {
	    var index = findIndex(predicate, xs);
	    return xs[index];
	}
	exports.find = find;
	function remove(predicate, xs) {
	    var index = findIndex(predicate, xs);
	    xs.splice(index, 1);
	}
	exports.remove = remove;
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	// TODO: replace in favor of using polyfill
	/**
	 * Copies the values of all enumerable properties from one or more source objects to a target object, and returns the target object.
	 *
	 * @export
	 * @param {any} args
	 * @returns
	 */
	function assign() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i - 0] = arguments[_i];
	    }
	    var target = args[0];
	    'use strict';
	    if (target === undefined || target === null) {
	        throw new TypeError('Cannot convert undefined or null to object');
	    }
	    var output = Object(target);
	    for (var index = 1; index < arguments.length; index++) {
	        var source = arguments[index];
	        if (source !== undefined && source !== null) {
	            for (var nextKey in source) {
	                if (source.hasOwnProperty(nextKey)) {
	                    output[nextKey] = source[nextKey];
	                }
	            }
	        }
	    }
	    return output;
	}
	exports.assign = assign;
	/**
	 * Generates a random 7 character string.
	 *
	 * @export
	 * @returns {string}
	 */
	function createRandomString() {
	    return (Math.random() + 1).toString(36).substring(7);
	}
	exports.createRandomString = createRandomString;
	/**
	 * Adds a parameter to the given url
	 *
	 * @export
	 * @param {string} url
	 * @param {string} paramName
	 * @param {string} value
	 * @returns {string}
	 */
	function addParamToUrl(url, paramName, value) {
	    var parameterPrefix = url.indexOf('?') > 0 ? '&' : '?';
	    url += parameterPrefix + paramName + '=' + value;
	    return url;
	}
	exports.addParamToUrl = addParamToUrl;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	/*! powerbi-models v1.0.4 | (c) 2016 Microsoft Corporation MIT */
	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["powerbi-models"] = factory();
		else
			root["powerbi-models"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.Validators = __webpack_require__(1).Validators;
		var PageSizeType;
		(function (PageSizeType) {
		    PageSizeType[PageSizeType["Widescreen"] = 0] = "Widescreen";
		    PageSizeType[PageSizeType["Standard"] = 1] = "Standard";
		    PageSizeType[PageSizeType["Cortana"] = 2] = "Cortana";
		    PageSizeType[PageSizeType["Letter"] = 3] = "Letter";
		    PageSizeType[PageSizeType["Custom"] = 4] = "Custom";
		})(PageSizeType = exports.PageSizeType || (exports.PageSizeType = {}));
		var DisplayOption;
		(function (DisplayOption) {
		    DisplayOption[DisplayOption["FitToPage"] = 0] = "FitToPage";
		    DisplayOption[DisplayOption["FitToWidth"] = 1] = "FitToWidth";
		    DisplayOption[DisplayOption["ActualSize"] = 2] = "ActualSize";
		})(DisplayOption = exports.DisplayOption || (exports.DisplayOption = {}));
		var BackgroundType;
		(function (BackgroundType) {
		    BackgroundType[BackgroundType["Default"] = 0] = "Default";
		    BackgroundType[BackgroundType["Transparent"] = 1] = "Transparent";
		})(BackgroundType = exports.BackgroundType || (exports.BackgroundType = {}));
		var VisualContainerDisplayMode;
		(function (VisualContainerDisplayMode) {
		    VisualContainerDisplayMode[VisualContainerDisplayMode["Visible"] = 0] = "Visible";
		    VisualContainerDisplayMode[VisualContainerDisplayMode["Hidden"] = 1] = "Hidden";
		})(VisualContainerDisplayMode = exports.VisualContainerDisplayMode || (exports.VisualContainerDisplayMode = {}));
		var LayoutType;
		(function (LayoutType) {
		    LayoutType[LayoutType["Master"] = 0] = "Master";
		    LayoutType[LayoutType["Custom"] = 1] = "Custom";
		    LayoutType[LayoutType["MobilePortrait"] = 2] = "MobilePortrait";
		    LayoutType[LayoutType["MobileLandscape"] = 3] = "MobileLandscape";
		})(LayoutType = exports.LayoutType || (exports.LayoutType = {}));
		var SectionVisibility;
		(function (SectionVisibility) {
		    SectionVisibility[SectionVisibility["AlwaysVisible"] = 0] = "AlwaysVisible";
		    SectionVisibility[SectionVisibility["HiddenInViewMode"] = 1] = "HiddenInViewMode";
		})(SectionVisibility = exports.SectionVisibility || (exports.SectionVisibility = {}));
		var Permissions;
		(function (Permissions) {
		    Permissions[Permissions["Read"] = 0] = "Read";
		    Permissions[Permissions["ReadWrite"] = 1] = "ReadWrite";
		    Permissions[Permissions["Copy"] = 2] = "Copy";
		    Permissions[Permissions["Create"] = 4] = "Create";
		    Permissions[Permissions["All"] = 7] = "All";
		})(Permissions = exports.Permissions || (exports.Permissions = {}));
		var ViewMode;
		(function (ViewMode) {
		    ViewMode[ViewMode["View"] = 0] = "View";
		    ViewMode[ViewMode["Edit"] = 1] = "Edit";
		})(ViewMode = exports.ViewMode || (exports.ViewMode = {}));
		var TokenType;
		(function (TokenType) {
		    TokenType[TokenType["Aad"] = 0] = "Aad";
		    TokenType[TokenType["Embed"] = 1] = "Embed";
		})(TokenType = exports.TokenType || (exports.TokenType = {}));
		var FilterType;
		(function (FilterType) {
		    FilterType[FilterType["Advanced"] = 0] = "Advanced";
		    FilterType[FilterType["Basic"] = 1] = "Basic";
		    FilterType[FilterType["Unknown"] = 2] = "Unknown";
		    FilterType[FilterType["IncludeExclude"] = 3] = "IncludeExclude";
		    FilterType[FilterType["RelativeDate"] = 4] = "RelativeDate";
		    FilterType[FilterType["TopN"] = 5] = "TopN";
		})(FilterType = exports.FilterType || (exports.FilterType = {}));
		var RelativeDateFilterTimeUnit;
		(function (RelativeDateFilterTimeUnit) {
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["Days"] = 0] = "Days";
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["Weeks"] = 1] = "Weeks";
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["CalendarWeeks"] = 2] = "CalendarWeeks";
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["Months"] = 3] = "Months";
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["CalendarMonths"] = 4] = "CalendarMonths";
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["Years"] = 5] = "Years";
		    RelativeDateFilterTimeUnit[RelativeDateFilterTimeUnit["CalendarYears"] = 6] = "CalendarYears";
		})(RelativeDateFilterTimeUnit = exports.RelativeDateFilterTimeUnit || (exports.RelativeDateFilterTimeUnit = {}));
		var RelativeDateOperators;
		(function (RelativeDateOperators) {
		    RelativeDateOperators[RelativeDateOperators["InLast"] = 0] = "InLast";
		    RelativeDateOperators[RelativeDateOperators["InThis"] = 1] = "InThis";
		    RelativeDateOperators[RelativeDateOperators["InNext"] = 2] = "InNext";
		})(RelativeDateOperators = exports.RelativeDateOperators || (exports.RelativeDateOperators = {}));
		var Filter = /** @class */ (function () {
		    function Filter(target, filterType) {
		        this.target = target;
		        this.filterType = filterType;
		    }
		    Filter.prototype.toJSON = function () {
		        return {
		            $schema: this.schemaUrl,
		            target: this.target,
		            filterType: this.filterType
		        };
		    };
		    ;
		    return Filter;
		}());
		exports.Filter = Filter;
		var NotSupportedFilter = /** @class */ (function (_super) {
		    __extends(NotSupportedFilter, _super);
		    function NotSupportedFilter(target, message, notSupportedTypeName) {
		        var _this = _super.call(this, target, FilterType.Unknown) || this;
		        _this.message = message;
		        _this.notSupportedTypeName = notSupportedTypeName;
		        _this.schemaUrl = NotSupportedFilter.schemaUrl;
		        return _this;
		    }
		    NotSupportedFilter.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.message = this.message;
		        filter.notSupportedTypeName = this.notSupportedTypeName;
		        return filter;
		    };
		    NotSupportedFilter.schemaUrl = "http://powerbi.com/product/schema#notSupported";
		    return NotSupportedFilter;
		}(Filter));
		exports.NotSupportedFilter = NotSupportedFilter;
		var IncludeExcludeFilter = /** @class */ (function (_super) {
		    __extends(IncludeExcludeFilter, _super);
		    function IncludeExcludeFilter(target, isExclude, values) {
		        var _this = _super.call(this, target, FilterType.IncludeExclude) || this;
		        _this.values = values;
		        _this.isExclude = isExclude;
		        _this.schemaUrl = IncludeExcludeFilter.schemaUrl;
		        return _this;
		    }
		    IncludeExcludeFilter.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.isExclude = this.isExclude;
		        filter.values = this.values;
		        return filter;
		    };
		    IncludeExcludeFilter.schemaUrl = "http://powerbi.com/product/schema#includeExclude";
		    return IncludeExcludeFilter;
		}(Filter));
		exports.IncludeExcludeFilter = IncludeExcludeFilter;
		var TopNFilter = /** @class */ (function (_super) {
		    __extends(TopNFilter, _super);
		    function TopNFilter(target, operator, itemCount) {
		        var _this = _super.call(this, target, FilterType.TopN) || this;
		        _this.operator = operator;
		        _this.itemCount = itemCount;
		        _this.schemaUrl = TopNFilter.schemaUrl;
		        return _this;
		    }
		    TopNFilter.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.operator = this.operator;
		        filter.itemCount = this.itemCount;
		        return filter;
		    };
		    TopNFilter.schemaUrl = "http://powerbi.com/product/schema#topN";
		    return TopNFilter;
		}(Filter));
		exports.TopNFilter = TopNFilter;
		var RelativeDateFilter = /** @class */ (function (_super) {
		    __extends(RelativeDateFilter, _super);
		    function RelativeDateFilter(target, operator, timeUnitsCount, timeUnitType, includeToday) {
		        var _this = _super.call(this, target, FilterType.RelativeDate) || this;
		        _this.operator = operator;
		        _this.timeUnitsCount = timeUnitsCount;
		        _this.timeUnitType = timeUnitType;
		        _this.includeToday = includeToday;
		        _this.schemaUrl = RelativeDateFilter.schemaUrl;
		        return _this;
		    }
		    RelativeDateFilter.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.operator = this.operator;
		        filter.timeUnitsCount = this.timeUnitsCount;
		        filter.timeUnitType = this.timeUnitType;
		        filter.includeToday = this.includeToday;
		        return filter;
		    };
		    RelativeDateFilter.schemaUrl = "http://powerbi.com/product/schema#relativeDate";
		    return RelativeDateFilter;
		}(Filter));
		exports.RelativeDateFilter = RelativeDateFilter;
		var BasicFilter = /** @class */ (function (_super) {
		    __extends(BasicFilter, _super);
		    function BasicFilter(target, operator) {
		        var values = [];
		        for (var _i = 2; _i < arguments.length; _i++) {
		            values[_i - 2] = arguments[_i];
		        }
		        var _this = _super.call(this, target, FilterType.Basic) || this;
		        _this.operator = operator;
		        _this.schemaUrl = BasicFilter.schemaUrl;
		        if (values.length === 0 && operator !== "All") {
		            throw new Error("values must be a non-empty array unless your operator is \"All\".");
		        }
		        /**
		         * Accept values as array instead of as individual arguments
		         * new BasicFilter('a', 'b', 1, 2);
		         * new BasicFilter('a', 'b', [1,2]);
		         */
		        if (Array.isArray(values[0])) {
		            _this.values = values[0];
		        }
		        else {
		            _this.values = values;
		        }
		        return _this;
		    }
		    BasicFilter.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.operator = this.operator;
		        filter.values = this.values;
		        return filter;
		    };
		    BasicFilter.schemaUrl = "http://powerbi.com/product/schema#basic";
		    return BasicFilter;
		}(Filter));
		exports.BasicFilter = BasicFilter;
		var BasicFilterWithKeys = /** @class */ (function (_super) {
		    __extends(BasicFilterWithKeys, _super);
		    function BasicFilterWithKeys(target, operator, values, keyValues) {
		        var _this = _super.call(this, target, operator, values) || this;
		        _this.keyValues = keyValues;
		        _this.target = target;
		        var numberOfKeys = target.keys ? target.keys.length : 0;
		        if (numberOfKeys > 0 && !keyValues) {
		            throw new Error("You shold pass the values to be filtered for each key. You passed: no values and " + numberOfKeys + " keys");
		        }
		        if (numberOfKeys === 0 && keyValues && keyValues.length > 0) {
		            throw new Error("You passed key values but your target object doesn't contain the keys to be filtered");
		        }
		        for (var i = 0; i < _this.keyValues.length; i++) {
		            if (_this.keyValues[i]) {
		                var lengthOfArray = _this.keyValues[i].length;
		                if (lengthOfArray !== numberOfKeys) {
		                    throw new Error("Each tuple of key values should contain a value for each of the keys. You passed: " + lengthOfArray + " values and " + numberOfKeys + " keys");
		                }
		            }
		        }
		        return _this;
		    }
		    BasicFilterWithKeys.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.keyValues = this.keyValues;
		        return filter;
		    };
		    return BasicFilterWithKeys;
		}(BasicFilter));
		exports.BasicFilterWithKeys = BasicFilterWithKeys;
		var AdvancedFilter = /** @class */ (function (_super) {
		    __extends(AdvancedFilter, _super);
		    function AdvancedFilter(target, logicalOperator) {
		        var conditions = [];
		        for (var _i = 2; _i < arguments.length; _i++) {
		            conditions[_i - 2] = arguments[_i];
		        }
		        var _this = _super.call(this, target, FilterType.Advanced) || this;
		        _this.schemaUrl = AdvancedFilter.schemaUrl;
		        // Guard statements
		        if (typeof logicalOperator !== "string" || logicalOperator.length === 0) {
		            // TODO: It would be nicer to list out the possible logical operators.
		            throw new Error("logicalOperator must be a valid operator, You passed: " + logicalOperator);
		        }
		        _this.logicalOperator = logicalOperator;
		        var extractedConditions;
		        /**
		         * Accept conditions as array instead of as individual arguments
		         * new AdvancedFilter('a', 'b', "And", { value: 1, operator: "Equals" }, { value: 2, operator: "IsGreaterThan" });
		         * new AdvancedFilter('a', 'b', "And", [{ value: 1, operator: "Equals" }, { value: 2, operator: "IsGreaterThan" }]);
		         */
		        if (Array.isArray(conditions[0])) {
		            extractedConditions = conditions[0];
		        }
		        else {
		            extractedConditions = conditions;
		        }
		        if (extractedConditions.length === 0) {
		            throw new Error("conditions must be a non-empty array. You passed: " + conditions);
		        }
		        if (extractedConditions.length > 2) {
		            throw new Error("AdvancedFilters may not have more than two conditions. You passed: " + conditions.length);
		        }
		        if (extractedConditions.length === 1 && logicalOperator !== "And") {
		            throw new Error("Logical Operator must be \"And\" when there is only one condition provided");
		        }
		        _this.conditions = extractedConditions;
		        return _this;
		    }
		    AdvancedFilter.prototype.toJSON = function () {
		        var filter = _super.prototype.toJSON.call(this);
		        filter.logicalOperator = this.logicalOperator;
		        filter.conditions = this.conditions;
		        return filter;
		    };
		    AdvancedFilter.schemaUrl = "http://powerbi.com/product/schema#advanced";
		    return AdvancedFilter;
		}(Filter));
		exports.AdvancedFilter = AdvancedFilter;
		function isFilterKeyColumnsTarget(target) {
		    return isColumn(target) && !!target.keys;
		}
		exports.isFilterKeyColumnsTarget = isFilterKeyColumnsTarget;
		function isBasicFilterWithKeys(filter) {
		    return getFilterType(filter) === FilterType.Basic && !!filter.keyValues;
		}
		exports.isBasicFilterWithKeys = isBasicFilterWithKeys;
		function getFilterType(filter) {
		    if (filter.filterType) {
		        return filter.filterType;
		    }
		    var basicFilter = filter;
		    var advancedFilter = filter;
		    if ((typeof basicFilter.operator === "string")
		        && (Array.isArray(basicFilter.values))) {
		        return FilterType.Basic;
		    }
		    else if ((typeof advancedFilter.logicalOperator === "string")
		        && (Array.isArray(advancedFilter.conditions))) {
		        return FilterType.Advanced;
		    }
		    else {
		        return FilterType.Unknown;
		    }
		}
		exports.getFilterType = getFilterType;
		function isMeasure(arg) {
		    return arg.table !== undefined && arg.measure !== undefined;
		}
		exports.isMeasure = isMeasure;
		function isColumn(arg) {
		    return arg.table !== undefined && arg.column !== undefined;
		}
		exports.isColumn = isColumn;
		function isHierarchy(arg) {
		    return arg.table !== undefined && arg.hierarchy !== undefined && arg.hierarchyLevel !== undefined;
		}
		exports.isHierarchy = isHierarchy;
		var QnaMode;
		(function (QnaMode) {
		    QnaMode[QnaMode["Interactive"] = 0] = "Interactive";
		    QnaMode[QnaMode["ResultOnly"] = 1] = "ResultOnly";
		})(QnaMode = exports.QnaMode || (exports.QnaMode = {}));
		var ExportDataType;
		(function (ExportDataType) {
		    ExportDataType[ExportDataType["Summarized"] = 0] = "Summarized";
		    ExportDataType[ExportDataType["Underlying"] = 1] = "Underlying";
		})(ExportDataType = exports.ExportDataType || (exports.ExportDataType = {}));
		var BookmarksPlayMode;
		(function (BookmarksPlayMode) {
		    BookmarksPlayMode[BookmarksPlayMode["Off"] = 0] = "Off";
		    BookmarksPlayMode[BookmarksPlayMode["Presentation"] = 1] = "Presentation";
		})(BookmarksPlayMode = exports.BookmarksPlayMode || (exports.BookmarksPlayMode = {}));
		function normalizeError(error) {
		    var message = error.message;
		    if (!message) {
		        message = error.path + " is invalid. Not meeting " + error.keyword + " constraint";
		    }
		    return {
		        message: message
		    };
		}
		function validatePlayBookmarkRequest(input) {
		    var errors = exports.Validators.playBookmarkRequestValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validatePlayBookmarkRequest = validatePlayBookmarkRequest;
		function validateAddBookmarkRequest(input) {
		    var errors = exports.Validators.addBookmarkRequestValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateAddBookmarkRequest = validateAddBookmarkRequest;
		function validateApplyBookmarkByNameRequest(input) {
		    var errors = exports.Validators.applyBookmarkByNameRequestValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateApplyBookmarkByNameRequest = validateApplyBookmarkByNameRequest;
		function validateApplyBookmarkStateRequest(input) {
		    var errors = exports.Validators.applyBookmarkStateRequestValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateApplyBookmarkStateRequest = validateApplyBookmarkStateRequest;
		function validateSettings(input) {
		    var errors = exports.Validators.settingsValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateSettings = validateSettings;
		function validateCustomPageSize(input) {
		    var errors = exports.Validators.customPageSizeValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateCustomPageSize = validateCustomPageSize;
		function validateExtension(input) {
		    var errors = exports.Validators.extentionValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateExtension = validateExtension;
		function validateReportLoad(input) {
		    var errors = exports.Validators.reportLoadValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateReportLoad = validateReportLoad;
		function validateCreateReport(input) {
		    var errors = exports.Validators.reportCreateValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateCreateReport = validateCreateReport;
		function validateDashboardLoad(input) {
		    var errors = exports.Validators.dashboardLoadValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateDashboardLoad = validateDashboardLoad;
		function validateTileLoad(input) {
		    var errors = exports.Validators.tileLoadValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateTileLoad = validateTileLoad;
		function validatePage(input) {
		    var errors = exports.Validators.pageValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validatePage = validatePage;
		function validateFilter(input) {
		    var errors = exports.Validators.filtersValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateFilter = validateFilter;
		function validateSaveAsParameters(input) {
		    var errors = exports.Validators.saveAsParametersValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateSaveAsParameters = validateSaveAsParameters;
		function validateLoadQnaConfiguration(input) {
		    var errors = exports.Validators.loadQnaValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateLoadQnaConfiguration = validateLoadQnaConfiguration;
		function validateQnaInterpretInputData(input) {
		    var errors = exports.Validators.qnaInterpretInputDataValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateQnaInterpretInputData = validateQnaInterpretInputData;
		function validateExportDataRequest(input) {
		    var errors = exports.Validators.exportDataRequestValidator.validate(input);
		    return errors ? errors.map(normalizeError) : undefined;
		}
		exports.validateExportDataRequest = validateExportDataRequest;
	
	
	/***/ }),
	/* 1 */
	/***/ (function(module, exports, __webpack_require__) {
	
		Object.defineProperty(exports, "__esModule", { value: true });
		var typeValidator_1 = __webpack_require__(2);
		var extensionsValidator_1 = __webpack_require__(3);
		var settingsValidator_1 = __webpack_require__(5);
		var bookmarkValidator_1 = __webpack_require__(6);
		var filtersValidator_1 = __webpack_require__(7);
		var fieldRequiredValidator_1 = __webpack_require__(8);
		var anyOfValidator_1 = __webpack_require__(9);
		var reportLoadValidator_1 = __webpack_require__(10);
		var reportCreateValidator_1 = __webpack_require__(11);
		var dashboardLoadValidator_1 = __webpack_require__(12);
		var tileLoadValidator_1 = __webpack_require__(13);
		var pageValidator_1 = __webpack_require__(14);
		var qnaValidator_1 = __webpack_require__(15);
		var saveAsParametersValidator_1 = __webpack_require__(16);
		var mapValidator_1 = __webpack_require__(17);
		var layoutValidator_1 = __webpack_require__(18);
		var exportDataValidator_1 = __webpack_require__(19);
		exports.Validators = {
		    advancedFilterTypeValidator: new typeValidator_1.EnumValidator([0]),
		    advancedFilterValidator: new filtersValidator_1.AdvancedFilterValidator(),
		    anyArrayValidator: new typeValidator_1.ArrayValidator([new anyOfValidator_1.AnyOfValidator([new typeValidator_1.StringValidator(), new typeValidator_1.NumberValidator(), new typeValidator_1.BooleanValidator()])]),
		    anyFilterValidator: new anyOfValidator_1.AnyOfValidator([new filtersValidator_1.BasicFilterValidator(), new filtersValidator_1.AdvancedFilterValidator(), new filtersValidator_1.IncludeExcludeFilterValidator(), new filtersValidator_1.NotSupportedFilterValidator(), new filtersValidator_1.RelativeDateFilterValidator(), new filtersValidator_1.TopNFilterValidator()]),
		    anyValueValidator: new anyOfValidator_1.AnyOfValidator([new typeValidator_1.StringValidator(), new typeValidator_1.NumberValidator(), new typeValidator_1.BooleanValidator()]),
		    basicFilterTypeValidator: new typeValidator_1.EnumValidator([1]),
		    basicFilterValidator: new filtersValidator_1.BasicFilterValidator(),
		    playBookmarkRequestValidator: new bookmarkValidator_1.PlayBookmarkRequestValidator(),
		    addBookmarkRequestValidator: new bookmarkValidator_1.AddBookmarkRequestValidator(),
		    applyBookmarkByNameRequestValidator: new bookmarkValidator_1.ApplyBookmarkByNameRequestValidator(),
		    applyBookmarkStateRequestValidator: new bookmarkValidator_1.ApplyBookmarkStateRequestValidator(),
		    applyBookmarkValidator: new anyOfValidator_1.AnyOfValidator([new bookmarkValidator_1.ApplyBookmarkByNameRequestValidator(), new bookmarkValidator_1.ApplyBookmarkStateRequestValidator()]),
		    backgroundValidator: new typeValidator_1.EnumValidator([0, 1]),
		    booleanArrayValidator: new typeValidator_1.BooleanArrayValidator(),
		    booleanValidator: new typeValidator_1.BooleanValidator(),
		    commandExtensionValidator: new extensionsValidator_1.CommandExtensionValidator(),
		    conditionItemValidator: new filtersValidator_1.ConditionItemValidator(),
		    customLayoutValidator: new layoutValidator_1.CustomLayoutValidator(),
		    customLayoutDisplayOptionValidator: new typeValidator_1.EnumValidator([0, 1, 2]),
		    customPageSizeValidator: new pageValidator_1.CustomPageSizeValidator(),
		    dashboardLoadValidator: new dashboardLoadValidator_1.DashboardLoadValidator(),
		    displayStateModeValidator: new typeValidator_1.EnumValidator([0, 1]),
		    displayStateValidator: new layoutValidator_1.DisplayStateValidator(),
		    exportDataRequestValidator: new exportDataValidator_1.ExportDataRequestValidator(),
		    extensionPointsValidator: new extensionsValidator_1.ExtensionPointsValidator(),
		    extentionArrayValidator: new typeValidator_1.ArrayValidator([new extensionsValidator_1.ExtensionValidator()]),
		    extentionValidator: new extensionsValidator_1.ExtensionValidator(),
		    fieldRequiredValidator: new fieldRequiredValidator_1.FieldRequiredValidator(),
		    filterColumnTargetValidator: new filtersValidator_1.FilterColumnTargetValidator(),
		    filterConditionsValidator: new typeValidator_1.ArrayValidator([new filtersValidator_1.ConditionItemValidator()]),
		    filterHierarchyTargetValidator: new filtersValidator_1.FilterHierarchyTargetValidator(),
		    filterMeasureTargetValidator: new filtersValidator_1.FilterMeasureTargetValidator(),
		    filterTargetValidator: new anyOfValidator_1.AnyOfValidator([new filtersValidator_1.FilterColumnTargetValidator(), new filtersValidator_1.FilterHierarchyTargetValidator(), new filtersValidator_1.FilterMeasureTargetValidator()]),
		    filtersArrayValidator: new typeValidator_1.ArrayValidator([new anyOfValidator_1.AnyOfValidator([new filtersValidator_1.BasicFilterValidator(), new filtersValidator_1.AdvancedFilterValidator(), new filtersValidator_1.RelativeDateFilterValidator()])]),
		    filtersValidator: new filtersValidator_1.FilterValidator(),
		    includeExcludeFilterValidator: new filtersValidator_1.IncludeExcludeFilterValidator(),
		    includeExludeFilterTypeValidator: new typeValidator_1.EnumValidator([3]),
		    layoutTypeValidator: new typeValidator_1.EnumValidator([0, 1, 2, 3]),
		    loadQnaValidator: new qnaValidator_1.LoadQnaValidator(),
		    menuExtensionValidator: new extensionsValidator_1.MenuExtensionValidator(),
		    notSupportedFilterTypeValidator: new typeValidator_1.EnumValidator([2]),
		    notSupportedFilterValidator: new filtersValidator_1.NotSupportedFilterValidator(),
		    numberArrayValidator: new typeValidator_1.NumberArrayValidator(),
		    numberValidator: new typeValidator_1.NumberValidator(),
		    pageLayoutValidator: new mapValidator_1.MapValidator([new typeValidator_1.StringValidator()], [new layoutValidator_1.VisualLayoutValidator()]),
		    pageSizeTypeValidator: new typeValidator_1.EnumValidator([0, 1, 2, 3, 4, 5]),
		    pageSizeValidator: new pageValidator_1.PageSizeValidator(),
		    pageValidator: new pageValidator_1.PageValidator(),
		    pageViewFieldValidator: new pageValidator_1.PageViewFieldValidator(),
		    pagesLayoutValidator: new mapValidator_1.MapValidator([new typeValidator_1.StringValidator()], [new layoutValidator_1.PageLayoutValidator()]),
		    permissionsValidator: new typeValidator_1.EnumValidator([0, 1, 2, 4, 7]),
		    qnaInterpretInputDataValidator: new qnaValidator_1.QnaInterpretInputDataValidator(),
		    qnaSettingValidator: new qnaValidator_1.QnaSettingsValidator(),
		    relativeDateFilterOperatorValidator: new typeValidator_1.EnumValidator([0, 1, 2]),
		    relativeDateFilterTimeUnitTypeValidator: new typeValidator_1.EnumValidator([0, 1, 2, 3, 4, 5, 6]),
		    relativeDateFilterTypeValidator: new typeValidator_1.EnumValidator([4]),
		    relativeDateFilterValidator: new filtersValidator_1.RelativeDateFilterValidator(),
		    reportCreateValidator: new reportCreateValidator_1.ReportCreateValidator(),
		    reportLoadValidator: new reportLoadValidator_1.ReportLoadValidator(),
		    saveAsParametersValidator: new saveAsParametersValidator_1.SaveAsParametersValidator(),
		    settingsValidator: new settingsValidator_1.SettingsValidator(),
		    stringArrayValidator: new typeValidator_1.StringArrayValidator(),
		    stringValidator: new typeValidator_1.StringValidator(),
		    tileLoadValidator: new tileLoadValidator_1.TileLoadValidator(),
		    tokenTypeValidator: new typeValidator_1.EnumValidator([0, 1]),
		    topNFilterTypeValidator: new typeValidator_1.EnumValidator([5]),
		    topNFilterValidator: new filtersValidator_1.TopNFilterValidator(),
		    viewModeValidator: new typeValidator_1.EnumValidator([0, 1]),
		    visualLayoutValidator: new layoutValidator_1.VisualLayoutValidator(),
		};
	
	
	/***/ }),
	/* 2 */
	/***/ (function(module, exports) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var ObjectValidator = /** @class */ (function () {
		    function ObjectValidator() {
		    }
		    ObjectValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        if (typeof input !== "object" || Array.isArray(input)) {
		            return [{
		                    message: field !== undefined ? field + " must be an object" : "input must be an object",
		                    path: path,
		                    keyword: "type"
		                }];
		        }
		        return null;
		    };
		    return ObjectValidator;
		}());
		exports.ObjectValidator = ObjectValidator;
		var ArrayValidator = /** @class */ (function () {
		    function ArrayValidator(itemValidators) {
		        this.itemValidators = itemValidators;
		    }
		    ArrayValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        if (!(Array.isArray(input))) {
		            return [{
		                    message: field + " property is invalid",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "type"
		                }];
		        }
		        for (var i = 0; i < input.length; i++) {
		            var fieldsPath = (path ? path + "." : "") + field + "." + i;
		            for (var _i = 0, _a = this.itemValidators; _i < _a.length; _i++) {
		                var validator = _a[_i];
		                var errors = validator.validate(input[i], fieldsPath, field);
		                if (errors) {
		                    return [{
		                            message: field + " property is invalid",
		                            path: (path ? path + "." : "") + field,
		                            keyword: "type"
		                        }];
		                }
		            }
		        }
		        return null;
		    };
		    return ArrayValidator;
		}());
		exports.ArrayValidator = ArrayValidator;
		var TypeValidator = /** @class */ (function () {
		    function TypeValidator(expectedType) {
		        this.expectedType = expectedType;
		    }
		    TypeValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        if (!(typeof input === this.expectedType)) {
		            return [{
		                    message: field + " must be a " + this.expectedType,
		                    path: (path ? path + "." : "") + field,
		                    keyword: "type"
		                }];
		        }
		        return null;
		    };
		    return TypeValidator;
		}());
		exports.TypeValidator = TypeValidator;
		var StringValidator = /** @class */ (function (_super) {
		    __extends(StringValidator, _super);
		    function StringValidator() {
		        return _super.call(this, "string") || this;
		    }
		    return StringValidator;
		}(TypeValidator));
		exports.StringValidator = StringValidator;
		var BooleanValidator = /** @class */ (function (_super) {
		    __extends(BooleanValidator, _super);
		    function BooleanValidator() {
		        return _super.call(this, "boolean") || this;
		    }
		    return BooleanValidator;
		}(TypeValidator));
		exports.BooleanValidator = BooleanValidator;
		var NumberValidator = /** @class */ (function (_super) {
		    __extends(NumberValidator, _super);
		    function NumberValidator() {
		        return _super.call(this, "number") || this;
		    }
		    return NumberValidator;
		}(TypeValidator));
		exports.NumberValidator = NumberValidator;
		var ValueValidator = /** @class */ (function () {
		    function ValueValidator(possibleValues) {
		        this.possibleValues = possibleValues;
		    }
		    ValueValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        if (this.possibleValues.indexOf(input) < 0) {
		            return [{
		                    message: field + " property is invalid",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "invalid"
		                }];
		        }
		        return null;
		    };
		    return ValueValidator;
		}());
		exports.ValueValidator = ValueValidator;
		var EnumValidator = /** @class */ (function (_super) {
		    __extends(EnumValidator, _super);
		    function EnumValidator(possibleValues) {
		        var _this = _super.call(this) || this;
		        _this.possibleValues = possibleValues;
		        return _this;
		    }
		    EnumValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var valueValidator = new ValueValidator(this.possibleValues);
		        return valueValidator.validate(input, path, field);
		    };
		    return EnumValidator;
		}(NumberValidator));
		exports.EnumValidator = EnumValidator;
		var StringArrayValidator = /** @class */ (function (_super) {
		    __extends(StringArrayValidator, _super);
		    function StringArrayValidator() {
		        return _super.call(this, [new StringValidator()]) || this;
		    }
		    StringArrayValidator.prototype.validate = function (input, path, field) {
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return [{
		                    message: field + " must be an array of strings",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "type"
		                }];
		        }
		        return null;
		    };
		    return StringArrayValidator;
		}(ArrayValidator));
		exports.StringArrayValidator = StringArrayValidator;
		var BooleanArrayValidator = /** @class */ (function (_super) {
		    __extends(BooleanArrayValidator, _super);
		    function BooleanArrayValidator() {
		        return _super.call(this, [new BooleanValidator()]) || this;
		    }
		    BooleanArrayValidator.prototype.validate = function (input, path, field) {
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return [{
		                    message: field + " must be an array of booleans",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "type"
		                }];
		        }
		        return null;
		    };
		    return BooleanArrayValidator;
		}(ArrayValidator));
		exports.BooleanArrayValidator = BooleanArrayValidator;
		var NumberArrayValidator = /** @class */ (function (_super) {
		    __extends(NumberArrayValidator, _super);
		    function NumberArrayValidator() {
		        return _super.call(this, [new NumberValidator()]) || this;
		    }
		    NumberArrayValidator.prototype.validate = function (input, path, field) {
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return [{
		                    message: field + " must be an array of numbers",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "type"
		                }];
		        }
		        return null;
		    };
		    return NumberArrayValidator;
		}(ArrayValidator));
		exports.NumberArrayValidator = NumberArrayValidator;
	
	
	/***/ }),
	/* 3 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var MenuExtensionValidator = /** @class */ (function (_super) {
		    __extends(MenuExtensionValidator, _super);
		    function MenuExtensionValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    MenuExtensionValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "title",
		                validators: [validator_1.Validators.stringValidator]
		            },
		            {
		                field: "icon",
		                validators: [validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return MenuExtensionValidator;
		}(typeValidator_1.ObjectValidator));
		exports.MenuExtensionValidator = MenuExtensionValidator;
		var ExtensionPointsValidator = /** @class */ (function (_super) {
		    __extends(ExtensionPointsValidator, _super);
		    function ExtensionPointsValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ExtensionPointsValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "visualContextMenu",
		                validators: [validator_1.Validators.menuExtensionValidator]
		            },
		            {
		                field: "visualOptionsMenu",
		                validators: [validator_1.Validators.menuExtensionValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ExtensionPointsValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ExtensionPointsValidator = ExtensionPointsValidator;
		var ExtensionItemValidator = /** @class */ (function (_super) {
		    __extends(ExtensionItemValidator, _super);
		    function ExtensionItemValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ExtensionItemValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "name",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "extend",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.extensionPointsValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ExtensionItemValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ExtensionItemValidator = ExtensionItemValidator;
		var CommandExtensionValidator = /** @class */ (function (_super) {
		    __extends(CommandExtensionValidator, _super);
		    function CommandExtensionValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    CommandExtensionValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "title",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "icon",
		                validators: [validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return CommandExtensionValidator;
		}(ExtensionItemValidator));
		exports.CommandExtensionValidator = CommandExtensionValidator;
		var ExtensionValidator = /** @class */ (function (_super) {
		    __extends(ExtensionValidator, _super);
		    function ExtensionValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ExtensionValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "command",
		                validators: [validator_1.Validators.commandExtensionValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ExtensionValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ExtensionValidator = ExtensionValidator;
	
	
	/***/ }),
	/* 4 */
	/***/ (function(module, exports) {
	
		Object.defineProperty(exports, "__esModule", { value: true });
		var MultipleFieldsValidator = /** @class */ (function () {
		    function MultipleFieldsValidator(fieldValidatorsPairs) {
		        this.fieldValidatorsPairs = fieldValidatorsPairs;
		    }
		    MultipleFieldsValidator.prototype.validate = function (input, path, field) {
		        if (!this.fieldValidatorsPairs) {
		            return null;
		        }
		        var fieldsPath = path ? path + "." + field : field;
		        for (var _i = 0, _a = this.fieldValidatorsPairs; _i < _a.length; _i++) {
		            var fieldValidators = _a[_i];
		            for (var _b = 0, _c = fieldValidators.validators; _b < _c.length; _b++) {
		                var validator = _c[_b];
		                var errors = validator.validate(input[fieldValidators.field], fieldsPath, fieldValidators.field);
		                if (errors) {
		                    return errors;
		                }
		            }
		        }
		        return null;
		    };
		    return MultipleFieldsValidator;
		}());
		exports.MultipleFieldsValidator = MultipleFieldsValidator;
	
	
	/***/ }),
	/* 5 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var SettingsValidator = /** @class */ (function (_super) {
		    __extends(SettingsValidator, _super);
		    function SettingsValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    SettingsValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "filterPaneEnabled",
		                validators: [validator_1.Validators.booleanValidator]
		            },
		            {
		                field: "navContentPaneEnabled",
		                validators: [validator_1.Validators.booleanValidator]
		            },
		            {
		                field: "bookmarksPaneEnabled",
		                validators: [validator_1.Validators.booleanValidator]
		            },
		            {
		                field: "useCustomSaveAsDialog",
		                validators: [validator_1.Validators.booleanValidator]
		            },
		            {
		                field: "extensions",
		                validators: [validator_1.Validators.extentionArrayValidator]
		            },
		            {
		                field: "layoutType",
		                validators: [validator_1.Validators.layoutTypeValidator]
		            },
		            {
		                field: "customLayout",
		                validators: [validator_1.Validators.customLayoutValidator]
		            },
		            {
		                field: "background",
		                validators: [validator_1.Validators.backgroundValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return SettingsValidator;
		}(typeValidator_1.ObjectValidator));
		exports.SettingsValidator = SettingsValidator;
	
	
	/***/ }),
	/* 6 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var PlayBookmarkRequestValidator = /** @class */ (function (_super) {
		    __extends(PlayBookmarkRequestValidator, _super);
		    function PlayBookmarkRequestValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    PlayBookmarkRequestValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "playMode",
		                validators: [validator_1.Validators.fieldRequiredValidator, new typeValidator_1.EnumValidator([0, 1])]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return PlayBookmarkRequestValidator;
		}(typeValidator_1.ObjectValidator));
		exports.PlayBookmarkRequestValidator = PlayBookmarkRequestValidator;
		var AddBookmarkRequestValidator = /** @class */ (function (_super) {
		    __extends(AddBookmarkRequestValidator, _super);
		    function AddBookmarkRequestValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    AddBookmarkRequestValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "state",
		                validators: [validator_1.Validators.stringValidator]
		            },
		            {
		                field: "displayName",
		                validators: [validator_1.Validators.stringValidator]
		            },
		            {
		                field: "apply",
		                validators: [validator_1.Validators.booleanValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return AddBookmarkRequestValidator;
		}(typeValidator_1.ObjectValidator));
		exports.AddBookmarkRequestValidator = AddBookmarkRequestValidator;
		var ApplyBookmarkByNameRequestValidator = /** @class */ (function (_super) {
		    __extends(ApplyBookmarkByNameRequestValidator, _super);
		    function ApplyBookmarkByNameRequestValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ApplyBookmarkByNameRequestValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "name",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ApplyBookmarkByNameRequestValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ApplyBookmarkByNameRequestValidator = ApplyBookmarkByNameRequestValidator;
		var ApplyBookmarkStateRequestValidator = /** @class */ (function (_super) {
		    __extends(ApplyBookmarkStateRequestValidator, _super);
		    function ApplyBookmarkStateRequestValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ApplyBookmarkStateRequestValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "state",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ApplyBookmarkStateRequestValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ApplyBookmarkStateRequestValidator = ApplyBookmarkStateRequestValidator;
	
	
	/***/ }),
	/* 7 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var FilterColumnTargetValidator = /** @class */ (function (_super) {
		    __extends(FilterColumnTargetValidator, _super);
		    function FilterColumnTargetValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    FilterColumnTargetValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "table",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "column",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return FilterColumnTargetValidator;
		}(typeValidator_1.ObjectValidator));
		exports.FilterColumnTargetValidator = FilterColumnTargetValidator;
		var FilterHierarchyTargetValidator = /** @class */ (function (_super) {
		    __extends(FilterHierarchyTargetValidator, _super);
		    function FilterHierarchyTargetValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    FilterHierarchyTargetValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "table",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "hierarchy",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "hierarchyLevel",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return FilterHierarchyTargetValidator;
		}(typeValidator_1.ObjectValidator));
		exports.FilterHierarchyTargetValidator = FilterHierarchyTargetValidator;
		var FilterMeasureTargetValidator = /** @class */ (function (_super) {
		    __extends(FilterMeasureTargetValidator, _super);
		    function FilterMeasureTargetValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    FilterMeasureTargetValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "table",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "measure",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return FilterMeasureTargetValidator;
		}(typeValidator_1.ObjectValidator));
		exports.FilterMeasureTargetValidator = FilterMeasureTargetValidator;
		var BasicFilterValidator = /** @class */ (function (_super) {
		    __extends(BasicFilterValidator, _super);
		    function BasicFilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    BasicFilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "target",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.filterTargetValidator]
		            },
		            {
		                field: "operator",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "values",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.anyArrayValidator]
		            },
		            {
		                field: "filterType",
		                validators: [validator_1.Validators.basicFilterTypeValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return BasicFilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.BasicFilterValidator = BasicFilterValidator;
		var AdvancedFilterValidator = /** @class */ (function (_super) {
		    __extends(AdvancedFilterValidator, _super);
		    function AdvancedFilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    AdvancedFilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "target",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.filterTargetValidator]
		            },
		            {
		                field: "logicalOperator",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "conditions",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.filterConditionsValidator]
		            },
		            {
		                field: "filterType",
		                validators: [validator_1.Validators.advancedFilterTypeValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return AdvancedFilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.AdvancedFilterValidator = AdvancedFilterValidator;
		var RelativeDateFilterValidator = /** @class */ (function (_super) {
		    __extends(RelativeDateFilterValidator, _super);
		    function RelativeDateFilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    RelativeDateFilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "target",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.filterTargetValidator]
		            },
		            {
		                field: "operator",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.relativeDateFilterOperatorValidator]
		            },
		            {
		                field: "timeUnitsCount",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.numberValidator]
		            },
		            {
		                field: "timeUnitType",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.relativeDateFilterTimeUnitTypeValidator]
		            },
		            {
		                field: "includeToday",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.booleanValidator]
		            },
		            {
		                field: "filterType",
		                validators: [validator_1.Validators.relativeDateFilterTypeValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return RelativeDateFilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.RelativeDateFilterValidator = RelativeDateFilterValidator;
		var TopNFilterValidator = /** @class */ (function (_super) {
		    __extends(TopNFilterValidator, _super);
		    function TopNFilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    TopNFilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "target",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.filterTargetValidator]
		            },
		            {
		                field: "operator",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "itemCount",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.numberValidator]
		            },
		            {
		                field: "filterType",
		                validators: [validator_1.Validators.topNFilterTypeValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return TopNFilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.TopNFilterValidator = TopNFilterValidator;
		var NotSupportedFilterValidator = /** @class */ (function (_super) {
		    __extends(NotSupportedFilterValidator, _super);
		    function NotSupportedFilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    NotSupportedFilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "target",
		                validators: [validator_1.Validators.filterTargetValidator]
		            },
		            {
		                field: "message",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "notSupportedTypeName",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "filterType",
		                validators: [validator_1.Validators.notSupportedFilterTypeValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return NotSupportedFilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.NotSupportedFilterValidator = NotSupportedFilterValidator;
		var IncludeExcludeFilterValidator = /** @class */ (function (_super) {
		    __extends(IncludeExcludeFilterValidator, _super);
		    function IncludeExcludeFilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    IncludeExcludeFilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "target",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.filterTargetValidator]
		            },
		            {
		                field: "isExclude",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.booleanValidator]
		            },
		            {
		                field: "values",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.anyArrayValidator]
		            },
		            {
		                field: "filterType",
		                validators: [validator_1.Validators.includeExludeFilterTypeValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return IncludeExcludeFilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.IncludeExcludeFilterValidator = IncludeExcludeFilterValidator;
		var FilterValidator = /** @class */ (function (_super) {
		    __extends(FilterValidator, _super);
		    function FilterValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    FilterValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        return validator_1.Validators.anyFilterValidator.validate(input, path, field);
		    };
		    return FilterValidator;
		}(typeValidator_1.ObjectValidator));
		exports.FilterValidator = FilterValidator;
		var ConditionItemValidator = /** @class */ (function (_super) {
		    __extends(ConditionItemValidator, _super);
		    function ConditionItemValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ConditionItemValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "value",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.anyValueValidator]
		            },
		            {
		                field: "operator",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ConditionItemValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ConditionItemValidator = ConditionItemValidator;
	
	
	/***/ }),
	/* 8 */
	/***/ (function(module, exports) {
	
		Object.defineProperty(exports, "__esModule", { value: true });
		var FieldRequiredValidator = /** @class */ (function () {
		    function FieldRequiredValidator() {
		    }
		    FieldRequiredValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return [{
		                    message: field + " is required",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "required"
		                }];
		        }
		        return null;
		    };
		    return FieldRequiredValidator;
		}());
		exports.FieldRequiredValidator = FieldRequiredValidator;
	
	
	/***/ }),
	/* 9 */
	/***/ (function(module, exports) {
	
		Object.defineProperty(exports, "__esModule", { value: true });
		var AnyOfValidator = /** @class */ (function () {
		    function AnyOfValidator(validators) {
		        this.validators = validators;
		    }
		    AnyOfValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var valid = false;
		        for (var _i = 0, _a = this.validators; _i < _a.length; _i++) {
		            var validator = _a[_i];
		            var errors = validator.validate(input, path, field);
		            if (!errors) {
		                valid = true;
		                break;
		            }
		        }
		        if (!valid) {
		            return [{
		                    message: field + " property is invalid",
		                    path: (path ? path + "." : "") + field,
		                    keyword: "invalid"
		                }];
		        }
		        return null;
		    };
		    return AnyOfValidator;
		}());
		exports.AnyOfValidator = AnyOfValidator;
	
	
	/***/ }),
	/* 10 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var ReportLoadValidator = /** @class */ (function (_super) {
		    __extends(ReportLoadValidator, _super);
		    function ReportLoadValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ReportLoadValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "accessToken",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "id",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "settings",
		                validators: [validator_1.Validators.settingsValidator]
		            },
		            {
		                field: "pageName",
		                validators: [validator_1.Validators.stringValidator]
		            },
		            {
		                field: "filters",
		                validators: [validator_1.Validators.filtersArrayValidator]
		            },
		            {
		                field: "permissions",
		                validators: [validator_1.Validators.permissionsValidator]
		            },
		            {
		                field: "viewMode",
		                validators: [validator_1.Validators.viewModeValidator]
		            },
		            {
		                field: "tokenType",
		                validators: [validator_1.Validators.tokenTypeValidator]
		            },
		            {
		                field: "bookmark",
		                validators: [validator_1.Validators.applyBookmarkValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ReportLoadValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ReportLoadValidator = ReportLoadValidator;
	
	
	/***/ }),
	/* 11 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var ReportCreateValidator = /** @class */ (function (_super) {
		    __extends(ReportCreateValidator, _super);
		    function ReportCreateValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ReportCreateValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "accessToken",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "datasetId",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "tokenType",
		                validators: [validator_1.Validators.tokenTypeValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ReportCreateValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ReportCreateValidator = ReportCreateValidator;
	
	
	/***/ }),
	/* 12 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var DashboardLoadValidator = /** @class */ (function (_super) {
		    __extends(DashboardLoadValidator, _super);
		    function DashboardLoadValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    DashboardLoadValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "accessToken",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "id",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "pageView",
		                validators: [validator_1.Validators.pageViewFieldValidator]
		            },
		            {
		                field: "tokenType",
		                validators: [validator_1.Validators.tokenTypeValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return DashboardLoadValidator;
		}(typeValidator_1.ObjectValidator));
		exports.DashboardLoadValidator = DashboardLoadValidator;
	
	
	/***/ }),
	/* 13 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var TileLoadValidator = /** @class */ (function (_super) {
		    __extends(TileLoadValidator, _super);
		    function TileLoadValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    TileLoadValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "accessToken",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "id",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "dashboardId",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "pageView",
		                validators: [validator_1.Validators.stringValidator]
		            },
		            {
		                field: "tokenType",
		                validators: [validator_1.Validators.tokenTypeValidator]
		            },
		            {
		                field: "width",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "height",
		                validators: [validator_1.Validators.numberValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return TileLoadValidator;
		}(typeValidator_1.ObjectValidator));
		exports.TileLoadValidator = TileLoadValidator;
	
	
	/***/ }),
	/* 14 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var PageSizeValidator = /** @class */ (function (_super) {
		    __extends(PageSizeValidator, _super);
		    function PageSizeValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    PageSizeValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "type",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.pageSizeTypeValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return PageSizeValidator;
		}(typeValidator_1.ObjectValidator));
		exports.PageSizeValidator = PageSizeValidator;
		var CustomPageSizeValidator = /** @class */ (function (_super) {
		    __extends(CustomPageSizeValidator, _super);
		    function CustomPageSizeValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    CustomPageSizeValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "width",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "height",
		                validators: [validator_1.Validators.numberValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return CustomPageSizeValidator;
		}(PageSizeValidator));
		exports.CustomPageSizeValidator = CustomPageSizeValidator;
		var PageValidator = /** @class */ (function (_super) {
		    __extends(PageValidator, _super);
		    function PageValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    PageValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "name",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return PageValidator;
		}(typeValidator_1.ObjectValidator));
		exports.PageValidator = PageValidator;
		var PageViewFieldValidator = /** @class */ (function (_super) {
		    __extends(PageViewFieldValidator, _super);
		    function PageViewFieldValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    PageViewFieldValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var possibleValues = ["actualSize", "fitToWidth", "oneColumn"];
		        if (possibleValues.indexOf(input) < 0) {
		            return [{
		                    message: "pageView must be a string with one of the following values: \"actualSize\", \"fitToWidth\", \"oneColumn\""
		                }];
		        }
		        return null;
		    };
		    return PageViewFieldValidator;
		}(typeValidator_1.StringValidator));
		exports.PageViewFieldValidator = PageViewFieldValidator;
	
	
	/***/ }),
	/* 15 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var LoadQnaValidator = /** @class */ (function (_super) {
		    __extends(LoadQnaValidator, _super);
		    function LoadQnaValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    LoadQnaValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "accessToken",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		            {
		                field: "datasetIds",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringArrayValidator]
		            },
		            {
		                field: "question",
		                validators: [validator_1.Validators.stringValidator]
		            },
		            {
		                field: "viewMode",
		                validators: [validator_1.Validators.viewModeValidator]
		            },
		            {
		                field: "settings",
		                validators: [validator_1.Validators.qnaSettingValidator]
		            },
		            {
		                field: "tokenType",
		                validators: [validator_1.Validators.tokenTypeValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return LoadQnaValidator;
		}(typeValidator_1.ObjectValidator));
		exports.LoadQnaValidator = LoadQnaValidator;
		var QnaSettingsValidator = /** @class */ (function (_super) {
		    __extends(QnaSettingsValidator, _super);
		    function QnaSettingsValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    QnaSettingsValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "filterPaneEnabled",
		                validators: [validator_1.Validators.booleanValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return QnaSettingsValidator;
		}(typeValidator_1.ObjectValidator));
		exports.QnaSettingsValidator = QnaSettingsValidator;
		var QnaInterpretInputDataValidator = /** @class */ (function (_super) {
		    __extends(QnaInterpretInputDataValidator, _super);
		    function QnaInterpretInputDataValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    QnaInterpretInputDataValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "datasetIds",
		                validators: [validator_1.Validators.stringArrayValidator]
		            },
		            {
		                field: "question",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            },
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return QnaInterpretInputDataValidator;
		}(typeValidator_1.ObjectValidator));
		exports.QnaInterpretInputDataValidator = QnaInterpretInputDataValidator;
	
	
	/***/ }),
	/* 16 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var SaveAsParametersValidator = /** @class */ (function (_super) {
		    __extends(SaveAsParametersValidator, _super);
		    function SaveAsParametersValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    SaveAsParametersValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "name",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.stringValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return SaveAsParametersValidator;
		}(typeValidator_1.ObjectValidator));
		exports.SaveAsParametersValidator = SaveAsParametersValidator;
	
	
	/***/ }),
	/* 17 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var typeValidator_1 = __webpack_require__(2);
		var MapValidator = /** @class */ (function (_super) {
		    __extends(MapValidator, _super);
		    function MapValidator(keyValidators, valueValidators) {
		        var _this = _super.call(this) || this;
		        _this.keyValidators = keyValidators;
		        _this.valueValidators = valueValidators;
		        return _this;
		    }
		    MapValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        for (var key in input) {
		            if (input.hasOwnProperty(key)) {
		                var fieldsPath = (path ? path + "." : "") + field + "." + key;
		                for (var _i = 0, _a = this.keyValidators; _i < _a.length; _i++) {
		                    var keyValidator = _a[_i];
		                    errors = keyValidator.validate(key, fieldsPath, field);
		                    if (errors) {
		                        return errors;
		                    }
		                }
		                for (var _b = 0, _c = this.valueValidators; _b < _c.length; _b++) {
		                    var valueValidator = _c[_b];
		                    errors = valueValidator.validate(input[key], fieldsPath, field);
		                    if (errors) {
		                        return errors;
		                    }
		                }
		            }
		        }
		        return null;
		    };
		    return MapValidator;
		}(typeValidator_1.ObjectValidator));
		exports.MapValidator = MapValidator;
	
	
	/***/ }),
	/* 18 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var validator_1 = __webpack_require__(1);
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var CustomLayoutValidator = /** @class */ (function (_super) {
		    __extends(CustomLayoutValidator, _super);
		    function CustomLayoutValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    CustomLayoutValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "pageSize",
		                validators: [validator_1.Validators.pageSizeValidator]
		            },
		            {
		                field: "displayOption",
		                validators: [validator_1.Validators.customLayoutDisplayOptionValidator]
		            },
		            {
		                field: "pagesLayout",
		                validators: [validator_1.Validators.pagesLayoutValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return CustomLayoutValidator;
		}(typeValidator_1.ObjectValidator));
		exports.CustomLayoutValidator = CustomLayoutValidator;
		var VisualLayoutValidator = /** @class */ (function (_super) {
		    __extends(VisualLayoutValidator, _super);
		    function VisualLayoutValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    VisualLayoutValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "x",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "y",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "z",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "width",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "height",
		                validators: [validator_1.Validators.numberValidator]
		            },
		            {
		                field: "displayState",
		                validators: [validator_1.Validators.displayStateValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return VisualLayoutValidator;
		}(typeValidator_1.ObjectValidator));
		exports.VisualLayoutValidator = VisualLayoutValidator;
		var DisplayStateValidator = /** @class */ (function (_super) {
		    __extends(DisplayStateValidator, _super);
		    function DisplayStateValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    DisplayStateValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "mode",
		                validators: [validator_1.Validators.displayStateModeValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return DisplayStateValidator;
		}(typeValidator_1.ObjectValidator));
		exports.DisplayStateValidator = DisplayStateValidator;
		var PageLayoutValidator = /** @class */ (function (_super) {
		    __extends(PageLayoutValidator, _super);
		    function PageLayoutValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    PageLayoutValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "visualsLayout",
		                validators: [validator_1.Validators.fieldRequiredValidator, validator_1.Validators.pageLayoutValidator]
		            },
		            {
		                field: "defaultLayout",
		                validators: [validator_1.Validators.visualLayoutValidator]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return PageLayoutValidator;
		}(typeValidator_1.ObjectValidator));
		exports.PageLayoutValidator = PageLayoutValidator;
	
	
	/***/ }),
	/* 19 */
	/***/ (function(module, exports, __webpack_require__) {
	
		var __extends = (this && this.__extends) || (function () {
		    var extendStatics = Object.setPrototypeOf ||
		        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		    return function (d, b) {
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    };
		})();
		Object.defineProperty(exports, "__esModule", { value: true });
		var multipleFieldsValidator_1 = __webpack_require__(4);
		var typeValidator_1 = __webpack_require__(2);
		var ExportDataRequestValidator = /** @class */ (function (_super) {
		    __extends(ExportDataRequestValidator, _super);
		    function ExportDataRequestValidator() {
		        return _super !== null && _super.apply(this, arguments) || this;
		    }
		    ExportDataRequestValidator.prototype.validate = function (input, path, field) {
		        if (input == null) {
		            return null;
		        }
		        var errors = _super.prototype.validate.call(this, input, path, field);
		        if (errors) {
		            return errors;
		        }
		        var fields = [
		            {
		                field: "rows",
		                validators: [new typeValidator_1.NumberValidator()]
		            },
		            {
		                field: "exportDataType",
		                validators: [new typeValidator_1.EnumValidator([0, 1])]
		            }
		        ];
		        var multipleFieldsValidator = new multipleFieldsValidator_1.MultipleFieldsValidator(fields);
		        return multipleFieldsValidator.validate(input, path, field);
		    };
		    return ExportDataRequestValidator;
		}(typeValidator_1.ObjectValidator));
		exports.ExportDataRequestValidator = ExportDataRequestValidator;
	
	
	/***/ })
	/******/ ])
	});
	;
	//# sourceMappingURL=models.js.map

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var embed = __webpack_require__(2);
	var models = __webpack_require__(4);
	var utils = __webpack_require__(3);
	var page_1 = __webpack_require__(6);
	var defaults_1 = __webpack_require__(8);
	var bookmarksManager_1 = __webpack_require__(9);
	/**
	 * The Power BI Report embed component
	 *
	 * @export
	 * @class Report
	 * @extends {embed.Embed}
	 * @implements {IReportNode}
	 * @implements {IFilterable}
	 */
	var Report = (function (_super) {
	    __extends(Report, _super);
	    /**
	     * Creates an instance of a Power BI Report.
	     *
	     * @param {service.Service} service
	     * @param {HTMLElement} element
	     * @param {embed.IEmbedConfiguration} config
	     */
	    function Report(service, element, baseConfig, phasedRender, iframe) {
	        var config = baseConfig;
	        var filterPaneEnabled = (config.settings && config.settings.filterPaneEnabled) || !(element.getAttribute(Report.filterPaneEnabledAttribute) === "false");
	        var navContentPaneEnabled = (config.settings && config.settings.navContentPaneEnabled) || !(element.getAttribute(Report.navContentPaneEnabledAttribute) === "false");
	        var settings = utils.assign({
	            filterPaneEnabled: filterPaneEnabled,
	            navContentPaneEnabled: navContentPaneEnabled
	        }, config.settings);
	        var configCopy = utils.assign({ settings: settings }, config);
	        _super.call(this, service, element, configCopy, iframe, phasedRender);
	        this.loadPath = "/report/load";
	        this.phasedLoadPath = "/report/prepare";
	        Array.prototype.push.apply(this.allowedEvents, Report.allowedEvents);
	        this.bookmarksManager = new bookmarksManager_1.BookmarksManager(service, config, this.iframe);
	    }
	    /**
	     * Adds backwards compatibility for the previous load configuration, which used the reportId query parameter to specify the report ID
	     * (e.g. http://embedded.powerbi.com/appTokenReportEmbed?reportId=854846ed-2106-4dc2-bc58-eb77533bf2f1).
	     *
	     * By extracting the ID we can ensure that the ID is always explicitly provided as part of the load configuration.
	     *
	     * @static
	     * @param {string} url
	     * @returns {string}
	     */
	    Report.findIdFromEmbedUrl = function (url) {
	        var reportIdRegEx = /reportId="?([^&]+)"?/;
	        var reportIdMatch = url.match(reportIdRegEx);
	        var reportId;
	        if (reportIdMatch) {
	            reportId = reportIdMatch[1];
	        }
	        return reportId;
	    };
	    /**
	     * Render a preloaded report, using phased embedding API
	     *
	     * ```javascript
	     * // Load report
	     * var report = powerbi.load(element, config);
	     *
	     * ...
	     *
	     * // Render report
	     * report.render()
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    Report.prototype.render = function (config) {
	        return this.service.hpm.post("/report/render", config, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Gets filters that are applied at the report level.
	     *
	     * ```javascript
	     * // Get filters applied at report level
	     * report.getFilters()
	     *   .then(filters => {
	     *     ...
	     *   });
	     * ```
	     *
	     * @returns {Promise<models.IFilter[]>}
	     */
	    Report.prototype.getFilters = function () {
	        return this.service.hpm.get("/report/filters", { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Gets the report ID from the first available location: options, attribute, embed url.
	     *
	     * @returns {string}
	     */
	    Report.prototype.getId = function () {
	        var config = this.config;
	        var reportId = config.id || this.element.getAttribute(Report.reportIdAttribute) || Report.findIdFromEmbedUrl(config.embedUrl);
	        if (typeof reportId !== 'string' || reportId.length === 0) {
	            throw new Error("Report id is required, but it was not found. You must provide an id either as part of embed configuration or as attribute '" + Report.reportIdAttribute + "'.");
	        }
	        return reportId;
	    };
	    /**
	     * Gets the list of pages within the report.
	     *
	     * ```javascript
	     * report.getPages()
	     *  .then(pages => {
	     *      ...
	     *  });
	     * ```
	     *
	     * @returns {Promise<Page[]>}
	     */
	    Report.prototype.getPages = function () {
	        var _this = this;
	        return this.service.hpm.get('/report/pages', { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body
	                .map(function (page) {
	                return new page_1.Page(_this, page.name, page.displayName, page.isActive);
	            });
	        }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Creates an instance of a Page.
	     *
	     * Normally you would get Page objects by calling `report.getPages()`, but in the case
	     * that the page name is known and you want to perform an action on a page without having to retrieve it
	     * you can create it directly.
	     *
	     * Note: Because you are creating the page manually there is no guarantee that the page actually exists in the report, and subsequent requests could fail.
	     *
	     * ```javascript
	     * const page = report.page('ReportSection1');
	     * page.setActive();
	     * ```
	     *
	     * @param {string} name
	     * @param {string} [displayName]
	     * @param {boolean} [isActive]
	     * @returns {Page}
	     */
	    Report.prototype.page = function (name, displayName, isActive) {
	        return new page_1.Page(this, name, displayName, isActive);
	    };
	    /**
	     * Prints the active page of the report by invoking `window.print()` on the embed iframe component.
	     */
	    Report.prototype.print = function () {
	        return this.service.hpm.post('/report/print', null, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Removes all filters at the report level.
	     *
	     * ```javascript
	     * report.removeFilters();
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    Report.prototype.removeFilters = function () {
	        return this.setFilters([]);
	    };
	    /**
	     * Sets the active page of the report.
	     *
	     * ```javascript
	     * report.setPage("page2")
	     *  .catch(error => { ... });
	     * ```
	     *
	     * @param {string} pageName
	     * @returns {Promise<void>}
	     */
	    Report.prototype.setPage = function (pageName) {
	        var page = {
	            name: pageName,
	            displayName: null,
	            isActive: true
	        };
	        return this.service.hpm.put('/report/pages/active', page, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Sets filters at the report level.
	     *
	     * ```javascript
	     * const filters: [
	     *    ...
	     * ];
	     *
	     * report.setFilters(filters)
	     *  .catch(errors => {
	     *    ...
	     *  });
	     * ```
	     *
	     * @param {(models.IFilter[])} filters
	     * @returns {Promise<void>}
	     */
	    Report.prototype.setFilters = function (filters) {
	        return this.service.hpm.put("/report/filters", filters, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Updates visibility settings for the filter pane and the page navigation pane.
	     *
	     * ```javascript
	     * const newSettings = {
	     *   navContentPaneEnabled: true,
	     *   filterPaneEnabled: false
	     * };
	     *
	     * report.updateSettings(newSettings)
	     *   .catch(error => { ... });
	     * ```
	     *
	     * @param {models.ISettings} settings
	     * @returns {Promise<void>}
	     */
	    Report.prototype.updateSettings = function (settings) {
	        return this.service.hpm.patch('/report/settings', settings, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Validate load configuration.
	     */
	    Report.prototype.validate = function (config) {
	        return models.validateReportLoad(config);
	    };
	    /**
	     * Populate config for load config
	     *
	     * @param {IEmbedConfigurationBase}
	     * @returns {void}
	     */
	    Report.prototype.populateConfig = function (baseConfig) {
	        var config = baseConfig;
	        if (config.settings && (config.settings.layoutType === models.LayoutType.MobileLandscape || config.settings.layoutType === models.LayoutType.MobilePortrait))
	            config.embedUrl = utils.addParamToUrl(config.embedUrl, "isMobile", "true");
	        _super.prototype.populateConfig.call(this, config);
	        // TODO: Change when Object.assign is available.
	        var settings = utils.assign({}, defaults_1.Defaults.defaultSettings, config.settings);
	        config = utils.assign({ settings: settings }, config);
	        config.id = this.getId();
	        this.config = config;
	    };
	    /**
	     * Switch Report view mode.
	     *
	     * @returns {Promise<void>}
	     */
	    Report.prototype.switchMode = function (viewMode) {
	        var url = '/report/switchMode/' + viewMode;
	        return this.service.hpm.post(url, null, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	    * Refreshes data sources for the report.
	    *
	    * ```javascript
	    * report.refresh();
	    * ```
	    */
	    Report.prototype.refresh = function () {
	        return this.service.hpm.post('/report/refresh', null, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) {
	            return response.body;
	        })
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    Report.allowedEvents = ["filtersApplied", "pageChanged", "commandTriggered", "swipeStart", "swipeEnd", "bookmarkApplied"];
	    Report.reportIdAttribute = 'powerbi-report-id';
	    Report.filterPaneEnabledAttribute = 'powerbi-settings-filter-pane-enabled';
	    Report.navContentPaneEnabledAttribute = 'powerbi-settings-nav-content-pane-enabled';
	    Report.typeAttribute = 'powerbi-type';
	    Report.type = "Report";
	    return Report;
	}(embed.Embed));
	exports.Report = Report;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	var visualDescriptor_1 = __webpack_require__(7);
	var models = __webpack_require__(4);
	/**
	 * A Power BI report page
	 *
	 * @export
	 * @class Page
	 * @implements {IPageNode}
	 * @implements {IFilterable}
	 */
	var Page = (function () {
	    /**
	     * Creates an instance of a Power BI report page.
	     *
	     * @param {IReportNode} report
	     * @param {string} name
	     * @param {string} [displayName]
	     * @param {boolean} [isActivePage]
	     */
	    function Page(report, name, displayName, isActivePage) {
	        this.report = report;
	        this.name = name;
	        this.displayName = displayName;
	        this.isActive = isActivePage;
	    }
	    /**
	     * Gets all page level filters within the report.
	     *
	     * ```javascript
	     * page.getFilters()
	     *  .then(filters => { ... });
	     * ```
	     *
	     * @returns {(Promise<models.IFilter[]>)}
	     */
	    Page.prototype.getFilters = function () {
	        return this.report.service.hpm.get("/report/pages/" + this.name + "/filters", { uid: this.report.config.uniqueId }, this.report.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Removes all filters from this page of the report.
	     *
	     * ```javascript
	     * page.removeFilters();
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    Page.prototype.removeFilters = function () {
	        return this.setFilters([]);
	    };
	    /**
	     * Makes the current page the active page of the report.
	     *
	     * ```javascripot
	     * page.setActive();
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    Page.prototype.setActive = function () {
	        var page = {
	            name: this.name,
	            displayName: null,
	            isActive: true
	        };
	        return this.report.service.hpm.put('/report/pages/active', page, { uid: this.report.config.uniqueId }, this.report.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Sets all filters on the current page.
	     *
	     * ```javascript
	     * page.setFilters(filters);
	     *   .catch(errors => { ... });
	     * ```
	     *
	     * @param {(models.IFilter[])} filters
	     * @returns {Promise<void>}
	     */
	    Page.prototype.setFilters = function (filters) {
	        return this.report.service.hpm.put("/report/pages/" + this.name + "/filters", filters, { uid: this.report.config.uniqueId }, this.report.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Gets all the visuals on the page.
	     *
	     * ```javascript
	     * page.getVisuals()
	     *   .then(visuals => { ... });
	     * ```
	     *
	     * @returns {Promise<VisualDescriptor[]>}
	     */
	    Page.prototype.getVisuals = function () {
	        var _this = this;
	        return this.report.service.hpm.get("/report/pages/" + this.name + "/visuals", { uid: this.report.config.uniqueId }, this.report.iframe.contentWindow)
	            .then(function (response) {
	            return response.body
	                .map(function (visual) {
	                return new visualDescriptor_1.VisualDescriptor(_this, visual.name, visual.title, visual.type, visual.layout);
	            });
	        }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Checks if page has layout.
	     *
	     * ```javascript
	     * page.hasLayout(layoutType)
	     *  .then(hasLayout: boolean => { ... });
	     * ```
	     *
	     * @returns {(Promise<boolean>)}
	     */
	    Page.prototype.hasLayout = function (layoutType) {
	        var layoutTypeEnum = models.LayoutType[layoutType];
	        return this.report.service.hpm.get("/report/pages/" + this.name + "/layoutTypes/" + layoutTypeEnum, { uid: this.report.config.uniqueId }, this.report.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    return Page;
	}());
	exports.Page = Page;


/***/ }),
/* 7 */
/***/ (function(module, exports) {

	/**
	 * A Power BI visual within a page
	 *
	 * @export
	 * @class VisualDescriptor
	 * @implements {IVisualNode}
	 */
	var VisualDescriptor = (function () {
	    function VisualDescriptor(page, name, title, type, layout) {
	        this.name = name;
	        this.title = title;
	        this.type = type;
	        this.layout = layout;
	        this.page = page;
	    }
	    /**
	     * Gets all visual level filters of the current visual.
	     *
	     * ```javascript
	     * visual.getFilters()
	     *  .then(filters => { ... });
	     * ```
	     *
	     * @returns {(Promise<models.IFilter[]>)}
	     */
	    VisualDescriptor.prototype.getFilters = function () {
	        return this.page.report.service.hpm.get("/report/pages/" + this.page.name + "/visuals/" + this.name + "/filters", { uid: this.page.report.config.uniqueId }, this.page.report.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Removes all filters from the current visual.
	     *
	     * ```javascript
	     * visual.removeFilters();
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    VisualDescriptor.prototype.removeFilters = function () {
	        return this.setFilters([]);
	    };
	    /**
	     * Sets the filters on the current visual to 'filters'.
	     *
	     * ```javascript
	     * visual.setFilters(filters);
	     *   .catch(errors => { ... });
	     * ```
	     *
	     * @param {(models.IFilter[])} filters
	     * @returns {Promise<void>}
	     */
	    VisualDescriptor.prototype.setFilters = function (filters) {
	        return this.page.report.service.hpm.put("/report/pages/" + this.page.name + "/visuals/" + this.name + "/filters", filters, { uid: this.page.report.config.uniqueId }, this.page.report.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Exports Visual data.
	     * Can export up to 30K rows.
	     * @param rows: Optional. Default value is 30K, maximum value is 30K as well.
	     * @param exportDataType: Optional. Default is models.ExportDataType.Summarized.
	     * ```javascript
	     * visual.exportData()
	     *  .then(data => { ... });
	     * ```
	     *
	     * @returns {(Promise<string>)}
	     */
	    VisualDescriptor.prototype.exportData = function (exportDataType, rows) {
	        var exportDataRequestBody = {
	            rows: rows,
	            exportDataType: exportDataType
	        };
	        return this.page.report.service.hpm.post("/report/pages/" + this.page.name + "/visuals/" + this.name + "/exportData", exportDataRequestBody, { uid: this.page.report.config.uniqueId }, this.page.report.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    return VisualDescriptor;
	}());
	exports.VisualDescriptor = VisualDescriptor;


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	var Defaults = (function () {
	    function Defaults() {
	    }
	    Defaults.defaultSettings = {
	        filterPaneEnabled: true
	    };
	    Defaults.defaultQnaSettings = {
	        filterPaneEnabled: false
	    };
	    return Defaults;
	}());
	exports.Defaults = Defaults;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	/**
	 * Manages report bookmarks.
	 *
	 * @export
	 * @class BookmarksManager
	 * @implements {IBookmarksManager}
	 */
	var BookmarksManager = (function () {
	    function BookmarksManager(service, config, iframe) {
	        this.service = service;
	        this.config = config;
	        this.iframe = iframe;
	    }
	    /**
	     * Gets bookmarks that are defined in the report.
	     *
	     * ```javascript
	     * // Gets bookmarks that are defined in the report
	     * bookmarksManager.getBookmarks()
	     *   .then(bookmarks => {
	     *     ...
	     *   });
	     * ```
	     *
	     * @returns {Promise<models.IReportBookmark[]>}
	     */
	    BookmarksManager.prototype.getBookmarks = function () {
	        return this.service.hpm.get("/report/bookmarks", { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Apply bookmark By name.
	     *
	     * ```javascript
	     * bookmarksManager.apply(bookmarkName)
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    BookmarksManager.prototype.apply = function (bookmarkName) {
	        var request = {
	            name: bookmarkName
	        };
	        return this.service.hpm.post("/report/bookmarks/applyByName", request, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Play bookmarks: Enter or Exit bookmarks presentation mode.
	     *
	     * ```javascript
	     * // Enter presentation mode.
	     * bookmarksManager.play(true)
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    BookmarksManager.prototype.play = function (playMode) {
	        var playBookmarkRequest = {
	            playMode: playMode
	        };
	        return this.service.hpm.post("/report/bookmarks/play", playBookmarkRequest, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Capture bookmark from current state.
	     *
	     * ```javascript
	     * bookmarksManager.capture()
	     * ```
	     *
	     * @returns {Promise<models.IReportBookmark>}
	     */
	    BookmarksManager.prototype.capture = function () {
	        return this.service.hpm.post("/report/bookmarks/capture", null, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .then(function (response) { return response.body; }, function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Apply bookmark state.
	     *
	     * ```javascript
	     * bookmarksManager.applyState(bookmarkName)
	     * ```
	     *
	     * @returns {Promise<void>}
	     */
	    BookmarksManager.prototype.applyState = function (state) {
	        var request = {
	            state: state
	        };
	        return this.service.hpm.post("/report/bookmarks/applyState", request, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    return BookmarksManager;
	}());
	exports.BookmarksManager = BookmarksManager;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var models = __webpack_require__(4);
	var embed = __webpack_require__(2);
	var utils = __webpack_require__(3);
	var defaults_1 = __webpack_require__(8);
	var Create = (function (_super) {
	    __extends(Create, _super);
	    function Create(service, element, config, phasedRender) {
	        _super.call(this, service, element, config, /* iframe */ undefined, phasedRender);
	    }
	    /**
	     * Gets the dataset ID from the first available location: createConfig or embed url.
	     *
	     * @returns {string}
	     */
	    Create.prototype.getId = function () {
	        var datasetId = (this.createConfig && this.createConfig.datasetId) ? this.createConfig.datasetId : Create.findIdFromEmbedUrl(this.config.embedUrl);
	        if (typeof datasetId !== 'string' || datasetId.length === 0) {
	            throw new Error('Dataset id is required, but it was not found. You must provide an id either as part of embed configuration.');
	        }
	        return datasetId;
	    };
	    /**
	     * Validate create report configuration.
	     */
	    Create.prototype.validate = function (config) {
	        return models.validateCreateReport(config);
	    };
	    /**
	     * Populate config for create
	     *
	     * @param {IEmbedConfigurationBase}
	     * @returns {void}
	     */
	    Create.prototype.populateConfig = function (baseConfig) {
	        _super.prototype.populateConfig.call(this, baseConfig);
	        // TODO: Change when Object.assign is available.
	        var settings = utils.assign({}, defaults_1.Defaults.defaultSettings, baseConfig.settings);
	        this.config = utils.assign({ settings: settings }, baseConfig);
	        var config = this.config;
	        this.createConfig = {
	            datasetId: config.datasetId || this.getId(),
	            accessToken: config.accessToken,
	            tokenType: config.tokenType,
	            settings: settings
	        };
	    };
	    /**
	     * Adds the ability to get datasetId from url.
	     * (e.g. http://embedded.powerbi.com/appTokenReportEmbed?datasetId=854846ed-2106-4dc2-bc58-eb77533bf2f1).
	     *
	     * By extracting the ID we can ensure that the ID is always explicitly provided as part of the create configuration.
	     *
	     * @static
	     * @param {string} url
	     * @returns {string}
	     */
	    Create.findIdFromEmbedUrl = function (url) {
	        var datasetIdRegEx = /datasetId="?([^&]+)"?/;
	        var datasetIdMatch = url.match(datasetIdRegEx);
	        var datasetId;
	        if (datasetIdMatch) {
	            datasetId = datasetIdMatch[1];
	        }
	        return datasetId;
	    };
	    return Create;
	}(embed.Embed));
	exports.Create = Create;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var embed = __webpack_require__(2);
	var models = __webpack_require__(4);
	var utils = __webpack_require__(3);
	var defaults_1 = __webpack_require__(8);
	/**
	 * A Power BI Dashboard embed component
	 *
	 * @export
	 * @class Dashboard
	 * @extends {embed.Embed}
	 * @implements {IDashboardNode}
	 * @implements {IFilterable}
	 */
	var Dashboard = (function (_super) {
	    __extends(Dashboard, _super);
	    /**
	     * Creates an instance of a Power BI Dashboard.
	     *
	     * @param {service.Service} service
	     * @param {HTMLElement} element
	     */
	    function Dashboard(service, element, config, phasedRender) {
	        _super.call(this, service, element, config, /* iframe */ undefined, phasedRender);
	        this.loadPath = "/dashboard/load";
	        this.phasedLoadPath = "/dashboard/prepare";
	        Array.prototype.push.apply(this.allowedEvents, Dashboard.allowedEvents);
	    }
	    /**
	     * This adds backwards compatibility for older config which used the dashboardId query param to specify dashboard id.
	     * E.g. https://powerbi-df.analysis-df.windows.net/dashboardEmbedHost?dashboardId=e9363c62-edb6-4eac-92d3-2199c5ca2a9e
	     *
	     * By extracting the id we can ensure id is always explicitly provided as part of the load configuration.
	     *
	     * @static
	     * @param {string} url
	     * @returns {string}
	     */
	    Dashboard.findIdFromEmbedUrl = function (url) {
	        var dashboardIdRegEx = /dashboardId="?([^&]+)"?/;
	        var dashboardIdMatch = url.match(dashboardIdRegEx);
	        var dashboardId;
	        if (dashboardIdMatch) {
	            dashboardId = dashboardIdMatch[1];
	        }
	        return dashboardId;
	    };
	    /**
	     * Get dashboard id from first available location: options, attribute, embed url.
	     *
	     * @returns {string}
	     */
	    Dashboard.prototype.getId = function () {
	        var config = this.config;
	        var dashboardId = config.id || this.element.getAttribute(Dashboard.dashboardIdAttribute) || Dashboard.findIdFromEmbedUrl(config.embedUrl);
	        if (typeof dashboardId !== 'string' || dashboardId.length === 0) {
	            throw new Error("Dashboard id is required, but it was not found. You must provide an id either as part of embed configuration or as attribute '" + Dashboard.dashboardIdAttribute + "'.");
	        }
	        return dashboardId;
	    };
	    /**
	     * Validate load configuration.
	     */
	    Dashboard.prototype.validate = function (baseConfig) {
	        var config = baseConfig;
	        var error = models.validateDashboardLoad(config);
	        return error ? error : this.ValidatePageView(config.pageView);
	    };
	    /**
	     * Populate config for load config
	     *
	     * @param {IEmbedConfigurationBase}
	     * @returns {void}
	     */
	    Dashboard.prototype.populateConfig = function (baseConfig) {
	        var config = baseConfig;
	        _super.prototype.populateConfig.call(this, config);
	        // TODO: Change when Object.assign is available.
	        var settings = utils.assign({}, defaults_1.Defaults.defaultSettings, config.settings);
	        config = utils.assign({ settings: settings }, config);
	        config.id = this.getId();
	        this.config = config;
	    };
	    /**
	     * Validate that pageView has a legal value: if page view is defined it must have one of the values defined in models.PageView
	     */
	    Dashboard.prototype.ValidatePageView = function (pageView) {
	        if (pageView && pageView !== "fitToWidth" && pageView !== "oneColumn" && pageView !== "actualSize") {
	            return [{ message: "pageView must be one of the followings: fitToWidth, oneColumn, actualSize" }];
	        }
	    };
	    Dashboard.allowedEvents = ["tileClicked", "error"];
	    Dashboard.dashboardIdAttribute = 'powerbi-dashboard-id';
	    Dashboard.typeAttribute = 'powerbi-type';
	    Dashboard.type = "Dashboard";
	    return Dashboard;
	}(embed.Embed));
	exports.Dashboard = Dashboard;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var models = __webpack_require__(4);
	var embed = __webpack_require__(2);
	var utils = __webpack_require__(3);
	var defaults_1 = __webpack_require__(8);
	/**
	 * The Power BI tile embed component
	 *
	 * @export
	 * @class Tile
	 * @extends {Embed}
	 */
	var Tile = (function (_super) {
	    __extends(Tile, _super);
	    function Tile(service, element, baseConfig, phasedRender) {
	        var config = baseConfig;
	        _super.call(this, service, element, config, /* iframe */ undefined, phasedRender);
	        this.loadPath = "/tile/load";
	        Array.prototype.push.apply(this.allowedEvents, Tile.allowedEvents);
	    }
	    /**
	     * The ID of the tile
	     *
	     * @returns {string}
	     */
	    Tile.prototype.getId = function () {
	        var config = this.config;
	        var tileId = config.id || Tile.findIdFromEmbedUrl(this.config.embedUrl);
	        if (typeof tileId !== 'string' || tileId.length === 0) {
	            throw new Error("Tile id is required, but it was not found. You must provide an id either as part of embed configuration.");
	        }
	        return tileId;
	    };
	    /**
	     * Validate load configuration.
	     */
	    Tile.prototype.validate = function (config) {
	        var embedConfig = config;
	        return models.validateTileLoad(embedConfig);
	    };
	    /**
	     * Populate config for load config
	     *
	     * @param {IEmbedConfigurationBase}
	     * @returns {void}
	     */
	    Tile.prototype.populateConfig = function (baseConfig) {
	        var config = baseConfig;
	        _super.prototype.populateConfig.call(this, config);
	        // TODO: Change when Object.assign is available.
	        var settings = utils.assign({}, defaults_1.Defaults.defaultSettings, config.settings);
	        config = utils.assign({ settings: settings }, config);
	        config.id = this.getId();
	        this.config = config;
	    };
	    /**
	     * Adds the ability to get tileId from url.
	     * By extracting the ID we can ensure that the ID is always explicitly provided as part of the load configuration.
	     *
	     * @static
	     * @param {string} url
	     * @returns {string}
	     */
	    Tile.findIdFromEmbedUrl = function (url) {
	        var tileIdRegEx = /tileId="?([^&]+)"?/;
	        var tileIdMatch = url.match(tileIdRegEx);
	        var tileId;
	        if (tileIdMatch) {
	            tileId = tileIdMatch[1];
	        }
	        return tileId;
	    };
	    Tile.type = "Tile";
	    Tile.allowedEvents = ["tileClicked", "tileLoaded"];
	    return Tile;
	}(embed.Embed));
	exports.Tile = Tile;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var models = __webpack_require__(4);
	var embed = __webpack_require__(2);
	/**
	 * The Power BI Qna embed component
	 *
	 * @export
	 * @class Qna
	 * @extends {Embed}
	 */
	var Qna = (function (_super) {
	    __extends(Qna, _super);
	    function Qna(service, element, config, phasedRender) {
	        _super.call(this, service, element, config, /* iframe */ undefined, phasedRender);
	        this.loadPath = "/qna/load";
	        this.phasedLoadPath = "/qna/prepare";
	        Array.prototype.push.apply(this.allowedEvents, Qna.allowedEvents);
	    }
	    /**
	     * The ID of the Qna embed component
	     *
	     * @returns {string}
	     */
	    Qna.prototype.getId = function () {
	        return null;
	    };
	    /**
	     * Change the question of the Q&A embed component
	     *
	     * @param question - question which will render Q&A data
	     * @returns {string}
	     */
	    Qna.prototype.setQuestion = function (question) {
	        var qnaData = {
	            question: question
	        };
	        return this.service.hpm.post('/qna/interpret', qnaData, { uid: this.config.uniqueId }, this.iframe.contentWindow)
	            .catch(function (response) {
	            throw response.body;
	        });
	    };
	    /**
	     * Validate load configuration.
	     */
	    Qna.prototype.validate = function (config) {
	        return models.validateLoadQnaConfiguration(config);
	    };
	    Qna.type = "Qna";
	    Qna.allowedEvents = ["loaded", "visualRendered"];
	    return Qna;
	}(embed.Embed));
	exports.Qna = Qna;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var models = __webpack_require__(4);
	var report_1 = __webpack_require__(5);
	/**
	 * The Power BI Visual embed component
	 *
	 * @export
	 * @class Visual
	 */
	var Visual = (function (_super) {
	    __extends(Visual, _super);
	    /**
	     * Creates an instance of a Power BI Single Visual.
	     *
	     * @param {service.Service} service
	     * @param {HTMLElement} element
	     * @param {embed.IEmbedConfiguration} config
	     */
	    function Visual(service, element, baseConfig, phasedRender, iframe) {
	        _super.call(this, service, element, baseConfig, phasedRender, iframe);
	    }
	    Visual.prototype.load = function (baseConfig, phasedRender) {
	        var config = baseConfig;
	        if (typeof config.pageName !== 'string' || config.pageName.length === 0) {
	            throw new Error("Page name is required when embedding a visual.");
	        }
	        if (typeof config.visualName !== 'string' || config.visualName.length === 0) {
	            throw new Error("Visual name is required, but it was not found. You must provide a visual name as part of embed configuration.");
	        }
	        // calculate custom layout settings and override config.
	        var width = config.width ? config.width : this.iframe.offsetWidth;
	        var height = config.height ? config.height : this.iframe.offsetHeight;
	        var pageSize = {
	            type: models.PageSizeType.Custom,
	            width: width,
	            height: height,
	        };
	        var pagesLayout = {};
	        pagesLayout[config.pageName] = {
	            defaultLayout: {
	                displayState: {
	                    mode: models.VisualContainerDisplayMode.Hidden
	                }
	            },
	            visualsLayout: {}
	        };
	        pagesLayout[config.pageName].visualsLayout[config.visualName] = {
	            displayState: {
	                mode: models.VisualContainerDisplayMode.Visible
	            },
	            x: 1,
	            y: 1,
	            z: 1,
	            width: pageSize.width,
	            height: pageSize.height
	        };
	        config.settings = config.settings || {};
	        config.settings.filterPaneEnabled = false;
	        config.settings.navContentPaneEnabled = false;
	        config.settings.layoutType = models.LayoutType.Custom;
	        config.settings.customLayout = {
	            displayOption: models.DisplayOption.FitToPage,
	            pageSize: pageSize,
	            pagesLayout: pagesLayout
	        };
	        return _super.prototype.load.call(this, config, phasedRender);
	    };
	    /**
	     * Gets the list of pages within the report - not supported in visual embed.
	     *
	     * @returns {Promise<Page[]>}
	     */
	    Visual.prototype.getPages = function () {
	        throw Visual.GetPagesNotSupportedError;
	    };
	    /**
	     * Sets the active page of the report - not supported in visual embed.
	     *
	     * @param {string} pageName
	     * @returns {Promise<void>}
	     */
	    Visual.prototype.setPage = function (pageName) {
	        throw Visual.SetPageNotSupportedError;
	    };
	    /**
	     * Gets filters that are applied at the visual level.
	     *
	     * ```javascript
	     * // Get filters applied at visual level
	     * visual.getFilters()
	     *   .then(filters => {
	     *     ...
	     *   });
	     * ```
	     *
	     * @returns {Promise<models.IFilter[]>}
	     */
	    Visual.prototype.getFilters = function () {
	        throw Visual.GetFiltersNotSupportedError;
	    };
	    /**
	     * Sets filters at the visual level.
	     *
	     * ```javascript
	     * const filters: [
	     *    ...
	     * ];
	     *
	     * visual.setFilters(filters)
	     *  .catch(errors => {
	     *    ...
	     *  });
	     * ```
	     *
	     * @param {(models.IFilter[])} filters
	     * @returns {Promise<void>}
	     */
	    Visual.prototype.setFilters = function (filters) {
	        throw Visual.SetFiltersNotSupportedError;
	    };
	    Visual.type = "visual";
	    Visual.GetFiltersNotSupportedError = "Getting visual level filters is not supported.";
	    Visual.SetFiltersNotSupportedError = "Setting visual level filters is not supported.";
	    Visual.GetPagesNotSupportedError = "Get pages is not supported while embedding a visual.";
	    Visual.SetPageNotSupportedError = "Set page is not supported while embedding a visual.";
	    return Visual;
	}(report_1.Report));
	exports.Visual = Visual;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	var config_1 = __webpack_require__(16);
	var wpmp = __webpack_require__(17);
	var hpm = __webpack_require__(18);
	var router = __webpack_require__(19);
	exports.hpmFactory = function (wpmp, defaultTargetWindow, sdkVersion, sdkType) {
	    if (sdkVersion === void 0) { sdkVersion = config_1.default.version; }
	    if (sdkType === void 0) { sdkType = config_1.default.type; }
	    return new hpm.HttpPostMessage(wpmp, {
	        'x-sdk-type': sdkType,
	        'x-sdk-version': sdkVersion
	    }, defaultTargetWindow);
	};
	exports.wpmpFactory = function (name, logMessages, eventSourceOverrideWindow) {
	    return new wpmp.WindowPostMessageProxy({
	        processTrackingProperties: {
	            addTrackingProperties: hpm.HttpPostMessage.addTrackingProperties,
	            getTrackingProperties: hpm.HttpPostMessage.getTrackingProperties,
	        },
	        isErrorMessage: hpm.HttpPostMessage.isErrorMessage,
	        suppressWarnings: true,
	        name: name,
	        logMessages: logMessages,
	        eventSourceOverrideWindow: eventSourceOverrideWindow
	    });
	};
	exports.routerFactory = function (wpmp) {
	    return new router.Router(wpmp);
	};


/***/ }),
/* 16 */
/***/ (function(module, exports) {

	var config = {
	    version: '2.5.1',
	    type: 'js'
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = config;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	/*! window-post-message-proxy v0.2.5 | (c) 2016 Microsoft Corporation MIT */
	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["window-post-message-proxy"] = factory();
		else
			root["window-post-message-proxy"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ (function(module, exports) {
	
		"use strict";
		var WindowPostMessageProxy = (function () {
		    function WindowPostMessageProxy(options) {
		        var _this = this;
		        if (options === void 0) { options = {
		            processTrackingProperties: {
		                addTrackingProperties: WindowPostMessageProxy.defaultAddTrackingProperties,
		                getTrackingProperties: WindowPostMessageProxy.defaultGetTrackingProperties
		            },
		            isErrorMessage: WindowPostMessageProxy.defaultIsErrorMessage,
		            receiveWindow: window,
		            name: WindowPostMessageProxy.createRandomString()
		        }; }
		        this.pendingRequestPromises = {};
		        // save options with defaults
		        this.addTrackingProperties = (options.processTrackingProperties && options.processTrackingProperties.addTrackingProperties) || WindowPostMessageProxy.defaultAddTrackingProperties;
		        this.getTrackingProperties = (options.processTrackingProperties && options.processTrackingProperties.getTrackingProperties) || WindowPostMessageProxy.defaultGetTrackingProperties;
		        this.isErrorMessage = options.isErrorMessage || WindowPostMessageProxy.defaultIsErrorMessage;
		        this.receiveWindow = options.receiveWindow || window;
		        this.name = options.name || WindowPostMessageProxy.createRandomString();
		        this.logMessages = options.logMessages || false;
		        this.eventSourceOverrideWindow = options.eventSourceOverrideWindow;
		        this.suppressWarnings = options.suppressWarnings || false;
		        if (this.logMessages) {
		            console.log("new WindowPostMessageProxy created with name: " + this.name + " receiving on window: " + this.receiveWindow.document.title);
		        }
		        // Initialize
		        this.handlers = [];
		        this.windowMessageHandler = function (event) { return _this.onMessageReceived(event); };
		        this.start();
		    }
		    // Static
		    WindowPostMessageProxy.defaultAddTrackingProperties = function (message, trackingProperties) {
		        message[WindowPostMessageProxy.messagePropertyName] = trackingProperties;
		        return message;
		    };
		    WindowPostMessageProxy.defaultGetTrackingProperties = function (message) {
		        return message[WindowPostMessageProxy.messagePropertyName];
		    };
		    WindowPostMessageProxy.defaultIsErrorMessage = function (message) {
		        return !!message.error;
		    };
		    /**
		     * Utility to create a deferred object.
		     */
		    // TODO: Look to use RSVP library instead of doing this manually.
		    // From what I searched RSVP would work better because it has .finally and .deferred; however, it doesn't have Typings information. 
		    WindowPostMessageProxy.createDeferred = function () {
		        var deferred = {
		            resolve: null,
		            reject: null,
		            promise: null
		        };
		        var promise = new Promise(function (resolve, reject) {
		            deferred.resolve = resolve;
		            deferred.reject = reject;
		        });
		        deferred.promise = promise;
		        return deferred;
		    };
		    /**
		     * Utility to generate random sequence of characters used as tracking id for promises.
		     */
		    WindowPostMessageProxy.createRandomString = function () {
		        return (Math.random() + 1).toString(36).substring(7);
		    };
		    /**
		     * Adds handler.
		     * If the first handler whose test method returns true will handle the message and provide a response.
		     */
		    WindowPostMessageProxy.prototype.addHandler = function (handler) {
		        this.handlers.push(handler);
		    };
		    /**
		     * Removes handler.
		     * The reference must match the original object that was provided when adding the handler.
		     */
		    WindowPostMessageProxy.prototype.removeHandler = function (handler) {
		        var handlerIndex = this.handlers.indexOf(handler);
		        if (handlerIndex === -1) {
		            throw new Error("You attempted to remove a handler but no matching handler was found.");
		        }
		        this.handlers.splice(handlerIndex, 1);
		    };
		    /**
		     * Start listening to message events.
		     */
		    WindowPostMessageProxy.prototype.start = function () {
		        this.receiveWindow.addEventListener('message', this.windowMessageHandler);
		    };
		    /**
		     * Stops listening to message events.
		     */
		    WindowPostMessageProxy.prototype.stop = function () {
		        this.receiveWindow.removeEventListener('message', this.windowMessageHandler);
		    };
		    /**
		     * Post message to target window with tracking properties added and save deferred object referenced by tracking id.
		     */
		    WindowPostMessageProxy.prototype.postMessage = function (targetWindow, message) {
		        // Add tracking properties to indicate message came from this proxy
		        var trackingProperties = { id: WindowPostMessageProxy.createRandomString() };
		        this.addTrackingProperties(message, trackingProperties);
		        if (this.logMessages) {
		            console.log(this.name + " Posting message:");
		            console.log(JSON.stringify(message, null, '  '));
		        }
		        targetWindow.postMessage(message, "*");
		        var deferred = WindowPostMessageProxy.createDeferred();
		        this.pendingRequestPromises[trackingProperties.id] = deferred;
		        return deferred.promise;
		    };
		    /**
		     * Send response message to target window.
		     * Response messages re-use tracking properties from a previous request message.
		     */
		    WindowPostMessageProxy.prototype.sendResponse = function (targetWindow, message, trackingProperties) {
		        this.addTrackingProperties(message, trackingProperties);
		        if (this.logMessages) {
		            console.log(this.name + " Sending response:");
		            console.log(JSON.stringify(message, null, '  '));
		        }
		        targetWindow.postMessage(message, "*");
		    };
		    /**
		     * Message handler.
		     */
		    WindowPostMessageProxy.prototype.onMessageReceived = function (event) {
		        var _this = this;
		        if (this.logMessages) {
		            console.log(this.name + " Received message:");
		            console.log("type: " + event.type);
		            console.log(JSON.stringify(event.data, null, '  '));
		        }
		        var sendingWindow = this.eventSourceOverrideWindow || event.source;
		        var message = event.data;
		        if (typeof message !== "object") {
		            if (!this.suppressWarnings) {
		                console.warn("Proxy(" + this.name + "): Received message that was not an object. Discarding message");
		            }
		            return;
		        }
		        var trackingProperties;
		        try {
		            trackingProperties = this.getTrackingProperties(message);
		        }
		        catch (e) {
		            if (!this.suppressWarnings) {
		                console.warn("Proxy(" + this.name + "): Error occurred when attempting to get tracking properties from incoming message:", JSON.stringify(message, null, '  '), "Error: ", e);
		            }
		        }
		        var deferred;
		        if (trackingProperties) {
		            deferred = this.pendingRequestPromises[trackingProperties.id];
		        }
		        // If message does not have a known ID, treat it as a request
		        // Otherwise, treat message as response
		        if (!deferred) {
		            var handled = this.handlers.some(function (handler) {
		                var canMessageBeHandled = false;
		                try {
		                    canMessageBeHandled = handler.test(message);
		                }
		                catch (e) {
		                    if (!_this.suppressWarnings) {
		                        console.warn("Proxy(" + _this.name + "): Error occurred when handler was testing incoming message:", JSON.stringify(message, null, '  '), "Error: ", e);
		                    }
		                }
		                if (canMessageBeHandled) {
		                    var responseMessagePromise = void 0;
		                    try {
		                        responseMessagePromise = Promise.resolve(handler.handle(message));
		                    }
		                    catch (e) {
		                        if (!_this.suppressWarnings) {
		                            console.warn("Proxy(" + _this.name + "): Error occurred when handler was processing incoming message:", JSON.stringify(message, null, '  '), "Error: ", e);
		                        }
		                        responseMessagePromise = Promise.resolve();
		                    }
		                    responseMessagePromise
		                        .then(function (responseMessage) {
		                        if (!responseMessage) {
		                            var warningMessage = "Handler for message: " + JSON.stringify(message, null, '  ') + " did not return a response message. The default response message will be returned instead.";
		                            if (!_this.suppressWarnings) {
		                                console.warn("Proxy(" + _this.name + "): " + warningMessage);
		                            }
		                            responseMessage = {
		                                warning: warningMessage
		                            };
		                        }
		                        _this.sendResponse(sendingWindow, responseMessage, trackingProperties);
		                    });
		                    return true;
		                }
		            });
		            /**
		             * TODO: Consider returning an error message if nothing handled the message.
		             * In the case of the Report receiving messages all of them should be handled,
		             * however, in the case of the SDK receiving messages it's likely it won't register handlers
		             * for all events. Perhaps make this an option at construction time.
		             */
		            if (!handled && !this.suppressWarnings) {
		                console.warn("Proxy(" + this.name + ") did not handle message. Handlers: " + this.handlers.length + "  Message: " + JSON.stringify(message, null, '') + ".");
		            }
		        }
		        else {
		            /**
		             * If error message reject promise,
		             * Otherwise, resolve promise
		             */
		            var isErrorMessage = true;
		            try {
		                isErrorMessage = this.isErrorMessage(message);
		            }
		            catch (e) {
		                console.warn("Proxy(" + this.name + ") Error occurred when trying to determine if message is consider an error response. Message: ", JSON.stringify(message, null, ''), 'Error: ', e);
		            }
		            if (isErrorMessage) {
		                deferred.reject(message);
		            }
		            else {
		                deferred.resolve(message);
		            }
		            // TODO: Move to .finally clause up where promise is created for better maitenance like original proxy code.
		            delete this.pendingRequestPromises[trackingProperties.id];
		        }
		    };
		    WindowPostMessageProxy.messagePropertyName = "windowPostMessageProxy";
		    return WindowPostMessageProxy;
		}());
		exports.WindowPostMessageProxy = WindowPostMessageProxy;
	
	
	/***/ })
	/******/ ])
	});
	;
	//# sourceMappingURL=windowPostMessageProxy.js.map

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	/*! http-post-message v0.2.3 | (c) 2016 Microsoft Corporation MIT */
	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["http-post-message"] = factory();
		else
			root["http-post-message"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports) {
	
		"use strict";
		var HttpPostMessage = (function () {
		    function HttpPostMessage(windowPostMessageProxy, defaultHeaders, defaultTargetWindow) {
		        if (defaultHeaders === void 0) { defaultHeaders = {}; }
		        this.defaultHeaders = defaultHeaders;
		        this.defaultTargetWindow = defaultTargetWindow;
		        this.windowPostMessageProxy = windowPostMessageProxy;
		    }
		    // TODO: See if it's possible to share tracking properties interface?
		    // The responsibility of knowing how to configure windowPostMessageProxy for http should
		    // live in this http class, but the configuration would need ITrackingProperties
		    // interface which lives in WindowPostMessageProxy. Use <any> type as workaround
		    HttpPostMessage.addTrackingProperties = function (message, trackingProperties) {
		        message.headers = message.headers || {};
		        if (trackingProperties && trackingProperties.id) {
		            message.headers.id = trackingProperties.id;
		        }
		        return message;
		    };
		    HttpPostMessage.getTrackingProperties = function (message) {
		        return {
		            id: message.headers && message.headers.id
		        };
		    };
		    HttpPostMessage.isErrorMessage = function (message) {
		        if (typeof (message && message.statusCode) !== 'number') {
		            return false;
		        }
		        return !(200 <= message.statusCode && message.statusCode < 300);
		    };
		    HttpPostMessage.prototype.get = function (url, headers, targetWindow) {
		        if (headers === void 0) { headers = {}; }
		        if (targetWindow === void 0) { targetWindow = this.defaultTargetWindow; }
		        return this.send({
		            method: "GET",
		            url: url,
		            headers: headers
		        }, targetWindow);
		    };
		    HttpPostMessage.prototype.post = function (url, body, headers, targetWindow) {
		        if (headers === void 0) { headers = {}; }
		        if (targetWindow === void 0) { targetWindow = this.defaultTargetWindow; }
		        return this.send({
		            method: "POST",
		            url: url,
		            headers: headers,
		            body: body
		        }, targetWindow);
		    };
		    HttpPostMessage.prototype.put = function (url, body, headers, targetWindow) {
		        if (headers === void 0) { headers = {}; }
		        if (targetWindow === void 0) { targetWindow = this.defaultTargetWindow; }
		        return this.send({
		            method: "PUT",
		            url: url,
		            headers: headers,
		            body: body
		        }, targetWindow);
		    };
		    HttpPostMessage.prototype.patch = function (url, body, headers, targetWindow) {
		        if (headers === void 0) { headers = {}; }
		        if (targetWindow === void 0) { targetWindow = this.defaultTargetWindow; }
		        return this.send({
		            method: "PATCH",
		            url: url,
		            headers: headers,
		            body: body
		        }, targetWindow);
		    };
		    HttpPostMessage.prototype.delete = function (url, body, headers, targetWindow) {
		        if (body === void 0) { body = null; }
		        if (headers === void 0) { headers = {}; }
		        if (targetWindow === void 0) { targetWindow = this.defaultTargetWindow; }
		        return this.send({
		            method: "DELETE",
		            url: url,
		            headers: headers,
		            body: body
		        }, targetWindow);
		    };
		    HttpPostMessage.prototype.send = function (request, targetWindow) {
		        if (targetWindow === void 0) { targetWindow = this.defaultTargetWindow; }
		        request.headers = this.assign({}, this.defaultHeaders, request.headers);
		        if (!targetWindow) {
		            throw new Error("target window is not provided.  You must either provide the target window explicitly as argument to request, or specify default target window when constructing instance of this class.");
		        }
		        return this.windowPostMessageProxy.postMessage(targetWindow, request);
		    };
		    /**
		     * Object.assign() polyfill
		     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
		     */
		    HttpPostMessage.prototype.assign = function (target) {
		        var sources = [];
		        for (var _i = 1; _i < arguments.length; _i++) {
		            sources[_i - 1] = arguments[_i];
		        }
		        if (target === undefined || target === null) {
		            throw new TypeError('Cannot convert undefined or null to object');
		        }
		        var output = Object(target);
		        sources.forEach(function (source) {
		            if (source !== undefined && source !== null) {
		                for (var nextKey in source) {
		                    if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
		                        output[nextKey] = source[nextKey];
		                    }
		                }
		            }
		        });
		        return output;
		    };
		    return HttpPostMessage;
		}());
		exports.HttpPostMessage = HttpPostMessage;
	
	
	/***/ }
	/******/ ])
	});
	;
	//# sourceMappingURL=httpPostMessage.js.map

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	/*! powerbi-router v0.1.5 | (c) 2016 Microsoft Corporation MIT */
	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["powerbi-router"] = factory();
		else
			root["powerbi-router"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {
	
		"use strict";
		var RouteRecognizer = __webpack_require__(1);
		var Router = (function () {
		    function Router(handlers) {
		        this.handlers = handlers;
		        /**
		         * TODO: look at generating the router dynamically based on list of supported http methods
		         * instead of hardcoding the creation of these and the methods.
		         */
		        this.getRouteRecognizer = new RouteRecognizer();
		        this.patchRouteRecognizer = new RouteRecognizer();
		        this.postRouteRecognizer = new RouteRecognizer();
		        this.putRouteRecognizer = new RouteRecognizer();
		        this.deleteRouteRecognizer = new RouteRecognizer();
		    }
		    Router.prototype.get = function (url, handler) {
		        this.registerHandler(this.getRouteRecognizer, "GET", url, handler);
		        return this;
		    };
		    Router.prototype.patch = function (url, handler) {
		        this.registerHandler(this.patchRouteRecognizer, "PATCH", url, handler);
		        return this;
		    };
		    Router.prototype.post = function (url, handler) {
		        this.registerHandler(this.postRouteRecognizer, "POST", url, handler);
		        return this;
		    };
		    Router.prototype.put = function (url, handler) {
		        this.registerHandler(this.putRouteRecognizer, "PUT", url, handler);
		        return this;
		    };
		    Router.prototype.delete = function (url, handler) {
		        this.registerHandler(this.deleteRouteRecognizer, "DELETE", url, handler);
		        return this;
		    };
		    /**
		     * TODO: This method could use some refactoring.  There is conflict of interest between keeping clean separation of test and handle method
		     * Test method only returns boolean indicating if request can be handled, and handle method has opportunity to modify response and return promise of it.
		     * In the case of the router with route-recognizer where handlers are associated with routes, this already guarantees that only one handler is selected and makes the test method feel complicated
		     * Will leave as is an investigate cleaner ways at later time.
		     */
		    Router.prototype.registerHandler = function (routeRecognizer, method, url, handler) {
		        var routeRecognizerHandler = function (request) {
		            var response = new Response();
		            return Promise.resolve(handler(request, response))
		                .then(function (x) { return response; });
		        };
		        routeRecognizer.add([
		            { path: url, handler: routeRecognizerHandler }
		        ]);
		        var internalHandler = {
		            test: function (request) {
		                if (request.method !== method) {
		                    return false;
		                }
		                var matchingRoutes = routeRecognizer.recognize(request.url);
		                if (matchingRoutes === undefined) {
		                    return false;
		                }
		                /**
		                 * Copy parameters from recognized route to the request so they can be used within the handler function
		                 * This isn't ideal because it is side affect which modifies the request instead of strictly testing for true or false
		                 * but I don't see a better place to put this.  If we move it between the call to test and the handle it becomes part of the window post message proxy
		                 * even though it's responsibility is related to routing.
		                 */
		                var route = matchingRoutes[0];
		                request.params = route.params;
		                request.queryParams = matchingRoutes.queryParams;
		                request.handler = route.handler;
		                return true;
		            },
		            handle: function (request) {
		                return request.handler(request);
		            }
		        };
		        this.handlers.addHandler(internalHandler);
		    };
		    return Router;
		}());
		exports.Router = Router;
		var Response = (function () {
		    function Response() {
		        this.statusCode = 200;
		        this.headers = {};
		        this.body = null;
		    }
		    Response.prototype.send = function (statusCode, body) {
		        this.statusCode = statusCode;
		        this.body = body;
		    };
		    return Response;
		}());
		exports.Response = Response;
	
	
	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {
	
		var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {(function() {
		    "use strict";
		    function $$route$recognizer$dsl$$Target(path, matcher, delegate) {
		      this.path = path;
		      this.matcher = matcher;
		      this.delegate = delegate;
		    }
		
		    $$route$recognizer$dsl$$Target.prototype = {
		      to: function(target, callback) {
		        var delegate = this.delegate;
		
		        if (delegate && delegate.willAddRoute) {
		          target = delegate.willAddRoute(this.matcher.target, target);
		        }
		
		        this.matcher.add(this.path, target);
		
		        if (callback) {
		          if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
		          this.matcher.addChild(this.path, target, callback, this.delegate);
		        }
		        return this;
		      }
		    };
		
		    function $$route$recognizer$dsl$$Matcher(target) {
		      this.routes = {};
		      this.children = {};
		      this.target = target;
		    }
		
		    $$route$recognizer$dsl$$Matcher.prototype = {
		      add: function(path, handler) {
		        this.routes[path] = handler;
		      },
		
		      addChild: function(path, target, callback, delegate) {
		        var matcher = new $$route$recognizer$dsl$$Matcher(target);
		        this.children[path] = matcher;
		
		        var match = $$route$recognizer$dsl$$generateMatch(path, matcher, delegate);
		
		        if (delegate && delegate.contextEntered) {
		          delegate.contextEntered(target, match);
		        }
		
		        callback(match);
		      }
		    };
		
		    function $$route$recognizer$dsl$$generateMatch(startingPath, matcher, delegate) {
		      return function(path, nestedCallback) {
		        var fullPath = startingPath + path;
		
		        if (nestedCallback) {
		          nestedCallback($$route$recognizer$dsl$$generateMatch(fullPath, matcher, delegate));
		        } else {
		          return new $$route$recognizer$dsl$$Target(startingPath + path, matcher, delegate);
		        }
		      };
		    }
		
		    function $$route$recognizer$dsl$$addRoute(routeArray, path, handler) {
		      var len = 0;
		      for (var i=0; i<routeArray.length; i++) {
		        len += routeArray[i].path.length;
		      }
		
		      path = path.substr(len);
		      var route = { path: path, handler: handler };
		      routeArray.push(route);
		    }
		
		    function $$route$recognizer$dsl$$eachRoute(baseRoute, matcher, callback, binding) {
		      var routes = matcher.routes;
		
		      for (var path in routes) {
		        if (routes.hasOwnProperty(path)) {
		          var routeArray = baseRoute.slice();
		          $$route$recognizer$dsl$$addRoute(routeArray, path, routes[path]);
		
		          if (matcher.children[path]) {
		            $$route$recognizer$dsl$$eachRoute(routeArray, matcher.children[path], callback, binding);
		          } else {
		            callback.call(binding, routeArray);
		          }
		        }
		      }
		    }
		
		    var $$route$recognizer$dsl$$default = function(callback, addRouteCallback) {
		      var matcher = new $$route$recognizer$dsl$$Matcher();
		
		      callback($$route$recognizer$dsl$$generateMatch("", matcher, this.delegate));
		
		      $$route$recognizer$dsl$$eachRoute([], matcher, function(route) {
		        if (addRouteCallback) { addRouteCallback(this, route); }
		        else { this.add(route); }
		      }, this);
		    };
		
		    var $$route$recognizer$$specials = [
		      '/', '.', '*', '+', '?', '|',
		      '(', ')', '[', ']', '{', '}', '\\'
		    ];
		
		    var $$route$recognizer$$escapeRegex = new RegExp('(\\' + $$route$recognizer$$specials.join('|\\') + ')', 'g');
		
		    function $$route$recognizer$$isArray(test) {
		      return Object.prototype.toString.call(test) === "[object Array]";
		    }
		
		    // A Segment represents a segment in the original route description.
		    // Each Segment type provides an `eachChar` and `regex` method.
		    //
		    // The `eachChar` method invokes the callback with one or more character
		    // specifications. A character specification consumes one or more input
		    // characters.
		    //
		    // The `regex` method returns a regex fragment for the segment. If the
		    // segment is a dynamic of star segment, the regex fragment also includes
		    // a capture.
		    //
		    // A character specification contains:
		    //
		    // * `validChars`: a String with a list of all valid characters, or
		    // * `invalidChars`: a String with a list of all invalid characters
		    // * `repeat`: true if the character specification can repeat
		
		    function $$route$recognizer$$StaticSegment(string) { this.string = string; }
		    $$route$recognizer$$StaticSegment.prototype = {
		      eachChar: function(currentState) {
		        var string = this.string, ch;
		
		        for (var i=0; i<string.length; i++) {
		          ch = string.charAt(i);
		          currentState = currentState.put({ invalidChars: undefined, repeat: false, validChars: ch });
		        }
		
		        return currentState;
		      },
		
		      regex: function() {
		        return this.string.replace($$route$recognizer$$escapeRegex, '\\$1');
		      },
		
		      generate: function() {
		        return this.string;
		      }
		    };
		
		    function $$route$recognizer$$DynamicSegment(name) { this.name = name; }
		    $$route$recognizer$$DynamicSegment.prototype = {
		      eachChar: function(currentState) {
		        return currentState.put({ invalidChars: "/", repeat: true, validChars: undefined });
		      },
		
		      regex: function() {
		        return "([^/]+)";
		      },
		
		      generate: function(params) {
		        return params[this.name];
		      }
		    };
		
		    function $$route$recognizer$$StarSegment(name) { this.name = name; }
		    $$route$recognizer$$StarSegment.prototype = {
		      eachChar: function(currentState) {
		        return currentState.put({ invalidChars: "", repeat: true, validChars: undefined });
		      },
		
		      regex: function() {
		        return "(.+)";
		      },
		
		      generate: function(params) {
		        return params[this.name];
		      }
		    };
		
		    function $$route$recognizer$$EpsilonSegment() {}
		    $$route$recognizer$$EpsilonSegment.prototype = {
		      eachChar: function(currentState) {
		        return currentState;
		      },
		      regex: function() { return ""; },
		      generate: function() { return ""; }
		    };
		
		    function $$route$recognizer$$parse(route, names, specificity) {
		      // normalize route as not starting with a "/". Recognition will
		      // also normalize.
		      if (route.charAt(0) === "/") { route = route.substr(1); }
		
		      var segments = route.split("/");
		      var results = new Array(segments.length);
		
		      // A routes has specificity determined by the order that its different segments
		      // appear in. This system mirrors how the magnitude of numbers written as strings
		      // works.
		      // Consider a number written as: "abc". An example would be "200". Any other number written
		      // "xyz" will be smaller than "abc" so long as `a > z`. For instance, "199" is smaller
		      // then "200", even though "y" and "z" (which are both 9) are larger than "0" (the value
		      // of (`b` and `c`). This is because the leading symbol, "2", is larger than the other
		      // leading symbol, "1".
		      // The rule is that symbols to the left carry more weight than symbols to the right
		      // when a number is written out as a string. In the above strings, the leading digit
		      // represents how many 100's are in the number, and it carries more weight than the middle
		      // number which represents how many 10's are in the number.
		      // This system of number magnitude works well for route specificity, too. A route written as
		      // `a/b/c` will be more specific than `x/y/z` as long as `a` is more specific than
		      // `x`, irrespective of the other parts.
		      // Because of this similarity, we assign each type of segment a number value written as a
		      // string. We can find the specificity of compound routes by concatenating these strings
		      // together, from left to right. After we have looped through all of the segments,
		      // we convert the string to a number.
		      specificity.val = '';
		
		      for (var i=0; i<segments.length; i++) {
		        var segment = segments[i], match;
		
		        if (match = segment.match(/^:([^\/]+)$/)) {
		          results[i] = new $$route$recognizer$$DynamicSegment(match[1]);
		          names.push(match[1]);
		          specificity.val += '3';
		        } else if (match = segment.match(/^\*([^\/]+)$/)) {
		          results[i] = new $$route$recognizer$$StarSegment(match[1]);
		          specificity.val += '1';
		          names.push(match[1]);
		        } else if(segment === "") {
		          results[i] = new $$route$recognizer$$EpsilonSegment();
		          specificity.val += '2';
		        } else {
		          results[i] = new $$route$recognizer$$StaticSegment(segment);
		          specificity.val += '4';
		        }
		      }
		
		      specificity.val = +specificity.val;
		
		      return results;
		    }
		
		    // A State has a character specification and (`charSpec`) and a list of possible
		    // subsequent states (`nextStates`).
		    //
		    // If a State is an accepting state, it will also have several additional
		    // properties:
		    //
		    // * `regex`: A regular expression that is used to extract parameters from paths
		    //   that reached this accepting state.
		    // * `handlers`: Information on how to convert the list of captures into calls
		    //   to registered handlers with the specified parameters
		    // * `types`: How many static, dynamic or star segments in this route. Used to
		    //   decide which route to use if multiple registered routes match a path.
		    //
		    // Currently, State is implemented naively by looping over `nextStates` and
		    // comparing a character specification against a character. A more efficient
		    // implementation would use a hash of keys pointing at one or more next states.
		
		    function $$route$recognizer$$State(charSpec) {
		      this.charSpec = charSpec;
		      this.nextStates = [];
		      this.charSpecs = {};
		      this.regex = undefined;
		      this.handlers = undefined;
		      this.specificity = undefined;
		    }
		
		    $$route$recognizer$$State.prototype = {
		      get: function(charSpec) {
		        if (this.charSpecs[charSpec.validChars]) {
		          return this.charSpecs[charSpec.validChars];
		        }
		
		        var nextStates = this.nextStates;
		
		        for (var i=0; i<nextStates.length; i++) {
		          var child = nextStates[i];
		
		          var isEqual = child.charSpec.validChars === charSpec.validChars;
		          isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;
		
		          if (isEqual) {
		            this.charSpecs[charSpec.validChars] = child;
		            return child;
		          }
		        }
		      },
		
		      put: function(charSpec) {
		        var state;
		
		        // If the character specification already exists in a child of the current
		        // state, just return that state.
		        if (state = this.get(charSpec)) { return state; }
		
		        // Make a new state for the character spec
		        state = new $$route$recognizer$$State(charSpec);
		
		        // Insert the new state as a child of the current state
		        this.nextStates.push(state);
		
		        // If this character specification repeats, insert the new state as a child
		        // of itself. Note that this will not trigger an infinite loop because each
		        // transition during recognition consumes a character.
		        if (charSpec.repeat) {
		          state.nextStates.push(state);
		        }
		
		        // Return the new state
		        return state;
		      },
		
		      // Find a list of child states matching the next character
		      match: function(ch) {
		        var nextStates = this.nextStates,
		            child, charSpec, chars;
		
		        var returned = [];
		
		        for (var i=0; i<nextStates.length; i++) {
		          child = nextStates[i];
		
		          charSpec = child.charSpec;
		
		          if (typeof (chars = charSpec.validChars) !== 'undefined') {
		            if (chars.indexOf(ch) !== -1) { returned.push(child); }
		          } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
		            if (chars.indexOf(ch) === -1) { returned.push(child); }
		          }
		        }
		
		        return returned;
		      }
		    };
		
		    // Sort the routes by specificity
		    function $$route$recognizer$$sortSolutions(states) {
		      return states.sort(function(a, b) {
		        return b.specificity.val - a.specificity.val;
		      });
		    }
		
		    function $$route$recognizer$$recognizeChar(states, ch) {
		      var nextStates = [];
		
		      for (var i=0, l=states.length; i<l; i++) {
		        var state = states[i];
		
		        nextStates = nextStates.concat(state.match(ch));
		      }
		
		      return nextStates;
		    }
		
		    var $$route$recognizer$$oCreate = Object.create || function(proto) {
		      function F() {}
		      F.prototype = proto;
		      return new F();
		    };
		
		    function $$route$recognizer$$RecognizeResults(queryParams) {
		      this.queryParams = queryParams || {};
		    }
		    $$route$recognizer$$RecognizeResults.prototype = $$route$recognizer$$oCreate({
		      splice: Array.prototype.splice,
		      slice:  Array.prototype.slice,
		      push:   Array.prototype.push,
		      length: 0,
		      queryParams: null
		    });
		
		    function $$route$recognizer$$findHandler(state, path, queryParams) {
		      var handlers = state.handlers, regex = state.regex;
		      var captures = path.match(regex), currentCapture = 1;
		      var result = new $$route$recognizer$$RecognizeResults(queryParams);
		
		      result.length = handlers.length;
		
		      for (var i=0; i<handlers.length; i++) {
		        var handler = handlers[i], names = handler.names, params = {};
		
		        for (var j=0; j<names.length; j++) {
		          params[names[j]] = captures[currentCapture++];
		        }
		
		        result[i] = { handler: handler.handler, params: params, isDynamic: !!names.length };
		      }
		
		      return result;
		    }
		
		    function $$route$recognizer$$decodeQueryParamPart(part) {
		      // http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
		      part = part.replace(/\+/gm, '%20');
		      var result;
		      try {
		        result = decodeURIComponent(part);
		      } catch(error) {result = '';}
		      return result;
		    }
		
		    // The main interface
		
		    var $$route$recognizer$$RouteRecognizer = function() {
		      this.rootState = new $$route$recognizer$$State();
		      this.names = {};
		    };
		
		
		    $$route$recognizer$$RouteRecognizer.prototype = {
		      add: function(routes, options) {
		        var currentState = this.rootState, regex = "^",
		            specificity = {},
		            handlers = new Array(routes.length), allSegments = [], name;
		
		        var isEmpty = true;
		
		        for (var i=0; i<routes.length; i++) {
		          var route = routes[i], names = [];
		
		          var segments = $$route$recognizer$$parse(route.path, names, specificity);
		
		          allSegments = allSegments.concat(segments);
		
		          for (var j=0; j<segments.length; j++) {
		            var segment = segments[j];
		
		            if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }
		
		            isEmpty = false;
		
		            // Add a "/" for the new segment
		            currentState = currentState.put({ invalidChars: undefined, repeat: false, validChars: "/" });
		            regex += "/";
		
		            // Add a representation of the segment to the NFA and regex
		            currentState = segment.eachChar(currentState);
		            regex += segment.regex();
		          }
		          var handler = { handler: route.handler, names: names };
		          handlers[i] = handler;
		        }
		
		        if (isEmpty) {
		          currentState = currentState.put({ invalidChars: undefined, repeat: false, validChars: "/" });
		          regex += "/";
		        }
		
		        currentState.handlers = handlers;
		        currentState.regex = new RegExp(regex + "$");
		        currentState.specificity = specificity;
		
		        if (name = options && options.as) {
		          this.names[name] = {
		            segments: allSegments,
		            handlers: handlers
		          };
		        }
		      },
		
		      handlersFor: function(name) {
		        var route = this.names[name];
		
		        if (!route) { throw new Error("There is no route named " + name); }
		
		        var result = new Array(route.handlers.length);
		
		        for (var i=0; i<route.handlers.length; i++) {
		          result[i] = route.handlers[i];
		        }
		
		        return result;
		      },
		
		      hasRoute: function(name) {
		        return !!this.names[name];
		      },
		
		      generate: function(name, params) {
		        var route = this.names[name], output = "";
		        if (!route) { throw new Error("There is no route named " + name); }
		
		        var segments = route.segments;
		
		        for (var i=0; i<segments.length; i++) {
		          var segment = segments[i];
		
		          if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }
		
		          output += "/";
		          output += segment.generate(params);
		        }
		
		        if (output.charAt(0) !== '/') { output = '/' + output; }
		
		        if (params && params.queryParams) {
		          output += this.generateQueryString(params.queryParams, route.handlers);
		        }
		
		        return output;
		      },
		
		      generateQueryString: function(params, handlers) {
		        var pairs = [];
		        var keys = [];
		        for(var key in params) {
		          if (params.hasOwnProperty(key)) {
		            keys.push(key);
		          }
		        }
		        keys.sort();
		        for (var i = 0; i < keys.length; i++) {
		          key = keys[i];
		          var value = params[key];
		          if (value == null) {
		            continue;
		          }
		          var pair = encodeURIComponent(key);
		          if ($$route$recognizer$$isArray(value)) {
		            for (var j = 0; j < value.length; j++) {
		              var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
		              pairs.push(arrayPair);
		            }
		          } else {
		            pair += "=" + encodeURIComponent(value);
		            pairs.push(pair);
		          }
		        }
		
		        if (pairs.length === 0) { return ''; }
		
		        return "?" + pairs.join("&");
		      },
		
		      parseQueryString: function(queryString) {
		        var pairs = queryString.split("&"), queryParams = {};
		        for(var i=0; i < pairs.length; i++) {
		          var pair      = pairs[i].split('='),
		              key       = $$route$recognizer$$decodeQueryParamPart(pair[0]),
		              keyLength = key.length,
		              isArray = false,
		              value;
		          if (pair.length === 1) {
		            value = 'true';
		          } else {
		            //Handle arrays
		            if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
		              isArray = true;
		              key = key.slice(0, keyLength - 2);
		              if(!queryParams[key]) {
		                queryParams[key] = [];
		              }
		            }
		            value = pair[1] ? $$route$recognizer$$decodeQueryParamPart(pair[1]) : '';
		          }
		          if (isArray) {
		            queryParams[key].push(value);
		          } else {
		            queryParams[key] = value;
		          }
		        }
		        return queryParams;
		      },
		
		      recognize: function(path) {
		        var states = [ this.rootState ],
		            pathLen, i, l, queryStart, queryParams = {},
		            isSlashDropped = false;
		
		        queryStart = path.indexOf('?');
		        if (queryStart !== -1) {
		          var queryString = path.substr(queryStart + 1, path.length);
		          path = path.substr(0, queryStart);
		          queryParams = this.parseQueryString(queryString);
		        }
		
		        path = decodeURI(path);
		
		        if (path.charAt(0) !== "/") { path = "/" + path; }
		
		        pathLen = path.length;
		        if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
		          path = path.substr(0, pathLen - 1);
		          isSlashDropped = true;
		        }
		
		        for (i=0; i<path.length; i++) {
		          states = $$route$recognizer$$recognizeChar(states, path.charAt(i));
		          if (!states.length) { break; }
		        }
		
		        var solutions = [];
		        for (i=0; i<states.length; i++) {
		          if (states[i].handlers) { solutions.push(states[i]); }
		        }
		
		        states = $$route$recognizer$$sortSolutions(solutions);
		
		        var state = solutions[0];
		
		        if (state && state.handlers) {
		          // if a trailing slash was dropped and a star segment is the last segment
		          // specified, put the trailing slash back
		          if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
		            path = path + "/";
		          }
		          return $$route$recognizer$$findHandler(state, path, queryParams);
		        }
		      }
		    };
		
		    $$route$recognizer$$RouteRecognizer.prototype.map = $$route$recognizer$dsl$$default;
		
		    $$route$recognizer$$RouteRecognizer.VERSION = '0.1.11';
		
		    var $$route$recognizer$$default = $$route$recognizer$$RouteRecognizer;
		
		    /* global define:true module:true window: true */
		    if ("function" === 'function' && __webpack_require__(3)['amd']) {
		      !(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return $$route$recognizer$$default; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		    } else if (typeof module !== 'undefined' && module['exports']) {
		      module['exports'] = $$route$recognizer$$default;
		    } else if (typeof this !== 'undefined') {
		      this['RouteRecognizer'] = $$route$recognizer$$default;
		    }
		}).call(this);
		
		//# sourceMappingURL=route-recognizer.js.map
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)(module)))
	
	/***/ },
	/* 2 */
	/***/ function(module, exports) {
	
		module.exports = function(module) {
			if(!module.webpackPolyfill) {
				module.deprecate = function() {};
				module.paths = [];
				// module.parent = undefined by default
				module.children = [];
				module.webpackPolyfill = 1;
			}
			return module;
		}
	
	
	/***/ },
	/* 3 */
	/***/ function(module, exports) {
	
		module.exports = function() { throw new Error("define cannot be used indirect"); };
	
	
	/***/ }
	/******/ ])
	});
	;
	//# sourceMappingURL=router.js.map

/***/ })
/******/ ])
});
;
//# sourceMappingURL=powerbi.js.map