var model = { };

$(document).ready(function () {
    initialize(false);
});

function initialize(showNew) {
    $.when(getMetadata()).done(function () {
        $("#groupId").empty();
        _.each(model.groups, function (g) {
            $("<option value='" + g.Id + "'>" + g.GroupName + "</option>").appendTo("#groupId");
        });

        $("#groupId").change(function () {
            var value = $(this).val();
            var group = _.find(model.groups, function (g) { return g.Id == value; });
            if (group.IsActive) {
                $("#isActive").attr("checked", "checked");
            } else {
                $("#isActive").removeAttr("checked");
            }

            if (group.ClientId == 0) {
                $("#isActive").attr("disabled", "disabled");
                $("#btnSaveGroup").attr("disabled", "disabled");
            } else {
                $("#isActive").removeAttr("disabled");
                $("#btnSaveGroup").removeAttr("disabled");
            }
            loadGrid(group.Id);
        });

        var groupToShow;
        
        if (showNew) {
            var sortedList = _.sortBy(model.groups, function (g) { return g.Id; });
            groupToShow = sortedList[model.groups.length - 1];
        } else {
            groupToShow = model.groups[0];
        }
        $("#groupId").val(groupToShow.Id);
        $("#groupId").trigger('change');

    });
}

function getMetadata() {
    var deferred = $.Deferred();
    $.getJSON("/admin/dataelement/getMetadata", {}, function (data) {
        model = data;
        deferred.resolve();
    });
    return deferred.promise();
}

function loadGrid(groupId) {
    groupId = groupId || $("#groupId").val();
    var showSystem = $("#includeSystem").is(":checked");
    
    $("#grid").GridUnload();
    jQuery("#grid").jqGrid({
        url: '/admin/dataElement/getDataElements?groupId=' + groupId + "&includeSystem=" + showSystem,
        datatype: 'json',
        colNames: ['ID', 'Name', 'Validation', 'Length', 'Active', 'Entry Type', 'System', 'Display Order'],
        colModel: [
            { name: 'Id', index: 'Id', align: 'center', sortable: true, sorttype: 'int', formatter: 'integer', hidden: true },
            { name: 'Name', index: 'Name', align: 'center', sortable: true, sorttype: 'text', formatter: 'string' },
            { name: 'Validation', index: 'Validation', align: 'center', sortable: true, sorttype: 'text', formatter: 'string' },
            { name: 'Length', index: 'Length', align: 'center', sortable: true, sorttype: 'int', formatter: 'integer' },
            { name: 'IsActive', index: 'IsActive', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox' },
            { name: 'EntryType', index: 'EntryType', align: 'center', sortable: true, sorttype: 'text', formatter: 'string' },
            { name: 'IsSystem', index: 'IsSystem', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox' },
            { name: 'SortOrder', index: 'SortOrder', align: 'center', sortable: true, sorttype: 'int', formatter: 'integer' }
        ],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        pager: '#pager',
        viewrecords: true,
        sortorder: "desc",
        shrinkToFit: true,
        width: $("#content").width() - 10,
        loadui: "enable",
        ignoreCase: true,
        loadonce: true,
        mtype: 'GET',
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .46,
        onSelectRow: function (id) {
            edit(id);
        }
    });

    initSearchForGrid("#grid");

}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    $.when(getDataElement(row.Id)).done(function (data) {
        showDetailView(data);
    });
}

function addNew() {
    var data = { GroupId: $("#groupId").val(), Id: '', Name: '', IsActive: true, IsRequired: false, DataTypeId: 1, EntryType: 1, SortOrder: '',
        IsCoApplicantField: '', FormulaId: '', XPath: '', AllowXPath: false, PopulateFromValue: '', PopulateFromDataGroupId: '', PopulateFromDataId: '',
        FieldLength: '', Prepopulate: false, ClientSpecific: true, IsSystem: false, CustomDropdownId: ''
    };
    var value = $("#groupId").val();
    var group = _.find(model.groups, function (g) { return g.Id == value; });
    data.AllowXPath = group.AllowXPath;
    showDetailView(data);
}

function showDetailView(data) {
    AddValidationRules();

    var dataElementModel = new DataElementModel(data);
    model.dataElementModel = dataElementModel;
    model.dataElementModel.dropdowns = model.dropdowns;
    model.dataElementModel.formulas = model.formulas;
    model.dataElementModel.groups = model.groups;
    
    $("#editDiv").empty();
    
    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ elementData: model.dataElementModel }, document.getElementById("editDiv"));

    showDialog("#modal");
    
    if (data.EditXPathOnly) {
        $('#modal :input:not(#btnClose):not(#btnSave):not(#xPath):not(#isActive)').attr('disabled', true);
    }
    else if(!data.ClientSpecific) {
        $('#modal :input:not(#btnClose)').attr('disabled', true);
    }
}

