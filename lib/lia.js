'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _es6TemplateStrings = require('es6-template-strings');

var _es6TemplateStrings2 = _interopRequireDefault(_es6TemplateStrings);

var _log = require('./utils/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sprite = function () {
    function Sprite(options) {
        _classCallCheck(this, Sprite);

        this.options = Object.assign({
            src: ['**/sprite-*.png'],
            image: 'build/sprite.png',
            style: 'build/sprite.css',
            prefix: '',
            cssPath: './',
            unit: 'px',
            convert: 1,
            blank: 0,
            padding: 10,
            algorithm: 'binary-tree',
            tmpl: '',
            wrap: ''
        }, options);

        this.tmpl = this._getTemplate();
    }

    _createClass(Sprite, [{
        key: 'run',
        value: function run() {
            var sprites = this.getResource();
            var opt = this.options;

            if (!sprites.length) {
                _log2.default.warn('No images mapped for `' + opt.src + '`');
                return false;
            }

            var ret = _child_process2.default.execFileSync(_path2.default.resolve(__dirname, 'spritesmith'), ['-sprites', JSON.stringify(sprites), '-options', JSON.stringify(opt)]);
            var result = JSON.parse(ret.toString());

            if (result.error) {
                _log2.default.error(result.error);
                return false;
            }

            if (opt.image) {
                this._buildImage(result);
            }
            if (opt.style) {
                this._outputStyle(result);
            }
        }
    }, {
        key: '_buildImage',
        value: function _buildImage(_ref) {
            var image = _ref.image;

            var opt = this.options;
            var outputPath = this._resolvePath(opt.image);
            var content = new Buffer(image);

            this.outputImage({
                content: content,
                outputPath: outputPath,
                opt: opt
            });
        }
    }, {
        key: '_outputStyle',
        value: function _outputStyle(_ref2) {
            var coordinates = _ref2.coordinates;
            var properties = _ref2.properties;

            var store = [];
            var opt = this.options;
            var outputPath = this._resolvePath(opt.style);
            var totalWidth = properties.width;
            var totalHeight = properties.height;

            for (var originPath in coordinates) {
                if (coordinates.hasOwnProperty(originPath)) {
                    var payload = coordinates[originPath];
                    store.push(this._render(originPath, payload, { totalWidth: totalWidth, totalHeight: totalHeight }));
                }
            }

            var content = store.join('');
            var wrap = opt.wrap;

            if (wrap) {
                var imageName = this._basename(opt.image);
                content = (0, _es6TemplateStrings2.default)(wrap, { content: content, totalWidth: totalWidth, totalHeight: totalHeight, imageName: imageName });
            }

            this.outputStyle({
                content: content,
                outputPath: outputPath,
                opt: opt
            });
        }
    }, {
        key: 'outputImage',
        value: function outputImage(_ref3) {
            var outputPath = _ref3.outputPath;
            var content = _ref3.content;
            var opt = _ref3.opt;

            try {
                _fsExtra2.default.outputFileSync(outputPath, content, 'binary');
                _log2.default.build(opt.image);
            } catch (e) {
                _log2.default.error(e.message);
            }
        }
    }, {
        key: 'outputStyle',
        value: function outputStyle(_ref4) {
            var outputPath = _ref4.outputPath;
            var content = _ref4.content;
            var opt = _ref4.opt;

            try {
                _fsExtra2.default.outputFile(outputPath, content, 'utf8');
                _log2.default.build(opt.style);
            } catch (e) {
                _log2.default.error(e.message);
            }
        }
    }, {
        key: '_render',
        value: function _render(originPath, _ref5, _ref6) {
            var width = _ref5.width;
            var height = _ref5.height;
            var x = _ref5.x;
            var y = _ref5.y;
            var totalWidth = _ref6.totalWidth;
            var totalHeight = _ref6.totalHeight;
            var _options = this.options;
            var unit = _options.unit;
            var convert = _options.convert;
            var cssPath = _options.cssPath;
            var image = _options.image;
            var blank = _options.blank;

            var imageName = this._basename(image);
            var name = this._name(originPath);
            var selector = this.options.prefix + name;

            if (convert) {
                width = (width + blank) / convert;
                height = (height + blank) / convert;
                totalWidth = totalWidth / convert;
                totalHeight = totalHeight / convert;
                x = x / convert;
                y = y / convert;
            }

            var data = { name: name, imageName: imageName, totalWidth: totalWidth, width: width, totalHeight: totalHeight, height: height, x: x, y: y, unit: unit, cssPath: cssPath, image: image, selector: selector };
            return (0, _es6TemplateStrings2.default)(this.tmpl, data);
        }
    }, {
        key: 'getResource',
        value: function getResource() {
            var _this = this;

            var sprites = [];
            var ignore = this._basename(this.options.image);

            this.options.src.map(function (reg) {
                sprites.push.apply(sprites, _toConsumableArray(_glob2.default.sync(reg)));
            });

            return [].concat(_toConsumableArray(new Set(sprites.filter(function (p) {
                return ignore !== _this._basename(p);
            }).map(function (p) {
                return _this._resolvePath(p);
            }))));
        }
    }, {
        key: '_getTemplate',
        value: function _getTemplate() {
            var tmpl = '';
            var tmplPath = '';
            var opt = this.options;
            var defaultPath = _path2.default.resolve(__dirname, './tmpl/sprite.tmpl');

            if (opt.tmpl) {
                tmplPath = _path2.default.resolve(process.cwd(), opt.tmpl);
            } else {
                tmplPath = defaultPath;
            }

            try {
                tmpl = _fsExtra2.default.readFileSync(tmplPath, 'utf-8');
            } catch (e) {
                _log2.default.warn('`' + opt.tmpl + '` not found.');
                tmpl = _fsExtra2.default.readFileSync(defaultPath, 'utf-8');
            }

            return tmpl;
        }
    }, {
        key: '_resolvePath',
        value: function _resolvePath() {
            for (var _len = arguments.length, p = Array(_len), _key = 0; _key < _len; _key++) {
                p[_key] = arguments[_key];
            }

            return _path2.default.resolve.apply(null, [process.cwd()].concat(p));
        }
    }, {
        key: '_basename',
        value: function _basename(p) {
            return _path2.default.basename(p);
        }
    }, {
        key: '_name',
        value: function _name(p) {
            return this._basename(p).replace(/\.[\w\d]+$/, '');
        }
    }]);

    return Sprite;
}();

exports.default = Sprite;