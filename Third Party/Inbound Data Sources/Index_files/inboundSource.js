function setupMainGrid() {
    jQuery("#sourcesGrid").jqGrid({
        datatype: "local",
        colNames: ['Id', 'Integration Name', 'Active', "Is System", 'Uri', 'Source System Code'],
        colModel: [
            { name: 'Id', index: 'Id', width: 0, hidden: true },
            { name: 'Name', index: 'Name', sortable: true, sorttype: 'Text' },
            { name: 'IsActive', index: 'IsActive', editable: true, formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' }, width: '30px' },
            { name: 'IsSystem', index: 'IsSystem', editable: false, formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' }, width: '30px' },
            { name: 'Uri', index: 'Uri', sortable: true, sorttype: 'Text' },
            { name: 'SourceSystemCode', index: 'Source System Code', sortable: true, sorttype: 'Text', width: '50px' },
        ],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        width: $("#inboundSource").parent().parent().width() - 10,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        sortname: 'id',
        viewrecords: true,
        sortorder: "desc",
        ignoreCase: true,
        shrinkToFit: true,
        loadonce: true,
        pager: jQuery('#sourcesGrid_pager'),
        onSelectRow: function (rowIndex) {
            AddValidationRules(true);
            edit(rowIndex);
            oldValues = new Array();
            oldValues = GetControlValues();
        },
        loadComplete: function () {
            var ids = $("#sourcesGrid").getDataIDs();
            for (var index = ids.length - 1; index >= 0; index--) {
                $("#sourcesGrid").editRow(ids[index], true);
            };
            $("#sourcesGrid").trigger("reloadGrid"); // Call to fix client-side sorting
        },
    });
    
    setupValidation();
    setupUploader("/InboundSource/uploadXsd");
}

function getSourceModel(id) {
    var deferred = $.Deferred();
    $.getJSON("/admin/inboundsource/getSourceModel?sourceId=" + id, {}, function (data) {
        deferred.resolve(data);
    });
    return deferred.promise();
}

function showDetailView(source, sourceId) {
    model.sourceModel = new SourceModel();
    var rootNode = new XmlElement(source.RootNode);
    model.sourceModel.RootNode(rootNode);
    model.sourceId = sourceId;
    model.sourceModel.source = source.Source;
    model.ProtocolModel = new ProtocolModel(source.Protocol);

    rootNode.Visible(true);
    rootNode.Expanded(true);
    $('#btnToggleAll').text(expandAllText);

    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings(model.sourceModel.source, document.getElementById("xmlDiv"));
    ko.applyBindings({ sourceData: rootNode }, document.getElementById("editDiv"));
    ko.applyBindings({ sourceData: model.sourceModel }, document.getElementById("itemDiv"));

    if ($("#modal").hasClass('ui-dialog-content')) {
        $("#modal").dialog("destroy");
    }

    $("#modal").dialog({
        autoOpen: false,
        width: "1024",
        height: "auto",
        modal: true,
        buttons: {
        },
        appendTo: "#modalInsideForm"
    });

    if ($('#setupSections').data('ui-tabs')) {
        $('#setupSections').tabs("destroy");
    }

    $('#setupSections').tabs({ disabled: [1, 2] });

    $("#modal").show();
    $("#modal").dialog("open");
    
    forceDialogModalToTop();
}

function saveModel() {

    if (!$("#sourceForm").valid()) {
        alert("Please enter valid data and try again.");
        return;
    };

    var data = $.parseJSON(ko.mapping.toJSON(model.sourceModel.RootNode()));
    var protocol = $.parseJSON(ko.toJSON(model.ProtocolModel));
    var postData = { InboundSourceModel: { Root: data, Protocol: protocol, SourceId: model.sourceId, Name: $("#name").val(), EventType: $("#eventType").val() } };

    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/InboundSource/saveSourceModel/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify(postData),
        success: function (response) {
            var rootNode = model.sourceModel.RootNode();
            ko.mapping.fromJS(response, rootNode);
            rootNode.Expanded(false);
            rootNode.Expanded(true);
            model.sourceModel.SelectedNode(new XmlElement());
            $.when(getSourceModel(model.sourceId)).done(function (data) {
                showDetailView(data, model.sourceId);
                getSources();
                $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                $.noty.closeAll();
            });
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred saving configuration. Please try again.");
        },
        async: true
    });
}

function getSources() {
    $.getJSON("/InboundSource/GetSources", {}, function (data) {
        model.sources = data.sources;

        jQuery("#sourcesGrid").clearGridData();
        if (model.sources.length > 0) {
            for (var i = 0; i <= model.sources.length; i++)
                jQuery("#sourcesGrid").jqGrid('addRowData', i + 1, model.sources[i]);
        }

        var pageNumber = model.sources.length > 0 ? 1 : 0;
        var totalRec = model.sources.length / 50;
        $('#sourcesGrid').setGridParam({ page: pageNumber, total: totalRec, records: model.sources.length }).trigger('reloadGrid');
    });
}