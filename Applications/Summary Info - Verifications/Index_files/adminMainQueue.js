
var oldValues = new Array();
$.ajaxSetup({ cache: false });

var viewModel;

function MainQueueModel(data) {
    var self = this;
    ko.mapping.fromJS(data.Configuration, {}, self);
    
    if (!self.Id) self.Id = ko.observable();
    if (!self.RefreshInterval) self.RefreshInterval = ko.observable();
    if (!self.ScreenType) self.ScreenType = ko.observable();
    if (!self.DefaultTransactionType) self.DefaultTransactionType = ko.observable();
    
    if (!self.SortedColumns) self.SortedColumns = ko.observableArray();
    if (!self.SelectedColumns) self.SelectedColumns = ko.observableArray();
    if (!self.AvailableColumns) self.AvailableColumns = ko.observableArray();
    if (!self.SortDirections) self.SortDirections = ko.observableArray();
    self.selectedLeftItems = ko.observableArray();
    self.selectedRightItems = ko.observableArray();

    self.update = function (updatedData) {
        ko.mapping.fromJS(updatedData.Configuration, self);
        //seriously don't know why, but I have to call this twice for sorted columns to refresh properly on a cancel.
        ko.mapping.fromJS(updatedData.Configuration, self);

        if (self.SortedColumns().length == 0) {
            self.AddSort(0);
        }
    };

    self.SortedColumns.subscribe(function () {
        _.each(self.SortedColumns(), function (column, index) {
            column.Order(index + 1);
        });
    });
    
    self.MoveRight = function () {
        if (self.selectedLeftItems().length == 0) {
            if ($("#availableColumns option:selected").length == 0) {
                notyModal('Please select column to assign.');
                return;
            } else {
                //total workaround for KO and selenium not playing nice
                //reproduceable as a human if you click one option, drag down to grab many
                //then drag your mouse out of the select box
                $("#availableColumns option:selected").each(function () {
                    var text = $(this).text();
                    var koItem = _.find(self.AvailableColumns(), function (item) {
                        return item.Text() === text;
                    });
                    self.selectedLeftItems.push(koItem);
                });
            }
        }

        _.each(self.selectedLeftItems(), function (item) {
            if (!item.Order) item.Order = ko.observable(self.SelectedColumns().length + 1);
            else (item.Order(self.SelectedColumns().length + 1));
            self.SelectedColumns.push(item);
            self.AvailableColumns.remove(item);
        });
        self.selectedLeftItems.removeAll();
    };

    self.MoveLeft = function () {
        var screenType = $("#ScreenType").val();
        if (self.selectedRightItems().length == 0) {
            if ($("#selectedColumns option:selected").length == 0) {
                notyModal('Please select column to unassign.');
                return;
            } else {
                //total workaround for KO and selenium not playing nice
                //reproduceable as a human if you click one option, drag down to grab many
                //then drag your mouse out of the select box
                $("#selectedColumns option:selected").each(function () {
                    var text = $(this).text();
                    var koItem = _.find(self.SelectedColumns(), function (item) {
                        return item.Text() === text;
                    });
                    self.selectedRightItems.push(koItem);
                });
            }
        }

        _.each(self.selectedRightItems(), function (item) {
            if (item.Text() == "Application Number") {
                notyModal('Application Number is not allowed to remove from selected list');
                return;
            }
            else if (item.Text() == "Comments" && screenType == 1) {
                notyModal('Comments is not allowed to remove from selected list');
                return;
            }

            self.SelectedColumns.remove(item);
            self.AvailableColumns.push(item);
        });
        self.selectedRightItems.removeAll();
    };

    self.MoveUp = function () {
        if (self.selectedRightItems().length == 0) return;
        
        var newOrder = [];
        for (var i = 0; i < self.SelectedColumns().length; i++) {
            var selected = _.find(self.selectedRightItems(), function(s) {
                return s.Id() == self.SelectedColumns()[i].Id();
            });

            if (!selected || i == 0) newOrder[i] = self.SelectedColumns()[i];
            else {
                var last = newOrder[i - 1];
                newOrder[i - 1] = self.SelectedColumns()[i];
                newOrder[i] = last;
            }
        }
        var oldSorted = self.SortedColumns.splice(0, self.SortedColumns().length);
        self.SelectedColumns.removeAll();
        _.each(newOrder, function(item, index) {
            item.Order(index + 1);
            self.SelectedColumns.push(item);
        });
        _.each(oldSorted, function (item) { self.SortedColumns.push(item); });
    };
    
    self.MoveDown = function () {
        if (self.selectedRightItems().length == 0) return;

        var newOrder = [];
        for (var i = self.SelectedColumns().length-1; i >= 0; i--) {
            var selected = _.find(self.selectedRightItems(), function (s) {
                return s.Id() == self.SelectedColumns()[i].Id();
            });

            if (!selected || i == self.SelectedColumns().length-1) newOrder[i] = self.SelectedColumns()[i];
            else {
                var last = newOrder[i + 1];
                newOrder[i + 1] = self.SelectedColumns()[i];
                newOrder[i] = last;
            }
        }
        var oldSorted = self.SortedColumns.splice(0, self.SortedColumns().length);
        self.SelectedColumns.removeAll();
        _.each(newOrder, function (item, index) {
            item.Order(index + 1);
            self.SelectedColumns.push(item);
        });
        _.each(oldSorted, function (item) { self.SortedColumns.push(item); });
    };

    self.AddSort = function (index) {
        var columnCount = self.SortedColumns().length;
        var next = index + 1;
        var newColumn = { Id: ko.observable(0), Order: ko.observable(columnCount + 1), SortDirection: ko.observable(1) };

        if (columnCount == 0 || columnCount == next) {
            self.SortedColumns.push(newColumn);
        } else {
            var back = self.SortedColumns.splice(next, columnCount - index);
            self.SortedColumns.push(newColumn);
            _.each(back, function (item) { self.SortedColumns.push(item); });
        }
    };
    
    if (self.SortedColumns().length == 0) {
        self.AddSort(0);
    }

    self.RemoveSort = function (sortedColumn) {
        self.SortedColumns.remove(sortedColumn);
    };

    self.isSortableScreenType = function() {
        return !(self.ScreenType() == 3
              || self.ScreenType() == 5
              || self.ScreenType() == 6);
    };

    self.isManualAppScreenType = function() {
        return self.ScreenType() == 4;
    };

}

