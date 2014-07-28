var model = {};
var oldValues = new Array();
var expandAllText = '[+] Expand All';
var collapseAllText = '[-] Collapse All';

var allowEditXmlSchema = function (canEditXml) {
    if (canEditXml) {
        $("#btnRevertSchema").show();
    } else {
        $("#btnRevertSchema").hide();
    }
};

var cloneObservable = function (observableObject) {
    return ko.mapping.fromJS(ko.toJS(observableObject));
};

var insertingXmlMode = function (isInserting) {
    if (isInserting) {
        $("#btnSaveSchema").show();
        $("#btnSaveModel").hide();
    } else {
        $("#btnSaveSchema").hide();
        $("#btnSaveModel").show();
    }
};

$(function () {
    setupMainGrid();
    getMetadata();
    getSources();
    allowEditXmlSchema(canEditXmlSchema);
    insertingXmlMode(false);
});

function getMetadata() {
    $.getJSON("/InboundSource/GetMetadata", {}, function (data) {
        model.groups = data.groups;
        model.elements = data.elements;
    });
}

function edit(rowIndex) {
    var row = jQuery("#sourcesGrid").getRowData(rowIndex);

    notyAlert('Loading...');
    $.when(getSourceModel(row.Id)).done(function (data) {
        $.noty.closeAll();
        showDetailView(data, row.Id);
    });
}
    
