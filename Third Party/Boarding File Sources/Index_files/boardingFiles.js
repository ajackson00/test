var model = {};

function closeDialog() {
    $("#modal").dialog("close");
}

$(function () {
    initSearchForGrid("#grid");
    setupMainGrid();
    getBoardingFiles();
});

function saveFile() {

    var ids = $("#grid").getDataIDs();
    var files = [];
    console.log(ids);
    _.each(ids, function(id) {
        files.push({ BoardingFileId: id, IsActive: $("#grid").getCell(id, "IsActive") == "True" });
    });
    
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/boardingFile/saveFiles/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify({ BoardingFileModel: { BoardingFiles: files } }),
        success: function (response) {
            $.noty.closeAll();
            $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred saving configuration. Please try again.");
        },
        async: true
    });
}

function editFile() {
    var selectedId = $("#grid").getGridParam('selrow');
    if(!selectedId) {
        alert("Please select a file");
        return;
    }
    edit(selectedId);
    AddValidationRules();
}

function getBoardingFiles() {
    var type = $("#Type").val();
    $.getJSON("/boardingfile/getBoardingFiles?type=" + type, {}, function (data) {
        model = data;
        
        jQuery("#grid").clearGridData();
        if (model.files.length > 0) {
            for (var i = 0; i < model.files.length; i++)
                jQuery("#grid").jqGrid('addRowData', model.files[i].Id, model.files[i]);
        }

        var pageNumber = model.files.length > 0 ? 1 : 0;
        var totalRec = model.files.length / 50;
        $('#grid').setGridParam({ page: pageNumber, total: totalRec, records: model.files.length }).trigger('reloadGrid');
    
        if (!canEdit) {
            $.each($("input"), function () {
                $(this).attr('disabled', true);
            });

            $.each($("select"), function () {
                $(this).attr('disabled', true);
            });
        }
    });
}

function setupMainGrid() {
    jQuery("#grid").jqGrid({
        datatype: "local",
        colNames: ['Id', 'Active', 'ID', 'Source'],
        colModel: [
                { name: 'Id', index: 'Id', width: 0, hidden: true },
                { name: 'IsActive', index: 'IsActive', editable: true, formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False'} },
                { name: 'SourceKey', index: 'SourceKey', editable: false, sortable: true, sorttype: 'Text' },
                { name: 'SourceName', index: 'SourceName', editable: false, sortable: true, sorttype: 'Text'}],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        width: $("#boardingFileDiv").parent().parent().width() - 10,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        sortname: 'id',
        viewrecords: true,
        sortorder: "desc",
        ignoreCase: true,
        shrinkToFit: true,
        loadonce: true,
        pager: jQuery('#grid_pager'),
        loadComplete: function () {
            var ids = $("#grid").getDataIDs();
            for (var index = ids.length - 1; index >= 0; index--) {
                $("#grid").editRow(ids[index], true);
            };
            $("#grid").trigger("reloadGrid"); // Call to fix client-side sorting
        },
    });
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
        },

        messages: {
        },

        errorElement: "span",

        highlight: function (element) {
            $(element).css('border-color', 'red');
        },

        unhighlight: function (element, errorClass, validClass) {
            $(element).css('border-color', '#CCCCCC');
        }
    });
}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    var matchingFile = _.filter(model.files, function (file) { return file.Id == row.Id; });
    showDetailView(matchingFile[0]);
}

function showDetailView(boardingFile) {
    model.selectedFile = boardingFile;
    $("#editDiv").empty();
    $("#editFileTemplate").tmpl(boardingFile).appendTo("#editDiv");

    setupFileGrid();

    $("#sections").change(function () {
        var fileId = model.selectedFile.Id;
        var sectionId = $(this).val();
        $("#columnDetailsDiv").empty();
        $("#fileGrid").setGridParam({ datatype: 'json', page: 1, url: "/boardingfile/getFileColumns?fileId=" + fileId + "&sectionId=" + sectionId }).trigger("reloadGrid");
        showDefaultColumnDetail();
    });

    showDefaultColumnDetail();
    
    if ($("#modal").hasClass('ui-dialog-content')) 
    {
        $("#modal").dialog("destroy");
    }

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
}

