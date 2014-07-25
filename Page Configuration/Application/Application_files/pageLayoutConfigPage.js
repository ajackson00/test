$("#decisioning_container").hide();

$(document).on('submit', 'form', function() {
    //prevent pressing enter on an input from reloading the page
    return false;
});

var model;

function Cancel() {
    notyConfirm("You are about to reset all unsaved changes.", "reload");
}

function reload() {
    window.location.reload();
}

var initDirtyCheck = function () {
    $(window).on('beforeunload', function () {
        if (window.isDirty) {
            return "If you have made any changes to the fields without clicking the Save button, your changes will be lost.  Are you sure you want to exit this page?";
        }
    });
};

var initPage = function () {
    $.ajaxSetup({ cache: false });
    initDirtyCheck();
    model = new ConfigurationModel(initialPayload);

    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings(model);

    $(".portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all")
        .find(".portlet-header")
        .addClass("ui-widget-header ui-corner-all")
        .end()
        .find(".portlet-content");

    $(".portlet2").addClass("ui-widget ui-helper-clearfix ui-corner-all")
        .find(".portlet-header")
        .addClass("ui-widget-header ui-corner-all")
        .end()
        .find(".portlet-content");

    var tabs = $(".tabs").tabs();
    $(".tabs").tabs("option", "active", 0);

    _.each($(".tabs ul"), function (tab) {
        $(tab).sortable({
            axis: "x",
            stop: function () {
                tabs.tabs("refresh");
                $.each($(tab).find("li"), function (index, item) {
                    var widget = ko.dataFor(item);
                    if (widget) widget.Order(index + 1);
                });
            }
        });
    });

    initSortableSections();
    model.makeFieldsSortable();

    $("#decisioning_container").fadeIn(1000);
};

$(function () {
    initPage();
});

function initSortableSections() {
    $(".sectionColumn").sortable({
        items: ".portlet:not(.pin)",
        connectWith: ".sectionColumn",
        stop: function(e, ui) {
            var columnDiv = $(ui.item).parent(".sectionColumn");
            var movedSection = ko.dataFor($(ui.item)[0]);

            var toSection = ko.dataFor(columnDiv.parent()[0]);
            if (movedSection.Parent != null && toSection != null
                && movedSection.Parent.Id() != toSection.Id()) {
                notyModal('Dragging is only allowed within the same section.');
                $(".sectionColumn").sortable("cancel");
                return;
            }

            var columnIndex = ko.dataFor(columnDiv[0]);
            movedSection.Column = columnIndex;

            $.each(columnDiv.find(".portlet").not('.pin'), function(index, item) {
                var section = ko.dataFor(item);
                section.Order(index);
            });
        }
    }).disableSelection();
}

function makeSortable(selector, itemList) {
    $(selector).sortable({
        items: itemList,
        stop: function(e, ui) {
            $.each($(selector + " > " + itemList), function(index, item) {
                var widget = ko.dataFor(item);
                $.each(widget.Fields(), function(fieldIndex, field) {
                    field.Order(index);
                });
            });
        }
    }).disableSelection();
}

function setupRow(row) {
    $.each(row.Fields(), function(fieldIndex, field) {
        var group = null;
        if (field.Type() == 'DataElement') group = $.grep(model.DataElementGroups(), function(group) { return group.Id() == field.selectedGroup().Id(); })[0];

        if (!group) group = model.DataElementGroups()[0];
        field.selectedGroup(group);

        if (field.selectedGroup()) {
            field.DataElement($.grep(field.selectedGroup().DataElements(), function(element) { return element.Id() == field.DataElement().Id(); })[0]);
        }
    });
}

function addRow(section) {
    var row = new ApplicationPageSectionRow(null, section);
    var lastRowIndex = section.Rows().length > 0 ? section.Rows().length - 1 : null;
    var lastRowOrder = lastRowIndex != null ? section.Rows()[lastRowIndex].Fields()[0].Order() : 0;
    section.Rows.push(row);

    $("#section_" + section.index() + "row_" + section.Rows().length).draggable({ connectToSortable: ".section" + section.index(),   
        stop: makeSortable(".section" + section.index(), 'div.div-row-field:not(.pin)')
    });

    $.each(row.Fields(), function(fieldIndex, field) {
        field.Order(lastRowOrder + 1);
        field.Column(fieldIndex + 1);
    });

    setupRow(row);
}

function sectionSettings(section) {
    $("#sectionSettingsDiv").empty();
    var tempSection = new ApplicationPageSection(ko.mapping.toJS(section), section.Column);
    tempSection.OriginalSection = section;
    $("#sectionSettingsTemplate").tmpl(tempSection).appendTo("#sectionSettingsDiv");
    var htmlStr = $("#sectionSettingsDiv").html();
    $("#sectionSettingsDiv").empty();
    showNoty(htmlStr, true);
    ko.applyBindings(tempSection, document.getElementById('settings'));
}

function removeRow(row, section) {
    section.Rows.remove(row);
    $.each($('.section' + section.index() + ' > div.div-row-field:not(.pin)'), function(index, item) {
        var widget = ko.dataFor(item);

        $.each(widget.Fields(), function(fieldIndex, field) {
            field.Order(index);
        });
    });
}

function removeSection(section) {
    model.Columns()[section.Column()].Sections.remove(section);
    $.noty.closeAll();
    $.each($(".grid").children('div.portlet'), function(index, item) {
        var widget = ko.dataFor(item);
        if (widget.Column() == section.Column()) widget.Order(index);
    });
}

function save() {
    //required for config wizard

    var postData = ko.mapping.toJS(model, { include: 'Column', ignore: ['DataElementGroups', 'DataElements'] });

    notyAlert('Processing..');
    $.ajax({
        type: 'POST',
        url: "/admin/pageLayoutConfig/save",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ Model: postData }),
        success: function(data) {
            window.reload();
        },
        complete: function(xhr, textStatus) {
            $.noty.closeAll();
            if (textStatus != 'success') {
                console.log(xhr.responseText);
                notyModal("Unable to update the page at this time.");
            }
        }
    });
    makeClean();
}

var makeClean = function () {
    window.isDirty = false;
};
