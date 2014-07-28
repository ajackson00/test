function initSearchForGrid(gridSelector) {
    // Code for search
    $('#txtSearch').keyup(function(event) {
        var searchFiler = $('#txtSearch').val();
        var grid = jQuery(gridSelector);

        //Get all grid coloumns.
        var gridColoumns = grid.jqGrid('getGridParam', 'colModel');
        //Applying the "OR rule"
        var f = { groupOp: "OR", rules: [] };
        for (var i = 0; i < gridColoumns.length; i++) {
            //Adding filters bases on every possible field.
            var cmName = gridColoumns[i].name;
            f.rules.push({ field: cmName, op: "cn", data: searchFiler });
        }

        //Enable the search.
        grid[0].p.search = true;
        $.extend(grid[0].p.postData, { filters: JSON.stringify(f) });
        grid.trigger("reloadGrid", [{ page: 1 }]);
    });
}