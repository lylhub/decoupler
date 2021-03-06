var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    del = require('del'),
    rename = require('gulp-rename'),
    banner = require('gulp-banner'),
    eslint = require('gulp-eslint'),
    ejs = require('gulp-ejs'),
    connect = require('gulp-connect'),
    path = require('path'),
    exec = require('child_process').execSync,
    pkg = require('./package.json')

var getCdn = function(env) {
    return ''
}

var src = 'src',
    demo = 'demo',
    build = 'build',
    dist = 'dist',
    static = 'static',
    pages = 'pages',
    environment = 3,
    port = 4010,
    cdn = getCdn(3);

var staticPath = path.join(build, static);

var comment = '';

//clean
gulp.task('clean', function() {
    del.sync(build);
    del.sync(dist);
});

//js
gulp.task('js', function() {
    var target = path.join(dist),
        source = [path.join(src, '**/' + pkg.name + '.js')];

    var stream = gulp.src(source);

    stream = stream.pipe(banner(comment, {
        pkg: pkg
    }));

    //output unmin
    stream = stream.pipe(gulp.dest(target));

    //min
    environment && (stream = stream.pipe(uglify()));

    //rename
    stream = stream.pipe(rename(function(path) {
        path.basename += '.min';
    }));

    stream = stream.pipe(banner(comment, {
        pkg: pkg
    }));

    //output min
    stream = stream.pipe(gulp.dest(target));

    //output build
    stream = stream.pipe(rename(function(path) {
        path.basename = 'index';
    }));

    return stream.pipe(gulp.dest(staticPath));
});

//html
gulp.task('html', function() {
    var source = [path.join(demo, '**/*.html')],
        target = path.join(build, pages);

    var stream = gulp.src(source).pipe(ejs({
        cdn: getCdn(environment)
    }));

    return stream.pipe(gulp.dest(target));
});

//eslint
gulp.task('eslint', function() {
    var source = [path.join(src, '**/*.js')];
    return gulp.src(source)
        .pipe(eslint())
        .pipe(eslint.format());
});

//只生成文档
//docker -i src -o build/pages/docs

//监听文档并生成文档
//docker -i src -o build/pages/docs -w
gulp.task('docs', function(cb) {
    var target = path.join(build, 'pages/docs', 'v' + pkg.version),
        source = path.join(src);
    try {
        exec('docker -i ' + source + ' -o ' + target);
        cb();
    } catch (e) {
        console.log(e.message);
        process.exit(0);
    }
});

gulp.task('server', function() {
    connect.server({
        host: "127.0.0.1",
        port: port
    });
});

gulp.task('default', ['clean'], function() {
    var tasks = environment == 3 ? ['js'] : ['js', 'html'];

    gulp.start.apply(gulp, tasks);
});

gulp.task('watch', ['server'], function() {
    var source = [path.join(src, '**/*.js')];

    environment = 0;
    gulp.start('default');

    gulp.watch(source, function() {
        gulp.start('js');
    });

    source = [path.join(demo, '**/*.html')];
    gulp.watch(source, function() {
        gulp.start('html');
    });
});

//发布
gulp.task('daily', function() {
    environment = 1;
    gulp.start('default');
});

gulp.task('pre', function() {
    environment = 2;
    gulp.start('default');
});

gulp.task('prod', function() {
    environment = 3;
    gulp.start('default');
});
