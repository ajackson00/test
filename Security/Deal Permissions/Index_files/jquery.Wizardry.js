function Step(currentIndex, element, config, wizard, container, settings, isComplete, name, description) {
    var self = this;
    self.childrenCount = 0;
    self.currentChildIndex = 0;
    self.Index = currentIndex;
    self.IsComplete = (isComplete === true);
    self.name = config.name;
    self.description = config.description;

    self.complete = function () {
        if ($.isFunction(config.beforeComplete)) {
            if (!config.beforeComplete.call(self, $(steps))) {
                return false;
            }
        } else if ($.isFunction($.fn.Wizardry.settings.beforeComplete)) {
            if (!$.fn.Wizardry.settings.beforeComplete.call(self, $(steps))) {
                return false;
            }
        }

        self.markAsDone();
        return false;
    };

    self.next = function () {
        if (settings.indexCurrent == steps.length - 1) return false;

        if ($.isFunction(config.beforeNext)) {
            if (!config.beforeNext.call(self, $(steps))) {
                return false;
            }
        } else if ($.isFunction($.fn.Wizardry.settings.beforeNext)) {
            if (!$.fn.Wizardry.settings.beforeNext.call(self, $(steps))) {
                return false;
            }
        }

        if (!self.IsComplete) {
            return false;
        }

        if (self.currentChildIndex >= self.childrenCount - 1) {
            currentStep = steps[settings.indexCurrent + 1];
            self.currentChildIndex = 0;
            settings.indexCurrent = settings.indexCurrent + 1;
            currentStep.load(settings.indexCurrent, settings.indexCurrent - 1, self.currentChildIndex);
            return false;
        } else {
            self.currentChildIndex += 1;
            if (config.manageChildren) {
                return false;
            }

            self.load(settings.indexCurrent, settings.indexCurrent, self.currentChildIndex);
            return false;
        }
    };

    self.previous = function () {
        if (settings.indexCurrent == 0) return false;

        if ($.isFunction(config.beforePrevious)) {
            if (!config.beforePrevious.call(self, $(steps))) {
                return false;
            }
        } else if ($.isFunction($.fn.Wizardry.settings.beforePrevious)) {
            if (!$.fn.Wizardry.settings.beforePrevious.call(self, $(steps))) {
                return false;
            }
        }

        if (self.currentChildIndex == 0) {
            currentStep = steps[settings.indexCurrent - 1];
            if (currentStep.childrenCount > 0) {

                self.currentChildIndex = currentStep.childrenCount - 1;
            }
            settings.indexCurrent = settings.indexCurrent - 1;
            currentStep.load(settings.indexCurrent, settings.indexCurrent + 1, self.currentChildIndex);
            return false;
        } else {
            self.currentChildIndex -= 1;
            if (config.manageChildren) {
                return false;
            }
            self.load(settings.indexCurrent, settings.indexCurrent, self.currentChildIndex);
            return false;
        }
    };

    self.setChildrenStepCount = function (childCount) {
        self.childrenCount = childCount;
    };

    self.unloadActive = function (hashToShow, stepItemArray, wizard) {
        $(stepItemArray).each(function () {
            var hash = $(this, wizard).attr("href");
            if (hashToShow != hash) {
                $(hash, wizard).html("");
            }
        });
    };

    self.load = function (index, curIndex, childStep) {

        settings.indexCurrent = self.Index;
        $.ajax({
            url: config.contentUrl,
            async: false,
            type: "POST",
            data: ({ step_number: settings.indexCurrent + 1, child_step: childStep }),
            dataType: "text",
            beforeSend: function () { },
            error: function () { container.unblock(); },
            success: function (res) {
                if (res && res.length > 0) {

                    var current = stepItems.eq(curIndex);
                    var selected = stepItems.eq(index);

                    if (settings.width != 0) {
                        container.width(settings.width);
                    }

                    $($(current, wizard).attr("href"), wizard).fadeOut("fast", function (e) {
                        $($(current, wizard).attr("href"), wizard).html("");
                        $(config.id, wizard).html(res);
                        $(config.id, wizard).show();

                        $($(selected, wizard).attr("href"), wizard).fadeIn("fast");

                        self.selectNextStep(selected, stepItems, wizard);
                        self.unloadActive(config.id, stepItems, wizard);
                        container.unblock();
                    });

                    $("input[type=checkbox].isComplete").prop('checked', self.IsComplete).prop('disabled', self.IsComplete);

                    if (0 >= settings.indexCurrent) {
                        $("#btnPrevious").addClass("buttonDisabled");
                    } else {
                        $("#btnPrevious").removeClass("buttonDisabled");
                    }
                    if ((steps.length - 1) <= settings.indexCurrent || !self.IsComplete) {
                        $("#btnNext").addClass("buttonDisabled");
                    } else {
                        $("#btnNext").removeClass("buttonDisabled");
                    }

                    if ($.isFunction(settings.afterLoad)) {
                        settings.afterLoad.call(this, currentStep);
                    }
                }
            }
        });
    };

    self.markAsDone = function () {
        var currentSelector = stepItems.eq(self.Index);
        $(currentSelector, wizard).addClass("selected-done");
        self.IsComplete = true;
        if ((steps.length - 1) > settings.indexCurrent)
            $("#btnNext").removeClass("buttonDisabled");
    };

    self.selectNextStep = function (nextSelector, stepItemsArray, wizard) {
        $(nextSelector, wizard).removeClass("disabled");
        $(nextSelector, wizard).addClass("selected");
        if ($(nextSelector, wizard).hasClass("done")) {
            $(nextSelector, wizard).addClass("selected-done");
            $(nextSelector, wizard).removeClass("done");
        }
        $(nextSelector, wizard).attr("isSelectable", 1);

        var selectedHash = $(nextSelector, wizard).attr("href");

        $(stepItemsArray).each(function () {
            console.log($(this, wizard));
            var currentSelector = this;
            var iteratorHash = $(this, wizard).attr("href");
            if (iteratorHash != selectedHash) {
                if ($(currentSelector, wizard).hasClass("selected-done")) {
                    $(currentSelector, wizard).removeClass("selected-done");
                    $(currentSelector, wizard).addClass("done");
                    $(currentSelector, wizard).attr("isSelectable", 1);
                }
                $(currentSelector, wizard).removeClass("selected");
            }
        });
    };
}

