
var model = null;
var controller = null;
var aRuleMatrix = null;
var flag = 0;
var rowColChangeflag = false;
var oldValues = new Array();
var statusList;

var activeType = null;
var minIncome = 'Min Income';
var maxAF = 'Max AF';
var minAF = 'Min AF';
var maxPTI = 'Max PTI';
var maxDTI = 'Max DTI';
var maxLine3 = 'Max Line 3%';
var maxLine5 = 'Max Line 5%';
var maxTerm = 'Max Term';
var maxVechicleAge = 'Max Vehicle Age';
var minPymt = 'Min Pymt';
var maxPymt = 'Max Pymt';
var maxMiles = 'Max Miles';
var DATATYPE_PERCENTAGE = 'Percentage';
var DATATYPE_CURRENCY = 'Currency';
var DATATYPE_DROPDOWN = 'Dropdown';
var DATATYPE_MILES = 'Miles';
var DATATYPE_DECIMAL = 'Decimal';
var sizeForDropdownValuesx = 0;
var sizeForDropdownValuesy = 0;
activeType = getParameterByName("activeType");

RuleMatrixModel = function () {
    this.ruleMatrices = null;
    this.dataElements = null;
    this.creditPolicyTypes = null;
    this.matrixRows = null;
    this.selectedId = null;
    this.onAdd = false;
};

