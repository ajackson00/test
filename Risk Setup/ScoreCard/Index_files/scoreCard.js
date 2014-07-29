    var oldValues = new Array();

    $.ajaxSetup({ cache: false });

    Model = function () {
        this.dataElements = null;
        this.scoreCards = null;
        this.selectedId = null;
        this.onAdd = false;
        this.selectedCard = null;
        this.adverseActions = null;
        this.formulas = null;
    };

    var model = null;

    function ModifyGridDefaultStyles() {
        $('#' + "list" + ' tr').removeClass("ui-widget-content");
        $('#' + "list" + ' tr:nth-child(even)').addClass("formClass");
        $('#' + "list" + ' tr:nth-child(odd)').addClass("formClass");
    }

    $(function () {
        initSearchForGrid("#grid");

        model = new Model();

        getMetadata();

        $("#btnAdd").click(function () {
            onAddClick();
        });

        LoadJqGrid();
    });


    function LoadJqGrid() {

        jQuery("#grid").jqGrid({
            datatype: "local",
            colNames: ['Id', 'Active', 'ID', 'Name', 'Description'],
            colModel: [
                { name: 'Id', index: 'Id', hidden: true },
                { name: 'IsActive', index: 'IsActive', width: 26, formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False'} },
                { name: 'Identifier', index: 'Identifier', width: 50, sorttype: function (cell, obj) { return sortSpecialIds(obj.Identifier); } },
                { name: 'Name', index: 'Name' },
                { name: 'Description', index: 'Description' }
            ],
            rowNum: 50,
            rowList: [5, 10, 20, 50],
            ajaxGridOptions: { cache: false },
            width: $("#content").width() - 10,
            height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
            sortname: 'id',
            viewrecords: true,
            sortorder: "desc",
            loadonce: true,
            shrinkToFit: true,
            pager: '#grid_pager',
            scrollOffset: 0,
            onSelectRow: function (id) {
                onGridSelectRow(id);
            }
        });
    }
    
    function onAddClick() {
        displayAddView();
        oldValues = new Array();
        ModifyGridDefaultStyles();
        oldValues = GetControlValues();
    }

    function onGridSelectRow(id) {
        model.selectedId = id;
        model.onAdd = false;
        displayEditView(id);
        oldValues = new Array();
        ModifyGridDefaultStyles();
        oldValues = GetControlValues();
    }

    function getMetadata() {
        $.getJSON("/admin/scoreCard/getMetadata", function (data) {
            model.adverseActions = $.parseJSON(data.AdverseActions);
            model.formulas = $.parseJSON(data.Formulas);

            $.when(getDataElements()).done(function () {
                getScoreCards();
            });
        });
    }

    function getDataElements() {
        var deferred = $.Deferred();
        $.getJSON("/admin/scoreCard/getDataElements", function (data) {
            model.dataElements = data.DataElements;
            deferred.resolve();
        });
        return deferred.promise();
    }

    function getScoreCards() {

        $.getJSON("/admin/scoreCard/scoreCards", function (data) {
            model.scoreCards = $.parseJSON(data.ScoreCards);
            displayScoreCards();
        });
    }

    function displayScoreCards() {

        jQuery("#grid").clearGridData();

        if (model.scoreCards.length > 0) {
            for (var i = 0; i <= model.scoreCards.length; i++)
                jQuery("#grid").jqGrid('addRowData', i + 1, model.scoreCards[i]);
            if (model.onAdd) {
                model.selectedId = model.scoreCards.length;
            }
            if (model.selectedId) {
                //jQuery("#grid").setSelection(model.selectedId, true);
            }
        }
    }

    function displayEditView(rowId) {
        var row = jQuery("#grid").getRowData(rowId);
        var filtered = _.filter(model.scoreCards, function (i) { return i.Id == row.Id; });

        if (filtered.length > 0) {
            var selected = filtered[0];
            showScoreCardDetailView(selected);
        }
    }

    function displayAddView() {
        model.selectedId = null;
        model.onAdd = true;
        showScoreCardDetailView({ Id: 0, Bins: [], IsActive: true, FormulaId: 0 });
    }

    function getCurrentBin(control) {
        var trControl = $(control).parent().parent();
        var selectedIndex = $(trControl.parent()).find("tr").index(trControl);
        var bin = model.selectedCard.Bins[selectedIndex - 1];
        if (bin.Id == 0 && bin.New) bin.New = false;
        return bin;
    }

    function showScoreCardDetailView(scoreCard) {
        model.selectedCard = scoreCard;
        $("#scoreCardDiv").empty();
        $("#scoreCardDivTemplate").tmpl(scoreCard, model).appendTo("#scoreCardDiv");

        if (scoreCard.Id == 0) {
            $("#lblidentifier").hide();
            $("#identifier").hide();
        }
        else {
            $("#lblidentifier").show();
            $("#identifier").show();
            $("#identifier").attr('disabled', true);
        }

        if (scoreCard.IsActive)
            $("#status").attr("checked", true);
        else
            $("#status").attr("checked", false);

        var dataElementStr = "0:Select";
        _.each(model.dataElements, function (item) {
            dataElementStr += ";" + item.Id + ":" + item.Name;
        });


        var adverseActionStr = "0:Select";
        _.each(model.adverseActions, function (item) {
            adverseActionStr += ";" + item.Id + ":" + item.Identifier + " - " + item.ShortDescription;

        });
    
        jQuery("#binGrid").jqGrid({
            datatype: "local",
            colNames: ['Id', 'Default', 'Identifier', 'Characteristic', 'Bin Low', 'Bin High', 'Point Value', 'Adverse Action'],
            colModel: [
                { name: 'Id', index: 'Id',  hidden: true },
                { name: 'IsDefault', index: 'IsDefault', width: 75, align: 'center', sortable: false, editable: true,  edittype: 'checkbox', editoptions:
                    { dataEvents:
                        [{ type: 'click', fn: function (e) {
                            var bin = getCurrentBin(this);
                            bin.IsDefault = $(this).is(":checked");
                            showHideAdverseAction($(this).parent().parent(), true);
                        }
                        }]
                    }
                },
                { name: 'BinIdentifier', index: 'BinIdentifier', width: 75, editable: false },
                { name: 'DataElementId', index: 'DataElementId', width: 200, sortable: false, editable: true,  edittype: 'select', editoptions:
                    { value: dataElementStr,
                        dataEvents:
                            [{ type: 'change', fn: function (e) {
                                var bin = getCurrentBin(this);
                                bin.DataElementId = $(this).val();
                            }
                            }]
                    }
                },

                { name: 'BinLow', index: 'BinLow', width: 75, sortable: false,  editable: true,
                    editoptions:
                        { dataEvents:
                            [{ type: 'change', fn: function (e) {
                                var bin = getCurrentBin(this);
                                bin.BinLow = $(this).val();
                            }
                            }]
                        }
                },
                { name: 'BinHigh', index: 'BinHigh', width: 75, sortable: false,  editable: true,
                    editoptions:
                        { dataEvents:
                            [{ type: 'change', fn: function (e) {
                                var bin = getCurrentBin(this);
                                bin.BinHigh = $(this).val();
                            }
                            }]
                        }
                },
                { name: 'PointValue', index: 'PointValue', width: 100, sortable: false, editable: true,  editrules: { integer: true },
                    editoptions:
                        { dataEvents:
                            [{ type: 'change', fn: function (e) {
                                var bin = getCurrentBin(this);
                                bin.PointValue = $(this).val();
                            }
                            }]
                        }
                },

                { name: 'AdverseActionId', index: 'AdverseActionId', width: 200, sortable: false, editable: true,   edittype: 'select', editoptions:
                    { value: adverseActionStr,
                        dataEvents:
                            [{ type: 'change', fn: function (e) {
                                var bin = getCurrentBin(this);
                                bin.AdverseActionId = $(this).val();
                            }
                            }]
                    }
                }
            ],
            rowNum: 10,
            sortname: 'id',
            viewrecords: true,
            sortorder: "desc",
            ignoreCase: true,
            scrollOffset: 0,
            width: $("#scorecard").parent().width() - 10,
            height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) *.56,
            scrollrows: false,
            autowidth: false,
            shrinkToFit: true,
            onSelectRow: function (id) {
            }
        });

        $("#btnAddBin").click(function () {
            AddNewBin(scoreCard);
        });
        
        for (var j = scoreCard.Bins.length; j < 10; j++) {
            var newBin = { Id: 0, DataElementId: 0, IsDefault: false, BinLow: "", BinHigh: "", BinIdentifier: "", PointValue: "", AdverseActionId: 0 , New: true };
            scoreCard.Bins.push(newBin);
        }

        for (var i = 0; i < scoreCard.Bins.length; i++)
            jQuery("#binGrid").jqGrid('addRowData', i + 1, scoreCard.Bins[i]);

        var ids = jQuery("#binGrid").getDataIDs();
        for (var index = ids.length - 1; index >= 0; index--) {
            jQuery("#binGrid").editRow(ids[index], true);
        };

        enableDisableAdverseActions();

       // $("#scoreCardModal").dialog("destroy");

       // $("#scoreCardModal").colorbox();

        $.colorbox({ closeButton: false, inline: true, href: "#scoreCardDiv", transition: 'none', speed: 0, onCleanup: function () {
            $("#scoreCardDiv").empty();
        }
        });

       
       
//        $("#scoreCardModal").dialog({
//            autoOpen: false,
//            width: "auto",
//            height: "auto",
//            modal: true
////            buttons: {
////                Save: function () {
////                    saveScoreCard();
////                },
////                Cancel: function () {
////                    getScoreCards();
////                    ModifyGridDefaultStyles();
////                    var newValues = GetControlValues();
////                    var compareValues = CompareArrays(newValues, oldValues);
////                    if (!compareValues) {
////                        if (confirm("Clicking ok will cancel your changes!")) {
////                            $(this).dialog("close");
////                        }
////                    }
////                    else {
////                        $(this).dialog("close");
////                    }
////                }
//            //}
//        });
        
        // $("#scoreCardModal").dialog("open");
        

        disableUnlessCanEdit();
    }

    function enableDisableAdverseActions() {
        var trs = $("#binGrid").find("tr");
        var totalRows = trs.length;
        for (var index = 1; index < totalRows; index++) {
            showHideAdverseAction($(trs[index]), false);
        };
    }

    function showHideAdverseAction(trParent, resetValue) {
        var adverseActionSelect = trParent.find("select[name='AdverseActionId']");
        var isDefaultControl = trParent.find("input:checkbox[name='IsDefault']");
        if (!isDefaultControl.is(":checked")) {
            adverseActionSelect.val(0);
            adverseActionSelect.find("option[value='0']").text("");
            adverseActionSelect.attr("disabled", "disabled");
        } else {
            if (resetValue)
                adverseActionSelect.val(0);
            adverseActionSelect.find("option[value='0']").text("Select");
            adverseActionSelect.removeAttr("disabled");
        }
    }

    function AddNewBin(scoreCard) {
        var newBin = { Id: 0, DataElementId: 0, IsDefault: false, BinLow: "", BinHigh: "", BinIdentifier: "", PointValue: "", AdverseActionId: 0, New: true };
        scoreCard.Bins.push(newBin);
        jQuery("#binGrid").jqGrid('addRowData', scoreCard.Bins.length, newBin);
        jQuery("#binGrid").editRow(scoreCard.Bins.length, true);
        showHideAdverseAction( $($("#binGrid").find("tr")[scoreCard.Bins.length]), true);
    }

    function cancel() {
        getScoreCards();
        ModifyGridDefaultStyles();
        var newValues = GetControlValues();
        var compareValues = CompareArrays(newValues, oldValues);
        if (!compareValues) {
            if (confirm("Clicking ok will cancel your changes!")) {
                $.colorbox.close();
            }
        }
        else {
            $.colorbox.close();
        }
    }

    function save() {
        //required for config wizard
    }

    function saveScoreCard() {
        var mainDiv = $("#scoreCardDiv");

        if ($("#name", mainDiv).val() == '' || $("#description", mainDiv).val() == '') {
            alert("Name and Description fields cannot be blank.");
            return false;
        }
     
        model.selectedCard.Name = $("#name", mainDiv).val();
        model.selectedCard.Description = $("#description", mainDiv).val();

        model.selectedCard.IsActive = $("#status").is(":checked");
        model.selectedCard.FormulaId = $("#formula").val();
        
        var modifiedBins = _.filter(model.selectedCard.Bins, function (bin) { return bin.Id > 0 || !bin.New; });

        if (!validateBins(modifiedBins))
            return false;
        
        var postData = {
            Id: model.selectedCard.Id,
            Name: model.selectedCard.Name,
            Description: model.selectedCard.Description,
            IsActive: model.selectedCard.IsActive,
            FormulaId: model.selectedCard.FormulaId,
            Bins: modifiedBins
        };

        $.ajax({
            type: 'POST',
            url: "/admin/scoreCard/save",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ ScoreCardModel: { ScoreCardData: postData} }),
            success: function (data) {
                if (data.Success) {
                    getMetadata();
                    notyModal('Data saved successfully.');
                    $.colorbox.close();
                    LoadJqGrid();
                   
                } else if (data.DuplicateDefault) {
                    alert("Only one Bin can be set as default for a Characteristic.");
                } else {
                    alert("something went wrong.");
                }
            }
        });
    }

    function validateBins(bins) {

        if (_.any(bins, function (bin) { return bin.DataElementId == 0; })) {
            alert("A characteristic must be selected for a bin");
            return false;
        }

        var charGroups = _.groupBy(bins, function (b) { return b.DataElementId; });
        var errorFound = false;
        _.each(charGroups, function (group) {
            var defaultCount = _.filter(group, function(bin) { return bin.IsDefault; }).length;
            if (!errorFound && defaultCount == 0) {
                alert("At least one bin must be marked as default for a characterstic.");
                errorFound = true;
            }

            if (!errorFound && defaultCount > 1) {
                alert("Only one Bin can be set as default for a Characteristic.");
                errorFound = true;
            }
        });

        if (errorFound)
            return false;

        var defaultBins = _.filter(bins, function(bin) {
             return bin.IsDefault;
        });
        if (_.any(defaultBins, function (bin) { return bin.AdverseActionId == 0; })) {
            alert("An Adverse Action must be selected for a default bin");
            return false;
        }

        return true;
    }


    function showDropdownSelection() {
        $("#dropdownSelectionDiv").empty();
        $.get("/Admin/SelectionAdmin?RuleGroupTypeId=20", function (html) {
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

            $.when(getDataElements()).done(function () {
                if (model.onAdd) {
                    onAddClick();
                } else {
                    onGridSelectRow(model.selectedId);
                }
            });
        } else {
            alert("There was an error adding elements. Please try again");
        }
    }