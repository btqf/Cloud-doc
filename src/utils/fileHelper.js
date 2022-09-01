const fs =  window.require('fs').promises
// const path =  window.require('path')

const fileHelper = {
    readFile: (path, cb) => {
        return fs.readFile(path, { encoding: 'utf8' })
    },
    writeFile: (path, content, cb) => {
        return fs.writeFile(path, content, {encoding: 'utf8'})
    },
    renameFile: (path, newPath) => {
        return fs.rename(path, newPath)
    },
    deleteFile: (path) => {
        return fs.unlink(path)
    }
}

export default fileHelper
// test
// const testPath = path.join(__dirname, 'defaultFiles.js')
// const testWritePath = path.join(__dirname, 'hello world')
// const testRenamePath = path.join(__dirname, 'rename.md')

// fileHelper.readFile(testPath).then((data) => {
//     console.log(data)
// })
// fileHelper.writeFile(testWritePath, '##hello world').then(() => {
//     console.log(('写入成功'))
// })
// fileHelper.renameFile(testWritePath, testRenamePath).then(() => {
//     console.log('重命名成功')
// })
// fileHelper.deleteFile(testRenamePath).then(() => {
//     console.log(`${testRenamePath}删除成功`)
// })