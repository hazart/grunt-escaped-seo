# grunt-escaped-seo

> Generate an SEO website for site with google escaped fragments

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-escaped-seo --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-escaped-seo');
```

This plugin require a local installation of PhantomJS (phantomjs.org/‎)

And the npm "phantom" module `~0.5.4`

## The "escaped_seo" task

### Overview
Thank you to Mathieu Desvé (https://github.com/mazerte) who brought the idea and contributed to some of the code.

Use this plugin to generate a static version of your "single page application" boosted with ajax. This version will be parsed by the googlebot. The generated sitemap.xml will help you to tell google to index your site.

To work with googlebot you need follow the google specifications (https://developers.google.com/webmasters/ajax-crawling/docs/specification). Use #! hash fragment in your urls or add a meta in your html page:
```html
<meta name="fragment" content="!">
```

Don't forget to add a redirect rule. In Exemple for htaccess with apache server :

```html
<ifModule mod_rewrite.c>
    RewriteCond %{QUERY_STRING} ^_escaped_fragment_=$
    RewriteRule ^$ /seo/index.html [L]
    RewriteCond %{QUERY_STRING} ^_escaped_fragment_=(.*)$
    RewriteRule ^$ /seo/%1.html [L]
</ifModule>
```

In your project's Gruntfile, add a section named `escaped_seo` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  escaped_seo: {
    options: {
      domain: 'http://yourdomain.com',
      server: '',
      delay: 2000,
      public: 'dist',
      folder: 'seo',
      changefreq: 'daily',
      replace: {
        "new text": /(old text)/gi
      }
    },
  },
})
```

### Options

#### options.domain
Type: `String`

The final domain of your site, used for the sitemap.xml

#### options.server
Type: `String`

The server to parse to generate the static version and the site tree. By default options.domain is used

#### options.delay
Type: `Number`
Default value: `2000`

Time to wait before capturing the page. Needed time for javascript to generate the whol page.

#### options.public
Type: `String`
Default value: `dist`

Your local current folder corresponding to the public document root folder. The sitemap and the static version will be created inside.

#### options.folder
Type: `String`
Default value: `seo`

A local folder into which ths static html files will be created.

#### options.changefreq
Type: `String`
Default value: `Daily`

The changefreq value to use in the sitemap.xml

#### options.replace
Type: `Object`
Default value: ``

You can define in this object some replace rules for the static html versions. Each value (String or RegExp) will be replace by the corresponding key. If you use String instead of RegExp only the first occurence will be replaced.


### Usage Examples

```coffee
escaped_seo:
  options:
    domain: 'http://pr0d.fr'
    server: 'http://localhost:9001'
    public: 'dist'
    folder: 'seo'
    changefreq: 'daily'
    delay: 2000
    replace:
      "test": /(<meta[\w-="' ]*>)/gi
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## Release History
_(Nothing yet)_
