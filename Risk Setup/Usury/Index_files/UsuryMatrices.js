var model = {
    selectedUsury: null,
    usuryModel: null
};

$(function () {
    $("#defaultMaxRate").autoNumeric({ vMin: '0', vMax: '999.99', aSign: '%', pSign: 's' });
    AddValidationRules();
    
    $.when(getMetadata()).done(function() {
        $("#defaultMaxRate").val(model.defaultRate);
        $("#stateCompareType").val(model.stateCompareType);
        setupMainGrid();
    });
});

function getMetadata() {
    var deferred = $.Deferred();
    $.getJSON("/admin/usury/getMatrixMetadata", {}, function(data) {
        model.states = data.States;
        model.defaultRate = data.DefaultMaxRate;
        model.stateCompareType = data.StateCompareType;
        deferred.resolve();
    });
    return deferred.promise();
}

function getUsury(id) {
    var deferred = $.Deferred();
    $.getJSON("/admin/usury/getUsury?usuryId=" + id, {}, function(data) {
        deferred.resolve(data);
    });
    return deferred.promise();
}

function setupMainGrid() {
    
    $("#grid").GridUnload();
    
    jQuery("#grid").jqGrid({
        url: '/admin/usury/getUsuries',
        datatype: 'json',
        colNames: ['Id', 'Active', 'State', 'Type'],
        colModel: [
            { name: 'Id', index: 'Id', width: 0, hidden: true },
            { name: 'IsActive', index: 'IsActive', editable: true, formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False'} },
            { name: 'State', index: 'State', editable: false, sortable: true, sorttype: 'Text'},
            { name: 'Type', index: 'Type', editable: false, sortable: true, sorttype: 'Text'}],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        pager: '#grid_pager',
        viewrecords: true,
        sortorder: "desc",
        shrinkToFit: true,
        loadonce: true,
        width: $("#usuryDiv").parent().parent().width() - 10,
        loadui: "enable",
        ignoreCase: true,
        mtype: 'GET',
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        onSelectRow: function (id) {
            edit(id);
        }
    });
}

function addNew() {
    var newUsury = {  Rows: [], Id: 0, Name: '', IsActive: false, StateId: 0, UsuryType: 0, StateCompareType: 0, MaxRate: '', TermCount: 0, DaysToFirstPayment: 30 };
    showDetailView(newUsury);
}

function closeDialog() {
    $("#modal").dialog("close");
}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    $.when(getUsury(row.Id)).done(function(data) {
        showDetailView(data);
    });
}

function showDetailView(usuryData) {
    AddValidationRules();
    
    var usuryModel = new UsuryModel(usuryData);
    var rowLength = usuryModel.Rows().length;
    if(rowLength == 0) usuryModel.addHeaderRow();
    
    rowLength = usuryModel.Rows().length;
    if(rowLength < 2) usuryModel.addNewRow();
    
    model.usuryModel = usuryModel;
    
    model.usuryModel.states = model.states;
    
    var terms = [];
    for (var i = 1; i <= 120; i++) terms.push(i);
    model.usuryModel.terms = terms;
    

    $("#modal").dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        buttons: {
        },
        appendTo: "#modalInsideForm"
    });

    $("#modal").dialog("open");
    
    forceDialogModalToTop();

    $("#editDiv").empty();
    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ usuryData: model.usuryModel }, document.getElementById("editDiv"));
}

function saveDefaultMax() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    }

    var rate = $("#defaultMaxRate").autoNumeric('get');
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/admin/usury/saveDefaultMaxRate/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ rate: rate, stateCompare: $("#stateCompareType").val() }),
        success: function (response) {
            $.noty.closeAll();
            $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
    });
    
}

function saveUsury() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    };
    
    var postData = $.parseJSON(ko.mapping.toJSON(model.usuryModel));
    
    if(!areTermsInOrder(postData)) {
        var text = "<table width=\"100%\"></td><td><div><h3>Terms are not incremental order</h3></div></td></tr></table>";
        noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        return;
    }
    
    if(postData.UsuryType == 0 && typeof postData.MaxRate == "string") {
        postData.MaxRate = postData.MaxRate.replace("%", "");
    }

    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/admin/usury/save/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ UsuryMatrixModel: { UsuryMatrixData: postData } }),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                closeDialog();
                $("#grid").setGridParam({ datatype: 'json', page: 1 }).trigger('reloadGrid');
            } else {
                var text = "<table width=\"100%\"></td><td><div><h3>" + response.error + "</h3></div></td></tr></table>";
                noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
    });
}

