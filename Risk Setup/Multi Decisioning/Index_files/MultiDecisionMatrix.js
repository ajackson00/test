var model = {
    selectedMatrix: null,
    matrixModel: null
};

$(function () {

    $.ajaxSetup({ cache: false });
    
    AddValidationRules();
    
    $.when(getMetadata()).done(function() {
        setupMainGrid();
    });
});

function getMetadata() {
    var deferred = $.Deferred();
    $.getJSON("/admin/multiDecisionMatrix/getMatrixMetadata", {}, function(data) {
        model.elements = data.elements;
        deferred.resolve();
    });
    return deferred.promise();
}

function getMatrix(id) {
    var deferred = $.Deferred();
    $.getJSON("/admin/multiDecisionMatrix/getMatrix?matrixId=" + id, {}, function(data) {
        deferred.resolve(data);
    });
    return deferred.promise();
}

function setupMainGrid() {
    
    $("#grid").GridUnload();
    
    jQuery("#grid").jqGrid({
        url: '/admin/multiDecisionMatrix/getMatrices',
        datatype: 'json',
        colNames: ['Id', 'Name', 'Identifier', 'Active', 'X Axis', 'Y Axis', 'Z Axis'],
        colModel: [
            { name: 'Id', index: 'Id', width: 0, hidden: true },
            { name: 'Name', index: 'Name', editable: false, sortable: true, sorttype: 'Text' },
            { name: 'Identifier', index: 'Identifier', editable: false, sortable: true, sorttype: 'Text' },
            { name: 'Active', index: 'Active', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False'} },
            { name: 'XAxis', index: 'XAxis', editable: false, sortable: true, sorttype: 'Text'},
            { name: 'YAxis', index: 'YAxis', editable: false, sortable: true, sorttype: 'Text'},
            { name: 'ZAxis', index: 'ZAxis', editable: false, sortable: true, sorttype: 'Text'},
        ],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        pager: '#grid_pager',
        viewrecords: true,
        sortorder: "desc",
        loadonce: true,
        shrinkToFit: true,
        width: $("#mainDiv").parent().parent().width() - 10,
        loadui: "enable",
        ignoreCase: true,
        pager: jQuery('#pager'),
        mtype: 'GET',
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        onSelectRow: function (id) {
            edit(id);
        }
    });
}

function addNew() {
    var newMatrix = { Id: 0, Name: '', XDataElementId: 0, YDataElementId: 0, ZDataElementId: 0, XDisplaySize: 0, YDisplaySize: 0, ZDisplaySize: 0,
        XMaxSize: 0, YMaxSize: 0, ZMaxSize: 0, PopulateType: 1, XTolerance: '', XIsTolerancePercent: false, YTolerance: '', YIsTolerancePercent: false,
        ZTolerance: '', ZIsTolerancePercent: false, IsActive: true, CellXCoordinate : '', CellYCoordinate : '', Identifier: '', IsPublished: false, PublishedOn: ''
    };
    showDetailView(newMatrix);
}

function closeDialog() {
    $("#modal").dialog("close");
}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    $.when(getMatrix(row.Id)).done(function(data) {
        showDetailView(data);
    });
}

function showDetailView(data) {
    AddValidationRules();

    model.matrixModel = new MatrixModel(data);
    model.matrixModel.elements = model.elements;
    model.matrixModel.sizes = [1,2,3,4,5,6,7];
    
    $("#modal").dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        buttons: {
        },
        close: function () {
            $("#modal").dialog("close");
        },
        appendTo: "#modalInsideForm"
    });

    $("#modal").dialog("open");

    forceDialogModalToTop();

    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ matrixData: model.matrixModel }, document.getElementById("editDiv"));

}

