//ko.bindingProvider.instance = new safeBindingProvider();


ko.bindingHandlers.grid = {
    init: function (element, valueAccessor) {
        var value = valueAccessor();
        var dataArr = ko.utils.unwrapObservable(value.data).slice(0);

        var grid = $(element).jqGrid({
            data: dataArr,
            colNames: value.colNames,
            datatype: "local",
            rowNum: 50,
            rowList: [5, 10, 20, 50],
            sortname: 'id',
            viewrecords: true,
            ignoreCase: true,
            width: $("#content").width() - 20,
            height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .60,
            sortorder: "desc",
            scrollOffset: 0,
            loadonce: true,
            shrinkToFit: true,
            gridview: true,
            hoverrows: false,
            colModel: value.colModel,
            pager: value.pager,
            onSelectRow: function (rowIndex) {
                var rowData = $(element).jqGrid('getRowData', rowIndex);
                if (value.onSelectRow) {
                    value.onSelectRow(rowIndex, rowData);
                }
            },
        });

        $(element).jqGrid("setGridParam", { data: ko.utils.unwrapObservable(value.data).slice(0) });
    },

    update: function (element, valueAccessor) {
        var value = valueAccessor();
        var actualData = ko.toJS(value.data);
        $(element).clearGridData();
        for (var i = 0; i <= actualData.length; i++)
            $(element).jqGrid('addRowData', i + 1, actualData[i]);
    }
};

ko.bindingHandlers.uniqueId = {
    init: function (element, valueAccessor) {
        var value = valueAccessor();
        value.id = value.id || value.data + (++ko.bindingHandlers.uniqueId.counter);

        element.id = value.id;
    },
    counter: 0,
};

ko.bindingHandlers.uniqueFor = {
    init: function (element, valueAccessor) {
        var value = valueAccessor();
        value.id = value.id || ko.bindingHandlers.uniqueId.prefix + (++ko.bindingHandlers.uniqueId.counter);

        element.setAttribute("for", value.id);
    }
};

function set(value, allBindingsAccessor, node) {
    for (var i = 0; i < allBindingsAccessor().jsSelectedOptions().length; i++) {
        var left = "" + allBindingsAccessor().jsSelectedOptions()[i].docId();
        var right = "" + node.value;

        if (left == right) {
            allBindingsAccessor().jsSelectedOptions()[i].isActive(value);
        }
    }
}

ko.bindingHandlers.jsSelectedOptions = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function (node) {
                if (node.selected) {
                    set(true, allBindingsAccessor, node);
                } else {
                    set(false, allBindingsAccessor, node);
                }
            });
        });
    },
    'update': function (element, valueAccessor, allBindingsAccessor) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        
        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function (node) {
                var isSelected = false;
                for (var i = 0; i < newValue.length; i++) {
                    var left = "" + newValue[i].docId();
                    var right = "" + node.value;

                    if (left == right && newValue[i].isActive()) {
                        isSelected = true;
                    }
                    if (isSelected) {
                        $(node).attr("selected", "selected");
                        return;
                    }
                }
            });
        }
    }
};

ko.bindingHandlers.required = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();

        if (typeof value == "function") {
            if (typeof value() == "boolean") value = value();
        }

        if (!$(element).attr("name")) {
            ko.bindingHandlers.uniqueName.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        }

        if (typeof value == "boolean") {
            
            if (value) $(element).rules("add", { required: true });
            else {
                try {
                    $(element).rules("remove", "required");
                } catch (e) { }
            }

        }

        if (typeof value == "string") {
            if (value) $(element).rules("add", { required: true });
            if (value) $(element).messages("add", value);
        }

        if (element.tagName == "SELECT") {
            $(element).find('option[text = "Select"]');
        }
    },
    'update': function (element, valueAccessor) {
        var value = valueAccessor();

        if (typeof value == "function") {
            if (typeof value() == "boolean") value = value();
        }

        if (typeof value == "boolean") {
            if (value) {
                try {
                    $(element).rules("add", { required: true });
                    //this would remove the red asterik on Verifications, but I'm not sure if that will work everywhere.
                    //$(element).parent().parent().find('.ml').addClass('requiredField');
                } catch (e) { }
            }
            else {
                try {
                    $(element).rules("remove", "required");
                    //this would remove the red asterik on Verifications, but I'm not sure if that will work everywhere.
                    //$(element).parent().parent().find('.ml').removeClass('requiredField');
                } catch (e) { }
            }
        }
    }
};

