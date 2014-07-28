var model = {
    selectedFormula: null,
    formulaModel: null
};

$(function () {
    setupMainGrid();
    getFormulas();
});

function getFormulas() {

    $("#grid").clearGridData();

    $.getJSON("/formula/getFormulas", {}, function (data) {
        model = data;

        jQuery("#grid").clearGridData();
        if (model.formulas.length > 0) {
            for (var i = 0; i <= model.formulas.length; i++)
                jQuery("#grid").jqGrid('addRowData', i + 1, model.formulas[i]);
        }

        var pageNumber = model.formulas.length > 0 ? 1 : 0;
        var totalRec = model.formulas.length / 50;
        setTimeout(function () {
            $('#grid').setGridParam({ page: pageNumber, total: totalRec, records: model.formulas.length }).trigger('reloadGrid');
        }, 1100);
    });
}

function setupMainGrid() {
    jQuery("#grid").jqGrid({
        datatype: "local",
        colNames: ['Id', 'Active', 'Name', 'Formula'],
        colModel: [
                { name: 'Id', index: 'Id', width: 0, hidden: true },
                { name: 'IsActive', index: 'IsActive', editable: true, formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' } },
                { name: 'Name', index: 'Name', editable: false, sortable: true, sorttype: 'Text' },
                { name: 'FormulaText', index: 'FormulaText', editable: false, sortable: true, sorttype: 'Text' }],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        width: $("#formulaDiv").parent().parent().width() - 10,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        sortname: 'id',
        viewrecords: true,
        sortorder: "desc",
        ignoreCase: true,
        shrinkToFit: true,
        loadonce: true,
        pager: jQuery('#grid_pager'),
        onSelectRow: function (id) {
            edit(id);
        }
    });
}

function addFormula() {
    var newFormula = { Variables: [], Id: 0, IsActive: true, Name: '', FormulaText: '', IsJavascript: false };
    AddValidationRules();
    showDetailView(newFormula);
}

function closeDialog() {
    $("#modal").dialog("close");
}

function edit(rowIndex) {
    var row = jQuery("#grid").getRowData(rowIndex);
    var matchingFile = _.filter(model.formulas, function (file) { return file.Id == row.Id; });
    AddValidationRules();
    showDetailView(matchingFile[0]);
}

function FormulaModel(formulaData) {

    var self = this;
    this.IsActive = false;
    this.Id = null;
    this.Name = null;
    this.FormulaText = null;
    this.IsJavascript = null;
    this.Variables = ko.observableArray();

    var mapping = {
        'Variables': {
            key: function (data) {
                return ko.utils.unwrapObservable(data.id);
            },
            create: function (data) {
                return new VariableModel(data);
            }
        }
    };

    this.hasValidVariableNames = function () {
        var invalidOnes = _.filter(self.Variables(), function (v) { return !v.hasValidName(); });
        return invalidOnes.length == 0;
    };

    this.hasValidVariableValues = function () {
        var invalidOnes = _.filter(self.Variables(), function (v) { return !v.hasValidValue(); });
        return invalidOnes.length == 0;
    };

    this.canValidate = function () {
        var noTestValues = _.filter(self.Variables(), function (v) { return !v.hasTestValue(); });
        console.log(noTestValues);
        return noTestValues.length == 0 && self.FormulaText != "";
    };

    this.addVariable = function () {
        var data = { data: defaultVariable() };
        console.log(data);
        self.Variables.push(new VariableModel(data));
    };

    ko.mapping.fromJS(formulaData, mapping, this);
}

function VariableModel(variableData) {

    var self = this;
    this.Id = null;
    this.Name = null;
    this.DataTypeId = null;
    this.StaticValue = null;
    this.EntryTypeId = null;
    this.DataElementGroupId = null;
    this.DataElementId = null;
    this.TestValue = null;

    ko.mapping.fromJS(variableData.data, {}, this);

    this.elementsFor = ko.computed(function () {
        var groupId = self.DataElementGroupId();
        var filtered = _.filter(model.elements, function (e) { return e.GroupId == groupId; });
        return filtered;
    });

    this.hasTestValue = function () {
        console.log(self.TestValue());
        return self.TestValue() != "";
    };

    this.hasValidValue = function () {
        if (self.EntryTypeId() == 1) {
            return self.StaticValue() != "" && self.TestValue() != "";
        } else {
            return self.DataElementId() != "" && self.TestValue() != "";
        }
    };

    this.hasValidName = function () {
        return model.formulaModel.FormulaText().indexOf(self.Name()) > -1;
    };

    this.changeOfEntryType = function () {

        if (this.EntryTypeId() == 1) {
            self.DataElementGroupId(undefined);
        } else {
            self.StaticValue("");
        }
    };

    this.remove = function () {
        console.log(self);
        if (model.formulaModel.Variables().length == 1) {
            model.formulaModel.addVariable();
        }
        model.formulaModel.Variables.remove(self);
    };
    console.log(variableData.data);
}

function showDetailView(formula) {

    model.selectedFormula = formula;

    model.formulaModel = new FormulaModel(formula);
    model.formulaModel.groups = model.groups;
    if (model.formulaModel.Variables().length == 0)
        model.formulaModel.addVariable();

    $("#editDiv").empty();

    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ formulaData: model.formulaModel }, document.getElementById("editDiv"));

    $("#modal").dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        buttons: {
        },
        close: function () {
            $('#modal').dialog("close");
            $('#modal').dialog("destroy");
            $("#editDiv").empty();
        },
        appendTo: "#modalInsideForm"
    });
    
    $("#modal").dialog("open");
    
    forceDialogModalToTop();

    disableUnlessCanEdit();
}

