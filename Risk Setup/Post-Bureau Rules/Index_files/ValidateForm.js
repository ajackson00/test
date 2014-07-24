AlertMessages = function () {
    this.CommonMessage = " is required.";
    this.Invalid = " is not valid.";
    this.Name = "Name";
    this.Description = "Description";
    this.Filename = "Filename";
    this.Zip_Code_Low = "ZipCode Low";
    this.Zip_Code_High = "ZipCode High";
    this.Unique = " needs to be unique.";
    this.First_Choice = "First Choice";
    this.Second_Choice = "Second Choice";
    this.Third_Choice = "Third Choice";
    this.UserName = "User Name";
    this.Password = "Password";
    this.Identifier1 = "Identifier 1";
    this.Identifier2 = "Identifier 2";
    this.AdverseAction = "Adverse Action";
    this.AssignTo = "Assign To section";
    this.Condition_Met_Value = "Condition Met Value";
    this.Condition_Not_Met_Value = "Condition Not Met Value";
    this.Condition = "Condition";
    this.Credit_Policy_Type = "Credit Policy Type";
    this.X_Axis = "X Axis";
    this.Y_Axis = "Y Axis";
    this.Lender_Code = "Lender Code";
    this.Notes = "Notes";
    this.City = "City";
    this.State = "State";
    this.Zip = "Zip";
    this.Email = "Email";
}

$.validator.addMethod("vin", 
    function (value, element) {

        if ($.trim(value) == "")
            return true;
        
        var alphaPool = ["", "a", "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        var alphaValue = ["", 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 7, 9, 2, 3, 4, 5, 6, 7, 8, 9];
        var digitWeight = ["", 8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
        var finalWeight = new Array();
        var VIN = $(element).val().toLowerCase();

        if (/^[a-zA-Z0-9]{17}$/.test(VIN)) {
            var aryVinDigit = new Array();
            for (var i = 1; i <= 17; i++) { 
                aryVinDigit[i] = VIN.substring(i - 1, i);
            }
            var aryVinValue = new Array();
            for (var i = 1; i <= 17; i++) { 
                if (isNaN(aryVinDigit[i])) {
                    var goodAlpha = false;
                    for (var x = 1; x <= 23; x++) {
                        if (aryVinDigit[i] == alphaPool[x]) {
                            aryVinValue[i] = alphaValue[x]; 
                            x = 24; 
                            goodAlpha = true;
                        }
                    }
                    if (!goodAlpha) {
                        return false;
                    }
                } else {
                    aryVinValue[i] = aryVinDigit[i];
                }
            }
            var totalWeight = 0;
            for (var i = 1; i <= 8; i++) {
                finalWeight[i] = aryVinValue[i] * digitWeight[i]; 
                finalWeight[i + 8] = aryVinValue[i + 9] * digitWeight[i + 9];
                totalWeight = totalWeight + finalWeight[i] + finalWeight[i + 8];
            }
            var checkDigit = totalWeight % 11;
            if (checkDigit == 10) {
                checkDigit = "x";
            }

            if (checkDigit != aryVinDigit[9])
                return false;

            return true;
        } else
            return false;
    }, "Please enter a valid VIN");