ko.bindingHandlers.requiredUpdate = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    },
    'update': function (element, valueAccessor) {
        var value = valueAccessor();

        if (typeof value == "function") {
            if (typeof value() == "boolean") value = value();
        }

        if (typeof value == "boolean") {
            if (value) $(element).rules("add", { required: true });
            else {
                $(element).rules("remove", "required");
            }
        }

        if (typeof value == "string") {
            if (value) $(element).rules("add", { required: true });
            if (value) $(element).messages("add", value);
        }
    }
};

ko.bindingHandlers.integer = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var vMin = value.min;
            var vMax = value.max;

            if (typeof vMax == "function") {
                vMax = vMax();
            }

            var when = value.when;

            if (when) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: '', mDec: 0 });
            }

            if (when == null) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: '', mDec: 0 });
            }

            return;
        }
        $(element).autoNumeric({ vMin: '0', vMax: '999999', aSep: '', mDec: 0 });
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.integerCustom = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var vMin = value.min;
            var vMax = value.max;

            if (typeof vMax == "function") {
                vMax = vMax();
            }

            var when = value.when;

            if (when) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: '', mDec: 0 });
            }

            if (when == null) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: '', mDec: 0 });
            }

            return;
        }
        $(element).autoNumeric({ vMin: '0', vMax: '999999', aSep: '', mDec: 0 });
    },
    'update': function (element, valueAccessor) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var when = value.when;
            if (when == null || when) {
                var fieldValue = $(element).autoNumeric('get');
                if (fieldValue != undefined && fieldValue.length > 0 || value.defaultValue != undefined) {
                    if ((fieldValue == undefined || fieldValue.length == 0) && value.defaultValue != undefined) fieldValue = value.defaultValue;
                    $(element).autoNumeric('set', fieldValue);
                }
            }
        }
    }
};

ko.bindingHandlers.numeric = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var vMin = value.min;
            var vMax = value.max;
            
            if (typeof vMax == "function") {
                vMax = vMax();
                var mask = '';
                for (var i = 0; i < vMax; i++) {
                    mask += '9';
                }
                vMax = mask;
            }

            var when = value.when;

            if (when) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: '' });
            }

            if (when == null) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: '' });
            }

            return;
        }
        $(element).autoNumeric({ vMin: '0', vMax: '999999', aSep: '' });
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.email = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();

        if (typeof value == "function") {
            if (typeof value() == "boolean") value = value();
        }

        if (!$(element).attr("name")) {
            ko.bindingHandlers.uniqueName.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        }

        if (typeof value == "boolean") {
            if (value) $(element).rules("add", { email: true });
            else {
                try {
                    $(element).rules("remove", "email");
                } catch (e) { }
            }
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.currency = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var when = value.when;
            var vMin = value.min;
            var vMax = value.max;

            var aSign = value.aSign ? value.aSign : '';
            var pSign = value.pSign ? value.pSign : '';
            var aSep = value.aSep ? value.aSep : '';
            
            if (typeof vMax == "function") {
                vMax = vMax();
                var mask = '';
                for (var i = 0; i < vMax; i++) {
                    mask += '9';
                }
                vMax = mask + '.99';
            }

            if (when) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: aSep, aSign: aSign, pSign: pSign });
            }

            if (when == null) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: aSep, aSign: aSign, pSign: pSign });
            }
            return;
        }
        $(element).maskMoney();
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.currencyCustom = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var when = value.when;
            var vMin = value.min;
            var vMax = value.max;

            var aSign = value.aSign ? value.aSign : '';
            var pSign = value.pSign ? value.pSign : '';
            var aSep = value.aSep ? value.aSep : '';

            if (value.asMoney) {
                aSign = '$';
                pSign = 'p';
                aSep = ',';
                var length = value.fieldLength != undefined && value.fieldLength < 8 ? value.fieldLength : 7;
                var moneyMask = ''; 
                for (var i = 0; i < length; i++) {
                    moneyMask += '9';
                }
                vMin = "-" + moneyMask + ".99";
                vMax = moneyMask + ".99";
            }

            if (typeof vMax == "function") {
                vMax = vMax();
                var mask = '';
                for (var i = 0; i < vMax; i++) {
                    mask += '9';
                }
                vMax = mask + '.99';
            }

            if (value.decimalLength) {
                for (var i = 2; i < value.decimalLength() ; i++) {
                    vMax += '9';
                }
            }

            if (value.isDecimal) aSign = '';
            
            if (when == null || when) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: aSep, aSign: aSign, pSign: pSign });
                ko.utils.registerEventHandler(element, "change", function () {
                    var observable = value.accessor;
                    observable($(element).autoNumeric('get'));
                });
                
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $(element).autoNumeric("destroy");
                });
            }
            return;
        }
        $(element).maskMoney();
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var when = value.when;
            if (when == null || when) {
                var fieldValue = $(element).autoNumeric('get');
                if (fieldValue != undefined && fieldValue.length > 0 || value.defaultValue != undefined) {
                    if ((fieldValue == undefined || fieldValue.length == 0) && value.defaultValue != undefined) fieldValue = value.defaultValue;
                    $(element).autoNumeric('set', fieldValue);
                }
            }
        }
    }
};

