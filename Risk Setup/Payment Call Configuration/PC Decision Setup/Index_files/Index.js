function refreshTabContent(event) {
    if ($(event.target).hasClass("tabA")) return;
    var divId = $(event.target).hasClass("tabB") ? "#tab-2" : "#tab-3";
    var otherDiv = $(event.target).hasClass("tabB") ? "#tab-3" : "#tab-2";
    var ruleGroupTypeId = $(event.target).hasClass("tabB") ? "51" : "59";
    $(otherDiv).empty();
    $.get("/Admin/Rule?Inline=true&RuleGroupType=" + ruleGroupTypeId, function (html) {
        $(divId).html(html);
    });
}

$(function() {
    $("#tabs").tabs();
    $(".tablink").on("click", function (event) { refreshTabContent(event); });
    
    $("#btnCancelNew").hide();

    addValidationRules();

    $.when(getConfigs()).done(function() {
        for (var i = 0; i < configData.Configurations.length; i++) {
            configData.Configurations[i].FormId = Math.floor(Math.random() * 1000);
        }

        viewModel = ko.mapping.fromJS(configData);
        ko.applyBindings(viewModel, document.getElementById("tabs"));
        $("#tabs").show();
        $("#tabs").on("tabsactivate", function (event, ui) { console.log(ui); });
    });

    $("#btnSave").live("click", function() {
        var valid = $("#setupForm").valid();
        if (!valid) {
            alert("Please enter valid data and try again.");
            return;
        }
        ;

        configData = ko.mapping.toJS(viewModel);

        $.noty({ text: "saving...", type: "information", layout: "topRight", timeout: false });

        $.ajax({
            type: 'POST',
            url: "/admin/paymentcallconfig/saveConfig",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ model: configData }),
            success: function(response) {
                ko.mapping.fromJS(response, viewModel);
                window.location.reload();
            },
            error: function(xhr) {
                $.noty.closeAll();
                $.noty({ text: "failed to save configuration", type: "error", layout: "topRight", timeout: 2000 });
            }
        });
    });

    $("#btnNew").click(function() {
        $.getJSON("/admin/paymentcallconfig/getNewConfig", function(data) {
            data.Configuration.FormId = Math.floor(Math.random() * 1000);
            newModel = ko.mapping.fromJS(data.Configuration);
            viewModel.Configurations.push(newModel);
        });
        $("#btnCancelNew").show();
    });

    $("#btnCancelNew").click(function () {
        viewModel.Configurations.remove(function (item) { return item.Id() == 0 });
        $("#btnCancelNew").hide();
    });

    var dialogOptions = {
        modal: true,
        close: function(event, ui) {
            $(this).hide();
            $(this).dialog('destroy');
            $(this).insertAfter("input#editAdverseActions[ConfigurationId='" + $(this).attr('ConfigurationId') + "']")
        },
        width: 500
    };
    $("#editPolicySettings").live("click", function() {
        $("#editPolicySettingsDiv" + $(this).attr("ConfigurationId")).dialog(dialogOptions);
    });

    $("#editAdverseActions").live("click", function() {
        $("#editAdverseActionsDiv" + $(this).attr("ConfigurationId")).dialog(dialogOptions);
    });
});

var configData;
var viewModel;
var oldValues = new Array();

function getConfigs() {
    var deferred = $.Deferred();
    $.getJSON("/admin/paymentcallconfig/getConfig", function(data) {
        configData = data;
        deferred.resolve();
    });
    return deferred.promise();
}

function save() {
    //required for wizard
}

function addValidationRules() {

    $('#setupForm').validate({
        errorPlacement: function(error, element) {
            return true;
        },

        onfocusout: function(element) {
            $(element).valid();
        },

        errorElement: "span",

        highlight: function(element) {
            $(element).css('border-color', 'red');
            if ($(element).attr('id').indexOf("adverseAction") != -1)
                $(element).parent().prev("#editAdverseActions").css('border-color', 'red');
        },

        unhighlight: function(element, errorClass, validClass) {
            $(element).css('border-color', '#CCCCCC');
            if (($(element).attr('id').indexOf("adverseAction") != -1)
                && (typeof ($(element).siblings("select").css('border-color')) != 'undefined')) {
                if (rgb2hex($(element).siblings("select").css('border-color')) != '#ff0000')
                    $(element).parent().prev("#editAdverseActions").css('border-color', '#CCCCCC');
            }
            
        },
        ignore: ""
    });
}

function rgb2hex(rgb) {
     if (  rgb.search("rgb") == -1 ) {
          return rgb;
     } else {
          rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
          function hex(x) {
               return ("0" + parseInt(x).toString(16)).slice(-2);
          }
          return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]); 
     }
}

