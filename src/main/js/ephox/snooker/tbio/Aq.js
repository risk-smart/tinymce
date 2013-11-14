define(
  'ephox.snooker.tbio.Aq',

  [
    'ephox.compass.Arr',
    'ephox.peanut.Fun',
    'ephox.snooker.croc.CellLookup'
  ],

  function (Arr, Fun, CellLookup) {
    var aq = function (input, widths) {
      var model = CellLookup.model(input);

      var all = model.all();
      console.log('model.all: ', all);

      var total = function (start, end) {
        var r = 0;
        for (var i = start; i < end; i++) {
          r += widths[i] !== undefined ? parseInt(widths[i], 10) : 0;
        }
        return r;
      };


      return Arr.map(all, function (cell) {
        var width = total(cell.column(), cell.column() + cell.colspan());
        return {
          id: cell.id, //F
          width: Fun.constant(width)
        };
      });
    };

    var qwe = function (input, heights) {
      var model = CellLookup.model(input);

      var all = model.all();
      console.log('model.all: ', all);

      var total = function (start, end) {
        var r = 0;
        for (var i = start; i < end; i++) {
          r += heights[i] !== undefined ? parseInt(heights[i], 10) : 0;
        }
        return r;
      };


      return Arr.map(all, function (cell) {
        var height = total(cell.row(), cell.row() + cell.rowspan());
        return {
          id: cell.id, //F
          height: Fun.constant(height)
        };
      });
    };



    return {
      aq: aq,
      qwe: qwe
    };
  }
);
