import { useEffect, useRef } from 'react'
const { Menu, MenuItem, getCurrentWindow } = window.require('@electron/remote')

const useContextMenu = (itemArr, targetSelector, deps) => {
  let clickedElement = useRef(null)
  useEffect(() => {
    const menu = new Menu()
    itemArr.forEach(item => {
      menu.append(new MenuItem(item))
    })
    const handleContextMenu = (e) => {
      // 通过dom和targetSelector确定区域
    //   if (document.querySelector(targetSelector).contains(e.target)) {
        clickedElement.current = e.target
        menu.popup({ window: getCurrentWindow() })
    //   }
    }
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, deps)
  return clickedElement
}

export default useContextMenu