'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var traceur = require('traceur');

module.exports = function (options) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-traceur', 'Streaming not supported'));
			return cb();
		}

		var ret;

		options = options || {};
		options.filename = path.relative(file.cwd, file.path);

		if (options.dest) {
			var dest = path.dirname(path.join(options.dest, options.filename));
			options.filename = path.relative(path.join(dest, '..'), file.path);
		}

		try {
			ret = traceur.compile(file.contents.toString(), options);
			if (ret.js) {
				if (options.sourceMap && ret.sourceMap) {
					file.contents = new Buffer(ret.js + '\n//# sourceMappingURL=' + path.basename(file.path + '.map'));
					this.push(new gutil.File({
						cwd: file.cwd,
						base: file.base,
						path: file.path + '.map',
						contents: new Buffer(ret.sourceMap)
					}));
				} else {
					file.contents = new Buffer(ret.js);
				}
			}
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-traceur', err));
		}

		if (ret.errors.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-traceur', '\n' + ret.errors.join('\n')));
		}

		this.push(file);
		cb();
	});
};
