var
	es          = require('event-stream'),
	Lintspaces  = require('lintspaces'),
	PluginError = require('gulp-util').PluginError,
	colors      = require('gulp-util').colors
;

module.exports = function(options) {
	var lintspaces = new Lintspaces(options || {});

	return es.through(function(file) {
		if (file.isNull()) {
			return this.emit('data', file);
		}

		lintspaces.validate(file.path);
		file.lintspaces = lintspaces.getInvalidLines(file.path);

		// HACK: Clean-up the cache for re-validation
		delete lintspaces._invalid[file.path];

		return this.emit('data', file);
	});
};

module.exports.reporter = function() {
	return es.through(function(file) {
		if (file.isNull()) {
			return this.emit('data', file);
		}

		if (file.lintspaces && Object.keys(file.lintspaces).length) {
			for (var line in file.lintspaces) {
				file.lintspaces[line].forEach(function(error) {
					console.error(
						'[%s] %s in (%s:%d)\n',
						colors.green('gulp-lintspaces'),
						colors.red(error),
						file.path,
						line
					);
				});
			}
		}

		if (Object.keys(file.lintspaces).length) {
			this.emit('error', new PluginError("lint-spaces", "Failed linting spaces"));
		}

		return this.emit('data', file);
	});
}
