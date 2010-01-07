jQuery.extend(TableEditor.prototype, {
  click : function(e){
    var cell = $(e.target).closest('td');
    if ( cell.length ) {
      this.focusCell(cell, e);
      return false;
    };
  },

  inputKeyDown : function(e){
    var k = e.keyCode;
    switch ( k ) {
      // shift
      case 16: this.shiftDown = true; break;
      // tab
      case 9: this.moveHoriz(this.shiftDown, true); break;
      // return
      case 13: this.moveVert(this.shiftDown); break;
      // esc
      case 27: this.cancelInput(); break;
      // up/down arrows
      //case 38: case 40: this.moveVert(k == 38); break;
      // left/right arrows
      //case 37: case 39: this.moveHoriz(k == 37, false); break;
      // do not prevent default if it is not a movement key
      default: return true;
    }
    // if we handled a keypress, prevent default;
    return false;
  },

  inputKeyUp : function(e){
    if ( e.keyCode == 16 ) this.shiftDown = false;
  },


  // key nav

  moveHoriz : function(left, wrap){
    var wrap_row, cell = this.currCell;

    do {
      wrap_row = cell.parent('tr')[left ? 'prev' : 'next']('tr');
      cell     = cell[left ? 'prev' : 'next']('td');

      if ( wrap && !cell.length && wrap_row.length ) {
        cell = wrap_row.children('td').eq(left ? wrap_row.children('td').length - 1 : 0);
      }

    } while ( cell.length && !this.focusCell(cell) );
  },

  moveVert : function(up){
    var parent = this.currCell.parent('tr');
    var index  = parent.children('td').index(this.currCell);

    this.focusCell(parent[up ? 'prevAll' : 'nextAll']('tr:not(.filtered)').eq(0).children('td').eq(index));
  }
});