RuleMatrixController = function (tableMode) {

    this.tableMode = _.isUndefined(tableMode) ? false : tableMode;

    this.getMatrixMetadata = function (ruleGroupTypeId) {
        var deferred = $.Deferred();
        var parameter = { ruleGroupType: ruleGroupTypeId };
        $.getJSON("/admin/ruleMatrix/getMatrixMetadata", parameter, function (data) {
            model.creditPolicyTypes = data.CreditPolicyTypes;
            model.dataElements = data.DataElements;
            model.dropdowns = data.Dropdowns;
            deferred.resolve();
        });
        return deferred.promise();
    };

    this.getRuleMatrices = function (ruleGroupTypeId) {
        var parameter = { ruleGroupType: ruleGroupTypeId };

        $.getJSON("/admin/ruleMatrix/getRuleMatrices", parameter, function (data) {
            model.ruleMatrices = $.parseJSON(data.RuleMatrices);
            controller.displayRuleMatrices();
        });
    };

    $.getJSON("/admin/Rule/GetValidationDropdowns", function (data) {
        Dropdownstates = data.States;
        DropdownGroups = data.Groups;
        statusList = data.Statuses;
        Provinces = data.Provinces;
    });

    this.displayRuleMatrices = function () {

        if (!controller.tableMode) {
            jQuery("#ruleMatricesGrid").clearGridData();

            if (model.ruleMatrices.length > 0) {
                for (var i = 0; i <= model.ruleMatrices.length; i++)
                    jQuery("#ruleMatricesGrid").jqGrid('addRowData', i + 1, model.ruleMatrices[i]);
                if (model.onAdd) {
                    model.selectedId = model.ruleMatrices.length;
                }
             
                //                if (model.selectedId) {
                //                    jQuery("#ruleMatricesGrid").setSelection(model.selectedId, true);
                //                }
                var pageNumber = model.ruleMatrices.length > 0 ? 1 : 0;
                var totalRec = model.ruleMatrices.length / 50;
                $('#ruleMatricesGrid').setGridParam({ page: pageNumber, total: totalRec, records: model.ruleMatrices.length }).trigger('reloadGrid');
            }
        } else {
            controller.showMatrixDetailView(model.ruleMatrices[0]);
        }
    };

    this.displayEditMatrixView = function (rowId) {
        var row = jQuery("#ruleMatricesGrid").getRowData(rowId);
        var filtered = _.filter(model.ruleMatrices, function (i) { return i.Id == row.Id; });

        if (filtered.length > 0) {
            var selectedMatrix = filtered[0];
            controller.showMatrixDetailView(selectedMatrix);
        }
    };

    this.displayAddNewMatrixView = function () {
        model.selectedId = null;
        model.onAdd = true;
        controller.showMatrixDetailView({ XAxisSize: 1, YAxisSize: 1, Id: 0 });
    };

    this.toggleSize = function (sizeId, selectedValue) {
        if (selectedValue == null || selectedValue == -1) {
            $(sizeId).val(1);
            $(sizeId).trigger('change');
            $(sizeId).attr('disabled', 'disabled');
        } else {
            $(sizeId).val(1);
            $(sizeId).trigger('change');
            $(sizeId).removeAttr('disabled');
        }
    };


    function formatCurrency(num) {
        num = num.toString().replace(/\$|\,/g, '');
        if (isNaN(num)) num = "0";
        var sign = (num == (num = Math.abs(num)));
        num = Math.floor(num * 100 + 0.50000000001);
        cents = num % 100;
        num = Math.floor(num / 100).toString();
        if (cents < 10) cents = "0" + cents;
        for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3) ; i++)
            num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
        return (((sign) ? '' : '-') + '$' + num + '.' + cents);
    }

    function addCommas(str) {
        var amount = new String(str).replace(',', '');
        amount = amount.split("").reverse();

        var output = "";
        for (var i = 0; i <= amount.length - 1; i++) {
            output = amount[i] + output;
            if ((i + 1) % 3 == 0 && (amount.length - 1) !== i) output = ',' + output;
        }
        return output;
    }


    this.showMatrixDetailView = function (ruleMatrix) {

        console.log("rulematrix", ruleMatrix);
        var ruleGroupTypeId = $("#RuleGroupType").val();

        var selectedVal = ruleMatrix.CreditPolicyTypeId;

        if (typeof ruleMatrix.CellValues != 'undefined') {
            for (var count = 0; count < ruleMatrix.CellValues.length; count++) {
                var oldValue = ruleMatrix.CellValues[count].Value;
                if (oldValue == null) continue;

                if (selectedVal == 1 || selectedVal == 4 || selectedVal == 5 || selectedVal == 7 || selectedVal == 8 || ruleGroupTypeId == 17 ||
                    ruleMatrix.Identifier.substring(0, 4) == "PM00") {
                    if (oldValue.indexOf("$") == -1) {
                        var newNo = formatCurrency(ruleMatrix.CellValues[count].Value);
                        ruleMatrix.CellValues[count].Value = newNo;

                    }
                }
                else if ((selectedVal == 2 || selectedVal == 3 || selectedVal == 11 || selectedVal == 12 || selectedVal == 0 || ruleGroupTypeId == 16) && ruleGroupTypeId != 55) {
                    if (oldValue.indexOf("%") == -1) {
                        ruleMatrix.CellValues[count].Value = oldValue + " %";
                    }
                }
                else if (selectedVal == 10) {
                    var newNo = addCommas(ruleMatrix.CellValues[count].Value);
                    ruleMatrix.CellValues[count].Value = newNo;
                }
            }
        }

        if (selectedVal == 1 || selectedVal == 4 || selectedVal == 5 || selectedVal == 7 || selectedVal == 8) {
            $("#blockPercentage").formatCurrency();
        }
        aRuleMatrix = ruleMatrix;
        $("#ruleMatrixDiv").empty();
        $("#matrixHeaderTemplate").tmpl(ruleMatrix, model).appendTo("#ruleMatrixDiv");
        $("#ruleMatrixDiv").removeClass("inline_style").removeClass("popup_style").addClass("popup_style").end();

        var htmlStr = $("#ruleMatrixDiv").html();
        $("#ruleMatrixDiv").empty();

        showNoty(htmlStr, true);
        $.noty.get("isActiveMatrix").attr("checked", true);
        $.noty.get("populateFromUsury").attr("checked", false);

        if (!_.isUndefined(ruleMatrix)) {
            if (!_.isUndefined(ruleMatrix.IsActive)) {
                if (ruleMatrix.IsActive)
                    $.noty.get("isActiveMatrix").attr("checked", true);
                else
                    $.noty.get("isActiveMatrix").attr("checked", false);
            }
            if (!_.isUndefined(ruleMatrix.PopulateFromUsury)) {
                if (ruleMatrix.PopulateFromUsury) {
                    $.noty.get("populateFromUsury").prop("checked", true);
                    $("#xAxisRow").toggle(false);
                    $("#yAxisRow").toggle(false);
                    $("#matrixTableRow").toggle(false);
                } else {
                    $.noty.get("populateFromUsury").prop("checked", false);
                }
            }
        }

        $("#creditPolicyTypeId").val(ruleMatrix.CreditPolicyTypeId);
        if (controller.isCreditPolicy()) {
            $("#creditPolicyDiv").show();
            if ($("#RuleGroupType").val() == 54) $("#lblCreditPolicyType").text("Money Factor Type");
        } else {
            $("#creditPolicyDiv").hide();
        }

        // Pricing Matrix
        if (ruleGroupTypeId == "7") {
            $("#populateFromUsuryRow").show();
            $("#populateFromUsury").change(function () {
                var show = !this.checked;
                $("#xAxisRow").toggle(show);
                $("#yAxisRow").toggle(show);
                $("#matrixTableRow").toggle(show);
            });
        } else {
            $("#populateFromUsuryRow").hide();
        }

        if (ruleMatrix.Id == 0) {
            $("#lblId").hide();
        }

        // $("#xAxisDataElementId").value = ruleMatrix.XAxisDataElementId;
        if ($("select#xAxisDataElementId")[0] != undefined) {
            $("select#xAxisDataElementId")[0].value = ruleMatrix.XAxisDataElementId;
        }
        else {
            $("select#xAxisDataElementId").value = ruleMatrix.XAxisDataElementId;
        }

        if (ruleMatrix.YAxisDataElementId > 0) {
            $("#yAxisDataElementId").val(ruleMatrix.YAxisDataElementId);
        } else {
            $("#yAxisDataElementId").val("-1");
        }
        
        controller.toggleSize("#xAxisSize", $("#xAxisDataElementId").val());
        controller.toggleSize("#yAxisSize", $("#yAxisDataElementId").val());
       
        $("#xAxisSize").val(ruleMatrix.XAxisSize);
        $("#yAxisSize").val(ruleMatrix.YAxisSize);

        $("#xAxisDataElementId").change(function () {
            ClearPreviousValues('X');
            controller.toggleSize("#xAxisSize", $(this).val());
        });

        $("#yAxisDataElementId").change(function () {
            ClearPreviousValues('Y');
            controller.toggleSize("#yAxisSize", $(this).val());
        });

        $("#xAxisSize").change(function () {
            rowColChangeflag = true;
            controller.readTableDataToModel();
            var xdata = controller.MatrixDataFrom($("#xAxisSize").val(), $("#yAxisSize").val(), model.matrixRows);
            controller.showMatrixTable(xdata);
            //FillDropdowns();
            XYChangeForDropDowns('X');
            XYChangeForDropDowns('Y');
        });

        $("#yAxisSize").change(function () {
            rowColChangeflag = true;
            controller.readTableDataToModel();
            var ydata = controller.MatrixDataFrom($("#xAxisSize").val(), $("#yAxisSize").val(), model.matrixRows);
            controller.showMatrixTable(ydata);
            //FillDropdowns();
            XYChangeForDropDowns('Y');
            XYChangeForDropDowns('X');

        });

        var xSize = $("#xAxisSize").length > 0 ? $("#xAxisSize").val() : ruleMatrix.XAxisSize;
        var ySize = $("#yAxisSize").length > 0 ? $("#yAxisSize").val() : ruleMatrix.YAxisSize;

        var editdata = controller.MatrixDataFrom(xSize, ySize, ruleMatrix);
        controller.showMatrixTable(editdata);
        oldValues = new Array();
        oldValues = GetControlValues();

        XYChangeForDropDowns('X');
        XYChangeForDropDowns('Y');

        disableUnlessCanEdit();
    };


    function ClearPreviousValues(Axis) {
        var tRows = $("#ruleMatrixTableDiv > table").find("tr");
        if (Axis == 'Y') {
            $($($(tRows[1]).find("td")[0]).find("select")[0]).val('');
        }
        else {
            $($($(tRows[0]).find("td")[0]).find("select")[0]).val('');
            $($($(tRows[0]).find("td")[1]).find("select")[0]).val('');
        }
    }

    function XYChangeForDropDowns(Axis) {
        var SelectedDataX = _.filter(model.dataElements, function (i) { return i.Name == $("#xAxisDataElementId option:selected").text(); });
        var SelectedDataY = _.filter(model.dataElements, function (i) { return i.Name == $("#yAxisDataElementId option:selected").text(); });
        
       // console.log("here");
        var xdropdownId = 0;
        var ydropdownId = 0;
        if (SelectedDataX.length > 0) {
            xdropdownId = SelectedDataX[0].DropdownId;
            sizeForDropdownValuesx = $("#xAxisSize").val();
        }
        if (SelectedDataY.length > 0) {
            ydropdownId = SelectedDataY[0].DropdownId;
            sizeForDropdownValuesy = $("#yAxisSize").val();
        }
       
            
        console.log("model.matrixrows", model.matrixRows);
        
        var tRows = $("#ruleMatrixTableDiv > table").find("tr");
        _.each(model.matrixRows.Rows, function (row) {
            _.each(row.Cols, function (col) {
                var xPos = col.X;
                var yPos = col.Y;
                if (Axis == 'Y' || (!(xPos == 0 && yPos == 0))) {
                //if (Axis == 'Y' || xPos != 0 || yPos != 0) {
                    if (Axis == 'Y') {
                        if (xPos == 0 && yPos > 0) {
                            if (SelectedDataY.length > 0) {
                                //debugger;
                               
                                var xddValues = ydropdownId > 0 ? getDropdownValuesLocal(ydropdownId) : GetDropdownValues(SelectedDataY[0].Name);
                                //alert(SelectedDataY[0].length);
                                console.log("xddvalues",xddValues);
                                $($($(tRows[yPos]).find("td")[xPos]).find("select")[0]).html(xddValues);
                            }
                            $($($(tRows[yPos]).find("td")[xPos]).find("select")[0]).val(col.Value);
                        }
                    }
                    else {
                        if (xPos > 0 && yPos == 0) {
                            xPos = SelectedDataX.length > 0 && SelectedDataY.length > 0 ? xPos : xPos - 1;
                            if (SelectedDataX.length > 0) {
                                var ddValues = xdropdownId > 0 ? getDropdownValuesLocal(xdropdownId) : GetDropdownValues(SelectedDataX[0].Name);
                                $($($(tRows[yPos]).find("td")[xPos]).find("select")[0]).html(ddValues);
                            }
                            $($($(tRows[yPos]).find("td")[xPos]).find("select")[0]).val(col.Value);
                        }
                    }
                }
            });
        });
    }
    
    function getDropdownValuesLocal(dropdownId) {
        console.log("getDropdownValuesLocal");
        var matchedDd = _.find(model.dropdowns, function (d) { return d.Id == dropdownId; });
        if (matchedDd) {
            var listItems = '';
            _.each(matchedDd.Data, function (i) {
                listItems = listItems + "<option value ='" + i.Value + "'>" + i.Text + "</option>";
                
            });
            return listItems;
        }
        return "";
    }

    this.MatrixDataFrom = function (xAxisSize, yAxisSize, ruleMatrix) {

        var colCount = (xAxisSize == "") ? 2 : parseInt(xAxisSize) + 1;
        var rowCount = (yAxisSize == "") ? 2 : parseInt(yAxisSize) + 1;
        var editMode = ruleMatrix.Id > 0;
        var isXDefined = controller.tableMode || $("#xAxisDataElementId").val() > 0;
        var isYDefined = controller.tableMode || $("#yAxisDataElementId").val() > 0;
        var xSelected = _.filter(model.dataElements, function (i) { return i.Name == $("#xAxisDataElementId option:selected").text(); });
        var ySelected = _.filter(model.dataElements, function (i) { return i.Name == $("#yAxisDataElementId option:selected").text(); });

        var rows = [];
        if (!rowColChangeflag) {
            for (var row = 0; row < rowCount; row++) {
                var cols = [];
                for (var col = 0; col < colCount; col++) {
                    var colData = { Id: 0, Value: "", X: col, Y: row, IsX: isXDefined, IsY: isYDefined };
                    if (row == 0 && col == 0) {
                        cols.push(colData);
                        continue;
                    }
                    var axisType = (col == 0) ? 2 : (row == 0) ? 1 : 0;
                    var headerPos = (col == 0) ? row : (row == 0) ? col : 0;
                    if (axisType > 0) {
                        var existingHeader = editMode ? _.filter(ruleMatrix.HeaderValues, function (item) { return item.AxisType == axisType && item.Position == headerPos; }) : null;
                        var newVal = '';
                        if (existingHeader != null && existingHeader.length > 0) {

                            newVal = existingHeader[0].Value;
                            if (row == 0) {
                                newVal = GetUpdatedValue(newVal, xSelected.length > 0 ? xSelected[0].DataTypeName : "");
                            }
                            if (col == 0) {
                                newVal = GetUpdatedValue(newVal, ySelected.length > 0 ? ySelected[0].DataTypeName : "");
                            }
                        }
                        colData = !_.isNull(existingHeader) && existingHeader.length > 0 ? { Id: existingHeader[0].Id, Value: newVal, X: col, Y: row } : colData;
                    } else {
                        var existingCell = editMode ? _.filter(ruleMatrix.CellValues, function (item) { return item.XPosition == col && item.YPosition == row; }) : null;
                        colData = !_.isNull(existingCell) && existingCell.length > 0 ? { Id: existingCell[0].Id, Value: existingCell[0].Value, X: col, Y: row } : colData;
                    }
                    colData.IsX = isXDefined;
                    colData.IsY = isYDefined;
                    cols.push(colData);
                }
                rows.push({ Cols: cols });

            }
            //   $("#blockPercentage").mask("%?999.99", { completed: function () { /* some work */ } });
        }
        else {
            if (typeof ruleMatrix.Rows != 'undefined') {
                for (var row = 0; row < rowCount; row++) {
                    var cols = [];
                    var newRow = ruleMatrix.Rows[row];
                    for (var col = 0; col < colCount; col++) {
                        colData = { Id: 0, Value: "", X: col, Y: row, IsX: isXDefined, IsY: isYDefined };
                        if (typeof newRow != 'undefined') {
                            var newCol = newRow.Cols[col];
                            if (typeof newCol != 'undefined') {
                                colData = { Id: newRow.Cols[col].Id, Value: newRow.Cols[col].Value, X: col, Y: row };
                            }
                        }
                        colData.IsX = isXDefined;
                        colData.IsY = isYDefined;
                        cols.push(colData);
                    }

                    rows.push({ Cols: cols });

                }
            }
        }
        rowColChangeflag = false;
        return { Rows: rows };
    };

    this.isCreditPolicy = function () {
        return $("#RuleGroupType").val() == 6 || $("#RuleGroupType").val() == 54;
    };

    this.showMatrixTable = function (matrixRows) {
        
        model.matrixRows = matrixRows;

        var parentDiv = $("#ruleMatrixDiv");
        $("#ruleMatrixTableDiv").empty();

        var SelectedDataX = _.filter(model.dataElements, function (i) { return i.Name == $("#xAxisDataElementId option:selected").text(); });
        var SelectedDataY = _.filter(model.dataElements, function (i) { return i.Name == $("#yAxisDataElementId option:selected").text(); });
       


        
        if (SelectedDataX[0] !== undefined) {       //Changes the datatype of Tier to a dropdown like it should be for the X axis
            if (SelectedDataX[0].Name == "Tier") {  
                SelectedDataX[0].DataTypeName = DATATYPE_DROPDOWN;
                SelectedDataX[0].DataTypeId = 8;
            }
        }

        if (SelectedDataY[0] !== undefined) {      //Changes the datatype of Tier to a dropdown like it should be for the Y axis
            if (SelectedDataY[0].Name == "Tier") {
                SelectedDataY[0].DataTypeName = DATATYPE_DROPDOWN;
                SelectedDataY[0].DataTypeId = 8;
            }
        }


        if (SelectedDataX.length > 0 && SelectedDataY.length > 0) {
            if (SelectedDataX[0].DataTypeName == DATATYPE_DROPDOWN && SelectedDataY[0].DataTypeName == DATATYPE_DROPDOWN) {
                $("#ruleMatrixDropdownTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
            }
            else if (SelectedDataX[0].DataTypeName == DATATYPE_DROPDOWN && SelectedDataY[0].DataTypeName != DATATYPE_DROPDOWN) {
                $("#ruleMatrixDTTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
            }
            else if (SelectedDataX[0].DataTypeName != DATATYPE_DROPDOWN && SelectedDataY[0].DataTypeName == DATATYPE_DROPDOWN) {
                $("#ruleMatrixTDTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
            }
            else {
                $("#ruleMatrixTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
            }

        }
        else if (SelectedDataX.length > 0) {
            if (SelectedDataX[0].DataTypeName == DATATYPE_DROPDOWN) {
                $("#ruleMatrixDTTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
                //$("#blockX").html(GetDropdownValues(SelectedDataX[0].Name));
            }
            else {
                $("#ruleMatrixTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
            }

        }

        else if (SelectedDataY.length > 0) {
            if (SelectedDataY[0].DataTypeName == DATATYPE_DROPDOWN) {
                $("#ruleMatrixTDTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
                //$("#blockY").html(GetDropdownValues(SelectedDataY[0].Name));
            }
            else {
                $("#ruleMatrixTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
            }
        }
        else {
            $("#ruleMatrixTableTemplate").tmpl(matrixRows).appendTo("#ruleMatrixTableDiv");
        }
    };

    function FillDropdowns() {
        var SelectedDataX = _.filter(model.dataElements, function (i) { return i.Name == $("#xAxisDataElementId option:selected").text(); });
        var SelectedDataY = _.filter(model.dataElements, function (i) { return i.Name == $("#yAxisDataElementId option:selected").text(); });
        if (SelectedDataX.length > 0 && SelectedDataY.length > 0) {
            $("#blockY").html(GetDropdownValues(SelectedDataY[0].Name));
            $("#blockX").html(GetDropdownValues(SelectedDataX[0].Name));
        }

    }

    this.readTableDataToModel = function () {
        var tRows = $("#ruleMatrixTableDiv > table").find("tr");
        _.each(model.matrixRows.Rows, function (row) {
            _.each(row.Cols, function (col) {
                //ignore first cell (0,0), and ignore first column if IsY is false, and ignore first row if IsX is false
                if (!(col.X == 0 && col.Y == 0) &&
                    !(!col.IsY && col.X == 0 && col.Y > 0) &&
                        !(!col.IsX && col.Y == 0 && col.X > 0)) {
                    var xPos = col.IsY ? col.X : col.X - 1;
                    var yPos = col.Y;

                    if (xPos != 0 && yPos != 0) {
                        if (typeof $($($(tRows[yPos]).find("td")[xPos]).find("input:text")[0]).val() != "undefined") {
                            col.Value = $($($(tRows[yPos]).find("td")[xPos]).find("input:text")[0]).val().replace("%", "").replace(/^\s+|\s+$/g, '');
                        }
                        if (_.isUndefined(col.Value)) {
                            col.Value = $($($(tRows[yPos]).find("td")[xPos]).find("select")[0]).val().replace("%", "").replace(/^\s+|\s+$/g, '');
                        }
                    }
                    else {
                        col.Value = $($($(tRows[yPos]).find("td")[xPos]).find("input:text")[0]).val();
                        if (_.isUndefined(col.Value)) {
                            col.Value = $($($(tRows[yPos]).find("td")[xPos]).find("select")[0]).val();
                        }
                    }
                }
            });
        });
    };

    this.ValidateMatrixGrid = function () {
        var tRows = $("#ruleMatrixTableDiv > table").find("tr");
        var blnFlag = true;
        var ruleGroupTypeId = $("#RuleGroupType").val();
        if ($("#populateFromUsury").is(':checked')) {
            return true;
        }
        _.each(model.matrixRows.Rows, function (row) {
            _.each(row.Cols, function (col) {
                //ignore first cell (0,0), and ignore first column if IsY is false, and ignore first row if IsX is false
                if (!(col.X == 0 && col.Y == 0) &&
                    !(!col.IsY && col.X == 0 && col.Y > 0) &&
                        !(!col.IsX && col.Y == 0 && col.X > 0)) {
                    var xPos = col.IsY ? col.X : col.X - 1;
                    var yPos = col.Y;
                    col.Value = $($($(tRows[yPos]).find("td")[xPos]).find("input:text")[0]).val();
                    if (col.Value == "") {
                        blnFlag = false;
                    }

                    if ((col.X != 0 && col.Y != 0) && col.Value != "") {
                        var intRegex = /^\d+$/;
                        var floatRegex = /^((\d+(\.\d *)?)|((\d*\.)?\d+))$/;

                        if (typeof ($("#creditPolicyTypeId :selected") != 'undifined')) {
                            var selectedVal = $("#creditPolicyTypeId :selected").text();
                            var txtdVal = col.Value;
                            txtdVal = txtdVal.replace('$', '').replace(',', '');
                            txtdVal = txtdVal.replace('%', '').replace('-', '');
                            if (txtdVal == "") {
                                blnFlag = false;
                            }
                            var intNum = 0;
                            if (ruleGroupTypeId == 22 || selectedVal == 'Min Income' || selectedVal == 'Max AF' || selectedVal == 'Min AF') {
                                if ((parseInt(txtdVal) < 0) || (col.Value.indexOf("$") == -1)) {
                                    blnFlag = false;
                                }
                            }
                            else if (selectedVal == 'Max PTI' || selectedVal == 'Max DTI') {
                                if ((parseInt(txtdVal) < 0) || (parseInt(txtdVal) > 999.99)) {
                                    blnFlag = false;
                                }
                            }
                            else if (selectedVal == 'Max Line 3%' || selectedVal == 'Max Line 5%') {
                                if ((parseInt(txtdVal) < 0) || (parseInt(txtdVal) > 1000)) {
                                    blnFlag = false;
                                }
                            }
                            else if (selectedVal == 'Max Term' || selectedVal == 'Max Vehicle Age') {
                                if ((parseInt(txtdVal) < 0) || (parseInt(txtdVal) >= 100) || (col.Value.indexOf("$") != -1) || (col.Value.indexOf("%") != -1)) {
                                    blnFlag = false;
                                }
                            }
                            else if (selectedVal == 'Min Pymt' || selectedVal == 'Max Pymt') {
                                if ((parseInt(txtdVal) < 0) || (col.Value.indexOf("$") == -1)) {
                                    blnFlag = false;
                                }
                            }
                            else if (selectedVal == 'Max Miles') {
                                if ((parseInt(txtdVal) < 0) || (col.Value.indexOf("$") != -1)) {
                                    blnFlag = false;
                                }
                            }
                            else
                                if ((parseInt(col.Value.replace('%', '').replace('_', '')) <= 100) && (parseInt(col.Value.replace('%', '').replace('_', '')) >= 0)) {

                                }
                        }
                    }

                }
            });
        });
        return blnFlag;
    };

    this.saveMatrix = function () {

        controller.readTableDataToModel();
        //        if (!controller.ValidateMatrixGrid()) {

        //            alert("Matrix needs to be filled accurately to save.");

        //            return false;
        //        }
        var mainDiv = $("#ruleMatrixDiv");

        var postData = {};
        if (!controller.tableMode) {
            postData = {
                Id: $("#ruleMatrixId").val(),
                IsActive: $("#isActiveMatrix").is(":checked"),
                PopulateFromUsury: $("#populateFromUsury").is(":checked"),
                Name: $("#matrixName").val(),
                CreditPolicyTypeId: $("#creditPolicyTypeId").val(),
                XAxisDataElementId: $("#xAxisDataElementId").val(),
                YAxisDataElementId: $("#yAxisDataElementId").val(),
                XAxisSize: $("#xAxisSize").val(),
                YAxisSize: $("#yAxisSize").val(),
                Rows: model.matrixRows.Rows
            };
        } else {
            var ruleMatrix = model.ruleMatrices[0];
            postData = {
                Id: ruleMatrix.Id,
                IsActive: ruleMatrix.IsActive,
                PopulateFromUsury: ruleMatrix.PopulateFromUsury,
                Name: ruleMatrix.Name,
                CreditPolicyTypeId: $("#creditPolicyTypeId").val(),
                XAxisDataElementId: ruleMatrix.XAxisDataElementId,
                YAxisDataElementId: ruleMatrix.YAxisDataElementId,
                XAxisSize: ruleMatrix.XAxisSize,
                YAxisSize: ruleMatrix.YAxisSize,
                Rows: model.matrixRows.Rows
            };
        }

        if (postData.PopulateFromUsury === true) {
            postData.XAxisDataElementId = 0;
            postData.YAxisDataElementId = 0;
            postData.XAxisSize = 0;
            postData.YAxisSize = 0;
            postData.Rows = [];
        }

        $.ajax({
            type: 'POST',
            url: "/admin/ruleMatrix/save",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ RuleMatrixModel: { RuleMatrixData: postData, RuleGroupType: $("#RuleGroupType").val() } }),
            success: function (data) {
                if (data.Success) {
                    //refresh rule matrix list if this is a combined rule/rule matrix page (tabbed)
                    if (typeof RuleService != 'undefined') RuleService.fillOperatorData(ruleModel, ruleGrpType);
                    if (!controller.tableMode) {
                        $.noty.closeAll();
                        controller.getRuleMatrices($("#RuleGroupType").val());
                        LoadRulesGrid();
                    } else {
                        alert("Saved successfully");
                    }
                } else {
                    if (data.CreditPolicyUsed) {
                        alert("Credit Policy has been used for different Matrix.");
                    }
                }
            }
        });
    };
};
//looks like the class ends here

$(function() {
    jQuery.ajaxSetup({ cache: false });
    model = new RuleMatrixModel();
    controller = new RuleMatrixController();
    var ruleGrpType = $("#RuleGroupType").val();

    var matrixMetadataRetrieved = controller.getMatrixMetadata(ruleGrpType);
    $.when(matrixMetadataRetrieved).done(function() {
        controller.getRuleMatrices(ruleGrpType);
    });
    
    $("#btnAddRuleMatrix").click(function() {
        onAddMatrixClick();
    });


    initSearchForGrid("#ruleMatricesGrid");

    LoadRulesGrid();
});
            
function save() {
    //required for config wizard
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

$("#blockPercentage").live("focus", function (event) {
    var ruleGrpTypeId = $("#RuleGroupType").val();
    var selectedVal = $("#creditPolicyTypeId :selected").text();
    if (ruleGrpTypeId == 17) {
        $(this).autoNumeric({ aSign: ' $', aSep: ',', dGroup: '3' });
        return;
    }
    if (ruleGrpTypeId == 55) {
        $(this).autoNumeric({ aSign: '', aSep: ',', dGroup: '3', vMax: '999999.999999', vMin: '-999999.999999' });
        return;
    }
    if (selectedVal == minIncome || selectedVal == maxAF || selectedVal == minAF || selectedVal == minPymt || selectedVal == maxPymt) {
        $(this).autoNumeric({ aSign: '$', aSep: ',', dGroup: '3', vMax: '999999.99', vMin: '-999999.99' });
    }
    else if (selectedVal == maxPTI || selectedVal == maxDTI) {
        $(this).autoNumeric({ aSign: '%', pSign: 's', vMax: '999.99' });
    }
    else if (selectedVal == maxLine3 || selectedVal == maxLine5) {
        $(this).autoNumeric({ aSign: '%', pSign: 's', vMax: '999.99' });
    }
    else if (selectedVal == maxTerm || selectedVal == maxVechicleAge) {
        $(this).mask("?99", { placeholder: "" });
    }
    else if (selectedVal == maxMiles) {
        $(this).autoNumeric({ aSep: ',', dGroup: '3', aPad: false });
    }
    else if (selectedVal == '')
        $(this).autoNumeric({ aSign: '%', pSign: 's', vMax: '999.99' });
});

function inputControl(input) {
    var value = input.val();
    var values = value.split("");
    var update = "";
    var transition = "";
    var expression = /(^\d+$)|(^\d+\.\d+$)|[,\.]/;
    var finalExpression = /^([1-9][0-9]*[,\.]?\d{0,3})$/;

    for (id in values) {
        if (expression.test(values[id]) == true && values[id] != '') {
            transition += '' + values[id].replace(',', '.');
            if (finalExpression.test(transition) == true) {
                update += '' + values[id].replace(',', '.');
            }
        }
    }
    input.val(update);
}

function showMatrixDropdownSelection() {
    $("#dropdownSelectionMatrixDiv").empty();
    $.get("/Admin/SelectionAdmin?RuleGroupTypeId=" + $("#MatrixRuleGroupType").val(), function (html) {
        $("#dropdownSelectionMatrixDiv").html(html);
        $("#dropdownSelectionMatrixDiv").show();
        $("#dropdownSelectionMatrixDiv").scrollTop(0);
        $("#dropdownSelectionButtonMatrixDiv").show();
    });
}

function hideMatrixDropdownSelection() {
    $("#dropdownSelectionMatrixDiv").empty();
    $("#dropdownSelectionMatrixDiv").hide();
    $("#dropdownSelectionButtonMatrixDiv").hide();
}

function refreshMatrixDropdownSelection(success) {
    if ($("#dropdownSelectionMatrixDiv").length == 0) return;
    
    if (success) {
        $("#dropdownSelectionMatrixDiv").empty();
        $("#dropdownSelectionMatrixDiv").hide();
        $("#dropdownSelectionButtonMatrixDiv").hide();

        var ruleGroupType = $("#RuleGroupType").val();

        //refresh rule matrix list if this is a combined rule/rule matrix page (tabbed)
        if (typeof RuleService != 'undefined') RuleService.getRuleTypeData(ruleModel, ruleGroupType);
        var matrixMetadataRetrieved = controller.getMatrixMetadata(ruleGroupType);
        $.when(matrixMetadataRetrieved).done(function () {
            $.noty.closeAll();
            if (model.selectedId == 0) {
                onAddMatrixClick();
            } else {
                onMatrixGridSelectRow(model.selectedId);
            }
        });
    } else {
        alert("There was an error adding elements. Please try again");
    }
}

function GetUpdatedValue(oldValue, dataTypeName) {
    var val = '';

    
    switch (dataTypeName) {
        case 'Percentage': val = oldValue + ' %';
            break;
        case 'Currency': val = getCurrency(oldValue);
            break;
        case 'Miles': val = getMiles(oldValue);
            break;
         default: val = oldValue;
          break;
    }
    return val;
}

function getCurrency(num) {
    num = num.toString().replace(/\$|\,/g, '');
    if (isNaN(num)) num = "0";
    var sign = (num == (num = Math.abs(num)));
    num = Math.floor(num * 100 + 0.50000000001);
    cents = num % 100;
    num = Math.floor(num / 100).toString();
    if (cents < 10) cents = "0" + cents;
    for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
        num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
    return (((sign) ? '' : '-') + '$' + num + '.' + cents);
}

function getMiles(str) {
    var amount = new String(str);
    amount = amount.split("").reverse();

    var output = "";
    for (var i = 0; i <= amount.length - 1; i++) {
        output = amount[i] + output;
        if ((i + 1) % 3 == 0 && (amount.length - 1) !== i) output = ',' + output;
    }
    return output;
}



function xAxisDataElementIdChange(element) {
    controller.toggleSize("#xAxisSize", element.value);
    
}

function yAxisDataElementId(element) {
    controller.toggleSize("#yAxisSize", element.value);
}

function xAxisSizeChange(element) {
    //if (flag != 1) {
    document.getElementById("ruleMatrixTableDiv").innerHTML = "";
    var xdata = controller.MatrixDataFrom($("#xAxisSize").val(), $("#yAxisSize").val(), aRuleMatrix);
    controller.showMatrixTable(xdata);
    FillDropdowns();
   
}

function yAxisSizeChange(element) {
    // if (flag != 1) {
    document.getElementById("ruleMatrixTableDiv").innerHTML = "";
    var ydata = controller.MatrixDataFrom($("#xAxisSize").val(), $("#yAxisSize").val(), aRuleMatrix);
    controller.showMatrixTable(ydata);
    FillDropdowns();
    // }
}

function DetermineHeaderText() {
    var ruleGroupType = $("#RuleGroupType").val();
    switch (parseInt(ruleGroupType)) {
        case 6:
            $(".headerBorder").append('Credit Policy Matrices');
            break;
        case 7:
            $(".headerBorder").append('Pricing Matrices');
            break;
        case 17:
            $(".headerBorder").append('Participation Matrices');
            break;
        case 18:
            $(".headerBorder").append('Discount Matrices');
            break;
        case 54:
            $(".headerBorder").append('Money Factor Adj Matrices');
            break;
        case 55:
            $(".headerBorder").append('Base Money Factor Matrices');
            break;
        default:
            $(".headerBorder").append('Pricing Matrices');
            break;
    }
}

function onAddMatrixClick() {
    $("#btnSave").show();
    $("#btnMatrixCancel").show();
    controller.displayAddNewMatrixView();
    $("#lblID").hide();

    $("#xAxisSize").change(function () {
        setTimeout("changeLeft($(\".noty_bar\"));", 50);

        //$.noty.delay(800).reCenter($noty);
    });
    $("#yAxisSize").change(function () {
        setTimeout("changeTop($(\".noty_bar\"));", 50);

        //$.noty.delay(800).reCenter($noty);
    });
    DetermineHeaderText();
    AddMatrixValidationRules();
    oldValues = new Array();
    oldValues = GetControlValues();
    model.selectedId = 0;
    setTimeout("changeLeft($(\".noty_bar\"));", 50);
    setTimeout("changeTop($(\".noty_bar\"));", 50);

}

function LoadRulesGrid() {

    jQuery("#ruleMatricesGrid").jqGrid({
        datatype: "local",
        colNames: ['Id', 'Active', 'ID', 'Name', 'X Axis', 'Y Axis', 'XAxisSize', 'YAxisSize'],
        colModel: [
                { name: 'Id', index: 'Id', hidden: true },
                { name: 'IsActive', index: 'IsActive', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False' } },
                { name: 'Identifier', index: 'Identifier', sorttype: function (cell, obj) { return sortSpecialIds(obj.Identifier); } },
                { name: 'Name', index: 'Name' },
                { name: 'XAxisDataElementName', index: 'XAxisDataElementName' },
                { name: 'YAxisDataElementName', index: 'YAxisDataElementName' },
                { name: 'XAxisSize', index: 'XAxisSize', sorttype: 'int' },
                { name: 'YAxisSize', index: 'YAxisSize', sorttype: 'int' }],
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        sortname: 'id',
        ignoreCase: true,
        viewrecords: true,
        sortorder: "desc",
        width: $("#rulematrix").parent().parent().width() - 10,
        height: "300px",
        scrollOffset: 0,
        shrinkToFit: true,
        pager: jQuery('#ruleMatricesGrid_pager'),
        onSelectRow: function (id) {
            onMatrixGridSelectRow(id);
        }
    });
}

function onMatrixGridSelectRow(id) {
    model.selectedId = id;
    model.onAdd = false;
    controller.displayEditMatrixView(id);
    DetermineHeaderText();

    $("#yAxisSize").change(function () {
        setTimeout("changeTop($(\".noty_bar\"));", 50);
    });
    $("#xAxisSize").change(function () {
        setTimeout("changeLeft($(\".noty_bar\"));", 50);
    });

    AddMatrixValidationRules();
    oldValues = new Array();
    oldValues = GetControlValues();
    setTimeout("changeLeft($(\".noty_bar\"));", 50);
    setTimeout("changeTop($(\".noty_bar\"));", 50);

}


function changeLeft(noty) {
    noty.css({ 'left': ($(window).width() - noty.outerWidth()) / 2 + 'px' });
}
function changeTop(noty) {
    noty.css({ 'top': ($(window).height() - noty.outerHeight()) / 2 + 'px' });
}
function saveMatrixClick() {

    var valid = $('.noty_bar').find('form').valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        return;
    };

    if (!controller.ValidateMatrixGrid()) {

        alert("Matrix needs to be filled accurately to save.");

        return;
    }

    controller.saveMatrix();
}

function cancelMatrixClick() {
    var newValues = GetControlValues();
    var compareValues = CompareArrays(newValues, oldValues);
    if (!compareValues) {
        if (confirm("Clicking ok will cancel your changes!")) {
            $("#ruleMatrixDiv").empty();
            $("#btnSave").hide();
            $("#btnMatrixCancel").hide();
            closeNoty();
        }
    }
    else {
        $("#ruleMatrixDiv").empty();
        $("#btnSave").hide();
        $("#btnMatrixCancel").hide();
        closeNoty();
    }
}

function checkInput(e, goods) {
    var key, keychar;
    key = getkey(e);
    if (key == null) return true;

    // get character
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    goods = goods.toLowerCase();

    // check goodkeys
    if (goods.indexOf(keychar) != -1)
        return true;

    // control keys
    if (key == null || key == 0 || key == 8 || key == 9 || key == 13 || key == 27)
        return true;

    // else return false
    return false;
}

function getkey(e) {
    if (window.event)
        return window.event.keyCode;
    else if (e)
        return e.which;
    else
        return null;
}

function AddMatrixValidationRules() {

    $.validator.addMethod('selectNone',
      function (value, element) {
          return this.optional(element) ||
            (value != -1);
      }, "Please select an option");


    $.validator.addMethod('selectxAxis',
      function (value, element) {
          return ($.noty.get("xAxisDataElementId").val() != -1 && $.noty.get("xAxisDataElementId").val() != null) || ($.noty.get("yAxisDataElementId").val() != null && $.noty.get("yAxisDataElementId").val() != -1);
      }, "Please select an option");


    $.validator.addMethod('selectyAxis',
      function (value, element) {
          return ($.noty.get("yAxisDataElementId").val() != -1 && $.noty.get("yAxisDataElementId").val() != null) || ($.noty.get("xAxisDataElementId").val() != null && $.noty.get("xAxisDataElementId").val() != -1);
      }, "Please select an option");


    $.validator.addMethod('isPercent',
    function (value, element) {
        var checkFlag = true;
        var selectedVal = $("#creditPolicyTypeId :selected").text();
        var txtdVal = value;
        txtdVal = txtdVal.replace('$', '').replace(',', '');
        txtdVal = txtdVal.replace('%', '').replace('-', '');

        if (selectedVal == minIncome || selectedVal == maxAF || selectedVal == minAF) {
            if ((parseInt(txtdVal) < 0) || (value.indexOf("$") == -1)) {
                checkFlag = false;
            }
        }
        else if (selectedVal == maxPTI || selectedVal == maxDTI || selectedVal == maxLine3 || selectedVal == maxLine5) {
            if ((parseInt(txtdVal) < 0) || (parseInt(txtdVal) > 1000)) {
                checkFlag = false;
            }
        }
        else if (selectedVal == maxTerm || selectedVal == maxVechicleAge) {
            if ((parseInt(txtdVal) < 0) || (parseInt(txtdVal) >= 100) || (value.indexOf("$") != -1) || (value.indexOf("%") != -1)) {
                checkFlag = false;
            }
        }
        else if (selectedVal == maxPymt || selectedVal == minPymt) {
            if ((parseInt(txtdVal) < 0) || (value.indexOf("$") == -1)) {
                checkFlag = false;
            }
        }
        else if (selectedVal == maxMiles) {
            if ((parseInt(txtdVal) < 0) || (value.indexOf("%") != -1) || (value.indexOf("$") != -1)) {
                checkFlag = false;
            }
        }
        else
            if ((parseInt(value.replace('%', '').replace('_', '')) <= 100) && (parseInt(value.replace('%', '').replace('_', '')) >= 0)) {
                if (value == '')
                    checkFlag = false;
            }
        return checkFlag;
    }, "Please select an option");

    $.validator.addMethod('isCorrect',
      function (value, element) {


          if ($.noty.get("xAxisDataElementId").val() == "23" || $.noty.get("xAxisDataElementId").val() == "24" || $.noty.get("xAxisDataElementId").val() == "20" || $.noty.get("xAxisDataElementId").val() == "22" || $.noty.get("xAxisDataElementId").val() == "27" || $.noty.get("xAxisDataElementId").val() == "26" || $.noty.get("xAxisDataElementId").val() == "25" || $.noty.get("xAxisDataElementId").val() == "25") {
              return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:[\s\.,]\d{3})+)(?:[\.,]\d+)?$/.test(value);
          }
          return true;
      }, "Please select an option");

    $.validator.addMethod('isCorrectY',
      function (value, element) {


          if ($.noty.get("yAxisDataElementId").val() == "23" || $.noty.get("yAxisDataElementId").val() == "24" || $.noty.get("yAxisDataElementId").val() == "20" || $.noty.get("yAxisDataElementId").val() == "22" || $.noty.get("yAxisDataElementId").val() == "27" || $.noty.get("xAxisDataElementId").val() == "26" || $.noty.get("yAxisDataElementId").val() == "25" || $.noty.get("yAxisDataElementId").val() == "25") {
              return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:[\s\.,]\d{3})+)(?:[\.,]\d+)?$/.test(value);
          }
          return true;
      }, "Please select an option");

    $.validator.addMethod('correct',
      function (value, element) {
          return this.optional(element) || /%/.test(value);
      }, "Please select an option");


    $.validator.addMethod('FieldRuleX',
    function (value, element) {
        var SelectedData = _.filter(model.dataElements, function (i) { return i.Name == $("#xAxisDataElementId option:selected").text(); });
        if (SelectedData[0].DataTypeName == DATATYPE_CURRENCY) {
            value = value.trim();
        }

        if (SelectedData[0].FieldLength > 0) {
            if (value.length > SelectedData[0].FieldLength) {
                element.value = value.replace(/.$/g, '');
            }
        }
        var regEx = new RegExp(SelectedData[0].RegEx);
        if (!_.isUndefined(regEx))
            if (SelectedData[0].RegEx != null)
                return regEx.test(value);
            else { return true; }
    }, "Please select an option");


    $.validator.addMethod('FieldRuleY',
    function (value, element) {
        var SelectedData = _.filter(model.dataElements, function (i) { return i.Name == $("#yAxisDataElementId option:selected").text(); });
        if (SelectedData[0].DataTypeName == DATATYPE_CURRENCY) {
            value = value.trim();
        }
        if (SelectedData[0].FieldLength > 0) {
            if (value.length > SelectedData[0].FieldLength) {
                element.value = value.replace(/.$/g, '');
            }
        }
        var regEx = new RegExp(SelectedData[0].RegEx);
        if (!_.isUndefined(regEx))
            if (SelectedData[0].RegEx != null)
                return regEx.test(value);
            else { return true; }
    }, "Please select an option");


    $('.noty_bar').find('form').validate({

        errorPlacement: function (error, element) {
            return true;
        },

        onfocusout: function (element) {
            $(element).valid();
        },

        rules: {

            name: { required: true },
            creditPolicyTypeId: { required: true, selectNone: true },
            xAxisDataElementId: { selectxAxis: true },
            yAxisDataElementId: { selectyAxis: true },
            blockY: { required: true },
            blockX: { required: true },
            blockPercentage: { required: true, isPercent: true }
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


$("#blockY").live("keyup", function (event) {
    KeyUp($("#yAxisDataElementId option:selected").text(), $(this))
});

$("#blockY").live("keydown", function (event) {
    KeyDown($("#yAxisDataElementId option:selected").text(), $(this))
});


$("#blockX").live("keyup", function (event) {
    KeyUp($("#xAxisDataElementId option:selected").text(), $(this))
});

$("#blockX").live("keydown", function (event) {
    KeyDown($("#xAxisDataElementId option:selected").text(), $(this))
});

$("#blockX").live("focus", function (event) {
    ApplyMask($("#xAxisDataElementId option:selected").text(), $(this))
    //FillDropDowns($("#xAxisDataElementId option:selected").text(), $(this))
});

$("#blockY").live("focus", function (event) {
    ApplyMask($("#yAxisDataElementId option:selected").text(), $(this))
    //FillDropDowns($("#yAxisDataElementId option:selected").text(), $(this))
});


function FillDropDowns(selectedValues, Currentcontext) {
    var SelectedData = _.filter(model.dataElements, function (i) { return i.Name == selectedValues; });

    if (SelectedData[0].DataTypeName == DATATYPE_DROPDOWN) {
        
        Currentcontext.html(GetDropdownValues(SelectedData[0].Name));
    }
}


function KeyUp(selectedValues, Currentcontext) {
    var SelectedData = _.filter(model.dataElements, function (i) { return i.Name == selectedValues; });

    if (SelectedData[0].DataTypeName == DATATYPE_CURRENCY) {
        var newVal = Currentcontext.val();
        newVal = newVal.trim();
        Currentcontext.val(newVal);
    }
    if (SelectedData[0].FieldLength > 0) {
        if (Currentcontext.val().length > SelectedData[0].FieldLength) {
            Currentcontext.val(Currentcontext.val().replace(/.$/g, ''));
        }
    }

    if (SelectedData[0].Name != 'Email' && SelectedData[0].Name != 'Address ZipCd' && SelectedData[0].Name != 'ZipCd' && SelectedData[0].DataTypeID != 4 && SelectedData[0].Name != 'Phone Nbr' && SelectedData[0].Name != 'Fax Nbr' && SelectedData[0].Name != 'Year' && SelectedData[0].DataTypeName != DATATYPE_DROPDOWN
        && SelectedData[0].RegEx != null) {

        var regEx = new RegExp(SelectedData[0].RegEx);
        if (!_.isUndefined(regEx)) {
            if (!regEx.test(Currentcontext.val())) {
                //Currentcontext.val(Currentcontext.val().replace(/.$/g, ''));
            }
        }
    }
}


function KeyDown(selectedValues, Currentcontext) {
    var SelectedData = _.filter(model.dataElements, function (i) { return i.Name == selectedValues; });
    if (SelectedData[0].FieldLength > 0) {
        if (Currentcontext.val().length > SelectedData[0].FieldLength) {
            Currentcontext.val(Currentcontext.val().replace(/.$/g, ''));
        }
    }
}

function ApplyMask(selectedValues, Currentcontext) {

    var SelectedData = _.filter(model.dataElements, function (i) { return i.Name == selectedValues; });

    if (SelectedData[0].DataTypeID == 4) {
        Currentcontext.mask("99/99/9999", { completed: function () { } });
    }

    if (SelectedData[0].Name == 'Phone Nbr' || SelectedData[0].Name == 'Fax Nbr') {
        Currentcontext.mask("999-999-9999", { completed: function () { } });
    }
    if (SelectedData[0].DataTypeName == DATATYPE_PERCENTAGE) {
        Currentcontext.autoNumeric({ aSign: '%', pSign: 's', vMax: '999.99' });
    }
    if (SelectedData[0].DataTypeName == DATATYPE_CURRENCY) {
        Currentcontext.autoNumeric({ aSign: '$', aSep: ',', dGroup: '3', vMax: '999999.99', vMin: '-999999.99' });
    }
    
    if (SelectedData[0].DataTypeName == DATATYPE_DECIMAL) {
        Currentcontext.autoNumeric({ aSign: '', aSep: ',', dGroup: '3', vMax: '999999.999999', vMin: '-999999.999999' });
    }

    if (SelectedData[0].DataTypeName == DATATYPE_MILES) {
        Currentcontext.autoNumeric({ vMax: '999999999', aSep: ',', dGroup: '3', aPad: false });
    }
    if (SelectedData[0].Name == "Year") {
        Currentcontext.mask("9999", { completed: function () { } });
    }
}
