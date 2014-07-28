var Dropdownstates;
var DropdownGroups;
function GetDropdownValues(FieldName, dropdownId) {
    
    var listItems;
    switch (FieldName) {
       
        case 'Address Country':
            listItems = "<option value='USA'>USA</option><option value='CA'>CA</option>";
            break;
        case 'Income Frequency':
            listItems = "<option value='Weekly'>Weekly</option><option value='BiWeekly'>BiWeekly</option><option value='Monthly'>Monthly</option><option value='Annually'>Annually</option><option value='SemiMonthly'>SemiMonthly</option>";
            break;
        case 'Address Type':
            listItems = "<option value='CURRENT'>Current</option><option value='PREVIOUS'>Previous</option>";
            break;
        case 'App Type':
            listItems = "<option value='None'>None</option><option value='Individual'>Individual</option><option value='Joint'>Joint</option>";
            break;
        case 'Branch':
            _.each(DropdownBranches, function (col) {
                listItems = listItems + "<option value ='" + col.Id + "'>" + col.Name.trim() + "</option>";
            });
            break;
        case 'Employer TypeCd':
        case 'Employer2 TypeCd':
            listItems = "<option value='CURRENT'>Current</option><option value='PREVIOUS'>Previous</option>";
            break;

        case 'Address HouseType':
            listItems = "<option value='RENT'>RENT</option><option value='OWN'>OWN</option><option value='FAMILY'>FAMILY</option><option value='OTHER'>OTHER</option>";
            break;
        case 'RelationshipType':
            listItems = "<option value='SPOUSE'>Spouse</option><option value='RELATIVE'>Relative</option><option value='OTHER'>Other</option>";
            break;
        case 'Address Street Type':
            listItems = "<option value='AVE'>Ave</option><option value='BLVD'>Blvd</option><option value='CIR'>Cir</option><option value='DR'>Dr</option> <option value='FW'>Fw</option><option value='LN'>Ln</option><option value='PZ'>Pz</option><option value='ST'>St</option> <option value='TR'>Tr</option><option value='RD'>Rd</option><option value='WAY'>Way</option><option value='PL'>Pl</option>";
            break;

        case 'Address Street Type Desc':
            listItems = "<option value='AVENUE'>Avenue</option><option value='BOULEVARD'>Boulevard</option><option value='CIRCLE'>Circle</option><option value='DRIVE'>Drive</option> <option value='FREEWAY'>Freeway</option><option value='LANE'>Lane</option><option value='PLAZA'>Plaza</option><option value='STREET'>Street</option> <option value='TRAIL'>Trail</option><option value='ROAD'>Road</option><option value='WAY'>Way</option><option value='PLACE'>Place</option>";
            break;

        case 'Employment Status':
        case 'Employment2 Status':
            listItems = "<option value='EMPLOYED'>Employed</option><option value='SELF - EMPLOYED'>Self - Employed</option><option value='STUDENT'>Student</option><option value='MILITARY'>Military</option> <option value='RETIRED'>Retired</option><option value='UNEMPLOYED'>Unemployed</option> <option value='RETIRED - MILITARY'>Retired Military</option><option value='OTHER'>Other</option>";
            break;


        case 'Miltary Status':
            listItems = "<option value='1'>Yes</option><option value='0'>No</option>";
            break;

        case 'Suffix':
            listItems = "<option value='JR'>Jr</option><option value='SR'>Sr</option><option value='I'>I</option><option value='II'>II</option><option value='III'>III</option><option value='IV'>IV</option>";
            break;

        case 'Status':
            listItems = "<option value='1'>Active</option><option value='0'>Inactive</option>";
            break;

        case 'Tier':

            var tiers = getTiers();
            for (var i = 0; i < tiers.length; i++) {
                console.log("i: ", i);
                listItems += ("<option value=" + "'"+ tiers[i].trim() +"'" + ">" + tiers[i].trim() + "</option>");
            }
            console.log("list items", listItems);
            break;

        case 'Trade Indicator':
            listItems = "<option value='1'>Yes</option><option value='0'>No</option>";
            break;

        case 'Type':
            listItems = "<option value='NEW'>New</option><option value='USED'>Used</option>";
            break;

        case 'Vehicle Type':
            listItems = "<option value='NEW'>New</option><option value='USED'>Used</option>";
            break; 

        case 'Dealer Type':
            listItems = "<option value='Franchise'>Franchise</option><option value='Independent'>Independent</option>" +
                "<option value='TreatAsFranchise'>Treat as Franchise</option>";
            break;

        case 'Existing':
            listItems = "<option value='1'>Yes</option><option value='0'>No</option>";
            break;
            
        case 'boolean':
            listItems = "<option value='1'>Yes</option><option value='0'>No</option>";
            break;

        case 'Active Bureau Source':
            listItems = "<option value='EX'>Experian</option><option value='EXS'>Experian Soft</option><option value='EQ'>Equifax</option><option value='TU'>Transunion</option>";
            break;

        case 'State':
        case 'Address State':
        case 'DL State':
            var States;
            _.each(Dropdownstates, function (col) {
                listItems = listItems + "<option value =" + col.Id + ">" + col.Name.trim() + "</option>";
            });
            break;
        case 'Address Province':
            _.each(Provinces, function (col) {
                listItems = listItems + "<option value =" + col.Id + ">" + col.Name.trim() + "</option>";
            });
            break;

        case 'Group':
            var States;
            _.each(DropdownGroups, function (col) {
                listItems = listItems + "<option value ='" + col.Name.trim() + "'>" + col.Name.trim() + "</option>";
            });
            break;
        case 'Tolerance':
            _.each(ruleModel.toleranceRuleTypes, function (col) {
                listItems = listItems + "<option value =" + col.Id + ">" + col.Name.trim() + "</option>";
            });
            break;

        case 'Source System':
            listItems = "<option value='Manual'>Manual</option><option value='DealerTrack'>DealerTrack</option><option value='RouteOne'>Route One</option>";
            break;

        case 'Business Type':
            listItems = "<option value='Corporation'>Corporation</option><option value='Llc'>Llc</option><option value='Partnership'>Partnership</option><option value='Proprietor'>Proprietor</option>";
            break;

        case 'App Status':
            console.log(statusList);
            listItems = "";
            _.each(statusList, function (i) {
                listItems = listItems + "<option value ='" + i.Id + "'>" + i.ShortDescription + "</option>";
            });
            console.log(listItems);
            break;
        case 'Dropdown':
            var matchedDd = _.find(ruleModel.dropdowns, function (d) { return d.Id == dropdownId; });
            if (matchedDd) {
                listItems = '';
                _.each(matchedDd.Data, function (i) {
                    listItems = listItems + "<option value ='" + i.Value.trim() + "'>" + i.Text + "</option>";
                });
                console.log(listItems);
            }
            break;
        case 'Year':
            var years = getVehicleYears();
            _.each(years, function (i) {
                listItems = listItems + "<option value =" + i.Id + ">" + i.Name + "</option>";
            });
            break;
    }
    return listItems;
}

function getVehicleYears() {
    
    if (ruleModel.years == null) {
        $.ajax({
            url: "/vehicleInfo/getYears",
            dataType: 'json',
            async: false,
            data: { },
            success: function(data) {
                ruleModel.years = data;
                console.log(ruleModel.years);
            }
        });
    }
    return ruleModel.years;
}

function getTiers() {
    var tierarray = new Array();
    $.ajax({
        url: "/Tier/Tiers",
        dataType: 'json',
        async: false,
        data: { },
        success: function(data) {
            console.log("jqgriddata" , data.rows[0].cell[3]);
            
            for (var i = 0; i < data.rows.length; i++) {
                if (data.rows[i].cell[1] == "True")
                    tierarray.push(data.rows[i].cell[3]);

            }
            //console.log("length" , x);
        }

    });
    console.log("tier array" , tierarray);
    return tierarray;

}