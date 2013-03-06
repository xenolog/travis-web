minispade.register('log', "(function() {(function() {\n\n  this.Log = function(engine) {\n    this.listeners = [];\n    this.engine = new (engine || Log.Dom)(this);\n    return this;\n  };\n\n  $.extend(Log, {\n    DEBUG: true,\n    create: function(options) {\n      var listener, log, _i, _len, _ref;\n      log = new Log(options.engine);\n      _ref = options.listeners || [];\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        listener = _ref[_i];\n        log.listeners.push(listener);\n      }\n      return log;\n    }\n  });\n\n  $.extend(Log.prototype, {\n    trigger: function() {\n      var args, element, event, listener, result, _i, _len, _ref;\n      args = Array.prototype.slice.apply(arguments);\n      event = args[0];\n      _ref = this.listeners;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        listener = _ref[_i];\n        result = listener.notify.apply(listener, [this].concat(args));\n        if (result != null ? result.hasChildNodes : void 0) {\n          element = result;\n        }\n      }\n      return element;\n    },\n    set: function(num, string) {\n      this.trigger('receive', num, string);\n      return this.engine.set(num, string);\n    }\n  });\n\n  Log.Listener = function() {};\n\n  $.extend(Log.Listener.prototype, {\n    notify: function(log, event, num) {\n      if (this[event]) {\n        return this[event].apply(this, [log].concat(Array.prototype.slice.call(arguments, 2)));\n      }\n    }\n  });\nminispade.require('log/deansi');\nminispade.require('log/engine/dom');\nminispade.require('log/folds');\nminispade.require('log/instrument');\nminispade.require('log/renderer/fragment');\n\n}).call(this);\n\n})();\n//@ sourceURL=log");minispade.register('log/buffer', "(function() {(function() {\n\n  Log.Buffer = function(log, options) {\n    this.start = 0;\n    this.log = log;\n    this.parts = [];\n    this.options = $.extend({\n      interval: 100,\n      timeout: 500\n    }, options || {});\n    this.schedule();\n    return this;\n  };\n\n  $.extend(Log.Buffer.prototype, {\n    set: function(num, string) {\n      return this.parts[num] = {\n        string: string,\n        time: (new Date).getTime()\n      };\n    },\n    flush: function() {\n      var num, part, _i, _len, _ref;\n      _ref = this.parts;\n      for (num = _i = 0, _len = _ref.length; _i < _len; num = ++_i) {\n        part = _ref[num];\n        if (!this.parts.hasOwnProperty(num)) {\n          continue;\n        }\n        if (!part) {\n          break;\n        }\n        delete this.parts[num];\n        this.log.set(num, part.string);\n      }\n      return this.schedule();\n    },\n    schedule: function() {\n      var _this = this;\n      return setTimeout((function() {\n        return _this.flush();\n      }), this.options.interval);\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/buffer");minispade.register('log/deansi', "(function() {(function() {\n\n  Log.Deansi = {\n    apply: function(string) {\n      var nodes,\n        _this = this;\n      string = string.replace(/\\e\\[K/g, '');\n      nodes = ansiparse(string).map(function(part) {\n        return _this.node(part);\n      });\n      if (nodes.length === 0) {\n        nodes.push(this.node({\n          text: ''\n        }));\n      }\n      return nodes;\n    },\n    node: function(part) {\n      var classes;\n      if (classes = this.classes(part)) {\n        return {\n          type: 'span',\n          \"class\": classes,\n          text: part.text\n        };\n      } else {\n        return {\n          type: 'span',\n          text: part.text\n        };\n      }\n    },\n    classes: function(part) {\n      var result;\n      result = [];\n      if (part.foreground) {\n        result.push(part.foreground);\n      }\n      if (part.background) {\n        result.push(\"bg-\" + part.background);\n      }\n      if (part.bold) {\n        result.push('bold');\n      }\n      if (part.italic) {\n        result.push('italic');\n      }\n      if (result.length > 0) {\n        return result;\n      }\n    }\n  };\n\n}).call(this);\n\n})();\n//@ sourceURL=log/deansi");minispade.register('log/engine/chunks', "(function() {(function() {\n\n  Log.Chunks = function(log) {\n    this.log = log;\n    this.parts = [];\n    return this;\n  };\n\n  $.extend(Log.Chunks.prototype, {\n    set: function(num, string) {\n      var part;\n      if (this.parts[num]) {\n        return console.log(\"part \" + num + \" exists\");\n      } else {\n        part = new Log.Chunks.Part(this, num, string);\n        this.parts[num] = part;\n        return this.parts[num].insert();\n      }\n    },\n    trigger: function() {\n      return this.log.trigger.apply(this.log, arguments);\n    }\n  });\n\n  Log.Chunks.Part = function(engine, num, string) {\n    var chunk, ix, line, type;\n    this.engine = engine;\n    this.num = num;\n    this.chunks = (function() {\n      var _i, _len, _ref, _results;\n      _ref = string.split(/^/m);\n      _results = [];\n      for (ix = _i = 0, _len = _ref.length; _i < _len; ix = ++_i) {\n        chunk = _ref[ix];\n        line = chunk[chunk.length - 1].match(/\\r|\\n/);\n        type = line ? 'Line' : 'Chunk';\n        _results.push(new Log.Chunks[type](this, ix, chunk));\n      }\n      return _results;\n    }).call(this);\n    return this;\n  };\n\n  $.extend(Log.Chunks.Part.prototype, {\n    insert: function() {\n      var chunk, _i, _len, _ref, _results;\n      _ref = this.chunks;\n      _results = [];\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        chunk = _ref[_i];\n        _results.push(chunk.insert());\n      }\n      return _results;\n    },\n    prev: function() {\n      var num, prev;\n      num = this.num;\n      while (!(prev || num < 0)) {\n        prev = this.engine.parts[num -= 1];\n      }\n      return prev;\n    },\n    next: function() {\n      var next, num;\n      num = this.num;\n      while (!(next || num >= this.engine.parts.length)) {\n        next = this.engine.parts[num += 1];\n      }\n      return next;\n    },\n    trigger: function() {\n      return this.engine.trigger.apply(this.engine, arguments);\n    }\n  });\n\n  Log.Chunks.Chunk = function(part, num, string) {\n    this.part = part;\n    this.num = num;\n    this.string = string;\n    this.id = \"\" + (part != null ? part.num : void 0) + \"-\" + num;\n    this.isFold = (string != null ? string.indexOf('fold') : void 0) !== -1;\n    if (string) {\n      this.nodes = this.parse();\n    }\n    return this;\n  };\n\n  $.extend(Log.Chunks.Chunk.prototype, {\n    parse: function() {\n      return [\n        {\n          type: 'span',\n          id: \"\" + this.id + \"-0\",\n          text: this.string\n        }\n      ];\n    },\n    insert: function() {\n      var next, prev;\n      if ((next = this.next()) && next.isLine) {\n        return this.trigger('insert', this.nodes, {\n          before: next.nodes[0].nodes[0].id\n        });\n      } else if (next) {\n        return this.trigger('insert', this.nodes, {\n          before: next.nodes[0].id\n        });\n      } else if ((prev = this.prev()) && !prev.isLine) {\n        return this.trigger('insert', this.nodes, {\n          after: prev.nodes[prev.nodes.length - 1].id\n        });\n      } else {\n        return this.trigger('insert', [\n          {\n            type: 'paragraph',\n            id: this.id,\n            nodes: this.nodes\n          }\n        ], {\n          before: void 0\n        });\n      }\n    },\n    remove: function() {\n      var node, _i, _len, _ref, _results;\n      _ref = this.nodes;\n      _results = [];\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        node = _ref[_i];\n        this.trigger('remove', this.id);\n        if (node.nodes) {\n          _results.push((function() {\n            var _j, _len1, _ref1, _results1;\n            _ref1 = node.nodes;\n            _results1 = [];\n            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n              node = _ref1[_j];\n              _results1.push(this.trigger('remove', node.id));\n            }\n            return _results1;\n          }).call(this));\n        } else {\n          _results.push(void 0);\n        }\n      }\n      return _results;\n    },\n    reinsert: function() {\n      this.remove();\n      return this.insert();\n    },\n    prevLine: function() {\n      var prev;\n      prev = this.prev();\n      while (prev && !prev.isLine) {\n        prev = prev.prev();\n      }\n      return prev;\n    },\n    nextLine: function() {\n      var next;\n      next = this.next();\n      while (next && !next.isLine) {\n        next = next.next();\n      }\n      return next;\n    },\n    prev: function() {\n      var chunk, _ref;\n      chunk = this.part.chunks[this.num - 1];\n      return chunk || ((_ref = this.part.prev()) != null ? _ref.chunks.slice(-1)[0] : void 0);\n    },\n    next: function() {\n      var chunk, _ref;\n      chunk = this.part.chunks[this.num + 1];\n      return chunk || ((_ref = this.part.next()) != null ? _ref.chunks[0] : void 0);\n    },\n    trigger: function() {\n      return this.part.trigger.apply(this.part, arguments);\n    }\n  });\n\n  Log.Chunks.Line = function(part, num, string) {\n    Log.Chunks.Chunk.call(this, part, num, string.slice(0, string.length - 1));\n    this.isLine = true;\n    return this;\n  };\n\n  Log.Chunks.Line.prototype = $.extend(new Log.Chunks.Chunk, {\n    parse: function() {\n      return [\n        {\n          type: 'paragraph',\n          id: this.id,\n          nodes: [\n            {\n              type: 'span',\n              id: \"\" + this.id + \"-0\",\n              text: this.string\n            }\n          ]\n        }\n      ];\n    },\n    insert: function() {\n      var next, prev;\n      if ((prev = this.prev()) && !prev.isLine) {\n        this.trigger('insert', this.nodes[0].nodes, {\n          after: prev.nodes[0].id\n        });\n        document.getElementById(this.nodes[0].nodes[0].id).parentNode.setAttribute('id', this.id);\n        if (this.isLine && (next = this.next())) {\n          return next.reinsert();\n        }\n      } else if (prev) {\n        return this.trigger('insert', this.nodes, {\n          after: prev.id\n        });\n      } else if (next = this.nextLine()) {\n        return this.trigger('insert', this.nodes, {\n          before: next.id\n        });\n      } else {\n        return this.trigger('insert', this.nodes, {\n          before: void 0\n        });\n      }\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/engine/chunks");minispade.register('log/engine/dom', "(function() {(function() {\n\n  Log.Dom = function(log) {\n    this.log = log;\n    this.parts = [];\n    return this;\n  };\n\n  $.extend(Log.Dom.prototype, {\n    set: function(num, string) {\n      var part;\n      if (this.parts[num]) {\n        return console.log(\"part \" + num + \" exists\");\n      } else {\n        part = new Log.Dom.Part(this, num, string);\n        this.parts[num] = part;\n        return this.parts[num].insert();\n      }\n    },\n    trigger: function() {\n      return this.log.trigger.apply(this.log, arguments);\n    }\n  });\n\n  Log.Dom.Part = function(engine, num, string) {\n    this.engine = engine;\n    this.num = num;\n    this.string = string.replace(/\\r\\n/gm, '\\n');\n    this.nodes = new Log.Dom.Nodes(this);\n    return this;\n  };\n\n  $.extend(Log.Dom.Part.prototype, {\n    insert: function() {\n      var ix, node, string, _i, _len, _ref, _results;\n      _ref = this.string.split(/^/gm);\n      _results = [];\n      for (ix = _i = 0, _len = _ref.length; _i < _len; ix = ++_i) {\n        string = _ref[ix];\n        node = Log.Dom.Node.create(this, ix, string);\n        this.nodes.push(node);\n        _results.push(node.insert());\n      }\n      return _results;\n    },\n    trigger: function() {\n      return this.engine.trigger.apply(this.engine, arguments);\n    }\n  });\n\n  Log.Dom.Part.prototype.__defineGetter__('prev', function() {\n    var num, prev;\n    num = this.num;\n    while (!(prev || num < 0)) {\n      prev = this.engine.parts[num -= 1];\n    }\n    return prev;\n  });\n\n  Log.Dom.Part.prototype.__defineGetter__('next', function() {\n    var next, num;\n    num = this.num;\n    while (!(next || num >= this.engine.parts.length)) {\n      next = this.engine.parts[num += 1];\n    }\n    return next;\n  });\n\n  Log.Dom.Nodes = function(part) {\n    this.part = part;\n    return this;\n  };\n\n  Log.Dom.Nodes.prototype = new Array;\n\n  Log.Dom.Nodes.prototype.__defineGetter__('first', function() {\n    return this[0];\n  });\n\n  Log.Dom.Nodes.prototype.__defineGetter__('last', function() {\n    return this[this.length - 1];\n  });\n\n  Log.Dom.Node = function() {};\n\n  $.extend(Log.Dom.Node, {\n    FOLDS_PATTERN: /fold:(start|end):([\\w_\\-\\.]+)/,\n    create: function(part, num, string) {\n      var fold;\n      if (fold = string.match(this.FOLDS_PATTERN)) {\n        return new Log.Dom.Fold(part, num, fold[1], fold[2]);\n      } else {\n        return new Log.Dom.Line(part, num, string);\n      }\n    }\n  });\n\n  Log.Dom.Node.prototype.__defineGetter__('prev', function() {\n    var num, prev, _ref;\n    num = this.num;\n    while (!(prev || num < 0)) {\n      prev = this.part.nodes[num -= 1];\n    }\n    return prev || ((_ref = this.part.prev) != null ? _ref.nodes.last : void 0);\n  });\n\n  Log.Dom.Node.prototype.__defineGetter__('next', function() {\n    var next, num, _ref;\n    num = this.num;\n    while (!(next || num >= this.part.nodes.length)) {\n      next = this.part.nodes[num += 1];\n    }\n    return next || ((_ref = this.part.next) != null ? _ref.nodes.first : void 0);\n  });\n\n  Log.Dom.Fold = function(part, num, event, name) {\n    this.part = part;\n    this.ends = true;\n    this.num = num;\n    this.id = \"fold-\" + event + \"-\" + name;\n    this.data = {\n      type: 'fold',\n      id: this.id,\n      event: event,\n      name: name\n    };\n    return this;\n  };\n\n  Log.Dom.Fold.prototype = $.extend(new Log.Dom.Node, {\n    insert: function() {\n      var next, prev;\n      return this.element = (prev = this.prev) ? (Log.DEBUG ? console.log(\"F - insert fold \" + this.id + \" after \" + prev.element.id) : void 0, this.trigger('insert', this.data, {\n        after: prev.element\n      })) : (next = this.next) ? (Log.DEBUG ? console.log(\"F - insert fold \" + this.id + \" before \" + next.element.id) : void 0, this.trigger('insert', this.data, {\n        before: next.element\n      })) : (Log.DEBUG ? console.log(\"F - insert fold \" + this.id) : void 0, this.trigger('insert', this.data));\n    },\n    trigger: function() {\n      return this.part.trigger.apply(this.part, arguments);\n    }\n  });\n\n  Log.Dom.Line = function(part, num, line) {\n    var chunk, _ref;\n    this.part = part;\n    this.num = num;\n    this.id = \"\" + this.part.num + \"-\" + this.num;\n    this.ends = !!((_ref = line[line.length - 1]) != null ? _ref.match(/\\r|\\n/) : void 0);\n    this.hidden = !!line.match(/\\r/);\n    this.chunks = new Log.Dom.Chunks(this, line.replace(/\\n$/, '').replace(/\\r/g, ''));\n    this.data = {\n      type: 'paragraph',\n      num: this.part.num,\n      hidden: this.hidden,\n      nodes: (function() {\n        var _i, _len, _ref1, _results;\n        _ref1 = this.chunks;\n        _results = [];\n        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n          chunk = _ref1[_i];\n          _results.push(chunk.data);\n        }\n        return _results;\n      }).call(this)\n    };\n    return this;\n  };\n\n  Log.Dom.Line.prototype = $.extend(new Log.Dom.Node, {\n    insert: function() {\n      var after, before, chunk, next, prev, _i, _j, _len, _len1, _ref, _ref1, _results;\n      if ((prev = this.prev) && !prev.ends) {\n        after = prev.chunks.last.element;\n        if (Log.DEBUG) {\n          console.log(\"1 - insert \" + this.id + \"'s nodes after the last node of prev, id \" + after.id);\n        }\n        _ref = this.chunks.slice().reverse();\n        for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n          chunk = _ref[_i];\n          chunk.element = this.trigger('insert', chunk.data, {\n            after: after\n          });\n        }\n        if (this.ends && (next = this.next) && next.reinsert) {\n          return next.reinsert();\n        }\n      } else if ((next = this.next) && !this.ends) {\n        before = next.chunks.first.element;\n        if (Log.DEBUG) {\n          console.log(\"2 - insert \" + this.id + \"'s nodes before the first node of prev, id \" + before.id);\n        }\n        _ref1 = this.chunks;\n        _results = [];\n        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n          chunk = _ref1[_j];\n          _results.push(chunk.element = this.trigger('insert', chunk.data, {\n            before: before\n          }));\n        }\n        return _results;\n      } else if (prev) {\n        if (Log.DEBUG) {\n          console.log(\"3 - insert \" + this.id + \" after the parentNode of the last node of prev, id \" + prev.id);\n        }\n        return this.element = this.trigger('insert', this.data, {\n          after: prev.element\n        });\n      } else if (next) {\n        if (Log.DEBUG) {\n          console.log(\"4 - insert \" + this.id + \" before the parentNode of the first node of next, id \" + next.id);\n        }\n        return this.element = this.trigger('insert', this.data, {\n          before: next.element\n        });\n      } else {\n        if (Log.DEBUG) {\n          console.log(\"5 - insert \" + this.id + \" at the beginning of #log\");\n        }\n        return this.element = this.trigger('insert', this.data);\n      }\n    },\n    remove: function() {\n      var chunk, element, _i, _len, _ref;\n      element = this.element;\n      _ref = this.chunks;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        chunk = _ref[_i];\n        this.trigger('remove', chunk.element);\n      }\n      if (!element.hasChildNodes()) {\n        return this.trigger('remove', element);\n      }\n    },\n    reinsert: function() {\n      this.remove();\n      return this.insert();\n    },\n    trigger: function() {\n      return this.part.trigger.apply(this.part, arguments);\n    }\n  });\n\n  Log.Dom.Line.prototype.__defineSetter__('element', function(element) {\n    var child, chunk, _i, _len, _ref, _results;\n    child = element.firstChild;\n    _ref = this.chunks;\n    _results = [];\n    for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n      chunk = _ref[_i];\n      _results.push(chunk.element = child = child.nextSibling);\n    }\n    return _results;\n  });\n\n  Log.Dom.Line.prototype.__defineGetter__('element', function() {\n    return this.chunks.first.element.parentNode;\n  });\n\n  Log.Dom.Chunks = function(parent, line) {\n    return this.push.apply(this, this.parse(parent, line));\n  };\n\n  Log.Dom.Chunks.prototype = $.extend(new Array, {\n    parse: function(parent, string) {\n      var chunk, ix, _i, _len, _ref, _results;\n      _ref = Log.Deansi.apply(string);\n      _results = [];\n      for (ix = _i = 0, _len = _ref.length; _i < _len; ix = ++_i) {\n        chunk = _ref[ix];\n        _results.push(new Log.Dom.Chunk(parent, ix, chunk));\n      }\n      return _results;\n    }\n  });\n\n  Log.Dom.Chunks.prototype.__defineGetter__('first', function() {\n    return this[0];\n  });\n\n  Log.Dom.Chunks.prototype.__defineGetter__('last', function() {\n    return this[this.length - 1];\n  });\n\n  Log.Dom.Chunk = function(line, num, data) {\n    this.line = line;\n    this.num = num;\n    this.id = \"\" + line.part.num + \"-\" + line.num + \"-\" + num;\n    this.data = $.extend(data, {\n      id: this.id\n    });\n    return this;\n  };\n\n  $.extend(Log.Dom.Chunk.prototype, {\n    prev: function() {\n      var chunk, _ref;\n      chunk = this.line.chunks[this.num - 1];\n      return chunk || ((_ref = this.line.prev()) != null ? _ref.chunks.slice(-1)[0] : void 0);\n    },\n    next: function() {\n      var chunk, _ref;\n      chunk = this.line.chunks[this.num + 1];\n      return chunk || ((_ref = this.line.next()) != null ? _ref.chunks[0] : void 0);\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/engine/dom");minispade.register('log/engine/live', "(function() {(function() {\n\n  Log.Live = function(log) {\n    this.log = log;\n    this.parts = [];\n    return this;\n  };\n\n  $.extend(Log.Live.prototype, {\n    set: function(num, string) {\n      var part;\n      if (this.parts[num]) {\n        return console.log(\"part \" + num + \" exists\");\n      } else {\n        part = new Log.Live.Part(this, num, string);\n        this.parts[num] = part;\n        return this.parts[num].insert();\n      }\n    },\n    trigger: function() {\n      return this.log.trigger.apply(this.log, arguments);\n    }\n  });\n\n  Log.Live.Part = function(log, num, string) {\n    var ix, line;\n    this.log = log;\n    this.num = num;\n    this.lines = (function() {\n      var _i, _len, _ref, _results;\n      _ref = string.split(/^/m);\n      _results = [];\n      for (ix = _i = 0, _len = _ref.length; _i < _len; ix = ++_i) {\n        line = _ref[ix];\n        _results.push(new Log.Live.Line(this, ix, line));\n      }\n      return _results;\n    }).call(this);\n    return this;\n  };\n\n  $.extend(Log.Live.Part.prototype, {\n    insert: function() {\n      return new Log.Live.Context(this.log, this).insert();\n    },\n    head: function() {\n      var head, line;\n      head = [];\n      line = this.lines[0];\n      while ((line = line != null ? line.prev() : void 0) && !line.isNewline()) {\n        head.unshift(line);\n      }\n      return head;\n    },\n    tail: function() {\n      var line, tail;\n      tail = [];\n      line = this.lines[this.lines.length - 1];\n      while (line = line != null ? line.next() : void 0) {\n        tail.push(line);\n        if (line != null ? line.isNewline() : void 0) {\n          break;\n        }\n      }\n      return tail;\n    },\n    prev: function() {\n      var num, prev;\n      num = this.num;\n      while (!(prev || num < 0)) {\n        prev = this.log.parts[num -= 1];\n      }\n      return prev;\n    },\n    next: function() {\n      var next, num;\n      num = this.num;\n      while (!(next || num >= this.log.parts.length)) {\n        next = this.log.parts[num += 1];\n      }\n      return next;\n    }\n  });\n\n  Log.Live.Line = function(part, num, string) {\n    this.part = part;\n    this.num = num;\n    this.id = \"\" + part.num + \"-\" + num;\n    this.string = string;\n    return this;\n  };\n\n  $.extend(Log.Live.Line.prototype, {\n    prev: function() {\n      var line, _ref;\n      line = this.part.lines[this.num - 1];\n      return line || ((_ref = this.part.prev()) != null ? _ref.lines.slice(-1)[0] : void 0);\n    },\n    next: function() {\n      var line, _ref;\n      line = this.part.lines[this.num + 1];\n      return line || ((_ref = this.part.next()) != null ? _ref.lines[0] : void 0);\n    },\n    isNewline: function() {\n      return this.string[this.string.length - 1] === \"\\n\";\n    },\n    isFold: function() {\n      return this.string.indexOf('fold') !== -1;\n    },\n    clone: function() {\n      return new Log.Live.Line(this.part, this.num, this.string);\n    }\n  });\n\n  Log.Live.Context = function(log, part) {\n    this.log = log;\n    this.part = part;\n    this.head = part.head();\n    this.tail = part.tail();\n    this.lines = this.join(this.head.concat(part.lines).concat(this.tail));\n    return this;\n  };\n\n  $.extend(Log.Live.Context.prototype, {\n    insert: function() {\n      var ids;\n      ids = this.head.concat(this.tail).map(function(line) {\n        return line.id;\n      });\n      if (ids.length !== 0) {\n        this.log.trigger('remove', ids);\n      }\n      return this.log.trigger('insert', this.after(), this.nodes());\n    },\n    nodes: function() {\n      var _this = this;\n      return this.lines.map(function(line) {\n        var fold, string;\n        string = line.string;\n        if (fold = _this.defold(string)) {\n          return $.extend(fold, {\n            id: line.id\n          });\n        } else {\n          return {\n            id: line.id,\n            nodes: _this.deansi(string)\n          };\n        }\n      });\n    },\n    join: function(all) {\n      var line, lines;\n      lines = [];\n      while (line = all.pop()) {\n        if (lines.length === 0 || line.isNewline()) {\n          lines.unshift(line.clone());\n        } else {\n          lines[0].string = line.string + lines[0].string;\n        }\n      }\n      return lines;\n    },\n    after: function() {\n      var line, _ref;\n      line = (_ref = this.part.lines[0]) != null ? _ref.prev() : void 0;\n      while (line && !line.isNewline() && !line.isFold()) {\n        line = line.prev();\n      }\n      return line != null ? line.id : void 0;\n    },\n    defold: function(string) {\n      var matches;\n      if (matches = string.match(/fold:(start|end):([\\w_\\-\\.]+)/)) {\n        return {\n          type: 'fold',\n          event: matches[1],\n          name: matches[2]\n        };\n      }\n    },\n    deansi: function(string) {\n      return Log.Deansi.apply(string);\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/engine/live");minispade.register('log/folds', "(function() {(function() {\n\n  Log.Folds = function() {\n    this.folds = {};\n    return this;\n  };\n\n  Log.Folds.prototype = $.extend(new Log.Listener, {\n    insert: function(log, data, pos) {\n      var fold, _base, _name;\n      if (data.type === 'fold') {\n        fold = (_base = this.folds)[_name = data.name] || (_base[_name] = new Log.Folds.Fold);\n        return fold.receive(data);\n      }\n    }\n  });\n\n  Log.Folds.Fold = function() {\n    return this;\n  };\n\n  $.extend(Log.Folds.Fold.prototype, {\n    receive: function(data) {\n      this[data.event] = data.id;\n      if (this.start && this.end && !this.active) {\n        return this.activate();\n      }\n    },\n    activate: function() {\n      var fold, next, node, nodes, _i, _len, _ref;\n      fold = node = document.getElementById(this.start);\n      next = node.nextSibling;\n      if (!((next != null ? next.id : void 0) === this.end || (next != null ? (_ref = next.nextSibling) != null ? _ref.id : void 0 : void 0) === this.end)) {\n        nodes = [];\n        while ((node = node.nextSibling) && node.id !== this.end) {\n          nodes.push(node);\n        }\n        for (_i = 0, _len = nodes.length; _i < _len; _i++) {\n          node = nodes[_i];\n          fold.appendChild(node);\n        }\n        fold.setAttribute('class', fold.getAttribute('class') + ' fold');\n      }\n      return this.active = true;\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/folds");minispade.register('log/instrument', "(function() {(function() {\n\n  Log.Metrics = function() {\n    this.values = {};\n    return this;\n  };\n\n  $.extend(Log.Metrics.prototype, {\n    start: function(name) {\n      return this.started = (new Date).getTime();\n    },\n    stop: function(name) {\n      var _base;\n      (_base = this.values)[name] || (_base[name] = []);\n      return this.values[name].push((new Date).getTime() - this.started);\n    },\n    summary: function() {\n      var metrics, name, values, _ref;\n      metrics = {};\n      _ref = this.values;\n      for (name in _ref) {\n        values = _ref[name];\n        metrics[name] = {\n          avg: values.reduce(function(a, b) {\n            return a + b;\n          }) / values.length,\n          count: values.length\n        };\n      }\n      return metrics;\n    }\n  });\n\n  Log.Instrumenter = function() {};\n\n  Log.Instrumenter.prototype = $.extend(new Log.Listener, {\n    start: function(log, event) {\n      log.metrics || (log.metrics = new Log.Metrics);\n      return log.metrics.start(event);\n    },\n    stop: function(log, event) {\n      return log.metrics.stop(event);\n    }\n  });\n\n  Log.Log = function() {};\n\n  Log.Log.prototype = $.extend(new Log.Listener, {\n    receive: function(log, num, string) {\n      return this.log(\"<b>rcv \" + num + \" \" + (JSON.stringify(string)) + \"</b>\");\n    },\n    insert: function(log, after, datas) {\n      return this.log(\"ins \" + (datas.map(function(data) {\n        return data.id;\n      }).join(', ')) + \", after: \" + (after || '?') + \", \" + (JSON.stringify(datas)));\n    },\n    remove: function(log, id) {\n      return this.log(\"rem \" + id);\n    },\n    log: function(line) {\n      return $('#events').append(\"\" + line + \"\\n\");\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/instrument");minispade.register('log/renderer/fragment', "(function() {(function() {\n\n  Log.FragmentRenderer = function() {\n    this.frag = document.createDocumentFragment();\n    this.para = this.createParagraph();\n    this.span = this.createSpan();\n    this.text = document.createTextNode('');\n    this.fold = this.createFold();\n    return this;\n  };\n\n  Log.FragmentRenderer.prototype = $.extend(new Log.Listener, {\n    remove: function(log, node) {\n      if (node) {\n        return node.parentNode.removeChild(node);\n      }\n    },\n    insert: function(log, data, pos) {\n      var after, before, node;\n      node = this.render(data);\n      if (after = pos != null ? pos.after : void 0) {\n        if (typeof after === 'String') {\n          after = document.getElementById(pos);\n        }\n        this.insertAfter(node, after);\n      } else if (before = pos != null ? pos.before : void 0) {\n        if (typeof before === 'String') {\n          before = document.getElementById(pos != null ? pos.before : void 0);\n        }\n        this.insertBefore(node, before);\n      } else {\n        this.insertBefore(node);\n      }\n      return node;\n    },\n    render: function(data) {\n      var frag, node, type, _i, _len;\n      if (data instanceof Array) {\n        frag = this.frag.cloneNode(true);\n        for (_i = 0, _len = data.length; _i < _len; _i++) {\n          node = data[_i];\n          node = this.render(node);\n          if (node) {\n            frag.appendChild(node);\n          }\n        }\n        return frag;\n      } else {\n        data.type || (data.type = 'paragraph');\n        type = data.type[0].toUpperCase() + data.type.slice(1);\n        return this[\"render\" + type](data);\n      }\n    },\n    renderParagraph: function(data) {\n      var node, para, type, _i, _len, _ref;\n      para = this.para.cloneNode(true);\n      if (data.hidden) {\n        para.setAttribute('style', 'display: none;');\n      }\n      _ref = data.nodes;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        node = _ref[_i];\n        type = node.type[0].toUpperCase() + node.type.slice(1);\n        node = this[\"render\" + type](node);\n        para.appendChild(node);\n      }\n      return para;\n    },\n    renderFold: function(data) {\n      var fold;\n      if (document.getElementById(data.id)) {\n        return;\n      }\n      fold = this.fold.cloneNode(true);\n      fold.setAttribute('id', data.id);\n      fold.setAttribute('class', \"fold-\" + data.event);\n      if (data.event === 'start') {\n        fold.lastChild.lastChild.nodeValue = data.name;\n      } else {\n        fold.removeChild(fold.lastChild);\n      }\n      return fold;\n    },\n    renderSpan: function(data) {\n      var span;\n      span = this.span.cloneNode(true);\n      if (data.id) {\n        span.setAttribute('id', data.id);\n      }\n      if (data[\"class\"]) {\n        span.setAttribute('class', data[\"class\"]);\n      }\n      span.lastChild.nodeValue = data.text;\n      return span;\n    },\n    renderText: function(data) {\n      var text;\n      text = this.text.cloneNode(true);\n      text.nodeValue = data.text;\n      return text;\n    },\n    createParagraph: function() {\n      var para;\n      para = document.createElement('p');\n      para.appendChild(document.createElement('a'));\n      return para;\n    },\n    createFold: function() {\n      var fold;\n      fold = document.createElement('div');\n      fold.appendChild(this.createSpan());\n      fold.lastChild.setAttribute('class', 'fold-name');\n      return fold;\n    },\n    createSpan: function() {\n      var span;\n      span = document.createElement('span');\n      span.appendChild(document.createTextNode(''));\n      return span;\n    },\n    insertBefore: function(node, other) {\n      var log;\n      if (other) {\n        return other.parentNode.insertBefore(node, other);\n      } else {\n        log = document.getElementById('log');\n        return log.insertBefore(node, log.firstChild);\n      }\n    },\n    insertAfter: function(node, other) {\n      if (other.nextSibling) {\n        return this.insertBefore(node, other.nextSibling);\n      } else {\n        return other.parentNode.appendChild(node);\n      }\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/renderer/fragment");minispade.register('log/renderer/inner_html', "(function() {(function() {\n\n  Log.InnerHtmlRenderer = function() {\n    this.frag = document.createDocumentFragment();\n    this.div = document.createElement('div');\n    return this;\n  };\n\n  Log.InnerHtmlRenderer.prototype = $.extend(new Log.Listener, {\n    remove: function(log, ids) {\n      var id, node, _i, _len, _ref, _results;\n      _results = [];\n      for (_i = 0, _len = ids.length; _i < _len; _i++) {\n        id = ids[_i];\n        node = document.getElementById(id);\n        if (node && !((_ref = node.getAttribute('class')) != null ? _ref.match(/fold/) : void 0)) {\n          _results.push(node.parentNode.removeChild(node));\n        } else {\n          _results.push(void 0);\n        }\n      }\n      return _results;\n    },\n    insert: function(log, after, nodes) {\n      var html;\n      log = document.getElementById('log');\n      html = this.render(nodes);\n      if (log.childNodes.length === 0) {\n        return log.innerHTML = html;\n      } else if (after) {\n        after = document.getElementById(after);\n        return this.insertAfter(this.fragmentFrom(html), after);\n      } else {\n        log = document.getElementById('log');\n        return log.insertBefore(this.fragmentFrom(html), log.firstChild);\n      }\n    },\n    render: function(nodes) {\n      var node;\n      return ((function() {\n        var _i, _len, _results;\n        _results = [];\n        for (_i = 0, _len = nodes.length; _i < _len; _i++) {\n          node = nodes[_i];\n          _results.push(this.renderNode(node));\n        }\n        return _results;\n      }).call(this)).join('');\n    },\n    renderNode: function(node) {\n      var type;\n      node.type || (node.type = 'paragraph');\n      type = node.type[0].toUpperCase() + node.type.slice(1);\n      return this[\"render\" + type](node) || '';\n    },\n    renderParagraph: function(node) {\n      var html, style;\n      if (node.hidden) {\n        style = ' style=\"display:none\"';\n      }\n      html = \"<p id=\\\"\" + node.id + \"\\\"\" + (style || '') + \"><a></a>\";\n      html += ((function() {\n        var _i, _len, _ref, _results;\n        _ref = node.nodes;\n        _results = [];\n        for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n          node = _ref[_i];\n          _results.push(this.renderNode(node));\n        }\n        return _results;\n      }).call(this)).join('');\n      return html + '</p>';\n    },\n    renderFold: function(node) {\n      if (!document.getElementById(node.id)) {\n        return \"<div id=\\\"\" + node.id + \"\\\" class=\\\"fold-\\\"\" + node.event + \"\\\" name=\\\"\" + node.name + \"\\\"></div>\";\n      }\n    },\n    renderSpan: function(node) {\n      return \"<span class=\\\"node.class\\\">\" + (this.clean(node.text)) + \"</span>\";\n    },\n    renderText: function(node) {\n      return this.clean(node.text);\n    },\n    clean: function(text) {\n      return text.replace(/\\n/gm, '');\n    },\n    fragmentFrom: function(html) {\n      var div, frag, node;\n      frag = this.frag.cloneNode();\n      div = this.div.cloneNode();\n      div.innerHTML = html;\n      while (node = div.firstChild) {\n        frag.appendChild(node);\n      }\n      return frag;\n    },\n    insertAfter: function(node, after) {\n      if (after.nextSibling) {\n        return after.parentNode.insertBefore(node, after.nextSibling);\n      } else {\n        return after.parentNode.appendChild(node);\n      }\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/renderer/inner_html");minispade.register('log/renderer/jquery', "(function() {(function() {\n\n  Log.JqueryRenderer = function() {};\n\n  Log.JqueryRenderer.prototype = $.extend(new Log.Listener, {\n    remove: function(log, ids) {\n      var id, _i, _len, _results;\n      _results = [];\n      for (_i = 0, _len = ids.length; _i < _len; _i++) {\n        id = ids[_i];\n        _results.push($(\"#log #\" + id).remove());\n      }\n      return _results;\n    },\n    insert: function(log, after, datas) {\n      var html,\n        _this = this;\n      html = datas.map(function(data) {\n        return _this.render(data);\n      });\n      return after && $(\"#log #\" + after).after(html) || $('#log').prepend(html);\n    },\n    render: function(data) {\n      var node, nodes, text;\n      nodes = (function() {\n        var _i, _len, _ref, _results;\n        _ref = data.nodes;\n        _results = [];\n        for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n          node = _ref[_i];\n          text = node.text.replace(/\\n/gm, '');\n          if (node.type === 'span') {\n            text = \"<span class=\\\"\" + node[\"class\"] + \"\\\">\" + text + \"</span>\";\n          }\n          _results.push(\"<p id=\\\"\" + data.id + \"\\\"\" + (this.style(data)) + \"><a id=\\\"\\\"></a>\" + text + \"</p>\");\n        }\n        return _results;\n      }).call(this);\n      return nodes.join(\"\\n\");\n    },\n    style: function(data) {\n      return data.hidden && 'display: none;' || '';\n    }\n  });\n\n}).call(this);\n\n})();\n//@ sourceURL=log/renderer/jquery");