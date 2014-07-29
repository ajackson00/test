var QueueViewmodel = {};
var RuleId=0;
var SelectedIds;

var ruleModel = null;
var ruleGrpType;
var ruleGroupType;
var oldValues = new Array();
var editMode = false;
var selectedRowId = '';
var statusList;

$.ajaxSetup({ cache: false });
var DATATYPE_PERCENTAGE = 'Percentage';

var vendorTypeMap = [{ key: "1.1", value: "40" }, { key: "1.2", value: "41" }, { key: "2.1", value: "45" }, { key: "2.2", value: "43" },
        { key: "3.1", value: "46" }, { key: "3.2", value: "44" }, { key: "4.1", value: "60" }, { key: "4.2", value: "61" }, { key: "5.2", value: "67" }, { key: "5.1", value: "68" },
        { key: "6.2", value: "71" }, { key: "6.1", value: "72" }, { key: "7.1", value: "73" }, { key: "7.2", value: "74" }];

RuleModel = function () {
    this.ruleTypes = null;
    this.dataTypes = null;
    this.AppType = null;
    this.rules = null;
    this.ruleOperators = null;
    this.adverseActions = null;
    this.outcomeIdentifiers = null;
    this.matrices = null;
    this.scoreCards = null;
    this.isScoreCardRule = null;
    this.ruleGroupData = null;
    this.dropdowns = null;
    this.years = null;
    this.formulaModel = null;
    this.selectedRule = null;
};

RuleService = new function () {

    this.fillOperatorData = function (ruleModel, ruleGroupType) {
        var parameter = { ruleGroupType: ruleGroupType };
        var deferred = $.Deferred();
        $.getJSON("/admin/rule/getOperatorData", parameter, function (data) {
            ruleModel.dataTypes = data.DataTypes;
            ruleModel.appTypes = data.appTypes;
            ruleModel.ruleOperators = data.RuleOperators;
            ruleModel.adverseActions = data.AdverseActions;
            ruleModel.outcomeIdentifiers = data.OutcomeIdentifiers;
            ruleModel.matrices = data.Matrices;
            ruleModel.scoreCards = data.ScoreCards;
            ruleModel.ruleGroupData = data.RuleGroupData;
            ruleModel.ExecutionType = data.ExecutionType;
            ruleModel.ExecutionApplicantType = data.ExecutionApplicantType;
            ruleModel.multiDecisionMatrices = data.MultiDecisionMatrices;
            ruleModel.notificationTemplates = data.NotificationTemplates;
            ruleModel.dataElementGroups = data.DataElementGroups;
            ruleModel.dataElements = data.DataElements;
            ruleModel.formatPages = data.FormatPages;
            ruleModel.paymentCallConfigurations = data.PaymentCallConfigurations;
            ruleModel.outboundDataSources = data.OutboundSources;
            ruleModel.colors = [{ Id: "", Name: "default" }, { Id: "red", Name: "red" }, { Id: "green", Name: "green" }];
            ruleModel.bookoutSources = data.BookoutSources;
            ruleModel.bookoutValueTypes = data.BookoutValueTypes;
            deferred.resolve();
        });
        return deferred.promise();
    };

    this.getRuleTypeData = function (ruleModel, ruleGroupType) {
        var parameter = { ruleGroupType: ruleGroupType };
        var deferred = $.Deferred();
        $.getJSON("/admin/rule/getRuleTypeData", parameter, function (data) {
            ruleModel.ruleTypes = data.RuleTypes;
            ruleModel.toleranceRuleTypes = data.ToleranceRuleTypes;
            ruleModel.dropdowns = data.Dropdowns;
            ruleModel.econValidationMessages = data.econValidationMessages;
            ruleModel.isEconEnabled = data.isEconEnabled;
            deferred.resolve();
        });
        return deferred.promise();
    };

    this.GetQueueViewData = function (ruleId) {
        $.getJSON("/admin/Rule/GetQueueViewMetaData?RuleId=" + ruleId, function (data) {
            QueueViewmodel.columns = $.parseJSON(data.AllUsers);
            QueueViewmodel.configuration = $.parseJSON(data.UserList);
        });
    };

    this.getRuleContentFor = function (ruleModel, ruleGroupType) {
        var parameter = { ruleGroupType: ruleGroupType };
        var content = $.getJSON("/admin/rule/getruledata", parameter, function (data) {
            ruleModel.rules = data.Rules;

            for (var i = 0; i < ruleModel.rules.length; i++) {
                if (ruleModel.rules[i].TrueOutcome != null) {
                    if (ruleModel.outcomeIdentifiers != null) {
                        for (var j = 0; j < ruleModel.outcomeIdentifiers.length; j++) {
                            if (ruleModel.outcomeIdentifiers[j].Id == ruleModel.rules[i].TrueOutcome) {
                                ruleModel.rules[i].TrueOutcomeIdentifier = ruleModel.outcomeIdentifiers[j].Identifier;
                                break;
                            }
                        }
                    }
                }
            }

            displayRules();
        });
    };


    this.saveRule = function (rule, ruleGroupType) {
        $.noty({ text: "Saving...", type: "information", layout: "topRight", timeout: false });

        $.ajax({
            async: false,
            type: 'POST',
            url: "/admin/rule/saverule",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ RuleModel: { RuleData: rule, RuleGroupType: ruleGroupType } }),
            success: function (data) {
                if (data.error) {
                    alert(data.error);
                }
                else {
                    RuleId = data.value;
                    if ((ruleGroupType == 25 || ruleGroupType == 70) && RuleId > 0) {
                        RuleService.saveUsersInRule(rule, ruleGroupType, SelectedIds);
                    } else {
                        window.setTimeout(function () {
                            RuleService.getRuleContentFor(ruleModel, $("#RuleGroupType").val());
                        }, 1000);
                    }
                }
            },
            complete: function (jqXHR, textStatus) {
                if (textStatus != "success") {
                    alert('An error occurred trying to save the rule.');
                }
            }
        });
    };

    this.revertRule = function (rule, ruleGroupType) {
        $.ajax({
            type: 'POST',
            url: "/admin/rule/revertRule",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ RuleModel: { RuleData: rule, RuleGroupType: ruleGroupType } }),
            success: function (data) {
                RuleService.getRuleContentFor(ruleModel, $("#RuleGroupType").val());
                RuleId = data.value;
            }
        });
    };

    this.SetSelectedIds = function () {
        var selectedColumnIds = _.map($('#selectedColumns option'), function (o) {
            return o.value;
        });

        if (selectedColumnIds.length > 0) {
            SelectedIds = selectedColumnIds;
        }
        else {
            selectedColumnIds = SelectedIds;
        }

    };

    this.saveUsersInRule = function (rule, ruleGroupType, selectedColumnIds) {

        var usersInQueueViews = [];
        if (!_.isUndefined(selectedColumnIds))
            if (selectedColumnIds.length > QueueViewmodel.configuration.length) {
                $.each(selectedColumnIds, function (i, elem) {
                    var usersInQueueView;
                    if (QueueViewmodel.configuration.length > 0) {
                        usersInQueueView = {
                            Id: (!_.isUndefined(QueueViewmodel.configuration[i])) ? QueueViewmodel.configuration[i].Id : 0,
                            UserID: elem,
                            RuleID: rule.Id
                        };

                    }
                    else {
                        usersInQueueView = {
                            Id: 0,
                            UserID: elem,
                            RuleID: RuleId
                        };
                    }
                    usersInQueueViews.push(usersInQueueView);
                });
            }
            else {
                $.each(QueueViewmodel.configuration, function (i, elem) {
                    var usersInQueueView = {
                        Id: (!_.isUndefined(QueueViewmodel.configuration[i])) ? QueueViewmodel.configuration[i].Id : 0,
                        UserID: (!_.isUndefined(selectedColumnIds[i])) ? selectedColumnIds[i] : null,
                        RuleID: rule.Id
                    };

                    usersInQueueViews.push(usersInQueueView);
                });

            }
        else {
            if (!_.isUndefined(QueueViewmodel.configuration))
                if (QueueViewmodel.configuration.length > 0) {
                    $.each(QueueViewmodel.configuration, function (i, elem) {
                        var usersInQueueView = {
                            Id: (!_.isUndefined(QueueViewmodel.configuration[i])) ? QueueViewmodel.configuration[i].Id : 0,
                            UserID: null,
                            RuleID: rule.Id
                        };

                        usersInQueueViews.push(usersInQueueView);
                    });
                }
        }

        if (ruleGroupType == 25) this.postTo("/admin/UsersInQueueView/save", usersInQueueViews);
        if (ruleGroupType == 70) this.postTo("/admin/DealPermission/save", usersInQueueViews);
    };

    this.postTo = function(url, usersInQueueViews) {
        $.ajax({
            type: 'POST',
            url: url,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ UsersInQueueViewModel: { UsersInQueueViewData: usersInQueueViews } }),
            success: function (data) {
                window.setTimeout(function () {
                    RuleService.getRuleContentFor(ruleModel, $("#RuleGroupType").val());
                }, 1000);
            }
        });
    }
};

