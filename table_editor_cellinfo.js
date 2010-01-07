jQuery.extend(TableEditor.prototype, {
  columnInfo : function(i){
    this._columnInfo = this.columnInfo || {};

    if ( !this._columnInfo[i] ) {
      var th = this.table.find('th').eq(i);

      this._columnInfo[i] = {
        attr     : th.attr('data-attr') || th.text(),
        type     : th.attr('data-type') || 'string',
        values   : th.attr('data-values') || undefined,
        readonly : th.hasClass('readonly')
      };

      this._columnInfo[i].validator = TableEditor.validators[this._columnInfo[i].type] || function(){ return true };
    }

    return this._columnInfo[i];
  },

  rowInfo : function(row){
    return {
      id : row.attr('id').split('_').slice(-1)[0],
      name : row.children('td').eq(0).text()
    };
  },

  cellInfo : function(cell){
    var row = cell.parent('tr');

    var info = {
      index : row.children('td').index(cell),
      value : cell.text(),
      row   : row
    };

    return $.extend(info, this.rowInfo(row), this.columnInfo(info.index));
  }
});