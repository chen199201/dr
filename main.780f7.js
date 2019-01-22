(function () {

  function boot() {

    var settings = window._CCSettings;
    window._CCSettings = undefined;

    if (!settings.debug) {
      var uuids = settings.uuids;

      var rawAssets = settings.rawAssets;
      var assetTypes = settings.assetTypes;
      var realRawAssets = settings.rawAssets = {};
      for (var mount in rawAssets) {
        var entries = rawAssets[mount];
        var realEntries = realRawAssets[mount] = {};
        for (var id in entries) {
          var entry = entries[id];
          var type = entry[1];
          // retrieve minified raw asset
          if (typeof type === 'number') {
            entry[1] = assetTypes[type];
          }
          // retrieve uuid
          realEntries[uuids[id] || id] = entry;
        }
      }


      var scenes = settings.scenes;
      for (var i = 0; i < scenes.length; ++i) {
        var scene = scenes[i];
        if (typeof scene.uuid === 'number') {
          scene.uuid = uuids[scene.uuid];
        }
      }

      var packedAssets = settings.packedAssets;
      for (var packId in packedAssets) {
        var packedIds = packedAssets[packId];
        for (var j = 0; j < packedIds.length; ++j) {
          if (typeof packedIds[j] === 'number') {
            packedIds[j] = uuids[packedIds[j]];
          }
        }
      }
    }

    // init engine
    var canvas;

    if (cc.sys.isBrowser) {
      canvas = document.getElementById('GameCanvas');
    }

    if (false) {
      var ORIENTATIONS = {
        'portrait': 1,
        'landscape left': 2,
        'landscape right': 3
      };
      BK.Director.screenMode = ORIENTATIONS[settings.orientation];
      initAdapter();
    }

    function setLoadingDisplay() {
      // Loading splash scene
      var splash = document.getElementById('splash');
      var progressBar = splash.querySelector('.progress-bar span');
      cc.loader.onProgress = function (completedCount, totalCount, item) {
        var percent = 100 * completedCount / totalCount;
        if (progressBar) {
          progressBar.style.width = percent.toFixed(2) + '%';
        }
      };
      splash.style.display = 'block';
      progressBar.style.width = '0%';

      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
        splash.style.display = 'none';
      });
    }

    var onStart = function () {
      cc.loader.downloader._subpackages = settings.subpackages;

      cc.view.enableRetina(true);
      cc.view.resizeWithBrowserSize(true);

      if (!true && !false) {
        // UC browser on many android devices have performance issue with retina display
        if (cc.sys.os !== cc.sys.OS_ANDROID || cc.sys.browserType !== cc.sys.BROWSER_TYPE_UC) {
          cc.view.enableRetina(true);
        }
        if (cc.sys.isBrowser) {
          setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
          if (settings.orientation === 'landscape') {
            cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
          } else if (settings.orientation === 'portrait') {
            cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
          }
          cc.view.enableAutoFullScreen(
            [
              cc.sys.BROWSER_TYPE_BAIDU,
              cc.sys.BROWSER_TYPE_WECHAT,
              cc.sys.BROWSER_TYPE_MOBILE_QQ,
              cc.sys.BROWSER_TYPE_MIUI
            ].indexOf(cc.sys.browserType) < 0
          );
        }
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
          cc.macro.DOWNLOAD_MAX_CONCURRENT = 2;
        }
      }

      // init assets
      cc.AssetLibrary.init({
        libraryPath: 'res/import',
        rawAssetsBase: 'res/raw-',
        rawAssets: settings.rawAssets,
        packedAssets: settings.packedAssets,
        md5AssetsMap: settings.md5AssetsMap
      });

      if (false) {
        cc.Pipeline.Downloader.PackDownloader._doPreload('WECHAT_SUBDOMAIN', settings.WECHAT_SUBDOMAIN_DATA);
      }

      var launchScene = settings.launchScene;

      // load scene
      // load subpackages
      cc.loader.load('src/game.json', (err, json) => {
        const loadSubpackage = (name) =>
          new Promise((resolve, reject) => {
            const loadTask = wx.loadSubpackage({
              name, // name 可以填 name 或者 root
              success: function (res) {

                resolve();
              },
              fail: function (res) {

                reject();
              }
            });
            loadTask.onProgressUpdate((res) => {
              console.log('下载进度', res.progress);
              console.log('已经下载的数据长度', res.totalBytesWritten);
              console.log('预期需要下载的数据总长度', res.totalBytesExpectedToWrite);
            });
          });
        const subs = [];
        for (let index in json.subpackages) {
          const subpack = json.subpackages[index];
          subs.push(loadSubpackage(subpack.name));
        }
        Promise.all(subs)
          .catch((error) => {
            console.log('加载子包失败，直接启动', error);
          })
          .then(() => {
            cc.director.loadScene(launchScene, null, function () {
              if (cc.sys.isBrowser) {
                // show canvas
                var canvas = document.getElementById('GameCanvas');
                canvas.style.visibility = '';
                var div = document.getElementById('GameDiv');
                if (div) {
                  div.style.backgroundImage = '';
                }
              }
              cc.loader.onProgress = null;
              console.log('Success to load scene: ' + launchScene);
            });
          });
      });
    };

    // jsList
    var jsList = settings.jsList;

    if (false) {
      BK.Script.loadlib();
    }
    else {
      var bundledScript = settings.debug ? 'src/project.dev.js' : 'src/project.540a5.js';
      if (jsList) {
        jsList = jsList.map(function (x) {
          return 'src/' + x;
        });
        jsList.push(bundledScript);
      }
      else {
        jsList = [bundledScript];
      }
    }

    // anysdk scripts
    if (cc.sys.isNative && cc.sys.isMobile) {
      jsList = jsList.concat(['src/anysdk/jsb_anysdk.js', 'src/anysdk/jsb_anysdk_constants.js']);
    }

    var option = {
      //width: width,
      //height: height,
      id: 'GameCanvas',
      scenes: settings.scenes,
      debugMode: settings.debug ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
      showFPS: (!true && !false) && settings.debug,
      frameRate: 60,
      jsList: jsList,
      groupList: settings.groupList,
      collisionMatrix: settings.collisionMatrix,
      renderMode: 0
    }

    cc.game.run(option, onStart);
  }

  if (false) {
    BK.Script.loadlib('GameRes://libs/qqplay-adapter.js');
    BK.Script.loadlib('GameRes://src/settings.js');
    BK.Script.loadlib();
    BK.Script.loadlib('GameRes://libs/qqplay-downloader.js');
    qqPlayDownloader.REMOTE_SERVER_ROOT = "";
    var prevPipe = cc.loader.md5Pipe || cc.loader.assetLoader;
    cc.loader.insertPipeAfter(prevPipe, qqPlayDownloader);
    // <plugin script code>
    boot();
    return;
  }

  if (true) {
    require(window._CCSettings.debug ? 'cocos2d-js.js' : 'cocos2d-js-min.17b0c.js');
    var prevPipe = cc.loader.md5Pipe || cc.loader.assetLoader;
    cc.loader.insertPipeAfter(prevPipe, wxDownloader);
    boot();
    return;
  }

  if (window.jsb) {
    require('src/settings.bac22.js');
    require('src/jsb_polyfill.js');
    boot();
    return;
  }

  if (window.document) {
    var splash = document.getElementById('splash');
    splash.style.display = 'block';

    var cocos2d = document.createElement('script');
    cocos2d.async = true;
    cocos2d.src = window._CCSettings.debug ? 'cocos2d-js.js' : 'cocos2d-js-min.17b0c.js';

    var engineLoaded = function () {
      document.body.removeChild(cocos2d);
      cocos2d.removeEventListener('load', engineLoaded, false);
      window.eruda && eruda.init() && eruda.get('console').config.set('displayUnenumerable', false);
      boot();
    };
    cocos2d.addEventListener('load', engineLoaded, false);
    document.body.appendChild(cocos2d);
  }

})();