function setupFileGrid() {

    var fileId = model.selectedFile.Id;
    var sectionId = $("#sections").val();
    
    var groupStr = "0:Select";
    _.each(model.groups, function (item) {
        groupStr += ";" + item.Id + ":" + item.GroupName;
    });

    model.selectedRow = 0;

    jQuery("#fileGrid").jqGrid({
        datatype: "json",
        url: "/boardingfile/getFileColumns?fileId=" + fileId + "&sectionId=" + sectionId,
        colNames: ['Id', 'DataType', 'FieldLength', 'DataElementGroupId', 'DataElementId', 'BoardingFileId', 'SectionId', 'EntryTypeId', 'Name', 'Active', 'Required', 'Entry Type', 'Value', 'Group', 'Element'],
        colModel: [
                { name: 'Id', index: 'Id', hidden: true },
                { name: 'DataType', index: 'DataType', hidden: true },
                { name: 'FieldLength', index: 'FieldLength', hidden: true },
                { name: 'DataElementGroupId', index: 'DataElementGroupId', hidden: true },
                { name: 'DataElementId', index: 'DataElementId', hidden: true },
                { name: 'BoardingFileId', index: 'BoardingFileId', hidden: true },
                { name: 'SectionId', index: 'SectionId', hidden: true },
                { name: 'EntryTypeId', index: 'EntryTypeId', hidden: true },
                { name: 'ColumnName', index: 'ColumnName', sortable: true, sorttype: 'Text' },
                { name: 'IsActive', index: 'IsActive', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False'}, width: 50 },
                { name: 'IsRequired', index: 'IsRequired', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' }, width: 70 },
                { name: 'EntryType', index: 'EntryType', sortable: true, sorttype: 'Text' },
                { name: 'Value', index: 'Value', sortable: true, sorttype: 'Text' },
                { name: 'DataElementGroup', index: 'DataElementGroup', sorttype: 'Text', sortable: true },
                { name: 'DataElementName', index: 'DataElementName', sortable: true, sorttype: 'Text' },
            ],
        rowNum: 350,
        sortname: 'id',
        viewrecords: true,
        sortorder: "desc",
        ignoreCase: true,
        scrollOffset: 0,
        scrollrows: false,
        autowidth: true,
        shrinkToFit: false,
        loadonce: true,
        height: 250,
        forceFit: true,
        onSelectRow: function (id) {
            if (model.selectedRow == id) return;
            if (model.selectedRow > 0) {
                //jQuery("#fileGrid").restoreRow(model.previousRow);
            }
            var columnData = $("#fileGrid").getRowData(id);
            showColumnDetail(columnData);
            model.selectedRow = id;
        }
    });
}

function ColumnModel(columnData) {

    ko.mapping.fromJS(columnData, {}, this);
    var self = this;

    self.entryTypes = ko.observableArray([
        { id: 1, name: 'Data Entry', type: 'DataEntry' },
        { id: 2, name: 'From DB', type: 'PopulateFromDb' }
    ]);

    self.elementsFor = ko.computed(function () {
        var groupId = self.DataElementGroupId();
        var filtered = _.filter(model.elements, function (e) { return e.GroupId == groupId; });
        var sorted = _.sortBy(filtered, function(e) { return e.Name; });
        return sorted;
    });

    self.changeOfEntryType = function () {
        var selectedEntryType = _.find(self.entryTypes(), function(et) { return et.id == self.EntryTypeId(); });
        self.EntryType(selectedEntryType.type);
        if (self.EntryTypeId() == 1) {
            self.DataElementGroupId(undefined);
        } else {
            self.Value("");
        }
    };
}

function showDefaultColumnDetail() {
    var defaultColumn = { Id: "", IsRequired: "", DataType: "", FieldLength: "", DataElementGroupId: "", DataElementId: "", BoardingFileId: "", SectionId: "", EntryTypeId: "", ColumnName: "", IsActive: "", EntryType: "", Value: "", DataElementGroup: "", DataElementName: "" };
    showColumnDetail(defaultColumn);
}

function showColumnDetail(columnData) {
    
    console.log(JSON.stringify(columnData));
    console.log(columnData);
    model.columnModel = new ColumnModel(columnData);
    model.columnModel.groups = model.groups;
    $("#columnDetailsDiv").empty();
    ko.applyBindings({ columnData: model.columnModel }, document.getElementById("columnDetailsDiv"));
}

function clearColumn() {
    model.columnModel.Value("");
    model.columnModel.EntryTypeId(1);
    model.columnModel.DataElementGroupId(undefined);
    model.columnModel.DataElementId(undefined);
    saveColumn(true);
}

function saveColumn(clear) {

    if(!clear) {
        var valid = $("form").valid();
        if (!valid) {
            alert("Please enter valid data and try again.");
            return;
        };    
    }
    
    var data = $.parseJSON(ko.mapping.toJSON(model.columnModel));
    //var entryType = $("#entryType option:selected").text();
    var groupName = $("#dataElementGroupId option:selected").text();
    var elementName = $("#dataElementId option:selected").text();
    //data.EntryType = entryType;
    data.DataElementGroup = groupName == "Select" ? "" : groupName;
    data.DataElementName = elementName == "Select" ? "" : elementName;
    data.EntryType = $("#entryType option:selected").text();
    
    var postData = { BoardingFileModel: { ColumnData: data } };
    
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/boardingFile/saveColumn/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify(postData),
        success: function (response) {
            $.noty.closeAll();
            $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
            $("#fileGrid").setRowData(model.selectedRow, data);
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred saving configuration. Please try again.");
        },
        async: true
    });
    
}

