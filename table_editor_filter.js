function TableFilter(input, table){
  this.input = $(input);
  this.table = $(table);
  this.placeholder = this.input.attr('data-placeholder');

  var c = binding(this.applyFilter, this);
  this.input
    .change(c)
    .keyup(c)
    .focus(binding(this.focus, this))
    .blur(binding(this.blur, this))
    .blur(); // show placeholder
}

TableFilter.prototype = {
  applyFilter : function(){
    var rows   = this.table.find('tbody tr'),
        filter = this.input.val();

    if ( filter ) {
      var re = new RegExp(this.filterEscape(filter), 'i');
      rows.each(function(){
	var row = $(this);
        var name = row.children('td').eq(0).text();
	re.test(name) ? row.removeClass('filtered') : row.addClass('filtered');
      });
    } else {
      rows.removeClass('filtered');
    }
  },

  focus : function(){
    if ( this.input.hasClass('empty') )
      this.input.removeClass('empty').val('');
  },

  blur : function(){
    if ( !this.input.val() )
      this.input.addClass('empty').val(this.placeholder);
      // thankfully, this doesn't fire onChange
  },

  filterEscape : function(filter){
    return escapeRegExp(filter).replace(/\\\*/g, '.+').replace(/\\\?/g, '.');
  }
};
