import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faMarkdown } from "@fortawesome/free-brands-svg-icons";
import PropTypes from 'prop-types';
import useKeyPress from "../hooks/useKeyPress";
import useContextMenu from '../hooks/useContextMenu';
import { getParentNode } from '../utils/helper'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [ editStatus, setEditStatus ] = useState(false)
    const [ value, setValue ] = useState('')
    let node = useRef(null)
    const clearSearch = (editItem) => {
        setEditStatus(false)
        setValue('')
        // 如果正在创建一个新文件，当按下ESC键时删除文件
        if(editItem.isNew){
            onFileDelete(editItem.id)
        }
    }
    const clickedItem = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                  onFileClick(parentElement.dataset.id)
                }
            }
          },
          {
            label: '重命名',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                const { id, title } = parentElement.dataset
                setEditStatus(id)
                setValue(title)
        }
            }
          },
          {
            label: '删除',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                  onFileDelete(parentElement.dataset.id)
                }
            }
          },
    ], 'file-list', [files])
    
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    // 敲击键盘响应事件
    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if(enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
            setValue('')
        } 
        if(escPressed && editStatus) {
            clearSearch(editItem)
        }
    })
    // 当创建文件时，将正在编辑文件的ID传入
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if(newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])

    // useEffect(() => {
    //     if (editStatus) {
    //       node.current.focus()
    //     }
    //   }, [editStatus])
    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item bg-light file-item row d-flex align-item-center mx-0"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                    >
                        {
                            ((editStatus !== file.id) && !file.isNew) &&
                            <>
                                <span className="col-2">
                                    <FontAwesomeIcon size='lg' icon={faMarkdown} />
                                </span>
                                <span 
                                 className="col-10"
                                 onClick={() =>{onFileClick(file.id)}}
                                >
                                    {file.title}
                                </span>
                            </>
                        }
                        {
                            ((editStatus === file.id) || file.isNew) && 
                            <div className="d-flex justify-content-between align-items-center">
                                <input
                                 className="form-control"
                                 value = { value }
                                
                                 onChange={(e) => { setValue(e.target.value) }}
                                />
                                <button 
                                 type='button'
                                 placeholder="请输入文件名称"
                                 className="icon-button"
                                 onClick={()=>{clearSearch(file)}}
                                >
                                    <FontAwesomeIcon title='关闭' size='lg' icon={faTimes} />
                                </button>
                            </div>
                        }
                        
                    </li>
                ))
            }
        </ul>
    )
}

// 检验数据类型
FileList.prototype = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onSaveEdit: PropTypes.func,
    onFileDelete: PropTypes.func
}
export default FileList