//start
$(function () {
    ruleModel = new RuleModel();
    ruleGrpType = $("#RuleGroupType").val();
    ruleGroupType = ruleGrpType;

    if (_.isUndefined(ruleGrpType)) {
        ruleGrpType = getParameterByName("ruleGroupType");
    }

    $.getJSON("/admin/Rule/GetValidationDropdowns", function (data) {
        DropdownBranches = data.Branches;
        Dropdownstates = data.States;
        DropdownGroups = data.Groups;
        statusList = data.Statuses;
        Provinces = data.Provinces;
    });

    initSearchForGrid("#rulesGrid");
    setupRuleTypeSelectChange();
    setupInputValueEvents();

    $("#btnSaveRule").hide();
    $("#btnCancel").hide();

    //var ruleGroupType = getUrlVars()["RuleGroupType"];
    var ruleGroupType = $("#RuleGroupType").val();

    setupButtonClicks();

    //getVehicleYears();
    var getOperatorData = RuleService.fillOperatorData(ruleModel, ruleGroupType);
    var getRuleTypeData = RuleService.getRuleTypeData(ruleModel, ruleGroupType);
    getVehicleYears();

    $.when(getOperatorData, getRuleTypeData).done(function () {
        setupJqGrid();
        RuleService.getRuleContentFor(ruleModel, ruleGroupType);
        RuleService.GetQueueViewData(RuleId);
        displayVendorTypeConfig();
        displayOutboundDataSourceConfig();
    });
});

function displayOutboundDataSourceConfig() {
    var ruleGroupType = $("#RuleGroupType").val();

    if (ruleGroupType == "69") {
        $("#outboundDataSourceDiv").show();
    }
}

function displayVendorTypeConfig() {
    var ruleGroupType = $("#RuleGroupType").val();

    var matching = _.find(vendorTypeMap, function (i) { return i.value == ruleGroupType; });
    if (matching) {
        $("#vendorTypeDiv").show();
        var vendorType = matching.key.substring(0, 1);
        var isUw = matching.key.substring(2, 3);
        
        $("#vendorRuleType").val(vendorType);
        $("#isForUw").val(isUw);
        
        $("#executionTypeDiv").show();

        $("#executionTypeDropdown").change(function () {
            if ($(this).val() == "0" || $(this).val() == "1") {
                $("#searchDiv").attr("disabled", true);
                $("#rulesGrid").attr("disabled", true);
                $("#body_footer").attr("disabled", true);
            } else {
                $("#searchDiv").removeAttr("disabled");
                $("#rulesGrid").removeAttr("disabled");
                $("#body_footer").removeAttr("disabled");
            }
        });
        $("#btnExecutionType").click(function () {
            saveExecutionType();
        });

        if (ruleGroupType != "40" && ruleGroupType != "41") {
            $("#executionApplicantTypeDiv").show();
        }

        $("#executionTypeDropdown").val(ruleModel.ExecutionType);
        $("#executionApplicantTypeDropdown").val(ruleModel.ExecutionApplicantType);

        $("#vendorRuleTypeDiv").change(function () {
            RefreshForVendorType();
        });

        $("#isForUw").change(function () {
            RefreshForVendorType();
        });
    }
}

function RefreshForVendorType() {
    var key = $("#vendorRuleType").val() + "." + $("#isForUw").val();
    var matching = _.find(vendorTypeMap, function (i) { return i.key == key; });
    window.location.href = "Admin?type=vendor&ruleGroupType=" + matching.value;
}


function displayRules() {
    var ruleGroupType = $("#RuleGroupType").val();
    ruleModel.isScoreCardRule = (ruleGroupType == 4);
    jQuery("#rulesGrid").clearGridData();

    if (ruleModel.rules.length > 0) {
        for (var i = 0; i <= ruleModel.rules.length; i++)
            jQuery("#rulesGrid").jqGrid('addRowData', i + 1, ruleModel.rules[i]);
    }

     var pageNumber = ruleModel.rules.length > 0 ? 1 : 0;
     var totalRec = ruleModel.rules.length / 50;     
     $('#rulesGrid').setGridParam({
         page: pageNumber,
         total: totalRec,
         records: ruleModel.rules.length,
         loadComplete: function () {
             $.noty.closeAll();
         }
     }).trigger('reloadGrid');

}

function showHideAssignmentBasedOnGroupType(selectedRule) {
    
    var assignmentGroup = ruleModel.ruleGroupData.GroupAssignmentType;
    var headerString = ruleModel.ruleGroupData.HeaderDisplayString;
    $("#simpleRuleDiv").hide();
    $("#matrixRuleDiv").hide();
    $("#downPaymentDiv").hide();
    $("#bureauAppDedupDiv").hide();
    $("#outcomeElementDiv").hide();
    $("#autoRoutingRuleDiv").hide();
    $("#excludedIncomeDiv").hide();
    $("#housingStatusDiv").hide();
    $("#multiDecisionRuleDiv").hide();
    $("#notificationTemplateDiv").hide();
    $("#formatRuleDiv").hide();
    $("#forceNoteRuleDiv").hide();
    $("#paymentCallConfigurationDiv").hide();
    $("#outboundSourceConfigurationDiv").hide();
    $("#tradelineRulesDiv").hide();
    $("#existingCustomerDiv").hide();
    $("#bureauWaterfallRuleDiv").hide();
    $("#bookoutValueRuleDiv").hide();

    if (assignmentGroup == "AdverseAction") {
        $("#simpleRuleDiv").show();
    } else if (assignmentGroup == "Matrix") {
        $("#matrixRuleDiv").show();
        $("#lblMatrixRuleId").text(headerString.replace("Selection", ""));
    } else if (assignmentGroup == "Identifier") {
        $("#outcomeElementDiv").show();
        $("#lbloutcome").text(headerString.replace("Selection", ""));
    } else if (assignmentGroup == "AutoRoute") {
        $("#autoRoutingRuleDiv").show();
    } else if (assignmentGroup == "DownPayment") {
        $("#downPaymentDiv").show();
        $("#toleranceTextTemplate").tmpl({ Value2: selectedRule.DownPaymentValue, suffix: 'Dp' }).appendTo($("#downPaymentValueSpan"));
        $("#downPaymentCalcType").die("change");
        $("#downPaymentCalcType").live("change", function () {
            if ($(this).val() == 1) {
                $("#toleranceTextSignPreDp").show();
                $("#toleranceTextSignPostDp").removeAttr("disabled");
            } else {
                $("#toleranceTextSignPreDp").hide();
                $("#toleranceTextSignPreDp").val("-");
                $("#toleranceTextSignPostDp").attr("disabled", "disabled");
                $("#toleranceTextSignPostDp").val("%");
            }
        });
        $("#downPaymentCalcType").trigger('change');
    } else if (assignmentGroup == "BureauAppDedup") {
        $("#bureauAppDedupDiv").show();

        $("#dedupExcludeType").die("change");
        $("#dedupExcludeType").live("change", function () {
            var excludeChoiceId;
            switch ($("#dedupExcludeType").val()) {
                case '1':
                    excludeChoiceId = "#dedupBureauExcludeChoice";
                    break;
                case '3':
                case '4':
                    excludeChoiceId = "#dedupBureauExcludeChoice, #dedupAppExcludeChoice";
                    break;
                default:
                    excludeChoiceId = "#dedupAppExcludeChoice";
                    break;
            }

            $("#dedupBureauExcludeChoice").hide();
            $("#dedupAppExcludeChoice").hide();
            $(excludeChoiceId).show();
        });
        $("#dedupExcludeType").trigger('change');
    } else if (assignmentGroup == "ExcludedIncome") {
        $("#excludedIncomeDiv").show();
        $("#toleranceTextTemplate").tmpl({ Value2: selectedRule.ExcludedIncomeValue, suffix: 'EI' }).appendTo($("#excludedIncomeValueSpan"));
    } else if (assignmentGroup == "HousingStatusAdj") {
        $("#housingStatusDiv").show();
        $("#runForCoApplicant").attr("checked", selectedRule.RunForCoApplicant);
    } else if (assignmentGroup == "MultiDecision") {
        $("#multiDecisionRuleDiv").show();
    } else if (assignmentGroup == "NotificationTemplates") {
        $("#notificationTemplateDiv").show();
    } else if (assignmentGroup == "FormatRule") {
        $("#formatRuleDiv").show();
        $("#formatForDataElementGroupId").die("change");
        $("#formatForDataElementGroupId").live("change", function () {
            onFormatDataElementGroupChange();
        });
        $("#formatForDataElementGroupId").trigger("change");
    } else if (assignmentGroup == "ForceNoteRule") {
        $("#forceNoteRuleDiv").show();
        $("#forceNoteDataElementGroupId").die("change");
        $("#forceNoteDataElementGroupId").live("change", function () {
            onForceNoteDataElementGroupChange();
        });
        $("#forceNoteDataElementGroupId").trigger("change");
    }
    else if (assignmentGroup == "PaymentCall") {
        $("#paymentCallConfigurationDiv").show();
    }
    else if (assignmentGroup == "OutboundSource") {
        $("#outboundSourceConfigurationDiv").show();
    }
    else if (assignmentGroup == "TradelineRule") {
        $("#tradelineRulesDiv").show();
        $("#tradelineRuleAmountOption").die("change");
        $("#tradelineRuleAmountOption").live("change", function () {
            $("#percentOfBalance").hide();
            $("#pickGreaterValue").hide();
            $("#tradelineAmountValue").hide();
            switch ($("#tradelineRuleAmountOption").val()) {
                case '2':
                    $("#percentOfBalance").show();
                    break;
                case '3':
                    $("#percentOfBalance").show();
                    $("#pickGreaterValue").show();
                    break;
                case '4':
                    $("#tradelineAmountValue").show();
                    break;
            }
        });
        $("#tradelineRuleAmountOption").trigger('change');
    } else if (assignmentGroup == "ExistingCustomerRule") {
        $("#existingCustomerDiv").show();
        $("#minNumberOfMatches").val(selectedRule.MinNumberOfMatches);
    } else if (assignmentGroup == "BookoutValueRule") {
        $("#bookoutValueRuleDiv").show();
        $("#bookoutSourceId").die("change");
        $("#bookoutSourceId").live("change", function () {
            onBookoutSourceChange();
        });
        $("#bookoutSourceId").trigger("change");
    }
    else if (assignmentGroup == "CreditBureauWaterfall") {
        $("#bureauWaterfallRuleDiv").show();
    }
}

