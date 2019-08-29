import {Gulpclass, Task, SequenceTask, MergedTask} from "gulpclass";


import * as gulp from 'gulp';

const bump = require('gulp-bump');
const del = require("del");
const shell = require("gulp-shell");
const replace = require("gulp-replace");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");


@Gulpclass()
export class Gulpfile {


  /**
   * Cleans build folder.
   */
  @Task()
  clean(cb: Function) {
    return del(["./build/**"], cb);
  }

  /**
   * Runs typescript files compilation.
   */
  @Task()
  compile() {
    return gulp.src("package.json", {read: false})
      .pipe(shell(["tsc"]));
  }



  // -------------------------------------------------------------------------
  // Package
  // -------------------------------------------------------------------------

  /**
   * Copies all sources to the package directory.
   */
  @MergedTask()
  packageCompile() {
    const tsProject = ts.createProject("tsconfig.json");
    const tsResult = gulp.src([
      "./src/**/*.ts",
      "!./src/**/files/*.ts",
      "!./src/**/files/**/*.ts"])
      .pipe(sourcemaps.init())
      .pipe(tsProject());

    return [
      tsResult.dts.pipe(gulp.dest("./build/package")),
      tsResult.js
        .pipe(sourcemaps.write(".", {sourceRoot: "", includeContent: true}))
        .pipe(gulp.dest("./build/package"))
    ];
  }


  /**
   * Removes /// <reference from compiled sources.
   */
  @Task()
  packageReplaceReferences() {
    return gulp.src("./build/package/**/*.d.ts")
      .pipe(replace(`/// <reference types="node" />`, ""))
      .pipe(replace(`/// <reference types="chai" />`, ""))
      .pipe(gulp.dest("./build/package"));
  }

  /**
   * Copies README.md into the package.
   */
  @Task()
  packageCopyReadme() {
    return gulp.src("./README.md")
      .pipe(replace(/```typescript([\s\S]*?)```/g, "```javascript$1```"))
      .pipe(gulp.dest("./build/package"));
  }


  /**
   * Copy package.json file to the package.
   */
  @Task()
  packagePreparePackageFile() {
    return gulp.src("./package.json")
      .pipe(replace("\"private\": true,", "\"private\": false,"))
      .pipe(gulp.dest("./build/package"));
  }


  /**
   * Creates a package that can be published to npm.
   */
  @SequenceTask()
  package() {
    return [
      "clean",
      "packageCompile",
      [
        "packageReplaceReferences",
        "packagePreparePackageFile",
        "packageCopyReadme",
      ],
    ];
  }


  /**
   * Creates a package that can be published to npm.
   */
  @SequenceTask()
  packageNoClean() {
    return [
      "packageCompile",
      [

        "packageCopyBin",
        "packageCopyJsons",
        "packageCopyFiles",
        "packageCopyHtml",
        "packageReplaceReferences",
        "packagePreparePackageFile",
        "packageCopyReadme",
      ],
    ];
  }


  // -------------------------------------------------------------------------
  // Main Packaging and Publishing tasks
  // -------------------------------------------------------------------------

  /**
   * Publishes a package to npm from ./build/package directory.
   */
  @Task()
  packagePublish() {
    return gulp.src("package.json", {read: false})
      .pipe(shell([
        "cd ./build/package && npm publish"
      ]));
  }

  /**
   * Publishes a package to npm from ./build/package directory with @next tag.
   */
  @Task()
  packagePublishNext() {
    return gulp.src("package.json", {read: false})
      .pipe(shell([
        "cd ./build/package && npm publish --tag next"
      ]));
  }


  // -------------------------------------------------------------------------
  // Versioning
  // -------------------------------------------------------------------------

  @Task()
  vpatch() {
    return gulp.src('package.json')
      .pipe(bump({type: "patch"}))
      .pipe(gulp.dest('./'));
  }

  @Task()
  vminor() {
    return gulp.src('package.json')
      .pipe(bump({type: "minor"}))
      .pipe(gulp.dest('./'));
  }

  @Task()
  vmajor() {
    return gulp.src('package.json')
      .pipe(bump({type: "major"}))
      .pipe(gulp.dest('./'));
  }


}
