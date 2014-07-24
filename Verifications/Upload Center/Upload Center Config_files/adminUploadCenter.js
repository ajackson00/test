
var viewModel;
    
$(function () {

    $.ajax({
        type: 'GET',
        url: "/admin/uploadcenter/getConfig",
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            viewModel = ko.mapping.fromJS(data);
            ko.applyBindings(viewModel);
        },
        error: function (data) {
            notyModal("An error occurred getting current settings.");
        }
    });
});


function save() {
    //required for config wizard

    var postData = ko.mapping.toJS(viewModel);

    $.ajax({
        type: 'POST',
        url: "/admin/uploadcenter/save",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ Model: postData }),
        success: function(data) {
            notyModal("Saved Successfully");
        },
        error: function(data) {
            notyModal("An error occurred trying to save.");
        }
    });
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