function defaultVariable() {
    return { Id: "", DataElementGroupId: "", DataElementId: "", EntryTypeId: "1", Name: "", IsActive: "", EntryType: "", StaticValue: "", DataElementGroup: "", DataElementName: "", TestValue: "" };
}

function showHelp() {
    window.open("/formulahelp.htm");
}

function validateFormula() {

    if (!model.formulaModel.canValidate()) {
        alert("Please enter formula text and test value for variables to validate formula");
        return;
    }
    var postData = $.parseJSON(ko.mapping.toJSON(model.formulaModel));
    console.log(postData);

    $.noty({ text: "Validating formula...", type: "information", layout: "center", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/formula/validate/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify({ FormulaModel: postData }),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                $.noty({ text: "Formula result : " + response.result, type: "information", layout: "center", timeout: false, closeButton: false, closeOnSelfOver: true, closeOnSelfClick: true });
            }
            else {
                $.noty({ text: "Validation error: " + response.error, type: "error", layout: "center", timeout: false, closeButton: false, closeOnSelfOver: true, closeOnSelfClick: true });
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        },
        async: true
    });

}

function saveFormula() {

    var valid = $("form").valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    };

    if (!model.formulaModel.hasValidVariableNames()) {
        alert("Please enter variable names that are used in formula");
        return;
    }

    if (!model.formulaModel.hasValidVariableValues()) {
        alert("Please enter value or populate from db, and enter test value for all variables");
        return;
    }

    var postData = $.parseJSON(ko.mapping.toJSON(model.formulaModel));
    console.log(postData);

    //$.noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
    $.noty({ text: "Saving formula...", type: "information", layout: "center", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/formula/saveFormula/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify({ FormulaModel: postData }),
        success: function (response) {
            $.noty.closeAll();
            if (response.success) {
                $.noty({ text: "Saved successfully", type: "information", layout: "center", timeout: 3000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                closeDialog();
                getFormulas();
            }
            else {
                $.noty({ text: "Validation error: " + response.error, type: "error", layout: "center", timeout: 5000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            var text = "<table width=\"100%\"></td><td><div><h3>An error occurred saving configuration. Please try again.</h3></div></td></tr></table>";
            noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
        },
        async: true
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
            formulaName: { required: true },
            formulaText: { required: true },
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