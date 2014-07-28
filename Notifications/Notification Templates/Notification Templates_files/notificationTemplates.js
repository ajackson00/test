var model = {
    templateItems: null,
    usuryModel: null
};

$(document).ready(function () {

    $("#cutoffFrequency").multiselect({});

    var body = $("html body")[0];
    $("div.ui-dialog").each(function () {
        $(this).appendTo(body);
    });
});

$(function () {

    $.ajaxSetup({ cache: false });

    AddValidationRules();

    $.when(getMetadata()).done(function () {
        setupMainGrid();
    });

    $("#cutoffFrequency").multiselect({});
});

function getMetadata() {
    var deferred = $.Deferred();
    $.getJSON("/admin/notificationTemplate/getMetadata", function (data) {
        model.templateItems = data.TemplateItems;
        model.roles = data.Roles;
        deferred.resolve();
    });
    return deferred.promise();
}

function getTemplate(id) {
    var deferred = $.Deferred();
    $.getJSON("/admin/notificationTemplate/getTemplate?templateId=" + id, {}, function (data) {
        deferred.resolve(data);
    });
    return deferred.promise();
}

function setupMainGrid() {

    $("#grid").GridUnload();

    jQuery("#grid").jqGrid({
        url: '/admin/notificationTemplate/templates',
        datatype: 'json',
        colNames: ['Id', 'Active', 'Name', 'Subject', 'From'],
        colModel: [
                { name: 'Id', index: 'Id', hidden: true },
                { name: 'IsActive', index: 'Active', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' } },
                { name: 'Name', index: 'Name' },
                { name: 'Subject', index: 'Subject', hidden: true },
                { name: 'From', index: 'From' }
        ],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        pager: '#grid_pager',
        viewrecords: true,
        sortorder: "desc",
        loadonce: true,
        shrinkToFit: true,
        width: $("#notification").parent().parent().width() - 10,
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
    var newTempalte = {
        Id: 0, Name: '', ExecutionTypes: [0], FromAddress: '', Subject: '', SelectedToken: '', HtmlContent: '<html><body></body></html>',
        TypeCode: 1, SendToEmailType: 1, From: '', Recipients: '', IsActive: true, IsBatch: false, CutoffTimeZone: '', CutoffFrequency: '', CutoffTime: '',
        NumberOfDaysPrior: '', FaxNumber: '', AssignedRoleId: 0
    };
    showDetailView(newTempalte);
}

function closeDialog() {
    if ($("#modal").hasClass('ui-dialog-content')) {
        $("#modal").dialog("close");
        //$("#modal").dialog("destroy");
    }
}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    $.when(getTemplate(row.Id)).done(function (data) {
        showDetailView(data);
    });
}

function showDetailView(data) {
    AddValidationRules();

    var templateModel = new TemplateModel(data);
    model.templateModel = templateModel;

    model.templateModel.templateItems = model.templateItems;
    model.templateModel.roles = model.roles;
    model.templateModel.frequencyOptions = ko.observableArray([
                { text: "Sunday", value: "1" }, { text: "Monday", value: "2" }, { text: "Tuesday", value: "4" }, { text: "Wednesday", value: "8" }
                , { text: "Thursday", value: "16" }, { text: "Friday", value: "32" }, { text: "Saturday", value: "64" }]);

    $("#editDiv").empty();
    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ notificationData: model.templateModel }, document.getElementById("editDiv"));

    $("#modal").dialog({});
    $("#modal").dialog("destroy");

    $.widget("ui.dialog", $.ui.dialog, {
        _allowInteraction: function (event) {
            return !!$(event.target).closest(".cke").length || this._super(event);
        }
    });

    $("#modal").dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        position: 'center',
        closeOnEscape: false,
        buttons: {
        },
        close: function () {
            $("#modal").dialog("close");
            $("#modal").dialog("destroy");
            $("#modalInsideForm").empty();
            $("#editDiv").empty();
        },
        appendTo: "#modalInsideForm"
    });

    $("#modal").dialog("open");

    forceDialogModalToTop();

    _.each(model.templateModel.ExecutionTypes(), function (type) {
        _.each($('#placeInWorkflow option'), function (option) {
            if ($(option).attr("value") == type) {
                $(option).attr("selected", "selected");
            }
        });
    });

    $("#cutoffTime").timePicker();
    $("#placeInWorkflow").multiselect({ selectedList: 2 });
    $("#cutoffFrequency").multiselect({ selectedList: 3 });

    CKEDITOR.config.width = "100%";
    CKEDITOR.replace('htmlBody', { toolbar: 'Custom' });
    CKEDITOR.instances.htmlBody.setData(model.templateModel.HtmlContent());
    disableUnlessCanEdit();//in admin layout.cshtml
}