function getDataElement(id) {
    var deferred = $.Deferred();
    $.getJSON("/admin/dataElement/getDataElement?dataElementId=" + id, {}, function (data) {
        deferred.resolve(data);
    });
    return deferred.promise();
}

function showAddGroup() {
    $("#modal2").empty();
    $("#addNewGroupTemplate").tmpl({ }).appendTo("#modal2");
    showDialog("#modal2");
}

function closeDialog() {
    if ($("#modal").hasClass('ui-dialog-content')) $("#modal").dialog("close");
    if ($("#modal2").hasClass('ui-dialog-content')) $("#modal2").dialog("close");
}

function showDialog(modelId) {
    AddValidationRules();

    if ($("#modal").hasClass('ui-dialog-content')) $("#modal").dialog("destroy");
    if ($("#model2").hasClass('ui-dialog-content')) $("#model2").dialog("destroy");
    
    $(modelId).dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        buttons: {
        },
        appendTo: "#modalInsideForm"
    });

    $(modelId).dialog("open");

    forceDialogModalToTop();
}

function saveNewGroup() {
    
    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    }

    var deferred = saveGroup($("#groupName").val());
    $.when(deferred).done(function () {
        closeDialog();
        initialize(true);
    });
}

function saveGroup(newGroupName) {

    var deferred = $.Deferred();
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    var groupId = $("#groupId").val();
    var isActive = $("#isActive").is(":checked");
    newGroupName = newGroupName || "";
    
    $.ajax({
        type: 'POST',
        url: '/admin/dataElement/saveGroup/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ groupId: groupId, isActive: isActive, newGroupName: newGroupName }),
        success: function (response) {
            $.noty.closeAll();
            $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
            deferred.resolve();
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
    });

    return deferred.promise();
}

function saveElement() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    }
    
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    var postData = ko.mapping.toJS(model.dataElementModel);
    //var postData = $.parseJSON(ko.mapping.toJSON(model.dataElementModel));
    var data = { CustomFieldModel: { elementData: postData } };
    console.log(postData);
    $.ajax({
        type: 'POST',
        url: '/admin/dataElement/save/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                $("#grid").setGridParam({ datatype: 'json', page: 1 }).trigger("reloadGrid");
                closeDialog();
            }
            else if (response.sameNameExists) {
                notyModal('Another element with same name exists. Please enter unique name.');
            } else {
                notyModal(response.error);
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
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
            groupName: { required: true }
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

var DataElementModel = function (data) {

    var self = this;
    this.Id = ko.observable();
    this.Name = ko.observable();
    this.IsActive = ko.observable(true);
    this.IsRequired = ko.observable(false);
    this.IsCoApplicantField = ko.observable(false);
    this.SortOrder = ko.observable();
    this.EntryType = ko.observable(1);
    this.DataTypeId = ko.observable(1);
    this.FieldLength = ko.observable();
    this.IsSystem = ko.observable(false);
    this.CustomDropdownId = ko.observable();
    this.FormulaId = ko.observable();
    this.GroupId = ko.observable();
    this.XPath = ko.observable();
    this.AllowXPath = ko.observable(false);
    this.PopulateFromValue = ko.observable();
    this.PopulateFromDataGroupId = ko.observable();
    this.PopulateFromDataId = ko.observable();
    this.Prepopulate = ko.observable();
    this.ClientSpecific = ko.observable();
    this.EditXPathOnly = ko.observable(false);

    this.PopFromValue = ko.computed(function () {
        var result = self.PopulateFromValue() != '' ? "V" :
            self.PopulateFromDataGroupId() > 0 ? "D" : "";
        return result;
    });

    this.PopulateFromValue.subscribe(function (value) {
        if (value != '') {
            self.PopulateFromDataGroupId(undefined);
            self.PopulateFromDataId(undefined);
        }
    });

    this.PopulateFromDataGroupId.subscribe(function (value) {
        if (value > 0) {
            self.PopulateFromValue('');
        }
    });

    self.elementsFor = ko.computed(function () {
        var groupId = self.PopulateFromDataGroupId();
        var filtered = _.filter(model.elements, function (e) { return e.GroupId == groupId; });
        var sorted = _.sortBy(filtered, function (e) { return e.Name; });
        return sorted;
    });

    ko.mapping.fromJS(data, {}, this);
}