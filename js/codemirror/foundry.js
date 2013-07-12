CodeMirror.defineMode('foundry', function(config) {
  function lookupObj(words) {
    var o = {};
    for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
    return o;
  }
  var keywords = lookupObj([
    "true", "false", "nil", "self", "and", "or", "not", "let", "mut", "while",
    "do", "if", "elsif", "then", "else", "match", "end", "as", "meta", "type",
    "public", "dynamic", "package", "class", "mixin", "iface", "def", "return",
    "new", "invokeprimitive"
  ]);
  var indentWords = lookupObj([
    "then", "do", "class", "package", "mixin", "iface", "else"
  ]);
  var dedentWords = lookupObj([
    "else", "end", "}"
  ]);

  function indent(state) {
    state.indentation += config.indentUnit;
    state.indentedLine = true;
  }
  function dedent(state) {
    state.indentation -= config.indentUnit;
  }

  return {
    startState: function() {
      return {
        indentation:  0,
        indentedLine: false,
        inDef:        false,
        inFname:      false
      };
    },

    token: function(stream, state) {
      if(stream.sol()) {
        state.indentation  = stream.indentation();
        state.indentedLine = false;
      }

      if(stream.match(/[ \t]+/, true)) {
        return null; // whitespace
      }

      var wasInDef = state.inDef;
      state.inDef = false;

      var wasInFname = state.inFname;
      state.inFname = false;

      if(stream.match(/[+~-]@|<<|>>|\*\*|([+*^\/%&|<>~-])=?|==|<=>/, true)) {
        if(wasInDef || wasInFname) {
          if(wasInDef) {
            indent(state);
          }

          return "variable";
        }

        return "operator";
      } else if(stream.match(/and=|or=/, true)) {
        return "operator";
      } else if(stream.match(/[{}\[\]()]/, true)) {
        if(stream.current() == "{") {
          indent(state);
        } else if(stream.current() == "}" && state.indentedLine) {
          dedent(state);
        }

        return "bracket";
      } else if(stream.match(/\d+/, true) && !stream.match(/[a-zA-Z_]/)) {
        return "number";
      } else if(stream.match(/[A-Za-z_][A-Za-z_0-9]*:/, true)) {
        return "variable-2";
      } else if(stream.match(/@[A-Za-z_][A-Za-z_0-9]*/, true)) {
        return "attribute";
      } else if(stream.match(/(\\[A-Za-z_]|[A-Z])[A-Za-z_0-9]*/, true)) {
        return "variable-2";
      } else if(match = stream.match(/([a-z_][A-Za-z_0-9]*)/, true)) {
        if(keywords[match[0]] && !wasInDef && !wasInFname ||
            match[0] == 'self' && wasInDef) {
          if(indentWords[match[0]]) {
            indent(state);
          } else if(dedentWords[match[0]] && state.indentedLine) {
            dedent(state);
          }

          if(match[0] == "def") {
            state.inDef = true;
          }

          return "keyword";
        } else {
          if(wasInDef || wasInFname) {
            if(wasInDef) {
              indent(state);
            }

            return "attribute";
          } else {
            return null;
          }
        }
      } else if(stream.match(/:([+~-]@|<<|>>|\*\*|([+*^\/%&|<>~-])=?|==|<=>)/, true) ||
                stream.match(/:[A-Za-z_][A-Za-z_0-9]*/)) {
        return "atom";
      } else if(stream.eat('.')) {
        state.inFname = true;

        return null;
      } else if(stream.match(/[=,:;]|->|=>/, true)) {
        return null; // punctuation
      } else if(stream.eat('#')){
        stream.skipToEnd();
        return "comment";
      } else {
        stream.eat(/./);
        return "error";
      }
    },

    indent: function(state, textAfter) {
      if(dedentWords[textAfter]) {
        return state.indentation - config.indentUnit;
      } else {
        return state.indentation;
      }
    },

    electricChars: "}de", /* enD, elsE */
    lineComment:   "#"
  };
});