function onFormatDataElementGroupChange() {
    var groupId = $("#formatForDataElementGroupId").val();
    var dataElements = _.filter(ruleModel.dataElements, function (i) { return i.GroupId == groupId; });
    $("#formatForDataElementId").empty();
    _.each(dataElements, function (e) {
        if (ruleModel.selectedRule.FormatForDataElementId == e.Id) {
            $('#formatForDataElementId').append('<option selected="selected" value="' + e.Id + '">' + e.Name + '</option>');
        } else {
            $('#formatForDataElementId').append('<option value="' + e.Id + '">' + e.Name + '</option>');
        }
    });
}

function onForceNoteDataElementGroupChange() {
    var groupId = $("#forceNoteDataElementGroupId").val();
    var dataElements = _.filter(ruleModel.dataElements, function (i) { return i.GroupId == groupId; });
    $("#forceNoteDataElementId").empty();
    _.each(dataElements, function (e) {
        if (ruleModel.selectedRule.ForceNoteDataElementId == e.Id) {
            $('#forceNoteDataElementId').append('<option selected="selected" value="' + e.Id + '">' + e.Name + '</option>');
        } else {
            $('#forceNoteDataElementId').append('<option value="' + e.Id + '">' + e.Name + '</option>');
        }
    });
}

function onBookoutSourceChange() {
    var sourceId = $("#bookoutSourceId").val();
    var bookoutValueTypes = _.filter(ruleModel.bookoutValueTypes, function (i) { return i.BookoutSourceId == sourceId; });
    $("#bookoutValueType").empty();
    _.each(bookoutValueTypes, function (e) {
        if (ruleModel.selectedRule.BookoutValueType == e.Id) {
            $('#bookoutValueType').append('<option selected="selected" value="' + e.Id + '">' + e.Name + '</option>');
        } else {
            $('#bookoutValueType').append('<option value="' + e.Id + '">' + e.Name + '</option>');
        }
    });
}

function createRule(groupTypeId, rule) {
    RuleId = 0;
    SelectedIds = undefined;
    QueueViewmodel.configuration = [];
    $("#outcomeElementDiv").hide();
    $("#createRulesDiv").empty();
    $("#rulevalueinput2id").hide();

    var selectedRule = rule != null ? rule : {
        RuleMatrixId: 0,
        ScoreCardId: 0,
        RoleHierarchyLevel: 0,
        DownPaymentValue: "",
        DownPaymentType: 1,
        DownPaymentCalcType: 1,
        DedupExpenseType: "",
        DedupExcludeType: "",
        DedupExcludeChoice: "",
        DedupExcludeChoice2: "",
        ExcludedIncomeType: "",
        ExcludedIncomeValue: "",
        MinMaxType: "",
        HousingPaymentPercent: "",
        HousingPaymentValue: "",
        Variables: [],
        FormulaText: '',
        MultiDecisionMatrixId: 0,
        NotificationTemplateId: 0,
        Id: 0,
        RuleCode: $("#ruleCode").val(),
        Format: "",
        FormatApplicationPageId: 0,
        FormatForDataElementGroupId: 0,
        FormatForDataElementId: 0,
        FormatColor: '',
        FormatFontSize: '',
        TradelineRuleAmountOption: '',
        PercentOfBalance: '',
        tradelineAmountValue: '',
        PickGreaterValue: '',
        ForceNoteDataElementGroupId: 0,
        ForceNoteDataElementId: 0,
        MinNumberOfMatches: 0,
        FundingRuleRunType: 1,
        EConValidationMessage: '',
        BureauRuleChoice: '',
        BookoutSourceId: 0,
        BookoutValueType: ""
    };
   
        
    $("#createNewRuleHeaderTemplate").tmpl(selectedRule, ruleModel).appendTo("#createRulesDiv");

    if ($("#Caption").text().indexOf("Queue View") === -1) {
        $("#isPublished").parent().parent().hide();
        $('#formulaRow').hide();
    }

    $("#ID").hide(); $("#lblRuleCode").attr("style", "display:none;"); $("#ruleCode").hide();

    $("#autoRoutingRuleDiv").hide();

    ruleModel.selectedRule = selectedRule;
    
    ruleModel.formulaModel = new FormulaModel(selectedRule);
    ruleModel.formulaModel.ruleTypes = ruleModel.ruleTypes;
    if (ruleModel.formulaModel.Variables().length == 0)
        ruleModel.formulaModel.addVariable();
    
    showHideAssignmentBasedOnGroupType(selectedRule);
    
    displayAdverseActions("");
    displayOutcomeIdentifiers("");
    displayPaymentCallConfigurations("");
    displayOutboundSources("");
    createRuleElement(undefined, "Final", groupTypeId, { Published: false });

    //ticket 1618
    if (!_.isUndefined(ruleModel.ruleGroupData.HeaderDisplayString)) {
        $(".headerBorder").empty().append(ruleModel.ruleGroupData.HeaderDisplayString);
    }
}

function displayOutcomeIdentifiers(selectedValue) {
    if (!_.isUndefined(ruleModel.outcomeIdentifiers) && !_.isNull(ruleModel.outcomeIdentifiers)) {
        if (ruleModel.outcomeIdentifiers.length > 0) {
            if (ruleModel.outcomeIdentifiers != null) {
                for (var i = 0; i < ruleModel.outcomeIdentifiers.length; i++) {
                    if (ruleModel.outcomeIdentifiers[i].Identifier.toString().indexOf('-') == -1)
                        ruleModel.outcomeIdentifiers[i].Identifier = ruleModel.outcomeIdentifiers[i].Identifier + " - " + ruleModel.outcomeIdentifiers[i].Name;
                }
            }
            var outcomeElementsHtml = $("#selectIdIdentifierTemplate").tmpl({ selectList: ruleModel.outcomeIdentifiers, selectedId: selectedValue }).html();
            $("#outcomeElementDiv").show();
            $("#outcomeElement").html(outcomeElementsHtml);
        }
    }
}

function displayAdverseActions(selectedValue) {
    if (ruleModel.adverseActions != null) {
        for (var i = 0; i < ruleModel.adverseActions.length; i++) {
            if (ruleModel.adverseActions[i].Name.toString().indexOf('-') == -1)
                ruleModel.adverseActions[i].Name = ruleModel.adverseActions[i].Code + " - " + ruleModel.adverseActions[i].Name;
        }
    }
    var adverseActionSelectHtml = $("#selectIdNameTemplate").tmpl({ selectList: ruleModel.adverseActions, selectedId: selectedValue }).html();
    $("#adverseActionSelect").html(adverseActionSelectHtml);
}

function displayOutboundSources(selectedValue) {
    var outboundSourcesHtml = $("#selectIdNameTemplate").tmpl({ selectList: ruleModel.outboundDataSources, selectedId: selectedValue }).html();
    $("#outboundDataSourceSelect").html(outboundSourcesHtml);
}


function displayPaymentCallConfigurations(selectedValue) {
    var paymentCallConfigurationsHtml = $("#selectIdNameTemplate").tmpl({ selectList: ruleModel.paymentCallConfigurations, selectedId: selectedValue }).html();
    $("#paymentCallConfigurationSelect").html(paymentCallConfigurationsHtml);
}

