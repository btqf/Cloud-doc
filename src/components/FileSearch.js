import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from "../hooks/useKeyPress";

const FileSearch = function({ title, onFileSearch }) {
    const [ inputActive, setInputActive ] = useState(false)
    const [ value, setValue ] = useState('')
    // 当键盘按下esc键 或者 点击关闭按钮时，调用该方法
    const clearSearch = () => {
        setInputActive(false)
        setValue('')
        onFileSearch('')    // 为了搜索关闭后，显示全部文件
    }
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    let node = useRef(null)
    // 敲击键盘响应事件
    useEffect(() => {
        if(enterPressed && inputActive) {
            onFileSearch(value)
        }
        if(escPressed && inputActive) {
            clearSearch()
        }
    })
    // 搜索输入内容
    useEffect(() => {
        if(inputActive) {
             // `current` 指向已挂载到 DOM 上的文本输入元素
            node.current.focus()
        }
    }, [inputActive])
    return (
        <div className="alert alert-primary container mb-0">
            {
                !inputActive && 
                <div className="d-flex justify-content-between align-items-center">
                    <span>{title}</span>
                    <button 
                     type='button'
                     className="icon-button"
                     onClick={() => { setInputActive(true) }}
                     >
                        <FontAwesomeIcon title='搜索' icon={faSearch} />
                     </button>
                </div>
            }
            {
                inputActive && 
                <div className="d-flex justify-content-between align-items-center">
                    <input
                     className="form-control"
                     value = { value }
                     ref = {node}
                     onChange={(e) => { setValue(e.target.value) }}
                    />
                    <button 
                     type='button'
                     className="icon-button"
                     onClick={() => { clearSearch() }}
                     >
                         <FontAwesomeIcon title='关闭' size='lg' icon={faTimes} />
                     </button>
                </div>
            }
        </div>
    )
}

// 检查数据类型
FileSearch.prototype = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired
}
// 默认输出
FileSearch.defaultProps = {
    title: '我的云文档'
}
export default FileSearch