'use strict';

const gulp = tars.packages.gulp;
const gutil = tars.packages.gutil;

/**
 * Re-update builder
 */
module.exports = () => {
    return gulp.task('service:re-update', ['service:remove-update-fs'], () => {
        if (!tars.cli) {
            tars.say(
                gutil.colors.yellow('This command is depricated and is not supported!\n')
            );
        }
        gulp.start('service:update');
    });
};