function parseFormat(selectedRule) {
    selectedRule.FormatColor = selectedRule.FormatIsBold = selectedRule.FormatFontSize = '';
    var input = selectedRule.Format;
    var regex = /color:\s*(\w+)\s*;/g;
    var matches;
    if (regex.test(input)) {
        input.replace(regex, function ($0, $1) { selectedRule.FormatColor = $1; });
    }
    regex = /font-weight:\s*(\w+)\s*;/g;
    if (regex.test(input)) {
        input.replace(regex, function ($0, $1) { selectedRule.FormatIsBold = $1 == "bold"; });
    }
    regex = /font-size:\s*(\w+)\s*;/g;
    if (regex.test(input)) {
        input.replace(regex, function ($0, $1) { selectedRule.FormatFontSize = $1; });
    }
}

function editRule(rowId, ruleGroupTypeId) {

    $("#createRulesDiv").empty();

    var rowRule = jQuery("#rulesGrid").getRowData(rowId);
    var filtered = _.filter(ruleModel.rules, function (i) { return i.Id == rowRule.Id; });
    RuleId = rowRule.Id;
    if (filtered.length > 0) {
        
        QueueViewmodel.configuration = filtered[0].UsersInQueueView;

        if (QueueViewmodel.configuration.length < 1) {
            QueueViewmodel.configuration = filtered[0].DealPermissions;
        }

        var selectedRule = filtered[0];
        ruleModel.selectedRule = selectedRule;
        ruleModel.selectedRule.RowId = rowId;
        
        ruleModel.formulaModel = new FormulaModel(selectedRule);
        ruleModel.formulaModel.ruleTypes = ruleModel.ruleTypes;
        if (selectedRule.Format != "") {
            parseFormat(selectedRule);
        } else
            selectedRule.FormatColor = '';

        $("#createNewRuleHeaderTemplate").tmpl(selectedRule, ruleModel).appendTo("#createRulesDiv");
        
        if ($("#Caption").text().indexOf("Queue View") === -1) {
            $("#isPublished").parent().parent().hide();
            $('#formulaRow').hide();
        }
        
        $("#lblRuleCode").show(); $("#ruleCode").show(); $("#ruleCode").attr('disabled', 'disabled');

        showHideAssignmentBasedOnGroupType(selectedRule);

        $("#isRuleActive").attr("checked", selectedRule.IsActive);
        
        $("#uwCanOverride").attr("checked", selectedRule.UwCanOverride);
        
        $("#isFormulaType").attr("checked", selectedRule.IsFormulaType);
        $("#isFormulaType").attr("disabled", "disabled");
        $("#isPublished").attr("checked", selectedRule.Published);
        $("#formatIsBold").attr("checked", selectedRule.FormatIsBold);

        displayAdverseActions(selectedRule.AdverseActionId);
        displayOutcomeIdentifiers(selectedRule.TrueOutcome);
        displayOutboundSources(selectedRule.OutboundDataSourceId);
        displayPaymentCallConfigurations(selectedRule.PaymentCallConfigurationId);
        
        var elementIndex = 0;

        if (selectedRule.Elements.length == 0) {
            displayDetailWindow(selectedRule);
        }

        _.each(selectedRule.Elements, function (element) {
            if (elementIndex == (selectedRule.Elements.length - 1)) {
                createRuleElement(element, "Final", ruleGroupTypeId, selectedRule);
            }
            else {
                createRuleElement(element);
            }
            elementIndex = elementIndex + 1;
        });

        elementIndex = 0;
        $("#mainRuleElement > #ruleElementsDiv").each(function () {
            $(this).children(".ruleTypeSelect").first().val(selectedRule.Elements[elementIndex].RuleTypeId);
            showRuleElementsDivBasedOnRuleTypes(selectedRule.Elements[elementIndex], $(this).children(".ruleTypeSelect").first());
            elementIndex = elementIndex + 1;
        });

        elementIndex = 0;
        $("#mainRuleElement > #ruleElementsDiv").each(function () {
            $(this).children(".operatorSelect").first().val(selectedRule.Elements[elementIndex].OperatorId);
            $(this).children(".operatorSelect").first().trigger("change");
            elementIndex = elementIndex + 1;
        });
        
        var ruleElements = $("#mainRuleElement").find("#ruleElementsDiv");
        if(ruleElements.length > 1) {
            var firstValue = $(ruleElements[0]).find(".ruleOperatorSelect").val();
            var otherValue = (firstValue == 8) ? 9 : 8;
            _.each(_.rest(ruleElements), function(el) {
                $(el).find(".ruleOperatorSelect option[value='" + otherValue + "']").remove();        
            });
        }

        //displayDetailWindow(selectedRule);

    }
}

function getRuleToSave() {
    var excludeChoiceId;
    var excludeChoice2Id;
    switch ($("#dedupExcludeType").val()) {
        case '1':
            excludeChoiceId = "#dedupBureauExcludeChoice";
            break;
        case '3':
        case '4':
            excludeChoiceId = "#dedupBureauExcludeChoice";
            excludeChoice2Id = "#dedupAppExcludeChoice";
            break;
        default:
            excludeChoiceId = "#dedupAppExcludeChoice";
            break;
    }
    
    var formulaData = $.parseJSON(ko.mapping.toJSON(ruleModel.formulaModel));
    

    var rule = {
        AppType: $("#AppType").val(),
        Id: $("#ruleId").val(),
        Name: $("#ruleName").val(),
        Description: $("#ruleDescription").val(),
        Code: $("#ruleCode").val(),
        AdverseActionId: $("#adverseActionSelect").val(),
        IsActive: $("#isRuleActive").is(":checked"),
        ShouldFail: $("#passFailBit").is(":checked"),
        OutcomeIdentifierId: $("#outcomeElement").val(),
        TrueOutcome: $("#trueValue").val(),
        FalseOutcome: $("#falseValue").val(),
        RuleMatrixId: $("#matrixRuleId").val(),
        ScoreCardId: $("#scoreCardId").val(),
        RuleCode: $("#ruleCode").val(),
        RoleHierarchyLevel: $("#roleHierarchyLevelId").val(),
        DownPaymentCalcType: $("#downPaymentCalcType").val(),
        DownPaymentType: $("#downPaymentType").val(),
        DownPaymentValue: $("#toleranceTextSignPreDp").val() + $("#toleranceTextIdDp").val() + $("#toleranceTextSignPostDp").val(),
        DedupExpenseType: $("#dedupExpenseType").val(),
        DedupExcludeType: $("#dedupExcludeType").val(),
        DedupExcludeChoice: $(excludeChoiceId).val(),
        DedupExcludeChoice2: excludeChoice2Id == null ? null : $(excludeChoice2Id).val(),
        ExcludedIncomeType: $("#excludedIncomeType").val(),
        ExcludedIncomeValue: $("#toleranceTextSignPreEI").val() + $("#toleranceTextIdEI").val() + $("#toleranceTextSignPostEI").val(),
        MinMaxType: $("#minMaxType").val(),
        HousingPaymentPercent: $("#housingPaymentPercent").autoNumeric('get'),
        HousingPaymentValue: $("#housingPaymentValue").val(),
        RunForCoApplicant: $("#runForCoApplicant").is(":checked"),
        RuleElements: [],
        IsFormulaType: $("#isFormulaType").is(":checked"),
        FormulaText: formulaData.FormulaText,
        FormulaElements: formulaData.Variables,
        FormatColor: null,
        MultiDecisionMatrixId: $("#multiDecisionMatrixId").val(),
        NotificationTemplateId: $("#notificationTemplateId").val(),
        FormatForDataElementId: $("#formatForDataElementId").val(),
        ForceNoteDataElementId: $("#forceNoteDataElementId").val(),
        FormatApplicationPageId: $("#formatApplicationPageId").val(),
        UwCanOverride: $("#uwCanOverride").is(":checked"),
        PaymentCallConfigurationId: $("#paymentCallConfigurationSelect").val(),
        OutboundDataSourceId: $("#outboundDataSourceSelect").val(),
        TradelineRuleAmountOption: $("#tradelineRuleAmountOption").val(),
        PercentOfBalance: $("#percentOfBalance").autoNumeric('get'),
        TradelineAmountValue: $("#tradelineAmountValue").autoNumeric('get'),
        PickGreaterValue: $("#pickGreaterValue").val() == "True",
        MinNumberOfMatches: $("#minNumberOfMatches").val(),
        FundingRuleRunType: $("#fundingRuleRunType").val(),
        EConValidationMessage: $("#eConValidationMessage").val(),
        BureauRuleChoice: $("#bureauRuleChoice").val(),
        BookoutSourceId: $("#bookoutSourceId").val(),
        BookoutValueType: $("#bookoutValueType").val()
    };

    if ($("#formatRuleDiv").is(":visible")) {
        var format = "";
        if ($("#formatColor").val() != "") format = format + "color: " + $("#formatColor").val() + ";";
        format = format + "font-weight: " + ($("#formatIsBold").is(":checked") ? "bold" : "normal") + ";";
        if($("#formatFontSize").val() != "") {
            format = format + "font-size: " + $("#formatFontSize").val() + "px;";
        }
        rule.Format = format;
    }

    $("#mainRuleElement > #ruleElementsDiv").each(function () {
        var value1 = $(this).find("#rulevalueinputid").first().val();
        if (typeof value1 == 'undefined') {
            value1 = $(this).find("#rulevalueSelect1").val();
        }
        var value2 = $(this).find("#rulevalueinput2id").first().val();
        if (typeof value2 == 'undefined') {
            value2 = $(this).find("#toleranceTextSignPre").val() + $(this).find("#toleranceTextId").val() + $(this).find("#toleranceTextSignPost").val();
        }
        var ruleElement = {
            RuleElementId: $(this).find(".elementId").first().val(),
            RuleTypeId: $(this).find(".ruleTypeSelect").first().val(),
            OperationId: $(this).find(".operatorSelect").first().val(),
            Value1: value1,
            Value2: value2,
            RuleOperatorId: $(this).find(".ruleOperatorSelect").first().val()
        };
        rule.RuleElements.push(ruleElement);
    });

    return rule;
}

