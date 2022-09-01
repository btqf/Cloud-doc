const qiniu = require('qiniu')
const QiniuManager = require('./src/utils/qiniuManager')
const path = require('path')

var accessKey = 'o7zHsj0dRKtZs6c9fCQdfFLI25EL6tj7BoXfzaTi';
var secretKey = '_PoXYgcf5LBv6zOWk7bF0EZG-NbAzXmCxBMwIsUQ';
var localFile = "D:/developing project/React/pratice/Notee/cloud-doc/reason.md";
var key='reason.md';
const downloadPath = path.join(__dirname, key)

const manager = new QiniuManager(accessKey, secretKey, 'notee')
manager.uploadFile(key, localFile).then(data => {
    console.log('上传成功', data)
    // return manager.deleteFile(key)
})
// .then( data => {
//     console.log('删除成功')
// }) 

// manager.generateDownloadLink(key).then((data) => {
//     console.log(data)
//     return manager.generateDownloadLink('first.md')
// }).then(data => {
//     console.log(data)
// })
// manager.downloadFile(key, downloadPath).then(() => {
//     console.log('写入完毕')
// })