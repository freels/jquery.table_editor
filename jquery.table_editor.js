function configExtraPostParams(elem) {
  var postExtras = {};

  if ( elem.attr('data-post-extras') ) {
    $.each(elem.attr('data-post-extras').split('&'), function(){
      var kv = this.split('=');
      postExtras[kv[0]] = kv[1];
    });
  }

  this.postExtras = postExtras;
}

function configModelName(elem) {
  if ( elem.attr('data-model') ) {
    this.modelName = elem.attr('data-model').split(' ')[0];
    this.pluralModelName = elem.attr('data-model').split(' ')[1];
  } else {
    this.pluralModelName = elem.attr('id');
    this.modelName = this.pluralModelName.replace(/s$/, '');
  }
}

function configAjaxEndpoints(elem) {
  var urlRoot = (elem.attr('data-ajax-root') || '').replace(/\/$/, '');

  this.createUrl = elem.attr('data-url-create') || urlRoot + '/create';
  this.updateUrl = elem.attr('data-url-update') || urlRoot + '/update';
  this.copyUrl = elem.attr('data-url-copy') || urlRoot + '/copy';
  this.destroyUrl = elem.attr('data-url-destroy') || urlRoot + '/destroy';
}

function configTableElem(elem) {
  this.table = elem.children('table');

  if ( this.table.find('tbody tr').length )
    this.table.tablesorter({sortList : [[1,0]]});

  // fix th widths so that filtering rows does not change table width.
  this.table.find('thead th').each(function(){
    var th = $(this);
    th.css('min-width', th.width());
  });
}

function configTableEvents(table) {
  var self = this;

  table.bind('mousedown', binding(this.click, this));

  this.table.bind('click.copy', function(e){
    if ( $(e.target).closest('a.copy').length ) {
      self.copyRow($(e.target).closest('tr'));
      return false;
    }
  });

  this.table.bind('click.destroy', function(e){
    if ( $(e.target).closest('a.destroy').length ) {
      self.destroyRow($(e.target).closest('tr'));
      return false;
    }
  });
}

function TableEditor(elem) {
  elem = $(elem);

  configModelName.call(this, elem);

  // ajax
  configAjaxEndpoints.call(this, elem);
  configExtraPostParams.call(this, elem);

  // table setup
  configTableElem.call(this, elem);
  configTableEvents.call(this, this.table);

  // create new link
  elem.children('a.new').click(binding(this.createNew, this));

  // filter setup
  this.filter = new TableFilter(elem.children('.filter'), this.table);

  // input cell setup
  this.cellInput = new CellInput(elem, {
    keyup   : binding(this.inputKeyUp, this),
    keydown : binding(this.inputKeyDown, this),
    blur    : binding(this.cellBlurred, this),
    cancel  : binding(this.cancelInput, this)
  });
}

TableEditor.validators = {
  number  : function(num){ return (/^[-+]?\d*(\.\d+)?$/i).test(num) },
  integer : function(num){ return (/^[-+]?\d*$/i).test(num) }
};


