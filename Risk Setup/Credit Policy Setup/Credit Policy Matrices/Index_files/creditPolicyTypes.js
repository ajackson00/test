var cptModel = { };

$(document).ready(function () {
    
    $("#tabs").tabs();

    $.when(getMetadata()).done(function () {
        loadGrid();
        $('#tabs').show();
        //var width = $('#main').width();
        //$("#ruleMatricesGrid").jqGrid("setGridWidth", width);
        //$("#rulesGrid").jqGrid("setGridWidth", width);
    });
});

function getMetadata() {
    var deferred = $.Deferred();
    $.getJSON("/admin/creditPolicyType/getMetadata", {}, function (data) {
        cptModel = data;
        cptModel.isMoneyFactor = $("#isMoneyFactor").val() == "true";
        deferred.resolve();
    });
    return deferred.promise();
}

function loadGrid() {
    $("#grid").GridUnload();
    jQuery("#grid").jqGrid({
        url: '/admin/creditPolicyType/getTypes?moneyFactor=' + $("#isMoneyFactor").val(),
        datatype: 'json',
        colNames: ['ID', 'Name', 'IsActive', 'IsSystem', 'DataTypeId', 'SourceDataElementId', 'SourceDataElementGroupId', 'IsMinimum'],
        colModel: [
            { name: 'Id', index: 'Id', align: 'center', sortable: true, sorttype: 'int', formatter: 'integer', hidden: true },
            { name: 'Name', index: 'Name', align: 'center', sortable: true, sorttype: 'text', formatter: 'string' },
            { name: 'IsActive', index: 'IsActive', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox', editoptions: { value: 'True:False' } },
            { name: 'IsSystem', index: 'IsSystem', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox', editoptions: { value: 'True:False' } },
            { name: 'DataTypeId', index: 'DataTypeId', align: 'center', sortable: true, sorttype: 'text', formatter: 'string', hidden: true },
            { name: 'SourceDataElementId', index: 'SourceDataElementId', align: 'center', sortable: true, sorttype: 'text', formatter: 'string', hidden: true },
            { name: 'SourceDataElementGroupId', index: 'SourceDataElementGroupId', align: 'center', sortable: true, sorttype: 'text', formatter: 'string', hidden: true },
            { name: 'IsMinimum', index: 'IsMinimum', align: 'center', sortable: true, sorttype: 'checkbox', formatter: 'checkbox', editoptions: { value: 'True:False' }, hidden: true },
        ],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        pager: '#pager',
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
            edit(id);
        },
        loadComplete: function() {
            var width = $('#content').width() * .9;
            $("#ruleMatricesGrid").jqGrid("setGridWidth", width);
        }
    });
}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    showDetailView(row);
}

function addNew() {
    var data = { Id: '', Name: '', IsActive: "True", IsSystem: "False", DataTypeId: "", SourceDataElementId: "", SourceDataElementGroupId: "", IsMinimum: "True" };
    showDetailView(data);
}

function showDetailView(data) {
    AddValidationRules();
    data.IsActive = data.IsActive == "True";
    data.IsSystem = data.IsSystem == "True";
    data.IsMinimum = data.IsMinimum == "True";
    data.IsMoneyFactor = cptModel.isMoneyFactor;
    console.log(data);
    cptModel.creditPolicyTypeModel = new CreditPolicyTypeModel(data);
    cptModel.creditPolicyTypeModel.groups = cptModel.groups;
    
    $("#editDiv").empty();
    
    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ elementData: cptModel.creditPolicyTypeModel }, document.getElementById("editDiv"));

    //not needed.
    showDialog("#modal");
}

function closeDialog() {
    if ($("#modal").hasClass('ui-dialog-content')) $("#modal").dialog("close");
    if ($("#modal2").hasClass('ui-dialog-content')) $("#modal2").dialog("close");

    $("#editDiv").empty();
}

function showDialog(modelId) {
    AddValidationRules();

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
            $("#editDiv").empty();
        }
    });

    $("#modalInsideForm").empty();
    $(modelId).parent().appendTo("#modalInsideForm");

    /* fixem-up, sometime in jq 1.11.0 dialog is not getting added to the body */
    var body = $("html body")[0];
    $("div.ui-dialog").each(function () {
        $(this).appendTo(body);
    });

    $(modelId).dialog("open");
}

function saveType() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    }
    
    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    var postData = ko.mapping.toJS(cptModel.creditPolicyTypeModel);
    //var postData = $.parseJSON(ko.mapping.toJSON(model.creditPolicyTypeModel));
    console.log(postData);
    $.ajax({
        type: 'POST',
        url: '/admin/creditPolicyType/save/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ creditPolicyTypeData: postData, isMoneyFactor: $("#isMoneyFactor").val() }),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                new RuleMatrixController().getMatrixMetadata(ruleGrpType);
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                $("#grid").setGridParam({ datatype: 'json', page: 1 }).trigger("reloadGrid");
                closeDialog();
            }
            else if (response.sameNameExists) {
                var text = "<table width=\"100%\"></td><td><div><h3>Another type with same name exists. Please enter unique name.</h3></div></td></tr></table>";
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

var CreditPolicyTypeModel = function (data) {

    var self = this;
    this.Id = ko.observable();
    this.Name = ko.observable();
    this.IsActive = ko.observable(true);
    this.IsSystem = ko.observable(false);
    this.DataTypeId = ko.observable("");
    this.SourceDataElementId = ko.observable("");
    this.SourceDataElementGroupId = ko.observable("");
    this.IsMinimum = ko.observable(false);
    this.IsMoneyFactor = ko.observable(false);

    self.MinMaxValue = ko.computed({
        read: function() {
            return self.IsMinimum() ? 1 : 2;
        },
        write: function (value) {
            self.IsMinimum(value == 1);
        }
    });

    self.elementsFor = ko.computed(function () {
        var groupId = self.SourceDataElementGroupId();
        var filtered = _.filter(cptModel.elements, function (e) { return e.GroupId == groupId; });
        var sorted = _.sortBy(filtered, function (e) { return e.Name; });
        return sorted;
    });
    
    ko.mapping.fromJS(data, {}, this);
}