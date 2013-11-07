# grunt-escaped-seo
# https://github.com/hazart/grunt-escaped-seo
# 
# Copyright (c) 2013 Alex Koch
# Licensed under the MIT license.

module.exports = (grunt) ->

	grunt.registerMultiTask 'escaped-seo', 'Generate an SEO website and sitemap for google escaped fragments', ->

		options = this.options
			domain: 'http://localhost'
			server: ''
			delay: 2000
			public: 'dist'
			folder: 'seo'
			changefreq: 'daily'
			replace: {}

		if !options.server? or options.server.length is 0
			options.server = options.domain

		urls = options.urls
		urls = [''] if !urls? or urls.length is 0

		queue = {}
		queue[url] = 0 for url in urls

		phantom = require 'phantom'
		ph = null
		page = null

		done = this.async()

		initPhantom = () ->
			phantom.create '--local-to-remote-url-access=yes', (ph) ->
				@ph = ph
				processQueue()

		createPage = (url) ->
			@ph.createPage (page) ->
				@page = page
				@page.set('viewportSize', {width:1280,height:800})
				@page.set 'onAlert', (msg) ->
					console.log "ALERT>".red, msg
				@page.set 'onConsoleMessage', (msg) ->
					console.log ">".red, msg
				@page.set 'onError', (msg, trace) ->
					msgStack = ['ERROR: '.red + msg]
					if trace && trace.length 
						msgStack.push('TRACE:');
						trace.forEach((t) ->
							msgStack.push(' -> '.red + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''))
							)
					console.error(msgStack.join('\n'))

				@page.set 'onUrlChanged', (url) ->
					setTimeout(
						=>
							processPage()
						options.delay
					)
				@page.open url, (status) ->
			
		processPage = () ->
			@page.evaluate (-> document.documentElement.outerHTML), (result) ->
				content = result
				pattern = /[#!]([\w\/\-_]*)/g
				match = pattern.exec(url)
				destFile = if match then match[1] else ""
				
				pattern = /(<head[\w-="' ]*>)/gi
				content = content.replace(pattern, '$1\n<script type="text/javascript">window.location.href = "' + options.domain + "/"+url + '"; </script>')

				content = content.replace(v, k) for k, v of options.replace

				destFile = 'index' if destFile.length <= 1
				path = "./" + options.public + "/"+ options.folder + "/" + destFile + ".html"
				grunt.file.write(path, content);
				
				pattern = /href=["']([#!\/]*[\w\/\-_]*)['"]/g
				while (match = pattern.exec(content))
					u = match[1]
					if( queue[u] is undefined and u isnt "#" and u isnt "/" and u isnt "#/")
						grunt.log.writeln('add link: '.yellow + u)
						urls.push(u)
						queue[u] = 0

				@page.close()
				processQueue()

		processQueue = () ->
			for url of queue
				if queue[url] is 0
					queue[url] = 1
					href = options.server + url
					grunt.log.writeln('process: '.green + href)
					createPage(href)
					return
			@ph.exit()
			generateSitemap()

		generateSitemap = () ->
			time = new Date().toISOString()
			xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n'
			xmlStr += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
			for url in urls
				priority = 1 - url.split("/").length/10
				xmlStr += '  <url>\n'
				xmlStr += "    <loc>"+options.domain+url+"</loc>\n"
				xmlStr += "    <lastmod>"+time+"</lastmod>\n"
				xmlStr += "    <changefreq>"+options.changefreq+"</changefreq>\n"
				xmlStr += "    <priority>"+priority+"</priority>\n"
				xmlStr += "  </url>\n"
			xmlStr += '</urlset>'

			path = options.public + "/sitemap.xml"
			grunt.file.write(path, xmlStr);	
			grunt.log.writeln('File "'.yellow + path + '" created.'.yellow)
			done()

		initPhantom()