TableEditor.prototype = {

  // cell editing lifecycle

  focusCell : function(cell, event){
    if ( !cell.is('td') || this.cellInfo(cell).readonly ) {
      return false;

    } else {
      if ( this.currCell ) this.cellInput.blur();

      this.currCell = cell;
      this.showInput(cell, event);

      return true;
    }
  },

  showInput : function(cell, event){
    var pos = cell.position();

    var opts = $.extend(this.cellInfo(cell), {
      event  : event,
      top    : pos.top,
      left   : pos.left,
      width  : cell.outerWidth() + 1,
      height : cell.outerHeight() + 1
    });

    this.cellInput.show(opts);
  },

  refreshInput : function(){
    var cell = this.currCell;
    this.cancelInput();
    this.focusCell(cell);
  },

  cancelInput : function(){
    delete this.currCell;
    this.cellInput.blur();
  },

  cellBlurred : function(newVal){
    if ( this.currCell ) {
      this.saveCell(this.currCell, newVal);
      delete this.currCell;
    }
  },

  saveCell : function(cell, newVal){
    var info = this.cellInfo(cell);
    var row  = info.row;

    // bail if the same.
    if ( info.value == this.cellInput.val() ) return;

    if ( info.validator(newVal) ) {
      cell.add(row).removeClass('invalid');

      cell.text(newVal);

      var data = $.extend({_method : 'PUT'}, this.postExtras);
      data.id = info.id;
      if ( info.attr )
        data[this.modelName + '[' + info.attr + ']'] = newVal;

      $.ajax({
        url      : this.updateUrl,
        type     : 'POST',
        data     : data,
        dataType : 'json',
        success  : binding(this.saveSuccess, this, row),
        error    : binding(this.saveError, this, row)
      });

    } else {
      cell.add(row).addClass('invalid');
    }
  },

  insertRow : function(data, prevRow){
    var firstRow = this.table.find('tbody tr:first-child');
    var newRow = firstRow.clone();

    if ( prevRow ) {
      newRow.insertAfter(prevRow);
    } else {
      newRow.insertBefore(firstRow);
    }

    this.updateRow(newRow, data);

    // gratuitous hilighting action
    var hilight = this.table.children('div.rowhilight');
    if ( !hilight.length )
      hilight = $('<div class="rowhilight"></div>')
        .css({position : 'absolute', background : '#ffa'})
        .insertBefore(this.table);

    var rowPos = newRow.position();
    hilight.css({
      top    : rowPos.top,
      left   : rowPos.left,
      width  : newRow.outerWidth() + 1,
      height : newRow.outerHeight() + 1
    }).show();

    hilight.fadeOut(1000);

    // focus for edit
    this.focusCell(newRow.children('td').eq(0));
  },

  copyRow : function(row){
    var self = this;
    $.ajax({
      url : this.copyUrl,
      type : 'POST',
      data : { id : this.rowInfo(row).id },
      dataType : 'json',
      success : function(data, status){
	self.insertRow(data, row);
      }
    });
  },

  destroyRow : function(row){
    var self = this,
      info = this.rowInfo(row);

    var confirmed = confirm('Are you sure you want to destroy '
      + info.name + '?\nDo not destroy ' + this.pluralModelName + ' in production!');

    if ( confirmed ) {
      $.ajax({
	url : this.destroyUrl,
	type : 'POST',
	data : { id : info.id },
	dataType : 'json',
	success : function(data, status){ row.remove(); }
      });
    }
  },

  updateRow : function(row, data){
    var self = this,
      idPrefix = row.attr('id').split('_')[0];

    row.attr('id', data[this.modelName + '_id']);
    row.add(row.children()).removeClass('invalid');

    row.children('td').each(function(){
      var cell = $(this);
      var info = self.cellInfo(cell);
      var attr = data.attrs[info.attr];

      if ( typeof(attr) != 'undefined' )
        cell.html(attr === null ? '' : attr);

      if ( data.errors && data.errors[info.attr] )
        cell.addClass('invalid');
    });

    if ( data.errors ) row.addClass('invalid');
    if ( row.children().index(this.currCell) != -1 ) this.refreshInput();
  },


  // save xhr callbacks

  saveSuccess : function(row, data, status){
    this.updateRow(row, data);
  },

  saveError : function(row, xhr, status, error){
    if ( xhr.status == 404 )
      row.remove();
    else
      alert('There was an error saving the ' + this.modelName + ' ' + row.children('td').eq(0).text());
  },


  // add new

  createNew : function(e){
    var self = this;
    $.ajax({
      url : this.createUrl,
      type : 'POST',
      dataType : 'json',
      success : function(data, status){ self.insertRow(data); },
      error : function(){ alert('There was an error creating a new ' + this.modelName); }
    });
    return false;
  }
};
