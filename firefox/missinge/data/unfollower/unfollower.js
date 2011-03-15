/*
 * 'Missing e' Extension
 *
 * Copyright 2011, Jeremy Cutler
 * Released under the GPL version 3 licence.
 * SEE: GPL-LICENSE.txt
 *
 * This file is part of 'Missing e'.
 *
 * 'Missing e' is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * 'Missing e' is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with 'Missing e'. If not, see <http://www.gnu.org/licenses/>.
 */

/*global localStorage, $, window, safari, getPageHeight */

var text;
var done;
var failed = false;

// Adapted from getPageSize() by quirksmode.com
function getPageHeight() {
   var windowHeight;
   if (self.innerHeight) {
      // all except Explorer
      windowHeight = self.innerHeight;
   }
   else if (document.documentElement &&
            document.documentElement.clientHeight) {
      // Explorer 6 Strict Mode
      windowHeight = document.documentElement.clientHeight;
   }
   else if (document.body) { // other Explorers
      windowHeight = document.body.clientHeight;
   }
   return windowHeight;
}

function parseNames(st) {
   if (st === undefined || st === null || st.length === 0) {
      return [];
   }
   return st.split(',').sort();
}

function serializeNames(arr) {
   return arr.sort().join(',');
}

function doFinish(newlist,show) {
   var unfollows = [];
   var c, i;
   var currlist = parseNames(localStorage.getItem('MissingE_unfollower_names'));
   localStorage.setItem('MissingE_unfollower_names',serializeNames(newlist));
   if (!show) { return true; }
   var n=0;
   var a = currlist;
   var b = newlist;
   for (c=0; c<a.length; c++) {
      while (n<b.length && b[n] < a[c]) {
         n++;
      }
      if (b[n] === a[c]) { n++; }
      else {
         unfollows.push(a[c]);
      }
   }
   var txt = '<table id="unfollowrtable"><tbody>';
   for (i=0; i<unfollows.length; i++) {
      var klass = '';
      if (i%2===1) { klass = 'tu-greyrow'; }
      if (i===0) { klass += ' tu-firstrow'; }
      if (i===unfollows.length-1) { klass += ' tu-lastrow'; }
      if (klass !== '') { klass = ' class="' + klass + '"'; }
      txt += '<tr><td ' + klass + '>';
      txt += '<a target="_blank" href="http://' + unfollows[i] +
               '.tumblr.com/">' + unfollows[i] + '</a>';
      txt += '</td></tr>';
   }
   txt += '</table>';

   if (unfollows.length === 0) {
      jQuery('#113977_unfollowdisplay .unfollowerlist')
         .html('<p><em>Nobody has unfollowed you.</em></p>');
   }
   else {
      txt = '<p><em style="font-size:80%;">These tumblrers have changed ' +
            'their username,<br />unfollowed you, or deleted their ' +
            'accounts:</em></p>' + txt;
      jQuery('#113977_unfollowdisplay .unfollowerlist').html(txt);
   }
   if (jQuery('#facebox').css('display') === 'block') {
      jQuery.facebox({ div: '#113977_unfollowdisplay' }, 'unfollowrbox');
   }
   jQuery('#113977_unfollowdisplay .unfollowerlist').empty();
   a = [];
   b = [];
   currlist = [];
   newlist = [];
   unfollows = [];
}

function doDisplay(start,show) {
   var fin = true;
   var i, j;
   for (i=start; i<done.length; i++) {
      if (!done[i]) {
         fin = false;
         break;
      }
   }
   if (fin) {
      done = [];
      var names = [];
      for (i=0; i<text.length; i++) {
         var raw = text[i].match(/<div class="name">\s*<a href="http:[\/0-9A-Za-z\-\_\.]*">[0-9a-zA-Z\-\_]*<\/a>/mg);
         if (raw === undefined || raw === null || raw.length === 0) {
            continue;
         }
         for (j=0; j<raw.length; j++) {
            names.push(raw[j].match(/>([0-9A-Za-z\-\_]*)<\/a>/)[1]);
         }
      }
      text = [];
      names.sort();
      for (i=0; i<names.length-1; i++) {
         if (names[i] === names[i+1]) {
            names.splice(i+1,1);
         }
      }
      doFinish(names,show);
   }
   else {
      if (!failed) {
         window.setTimeout(function(){doDisplay(i,show);}, 500);
      }
   }
}