ko.bindingHandlers.percentAutoNumeric = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var when = value.when;
            var vMin = value.min;
            var vMax = value.max;

            var aSign = value.aSign ? value.aSign : '';
            var pSign = value.pSign ? value.pSign : '';
            var aSep = value.aSep ? value.aSep : '';

            if (value.default) {
                aSign = '%';
                pSign = 's';
                aSep = ',';
                vMin = -99999999999.99;
                vMax = 99999999999.99;
            }
            
            if (typeof vMax == "function") {
                vMax = vMax();
                var mask = '';
                for (var i = 0; i < vMax; i++) {
                    mask += '9';
                }
                vMax = mask + '.99';
            }
            
            if (when == null || when) {
                $(element).autoNumeric({ vMin: vMin, vMax: vMax, aSep: aSep, aSign: aSign, pSign: pSign });
                
                ko.utils.registerEventHandler(element, "change", function () {
                    var observable = value.accessor;
                    observable($(element).autoNumeric('get'));
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $(element).autoNumeric("destroy");
                });
                
                $(element).css('text-align', 'right');
            }
            return;
        }
        $(element).maskMoney();
    },
    'update': function (element, valueAccessor) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var when = value.when;
            if (when == null || when) {
                var fieldValue = $(element).autoNumeric('get');
                if (fieldValue != undefined && fieldValue.length > 0 || value.defaultValue != undefined) {
                    if ((fieldValue == undefined || fieldValue.length == 0) && value.defaultValue != undefined) fieldValue = value.defaultValue;
                    $(element).autoNumeric('set', fieldValue);
                }
            }
        }
    }
};

ko.bindingHandlers.date = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {

            var mask = value.as;
            var condition = value.when;

            if (condition) {
                $(element).mask(mask);
            }
        }
        else {
            if (value) $(element).mask('99/99/9999');
        }
    },
    'update': function (element, valueAccessor) {
    }
};


