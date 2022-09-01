import React, { useCallback, useEffect, useState } from "react";
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'

import bootstrap from 'bootstrap/dist/css/bootstrap.min.css';
import SimpleMDE from "react-simplemde-editor";    //引入markdown编辑器
import SimpleMdeReact from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { v4 as uuidv4 } from 'uuid';
import { after } from "lodash";

import './App.css';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import { flattenArr, objToArr, timestampToString } from './utils/helper'
import fileHelper from './utils/fileHelper'
import useIpcRenderer from "./hooks/useIpcRenderer";
import Loader from './components/Loader'

const { join, basename, extname, dirname } = window.require('path')    // 引入node.js模块
const { app, dialog } = window.require('@electron/remote')
const { ipcRenderer } = window.require('electron')

const Store = window.require('electron-store');
const fileStore = new Store({'name':'Files Data'})
const settingsStore = new Store({name: 'Settings'})
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
const saveFilesToStore = (files) => {
  // 不需要将 isNew、body等信息保存
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createAt,
      isSynced,
      updatedAt 
    }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}

function App() {
  const [ files, setFiles ] = useState(fileStore.get('files') || {})
  const [ activeFileID, setActiveFileID ] = useState('')
  const [ openedFileIDs, setOpenedFileIDs ] = useState([])
  const [ unsaveFileIDs, setUnsaveFileIDs ] = useState([])
  const [ searchedFiles, setSearchedFiles ] = useState([])     // 记录搜索后的文件
  const [ isLoading, setLoadingStatus ] = useState(false)
  
  const filesArr = objToArr(files)
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const activeFile = files[activeFileID]
  // console.log(activeFile)
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr    // 用于显示搜索前后的文件
  const savedLocation = settingsStore.get('savedFileLocation') || app.getPath('documents')

  const fileClick = (fileID) => {
    
    // set current active file
    setActiveFileID(fileID)
    const currentFile = files[fileID]
    const { id, title, path, isLoaded } = currentFile
    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper.readFile(currentFile.path).then(value => {
          const newFile = { ...files[fileID], body: value, isLoaded: true }
          setFiles({ ...files, [fileID]: newFile })
        })
      }
    }
    // if openedFiles don't have the current ID
    // then add new fileID to openedFiles
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([ ...openedFileIDs, fileID ])
    }
  }

  const tabClick = (fileID) => { 
    setActiveFileID(fileID)
  }

  const closeTab = (fileID) => {
    const tabsWithout = openedFileIDs.filter(id => id !== fileID)
    setOpenedFileIDs(tabsWithout)
    // 先判断当前打开文件ID与关闭ID是否相等
    // 若相等并且存在多余tabs,activeFileID重设为第一个
    if(tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
  }

  const fileChange = useCallback( (id, value) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })
      // 更新 unsaveFileIDs
      if (!unsaveFileIDs.includes(id)) {
        setUnsaveFileIDs([ ...unsaveFileIDs, id])
      }
    }
  }, [])

  const deleteFile = (id) => {
    // 删除文件前必须先考虑'文件已存在'还是'文件正在创建中'的状态，通过isNew判断
    if (files[id].isNew) {
      // console.log(files[id].isNew)
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        // console.log(files[id].isNew)
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        //如果文件已打开，则删除时需将tab关闭
        closeTab(id)
      })
    }
  }

  // 通过isNew区分是修改文件名称还是创建文件
  const updateFileName = (id, title, isNew) => {
    // 新的路径应该根据isNew来判断，如果isNew为false，path为old dirname + new title
    const newPath = isNew ? join(savedLocation,`${title}.md`) : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath}
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body)
      setFiles(newFiles)
      // 持久化文件
      saveFilesToStore(newFiles)
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile( oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }

  const createNewFile = () => {
    const newID = uuidv4()
    const newFile =  {
        id: newID,
        title: '',
        body: '## 请输入Markdown',
        createAt: new Date().getTime(),
        isNew: true    // 用于判断是否显示输入框
    }
    setFiles({ ...files, [newID]: newFile })
  }

  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(path, body).then(() => {
      setUnsaveFileIDs(unsaveFileIDs.filter(id => id !== activeFile.id))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {key: `${title}.md`, path })
      }
    })
  }

  const importFiles = () => {
    dialog.showOpenDialog({
      title: '请选择导入 Markdown 文件',
      properties: ['openFile', 'multiSelections'],    //指定对话框应使用的功能：选择文件、允许选择多个路径
      filters: { name: 'Markdown files', extensions: ['md'] }    //指定文件类型
    }).then((file) => {
      // console.log(file)
      let paths = file.filePaths
      if(paths.length) {
        // 过滤从store中存有的path
        const filteredPaths = paths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadyAdded
        })
        // 将文件信息转换成数组
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path,
          }
        })
        // console.log(importFilesArr)
        // 将新的文件数组扁平化与原有数组合并
        const newFiles = { ...files, ...flattenArr(importFilesArr)}
        // 更新state和store
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if(importFilesArr.length) {
          dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`
          })
        }
      }
    })
  }

  const fileSearch = (keyword) => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }

  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if (message.status === 'download-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true}
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }

  const filesUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime()
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime,
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  useIpcRenderer({
    'create-new-file': createNewFile,
    'search-file': fileSearch,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-upload': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'file-uploaded': filesUploaded,
    'loading-status': ( message, status ) => { setLoadingStatus(status) }
  })

  return (
    <div className="App container-fluid px-0">
      
      {/* 当用户选择了全局云同步后呈现 */}
      { isLoading && <Loader/>}
      <div className='row g-0'>
        <div className='col-3 bg-light left-panel'>
          <FileSearch 
            title='My document'
            onFileSearch={ fileSearch }
          />
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onSaveEdit={updateFileName}
            onFileDelete={deleteFile}
          />
          <div className="button-group">
            <div className="d-flex gap-0">
                <BottomBtn 
                  text="新建"
                  colorClass="btn-primary"
                  icon={faPlus}
                  onBtnClick={createNewFile}
                />
                <BottomBtn 
                  text="导入"
                  colorClass="btn-success"
                  icon={faFileImport}
                  onBtnClick={importFiles}
                />
            </div>
          </div>
        </div>
        <div className='col-9 left-panel'>
          { !activeFile &&
            <div className="start-page">
              选择或者创建新的Markdown文档
            </div>
          }
          { activeFile &&
            <div>
               <TabList
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsaveFileIDs}
                onTabClick={tabClick}
                onCloseTab={closeTab}
              />
              <SimpleMdeReact  
                key={activeFile && activeFile.id} 
                value={activeFile && activeFile.body}
                onChange={(value) => {fileChange(activeFile.id, value)}}
                options={{
                  minHeight: '485px',
                  autofocus: true
                }}
              />
              {/* 判断有无同步，同步则显示上一次同步时间 */}
              { activeFile.isSynced && 
                <span className="sync-status">已同步，上次同步{timestampToString(activeFile.updatedAt)}</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