$(document).ready(function () {
    $("#btnSave").click(function () {
        save();
    });

    $("#btnCancel").click(function () {
        var newValues = GetControlValues();
        var compareValues = CompareArrays(newValues, oldValues);
        if (!compareValues) {
            if (confirm("Clicking ok will cancel your changes!")) {
                getConfiguration();
            }
        }
        else {
            getConfiguration();
        }
    });

    //wizard keeps this around from page to page, so we need to clear it on load.
    viewModel = undefined;

    $.when(getConfiguration()).done(function () {
        showView();
    });
});

function getConfiguration() {
    var deferred = $.Deferred();

    var screenType = $("#ScreenType").val();
    var param = { screenType: screenType };
    $.getJSON("/admin/mainQueue/getUserConfiguration", param, function (data) {
        //debugger;
        var newModel = _.isUndefined(viewModel) || _.isNull(viewModel);
        if (newModel) {
            viewModel = new MainQueueModel(data);
            ko.applyBindings(viewModel);
        } else {
            viewModel.update(data);
        }
        deferred.resolve();
    });

    return deferred.promise();
}

function showView() {
    oldValues = new Array();
    oldValues = GetControlValues();
    disableUnlessCanEdit();
}

function save() {
    //debugger;
    var source = ko.toJS(viewModel);

    $.ajax({
        type: 'POST',
        url: "/admin/mainQueue/saveFunderQueue",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ MainQueueModel: { ConfigurationData: source, ScreenType: $("#ScreenType").val() } }),
        cache: false,
        async: false,
        success: function (data) {
            notyModal('Configuration Saved');
            $.when(getConfiguration()).done(function () {
                showView();
            });
        }
    });
}

function showDropdownSelection() {
    $("#dropdownSelectionDiv").empty();
    $.get("/Admin/SelectionAdmin?RuleGroupTypeId=" + $("#RuleGroupType").val(), function (html) {
        $("#dropdownSelectionDiv").html(html);
        $("#dropdownSelectionDiv").show();
        $("#dropdownSelectionDiv").scrollTop(0);
        $("#dropdownSelectionButtonDiv").show();
    });
}

function hideDropdownSelection() {
    $("#dropdownSelectionDiv").empty();
    $("#dropdownSelectionDiv").hide();
    $("#dropdownSelectionButtonDiv").hide();
}

function refreshDropdownSelection(success) {
    if (success) {
        $("#dropdownSelectionDiv").empty();
        $("#dropdownSelectionDiv").hide();
        $("#dropdownSelectionButtonDiv").hide();

        $.when(getConfiguration()).done(function () {
            showView();
        });

    } else {
        notyModal("There was an error adding elements. Please try again");
    }
}
