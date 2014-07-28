$(document).ready(function () {
                        
            
            $("#saveButton").mouseover(function (event) {
                $(this).attr("src", "images/button_save_highlighted.png");
            });

            $("#saveButton").mouseout(function (event) {
                $(this).attr("src", "images/button_save.png");
            });
            
            $("#cancelButton").mouseover(function (event) {
                $(this).attr("src", "images/button_cancel_highlighted.png");
            });

            $("#cancelButton").mouseout(function (event) {
                $(this).attr("src", "images/button_cancel.png");
            });
            
                
        });
