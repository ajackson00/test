$(document).ready(function () {
            $(".main_menu_item").mouseover(function (event) {
                $(this).removeClass("main_menu_item").addClass("main_menu_item_hover").end();
            });

            $(".main_menu_item").mouseout(function (event) {
                $(this).removeClass("main_menu_item_hover").addClass("main_menu_item").end();
            });
            
            $(".main_menu_item").click(function (event) {
                
                $(this).removeClass("main_menu_item_hover").addClass("main_menu_item_selected").end();
                $(".main_menu_item").removeClass("main_menu_item_selected").addClass("main_menu_item").end();
            });

        });

function DisableManualAppEntry() {
    if (!IsManualAppEntryActive) {
        $('#preview *').unbind('click');
        $(".ManualAppEntryAll").hide();
        $(".ManualApp-link").click(function (e) { return false; });
        $('#Manual_App_Entry').hide();
    }
}

if (!window.console) console = { log: function () { } };