ko.bindingHandlers.percentage = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {

            var mask = value.threeDigit != undefined && value.threeDigit ? "999.99" : value.as;
            var condition = value.when;

            if(value.when == undefined) {
                $(element).mask(mask);
            }
            if (condition) {
                $(element).mask(mask);
            }
        }
        else {
            if(value) $(element).mask('99.99');
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.phoneNumber = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {

            var mask = value.as;
            var condition = value.when;

            if (condition) {
               $(element).mask(mask);
            }
        }
        else {
            if (value) $(element).mask('999-999-9999');
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.SSN = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {

            var mask = value.as;
            var condition = value.when;

            if (condition) {
                $(element).mask(mask);
            }
        }
        else {
            if (value) $(element).mask('999-99-9999');
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.stringLength = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var length = value.maxLength;
            var condition = value.when;

            if (condition == null || condition) {
                $(element).attr("maxlength", length);
            }
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.ZipCode = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {

            var mask = value.as;
            var condition = value.when;

            if (condition) {
                $(element).mask(mask);
            }
        }
        else {
            if (value) $(element).mask('99999');
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.VIN = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    },
    'update': function (element, valueAccessor) {
        var value = valueAccessor();
        if (typeof value == "object") {
            
            var section = value.section;
            var condition = value.when;

            if (typeof section == "function") {
                section = section();
            }

            if (condition) {
                if ($(element).val() != "" && $(element).val().length == 17) {
                    displayVehicleInformation($(element), section);
                }
            }
        }
    }
};

ko.bindingHandlers.VehicleSection = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var section = value.section;
            var isTrade = value.isTrade;
            var condition = value.when;

            if (condition) {
                bindingContext.$root.VehicleSections.push({ section: section, isTrade: isTrade });
            }
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.AddressSection = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var section = value.section;
            var isPrevious = value.isPrevious;
            var isCoApp = value.isCoApp;
            var condition = value.when;

            if (condition) {
                bindingContext.$root.AddressSections.push({ section: section, isPrevious: isPrevious, isCoApp: isCoApp });
            }
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.EmploymentSection = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        if (typeof value == "object") {
            var section = value.section;
            var isPrevious = value.isPrevious;
            var isCoApp = value.isCoApp;
            var condition = value.when;

            if (condition) {
                bindingContext.$root.EmploymentSections.push({ section: section, isPrevious: isPrevious, isCoApp: isCoApp });
            }
        }
    },
    'update': function (element, valueAccessor) {
    }
};

ko.bindingHandlers.dialog = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = ko.utils.unwrapObservable(valueAccessor()) || {};
        //do in a setTimeout, so the applyBindings doesn't bind twice from element being copied and moved to bottom
        setTimeout(function () {
            options.close = function () {
                allBindingsAccessor().dialogVisible(false);
            };

            $(element).dialog(options);
        }, 0);

        //handle disposal (not strictly necessary in this scenario)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).dialog("destroy");
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var shouldBeOpen = ko.utils.unwrapObservable(allBindingsAccessor().dialogVisible),
            $el = $(element),
            dialog = $el.data("uiDialog") || $el.data("dialog");

        //don't call open/close before initilization
        if (dialog) {
            $el.dialog(shouldBeOpen ? "open" : "close");
        }
    }
};

ko.bindingHandlers.datepicker = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        //initialize datepicker with some optional options
        var options = allBindingsAccessor().datepickerOptions || {};
        $(element).datepicker(options);

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function () {
            var observable = valueAccessor();
            observable($(element).val());
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).datepicker("destroy");
        });

    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            current = $(element).val();

        if (value - current !== 0) {
            $(element).datepicker("setDate", value);
        }
    }
};

ko.bindingHandlers.multiselect = {
    init: function (element) {

        $(element).bind("multiselectclick", function () {
            $.data(element, 'donotrefresh', true);
        });
    },
    update: function (element) {
        var doNotRefresh = !!($.data(element, 'donotrefresh'));
        //can't always refresh with jquery 1.11.0, if it hasn't been initialized, an error is thrown. Not all pages are initializing controls on document ready.
        //if (!doNotRefresh) { $(element).multiselect("refresh"); }
        $.data(element, 'donotrefresh', false);
    }
};

ko.bindingHandlers.qtipMessage = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        var qtipPositionMy = allBindingsAccessor().qtipPositionMy || 'bottom middle';
        var qtipPositionAt = allBindingsAccessor().qtipPositionAt || 'top middle';

        $(element).qtip(
            {
                content: value,
                position: {
                    my: qtipPositionMy,
                    at: qtipPositionAt
                }                
            });
    }, 
    update: function (element) {
    }
};