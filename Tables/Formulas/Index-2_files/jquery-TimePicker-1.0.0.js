/*!
 * jQuery Time Picker Plugin v1.0.0
 * http://github.com/pbrooks
 *
 * Copyright 2011, Page Brooks
 * Licensed under the MIT license.
 * http://github.com/pbrooks
 *
 * Date: Sun Dec 18 16:44:00 2011 -0500
 */
jQuery.fn.extend({
	timePicker: function(options) {
		
		options = {};
		
		options.formatValue = function (i) {
		    var time = moment(i.val(), "hh:mm:ss A").format("h:mm:ss A");
		    i.val(time);
		}
	
		// Utilities
		var isNumber = function(i) { return !isNaN(i - 0); }				
		var endsWith = function(str, suffix) {
			return str.indexOf(suffix, str.length - suffix.length) !== -1;
		};
		var getTimesOfDay = function() {
			var times, x;
			times = [];
			times.push("12:00:00 AM");
			times.push("12:30:00 AM");
			for (x = 1; x < 24; x++) {
			  if (x < 12) times.push("" + x + ":00:00 AM");
			  if (x < 12) times.push("" + x + ":30:00 AM");
			  if (x === 12) times.push("" + x + ":00:00 PM");
			  if (x === 12) times.push("" + x + ":30:00 PM");
			  if (x > 12) times.push("" + (x - 12) + ":00:00 PM");
			  if (x > 12) times.push("" + (x - 12) + ":30:00 PM");
			}
			return times;
		};
	
		$(document).click(function(e) {
			return $(".timePicker").hide();
		});
		
		var hideTimePickers = function(except) {
			var currentList, currentValue, listItems;
			currentList = $(except);
			currentValue = currentList.prev().val().toLowerCase();
			listItems = currentList.show().find("li");
			listItems.each(function() {
			  var li;
			  li = $(this);
			  if (li.text().toLowerCase() === currentValue) {
				li.addClass("timePicker-selected");
				return currentList.scrollTop(li.position().top - 60);
			  } else {
				return li.removeClass("timePicker-selected");
			  }
			});
			return $(".timePicker").not(except).hide();
		  };

		return this.each(function() {
			var i, newItem, pickerList, x, _i, _len, _ref;
			
			i = $(this);
			
			i.focus(function(e) {
			  return hideTimePickers(i.next());
			}).click(function(e) {
			  return e.stopPropagation();
			});
			
			i.keydown(function(e) {
				var li;
				if (e.which === 13) {

				    if ($(".timePicker").is(':visible')) {
				        
				        i.val(i.next().find("li.timePicker-selected").text());
				        i.next().hide();
				        return true;
				    }
				    else {
				        var time = moment(i.val(), "hh:mm:ss A").format("h:mm:ss A");
				        i.val(time);
				        return false;
				    }
				}	 
				else if (e.which !== 38 && e.which !== 40) {
					$(".timePicker").hide();
					return
				} else if (e.which === 40)
				{
					li = i.next().find("li.timePicker-selected").removeClass("timePicker-selected");
					if (li.next().length === 0) {
						i.next().find("li:first-child").addClass("timePicker-selected");
						i.next().scrollTop(0);
						return;
					} else {
						li.next().addClass("timePicker-selected");
					}
					
					if (li.position().top > 60 - li.height()) {
						i.next().scrollTop(i.next().scrollTop() + li.height());
						return;
					}
				} 
				else if (e.which === 38) {
					li = i.next().find("li.timePicker-selected").removeClass("timePicker-selected");
					if (li.prev().length === 0) {
						i.next().find("li:last-child").addClass("timePicker-selected");
						i.next().scrollTop(i.next().find("li:last-child").position().top);
						return;
					} else {
						li.prev().addClass("timePicker-selected");
					}
					
					if (li.position().top < 60 + li.height()) {
						i.next().scrollTop(i.next().scrollTop() - li.height());
						return;
					}
				}
			}).blur(function() {
				options.formatValue(i);
				return;
			});
			
			newItem = $("<div class=\"timePicker\"><ul></ul></div>");
			newItem.hide();
			i.after(newItem);
			pickerList = newItem.children("ul");
			_ref = getTimesOfDay();
			
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				pickerList.append("<li><p>" + _ref[_i] + "</p></li>");
			}
			
			pickerList.children("li").click(function() {
				var child = $(this);
				i.val(child.text());
				child.parent().parent().hide();
				return;
			});
			
			return;
		});
	}
});

function parseTime(timeString) {
    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(?::(\d\d))(?::(\d\d))?\s*([pP]?)/);

    if (time == null) return null;

    var m = parseInt(time[3], 10) || 0;
    var hours = parseInt(time[1], 10);

    if (time[4]) time[4] = time[4].toLowerCase();

    // 12 hour time
    if (hours == 12 && !time[4]) {
        hours = 12;
    }
    else if (hours == 12 && (time[4] == "am" || time[4] == "a")) {
        hours += 12;
    }
    else if (hours < 12 && (time[4] != "am" && time[4] != "a")) {
        hours += 12;
    }
        // 24 hour time
    else if (hours > 24 && hours.toString().length >= 3) {
        if (hours.toString().length == 3) {
            m = parseInt(hours.toString().substring(1, 3), 10);
            hours = parseInt(hours.toString().charAt(0), 10);
        }
        else if (hours.toString().length == 4) {
            m = parseInt(hours.toString().substring(2, 4), 10);
            hours = parseInt(hours.toString().substring(0, 2), 10);
        }
    }

    var d = new Date();
    d.setHours(hours);
    d.setMinutes(m);
    d.setSeconds(0, 0);
    return d;
}