function uploadFile() {
    var formData = new FormData($('form')[0]);
    $.ajax({
        url: "/admin/multiDecisionMatrix/upload?matrixId=" + model.matrixModel.Id(),
        type: 'POST',
        beforeSend: function () {
            $.noty.closeAll();
            $.noty({ text: "Uploading...", type: "information", layout: "topRight", timeout: false });
        },
        success: function (event) {
            console.log(event);
            if (event.success) {
                $.noty.closeAll();
                $.noty({ text: "Uploaded successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
            } else {
                error = true;
                $.noty.closeAll();
                $("#uploader").val("");
                var htmlStr = "<table width=\"100%\"><tr><td><div id=\"processing\"><h3>" + event.error + "</h3></div></td></tr></table>";
                noty({ "text": htmlStr, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
            }
        },
        error: function (event) {
            $.noty.closeAll();
            $("#uploader").val("");
            var htmlStr = "<table width=\"100%\"><tr><td><div id=\"processing\"><h3>An error occured uploading your file.</h3></div></td></tr></table>";
            noty({ "text": htmlStr, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        },
        async: false,
        // Form data
        data: formData,
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false
    });
}

function CheckFileExtension(file) {
    var result = true;
    var ext = file.split('.').pop().toLowerCase();
    if($.inArray(ext, ['xls','xlsx']) == -1) {
        result = false;
    }
    return result;
}

function saveMatrix() {

    var valid = $("form").valid();
    if (!valid) {
        showNotyError("Please enter valid data and try again.");
        return;
    };
    
    var postData = $.parseJSON(ko.mapping.toJSON(model.matrixModel));
    console.log(postData);
    
    if (postData.XDataElementId == postData.YDataElementId || postData.YDataElementId == postData.ZDataElementId
        || postData.ZDataElementId == postData.XDataElementId) {
        showNotyError("Fields must be unique");
        return;
    }

    if (postData.XDisplaySize > postData.XMaxSize || postData.YDisplaySize > postData.YMaxSize ||
     (postData.ZDataElementId > 0 && postData.ZDisplaySize > postData.ZMaxSize)) {
        showNotyError("Display size must be less than or equal to Max size.");
        return;
    }

    if (postData.CellXCoordinate > postData.XDisplaySize || postData.CellYCoordinate > postData.YDisplaySize) {
        showNotyError("Cell X, Y coordinates must be less than or equal to display size");
        return;
    }
    
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/admin/multiDecisionMatrix/save/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ data: postData }),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                closeDialog();
                $("#grid").setGridParam({ datatype: 'json' }).trigger("reloadGrid");
            } else {
                showNotyError(response.error);
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
    });
}

function showNotyError(error) {
    var text = "<table width=\"100%\"></td><td><div><h3>" + error + "</h3></div></td></tr></table>";
    noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
}

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

function downloadFormat() {
    window.open('/admin/multiDecisionMatrix/downloadFormat/?id=' + model.matrixModel.Id());
}

//Models
function MatrixModel(data) {

    var self = this;
    this.Id = ko.observable();
    this.Name = ko.observable();
    this.IsActive = ko.observable();
    this.XDataElementId = ko.observable();
    this.YDataElementId = ko.observable();
    this.ZDataElementId = ko.observable();
    this.XDisplaySize = ko.observable();
    this.YDisplaySize = ko.observable();
    this.ZDisplaySize = ko.observable();
    this.XMaxSize = ko.observable();
    this.YMaxSize = ko.observable();
    this.ZMaxSize = ko.observable();
    this.PopulateType = ko.observable();
    this.XTolerance = ko.observable();
    this.XIsTolerancePercent = ko.observable();
    this.YTolerance = ko.observable();
    this.YIsTolerancePercent = ko.observable();
    this.ZTolerance = ko.observable();
    this.ZIsTolerancePercent = ko.observable();
    this.CellXCoordinate = ko.observable();
    this.CellYCoordinate = ko.observable();
    this.Identifier = ko.observable();
    this.IsPublished = ko.observable(false);
    this.PublishedOn = ko.observable();

    this.XTolerancePercent = ko.computed({
        read: function () {
            return self.XIsTolerancePercent() ? 1 : 0;
        },
        write: function (value) {
            self.XIsTolerancePercent(value == 1);
        }
    });

    this.YTolerancePercent = ko.computed({
        read: function () {
            return self.YIsTolerancePercent() ? 1 : 0;
        },
        write: function (value) {
            self.YIsTolerancePercent(value == 1);
        }
    });

    this.ZTolerancePercent = ko.computed({
        read: function () {
            return self.ZIsTolerancePercent() ? 1 : 0;
        },
        write: function (value) {
            self.ZIsTolerancePercent(value == 1);
        }
    });
    
    ko.mapping.fromJS(data, {}, this);
}