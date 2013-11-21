(function() {
  module.exports = function(grunt) {
    return grunt.registerMultiTask('escaped-seo', 'Generate an SEO website and sitemap for google escaped fragments', function() {
      var createPage, done, generateSitemap, initPhantom, options, page, ph, phantom, processPage, processQueue, queue, url, urls, _i, _len;
      options = this.options({
        domain: 'http://localhost',
        server: '',
        delay: 2000,
        "public": 'dist',
        folder: 'seo',
        changefreq: 'daily',
        replace: {}
      });
      if ((options.server == null) || options.server.length === 0) {
        options.server = options.domain;
      }
      urls = options.urls;
      if ((urls == null) || urls.length === 0) {
        urls = [''];
      }
      queue = {};
      for (_i = 0, _len = urls.length; _i < _len; _i++) {
        url = urls[_i];
        queue[url] = 0;
      }
      phantom = require('phantom');
      ph = null;
      page = null;
      done = this.async();
      initPhantom = function() {
        return phantom.create('--local-to-remote-url-access=yes', function(ph) {
          this.ph = ph;
          return processQueue();
        });
      };
      createPage = function(url) {
        return this.ph.createPage(function(page) {
          this.page = page;
          this.page.set('viewportSize', {
            width: 1280,
            height: 800
          });
          this.page.set('onAlert', function(msg) {
            return console.log("ALERT>".red, msg);
          });
          this.page.set('onConsoleMessage', function(msg) {
            return console.log(">".red, msg);
          });
          this.page.set('onError', function(msg, trace) {
            var msgStack;
            msgStack = ['ERROR: '.red + msg];
            if (trace && trace.length) {
              msgStack.push('TRACE:');
              trace.forEach(function(t) {
                var _ref;
                return msgStack.push(' -> '.red + t.file + ': ' + t.line + ((_ref = t["function"]) != null ? _ref : ' (in function "' + t["function"] + {
                  '")': ''
                }));
              });
            }
            return console.error(msgStack.join('\n'));
          });
          this.page.set('onUrlChanged', function(url) {
            var _this = this;
            return setTimeout(function() {
              return processPage();
            }, options.delay);
          });
          return this.page.open(url, function(status) {});
        });
      };
      processPage = function() {
        return this.page.evaluate((function() {
          return document.documentElement.outerHTML;
        }), function(result) {
          var content, destFile, domain, k, match, path, pattern, u, v, _ref;
          content = result;
          pattern = /[#!]([\w\/\-_]*)/g;
          match = pattern.exec(url);
          destFile = match ? match[1] : "";
          pattern = /(<head[\w-="' ]*>)/gi;
          domain = options.domain.indexOf('http://') !== -1 ? options.domain : 'http://' + options.domain;
          content = content.replace(pattern, '$1\n<script type="text/javascript">window.location.href = "' + domain + "/" + url + '"; </script>');
          _ref = options.replace;
          for (k in _ref) {
            v = _ref[k];
            content = content.replace(v, k);
          }
          if (destFile.length <= 1) {
            destFile = 'index';
          }
          path = "./" + options["public"] + "/" + options.folder + "/" + destFile + ".html";
          grunt.file.write(path, content);
          pattern = /href=["']([#!\/]*[\w\/\-_]*)['"]/g;
          while ((match = pattern.exec(content))) {
            u = match[1];
            if (queue[u] === void 0 && u !== "#" && u !== "/" && u !== "#/") {
              grunt.log.writeln('add link: '.yellow + u);
              urls.push(u);
              queue[u] = 0;
            }
          }
          this.page.close();
          return processQueue();
        });
      };
      processQueue = function() {
        var href;
        for (url in queue) {
          if (queue[url] === 0) {
            queue[url] = 1;
            href = options.server + url;
            grunt.log.writeln('process: '.green + href);
            createPage(href);
            return;
          }
        }
        this.ph.exit();
        return generateSitemap();
      };
      generateSitemap = function() {
        var path, priority, time, xmlStr, _j, _len1;
        time = new Date().toISOString();
        xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlStr += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        for (_j = 0, _len1 = urls.length; _j < _len1; _j++) {
          url = urls[_j];
          priority = 1;
          if (url.length > 1) {
            priority -= url.split("/").length / 10;
          }
          xmlStr += '  <url>\n';
          xmlStr += "    <loc>" + options.domain + url + "</loc>\n";
          xmlStr += "    <lastmod>" + time + "</lastmod>\n";
          xmlStr += "    <changefreq>" + options.changefreq + "</changefreq>\n";
          xmlStr += "    <priority>" + priority + "</priority>\n";
          xmlStr += "  </url>\n";
        }
        xmlStr += '</urlset>';
        path = options["public"] + "/sitemap.xml";
        grunt.file.write(path, xmlStr);
        grunt.log.writeln('File "'.yellow + path + '" created.'.yellow);
        return done();
      };
      return initPhantom();
    });
  };

}).call(this);