(function ($) {
    steps = [];

    $.fn.Wizardry = function (method) {
        var args = arguments;

        return this.each(function () {

            var settings = $.extend({}, $.fn.Wizardry.settings, method);
            var wizard = $(this);
            if (settings.stepsUrl != null) {
                fetchAndBuild(settings.stepsUrl, wizard);
            }

            stepItems = $("ul > li > a", wizard);
            var allDivs = wizard.children('div');
            var elmStepContainer = $('<div style="height:100%"></div>').addClass("stepContainer").addClass("grid_9 omega");
            if (method == 'setChildrenStepCount') {
                var ar = Array.prototype.slice.call(args, 1);
                steps[ar[0].parent].setChildrenStepCount(ar[0].children);
                return true;
            }
            else if (!method || method == 'init' || typeof method == 'object') {
                return init();
            }
            else {
                alert('Method ' + method + ' does not exist on Wizardry');
            }

            function fetchAndBuild(url) {
                $.ajax({
                    async: false,
                    url: url,
                    type: "GET",
                    dataType: "JSON",
                    success: function (res) {
                        if (res && res.length > 0) {

                            var ul = "<ul>";
                            var divs = "";


                            for (i = 0; i < res.length; i++) {
                                var doneMarker = res[i].IsComplete === true ? " class='done'>" : ">";
                                ul += "<li>";
                                ul += "<a href='" + res[i].id + "' style='width:250px;'" + doneMarker;
                                ul += "<label class='stepNumber'>";
                                ul += i + 1;
                                ul += "</label>";
                                ul += "<span class='stepDesc'>";
                                ul += res[i].DisplayText;
                                ul += "</span></a></li>";

                                divs += "<div id='" + res[i].divid + "' data-itemid='" + res[i].divItemId + "' class='itemId'></div>";

                                if (res[i].isCurrentStep === true) {
                                    settings.indexCurrent = i;
                                }

                                settings.steps.push(res[i]);
                            }

                            ul += "</ul>";

                            var toc = $(ul);
                            var body = $(divs);

                            wizard.append(toc);
                            wizard.append(body);
                        }

                        return true;
                    }
                });
            }

            function init() {

                wizard.children('ul').addClass("anchor");
                $('.swMini ul.anchor li a').addClass("grid_3 omega ui-corner-all");
                allDivs.addClass("grid_9 omega");

                // Create Elements
                var elmActionBar = $("<div></div><br/><br/>").addClass("actionBar");
                var completeCheckbox = $('<input id="cbxComplete" type="checkbox" class="isComplete wizard_cbx" /><span class="wizard_cbx_label">' + settings.completeText + '</span>');
                var nextButton = $('<a id="btnNext">' + settings.nextText + '</a>').attr("href", "#").addClass("buttonNext");
                var previousButton = $('<a id="btnPrevious">' + settings.previousText + '</a>').attr("href", "#").addClass("buttonPrevious");
                var finishButton = $('<a id="btnFinish">' + settings.finishText + '</a>').attr("href", "#").addClass("buttonFinish");

                elmStepContainer.append(allDivs);
                wizard.append(elmStepContainer);
                wizard.prepend(elmActionBar);
                elmActionBar.append(finishButton).append(nextButton).append(previousButton).append(completeCheckbox);
                var locked = false;

                $("input[type=checkbox].isComplete").change(function () {
                    var isChecked = $(this).is(':checked');
                    if (!locked) {
                        locked = true;
                        complete(this, isChecked);
                        locked = false;
                    }
                    $(this).prop('disabled', isChecked);
                    return false;
                });

                // This code sort of fixes the wizard problem
                //$("[href = #step-88]").click(function () {
                //    next();
                //    next();
                //});

                $("#btnNext").click(function () {
                    if (!locked) {
                        locked = true;
                        next();
                        locked = false;
                    }
                    return false;
                });

                $("#btnPrevious").click(function () {
                    if (!locked) {
                        locked = true;
                        previous();
                        locked = false;
                    }
                    return false;
                });

                $("#btnFinish").click(function () {
                    finish();
                    return false;
                });

                $(stepItems).bind("click", function (e) {
                    if (stepItems.index(this) == currentStep.Index) {
                        return false;
                    }
                    var nextStepIdx = stepItems.index(this);
                    var isSelectable = stepItems.eq(nextStepIdx).attr("isSelectable") - 0;
                    if (isSelectable == 1) {
                        elmStepContainer.block({ message: loader });
                        currentStep = steps[nextStepIdx];
                        currentStep.load(nextStepIdx, currentStep.Index);
                    }
                    return false;
                });

                if (settings.enableAllSteps) {
                    $(stepItems, wizard).removeClass("selected").removeClass("disabled");
                    $(stepItems, wizard).attr("isSelectable", 1);
                } else {
                    $.each($(stepItems, wizard), function () {
                        if ($(this).hasClass('done')) {
                            $(this).attr("isSelectable", 1);
                        } else {
                            $(this).attr("isSelectable", 0);
                            $(this).removeClass("selected").addClass("disabled");
                        }
                    });
                }

                $(stepItems, wizard).each(function (i) {
                    $($(this).attr("href"), wizard).hide();
                    $(this).attr("rel", i + 1);
                });

                var loader = $('<h3><img src="/images/loader.gif" /> Please Wait...</h3>');

                $.each(stepItems, function (index, value) {
                    steps.push(new Step(index, stepItems.eq(index), settings.steps[index], wizard, elmStepContainer, settings, $(value).hasClass('done')));
                });

                currentStep = steps[settings.indexCurrent];

                currentStep.load(settings.indexCurrent, settings.indexCurrent);
            }

            function complete(input, isChecked) {
                if ($.isFunction(settings.beforeComplete)) {
                    if (!settings.beforeComplete.call(this, input, isChecked)) {
                        return false;
                    }
                }

                currentStep.complete();
                return false;
            }

            function next() {
                if ($('#btnNext').hasClass('buttonDisabled')) {
                    return false;
                }
                if ($.isFunction(settings.beforeNext)) {
                    if (!settings.beforeNext.call(this)) {
                        return false;
                    }
                }

                currentStep.next();
                return false;
            }

            function previous() {
                if ($('#btnPrevious').hasClass('buttonDisabled')) {
                    return false;
                }
                if ($.isFunction(settings.beforePrevious)) {
                    if (!settings.beforePrevious.call(this)) {
                        return false;
                    }
                }
                currentStep.previous();
                return false;
            }

            function finish() {
                if (!$(this).hasClass('buttonDisabled')) {
                    if ($.isFunction(settings.onFinish)) {
                        if (!settings.onFinish.call(this, $(steps))) {
                            return false;
                        }
                    } else {
                        var frm = wizard.parents('form');
                        if (frm && frm.length) {
                            frm.submit();
                        }
                    }
                }
                return false;
            }
        });
    };

    $.fn.Wizardry.settings =
    {
        selected: 0,
        completeText: 'Complete',
        nextText: 'Next',
        previousText: 'Previous',
        finishText: 'Finish',
        beforeComplete: null,
        beforeNext: null,
        beforePrevious: null,
        onFinish: null,
        transition: 'fadeIn',
        contentUrl: null,
        steps: [],
        container: null,
        stepsUrl: null,
        height: 0,
        width: 0,
        enableAllSteps: false,
        indexCurrent: 0
    };
})(jQuery);