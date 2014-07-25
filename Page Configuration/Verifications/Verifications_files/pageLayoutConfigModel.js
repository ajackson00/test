function ConfigurationModel(data) {
    var self = this;

    self.Sections = ko.observableArray();
    
    var mapping = {
        'DataElementGroups': {
            key: function (data) {
                return ko.utils.unwrapObservable(data.id);
            },
            create: function (data) {
                if (data) return new DataElementGroup(data.data);
            }
        },
        'Sections': {
            key: function (data) {
                return ko.utils.unwrapObservable(data.id);
            },
            create: function (data) {
                return new ApplicationPageSection(data.data, self);
            }
        }
    };

    self.makeFieldsSortable = function() {
        $.each(self.Sections(), function (index, section) {
            section.index(index);
            section.makeFieldsSortable();
        });
    };
    
    ko.mapping.fromJS(data, mapping, this);
}

function ApplicationPageSection(data, parent) {
    var self = this;

    self.Sections = ko.observableArray();

    if (data)
        ko.mapping.fromJS(data, {
            'Sections': {
                key: function (data) {
                    return ko.utils.unwrapObservable(data.id);
                },
                create: function (data) {
                    return new ApplicationPageSection(data.data, self);
                }
            },
            'Headers': {
                key: function (data) {
                    return ko.utils.unwrapObservable(data.id);
                },
                create: function (data) {
                    return new ApplicationPageSectionHeader(data.data);
                }
            },
            'Rows': {
                key: function (subdata) {
                    return ko.utils.unwrapObservable(subdata.id);
                },
                create: function (subdata) {
                    return new ApplicationPageSectionRow(subdata.data, self);
                }
            },
            'copy': ['Column'],
            'ignore' : 'Parent'
        },
        this);

    if (!self.Id) self.Id = ko.observable();
    if (!self.Name) self.Name = ko.observable();
    if (!self.index) self.index = ko.observable(0);
    if (!self.IsTab) self.IsTab = ko.observable(false);
    if (!self.IsCollapsible) self.IsCollapsible = ko.observable(false);
    if (!self.CollapseIcon) self.CollapseIcon = ko.observable('Hide');
    if (!self.Headers) self.Headers = ko.observableArray();
    if (!self.Rows) self.Rows = ko.observableArray();
    if (!self.CollectionType) self.CollectionType = ko.observable('None');
    if (!self.Visible) self.Visible = ko.observable(true);
    if (!self.Order) self.Order = ko.observable();
    
    if (!self.Column) self.Column = 0;
    self.Parent = parent;
    
    self.columnChanges = [];

    self.makeFieldsSortable = function () {
        makeSortable(".section" + self.index(), 'div.div-row-field:not(.pin)');

        $.each(self.Rows(), function(rowIndex, row) {
            setupRow(row);
        });
        
        $.each(self.Sections(), function (index, section) {
            section.index(index);
            section.makeFieldsSortable();
        });
    };

    self.eachField = function (iterator) {
        _.each(self.Rows(), function(r) {
            _.each(r.Fields(), iterator);
        });

        _.each(self.Sections(), function(section) {
            section.eachField(iterator);
        });
    };

    self.eachSection = function (iterator) {
        if (iterator != undefined) iterator(self);
        _.each(self.Sections(), function(section) {
            section.eachSection(iterator);
        });
    };

    self.toggleCollapse = function (show) {
        var div = $('#' + self.Id());
        if (show === true) {
            $(div).slideDown("fast", function () {
                self.CollapseIcon('Hide');
            });
        }
        else if (show === false) {
            $(div).slideUp("fast", function() {
                self.CollapseIcon('Show');
            });
        } else {
            $(div).slideToggle("fast", function() {
                if ($(div).is(':hidden')) {
                    self.CollapseIcon('Show');
                } else {
                    self.CollapseIcon('Hide');
                }
            });
        }
    };

    self.tabbedSections = ko.computed(function () {
        var sections = _.filter(self.Sections(), function (s) { return s.IsTab(); });
        return _.sortBy(sections, function (s) { return s.Order(); });
    });
    
    self.hasTabbedSections = ko.computed(function() {
        return self.tabbedSections().length > 0;
    });

    self.canShowFields = ko.computed(function() {
        return self.CollectionType() != 'UploadCenter' && self.CollectionType() != 'IndexCenter';
    });

    self.canAddSection = ko.computed(function() {
        return self.CollectionType() == 'None' || self.CollectionType() == 'Ric';
    });

    self.hasNonEmptyHeaders = ko.computed(function () {
        var matching = _.filter(self.Headers(), function(h) {
            return h.Value != '';
        });
        return matching.length > 0;
    });

    self.hasSectionOfType = function (type) {
        var matching = _.filter(self.Sections(), function (s) {
            return s.CollectionType() == type;
        });
        return matching.length > 0;
    };

    self.columnIndexes = ko.computed(function () {
        //var columns = ko.utils.arrayMap(self.Sections(), function (s) { return s.Column(); });
        var columns = _.map(self.Sections(), function (s) { return s.Column; });
        var list = _.uniq(columns);
        return list;
    });

    self.columnWidth = ko.computed(function() {
        var columnCount = self.columnIndexes().length;
        var width = (100 / columnCount) + "%";
        return width;
    });

    self.sectionsInColumn = function (index) {
        return ko.computed(function() {
            var sections = _.filter(self.Sections(), function (s) { return s.Column == index; });
            return sections;
        });
    };
    
    self.addTab = function() {
        var newTab = new ApplicationPageSection(undefined, self);
        newTab.IsTab(true);
        newTab.Name("New");
        newTab.Id(self.Sections().length);
        newTab.Order(self.Sections().length+1);
        self.Sections.push(newTab);
        $(".tabs").tabs("refresh");
    };

    self.addSection = function (column) {
        var section = new ApplicationPageSection(undefined, self);
        section.Column = column-0 > 0 ? column : 1;
        var columnSections = self.sectionsInColumn(section.Column);
        section.Order(columnSections.length + 1);
        self.Sections.push(section);
    };
    
    self.addSectionColumn = function () {
        self.addSection(_.max(self.columnIndexes()) + 1);
        initSortableSections();
    };

    self.addColumn = function () {
        var header = new ApplicationPageSectionHeader();
        header.Column(self.Headers().length + 1);
        self.Headers.push(header);
        self.columnChanges.push({ type: "add" });

        $.each(self.Rows(), function (index, row) {
            var field = new ApplicationPageField(null, row);
            field.Header = header;
            field.Order(row.Fields().length == 0 ? 1 : row.Fields()[0].Order());
            field.Column(row.Fields().length+1);
            row.Fields.push(field);
        });
    };

    self.removeColumn = function (columnHeader) {
        self.Headers.remove(function (item) { return item.Column() == columnHeader.Column(); });
        self.columnChanges.push({ type: "remove", header: columnHeader });

        $.each(self.Rows(), function (index, row) {
            if (row.Fields().length >= columnHeader.Column())
                row.Fields.remove(row.Fields()[columnHeader.Column() - 1]);
        });
        
        $.each(self.Headers(), function(index, header) {
            header.Column(index + 1);
        });

    };
    
    self.OriginalSection = null;

    self.divstyle = function (fieldIndex) {

        var headerCount = self.Headers().length;

        if (headerCount == 2) {
            return 'span5';
        }

        if (headerCount == 3) {
            return fieldIndex == 1 ? 'span4' : 'span3';
        }
        if (headerCount == 4) {
            return fieldIndex === 1 || fieldIndex === 2 ? 'span3' : 'span2';
        }
        return 'span10';
    };

    if (self.Headers().length == 0) {
        self.addColumn();
    }

    self.Save = function () {
        var currentSection = self.OriginalSection;
        currentSection.Name(self.Name());
        currentSection.Visible(self.Visible());
        currentSection.IsCollapsible(self.IsCollapsible());
        currentSection.CollectionType(self.CollectionType());

        _.each(self.columnChanges, function (change, index, list) {
            if (change.type == 'add') currentSection.addColumn();
            if (change.type == 'remove') currentSection.removeColumn(change.header);
        });

        for (var i = 0; i < self.Headers().length; i++) {
            if (self.Headers()[i].Column() == currentSection.Headers()[i].Column()) {
                currentSection.Headers()[i].Value(self.Headers()[i].Value());
            }
        }

        makeDirty();
        $.noty.closeAll();
    };

    self.Cancel = function () {
        $.noty.closeAll();
    };

}