function revertRule() {
    if(confirm("Are you sure you want to revert this rule?")) {
        var rule = getRuleToSave();
        var ruleGroupType = $("#RuleGroupType").val();
        RuleService.revertRule(rule, ruleGroupType);
        $.noty.closeAll();    
    }
}

function displayDetailWindow(selectedRule) {
    //ruletype binding
    $(".ruleTypeSelect", $("#createRulesDiv")).unbind("change");

    $("#createRulesDiv").removeClass("inline_style").removeClass("popup_style").addClass("popup_style").end();
    
    var htmlStr = $("#createRulesDiv").html();
    $("#createRulesDiv").empty();
    
    showNoty(htmlStr, true);
    
    $("#mainFormulaElement").empty();
    ko.setTemplateEngine(new ko.nativeTemplateEngine);
    ko.applyBindings({ formulaData: ruleModel.formulaModel }, document.getElementById("mainFormulaElement"));

    $("#isFormulaType").change(function() {
        if ($(this).is(":checked")) {
            $("#mainFormulaElement").show();
            $("#mainRuleElement").hide();
        } else {
            $("#mainFormulaElement").hide();
            $("#mainRuleElement").show();
        }
    });

    $("#isFormulaType").trigger("change");
    $('#toleranceTextIdDp').autoNumeric({ vMin: '-9999999.99', vMax: '9999999.99', aSep: '' });
    $('#toleranceTextIdEI').autoNumeric({ vMin: '0.00', vMax: '9999999.99', aSep: '' });
    $('#housingPaymentPercent').autoNumeric({ vMin: '0.00', vMax: '100.00', aSep: '', aSign: '%', pSign: 's' });
    $('#housingPaymentValue').autoNumeric({ vMin: '0.00', vMax: '999999.99', aSep: '' });
    $("#formatFontSize").autoNumeric({ vMin: '0', vMax: '20', aSep: '' });
    $('#percentOfBalance').autoNumeric({ vMin: '0.00', vMax: '1000.00', aSep: '', aSign: '%', pSign: 's' });
    $('#tradelineAmountValue').autoNumeric({ vMin: '-9999999.99', vMax: '9999999.99', aSep: '' });

    $("#fundingRuleRunType").val(selectedRule.FundingRuleRunType);
    $("#fundingRuleRunType").change(function() {
        if ($("#fundingRuleRunType").val() == 2 || $("#fundingRuleRunType").val() == 3) {
            $("#econValidationMessageDiv").show();
        } else {
            $("#econValidationMessageDiv").hide();
        }
    });

    $("#fundingRuleRunType").trigger('change');

    $("#btnRevertRule").hide();
    if (!selectedRule.Published && selectedRule.Id > 0) {
      $("#btnRevertRule").show();
    }
}

function createRuleElement(element, temp, RuleGroupType, selectedRule) {

    var ruleTypeList = ruleModel.ruleTypes;
    if (_.isUndefined(element)) {
        element = { Id: "", RuleTypeId: "", OperatorId: "", Value1: "", Value2: "" };
        ruleTypeList = _.filter(ruleModel.ruleTypes, function (r) { return r.IsActive; });
    }

    var model = { ruleTypeSelectList: ruleTypeList, ruleOperatorSelectList: ruleModel.ruleOperators, element: element, p: 0 };
    var mainRuleElementDiv = $("#createRulesDiv").find("#mainRuleElement");
    $("#ruleElementTemplate").tmpl(model).appendTo(mainRuleElementDiv);
    var lastRuleElementDiv = _.last(mainRuleElementDiv.find("#ruleElementsDiv"));
    var rulevalueInputDiv = $(lastRuleElementDiv).find("#rulevalueinputDiv");
    $("#rulevalueinputDivTemplate").tmpl(model.element).appendTo(rulevalueInputDiv);
    
    if (RuleGroupType == 25 || RuleGroupType == 70) {
        ShowView();
    }
    
    if (!_.isUndefined(temp)) {
        if (temp == "Final") {
            displayDetailWindow(selectedRule);
        }
    }
}

function ShowView() {

    var config = { Columns: [] };
    var configCopy = { Columns: [] };

    var availableColumns = QueueViewmodel.columns;

    if (RuleId > 0) {
        config.Columns = QueueViewmodel.configuration;
        configCopy.Columns = QueueViewmodel.configuration;
    }

    var allColumns = QueueViewmodel.columns;
    
    availableColumns = _.filter(QueueViewmodel.columns, function (c) {
        var exists = _.any(config.Columns, function (selected) { return selected.UserID == c.Id; });
        return !exists;
    });

    if (!_.isUndefined(config.Columns)) 
    for (j = 0; j < config.Columns.length; j++ )
    {
        var column = _.filter(allColumns, function (i) { return i.Id == config.Columns[j].UserID; });
        if (column.length > 0) {

            configCopy.Columns[j].BindUserId = column[0].Id;
            configCopy.Columns[j].BindUserName = column[0].Name;
        }
    }

    $("#AssignUsersToQueueViewTemplate").tmpl(configCopy, { availableColumns: availableColumns }).appendTo("#AssignUsersToQueueViewDiv");
    //GetQueueViewData.Get();
}

function createNewEntity() {
    var element = { Id: "", RuleTypeId: "", OperatorId: "", Value1: "", Value2: "" };
    var model = { ruleTypeSelectList: ruleModel.ruleTypes, ruleOperatorSelectList: ruleModel.ruleOperators, element: element };
    $("#ruleElementTemplate").tmpl(model).appendTo("#mainRuleElement");
}
//////////////////////////////


function showRuleElementsDivBasedOnRuleTypes(element, thisCtrl) {
    var selectedRuleTypeId = thisCtrl.val();
    var selectedRuleType = _.filter(ruleModel.ruleTypes, function (i) { return i.Id == selectedRuleTypeId; });
    
    var ruleElementsDiv = thisCtrl.parent();
    var inputId, inputId2;
    var inputDiv = $(ruleElementsDiv).find("#rulevalueinputDiv");
    inputDiv.empty();
    $("#rulevalueinputDivTemplate").tmpl(element).appendTo(inputDiv);
    inputId = inputDiv.find("#rulevalueinputid");
    inputId2 = inputDiv.find("#rulevalueinput2id");
    inputId2.hide();
    inputId.unmask();
    inputId2.unmask();

    var listItems = "";
    var selectedDataType;
    if (selectedRuleType != '') {
        selectedDataType = selectedRuleType[0].DataTypeId;
        console.log(selectedDataType);
        if (selectedDataType == 3 || selectedDataType == 8 || selectedDataType == 9 || ruleModel.ruleGroupData.IsToleranceGroup) {
            inputDiv.empty();
            var ddSelect = 'Select';
            ddSelect = element.Value1;
            $("#rulevalueSelectDivTemplate").tmpl(element).appendTo(inputDiv);
            
            var dropdownId = selectedRuleType[0].DropdownId;
            
            var dropdownName = selectedDataType == 3 ? "boolean" :
                ruleModel.ruleGroupData.IsToleranceGroup ? "Tolerance" :
                dropdownId > 0 ? "Dropdown" :
                    selectedRuleType[0].Name.indexOf(".") > 0 ? selectedRuleType[0].Name.split(".")[1] : selectedRuleType[0].Name;
            
            console.log(dropdownName);
            var ddValues = GetDropdownValues(dropdownName, dropdownId);

            var select1 = inputDiv.find("#rulevalueSelect1");

            select1.append(ddValues);

            if (ddSelect != "")
                select1.val(ddSelect);

            if (!select1.val())
                select1.val(-1);

            if (ruleModel.ruleGroupData.IsToleranceGroup && $("#RuleGroupType").val() == 31) {
                $("#toleranceTextTemplate").tmpl(element).appendTo(inputDiv);
            }
        }

        if (selectedDataType == 4 && !ruleModel.ruleGroupData.IsToleranceGroup) {
            inputId.mask("99/99/9999", { completed: function () { } });
            inputId2.mask("99/99/9999", { completed: function () { } });

        }
        if (selectedRuleType[0].Name == "Fax Nbr" || selectedRuleType[0].Name == "Phone Nbr") {
            inputId.mask("999-999-9999", { completed: function () { } });
            inputId2.mask("999-999-9999", { completed: function () { } });

        }
        if (selectedRuleType[0].Name == "Year") {
            inputId.mask("9999", { completed: function () { } });
            inputId2.mask("999", { completed: function () { } });
        }

        if (!ruleModel.ruleGroupData.IsToleranceGroup) {
            if (selectedDataType == 5) {
                var newVal = inputId.val();
                inputId.val(newVal.trim());
                inputId.autoNumeric({ aSign: '$', aSep: ',', dGroup: '3', vMin: '-9999999.99', vMax: '9999999.99' });
                inputId2.autoNumeric({ aSign: '$', aSep: ',', dGroup: '3', vMin: '-9999999.99', vMax: '9999999.99' });
            }
            else if (selectedDataType == 6) {
                inputId.autoNumeric({ aSign: '%', pSign: 's', vMax: '999.00' });
                inputId2.autoNumeric({ aSign: '%', pSign: 's', vMax: '999.00' });
            }
            else if (selectedDataType == 7) {
                inputId.autoNumeric({ vMax: '999999999', aSep: ',', dGroup: '3', aPad: false });
                inputId2.autoNumeric({ vMax: '999999999', aSep: ',', dGroup: '3', aPad: false });
            }
        }
        else {
            inputDiv.find('#toleranceTextId').autoNumeric({ vMin: '-9999999.99', vMax: '9999999.99', aSep: '' });
        }
    }
    if (selectedRuleType.length == 0) {
        listItems += "<option value='-1'>Select</option>";
    }
    else {
        selectedDataType = _.filter(ruleModel.dataTypes, function (i) { return i.Id == selectedRuleType[0].DataTypeId; });
        var optionsModel = { selectList: selectedDataType[0].Operators };

        listItems += "<option value='-1'>Select</option>";
        for (var i = 0; i < optionsModel.selectList.length; i++) {
            if (ruleModel.ruleGroupData.IsToleranceGroup &&
                (optionsModel.selectList[i].CodeIdentifier == "between" || optionsModel.selectList[i].CodeIdentifier == "like")) continue;
            listItems += "<option value='" + optionsModel.selectList[i].Id + "'>" + optionsModel.selectList[i].CodeIdentifier + "</option>";
        }
    }
    ruleElementsDiv.find("#operatorSelectid").html(listItems);
}