function areTermsInOrder(usuryData) {
        
        if(usuryData.UsuryType != 2) return true;
        var cols = _.map(usuryData.Rows, function(r) { return r.Cols[0]; });
        cols = _.filter(cols, function(c) { return c.Value != null && c.Value != ""; });
        var values = _.pluck(cols, "Value");
        
        if(values.length == 0) return true;
        
        var notInOrder = false;
        var previousValue = values[0];
        for (var i = 1; i < values.length; i++) {
            if(previousValue >= values[i]) {
                notInOrder = true;
                break;
            }
            previousValue = values[i];
        }
        return !notInOrder;
    };

function AddValidationRules() {

    $('form').validate({
        errorPlacement: function (error, element) {
            return true;
        },

        onfocusout: function (element) {
            $(element).valid();
        },

        rules: {
            defaultMaxRate: { required: true }
        },

        errorElement: "span",

        highlight: function (element) {
            $(element).css('border-color', 'red');
        },

        unhighlight: function (element, errorClass, validClass) {
            $(element).css('border-color', '#CCCCCC');
        },
        ignore: ""
    });
}

//Models
function UsuryModel(usuryData) {

    var self = this;
    this.Id = ko.observable();
    this.Name = ko.observable();
    this.IsActive = ko.observable();
    this.UsuryType = ko.observable();
    this.StateCompareType = ko.observable();
    this.DaysToFirstPayment = ko.observable();
    this.StateId = ko.observable();
    this.TermCount = ko.observable();
    this.MaxRate = ko.observable();
    this.Rows = ko.observableArray();
    
    
    var mapping = {
        'Rows': {
            key: function(data) {
                return ko.utils.unwrapObservable(data.Id);
            },
            create: function(options) {
                return new RowModel(options.data);
            },
         }
    };

    var cellFor = function(x, y, value) {
        return { Id: x, Value: value, X: x, Y: y };
    };
    
    this.addHeaderRow = function() {
        var cols = [cellFor(0, 0, ''), cellFor(1, 0, 'CY New'), cellFor(2, 0, 'CY Used'), cellFor(3, 0, '1 New'), cellFor(4, 0, '1 Used'),
            cellFor(5, 0, '2'), cellFor(6, 0, '3'), cellFor(7, 0, '4'), cellFor(8, 0, '5'), cellFor(9, 0, '6'), cellFor(10, 0, '7'), cellFor(11, 0, '8'),
            cellFor(12, 0, '9'), cellFor(13, 0, '10+')];
        var row = { Id: 0, Cols: cols };
        self.Rows.push(new RowModel(row));
    };

    this.addNewRow = function() {
        var rowIndex = this.Rows().length;
        var cols = [cellFor(0, rowIndex, ''), cellFor(1, rowIndex, ''), cellFor(2, rowIndex, ''), cellFor(3, rowIndex, ''), cellFor(4, rowIndex, ''),
            cellFor(5, rowIndex, ''), cellFor(6, rowIndex, ''), cellFor(7, rowIndex, ''), cellFor(8, rowIndex, ''), cellFor(9, rowIndex, ''),
            cellFor(10, rowIndex, ''), cellFor(11, rowIndex, ''), cellFor(12, rowIndex, ''), cellFor(13, rowIndex, '')];
        var row = { Id: 0, Cols: cols };
        self.Rows.push(new RowModel(row));
    };

    this.removeLastRow = function() {
        var rowIndex = this.Rows().length;
        if(rowIndex == 0) return;
        self.Rows.pop();
    };

    this.onTermChange = function () {
        var termValue = self.TermCount();
        var rowCount = this.Rows().length - 1;
        if(termValue == rowCount) return;
        if(termValue > rowCount) {
            for (var i = 0; i < termValue - rowCount; i++) {
                self.addNewRow();
            }
        }else {
            for (var i = 0; i < rowCount - termValue; i++) {
                self.removeLastRow();
            }
        }
    };
    
    this.onTypeChange = function() {
        var rowCount = self.Rows().length;
        if(self.UsuryType() == 1 && rowCount > 2) {
            for (var i = 0; i < rowCount - 2; i++) {
                self.removeLastRow();
            }
        }
        if(self.UsuryType() == 2 && !(self.DaysToFirstPayment() > 0)) {
            self.DaysToFirstPayment(30);
        }
        $("#modal").dialog("option", "position", "center");
    };

    ko.mapping.fromJS(usuryData, mapping, this);
}

function RowModel(rowData) {

    this.Id = ko.observable();
    this.Cols = ko.observableArray();

    var mapping = {
        'Cols': {
            key: function(data) {
                return ko.utils.unwrapObservable(data.Id);
            },
            create: function(options) {
                return new ColModel(options.data);
            }
        }
    };
    
    ko.mapping.fromJS(rowData, mapping, this);
}

function ColModel(columnData) {

    var self = this;
    this.Id = ko.observable();
    this.Value = ko.observable();
    this.X = ko.observable();
    this.Y = ko.observable();
    ko.mapping.fromJS(columnData, {}, this);
}

