/*
 * 'Missing e' Extension
 *
 * Copyright 2011, Jeremy Cutler
 * Released under the GPL version 3 licence.
 * SEE: license/GPL-LICENSE.txt
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

/*global chrome, extension, MissingE */

(function(){

if (typeof MissingE !== "undefined") { return; }

MissingE = {
   packages: {},
   utilities: {
      exportSettings: function(callback) {
         extension.sendRequest("exportOptions", {}, callback);
      },

      importSettings: function(input) {
         var form = $(input).closest("form").get(0);
         if (input.files[0]) {
            var formData = new FormData(form);
            formData.append("import", input.files[0]);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://tools.missing-e.com/settings',
                     true);
            xhr.onload = function() {
               var importedSettings = {};
               if (xhr.status === 200 && xhr.responseXML) {
                  $('missing-e setting', xhr.responseXML).each(function(i) {
                     importedSettings[$(this).find('name').text()] =
                        $(this).find('value').text();
                  });
               }
               else if (xhr.status === 200) {
                  alert("Imported settings file is not valid XML.");
                  form.reset();
                  return;
               }
               else {
                  alert("Problem uploading file. Please try again later.");
                  form.reset();
                  return;
               }
               extension.sendRequest("importOptions", {data: importedSettings},
                                     function(response) {
                  if (response.success) { window.location.reload(); }
                  else {
                     form.reset();
                  }
               });
            };
            xhr.send(formData);
         }
         else {
            form.reset();
         }
      }
   }
};

extension = {
   appName: "chrome",
   isChrome: true,
   isFirefox: false,
   isOpera: false,
   isSafari: false,
   _ajaxListeners: null,
   _listeners: null,

   _hasAjaxListener: function(func) {
      return this._ajaxListeners.indexOf(func) >= 0;
   },

   _hasListener: function(name, func) {
      return this._listeners[name].indexOf(func) >= 0;
   },

   _registerAjaxListener: function() {
      this._ajaxListeners = [];
      document.addEventListener('MissingEajax', function(e) {
         var i;
         for (i=0; i<extension._ajaxListeners.length; i++) {
            extension._ajaxListeners[i](e.data.type, e.data.list);
         }
      }, false);
   },

   _registerListener: function() {
      this._listeners = {};
      chrome.extension.onRequest.addListener(function(response) {
         var i;
         if (extension._listeners.hasOwnProperty(response.greeting)) {
            for (i=0; i<extension._listeners[response.greeting].length; i++) {
               extension._listeners[response.greeting][i](response);
            }
         }
      });
   },

   addAjaxListener: function(func) {
      if (typeof func !== "function") { return false; }
      if (this._ajaxListeners === null) {
         this._registerAjaxListener();
      }
      if (!this._hasAjaxListener(func)) {
         this._ajaxListeners.push(func);
      }
   },

   addListener: function(name, func) {
      if (typeof func !== "function") { return false; }
      if (this._listeners === null) {
         this._registerListener();
      }
      if (!this._listeners.hasOwnProperty(name)) {
         this._listeners[name] = [];
      }
      if (!this._hasListener(name, func)) {
         this._listeners[name].push(func);
      }
   },

   backupVal: function(key, val) {
      this.sendRequest("backupVal", {"key": key, "val": val});
   },

   getURL: function(rel) {
      return chrome.extension.getURL(rel);
   },

   hasBaseURL: function() {
      return true;
   },

   insertStyle: function(code) {
      var ss = document.createElement("style");
      ss.setAttribute("type","text/css");
      ss.textContent = code;
      if (document.getElementsByTagName("head").length > 0) {
         document.getElementsByTagName("head")[0].appendChild(ss);
      }
      else {
         document.documentElement.appendChild(ss);
      }
   },

   insertStyleSheet: function(url) {
      var ss = document.createElement("link");
      ss.setAttribute("type","text/css");
      ss.setAttribute("rel","stylesheet");
      ss.setAttribute("href",this.getURL(url));
      if (document.getElementsByTagName("head").length > 0) {
         document.getElementsByTagName("head")[0].appendChild(ss);
      }
      else {
         document.documentElement.appendChild(ss);
      }
   },

   openWindow: function(addr) {
      window.open(addr);
   },

   removeAjaxListener: function(func) {
      var idx;
      if (this._ajaxListeners === null) {
         return null;
      }
      idx = this._ajaxListeners.indexOf(func);
      if (idx >= 0) {
         return this._ajaxListeners.splice(idx, 1);
      }
      else {
         return null;
      }
   },

   removeListener: function(name, func) {
      var idx;
      if (this._listeners === null ||
          !this._listeners.hasOwnProperty(name)) {
         return null;
      }
      idx = this._listeners[name].indexOf(func);
      if (idx >= 0) {
         return this._listeners[name].splice(idx, 1);
      }
      else {
         return null;
      }
   },

   sendRequest: function(name, request, callback) {
      if (!request) {
         request = {};
      }
      else if (typeof callback === "undefined" &&
               typeof request === "function") {
         callback = request;
         request = {};
      }
      if (typeof callback !== "function") {
         callback = function() { return; };
      }
      request.greeting = name;
      chrome.extension.sendRequest(request, function(response) {
         callback(response);
      });
   }
};

}());