function setupRuleTypeSelectChange() {
    // targetElement.style.display = "block";
    $("#ruleTypeSelectid").live("change", function (event) {
        var selectedId = $(this).val();
        $(this).siblings('.ruleOperatorSelect').prop('disabled', (selectedId == "-1"));
        showRuleElementsDivBasedOnRuleTypes({ Value1: "", Value2: "", OperatorId: -1 }, $(this));
    });

    $("#operatorSelectid").live("change", function (event) {
        var parentDiv = $(this).parent();
        var selectedOperator = $(this).find("option:selected").text();
        if (selectedOperator == 'between') {
            parentDiv.find("#rulevalueinput2id").show();
        }
        else {
            parentDiv.find("#rulevalueinput2id").val("").hide();
        }
        
        if (selectedOperator == 'is blank') {
            parentDiv.find("#rulevalueinputid").val("").hide();
            parentDiv.find("#rulevalueSelect1").hide();
        }
        else {
            parentDiv.find("#rulevalueinputid").show();
            parentDiv.find("#rulevalueSelect1").show();
        }
        
        AddRuleValidationRules();
    });
}

function ValidateInputs(selectedRuleType, value) {    if (selectedRuleType.FieldLength > 0) {
        if (value.val().length > selectedRuleType.FieldLength) {
            value.val(value.val().replace(/.$/g, ''));
        }
    }

    if (selectedRuleType.RegEx == null) {
        return true;
    }

    if (selectedRuleType.Name != 'Email' && selectedRuleType.Name != 'Address ZipCd' && selectedRuleType.DataTypeId != 4 && selectedRuleType.Name!= 'Dealer.ZipCd' &&
        selectedRuleType.Name != 'Phone Nbr' && selectedRuleType.Name != 'Fax Nbr' && selectedRuleType.Name != 'ZipCd' && selectedRuleType.Name != 'Year') {
        var regEx = new RegExp(selectedRuleType.RegEx);
        if (!regEx.test(value.val())) {
            if (selectedRuleType.DataTypeId == 1) {
                if (selectedRuleType.RegEx.indexOf(".") >= 0) {
                    if (event && event.which == 190) {
                        return true;
                    }
                }
            }
            if (selectedRuleType.DataTypeId == 5) return true;
            if (selectedRuleType.Name === "Vehicle.Trade VIN") return true;
            if (selectedRuleType.Name === "Vehicle.VIN") return true;
            value.val(value.val().replace(/.$/g, ''));
        }
    }
}

function setupInputValueEvents() {
    $("#rulevalueinputid").live("keyup", function (event) {
        var ruleTypeName = $(this).parents("#ruleElementsDiv").find("#ruleTypeSelectid option:selected").text();
        
        var selectedRuleType = _.filter(ruleModel.ruleTypes, function (i) { return i.Name == ruleTypeName; });
        var selectedDataType = selectedRuleType[0].DataTypeId;
        if (selectedDataType == 5) {
            var newVal = $(this).val();
            $(this).val(newVal.trim());
        }

        ValidateInputs(selectedRuleType[0], $(this));
    });

    $("#rulevalueinput2id").live("keyup", function (event) {
        
        var ruleTypeName = $(this).parents("#ruleElementsDiv").find("#ruleTypeSelectid option:selected").text();
        
        var selectedRuleType = _.filter(ruleModel.ruleTypes, function (i) { return i.Name == ruleTypeName; });
        var selectedDataType = selectedRuleType[0].DataTypeId;
        if (selectedDataType == 5) {
            var newVal = $(this).val();
            $(this).val(newVal.trim());
        }

        ValidateInputs(selectedRuleType[0], $(this));

    });

    $("#rulevalueinputid").live("keydown", function (event) {
        var selectedRuleType = _.filter(ruleModel.ruleTypes, function (i) { return i.Name == $(this).parent().parent().find("#ruleTypeSelectid option:selected").text(); });
        if (selectedRuleType != '') {
            var selectedDataType = selectedRuleType[0].DataTypeId;
            if (selectedDataType == 5) {
                var newVal = $(this).val();
                $(this).val(newVal.trim());
            }


            if (selectedRuleType[0].FieldLength > 0) {
                if ($(this).val().length > selectedRuleType[0].FieldLength) {
                    $(this).val($(this).val().replace(/.$/g, ''));
                }
            }
        }

    });

    $("#rulevalueinput2id").live("keydown", function (event) {

        //|| event.keyCode == 188
        if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
        // Allow: Ctrl+A
                        (event.keyCode == 65 && event.ctrlKey === true) ||
        // Allow: home, end, left, right
                        (event.keyCode >= 35 && event.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }

        var selectedRuleType = _.filter(ruleModel.ruleTypes, function (i) { return i.Name == $("#ruleTypeSelectid option:selected").text(); });
        if (selectedRuleType != '') {
            var selectedDataType = selectedRuleType[0].DataTypeId;
            if (selectedDataType == 5) {
                var newVal = $(this).val();
                $(this).val(newVal.trim());
            }
            
            if (selectedRuleType[0].FieldLength > 0) {
                if ($(this).val().length > selectedRuleType[0].FieldLength) {
                    $(this).val($(this).val().replace(/.$/g, ''));
                }
            }
        }
    });
}

function AddInputType(selectedDataType) {

    element = { Value1: "", Value2: "" };
    if (selectedDataType == 8 || selectedDataType == 9) {
        $("#rulevalueinputDiv").empty();
        $("#rulevalueinputDiv").empty();
        $("#rulevalueSelectDivTemplate").tmpl(element).appendTo("#rulevalueinputDiv");
        var ddValues = GetDropdownValues('Address Country');
        $("#rulevalueSelect1").append(ddValues);
    }
    else {

        $("#rulevalueinputDiv").empty();
        $("#rulevalueinputDivTemplate").tmpl(element).appendTo("#rulevalueinputDiv");
        $("#rulevalueinput2id").hide();
    }
}
            
function saveExecutionType() {
    
    var ruleGroupType = $("#RuleGroupType").val();
    
    $.noty({ text: "saving...", type: "information", layout: "topRight" });

    $.ajax({
            type: 'POST',
            url: "/admin/client/saveVendorExecution",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({  executionApplicantType: $("#executionApplicantTypeDropdown").val(), executionType: $("#executionTypeDropdown").val(), RuleGroupType: ruleGroupType}),
            complete: function (data) {
                $.noty.closeAll();
            }
        });
}

function setupButtonClicks() {
    $("#btnAddRule").click(function () {
        $("#btnSaveRule").show();
        $("#btnCancel").show();

        ruleGroupType = $("#RuleGroupType").val();
        if (_.isUndefined(ruleGroupType)) {
            ruleGroupType = getParameterByName("ruleGroupType");
        }
        //header set again

        createRule(ruleGroupType);
        
        AddRuleValidationRules();
        //set again


        AddInputType();
        oldValues = new Array();
        oldValues = GetFormValues();
    });

}

