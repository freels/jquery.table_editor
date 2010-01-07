function CellInput(ctx, callbacks){
  this.context = ctx;
  this.callbacks = callbacks;
  this.cell = $('<div class="cell_field"></div>');
  this.cell
    .prependTo(ctx)
    .mousedown(function(e){ e.stopPropagation() })
    .keydown(callbacks.keydown)
    .keyup(callbacks.keyup);

  this.setupWidgets();
  this.cell.children().css({position : 'absolute'}).hide();
}

CellInput.prototype = {
  blur : function(e){
    if ( this.input ) {
      if ( e && $(e.target).parents().andSelf().index(this.input.elem) == -1 )
        return false;

      this.input.hide();
      this.callbacks.blur(this.input.val());
      this.input = null;
    }
  },
  val : function(){
    return this.input ? this.input.val() : null;
  },
  show : function(opts){
    this.input = this.widgets[opts.input || opts.type] || this.widgets['text'];
    this.input.show(opts);
  },
  setupWidgets : function(){
    var self = this;
    self.widgets = {};
    $.each(CellInput.widgets, function(type, constructor){
      var widget = $.extend({}, {
        appendTo : function(cell){ this.elem = $(this.html).appendTo(cell); this.setup() },
        setup    : function(){ this.elem.blur(binding(self.blur, self)) },
        hide     : function(){ this.elem.hide() },
        val      : function(){ return this.elem.val() }
      });

      constructor.call(widget, self);
      widget.appendTo(self.cell);

      self.widgets[type] = widget;
    });
  }
};

CellInput.widgets = {
  text : function(){
    $.extend(this, {
      html : '<input class="text" type="text" />',
      show : function(o){
        this.elem.val(o.value);
        this.elem.css({
          top    : o.top,
          left   : o.left,
          width  : o.width - 6,
          height : o.height - 6
        }).show().focus().select();
	var el = this.elem;
	setTimeout(function(){ el.select(); }, 0);
      }
    });
  },

  select : function(){
    $.extend(this, {
      html : '<select class="select"></select>',
      show : function(o){
        var options = $.map(o.values.split(':'), function(val){
          return '<option ' + (o.value == val ? 'selected' : '') + ' value="' + val + '">' + val + '</option>';
        });
        this.elem.css({
          top    : o.top + 1,
          left   : o.left,
          width  : o.width,
          height : o.height
        }).html(options.join('')).show().focus();
      }
    });
  },

  checkbox : function(delegate){
    $.extend(this, {
      setup : function(){ this.elem.children().blur(binding(delegate.blur, delegate)) },
      html : '<div class="checkbox_input"><input type="checkbox" value="1" /></div>',
      val  : function(){ return this.elem.children().attr('checked') ? this.trueVal : this.falseVal },
      show : function(o){
        var values = o.values.split(':');
        var clicked = o.event ? o.event.type == 'mousedown' : false;
        this.trueVal  = values[0];
        this.falseVal = values[1] || '';

        this.elem.css({
          top    : o.top,
          left   : o.left,
          width  : o.width,
          height : o.height
        }).show()
        .children().attr('checked', o.value ? !clicked : clicked).focus();
      }
    });
  }
};

