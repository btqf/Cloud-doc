const { dialog, getCurrentWindow } = window.require('@electron/remote')
const Store = require('electron-store')
const { ipcRenderer } = require('electron')
const settingsStore = new Store({name: 'Settings'})
const qiniuConfigArr = ['#savedFileLocation','#accessKey', '#secretKey', '#bucketName'] 

const $ = (selector) => { 
    const result = document.querySelectorAll(selector)
    return result.length > 1 ? result : result[0]
}

document.addEventListener('DOMContentLoaded', () => {
  let savedLocation = settingsStore.get('savedFileLocation')
  if (savedLocation) {
    $('#savedFileLocation').value = savedLocation
  }
  // 获取配置信息并填充到输入框
  qiniuConfigArr.forEach(selector => {
    const savedValue = settingsStore.get(selector.substr(1))
    if (savedValue) {
      $(selector).value = savedValue
    }
  })
  $('#select-new-location').addEventListener('click', () => {
      dialog.showOpenDialog({
        properties: ['openDirectory'],
        message: '选择文件的存储路径',
      }).then((file) => {
        let path = file.filePaths
        console.log(file)
          if (Array.isArray(path)) {
              $('#savedFileLocation').value = path[0]
              // savedLocation = path[0]
            }
      })
    })
    $('#settings-form').addEventListener('submit', (e) => {
      e.preventDefault()
      qiniuConfigArr.forEach(selector => {
        if ($(selector)) {
          let { id, value } = $(selector)
          settingsStore.set(id, value ? value : '')
        }
      })
      // sent a event back to main process to enable menu items if qiniu is configed
      ipcRenderer.send('config-is-saved')
      getCurrentWindow().close()
    })
    $('.nav-tabs').addEventListener('click', (e) => {
      e.preventDefault()
      $('.nav-link').forEach(element => {
        element.classList.remove('active')
      })
      e.target.classList.add('active')
      $('.config-area').forEach(element => {
        element.style.display = 'none'
      })
      $(e.target.dataset.tab).style.display = 'block'
    })
})