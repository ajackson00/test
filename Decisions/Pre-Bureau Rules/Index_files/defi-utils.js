if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };

function notyInfo(message, timeout) {
    return notyAlert(message, 'information', timeout);
}

function notySuccess(message, timeout) {
    var text = "<table width=\"100%\"><tr><td><div><h3>" + message + "</h3></div></td></tr></table>";
    return noty({ "text": text, "layout": "center", "type": "success", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": timeout, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
}

function notyAlert(message, type, timeout) {
    var text = "<table width=\"100%\"><tr><td><div><h3>" + message + "</h3></div></td></tr></table>";
    return noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": false, "closeOnSelfClick": false, "closeOnSelfOver": false, "modal": true });
}

function notyInfo(innerContent) {
    var text = "<table width=\"100%\"></td><td><div>" + innerContent + "</div></td></tr></table>";
    return noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": false, "closeOnSelfOver": false, "modal": true });
}

function notyModal(message) {
    var text = "<table width=\"100%\"><tr><td><div><h3>" + message + "</h3></div></td></tr></table>";
    return noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "animateClose": { "height": "toggle" }, "speed": 200, "timeout": false, "closeButton": true, "closeOnSelfClick": true, "closeOnSelfOver": true, "modal": true });
}

function notyConfirm(html, confirmCallback, argument) {
    if (argument === undefined) argument = '';
    var text = "<table width=\"100%\"><tr><td><div><h3>" + html + "</h3></div></td></tr></table>";
    text += "<table width=\"100%\"><tr><td>";
    text += "<div class=\"controls\" \id=\"buttons\"><input type=\"button\" class=\"btn pull-right\" value=\"Confirm\" onclick=\"" + confirmCallback + "('" + argument + "');\" id=\"btnConfirm\"/> <input type=\"button\" class=\"btn pull-left\" value=\"Cancel\" onclick=\"closeNoty();\" id=\"btnCancel\"/></div>";
    text += "</td></tr></table>";
    noty({ "text": text, "layout": "center", "type": "alert", "animateOpen": { "height": "toggle" }, "speed": 0, "timeout": false, "closeButton": false, "closeOnSelfClick": false, "closeOnSelfOver": false, "modal": true });
}

function closeNoty() {
    $.noty.closeAll();
}

function sortSpecialIds(obj) {
    //handle id's like EFR00562 not sorting by grabbing only the numerical part and sorting on that
    if (!_.isNull(obj) && !_.isUndefined(obj)) {
        var result = parseInt(obj.replace(/\D/g, ''));
        if (_.isNaN(result)) {
            return 0;
        }
        return result;
    } else {
        return 0;
    }
}

var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

CommentService = new function () {
    var self = this;
    self.inputSelector = '#longDescription';
    self.statusSelector = '#messageDiv';
    self.maxCommentLength = 2000;

    function validateCommentLength(isPastedText) {
        var text = $(self.inputSelector).val();
        var newLines = text.match(/\n/g) || [];
        var textLength = text.length + newLines.length;
        var charsRemaining = parseInt(self.maxCommentLength - textLength);
        if (charsRemaining <= 0) {
            charsRemaining = 0;
            $(self.inputSelector).val((text).substring(0, self.maxCommentLength - newLines.length));

            if (isPastedText) alert("Maximum characters allowed is " + self.maxCommentLength + ".");
        }
        printCharsCount(charsRemaining);
    };

    function printCharsCount(charsRemaining) {
        $(self.statusSelector).html('<font color="black">Number of characters left: </font>' + charsRemaining);
    }

    self.initComments = function (inputSelector, statusSelector, maxCommentLength) {
        self.inputSelector = inputSelector;
        self.statusSelector = statusSelector;
        self.maxCommentLength = _.isUndefined(maxCommentLength) ? 2000 : maxCommentLength;

        $(self.inputSelector).bind('paste', function(e) {
            setTimeout(function() {
                validateCommentLength(true);
            }, 100);
        });

        $(self.inputSelector).keyup(function(e) {
            validateCommentLength();
        });

        printCharsCount(self.maxCommentLength);
    };
};

$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    if (options.type.toUpperCase() == "POST") {
        var verificationToken = $("meta[name='__AjaxRequestVerificationToken']").attr('content');
        if (verificationToken) {
            jqXHR.setRequestHeader("X-Request-Verification-Token", verificationToken);
        }
    }
});

// Hack for jquery upgrade
function forceDialogModalToTop() {
    $(".ui-widget-overlay").css("z-index", "1000");
    $(".ui-dialog").css("z-index", "1001");
}

//adding try/catch because if the grid is missing no need to look for it
try {
    $.jgrid.extend({
        getColumnIndexByName: function (columnName) {
            if (!this.jqGrid) return -1;
            var cm = this.jqGrid('getGridParam', 'colModel'), i, l;
            for (i = 1, l = cm.length; i < l; i += 1) {
                if (cm[i].name === columnName) {
                    return i; // return the index
                }
            }
            return -1;
        }
    });
} catch (e) {
    console.log("jqGrid not found", e);
}