function setupJqGrid() {
    
    $("#rulesGrid").GridUnload();

    var assignmentType = ruleModel.ruleGroupData.GroupAssignmentType;
    var headerString = ruleModel.ruleGroupData.HeaderDisplayString;
    var letters = /^[A-Za-z]+$/;

    var colNames = ['Id', 'Active', 'ID', 'Published', 'Name'];
    var colModel = [{ name: 'Id', index: 'Id', hidden: true },
                    { name: 'IsActive', index: 'IsActive', formatter: 'checkbox', edittype: 'checkbox', editoptions: { value: 'True:False'} },
                    { name: 'RuleCode', index: 'RuleCode', sorttype: function (cell, obj) { return sortSpecialIds(obj.RuleCode); } },
					{ name: 'Published', index: 'Published', formatter: 'checkbox' },
                    { name: 'Name', index: 'Name'}];
    
    //hack to remove publish column for queue views, mmybe should have an isPublishable defined on RuleGroupTypes?
    if (headerString == "Queue View" || headerString == "Deal Permission Rules") {
        colNames = jQuery.grep(colNames, function(value) {
            return value != 'Published';
        });
        colModel = jQuery.grep(colModel, function(value) {
            return value.name != 'Published';
        });
    }

    if (assignmentType == "AdverseAction") {
        colNames = colNames.concat(['Adverse Action Id', 'Adverse Action']);
        colModel = colModel.concat([{ name: 'AdverseActionId', index: 'AdverseActionId', hidden: true }, { name: 'AdverseActionName', index: 'AdverseActionName'}]);
    }
    else if (assignmentType == "Identifier") {
        colNames.push(headerString.replace("Selection", ""));
        colModel.push({ name: 'TrueOutcomeIdentifier', index: 'TrueOutcomeIdentifier', sorttype: function (cell, obj) { return sortSpecialIds(obj.TrueOutcomeIdentifier); } });
    } else if (assignmentType == "AutoRoute") {
        colNames.push(headerString.replace("Selection", ""));
        colModel.push({ name: 'RoleHierarchyLevelDesc', index: 'RoleHierarchyLevelDesc' });
    }
    else if(assignmentType == "Matrix") {
        colNames.push(headerString.replace("Selection", ""));
        colModel.push({ name: 'RuleMatrixIdentifier', index: 'RuleMatrixIdentifier', sorttype: function (cell, obj) { return sortSpecialIds(obj.RuleMatrixIdentifier); } });
    }
    else if (assignmentType == "OutboundSource") {
        colNames = colNames.concat(['Outbound Source Id', 'OutboundSource']);
        colModel = colModel.concat([{ name: 'OutboundDataSourceId', index: 'OutboundDataSourceId', hidden: true }, { name: 'OutboundDataSourceName', index: 'OutboundDataSourceName' }]);
    }
    colNames = colNames.concat(['Rule Definition', 'AppType']);
    colModel = colModel.concat([{ name: 'RuleDefinition', index: 'RuleDefinition' }, { name: 'AppType', index: 'AppType', hidden: true}]);
    jQuery("#rulesGrid").jqGrid({ 
        datatype: "local",
        colNames: colNames,
        colModel: colModel,
        rowNum: 50,
        rowList: [5, 10, 20, 50],
        gridview: true,
        sortname: 'id',
        shrinkToFit: true,
        width: $('#rule').parent().parent().width() - 10,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * .56,
        viewrecords: true,
        sortorder: "desc",
        ignoreCase: true,
        pager: jQuery('#rulesGrid_pager'),
        jsonReader: {
            root: function (obj) { return obj.d.rows; },
            page: function (obj) { return obj.d.records > 0 ? 1 : 0; },
            total: function (obj) { return obj.d.records / 50; },
            records: function (obj) { return obj.d.records; }
        },
        prmNames: { nd: 0 },
        ajaxGridOptions: { cache: false },
        scrollOffset: 0,
        onSelectRow: function (id) {
            onGridSelectRow(id);
        },
        loadComplete: function () {
            var width = $('#content').width() * .9;
            $("#rulesGrid").jqGrid("setGridWidth", width);
        },
    });
}

function onGridSelectRow(id) {

    if ($("#Caption").text().indexOf("Queue View") === -1) {
        $("#isPublished").parent().parent().hide();
        $('#formulaRow').hide();
    }
    var ruleGroupType = $("#RuleGroupType").val();
    editMode = true;
    selectedRowId = id;
    if (_.isUndefined(ruleGroupType)) {
        ruleGroupType = getParameterByName("ruleGroupType");
    }
    editRule(id, ruleGroupType);
    editMode = false;
    $("#rulevalueinput2id").hide();
    $("#btnSaveRule").show();
    $("#btnCancel").show();

    var headerString = ruleModel.ruleGroupData.HeaderDisplayString;
    $(".headerBorder").append(headerString);
    //set here again

    if ($("#operatorSelectid").val() == 10) {
        $("#rulevalueinput2id").show();
    }

    AddRuleValidationRules();
    oldValues = new Array();
    oldValues = GetFormValues();
    disableUnlessCanEdit();
}

