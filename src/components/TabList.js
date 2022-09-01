import React from 'react'
import PropTypes from 'prop-types'
import className from 'classnames' 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './TabList.scss'

const TabList = ( { files, activeId, unsaveIds, onTabClick, onCloseTab}) => {
    return (
        <ul className='nav nav-pills tablist-component'>
            {
                files.map( file => {
                    // 解决tab保存状态显示问题
                    const withUnsavedMark = unsaveIds.includes(file.id)
                    {/* 用classnames解决tab激活状态显示问题 */}
                    const fClassname = className({
                        'nav-link': true,
                        'active': file.id === activeId,
                        'withUnsaved': withUnsavedMark
                    })           
                    return (
                        <li className='nav-item' key={file.id}>
                            <a
                             href='#'
                             className={fClassname}
                             onClick={(e) => { e.preventDefault(); onTabClick(file.id)}}
                            >
                                {file.title}
                                <span 
                                 className='ms-2 close-icon'
                                 onClick={(e) => {e.stopPropagation(); onCloseTab(file.id)}}
                                 >
                                    <FontAwesomeIcon icon={faTimes} />
                                </span>
                                { withUnsavedMark && <span className='rounded-circle ms-2 unsaved-icon'></span>}
                            </a>
                        </li>
                    )
                    
                })
            }
        </ul>
    )
}

TabList.prototype = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unsaveIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func
}

TabList.defaultProps = {
    unsaveIds: []
}
export default TabList