function doGet(num, show, extensionURL, retries) {
   var i;
   failed = false;

   if (show) {
      jQuery('#113977_unfollowdisplay .unfollowerlist')
         .html('<p><img src="' + extensionURL +
               'facebox/loading.gif' + '" /></p>');
      jQuery.facebox({ div: '#113977_unfollowdisplay' }, 'unfollowrbox');
   }

   var pages = Math.ceil(num / 40) + 1;
   text = new Array(pages);
   done = new Array(pages);
   for (i=0; i<pages; i++) {
      done[i] = false;
   }
   for (i=0; i<pages; i++) {
      jQuery.ajax({
         type: "GET",
         url: '/followers/page/'+(i+1),
         dataType: "html",
         tryCount: 0,
         retryLimit: retries,
         background: !show,
         pageNumber: i,
         error: function(xhr, textStatus) {
            this.tryCount++;
            if (!failed && this.tryCount <= this.retryLimit &&
                (jQuery('#facebox').css('display') === 'block' ||
                 this.background)) {
               jQuery.ajax(this);
               return;
            }
            else if (!failed) {
               failed = true;
               jQuery('#113977_unfollowdisplay .unfollowerlist')
                  .html('<p><em>Having trouble getting followers listing ' +
                        'from Tumblr\'s servers, please try again later.' +
                        '</em></p><img style="margin:20px 0;" src="' +
                        extensionURL + 'images/oh_dear.png' +
                        '" /><div><em>Artwork by ' +
                        '<a href="http://theoatmeal.com/">The Oatmeal</a>' +
                        '</em></div>');
               if (jQuery('#facebox').css('display') === 'block') {
                  jQuery.facebox({ div: '#113977_unfollowdisplay' }, 'unfollowrbox');
               }
            }
         },
         success: function(data, textStatus) {
            if (!(/id="dashboard_followers"/.test(data))) {
               this.tryCount++;
               if (!failed && this.tryCount <= this.retryLimit &&
                   (jQuery('#facebox').css('display') === 'block' ||
                    this.background)) {
                  jQuery.ajax(this);
                  return;
               }
               else if (!failed) {
                  failed = true;
                  jQuery('#113977_unfollowdisplay .unfollowerlist')
                     .html('<p><em>Having trouble getting followers ' +
                           'listing from Tumblr\'s servers, please try ' +
                           'again later.</em></p>' +
                           '<img style="margin:20px 0;" src="' +
                           extensionURL + 'images/oh_dear.png' +
                           '" /><div><em>Artwork by ' +
                           '<a href="http://theoatmeal.com/">The Oatmeal' +
                           '</a></em></div>');
                  if (jQuery('#facebox').css('display') === 'block') {
                     jQuery.facebox({ div: '#113977_unfollowdisplay' },
                               'unfollowrbox');
                  }
               }
               return true;
            }

            var j = this.pageNumber;
            text[j] = data;
            done[j] = true;
         }
      });
   }

   doDisplay(0,show);
}

function tu_init(extensionURL, retries) {
   var followers;
   jQuery("body").append('<div id="113977_unfollowdisplay" style="display:none;">' +
                    '<div style="font:bold 24px Georgia,serif;' +
                    'color:#1f354c;">unfollower</div>' +
                    '<div class="unfollowerlist" style="height:' +
                    ((getPageHeight()/10)*7) + 'px;overflow-y:auto;' +
                    'text-align:center;margin-top:10px;"></div>' +
                    '<img class="logo" src="' + extensionURL +
                    'Icon-64.png' + '" /></div>');

   var fl = jQuery('#right_column').find('a[href$="/followers"]');
   var lastFollows = localStorage.getItem('MissingE_unfollower_names');
   if (lastFollows === undefined || lastFollows === null ||
       lastFollows === "") {
      followers = fl.html().match(/([0-9][0-9,\.]*)/);
      if (followers !== undefined && followers !== null &&
          followers.length >= 2) {
         doGet(followers[1].replace(/,/g,"").replace(/\./g,""), false,
               extensionURL, retries);
      }
   }

   var deltxt = '<a id="113977_unfollowdelta" title="Unfollower" ' +
                  'class="tracked_tag_control" onclick="return false;" ' +
                  'href="#">&Delta;</a>';
   var fw = jQuery("#113977_followwhonotin");
   if (fw.size()>0) {
      fw.before(deltxt);
   }
   else {
      fl.parent().append(' ' + deltxt);
   }
   jQuery('#113977_unfollowdelta').click(function() {
      followers = jQuery(this).parent().children("a:first").html()
                        .match(/([0-9][0-9,\.]*)/);
      if (followers === undefined || followers === null ||
          followers.length < 2) {
         return false;
      }
      doGet(followers[1].replace(/,/g,"").replace(/\./g,""), true,
            extensionURL, retries);
   });
}

function MissingE_unfollower_doStartup(extensionURL, maxRetries) {
   if (document.body.id !== "dashboard_edit_post") {
      jQuery('head').append('<link rel="stylesheet" type="text/css" ' +
                            'href="' + extensionURL + 'unfollower/' +
                            'unfollower.css" />');
      tu_init(extensionURL, maxRetries);
   }
}