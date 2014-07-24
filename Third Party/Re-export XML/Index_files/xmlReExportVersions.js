var reExportVersionModel;
$(function () {
    addValidationRules();
    
    reExportVersionModel = new ReExportVersionModel();
    ko.applyBindings(reExportVersionModel, document.getElementById("mainDiv"));
});



function ReExportVersionModel(options) {
    var self = this;
    this.AccountNumbers = ko.observable("");
    this.Versions = ko.observableArray();
    this.SelectedVersion = ko.observable();
    this.EventType = ko.observable(1);

    this.AccountNumbers.subscribe(function(value) {
        self.getVersions();
    });
    
    this.hasMultipleAppNumbers = ko.computed(function () {
        console.log(self.AccountNumbers().length);
        return self.AccountNumbers().length == 0 || self.AccountNumbers().indexOf(",") > -1;
    });

    ko.mapping.fromJS(options, {}, this);

    this.reExport = function () {
        
        $("#versions").rules("add", { required: true });
        $("#eventType").rules("add", { required: false });
        
        var valid = $('#form').valid();
        if (!valid) return;

        var version = self.SelectedVersion() == undefined ? 0 : self.SelectedVersion();
        var postData = { commaSepAppNumbers: self.AccountNumbers(), versionId: version };
        
        notyAlert("Exporting...");
        
        $.ajax({
            async: false,
            type: 'POST',
            url: "/admin/xmlexport/ReExportVersion",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(postData),
            success: function (data) {
                if (data.success) {
                    closeNoty();
                    notySuccess("Successfully exported.", 1000);
                }
                else {
                    closeNoty();
                    var failedData = "";
                    _.each(data.failedApps, function(app) {
                        failedData = failedData + " Application Number: " + app.appId + " - Message: " + app.message + "<br/>";
                    })
                    notyModal("Failed to export applications <br/> " + failedData);
                }
            },
            complete: function (jqXHR, textStatus) {
                if (textStatus != "success") {
                    closeNoty();
                    notyModal('An error occurred trying export');
                }
            }
        });
    };
    
    this.newExport = function () {

        $("#versions").rules("add", { required: false });
        $("#eventType").rules("add", { required: true });
        
        var valid = $('#form').valid();
        if (!valid) return;
        
        var eventType = self.EventType();
        var postData = { commaSepAppNumbers: self.AccountNumbers(), eventType: eventType };

        notyAlert("Exporting...");

        $.ajax({
            async: false,
            type: 'POST',
            url: "/admin/xmlexport/newExport",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(postData),
            success: function (data) {
                if (data.success) {
                    closeNoty();
                    notySuccess("Successfully exported.", 1000);
                }
                else {
                    closeNoty();
                    var failedData = "";
                    _.each(data.failedApps, function (app) {
                        failedData = failedData + " Application Number: " + app.appId + " - Message: " + app.message + "<br/>";
                    })
                    notyModal("Failed to export applications <br/> " + failedData);
                }
            },
            complete: function (jqXHR, textStatus) {
                if (textStatus != "success") {
                    closeNoty();
                    notyModal('An error occurred trying export');
                }
            }
        });
    };

    this.canExport = ko.computed(function () {
        console.log(self.SelectedVersion());
        return self.SelectedVersion() != "" && self.SelectedVersion() != undefined;
    });

    this.getVersions = function () {

        var appNumber = self.AccountNumbers();

        this.Versions.valueWillMutate();
        this.Versions.removeAll();

        if (appNumber.length > 0 && !self.AccountNumbers().match(/\r\n|\r|\n/g)) {
            $.getJSON("/admin/xmlexport/GetVersionsFor?applicationNumber=" + self.AccountNumbers(), function(response) {
                _.each(response, function(v) {
                    var version = new ExportedVersion(v);
                    self.Versions.push(v);
                });
            });
        } else {
            this.Versions.push(new ExportedVersion({ Id: 0, Name: 'Latest Version', Status: 'Success', Reason: '' }));
        }
        
        this.Versions.valueHasMutated();
    };
}

function ExportedVersion(options) {
    var self = this;
    this.Id = ko.observable(0);
    this.Timestamp = ko.observable("");
    this.Status = ko.observable("");
    this.Reason = ko.observable("");
    this.Name = ko.observable("");
    
    ko.mapping.fromJS(options, {}, this);
}

function addValidationRules() {

    $('#form').validate({
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