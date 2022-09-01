const { BrowserWindow } = require('electron')

class AppWindow extends BrowserWindow{
   constructor (config, urlLocation) {
      const basicConfig = {
        width: 800,
        height: 600, 
        webPreferences: {
            contextIsolation: false,// 上下文隔离
            nodeIntegration:true, // 不继承Nodejs
            enableRemoteModule: true, // 使用remote模块
        },
        show: false,
        backgroundColor: '#efefef',
      }
      const finalConfig = { ...basicConfig, ...config }
      super(finalConfig)
      this.loadURL(urlLocation)
      this.once('ready-to-show', () => {
          this.show()
      })
   }
}

module.exports = AppWindow