function GetFormValues() {
    var oldValues = GetControlValues();
    var ruleTypeSelectVal = GetControlValuesBasedonClassName('.ruleTypeSelectVal');
    var operatorSelectVal = GetControlValuesBasedonClassName('.operatorSelect');
    var ruleValueInputVal = GetControlValuesBasedonClassName('.ruleValueInput');
    return oldValues = oldValues.concat(ruleTypeSelectVal).concat(operatorSelectVal).concat(ruleValueInputVal);
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

function save() {
    //required for config wizard
}

function showDropdownSelection() {
    $("#dropdownSelectionDiv").empty();
    $.get("/Admin/SelectionAdmin?RuleGroupTypeId=" + $("#RuleGroupType").val(), function(html) {
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
    if ($("#dropdownSelectionDiv").length == 0) return;
    
    if (success) {
        $("#dropdownSelectionDiv").empty();
        $("#dropdownSelectionDiv").hide();
        $("#dropdownSelectionButtonDiv").hide();

        var ruleGroupType = $("#RuleGroupType").val();
        
        if (typeof RuleMatrixController != 'undefined') new RuleMatrixController().getMatrixMetadata(ruleGroupType);
        var getRuleTypeData = RuleService.getRuleTypeData(ruleModel, ruleGroupType);
        $.when(getRuleTypeData).done(function () {
            if (ruleModel.selectedRule.Id == 0) {
                var rule = getRuleToSave();
                rule.FormatForDataElementGroupId = 0;
                rule.ForceNoteDataElementGroupId = 0;
                $.noty.closeAll();
                createRule(ruleGroupType, rule);
            } else {
                $.noty.closeAll();
                onGridSelectRow(ruleModel.selectedRule.RowId);
            }
        });
    }else {
        alert("There was an error adding elements. Please try again");
    }
}

function saveRuleClick() {
    $('#btnSaveRule').prop('disabled', true);
    if (parseInt($("#rulevalueinputid").val()) > parseInt($("#rulevalueinput2id").val())) {
        alert("Value 2 needs to be greater than Value 1.");
        $('#btnSaveRule').prop('disabled', false);
        return;
    }
    
    var valid = $('.noty_bar').find('form').valid();
    if (!valid) {
        alert("Please enter valid data and try again.");
        $('#btnSaveRule').prop('disabled', false);
        return;
    };

    if($("#isFormulaType").is(":checked")) {
        if (!ruleModel.formulaModel.hasValidVariableNames()) {
            alert("Please enter variable names that are used in formula");
            $('#btnSaveRule').prop('disabled', false);
            return;
        }

        if (!ruleModel.formulaModel.hasValidVariableValues()) {
            alert("Please enter value or populate from db, and enter test value for all variables");
            $('#btnSaveRule').prop('disabled', false);
            return;
        }
    }

    var ruleToSave = getRuleToSave();
    
    var ruleGroupId = $("#RuleGroupType").val();
    if (_.isUndefined(ruleGroupId)) {
        ruleGroupId = getParameterByName("ruleGroupType");
    }
    
    RuleService.SetSelectedIds();
    RuleService.saveRule(ruleToSave, ruleGroupId);
}

function cancelClick() {
    var newValues = GetFormValues();
    var compareValues = CompareArrays(newValues, oldValues);
    if (!compareValues) {
        if (confirm("Clicking ok will cancel your changes!")) {
            $("#createRulesDiv").empty();
            $("#btnSaveRule").hide();
            $("#btnCancel").hide();
            $.noty.closeAll();
        }
    }
    else {
        $("#createRulesDiv").empty();
        $("#btnSaveRule").hide();
        $("#btnCancel").hide();
        $.noty.closeAll();
    }
}

function ruleTypeSelectChange() {
    $('#ruleTypeSelectid').trigger('change');
}

function ruleOperatorSelectChange(dropdown) {
    var siblings = $(dropdown).parent().siblings("div");
    
    if ($(dropdown).val() == "-1") {
        // remove any divs that are below me (have a higher data-index)
        $.each(siblings, function(i, sibling) {
            if ($(sibling).data("index") > $(dropdown).parent().data("index")) {
                $(sibling).remove();
            }
        });
    } else {
        // if divs already exist below me (have a higher data-index), don't add another new row
        var needNewRow = true;
        $.each(siblings, function (i, sibling) {
            if ($(sibling).data("index") > $(dropdown).parent().data("index")) {
                needNewRow = false;
            }
        });
        if (!needNewRow) return;
        
        var element = { Id: "", RuleTypeId: "", OperatorId: "", Value1: "", Value2: "" };
        var countOfDivs = $("#mainRuleElement").find("#ruleElementsDiv").length;
        var model = { ruleTypeSelectList: ruleModel.ruleTypes, ruleOperatorSelectList: ruleModel.ruleOperators, element: element, p: countOfDivs };
        $("#ruleElementTemplate").tmpl(model).insertAfter("#mainRuleElement div:last-child");
        var ruleElements = $("#mainRuleElement").find("#ruleElementsDiv");
        if(ruleElements.length > 1) {
            var firstValue = $(ruleElements[0]).find(".ruleOperatorSelect").val();
            var otherValue = (firstValue == 8) ? 9 : 8;
            $(ruleElements[ruleElements.length - 1]).find(".ruleOperatorSelect option[value='" + otherValue + "']").remove();
        }
        AddRuleValidationRules();    
    }
}

function AddRuleValidationRules() {

    $.validator.addMethod('selectNone',
          function (value, element) {
              return this.optional(element) ||
                (value != -1);
          }, "Please select an option");

    $.validator.addMethod('isRuleValid',
          function (value, element) {
              for (var i = 0; i < ruleModel.ruleTypes.length; i++) {
                  if (ruleModel.ruleTypes[i].Id == $("#ruleTypeSelectid").val()) {
                      for (var j = 0; j < ruleModel.dataTypes.length; j++) {
                          if (ruleModel.dataTypes[j].Id == ruleModel.ruleTypes[i].DataTypeId) {
                              if (ruleModel.dataTypes[j].Name == "Integer") {
                                  //return !isNaN(parseFloat(value)) && isFinite(value);
                                  return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:[\s\.,]\d{3})+)(?:[\.,]\d+)?$/.test(value);
                              }
                              else if (ruleModel.dataTypes[j].Name == "String") {
                                  return this.optional(element) || /^[a-zA-Z]+/.test(value);
                              }
                          }
                      }
                  }
              }
              return true;
          }, "Rule is not valid");


    $.validator.addMethod('isGreater',
          function (value, element) {
              return this.optional(element) ||
                (value != -1);
          }, "Please select an option");

    $.validator.addMethod('FieldRule',
          function (value, element) {
              var selectedData = _.filter(ruleModel.ruleTypes, function (i) { return i.Name == $(element).parent().parent().find("#ruleTypeSelectid option:selected").text(); });
              var selectedDataType = selectedData[0].DataTypeId;
              if (selectedDataType == 5) {
                  value = value.trim();
              }
              if (selectedData[0].FieldLength > 0) {
                  if (value.length > selectedData[0].FieldLength) {
                      element.value = value.replace(/.$/g, '');
                  }
              }

              if (selectedData[0].RegEx == null) {
                  return true;
              }
              var regEx = new RegExp(selectedData[0].RegEx.replace(' ', ''));
              return regEx.test(value);
          }, "Please select an option");

    $('.noty_bar').find('form').validate({

        errorPlacement: function (error, element) {
            return true;
        },

        onfocusout: function (element) {
            $(element).valid();
        },

        rules: {
            ruleName: { required: true, maxlength: 300 },
            ruleDescription: { maxlength: 1000 },
            adverseActionSelect: { required: true, selectNone: true },
            outcomeElement: { selectNone: true },
            toleranceTextId: { required: true },
            toleranceTextIdDp: { required: true },
            toleranceTextIdEI: { required: true },
            housingPaymentPercent: { required: true },
            housingPaymentValue: { required: true },
            percentOfBalance: { required: true },
            tradelineAmountValue: { required: true },
            eConValidationMessage: { required: true },
            bureauRuleChoice: { required: true },
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

    $(".ruleTypeSelect").each(function () {
        $(this).rules("add", { required: true, selectNone: true });
    });
    
    $(".operatorSelect").each(function () {
        $(this).rules("add", { required: true, selectNone: true });
    });

    $(".rulevalueinputid").each(function () {
        $(this).rules("add", { required: true, FieldRule: true });
    });

    $(".rulevalueinput2id").each(function () {
        $(this).rules("add", { required: true, number: true, isGreater: true });
    });

    $(".rulevalueSelect1").each(function () {
        $(this).rules("add", { required: true, selectNone: true });
    });

    $('#outcomeElement').each(function () {
        $(this).rules("add", { required: function (element) {
            return $("#isRuleActive").is(":checked");
        }
        });
    });
}


$("#to2").live("click", function (event) {
    assignList();
});

$("#to1").live("click", function (event) {
    unassignList();
});



function assignList() {
    $('#availableColumns :selected').each(function (i, selected) {
        $('#selectedColumns').append('<option value="' + selected.value + '">' + selected.text + '</option>');
        $("#availableColumns option[value='" + selected.value + "']").remove();
    });


    SelectedIds = _.map($('#selectedColumns option'), function (o) {
        return o.value;
    });

}

function unassignList() {
    $('#selectedColumns :selected').each(function (i, selected) {
        $('#availableColumns').append('<option value="' + selected.value + '">' + selected.text + '</option>');
        $("#selectedColumns option[value='" + selected.value + "']").remove();
    });

    SelectedIds = _.map($('#selectedColumns option'), function (o) {
        return o.value;
    });
}

//formula stuff
function FormulaModel(formulaData) {

    var self = this;
    this.Id = null;
    this.Name = null;
    this.FormulaText = null;
    this.Variables = ko.observableArray();

    var mapping = {
        'Variables': {
            key: function(data) {
                return ko.utils.unwrapObservable(data.id);
            },
            create: function(data) {
                return new VariableModel(data);
            }
        }
    };

    this.hasValidVariableNames = function() {
        var invalidOnes = _.filter(self.Variables(), function (v) { return !v.hasValidName(); });
        return invalidOnes.length == 0;
    };
    
    this.hasValidVariableValues = function() {
        var invalidOnes = _.filter(self.Variables(), function (v) { return !v.hasValidValue(); });
        return invalidOnes.length == 0;
    };

    this.canValidate = function () {
        var noTestValues = _.filter(self.Variables(), function (v) { return !v.hasTestValue(); });
        return noTestValues.length == 0 && self.FormulaText != "";
    };

    this.addVariable = function () {
        var data = { data: defaultVariable() };
        self.Variables.push(new VariableModel(data));
    };

    ko.mapping.fromJS(formulaData, mapping, this);
}

function defaultVariable() {
    return { Id: "", RuleTypeId: "", EntryTypeId: "1", Name: "", IsActive: "", EntryType: "", StaticValue: "", TestValue: "" };
}

function VariableModel(variableData) {

    var self = this;
    this.Id = null;
    this.Name = null;
    this.DataTypeId = null;
    this.StaticValue = null;
    this.EntryTypeId = null;
    this.RuleTypeId = null;
    this.TestValue = null;

    ko.mapping.fromJS(variableData.data, {}, this);

    this.hasTestValue = function () {
        return self.TestValue() != "";
    };

    this.hasValidValue = function () {
        if (self.EntryTypeId() == 1) {
            return self.StaticValue() != "" && self.TestValue() != "";
        } else {
            return self.RuleTypeId() != undefined && self.TestValue() != "";
        }
    };
    
    this.hasValidName = function() {
        return ruleModel.formulaModel.FormulaText().indexOf(self.Name()) > -1;
    };

    this.changeOfEntryType = function () {

        if (this.EntryTypeId() == 1) {
            self.RuleTypeId(undefined);
        } else {
            self.StaticValue("");
        }
    };

    this.remove = function () {
        if (ruleModel.formulaModel.Variables().length == 1) {
            ruleModel.formulaModel.addVariable();
        }
        ruleModel.formulaModel.Variables.remove(self);
    };
}

function showHelp() {
    window.open("/formulahelp.htm");
}

function validateFormula() {

    if (!ruleModel.formulaModel.canValidate()) {
        alert("Please enter formula text and test value for variables to validate formula");
        return;
    }
    var postData = $.parseJSON(ko.mapping.toJSON(ruleModel.formulaModel));
    
    $.ajax({
        type: 'POST',
        url: '/admin/rule/validate',
        contentType: 'application/json; charset=utf-8',
        cache: false,
        data: JSON.stringify({ RuleModel: { RuleData : { FormulaText: postData.FormulaText, FormulaElements: postData.Variables } } }),
        success: function (response) {
            if (response.success) {
                alert("Formula result: " + response.result);
            }
            else {
                alert("Validation error: " + response.error);
            }
        },
        error: function (xmlHttpRequest, textStatus, errorThrown) {
            alert("Error occurred validation formula");
        },
        async: true
    });
    
}
