(function() {
  var env, path;

  path = require('path');

  env = require('jsdom').env;

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
            setTimeout((function(_this) {
              return function() {
                return processPage();
              };
            })(this), options.delay);
            return this.page.set('onUrlChanged', null);
          });
          return this.page.open(url, function(status) {});
        });
      };
      processPage = function() {
        return this.page.evaluate((function() {
          return document.documentElement.outerHTML;
        }), function(result) {
          return env(result, (function(_this) {
            return function(errors, window) {
              var $, content, destFile, domain, k, match, pattern, pf, u, v, _ref;
              if (errors) {
                console.log("ALERT>".red, console.log(errors));
              }
              $ = require('jquery')(window);
              $('.nofollow').remove();
              content = $('html')[0].outerHTML;
              pattern = /[#!/]*([\w\/\-_]*)/g;
              match = pattern.exec(url);
              destFile = match ? match[1] : "";
              pattern = /(<head[\w-="' ]*>)/gi;
              domain = options.domain.indexOf('://') !== -1 ? options.domain : 'http://' + options.domain;
              content = content.replace(pattern, '$1\n<script type="text/javascript">window.location.href = "' + require('url').resolve(domain, url) + '"; </script>');
              pattern = /(<meta name="fragment" content="!">)/gi;
              content = content.replace(pattern, '');
              _ref = options.replace;
              for (k in _ref) {
                v = _ref[k];
                content = content.replace(v, k);
              }
              if (destFile.split('/')[destFile.split('/').length - 1].length <= 1) {
                destFile += 'index';
              }
              pf = path.join("./", options["public"], options.folder, destFile + ".html");
              grunt.file.write(pf, content);
              pattern = /href=["']([#!\/]*[\w\/\-_]*)['"]/g;
              while ((match = pattern.exec(content))) {
                u = match[1];
                if (queue[u] === void 0 && (u !== "#" && u !== "/" && u !== "#/")) {
                  grunt.log.writeln('add link: '.yellow + u);
                  urls.push(u);
                  queue[u] = 0;
                }
              }
              _this.page.close();
              return processQueue();
            };
          })(this));
        });
      };
      processQueue = function() {
        var href;
        for (url in queue) {
          if (queue[url] === 0) {
            queue[url] = 1;
            href = path.join(options.server, url);
            grunt.log.writeln('process: '.green + href);
            createPage(href);
            return;
          }
        }
        this.ph.exit();
        return generateSitemap();
      };
      generateSitemap = function() {
        var domain, pf, priority, time, u, xmlStr, _j, _len1;
        time = new Date().toISOString();
        xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlStr += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        domain = options.domain.indexOf('://') !== -1 ? options.domain : 'http://' + options.domain;
        for (_j = 0, _len1 = urls.length; _j < _len1; _j++) {
          url = urls[_j];
          u = require('url').resolve(domain, url);
          priority = 1;
          if (u.length > 1) {
            priority -= (u.split("/").length - 1) / 10;
          }
          xmlStr += '  <url>\n';
          xmlStr += "    <loc>" + u + "</loc>\n";
          xmlStr += "    <lastmod>" + time + "</lastmod>\n";
          xmlStr += "    <changefreq>" + options.changefreq + "</changefreq>\n";
          xmlStr += "    <priority>" + priority + "</priority>\n";
          xmlStr += "  </url>\n";
        }
        xmlStr += '</urlset>';
        pf = path.join(options["public"], "/sitemap.xml");
        grunt.file.write(pf, xmlStr);
        grunt.log.writeln('File "'.yellow + pf + '" created.'.yellow);
        return done();
      };
      return initPhantom();
    });
  };

}).call(this);
