
var viewModel;
var oldValues = [];

$(function () {
    $.ajax({
        type: 'GET',
        url: "/admin/defaultStartPage/getConfig",
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            viewModel = ko.mapping.fromJS(data);
            ko.applyBindings(viewModel);
            oldValues = GetControlValues();
        },
        complete: function (xhr, textStatus) {
            if (textStatus != 'success') {
                console.log(xhr.responseText);
                notyModal("An error occurred getting current settings.");
            }
        }
    });

    $("#btnSave").click(function () {
        save();
    });
    $("#btnCancel").click(function () {
        cancelClick();
    });

    AddValidationRules();
});

function save() {
    //required for config wizard

    var valid = $("form").valid();
    if (!valid) {
        notyModal("All fields are required.");
        return;
    };

    var postData = ko.mapping.toJS(viewModel);

    notyModal('Processing...');
    $.ajax({
        type: 'POST',
        url: "/admin/defaultStartPage/save",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ Model: postData }),
        success: function (data) {
            notyModal("Saved Successfully");
        },
        complete: function (xhr, textStatus) {
            $.noty.closeAll();
            if (textStatus != 'success') {
                console.log(xhr.responseText);
                notyModal("An error occurred saving current settings.");
            }
        }
    });
}

function cancelClick() {
    var newValues = GetControlValues();
    var compareValues = CompareArrays(newValues, oldValues);
    if (!compareValues) {
        if (confirm("Clicking ok will cancel your changes!")) {
            $.noty.closeAll();
            location.reload();
        }
    }
    else {
        $.noty.closeAll();
    }
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
            selectionType: { required: true }
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