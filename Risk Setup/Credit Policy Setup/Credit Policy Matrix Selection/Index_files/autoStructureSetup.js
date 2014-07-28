
$(document).ready(function () {

    loadAsync();
});

function loadAsync() {

    setTimeout(function () {
        if (cptModel)
            loadAutoStructureGrid();
        else
            loadAsync();
    }, 20);
}

function loadAutoStructureGrid() {
    $("#autoStructureGrid").GridUnload();
    jQuery("#autoStructureGrid").jqGrid({
        url: '/admin/creditPolicyType/GetAutoStructureRules',
        datatype: 'json',
        colNames: ['ID', 'Name', 'IsActive', 'Order', 'IsSystem', 'Credit Policy'],
        colModel: [
            { name: 'Id', index: 'Id', align: 'center', sortable: true, sorttype: 'int', formatter: 'integer', hidden: true },
            { name: 'Name', index: 'Name', align: 'center', sortable: true, sorttype: 'text', formatter: 'string' },
            { name: 'IsActive', index: 'IsActive', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox', editoptions: { value: 'True:False' } },
            { name: 'Order', index: 'Order', align: 'center', sortable: true, sorttype: 'int', formatter: 'integer', editoptions: { value: 'True:False' } },
            { name: 'IsSystem', index: 'IsSystem', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox' },
            { name: 'CreditPolicyName', index: 'CreditPolicyName', align: 'center', sortable: true, sorttype: 'text', formatter: 'string' },
        ],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        pager: '#autoStructurePager',
        viewrecords: true,
        sortorder: "desc",
        shrinkToFit: true,
        width: $("#content").width() * .9,
        loadui: "enable",
        ignoreCase: true,
        loadonce: true,
        mtype: 'GET',
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .46,
        onSelectRow: function (id) {
            editAd(id);
        },
        loadComplete: function () {
            var width = $('#content').width() * .9;
            $("#autoStructureGrid").jqGrid("setGridWidth", width);
        }
    });
}


function editAd(rowIndex) {
    var row = jQuery("#autoStructureGrid").getRowData(rowIndex);

    $.ajax({
        type: 'GET',
        url: '/admin/creditPolicyType/GetAutoStructureRule?Id=' + row.Id,
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            
            showAdDetailView(data);
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred loading auto structure rule.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
    }); 
}
function getFields(sel) {

    if (!sel || !sel.value)
        return;

    $.ajax({
        type: 'GET',
        url: '/admin/creditPolicyType/GetFieldsForSystemPolicy?creditPolicyTypeId=' + sel.value,
        contentType: 'application/json; charset=utf-8',
        success: function (data) {

            while (cptModel.AutoStructureModel.Fields().length > 0) {
                cptModel.AutoStructureModel.Fields().pop();
            }

            $.each(data, function (i, d) {
                cptModel.AutoStructureModel.Fields().push(new FieldModel(d));
            });

            ko.applyBindings({ adData: cptModel.AutoStructureModel }, document.getElementById("editAdDiv"));
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred loading auto structure rule.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        }
    });
}

function addNewAd() {

    var data = {
        AutoStructureRuleId: 0, Name: '', Description: '', IsActive: true, IsSystem: false,
        Fields: [defaultField()],
        CreditPolicyTypeId: 0, Order: 0
    };
    showAdDetailView(data);
}

function showAdDetailView(data) {

    AddValidationRules();
    console.log(data);
    cptModel.AutoStructureModel = new AutoStructureModel(data);

    //cptModel.AutoStructureModel.groups = cptModel.groups;

    $("#editAdDiv").empty();

    ko.mapping.fromJS(data, {}, this);
    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ adData: cptModel.AutoStructureModel }, document.getElementById("editAdDiv"));

    showAdDialog("#autoStructureModal");
}

function closeAdDialog() {
    if ($("#autoStructureModal").hasClass('ui-dialog-content')) $("#autoStructureModal").dialog("close");
    if ($("#autoStructureModal2").hasClass('ui-dialog-content')) $("#autoStructureModal2").dialog("close");

    $("#editAdDiv").empty();
}

