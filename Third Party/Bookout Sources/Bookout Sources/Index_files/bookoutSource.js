
var sources;
var bbValueFields;
var bbcValueFields;
var nadaValueFields;
var kbbValueFields;
var dateTypes;
var chromeStylePrefs;
var selectedChromeStylePref;
var oldValues = new Array();

function save() {
    //required for config wizard
}

$(function () {

    $("#tabs").tabs();

    $.getJSON("/BookoutSource/getMetadata", function (data) {
        if (data != null) {
            sources = data.Sources;
            bbValueFields = data.BBValueFields;
            bbcValueFields = data.BBCValueFields;
            nadaValueFields = data.NADAValueFields;
            kbbValueFields = data.KBBValueFields;
            dateTypes = data.DateTypes;
            chromeStylePrefs = data.ChromeStylePreferences;
            selectedChromeStylePref = data.SelectedChromePref;

            $("#chromeSettingsDiv").empty();
            $("#chromeSettingsTemplate").tmpl({Prefs: chromeStylePrefs, SelectedPref: selectedChromeStylePref}).appendTo("#chromeSettingsDiv");
        }
        $('#tabs').show();
    });

    $("#modal").dialog({
        title: 'Edit Source',
        autoOpen: false,
        height: 350,
        width: 350,
        modal: false,
        buttons: {
            Save: function () {
                saveSource();
                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });

    jQuery("#sourcesGrid").jqGrid({
        url: "/BookoutSource/bookoutSources",
        datatype: "json",
        mtype: 'GET',
        colNames: ['Id', 'ClientId', 'Active', 'Source', 'Value Field', 'Pull Date', 'UserName', 'Password', 'UseMileage'],
        colModel: [
            { name: 'Id', index: 'Id', width: 0, hidden: true },
            { name: 'ClientId', index: 'ClientId', width: 0, hidden: true },
            { name: 'Active', index: 'Active', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' } },
            { name: 'Source', index: 'Source', sortable: true, sorttype: 'Text' },
            { name: 'ValueField', index: 'ValueField' },
            { name: 'DateType', index: 'DateType' },
            { name: 'UserName', index: 'UserName', width: 0, hidden: true },
            { name: 'Password', index: 'Password', width: 0, hidden: true },
            { name: 'UseMileage', index: 'UseMileage', width: 0, hidden: true}
        ],

        rowNum: 50,
        rowList: [5, 10, 20, 50],
        width: $("#tabs").parent().parent().width() - 10,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        sortname: 'id',
        viewrecords: true,
        sortorder: "desc",
        ignoreCase: true,
        shrinkToFit: true,
        loadonce: true,
        pager: jQuery('#sourcesGrid_pager'),
        onSelectRow: function (rowIndex) {
            edit(rowIndex);
            AddValidationRules(true);
            oldValues = new Array();
            oldValues = GetControlValues();
        }
    });
});

function edit(rowIndex) {
    $("#editSourcesDiv").empty();
    var rowNote = jQuery("#sourcesGrid").getRowData(rowIndex);
    rowNote.sources = sources;

    if (rowNote.Source == "NADA")
    { rowNote.valueFields = nadaValueFields; }
    else if (rowNote.Source == "BlackBook")
    { rowNote.valueFields = bbValueFields; }
    else if (rowNote.Source == "BlackBookCanada")
    { rowNote.valueFields = bbcValueFields; }
    else if (rowNote.Source == "KBB")
    { rowNote.valueFields = kbbValueFields; }

    rowNote.dateTypes = dateTypes;

    editSource(rowNote);
}

function editSource(source) {
    console.log(source);
    $("#editSourcesDiv").empty();
    $("#editSourceTemplate").tmpl(source).appendTo("#editSourcesDiv");


    $("#editSourcesDiv").removeClass("inline_style").removeClass("popup_style").addClass("popup_style").end();
    var htmlStr = $("#editSourcesDiv").html();
    $("#editSourcesDiv").empty();

    //var buttonsDiv = $("#buttons").html();
    htmlStr += "<table width=\"100%\"><tr><td>";
    showNoty(htmlStr);
    if (source == null) {
        $.noty.get("idLabel").hide();
        $.noty.get("sourceId").hide();
    }

    if (source.IsActive) {
        if (source.IsActive == "True")
            $.noty.get("active").attr("checked", true);
        else
            $.noty.get("active").attr("checked", false);
    }

    if (source.Source.toLowerCase() == "manual" || source.Source.toLowerCase() == "lease") {
        $.noty.get("mileageAdj").attr("disabled", true);
        $.noty.get("mileageAdj").attr("checked", false);
    }
    else if (source.UseMileage && source.UseMileage.toLowerCase() == "true")
        $.noty.get("mileageAdj").attr("checked", true);
    else
        $.noty.get("mileageAdj").attr("checked", false);

    AddValidationRules(true);
    disableUnlessCanEdit();
}

function saveChrome() {
    notyAlert("Processing...");
    $.ajax({
        type: 'POST',
        url: "/admin/BookoutSource/saveChrome",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ chromeStylePreference: $('#chromeStylePrefs').val() }),
        success: function () {
            $.noty.closeAll();
            notyModal("Saved");
        },
        complete: function(xhr, status) {
            if (status != 'success') {
                $.noty.closeAll();
                notyModal("An error occurred saving");
            }
        }
    });

}

function saveClick() {

    if ($.noty.get("isActive").is(":checked")) {
        var valid = $("form").valid();
        if (!valid) {
            alert("Please enter valid data and try again.");
            return;
        };
    }
    var UserName = $.noty.get("userName");
    var Password = $.noty.get("password");

    var source = {
        Id: $.noty.get("sourceId").val(),
        ClientId: $.noty.get("clientId").val(),
        Active: $.noty.get("active").is(":checked"),
        ValueField: $.noty.get("valueField").val(),
        DateType: $.noty.get("dateType").val(),
        UserName: UserName != null ? UserName.val() : null,
        Password: Password != null ? Password.val() : null,
        UseMileage: $.noty.get("mileageAdj").is(":checked"),
    };

    $.ajax({
        type: 'POST',
        url: "/admin/BookoutSource/save",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ BookoutSourceModel: { BookoutSourceData: source } }),
        success: function () {
            setTimeout(function () {
                $("#sourcesGrid").setGridParam({ datatype: 'json', page: 1 }).trigger('reloadGrid');
            }, 1100);
        }
    });

    $.noty.closeAll();
}

function cancelClick() {
    var newValues = GetControlValues();
    var compareValues = CompareArrays(newValues, oldValues);
    if (!compareValues) {
        if (confirm("Clicking ok will cancel your changes!")) {
            $.noty.closeAll();
        }
    }
    else {
        $.noty.closeAll();
    }
}

function AddValidationRules(isactive) {

    $('form').validate({

        errorPlacement: function (error, element) {
            return true;
        },

        onfocusout: function (element) {
            $(element).valid();
        },

        rules: {
            active: { required: isactive },
            source: { required: isactive, maxlength: 80 },
            valueField: { required: isactive, maxlength: 80 }
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