function toggleAll() {
    var expand = $('#btnToggleAll').text() == expandAllText;
    model.sourceModel.RootNode().toggleAll(expand);
    $('#btnToggleAll').text(expand ? collapseAllText : expandAllText);
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

function save() {
    //required for config wizard

    var rowIds = $("#sourcesGrid").getDataIDs();
    var ids = $("#sourcesGrid").getCol("Id");
    var sources = [];
    _.each(rowIds, function (id) {
        sources.push({ InboundSourceId: ids[id - 1], IsActive: $("#sourcesGrid").getCell(id, "IsActive") == "True", Name: $("#sourcesGrid").getCell(id, "Name") });
    });

    $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

    $.ajax({
        type: 'POST',
        url: '/InboundSource/saveSource/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify({ model: { InboundSources: sources } }),
        success: function (response) {
            $.noty.closeAll();
            $.noty({ text: "Saved successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred saving configuration. Please try again.");
        },
        async: true
    });
}

function closeDialog() {
    if ($("#modal").hasClass('ui-dialog-content')) {
        $("#modal").dialog("destroy");
    }
}

function SourceModel(options) {
    var self = this;
    self.RootNode = ko.observable();
    self.SelectedNode = ko.observable(new XmlElement());
    
    self.entryTypes = ko.observableArray([
        { id: 0, name: 'None', type: '' },
        { id: 1, name: 'Data Entry', type: 'Data Entry' },
        { id: 2, name: 'From DB', type: 'From DB' },
        { id: 5, name: 'From Collection', type: 'From Collection' }
    ]);

    self.elementEntryTypes = ko.observableArray([
        { id: 0, name: 'None', type: '' },
        { id: 1, name: 'Data Entry', type: 'Data Entry' },
        { id: 2, name: 'From DB', type: 'From DB' },
        { id: 3, name: 'References', type: 'References' },
        { id: 4, name: 'Adverse Actions', type: 'AdverseActions' },
        { id: 6, name: 'Reports', type: 'Reports' },
        { id: 7, name: 'Addresses', type: 'Addresses' },
        { id: 8, name: 'Employers', type: 'Employers' },
        { id: 9, name: 'Incomes', type: 'Incomes' },
        { id: 10, name: 'Expenses', type: 'Expenses' },
        { id: 11, name: 'Retail Installment Contract', type: 'RetailInstallmentContract' },
        { id: 12, name: 'Custom Fields', type: 'CustomFields' },
        { id: 13, name: 'Decision History', type: 'DecisionHistory' },
        { id: 14, name: 'Errors', type: 'Errors' },
        { id: 15, name: 'Notifications', type: 'Notifications' },
        { id: 16, name: 'Stipulations', type: 'Stipulations' },
        { id: 17, name: 'Loan Applications', type: 'LoanApplications' },
        { id: 18, name: 'Applicants', type: 'Applicants' },
        { id: 19, name: 'Applicant Contacts', type: 'ApplicantContacts' },
        { id: 20, name: 'Documents', type: 'Documents' },
        { id: 21, name: 'Document Questions', type: 'DocumentQuestions' },
        { id: 22, name: 'Custom Scores', type: 'Custom Scores' },
        { id: 23, name: 'Custom Scorecard Points', type: 'CustomScorecardPoints' },
        { id: 24, name: 'Vehicles', type: 'Vehicles' },
        { id: 25, name: 'Vehicle Options', type: 'Vehicle Options' },
        { id: 26, name: 'Notes', type: 'Notes' },
        { id: 27, name: 'Assigned Users', type: 'AssignedUsers' },
        { id: 28, name: 'Rules', type: 'Rules' },
        { id: 29, name: 'Decision History Items', type: 'DecisionHistoryItems' },
        { id: 30, name: 'Verification Questions', type: 'VerificationQuestions' },
        { id: 31, name: 'Stipulation Answers', type: 'StipulationAnswer' },
        { id: 32, name: 'Vehicle Evaluations', type: 'Vehicle Evaluations' },
        { id: 32, name: 'Decision Group', type: 'Decision Group' },
        { id: 43, name: 'Deal Structure', type: 'DealStructure' },
    ]);

    self.getEntryTypes = function() {
        return self.SelectedNode().isLeaf() ? self.entryTypes : self.elementEntryTypes;
    };
    
    self.filteredGroups = function () {
        if (self.SelectedNode().EntryTypeId() == 2) return _.filter(model.groups, function (g) { return !g.IsCollection; });
        if (self.SelectedNode().EntryTypeId() == 5) return _.filter(model.groups, function (g) { return g.IsCollection; });
        return [];
    };

    self.setGroupName = function () {
        var groupId = self.SelectedNode().DataElementGroupId();
        var group = _.find(self.filteredGroups(), function (g) { return g.Id == groupId; });
        if (group !== undefined && group !== null) self.SelectedNode().DataElementGroupName(group.GroupName);
        else {
            self.SelectedNode().DataElementGroupId(undefined);
            self.SelectedNode().DataElementGroupName("");
        }
    };
    
    self.setElementName = function () {
        var elementId = self.SelectedNode().DataElementId();
        var element = _.find(model.elements, function (g) { return g.Id == elementId; });
        if (element !== undefined && element !== null) self.SelectedNode().DataElementName(element.Name);
        else {
            self.SelectedNode().DataElementId(undefined);
            self.SelectedNode().DataElementName("");
        }
    };

    self.elementsFor = ko.computed(function () {
        var groupId = self.SelectedNode().DataElementGroupId();
        var filtered = _.filter(model.elements, function (e) { return e.GroupId == groupId; });
        var sorted = _.sortBy(filtered, function (e) { return e.Name.toLowerCase(); });
        return sorted;
    });

    self.changeOfEntryType = function () {
        var selectedEntryType = _.find(self.getEntryTypes()(), function (et) {
            return et.id == self.SelectedNode().EntryTypeId();
        });
        if(selectedEntryType !== undefined && selectedEntryType !== null) self.SelectedNode().EntryType(selectedEntryType.type);
        if (!self.SelectedNode().isLeaf()) return;
        if ([2,5].indexOf(self.SelectedNode().EntryTypeId()) >= 0) { // from DB, from Collection
            self.SelectedNode().StaticValue("");
        } else {
            self.SelectedNode().DataElementGroupId(undefined);
            self.SelectedNode().DataElementId(undefined);
            self.SelectedNode().DataElementGroupName("");
            self.SelectedNode().DataElementName("");
        }
    };
}

function XmlElement(options) {
    console.log(options);
    var self = this;
    self.Attributes = ko.observableArray();
    self.Elements = ko.observableArray();
    
    var mapping = {
        'Attributes': {
            create: function (data) {
                return new XmlElement(data.data);
            }
        },
        'Elements': {
            create: function (data) {
                return new XmlElement(data.data);
            }
        }
    };
    
    ko.mapping.fromJS(options, mapping, this);
    
    if (self.SourceItemId == undefined) self.SourceItemId = ko.observable(0);
    if (self.Name == undefined) self.Name = ko.observable();
    if (self.EntryType == undefined) self.EntryType = ko.observable();
    if (self.EntryTypeId == undefined) self.EntryTypeId = ko.observable();
    if (self.StaticValue == undefined) self.StaticValue = ko.observable();
    if (self.DataElementGroupId == undefined) self.DataElementGroupId = ko.observable();
    if (self.DataElementGroupName == undefined) self.DataElementGroupName = ko.observable();
    if (self.DataElementId == undefined) self.DataElementId = ko.observable();
    if (self.DataElementName == undefined) self.DataElementName = ko.observable();
    if (self.Visible == undefined) self.Visible = ko.observable(false);
    if (self.Expanded == undefined) self.Expanded = ko.observable(false);
    if (self.SpaceCount == undefined) self.SpaceCount = ko.observable();
    if (self.Selected == undefined) self.Selected = ko.observable();
    if (self.Hovered == undefined) self.Hovered = ko.observable(false);
    if (self.CollectionTypeId == undefined) self.CollectionTypeId = ko.observable();

    this.isLeaf = ko.computed(function () {
        return self.Attributes().length == 0 && self.Elements().length == 0;
    });

    self.Expanded.subscribe(function(value) {
        _.each(self.Attributes(), function (item) { item.Visible(value); });
        _.each(self.Elements(), function (item) { item.Visible(value); });
    });

    this.toggleHover = function () {
        self.Hovered(!self.Hovered());
    };
    
    this.setAsSelected = function () {
        //global context usage
        if (model.sourceModel.SelectedNode() !== undefined) model.sourceModel.SelectedNode().Selected(false);
        model.sourceModel.SelectedNode(self);
        self.Selected(true);

        if (self.insertingXml()) {
            insertingXmlMode(true);
        } else {
            insertingXmlMode(false);
        }
    };

    this.insertXml = function () {
        self.xPathString(self.XPath());
        self.insertingXml(true);
        insertingXmlMode(true);
    };

    this.insertingXml = ko.observable(false);

    this.cancelInserting = function () {
        self.insertingXml(false);
        insertingXmlMode(false);
    };

    this.xPathString = ko.observable();
    this.xmlField = ko.observable();
    this.xmlFieldType = ko.observable("Element");
    
    
    this.canInsertXml = ko.computed(function () {
        if (!canEditXmlSchema)
            return false;

        if (typeof self.XPath !== 'undefined') {
            if (self.XPath() != null) {
                var xPath = self.XPath();
                var isAnAttribute = xPath.indexOf("@") != -1;
                if (self.Attributes().length > 0 || self.Elements().length > 0 || !isAnAttribute) {
                    return true;
                } else {
                    return false;
                }
            } else
                return false;
        } else
            return false;
    });


    self.Visible.subscribe(function (value) {
        if (!value) {
            _.each(self.Attributes(), function (item) { item.Visible(false); });
            _.each(self.Elements(), function (item) { item.Expanded(false); item.Visible(false); });
        } else {
            if(self.Expanded()) {
                _.each(self.Attributes(), function (item) { item.Visible(true); });
                _.each(self.Elements(), function (item) { item.Visible(true); });
            }
        }
    });

    this.toggle = function () {
        if(!self.isLeaf()) self.Expanded(!self.Expanded());
    };

    self.toggleAll = function (expand) {
        expand = expand !== false;
        if (!self.isLeaf()) {
            _.each(self.Attributes(), function (item) { item.Expanded(expand); });
            _.each(self.Elements(), function (item) { item.Expanded(expand); });
        }
        _.each(self.Attributes(), function (item) { item.toggleAll(expand); });
        _.each(self.Elements(), function (item) { item.toggleAll(expand); });
    };
};


function addSource() {
    $("#uploadDiv").dialog({
        autoOpen: false,
        width: "auto",
        height: "auto",
        modal: true,
        buttons: {
        }
    });

    $("#uploadDiv").show();
    $("#uploadDiv").dialog("open");
    $("#uploadForm")[0].reset();
    setupValidation();

    $('#method').change(function() {
        var isSubmit = $(this).val() == "SubmitApplication";
        if (isSubmit) $('#sourceSystemSection').css('display', 'inline');
        else {
            $('#sourceSystemCode').val('');
            $('#sourceSystemSection').hide();
        }
    });
    $('#method').change();
}

function confirmDeleteSource() {
    notyConfirm("Are you sure you want to delete this configuration?", "deleteSource");
}



function deleteSource() {
    
    $.ajax({
        type: 'POST',
        url: '/xmlExportConfig/deleteSource/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify({ "Id": $("#sourceId").val() }),
        success: function (response) {
            $.when(getSources()).done(function (data) {
                $.noty({ text: "Deleted successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                $.noty.closeAll();
                $("#modal").dialog("destroy");
            });
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred deleting configuration. Please try again.");
        },
        async: true
    });
}


function updatePreviewLink() {
    var appNumber = $("#previewAppNumber").val();
    var sourceId = $("#sourceId").val();
    if (appNumber.length > 1) {
        $("#previewLink").attr("href", "/Admin/XmlExportConfig/preview?sourceId=" + sourceId + "&applicationNumber=" + appNumber);
        $("#previewLink").show();
    } else {
        $("#previewLink").hide();
    }
}

function ProtocolModel(options) {
    var self = this;
    var mapping = {};
    ko.mapping.fromJS(options, mapping, this);

    if (self.ProtocolType == undefined) self.ProtocolType = ko.observable();
    if (self.Host == undefined) self.Host = ko.observable();
    if (self.Port == undefined) self.Port = ko.observable();
    if (self.UserName == undefined) self.UserName = ko.observable();
    if (self.Password == undefined) self.Password = ko.observable();
    if (self.RelativePath == undefined) self.RelativePath = ko.observable();
    if (self.UseDateDirectories == undefined) self.UseDateDirectories = ko.observable(false);
    if (self.UseUtf8 == undefined) self.UseUtf8 = ko.observable(true);

    self.hostVisible = function () {
        return self.ProtocolType() != "FtpPull"
            && self.ProtocolType() != "None";
    };
    self.portVisible = function () {
        return self.ProtocolType() == "FtpPush"
            || self.ProtocolType() == "SFtpPush";
    };
    self.userVisible = function () {
        return self.ProtocolType() != "FtpPull"
            && self.ProtocolType() != "None";
    };
    self.passwordVisible = function () {
        return self.ProtocolType() != "FtpPull"
            && self.ProtocolType() != "None";
    };
    self.relPathVisible = function () {
        return self.ProtocolType() == "FtpPush"
            || self.ProtocolType() == "SFtpPush";
    };
    self.dateDirsVisible = function () {
        return !(self.ProtocolType() == "HttpPost"
            || self.ProtocolType() == "HttpXmlPost"
            || self.ProtocolType() == "None");
    };
    self.utf8Visible = function () {
        return self.ProtocolType() != "None";
    };
    self.mapResponseVisible = function () {
        return (self.ProtocolType() != "HttpPost"
            || self.ProtocolType() != "HttpXmlPost");
    };
    self.Description = function () {
        if (self.ProtocolType() == "None") return "";
        if (self.ProtocolType() == "FtpPull") return "We will export the file to a location on our server for you to pull via ftp.";
        if (self.ProtocolType() == "FtpPush") return "We will upload the file via FTP to a location on your server.";
        if (self.ProtocolType() == "SFtpPush") return "We will upload the file via SFTP to a location on your server.";
        if (self.ProtocolType() == "HttpPost") return "We will upload the file via Http POST to a location on your server.";
        if (self.ProtocolType() == "HttpXmlPost") return "We will upload the file via Http POST as XML to a location on your server.";

    };

}

function setupValidation() {
    $("form").each(function () {
        $(this).validate({
            errorPlacement: function (error, element) {
                return true;
            },

            onfocusout: function (element) {
                $(element).valid();
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
    });
}


function setupUploader(url) {
    $('#uploadFilesButton').click(function () {
        if (!$("#uploadForm").valid()) {
            alert("Please enter valid data and try again.");
            return;
        };

        var formData = new FormData($('#uploadForm')[0]);
        $.ajax({
            url: url,
            type: 'POST',
            beforeSend: function () {
                $.noty({ text: "Uploading...", type: "information", layout: "topRight" });
            },
            success: function (data) {
                if (data.error !== undefined) {
                    notyModal(data.error);
                    $.noty({ text: "Upload Failed", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                } else if (data) {
                    var newSourceId = data.Id;
                    $.when(getSourceModel(newSourceId)).done(function (data) {
                        showDetailView(data, newSourceId);
                        getSources();
                        $.noty.closeAll();
                        $.noty({ text: "Uploaded successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                    });
                } else {
                    error = true;
                    $("#uploader").val("");
                    notyModal("an error occurred uploading your file.");
                }
            },
            error: function (event) {

                $("#uploader").val("");
                notyModal("An error occured uploading your file.");
            },
            async: false,
            // Form data
            data: formData,
            //Options to tell JQuery not to process data or worry about content-type
            cache: false,
            contentType: false,
            processData: false,
            complete: function () { $("#uploadDiv").dialog("destroy"); }
        });
        return false;
    });
}


function updateSchema() {
    var inboundSourceModelId = model.sourceId;
    $.noty({ text: "Updating...", type: "information", layout: "topRight", timeout: false });
    var createElement = model.sourceModel.SelectedNode().xmlFieldType() == "Element" ? true : false;
    var newName = model.sourceModel.SelectedNode().xmlField();
    var xPath = model.sourceModel.SelectedNode().xPathString();

    newName = newName.replace(/\s/g, "_"); //replaces spaces
    newName = newName.replace(/[^a-zA-Z0-9_\-]/g, "");//trim symbols
    var reg = new RegExp(/^xml/i);

    //is it empty or "xml" or "XmL" or ..
    if (newName.length == 0 || reg.test(newName)) {
        alert("Invalid Xml Field Name");
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/outboundSource/UpdateSchema/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: "{inboundSourceModelId:'" + inboundSourceModelId + "', xPath:'" + xPath + "', name:'" + newName + "', createElement:'" + createElement + "'}",
        success: function (response) {
            var rootNode = model.sourceModel.RootNode();
            ko.mapping.fromJS(response, rootNode);
            rootNode.Expanded(false);
            rootNode.Expanded(true);
            model.sourceModel.SelectedNode(new XmlElement());
 
            $.when(getSourceModel(model.sourceId)).done(function (data) {
                showDetailView(data, model.sourceId);
                getSources("/outboundSource/GetSources");
                $.noty({ text: "Schema updated successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
                $.noty.closeAll();
            });
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred saving Schema. Please try again.");
        },
        async: true
    });
}

function revertSchema() {
    var inboundSourceModelId = model.sourceId;

    if (!confirm("Reverting the schema will remove ALL custom elements and attributes (essentially setting the schema back to the defi defaults).  Are you sure you want to revert the schema?")) {
        return;
    }

    $.noty({ text: "Updating...", type: "information", layout: "topRight", timeout: false });
    
    $.ajax({
        type: 'POST',
        url: '/outboundSource/RevertSchema/',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: "{inboundSourceModelId:'" + inboundSourceModelId + "'}",
        success: function (response) {
            $.noty({ text: "Schema updated successfully", type: "information", layout: "topRight", timeout: 1000, closeButton: false, closeWith: ['hover', 'click'], closeOnSelfOver: true });
            $.noty.closeAll();

            if ($("#modal").hasClass('ui-dialog-content')) {
                $("#modal").dialog("close");
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            $.noty.closeAll();
            notyModal("An error occurred saving Schema. Please try again.");
        },
        async: true
    });
}