function ApplicationPageSectionHeader(data) {

    var self = this;
    if (data) ko.mapping.fromJS(data, {}, this);

    if (!self.Value) self.Value = ko.observable();
    if (!self.Column) self.Column = ko.observable();
}

function ApplicationPageSectionRow(data, section) {
    var self = this;

    self.divstyle = function (fieldIndex) {
        return section.divstyle(fieldIndex);
    };

    if (data) ko.mapping.fromJS(data, {
        'Fields': {
            key: function (subdata) {
                return ko.utils.unwrapObservable(subdata.id);
            },
            create: function (subdata) {
                return new ApplicationPageField(subdata.data, self);
            }
        },
    }, this);

    if (!self.Fields) self.Fields = ko.observableArray();
    
    if (self.Fields().length != 0) return;


    $.each(section.Headers(), function (index, item) {
        var field = new ApplicationPageField(null, self);
        field.Header(item);
        self.Fields.push(field);
    });
}

function ApplicationPageField(data, row) {
    var self = this;

    if (data) ko.mapping.fromJS(data, {
        'DataElements': {
            key: function (subdata) {
                return ko.utils.unwrapObservable(subdata.id);
            },
            create: function (subdata) {
                return new DataElement(subdata.data, self);
            }
        },
        'DataElement': {
            key: function (subdata) {
                return ko.utils.unwrapObservable(subdata.id);
            },
            create: function (subdata) {
                return ko.observable(new DataElement(subdata.data, self));
            }
        },
        'selectedGroup': {
            key: function (subdata) {
                return ko.utils.unwrapObservable(subdata.id);
            },
            create: function (subdata) {
                return ko.observable(new DataElementGroup(subdata.data, self));
            }
        },
    }, this);

    if (!self.Id) self.Id = ko.observable(-10);
    if (!self.Type) self.Type = ko.observable();
    if (!self.IsReadOnly) self.IsReadOnly = ko.observable(false);
    if (!self.IsRequired) self.IsRequired = ko.observable(false);
    if (!self.Value) self.Value = ko.observable();
    if (!self.DataElement) self.DataElement = ko.observable(new DataElement(null));
    if (!self.selectedGroup) self.selectedGroup = ko.observable(new DataElementGroup(null));
    if (!self.Header) self.Header = ko.observable();
    if (!self.Order) self.Order = ko.observable();
    if (!self.Column) self.Column = ko.observable();
    if (!self.ModelField) self.ModelField = null;
    if (!self.IsDisabled) self.IsDisabled = ko.observable(false);

    self.DataElementName = ko.computed(function () {
        return (self.selectedGroup() && self.DataElement()) ? self.selectedGroup().Name() + ' - ' + self.DataElement().Name() : "";
    }, this);

    self.divstyle = ko.computed(function () { return row.divstyle(self.Column()); });
    self.IsDataElement = ko.computed(function () { return this.Type() == 'DataElement'; }, this);
    self.IsStatic = ko.computed(function () { return this.Type() == 'StaticValue'; }, this);

    self.IsDropdown = ko.computed(function() {
        return self.DataElement() != undefined && self.DataElement().DataType != undefined &&
            ( self.DataElement().DataType() == 'Dropdown' || self.DataElement().DataType() == 'Boolean');
    }, this);

    var isReadOnly = self.IsReadOnly();
    var asLabel = isReadOnly;
    var asSelect = self.IsDropdown() && !isReadOnly;
    var asInput = !asSelect; //!asLabel && 
    var asDropDownLabel = self.IsDropdown() && isReadOnly;

    self.Template = "";

    if (asLabel) self.Template = "LabelTmpl";
    if (asSelect) self.Template = "SelectTmpl";
    if (asDropDownLabel) self.Template = "DropDownLabelTmpl";
        
    if (asInput && self.DataElement() !== undefined && self.DataElement().DataType !== undefined && !asLabel) {
        var dataType = self.DataElement().DataType();
        var fieldLength = self.DataElement().FieldLength();
        self.MaxLength = fieldLength != undefined && fieldLength != 0 ? fieldLength : 999;
        if (dataType != undefined && dataType == 'Integer' || dataType && dataType == 'Miles') {
            self.Template = "IntegerInputTmpl";
        } else if (dataType != undefined && dataType == 'Currency') {
            self.Template = "CurrencyCustomInputTmpl";
        } else if (dataType != undefined && dataType == 'Percentage') {
            self.Template = "PercentAutoNumericInputTmpl";
        } else if (typeof self.ControlName != 'undefined' && !asLabel && (self.ControlName() == 'Purchase_Vehicle_InfoVehicle_VIN' || self.ControlName() == 'Trade_In_Vehicle_InfoVehicle_Trade_VIN')) {
            self.Template = "VINInputTmpl";
        } else if (typeof self.DataElementName != 'undefined' && !asLabel && self.DataElementName().toUpperCase().indexOf('PHONE') != -1) {
            self.Template = "PhoneTmpl";
        } else {
            self.Date = dataType != undefined && dataType == 'Date';
            self.Template = "InputTmpl";
        }
    } else if (asInput && asLabel && self.DataElement() !== undefined && self.DataElement().DataType !== undefined && self.DataElement().DataType() == 'Currency') {
        self.Template = "LabelTmplCurrencyCustom";
    } else if (asInput && asLabel && self.DataElement() !== undefined && self.DataElement().DataType !== undefined && self.DataElement().DataType() == 'Percentage') {
        self.Template = "LabelTmplPercentAutoNumeric";
    }

    self.Css = self.Column() == 1 ? 'ml' : 'sd';
    if (self.IsRequired()) {
        self.ReqCss = "requiredField";
    } else {
        self.ReqCss = "";
    }

    self.Save = function () {
        var currentField = self.ModelField;
        currentField.Type(self.Type());
        currentField.IsReadOnly(self.IsReadOnly());
        currentField.IsRequired(self.IsRequired());
        currentField.Value(self.Value());
        currentField.DataElement(self.DataElement());
        currentField.selectedGroup(self.selectedGroup());
        
        makeDirty();
        $.noty.closeAll();
    };

    self.Cancel = function () {
        $.noty.closeAll();
    };

    self.Configure = function (fieldRow) {
        $("#fieldsDiv").empty();
        var tempField = new ApplicationPageField(ko.mapping.toJS(self), fieldRow);
        tempField.ModelField = self;
        tempField.selectedGroup(self.selectedGroup());
        tempField.DataElement(self.DataElement());
        $("#fieldsTemplate").tmpl(tempField).appendTo("#fieldsDiv");
        var htmlStr = $("#fieldsDiv").html();
        $("#fieldsDiv").empty();
        showNoty(htmlStr, true);
        ko.applyBindings(tempField, document.getElementById('field'));
    };
}

function DataElement(data) {
    var self = this;

    if (data) ko.mapping.fromJS(data, {}, this);

    if (!self.Name) self.Name = ko.observable();
    if (!self.Id) self.Id = ko.observable();
}

function DataElementGroup(data) {
    var self = this;

    if (data) ko.mapping.fromJS(data, {
        'DataElements': {
            key: function (subdata) {
                return ko.utils.unwrapObservable(subdata.id);
            },
            create: function (subdata) {
                return new DataElement(subdata.data, self);
            }
        }
    }, this);


    if (!self.Name) self.Name = ko.observable();
    if (!self.Id) self.Id = ko.observable();
}

var makeDirty = function () {
    window.isDirty = true;
};

var makeClean = function () {
    window.isDirty = false;
};
