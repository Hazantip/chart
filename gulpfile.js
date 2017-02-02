'use strict';

// Tars main-module update
// It is a global var
require('./tars/tars');

const gulp = tars.packages.gulp;

// Require system and user's tasks
// You can add your own tasks.
// All your tasks have to be in tars/user-tasks folder
tars.helpers.tarsFsHelper
    .getTasks()
    .forEach(file => require(file)());

// Register links to main tasks without namespace
// Build-dev task. Build dev-version (without watchers)
gulp.task('build-dev', () => gulp.start('main:build-dev'));

// Dev task. Build dev-version with watchers and livereload
gulp.task('dev', () => gulp.start('main:dev'));

// Build task. Build release version
gulp.task('build', () => gulp.start('main:build'));

// Init task. Just start update task
gulp.task('update', () => gulp.start('service:update'));

// Re-update task. Just start re-update task
gulp.task('re-update', () => gulp.start('service:re-update'));

// Update-deps task. Just start update-deps task
gulp.task('update-deps', () => gulp.start('service:update-deps'));

// Default task. Just start build task
gulp.task('default', () => gulp.start('build'));
