$(document).ready(function () {
            
            $(".left_menu_item").mouseover(function (event) {
                $(this).removeClass("left_menu_item").addClass("left_menu_item_hover").end();
            });

            $(".left_menu_item").mouseout(function (event) {
                $(this).removeClass("left_menu_item_hover").addClass("left_menu_item").end();
            });
            
            $(".left_menu_item").click(function (event) {
                
                $(this).removeClass("left_menu_item_hover").addClass("left_menu_item_selected").end();
                $(".left_menu_item").removeClass("left_menu_item_selected").addClass("left_menu_item").end();
            });
            
                
        });