function saveTemplate() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    };

    var postData = $.parseJSON(ko.mapping.toJSON(model.templateModel));
    postData.HtmlContent = CKEDITOR.instances.htmlBody.getData();
    postData.ExecutionTypes = $("#placeInWorkflow").val();

    if (postData.IsBatch) {
        var array = $("#cutoffFrequency").val();
        var frequency = 0;
        _.each(array, function (val) { frequency += Number(val); });
        postData.CutoffFrequency = frequency;
        postData.CutoffTime = $("#cutoffTime").val();
    } else {
        postData.CutoffFrequency = 0;
        postData.CutoffTime = "";
    }
    if (postData.FaxNumber && postData.FaxNumber.length > 0) {
        postData.FaxNumber = postData.FaxNumber.replace(/\-/g, '');
    }
    console.log(postData);

    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/admin/notificationTemplate/save/',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ model: { data: postData } }),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                closeDialog();
                window.location.reload();
                //$("#grid").setGridParam({ datatype: 'json' }).trigger("reloadGrid");
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
function TemplateModel(data) {

    var self = this;
    this.Id = ko.observable();
    this.Name = ko.observable();
    this.IsActive = ko.observable();
    this.ExecutionTypes = ko.observableArray();
    this.ExecutionType = ko.observable();
    this.FromAddress = ko.observable();
    this.Subject = ko.observable();
    this.HtmlContent = ko.observable();
    this.TypeCode = ko.observable();
    this.SendToEmailType = ko.observable();
    this.SelectedToken = ko.observable();
    this.Recipients = ko.observable();
    this.IsBatch = ko.observable();
    this.CutoffTime = ko.observable();
    this.CutoffTimeZone = ko.observable();
    this.CutoffFrequency = ko.observable();
    this.NumberOfDaysPrior = ko.observable();
    this.FaxNumber = ko.observable();
    this.AssignedRoleId = ko.observable(0);

    this.IsBatch.subscribe(function (value) {
        console.log(value);
        if (value) {
            self.CutoffTime("05:00:00 PM");
            self.CutoffTimeZone(0);
            $("#cutoffFrequency").multiselect('enable');
        } else {
            self.CutoffTime("");
            self.CutoffTimeZone(0);
            $("#cutoffFrequency").multiselect('disable');
            $("#cutoffFrequency").multiselect('uncheckAll');
        }
    });

    this.SelectedFrequency = ko.observableArray([
            (data.CutoffFrequency & 1).toString()
            , (data.CutoffFrequency & 2).toString()
            , (data.CutoffFrequency & 4).toString()
            , (data.CutoffFrequency & 8).toString()
            , (data.CutoffFrequency & 16).toString()
            , (data.CutoffFrequency & 32).toString()
            , (data.CutoffFrequency & 64).toString()
    ]);

    this.addTokenToSubject = function () {
        if (self.SelectedToken() != undefined) {
            var item = _.find(model.templateItems, function (i) { return i.Id == self.SelectedToken(); });
            self.Subject(self.Subject() + item.Name);
        }
    };

    this.addTokenToBody = function () {
        if (self.SelectedToken() != undefined && CKEDITOR.instances.htmlBody) {
            var item = _.find(model.templateItems, function (i) { return i.Id == self.SelectedToken(); });
            CKEDITOR.instances.htmlBody.insertText(item.Name);
        }
    };

    ko.mapping.fromJS(data, {}, this);
}