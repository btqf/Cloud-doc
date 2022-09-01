const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const ElectronStore = require('electron-store')
// const { dialog } = require('@electron/remote/main')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const QiniuManager = require('./src/utils/qiniuManager')
const path = require('path')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings'})
const fileStore = new Store({name: 'Files Data'})
ElectronStore.initRenderer();
let mainWindow, settingsWindow;

const createManger = () => {
    const accessKey = settingsStore.get('accessKey')
    const secretKey = settingsStore.get('secretKey')
    const bucketName = settingsStore.get('bucketName')
    return new QiniuManager(accessKey, secretKey, bucketName)
}

app.on('ready', () => {

    const mainWindowConfig = {
        width: 1024,
        height: 680,
    }
    const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`
    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // 设置菜单
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
    // 設置窗口
    ipcMain.on('open-settings-window', () => {
        const settingsConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        }
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsConfig, settingsFileLocation)
        // 设置窗口不需要菜单
        settingsWindow.removeMenu()
        settingsWindow.on('closed', () => {
            settingsWindow = null
        })
        require("@electron/remote/main").enable(settingsWindow.webContents);
    })

    ipcMain.on('upload-file', (event, data) => {
        const manager = createManger()
        manager.uploadFile(data.key, data.path).then(data => {
            console.log('上传成功', data)
            mainWindow.webContents.send('active-file-upload')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
        })
    })

    ipcMain.on('download-file', (event, data) => {
        const manager = createManger()
        const filesObj = fileStore.get('files')
        const { key, path, id } = data
        manager.getStat(data.key).then((resp) => {
          const serverUpdatedTime = Math.round(resp.putTime / 10000)
          const localUpdatedTime = filesObj[id].updatedAt
          if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
            manager.downloadFile(key, path).then(() => {
                // console.log('new file')
              mainWindow.webContents.send('file-downloaded', {status: 'download-success', id})
            })
          } else {
            //   console.log('no new file')
            mainWindow.webContents.send('file-downloaded', {status: 'no-new-file', id})
          }
        }, (error) => {
          if (error.statusCode === 612) {
            mainWindow.webContents.send('file-downloaded', {status: 'no-file', id})
          }
        })
      })

    ipcMain.on('upload-all-to-qiniu', () => {
        mainWindow.webContents.send('loading-status', true)
        const manager = createManger()
        const fileObj = fileStore.get('files') || {}
        const uploadPromiseArr = Object.keys(fileObj).map(key => {
            const file = fileObj[key]
            return manager.uploadFile(`${file.title}.md`, file.path)
        })
        Promise.all(uploadPromiseArr).then(result => {
            // console.log(result)
            dialog.showMessageBox({
                type: 'info',
                title: `成功导入了${result.length}个文件`,
                message: `成功导入了${result.length}个文件`
              })
              mainWindow.webContents.send('file-uploaded')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false)
        })
    })
    // 解决云同步设置修改后的动态修复问题
    ipcMain.on('config-is-saved', () => {
        // 注意menu item在mac和windows平台的差异
        let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
        const switchItems = (toggle) => {
            [1, 2, 3].forEach( number => {
                qiniuMenu.submenu.items[number].enabled = toggle
            })
        }
        const qiniuIsConfiged =  ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
        if (qiniuIsConfiged) {
            switchItems(true)
        } else {
            switchItems(false)
        }
    })

    require("@electron/remote/main").initialize(); // 初始化
    require("@electron/remote/main").enable(mainWindow.webContents);
    
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
})