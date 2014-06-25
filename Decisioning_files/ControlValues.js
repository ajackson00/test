// JScript source code
function CompareArrays(arrayA, arrayB) {
    if (!(arrayA instanceof Array && arrayB instanceof Array)) { return false; }
    if (arrayA.length != arrayB.length) { return false; }

    var a = jQuery.extend(true, [], arrayA);
    var b = jQuery.extend(true, [], arrayB);
    for (var i = 0, l = a.length; i < l; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function GetControlValues() {
    return GetControlValuesBasedonClassName('.formClass');
}

function GetControlValuesBasedonClassName(className) {
    var objDictionary = new Array();

    for (i = 0; i < $(className).length; i++) {
        try {
            var element = $(className)[i];
            objDictionary[i] = GetControlValue(element);
        } catch(ex) {
            objDictionary[i] = "";
        }
        
    }
    return objDictionary;
}

function GetControlValue(element) {
    if (element.type == 'checkbox') {
        return element.checked;
    }
    else if (element.type == 'radio') {
        return $('input:radio[name=' + element.name + ']:checked').val();
    }
    else if (element.type == 'select-one') {
        return $(element).filter(':selected').val() || $(element).val();
    }
    else if (element.type == 'select-multiple') {
        var options = [];
        $.each($(element).find('option'), function() { options.push(this.value); });
        var selectedValues = $(element).filter(':selected').val() || $(element).val() || [];
        return options.concat(selectedValues).join(', ');
    }
    else if (element.type == 'textarea' || element.localName == 'input') {
        return element.value;
    }

    return element.innerHTML;
}

function FormControlState(rootElement) {
    var objDictionary = new Array();
    var inputs = $(rootElement).find("input");
    _.each(inputs, function(input, i) {
        try {
            objDictionary[i] = GetControlValue(input);
        } catch (ex) {
            objDictionary[i] = "";
        }
    });
    return objDictionary;
}