function showAdDialog(modelId) {
    AddAdValidationRules();

    $(modelId).dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        buttons: {
        },
        close: function () {
            $(modelId).dialog("close");
            $(modelId).dialog("destroy");
            $("#editAdDiv").empty();
        }
    });

    $("#autoStructureModalInsideForm").empty();
    $(modelId).parent().appendTo("#autoStructureModalInsideForm");

    /* fixem-up, sometime in jq 1.11.0 dialog is not getting added to the body */
    var body = $("html body")[0];
    $("div.ui-dialog").each(function () {
        $(this).appendTo(body);
    });

    $(modelId).dialog("open");
}

function saveAutoStructure() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    }

    var totalPercent = 0;

    $('.Percentage').each(function(index) {
        totalPercent += parseInt($(this).val()); 
    });

    if (totalPercent != 100)
    {
        alert("All fields must total to 100%");
        return;
    }

    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    var postData = ko.mapping.toJS(cptModel.AutoStructureModel);

    //var postData = $.parseJSON(ko.mapping.toJSON(model.creditPolicyTypeModel));

    console.log(postData);
    $.ajax({
        type: 'POST',
        url: '/admin/creditPolicyType/saveAutoStructure/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(postData),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                new RuleMatrixController().getMatrixMetadata(ruleGrpType);
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                $("#autoStructureGrid").setGridParam({ datatype: 'json', page: 1 }).trigger("reloadGrid");

                closeAdDialog();
            }
            else if (response.sameNameExists) {
                var text = "<table width=\"100%\"></td><td><div><h3>Another rule with same name exists. Please enter unique name.</h3></div></td></tr></table>";
                noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
            }
            else {
                var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
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


function defaultField() {
    return { AutoStructureFieldElementId: 0, FieldElementId: 0, FieldElementGroupId: 0, Percentage: 0, IncrementType: 0 };
}

function addNewField() {

    if(cptModel && cptModel.AutoStructureModel)
        cptModel.AutoStructureModel.Fields.push(new FieldModel(defaultField()));
};

var mapping = {
    'Fields': {
        create: function (options) {
            return new FieldModel(options.data);
        }
    }
}

var AutoStructureModel = function (data) {

    var self = this;

    self.AutoStructureRuleId = ko.observable(0);
    self.Name = ko.observable("");
    self.IsActive = ko.observable(true);
    self.Description = ko.observable("");
    self.Order = ko.observable(0);
    self.CreditPolicyTypeId = ko.observable(0);
    self.Fields = ko.observableArray();
    self.IsSystem = ko.observable(true);
    self.IsSystemPolicy = ko.computed(function () {

        var cp = $.grep(cptModel.policies, function (p) { return p.Id == self.CreditPolicyTypeId(); })[0];

        if (cp)
            return cp.IsSystem;
        else
            return false;
    })

    ko.mapping.fromJS(data, mapping, this);
}

var FieldModel = function (data) {
    var field = this;
    field.AutoStructureFieldElementId = ko.observable(0);
    field.FieldElementId = ko.observable(0);
    field.FieldElementGroupId = ko.observable(0);
    field.Percentage = ko.observable(0);
    field.IncrementType = ko.observable(0);

    this.elementsFor = ko.computed(function () {
        var groupId = field.FieldElementGroupId();
        var filtered = _.filter(cptModel.elements, function (e) { return e.GroupId == groupId; });
        var sorted = _.sortBy(filtered, function (e) { return e.Name; });
        return sorted;
    })

    ko.mapping.fromJS(data, {}, this);
}

function AddAdValidationRules() {

    $('#AutoStructureConfigForm').validate({
        errorPlacement: function (error, element) {
            return true;
        },

        onfocusout: function (element) {
            $(element).valid();
        },

        rules: {
            groupName: { required: true },
            fieldElementId: { required: true },
            fieldElementGroupId: {required: true}
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